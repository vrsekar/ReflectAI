import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import { UserInteraction, ConversationTurn } from '../types';
import {
  Sparkles,
  BookOpen,
  Brain,
  MessageSquare,
  Send,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
  Copy,
  Check,
  MapPin,
  Share2,
} from 'lucide-react';
import { LocationPreviewMap } from './LocationPreviewMap';
import { LinkedInShareModal } from './LinkedInShareModal';

interface ActiveConversationProps {
  interaction: UserInteraction;
  onAddTurn: (userTurnText: string) => Promise<void>;
  isSubmittingTurn: boolean;
  error: string | null;
  onRetry: () => void;
}

const QUICK_ACTIONS = [
  'Can you suggest 3 actionable experiments based on this?',
  'What blind spots or cognitive biases might I have overlooked?',
  'Summarize the core realization in one powerful sentence.',
  'Brainstorm alternative ways to look at this dilemma.',
];

export const ActiveConversation: React.FC<ActiveConversationProps> = ({
  interaction,
  onAddTurn,
  isSubmittingTurn,
  error,
  onRetry,
}) => {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLinkedInModalOpen, setIsLinkedInModalOpen] = useState(false);
  const turnsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    turnsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interaction.turns?.length, isSubmittingTurn]);

  const handleSendTurn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSubmittingTurn) return;
    const textToSend = inputText.trim();
    await onAddTurn(textToSend);
    setInputText('');
  };

  const handleQuickAction = async (actionText: string) => {
    if (isSubmittingTurn) return;
    await onAddTurn(actionText);
  };

  const handleCopyEntry = () => {
    const fullText = `Title: ${interaction.title}\nDate: ${interaction.createdAt}\n\nReflection:\n${interaction.prompt}\n\nGemini Insights:\n${interaction.response}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Session Title & Metadata Bar */}
      <div className="border-b border-stone-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="capitalize px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700 border border-stone-200">
              {interaction.mode}
            </span>
            <span className="text-xs text-stone-400 flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(interaction.createdAt)}</span>
            </span>
            {interaction.location && (
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-medium flex items-center space-x-1">
                <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                <span className="truncate max-w-[200px]">{interaction.location.name}</span>
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif text-stone-900 leading-tight">
            {interaction.title || 'Untitled Reflection'}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="share-to-linkedin-header-btn"
            onClick={() => setIsLinkedInModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-[#0a66c2]/30 bg-[#0a66c2]/5 text-xs font-medium text-[#0a66c2] hover:bg-[#0a66c2]/10 transition-colors cursor-pointer shadow-2xs"
            title="Share this reflection and Gemini AI insights to LinkedIn"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share to LinkedIn</span>
          </button>

          <button
            onClick={handleCopyEntry}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Copy entry and insights"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-stone-500" />
                <span>Copy Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Reflection Exchange */}
      <div className="space-y-6">
        {/* User Journal Entry */}
        <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <div className="flex items-center space-x-2 font-medium text-stone-800">
              <div className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-700">
                <User className="h-3.5 w-3.5" />
              </div>
              <span>Your Journal Entry</span>
            </div>
            <span className="text-[11px] text-stone-400">Original Prompt</span>
          </div>
          <div className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed font-sans">
            {interaction.prompt}
          </div>

          {/* Render Location Preview Map if entry has pinned location */}
          {interaction.location && (
            <div className="pt-2">
              <LocationPreviewMap location={interaction.location} />
            </div>
          )}
        </div>

        {/* Gemini AI Initial Reflection */}
        <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 font-medium text-stone-900">
              <div className="h-6 w-6 rounded-full bg-stone-900 flex items-center justify-center text-amber-300">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <span>Gemini Reflection</span>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded bg-stone-200/80 text-stone-700 font-mono">
              gemini-3.6-flash
            </span>
          </div>
          <div className="markdown-body text-sm text-stone-800 leading-relaxed space-y-3">
            <Markdown>{interaction.response}</Markdown>
          </div>
        </div>

        {/* Subsequent Turns */}
        {interaction.turns && interaction.turns.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-stone-200">
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-stone-400">
              <MessageSquare className="h-3.5 w-3.5 text-stone-500" />
              <span>Continued Reflection Dialogue</span>
            </div>

            {interaction.turns.map((turn: ConversationTurn, index: number) => {
              const isUser = turn.role === 'user';
              return (
                <div
                  key={index}
                  className={`p-4 rounded-2xl text-sm leading-relaxed border shadow-xs ${
                    isUser
                      ? 'bg-white border-stone-200 ml-6 text-stone-800'
                      : 'bg-stone-50 border-stone-200/90 mr-6 text-stone-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
                    <span className="font-semibold text-stone-700 flex items-center space-x-1.5">
                      {isUser ? (
                        <>
                          <User className="h-3.5 w-3.5" />
                          <span>You</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                          <span>Gemini</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px]">{formatDate(turn.timestamp)}</span>
                  </div>
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{turn.content}</p>
                  ) : (
                    <div className="markdown-body space-y-2">
                      <Markdown>{turn.content}</Markdown>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div ref={turnsEndRef} />
      </div>

      {/* Error notification banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center justify-between gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <p className="text-xs">{error}</p>
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Quick Inquiries */}
      <div className="space-y-2 pt-2">
        <span className="text-xs font-medium text-stone-500">Quick inquiries to explore deeper:</span>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action, idx) => (
            <button
              key={idx}
              type="button"
              disabled={isSubmittingTurn}
              onClick={() => handleQuickAction(action)}
              className="text-xs px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200 cursor-pointer disabled:opacity-50"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Multi-turn Dialogue Input */}
      <form onSubmit={handleSendTurn} className="space-y-3 pt-2">
        <div className="relative">
          <textarea
            rows={3}
            placeholder="Ask a follow-up, provide more context, or challenge this reflection..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isSubmittingTurn}
            className="w-full p-4 pr-14 text-sm rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white leading-relaxed resize-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSubmittingTurn}
            className="absolute right-3 bottom-3 p-2.5 rounded-xl bg-stone-900 text-white hover:bg-stone-800 active:bg-stone-950 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs"
            title="Send follow-up"
          >
            {isSubmittingTurn ? (
              <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
            ) : (
              <Send className="h-4 w-4 text-amber-300" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between text-xs text-stone-400 px-1">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Updates saved directly to Firestore</span>
          </span>
          <span>Press Send to continue the thread</span>
        </div>
      </form>

      {/* LinkedIn Share Modal */}
      <LinkedInShareModal
        isOpen={isLinkedInModalOpen}
        onClose={() => setIsLinkedInModalOpen(false)}
        interaction={interaction}
      />
    </div>
  );
};
