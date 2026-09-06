import React from 'react';
import { ShieldCheck, X, Key, Database, Lock, Server } from 'lucide-react';
import { User } from 'firebase/auth';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-stone-200">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">Zero-Trust Security & Data Isolation</h2>
              <p className="text-xs text-stone-500">Cloud Firestore ABAC & Server-Side Secret Management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Auth Context */}
        <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700">Authenticated Identity (request.auth.uid)</span>
            <span className="font-mono bg-stone-200 px-2 py-0.5 rounded text-stone-800">
              {user?.uid ? user.uid : 'Not Signed In'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-700">Isolated Storage Boundary</span>
            <span className="font-mono text-stone-600">
              /users/{user?.uid ? user.uid : '{userId}'}/interactions/*
            </span>
          </div>
        </div>

        {/* Security Rules Breakdown */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-stone-900 flex items-center space-x-2">
            <Database className="h-4 w-4 text-indigo-600" />
            <span>Deployed Firestore Security Rules</span>
          </h3>
          <div className="p-3.5 rounded-xl bg-stone-900 text-stone-200 font-mono text-xs overflow-x-auto">
            <pre className="text-[11px] leading-relaxed">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global default-deny safety net
    match /{document=**} {
      allow read, write: if false;
    }

    // Isolated user interactions (reflections, journal entries, conversations)
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`}
            </pre>
          </div>
        </div>

        {/* Threat Model Mitigation Matrix */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-stone-900 flex items-center space-x-2">
            <Server className="h-4 w-4 text-emerald-600" />
            <span>5-Zone Threat Defense Architecture</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg border border-stone-200 bg-white">
              <div className="flex items-center space-x-1.5 font-medium text-stone-800 mb-1">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Memory & State Isolation</span>
              </div>
              <p className="text-stone-500">Owner-bound Firestore path validation ensures User A cannot query or mutate User B's entries.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-white">
              <div className="flex items-center space-x-1.5 font-medium text-stone-800 mb-1">
                <Key className="h-3.5 w-3.5 text-amber-600" />
                <span>Server-Side Secret Isolation</span>
              </div>
              <p className="text-stone-500">Gemini & Maps API keys remain strictly in server environment memory. No client-side exposure.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-white sm:col-span-2">
              <div className="flex items-center space-x-1.5 font-medium text-stone-800 mb-1">
                <Server className="h-3.5 w-3.5 text-sky-600" />
                <span>Google Maps API Security & Pattern A Architecture</span>
              </div>
              <p className="text-stone-500">All geocoding and location queries route through server-side proxies (`/api/maps/*`) with essential-field filtering, 24-hour in-memory TTL caching, and zero client-side credential exposure.</p>
            </div>
            <div className="p-3 rounded-lg border border-stone-200 bg-white sm:col-span-2">
              <div className="flex items-center space-x-1.5 font-medium text-stone-800 mb-1">
                <ShieldCheck className="h-3.5 w-3.5 text-[#0a66c2]" />
                <span>LinkedIn Integration & OAuth 2.0 Security Architecture</span>
              </div>
              <p className="text-stone-500">Server-side OAuth 2.0 authorization code exchange with cryptographic state verification, HTTP-Only SameSite/Secure cookies for AI Studio iframe compatibility, minimal scopes (<code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">w_member_social</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">openid</code>, <code className="bg-stone-100 px-1 py-0.5 rounded text-stone-700">profile</code>), and exponential backoff retry for rate limiting.</p>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-medium hover:bg-stone-800 transition-colors"
          >
            Close Security Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
