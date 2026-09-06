import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Shield, Brain, BookOpen, MessageSquare, ArrowRight, CheckCircle2 } from 'lucide-react';

interface LandingHeroProps {
  onSignIn: () => void;
  isLoading: boolean;
  error?: string | null;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onSignIn, isLoading, error }) => {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center px-4 py-12 sm:px-6 lg:px-8 bg-stone-50">
      <div className="max-w-3xl w-full text-center space-y-8">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-stone-200/80 text-stone-800 text-xs font-medium"
        >
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span>Powered by Gemini 3.6 Flash & Cloud Firestore</span>
        </motion.div>

        {/* Heading & Subtitle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          <h1 className="text-4xl sm:text-5xl font-serif text-stone-900 tracking-tight leading-tight">
            A private sanctuary for your thoughts and cognitive reflections.
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Write uninhibited journal reflections and converse with Gemini to synthesize themes, brainstorm breakthroughs, and gain deeper clarity.
          </p>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm text-left max-w-md mx-auto">
            <p className="font-semibold">Authentication Notice</p>
            <p className="mt-1 text-xs">{error}</p>
          </div>
        )}

        {/* Sign In CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2"
        >
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-3 px-8 py-4 rounded-xl bg-stone-900 text-white hover:bg-stone-800 active:bg-stone-950 font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-60 cursor-pointer text-base"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
                <ArrowRight className="h-4 w-4 ml-1 text-stone-400" />
              </>
            )}
          </button>
        </motion.div>

        {/* Value Props Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 text-left">
          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <Shield className="h-5 w-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base">User-Isolated Storage</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Every journal entry is saved to your isolated Firestore path. Zero-trust security rules mathematically prevent cross-user document access.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <Brain className="h-5 w-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base">Multi-Turn Cognitive AI</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Engage in multi-turn dialogues with Gemini 3.6 Flash to unpack dilemmas, explore root causes, or brainstorm creative perspectives.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-lg bg-stone-100 flex items-center justify-center text-stone-700">
              <BookOpen className="h-5 w-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-stone-900 text-base">Full Reflection History</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Revisit past sessions at any time. Search, review summaries, and observe your personal evolution across time.
            </p>
          </div>
        </div>

        {/* Security & Privacy Guarantee */}
        <div className="pt-4 border-t border-stone-200 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-500">
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Google Sign-In Authentication</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Encrypted at rest in Cloud Firestore</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            <span>Server-side Secret Management</span>
          </div>
        </div>
      </div>
    </div>
  );
};
