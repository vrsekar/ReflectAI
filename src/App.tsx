import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, testConnection } from './lib/firebase';
import {
  saveInteraction,
  subscribeToUserInteractions,
  deleteInteraction,
} from './lib/firestoreService';
import { UserInteraction, ReflectionMode, ConversationTurn, JournalLocation } from './types';
import { Navbar } from './components/Navbar';
import { LandingHero } from './components/LandingHero';
import { HistorySidebar } from './components/HistorySidebar';
import { JournalEditor } from './components/JournalEditor';
import { ActiveConversation } from './components/ActiveConversation';
import { SecurityModal } from './components/SecurityModal';
import { Menu, Plus, Sparkles, ShieldCheck } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [interactions, setInteractions] = useState<UserInteraction[]>([]);
  const [selectedInteraction, setSelectedInteraction] = useState<UserInteraction | null>(null);

  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedDraft, setLastFailedDraft] = useState<{
    title: string;
    prompt: string;
    mode: ReflectionMode;
    location?: JournalLocation | null;
  } | null>(null);

  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize and observe Firebase Authentication state
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
      },
      (err) => {
        console.error('Auth state change error:', err);
        setAuthError(err.message);
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Subscribe to Cloud Firestore user-isolated interactions
  useEffect(() => {
    if (!user) {
      setInteractions([]);
      setSelectedInteraction(null);
      return;
    }

    const unsubscribe = subscribeToUserInteractions(
      user.uid,
      (data) => {
        setInteractions(data);
        // If an interaction is currently selected, keep its reference updated
        if (selectedInteraction) {
          const updated = data.find((item) => item.id === selectedInteraction.id);
          if (updated) {
            setSelectedInteraction(updated);
          }
        }
      },
      (err) => {
        console.error('Firestore subscription error:', err);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setAuthError(err?.message || 'Failed to sign in with Google.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setSelectedInteraction(null);
    } catch (err: any) {
      console.error('Error signing out:', err);
    }
  };

  // Submit new journal reflection to server-side Gemini API & persist to Firestore
  const handleCreateInteraction = async (
    title: string,
    prompt: string,
    mode: ReflectionMode,
    location?: JournalLocation | null
  ) => {
    if (!user) {
      setError('You must be signed in to reflect and save entries.');
      return;
    }

    setIsLoadingAI(true);
    setError(null);
    setLastFailedDraft({ title, prompt, mode, location });

    try {
      // Call server-side Express endpoint (protects GEMINI_API_KEY from browser)
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, mode }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errorData.error || `Reflection failed with status ${res.status}`);
      }

      const data = await res.json();
      const nowIso = new Date().toISOString();

      const newInteraction: UserInteraction = {
        id: `entry_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: user.uid,
        title,
        prompt,
        response: data.response || 'No response generated.',
        mode,
        turns: [],
        ...(location ? { location } : {}),
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Strict user-isolated write to Cloud Firestore
      await saveInteraction(user.uid, newInteraction);

      // Successfully saved!
      setLastFailedDraft(null);
      setSelectedInteraction(newInteraction);
    } catch (err: any) {
      console.error('Failed to create reflection:', err);
      setError(err?.message || 'Failed to complete reflection. Your draft is preserved.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Add a multi-turn dialogue follow-up to the active interaction
  const handleAddTurn = async (userTurnText: string) => {
    if (!user || !selectedInteraction) return;

    setIsSubmittingTurn(true);
    setError(null);

    try {
      // Build conversation history array for context
      const history: Array<{ role: string; content: string }> = [
        { role: 'user', content: selectedInteraction.prompt },
        { role: 'model', content: selectedInteraction.response },
      ];

      if (selectedInteraction.turns) {
        for (const t of selectedInteraction.turns) {
          history.push({ role: t.role, content: t.content });
        }
      }

      // Call server-side Express endpoint with conversation context
      const res = await fetch('/api/gemini/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userTurnText,
          mode: 'conversation',
          history,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }));
        throw new Error(errData.error || 'Failed to generate dialogue response.');
      }

      const data = await res.json();
      const nowIso = new Date().toISOString();

      const newTurns: ConversationTurn[] = [
        ...(selectedInteraction.turns || []),
        { role: 'user', content: userTurnText, timestamp: nowIso },
        {
          role: 'model',
          content: data.response || 'No response generated.',
          timestamp: new Date().toISOString(),
        },
      ];

      const updatedInteraction: UserInteraction = {
        ...selectedInteraction,
        turns: newTurns,
        updatedAt: nowIso,
      };

      // Persist turn update to Cloud Firestore
      await saveInteraction(user.uid, updatedInteraction);
      setSelectedInteraction(updatedInteraction);
    } catch (err: any) {
      console.error('Failed to submit dialogue turn:', err);
      setError(err?.message || 'Failed to continue dialogue.');
    } finally {
      setIsSubmittingTurn(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteInteraction(user.uid, id);
      if (selectedInteraction?.id === id) {
        setSelectedInteraction(null);
      }
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      setError('Could not delete entry.');
    }
  };

  // Loading spinner during initial authentication detection
  if (authLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 border-3 border-stone-300 border-t-stone-900 rounded-full animate-spin" />
        <p className="text-sm font-serif text-stone-600">Verifying secure session...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans text-stone-900 antialiased selection:bg-stone-900 selection:text-white">
      <Navbar
        user={user}
        onSignOut={handleSignOut}
        onOpenSecurity={() => setIsSecurityModalOpen(true)}
      />

      {!user ? (
        <LandingHero
          onSignIn={handleSignIn}
          isLoading={authLoading}
          error={authError}
        />
      ) : (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Mobile history sidebar toggle */}
          <div className="md:hidden fixed bottom-4 right-4 z-30">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-3.5 rounded-full bg-stone-900 text-white shadow-lg flex items-center space-x-2 text-xs font-medium cursor-pointer"
            >
              <Menu className="h-5 w-5" />
              <span>History ({interactions.length})</span>
            </button>
          </div>

          {/* History Sidebar */}
          <HistorySidebar
            interactions={interactions}
            selectedId={selectedInteraction?.id || null}
            onSelect={(item) => setSelectedInteraction(item)}
            onNew={() => setSelectedInteraction(null)}
            onDelete={handleDelete}
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
          />

          {/* Backdrop for mobile sidebar */}
          {isMobileSidebarOpen && (
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-30 md:hidden"
            />
          )}

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-stone-50/80">
            {selectedInteraction ? (
              <ActiveConversation
                interaction={selectedInteraction}
                onAddTurn={handleAddTurn}
                isSubmittingTurn={isSubmittingTurn}
                error={error}
                onRetry={() => {
                  setError(null);
                }}
              />
            ) : (
              <JournalEditor
                onSubmit={handleCreateInteraction}
                isLoading={isLoadingAI}
                error={error}
                onRetry={() => {
                  if (lastFailedDraft) {
                    handleCreateInteraction(
                      lastFailedDraft.title,
                      lastFailedDraft.prompt,
                      lastFailedDraft.mode,
                      lastFailedDraft.location
                    );
                  }
                }}
              />
            )}
          </main>
        </div>
      )}

      {/* Security Inspector Modal */}
      <SecurityModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        user={user}
      />
    </div>
  );
}
