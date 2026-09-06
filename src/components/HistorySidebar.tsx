import React, { useState } from 'react';
import { UserInteraction, ReflectionMode } from '../types';
import { Plus, Search, Trash2, Calendar, MessageSquare, BookOpen, Brain, Sparkles, AlertCircle, MapPin } from 'lucide-react';

interface HistorySidebarProps {
  interactions: UserInteraction[];
  selectedId: string | null;
  onSelect: (interaction: UserInteraction) => void;
  onNew: () => void;
  onDelete: (id: string) => Promise<void>;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const HistorySidebar: React.FC<HistorySidebarProps> = ({
  interactions,
  selectedId,
  onSelect,
  onNew,
  onDelete,
  isMobileOpen,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = interactions.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMode = filterMode === 'all' || item.mode === filterMode;
    return matchesSearch && matchesMode;
  });

  const getModeIcon = (mode: ReflectionMode) => {
    switch (mode) {
      case 'summary':
        return <BookOpen className="h-3 w-3 text-amber-600" />;
      case 'brainstorm':
        return <Brain className="h-3 w-3 text-indigo-600" />;
      case 'conversation':
        return <MessageSquare className="h-3 w-3 text-blue-600" />;
      case 'reflection':
      default:
        return <Sparkles className="h-3 w-3 text-emerald-600" />;
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this reflection? This action cannot be undone.')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-stone-200 flex flex-col transition-transform duration-300 ease-in-out
        md:static md:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
    >
      {/* Top action header */}
      <div className="p-4 border-b border-stone-200 space-y-3">
        <button
          onClick={() => {
            onNew();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-colors shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Journal Reflection</span>
        </button>

        {/* Search input */}
        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-400 bg-stone-50/50"
          />
        </div>

        {/* Mode filter chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
          {['all', 'reflection', 'summary', 'brainstorm', 'conversation'].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-2 py-0.5 rounded-full capitalize whitespace-nowrap transition-colors cursor-pointer ${
                filterMode === m
                  ? 'bg-stone-900 text-white font-medium'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Entry List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y-0">
        {filtered.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-stone-400 text-xs">
            <BookOpen className="h-8 w-8 mb-2 text-stone-300" />
            <p className="font-medium text-stone-600">No reflections found</p>
            <p className="mt-1 text-stone-400">
              {searchQuery ? 'Try changing your search query' : 'Start your first journal entry!'}
            </p>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onCloseMobile();
                }}
                className={`group relative p-3 rounded-xl transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-stone-100/90 border-stone-300 shadow-xs'
                    : 'bg-white border-transparent hover:bg-stone-50 hover:border-stone-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-1.5 min-w-0">
                    <span className="p-1 rounded-md bg-stone-100 shrink-0">
                      {getModeIcon(item.mode)}
                    </span>
                    <h4 className="text-xs font-semibold text-stone-800 truncate">
                      {item.title || 'Untitled Reflection'}
                    </h4>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={deletingId === item.id}
                    className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-600 rounded transition-opacity"
                    title="Delete entry"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-stone-500 line-clamp-2 mt-1.5 leading-snug">
                  {item.prompt}
                </p>

                {item.location && (
                  <div className="mt-1.5 flex items-center space-x-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-medium w-fit max-w-full">
                    <MapPin className="h-3 w-3 shrink-0 text-emerald-600" />
                    <span className="truncate">{item.location.name || 'Pinned Location'}</span>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.createdAt)}</span>
                  </span>
                  <span className="capitalize px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-medium">
                    {item.turns?.length ? `${item.turns.length} turns` : item.mode}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-stone-200 bg-stone-50/70 text-[11px] text-stone-500 flex items-center justify-between">
        <span>{interactions.length} {interactions.length === 1 ? 'entry' : 'entries'} saved</span>
        <span className="text-emerald-700 font-medium flex items-center space-x-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Firestore Synced</span>
        </span>
      </div>
    </aside>
  );
};
