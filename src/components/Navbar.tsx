import React from 'react';
import { User } from 'firebase/auth';
import { Sparkles, LogOut, ShieldCheck, Lock, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  onSignOut: () => void;
  onOpenSecurity: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onSignOut, onOpenSecurity }) => {
  return (
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-stone-900 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-stone-900 tracking-tight text-lg">ReflectAI</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium border border-stone-200">
                Gemini 3.6 Flash
              </span>
            </div>
            <p className="text-xs text-stone-500 hidden sm:block">Private Journaling & Cognitive Reflection</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenSecurity}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors border border-stone-200"
            title="View Security & Privacy Architecture"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="hidden sm:inline">Zero-Trust Rules</span>
          </button>

          {user ? (
            <div className="flex items-center space-x-3 pl-2 border-l border-stone-200">
              <div className="flex items-center space-x-2">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="h-8 w-8 rounded-full border border-stone-300 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center text-stone-600">
                    <UserIcon className="h-4 w-4" />
                  </div>
                )}
                <div className="hidden md:block text-left text-xs leading-tight">
                  <p className="font-medium text-stone-800 truncate max-w-[140px]">{user.displayName || 'User'}</p>
                  <p className="text-stone-400 truncate max-w-[140px]">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-stone-200"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-stone-500">
              <Lock className="h-3.5 w-3.5 text-stone-400" />
              <span>User Isolated</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
