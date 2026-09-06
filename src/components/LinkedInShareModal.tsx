import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Share2,
  Check,
  Copy,
  ExternalLink,
  Sparkles,
  MapPin,
  UserCheck,
  LogOut,
  Send,
  AlertCircle,
  X,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { UserInteraction, LinkedInProfile, LinkedInStatus } from '../types';

interface LinkedInShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  interaction: UserInteraction;
}

export function LinkedInShareModal({
  isOpen,
  onClose,
  interaction,
}: LinkedInShareModalProps) {
  const [status, setStatus] = useState<LinkedInStatus>({
    isConnected: false,
    profile: null,
    configured: false,
  });
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Content formatting options
  const [includePrompt, setIncludePrompt] = useState(true);
  const [includeAIInsights, setIncludeAIInsights] = useState(true);
  const [includeLocation, setIncludeLocation] = useState(Boolean(interaction.location));
  const [includeHashtags, setIncludeHashtags] = useState(true);

  // Editable commentary
  const [customCommentary, setCustomCommentary] = useState('');

  // Fetch LinkedIn status on modal open
  const fetchStatus = async () => {
    try {
      setIsLoadingStatus(true);
      const res = await fetch('/api/linkedin/status');
      if (res.ok) {
        const data: LinkedInStatus = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch LinkedIn status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setPublishSuccess(null);
      setError(null);
    }
  }, [isOpen]);

  // Generate initial formatted post text
  useEffect(() => {
    let post = `✨ ${interaction.title || 'Reflections on Continuous Growth'}\n\n`;

    if (includePrompt) {
      post += `💭 Core Reflection:\n"${interaction.prompt.trim()}"\n\n`;
    }

    if (includeAIInsights && interaction.response) {
      // Create a clean takeaway snippet from the AI response
      const cleanResponse = interaction.response
        .replace(/^[#*-\s]+/gm, '')
        .split('\n')
        .filter((l) => l.trim().length > 10)
        .slice(0, 3)
        .join('\n• ');

      post += `💡 Key Insights & Takeaways (via Gemini AI):\n• ${cleanResponse}\n\n`;
    }

    if (includeLocation && interaction.location) {
      const locText = interaction.location.name || interaction.location.address || `${interaction.location.latitude.toFixed(3)}, ${interaction.location.longitude.toFixed(3)}`;
      post += `📍 Pinned Location: ${locText}\n\n`;
    }

    if (includeHashtags) {
      post += `#Reflection #ContinuousLearning #GrowthMindset #Leadership #MindfulTech #GeminiAI`;
    }

    setCustomCommentary(post.trim());
  }, [isOpen, includePrompt, includeAIInsights, includeLocation, includeHashtags, interaction]);

  // Listen for OAuth postMessage
  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LINKEDIN_AUTH_SUCCESS') {
        setIsConnecting(false);
        setError(null);
        if (event.data.profile) {
          setStatus({
            isConnected: true,
            profile: event.data.profile as LinkedInProfile,
            configured: true,
          });
        } else {
          fetchStatus();
        }
      } else if (event.data?.type === 'LINKEDIN_AUTH_ERROR') {
        setIsConnecting(false);
        setError(event.data.error || 'LinkedIn authentication failed.');
      }
    };

    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, []);

  // Connect LinkedIn account via popup (Pattern A/OAuth compliant)
  const handleConnectLinkedIn = async () => {
    try {
      setIsConnecting(true);
      setError(null);

      const res = await fetch('/api/linkedin/auth-url');
      const data = await res.json();

      if (!data.configured || !data.url) {
        setError(
          data.error ||
            'LinkedIn OAuth credentials are not configured on the server. You can still copy the formatted post or use Web Share!'
        );
        setIsConnecting(false);
        return;
      }

      // Open OAuth provider directly in popup window
      const popup = window.open(
        data.url,
        'linkedin_oauth',
        'width=600,height=700,status=no,resizable=yes'
      );

      if (!popup) {
        setError('Popup blocked by browser. Please allow popups for this site to connect LinkedIn.');
        setIsConnecting(false);
      }
    } catch (err: any) {
      console.error('LinkedIn connect error:', err);
      setError('Failed to initiate LinkedIn authorization flow.');
      setIsConnecting(false);
    }
  };

  // Disconnect LinkedIn
  const handleDisconnect = async () => {
    try {
      await fetch('/api/linkedin/disconnect', { method: 'POST' });
      setStatus({ isConnected: false, profile: null, configured: status.configured });
      setPublishSuccess(null);
    } catch (err) {
      console.warn('Disconnect error:', err);
    }
  };

  // Publish to LinkedIn via API
  const handlePublish = async () => {
    if (!customCommentary.trim()) {
      setError('Please provide content for your LinkedIn post.');
      return;
    }

    try {
      setIsPublishing(true);
      setError(null);

      const res = await fetch('/api/linkedin/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commentary: customCommentary,
          title: interaction.title,
          prompt: interaction.prompt,
          response: interaction.response,
          location: interaction.location,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish post to LinkedIn.');
      }

      setPublishSuccess(data.postUrl || 'https://www.linkedin.com/feed/');
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err?.message || 'Failed to publish to LinkedIn.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(customCommentary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Copy failed:', err);
    }
  };

  // Open LinkedIn share intent in new tab
  const handleOpenLinkedInIntent = () => {
    const encodedText = encodeURIComponent(customCommentary);
    const intentUrl = `https://www.linkedin.com/sharing/share-offsite/?text=${encodedText}`;
    window.open(intentUrl, '_blank', 'noopener,noreferrer');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#0a66c2] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                in
              </div>
              <div>
                <h3 className="text-lg font-serif font-semibold text-stone-900">
                  Share Reflection on LinkedIn
                </h3>
                <p className="text-xs text-stone-500 font-sans">
                  Publish professional reflections and Gemini AI insights
                </p>
              </div>
            </div>
            <button
              id="close-linkedin-modal-btn"
              onClick={onClose}
              className="text-stone-400 hover:text-stone-600 p-1.5 rounded-lg hover:bg-stone-200/60 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 font-sans text-stone-800">
            {/* Connection Status Banner */}
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
              <div className="flex items-center space-x-3">
                {isLoadingStatus ? (
                  <div className="flex items-center space-x-2 text-stone-500 text-xs">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Checking LinkedIn connection...</span>
                  </div>
                ) : status.isConnected && status.profile ? (
                  <div className="flex items-center space-x-2.5">
                    {status.profile.picture ? (
                      <img
                        src={status.profile.picture}
                        alt={status.profile.name}
                        className="w-7 h-7 rounded-full border border-stone-300 object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#0a66c2]/15 text-[#0a66c2] flex items-center justify-center text-xs font-semibold">
                        <UserCheck className="h-4 w-4" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-medium text-stone-900 text-xs sm:text-sm">
                          {status.profile.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-medium border border-emerald-200">
                          Connected
                        </span>
                      </div>
                      {status.profile.email && (
                        <span className="text-[11px] text-stone-500">
                          {status.profile.email}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="text-xs text-stone-600">
                      {status.configured
                        ? 'LinkedIn account not yet linked'
                        : 'OAuth credentials not yet configured in server environment'}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                {status.isConnected ? (
                  <button
                    id="linkedin-disconnect-btn"
                    onClick={handleDisconnect}
                    className="text-xs text-stone-500 hover:text-rose-600 flex items-center space-x-1 px-2.5 py-1 rounded-md border border-stone-200 bg-white hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-3 w-3" />
                    <span>Disconnect</span>
                  </button>
                ) : (
                  <button
                    id="linkedin-connect-btn"
                    onClick={handleConnectLinkedIn}
                    disabled={isConnecting}
                    className="text-xs font-medium text-white bg-[#0a66c2] hover:bg-[#084e96] flex items-center space-x-1.5 px-3 py-1.5 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Share2 className="h-3.5 w-3.5" />
                    )}
                    <span>{isConnecting ? 'Connecting...' : 'Connect Account'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  {error}
                </div>
              </div>
            )}

            {/* Success Banner */}
            {publishSuccess && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm flex items-start justify-between gap-3">
                <div className="flex items-start space-x-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-emerald-950">Successfully Published to LinkedIn!</h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Your journal reflection and Gemini takeaways are now live on your LinkedIn feed.
                    </p>
                  </div>
                </div>
                <a
                  href={publishSuccess}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors shrink-0"
                >
                  <span>View Post</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* Content Toggles */}
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase tracking-wider text-stone-500">
                Include Elements
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setIncludePrompt(!includePrompt)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    includePrompt
                      ? 'border-[#0a66c2] bg-[#0a66c2]/5 text-[#0a66c2] font-medium'
                      : 'border-stone-200 text-stone-500 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span>My Reflection</span>
                  {includePrompt && <Check className="h-3 w-3 text-[#0a66c2]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeAIInsights(!includeAIInsights)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    includeAIInsights
                      ? 'border-[#0a66c2] bg-[#0a66c2]/5 text-[#0a66c2] font-medium'
                      : 'border-stone-200 text-stone-500 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span className="flex items-center space-x-1">
                    <Sparkles className="h-3 w-3" />
                    <span>AI Insights</span>
                  </span>
                  {includeAIInsights && <Check className="h-3 w-3 text-[#0a66c2]" />}
                </button>

                <button
                  type="button"
                  disabled={!interaction.location}
                  onClick={() => setIncludeLocation(!includeLocation)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    !interaction.location
                      ? 'opacity-40 cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400'
                      : includeLocation
                      ? 'border-[#0a66c2] bg-[#0a66c2]/5 text-[#0a66c2] font-medium'
                      : 'border-stone-200 text-stone-500 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span className="flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>Location</span>
                  </span>
                  {includeLocation && <Check className="h-3 w-3 text-[#0a66c2]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIncludeHashtags(!includeHashtags)}
                  className={`p-2.5 rounded-lg border text-left flex items-center justify-between transition-colors ${
                    includeHashtags
                      ? 'border-[#0a66c2] bg-[#0a66c2]/5 text-[#0a66c2] font-medium'
                      : 'border-stone-200 text-stone-500 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span>Hashtags</span>
                  {includeHashtags && <Check className="h-3 w-3 text-[#0a66c2]" />}
                </button>
              </div>
            </div>

            {/* Editable Post Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="linkedin-post-textarea"
                  className="text-xs font-medium uppercase tracking-wider text-stone-500 flex items-center space-x-1.5"
                >
                  <span>Post Content (Editable)</span>
                  <span className="text-[10px] lowercase text-stone-400 font-normal">
                    ({customCommentary.length} / 3000 chars)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs text-stone-600 hover:text-stone-900 flex items-center space-x-1 font-medium transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                id="linkedin-post-textarea"
                rows={7}
                value={customCommentary}
                onChange={(e) => setCustomCommentary(e.target.value)}
                className="w-full text-xs sm:text-sm font-sans text-stone-800 p-3.5 rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-[#0a66c2]/30 focus:border-[#0a66c2] bg-white leading-relaxed resize-y"
                placeholder="Write your LinkedIn reflection post..."
              />
            </div>

            {/* Security note */}
            <div className="flex items-center space-x-2 text-[11px] text-stone-400 bg-stone-50 p-2.5 rounded-lg border border-stone-200/70">
              <ShieldCheck className="h-3.5 w-3.5 text-stone-500 shrink-0" />
              <span>
                Tokens and client credentials are isolated server-side. Minimal OAuth scopes used ({' '}
                <code>w_member_social</code>, <code>openid</code>, <code>profile</code>).
              </span>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              id="linkedin-share-web-intent-btn"
              type="button"
              onClick={handleOpenLinkedInIntent}
              className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-stone-500" />
              <span>Share on LinkedIn Web</span>
            </button>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-stone-600 hover:bg-stone-200/70 transition-colors"
              >
                Close
              </button>

              {status.isConnected ? (
                <button
                  id="linkedin-direct-publish-btn"
                  type="button"
                  disabled={isPublishing || !customCommentary.trim()}
                  onClick={handlePublish}
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-[#0a66c2] hover:bg-[#084e96] shadow-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Publish to LinkedIn</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  id="linkedin-connect-publish-btn"
                  type="button"
                  onClick={handleConnectLinkedIn}
                  disabled={isConnecting}
                  className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-[#0a66c2] hover:bg-[#084e96] shadow-sm flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  {isConnecting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5" />
                  )}
                  <span>Connect & Publish</span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
