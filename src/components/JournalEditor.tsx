import React, { useState } from 'react';
import { ReflectionMode, JournalLocation } from '../types';
import { Sparkles, BookOpen, Brain, MessageSquare, Send, RefreshCw, AlertTriangle, Lightbulb } from 'lucide-react';
import { LocationPicker } from './LocationPicker';

interface JournalEditorProps {
  onSubmit: (
    title: string,
    prompt: string,
    mode: ReflectionMode,
    location: JournalLocation | null
  ) => Promise<void>;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const STARTER_PROMPTS = [
  'What decision is currently demanding my focus, and what trade-offs am I wrestling with?',
  'Reflect on a recent obstacle: what did it reveal about my core values and instincts?',
  'An idea or curiosity I cannot stop thinking about, and where it might lead...',
  'What unspoken assumptions am I holding about my work or relationships right now?',
];

export const JournalEditor: React.FC<JournalEditorProps> = ({
  onSubmit,
  isLoading,
  error,
  onRetry,
}) => {
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<ReflectionMode>('reflection');
  const [location, setLocation] = useState<JournalLocation | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    // Use user-provided title or generate a fallback from first few words
    const computedTitle = title.trim() || prompt.trim().slice(0, 50) + (prompt.length > 50 ? '...' : '');
    await onSubmit(computedTitle, prompt.trim(), mode, location);
  };

  const handleSelectStarter = (text: string) => {
    if (!prompt.trim()) {
      setPrompt(text);
    } else {
      setPrompt((prev) => `${prev}\n\n${text}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>New Journal Reflection</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif text-stone-900">
          What is occupying your mind today?
        </h2>
        <p className="text-sm text-stone-600">
          Express your uncensored thoughts. Gemini will synthesize, reflect, and assist you in gaining clarity.
        </p>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setMode('reflection')}
          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
            mode === 'reflection'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-200'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-emerald-800 font-semibold text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Deep Reflection</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 leading-tight">Empathetic mirrors, emotional insights & discovery</p>
        </button>

        <button
          type="button"
          onClick={() => setMode('summary')}
          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
            mode === 'summary'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-200'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-amber-800 font-semibold text-xs">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Executive Summary</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 leading-tight">Structured takeaways, core themes & action points</p>
        </button>

        <button
          type="button"
          onClick={() => setMode('brainstorm')}
          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
            mode === 'brainstorm'
              ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-200'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-indigo-800 font-semibold text-xs">
            <Brain className="h-3.5 w-3.5" />
            <span>Brainstorming</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 leading-tight">Divergent angles, alternative reframings & what-ifs</p>
        </button>

        <button
          type="button"
          onClick={() => setMode('conversation')}
          className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
            mode === 'conversation'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-200'
              : 'bg-white border-stone-200 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center space-x-1.5 text-blue-800 font-semibold text-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>Multi-turn Chat</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-1 leading-tight">Continuous thoughtful dialogue on your ideas</p>
        </button>
      </div>

      {/* Starter prompts */}
      <div className="space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-medium text-stone-600">
          <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
          <span>Prompt sparks for reflection:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectStarter(promptText)}
              className="text-left text-xs px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors border border-stone-200/60 cursor-pointer"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Error feedback banner */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start justify-between gap-3 text-sm">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="font-semibold text-red-800">Operation Error</p>
              <p className="text-xs mt-0.5">{error}</p>
              <p className="text-xs text-red-600 mt-1">Your draft has been preserved. Please retry.</p>
            </div>
          </div>
          <button
            onClick={onRetry}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 text-xs font-medium transition-colors shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Save</span>
          </button>
        </div>
      )}

      {/* Editor Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="journal-title" className="block text-xs font-medium text-stone-700 mb-1">
            Session Title (Optional)
          </label>
          <input
            id="journal-title"
            type="text"
            placeholder="e.g., Morning check-in on project direction..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={150}
            className="w-full px-4 py-2 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="journal-content" className="block text-xs font-medium text-stone-700">
              Your Reflection Entry
            </label>
            <span className="text-[11px] text-stone-400">
              {prompt.length} / 10,000 characters
            </span>
          </div>
          <textarea
            id="journal-content"
            rows={8}
            placeholder="Write freely. Describe what happened, how you felt, what decisions you face, or ideas you wish to unpack..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            maxLength={10000}
            required
            className="w-full p-4 text-sm rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-white leading-relaxed resize-y font-sans"
          />
        </div>

        {/* Location Pinning Section */}
        <div className="pt-1">
          <label className="block text-xs font-medium text-stone-700 mb-1">
            Pin Location to Journal Entry (Optional)
          </label>
          <LocationPicker
            location={location}
            onChange={setLocation}
            disabled={isLoading}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-stone-500 flex items-center space-x-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Guaranteed user-isolated save to Cloud Firestore</span>
          </span>

          <button
            type="submit"
            disabled={!prompt.trim() || isLoading}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 active:bg-stone-950 transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-amber-300" />
                <span>Processing with Gemini...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4 text-amber-300" />
                <span>Reflect with Gemini</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
