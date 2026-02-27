import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2, Check, Copy, ChevronDown, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { createShareLink, loadSharedLinks, deleteSharedLink, type SharedLinkInfo } from '../src/lib/bookStorage';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkType: 'category' | 'book';
  target: string;
  title?: string;
  description?: string;
  darkMode: boolean;
}

const EXPIRATION_OPTIONS: { label: string; value: number | null | 'custom' }[] = [
  { label: 'Never', value: null },
  { label: '30 days', value: 30 },
  { label: '15 days', value: 15 },
  { label: '7 days', value: 7 },
  { label: '1 day', value: 1 },
  { label: 'Custom', value: 'custom' },
];

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeRemaining(expiresAt: string): string {
  const now = new Date();
  const exp = new Date(expiresAt);
  const diff = exp.getTime() - now.getTime();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${mins}m left`;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen, onClose, linkType, target, title = 'Share Link', description, darkMode
}) => {
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<number | null | 'custom'>(null);
  const [customDays, setCustomDays] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [existingLinks, setExistingLinks] = useState<SharedLinkInfo[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setExpiresInDays(null);
      setCustomDays('');
      generateLink(null);
      fetchExistingLinks();
    } else {
      setGeneratedUrl('');
      setShowDropdown(false);
      setExistingLinks([]);
    }
  }, [isOpen, linkType, target]);

  useEffect(() => {
    if (expiresInDays === 'custom') {
      const days = parseInt(customDays, 10);
      if (!isNaN(days) && days > 0) {
        const timer = setTimeout(() => {
          generateLink(days);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        setGeneratedUrl('');
      }
    }
  }, [customDays, expiresInDays]);

  const fetchExistingLinks = async () => {
    setLoadingLinks(true);
    try {
      const links = await loadSharedLinks(linkType, target);
      setExistingLinks(links);
    } catch (err) {
      console.error('Failed to load existing links:', err);
    } finally {
      setLoadingLinks(false);
    }
  };

  const generateLink = async (days: number | null) => {
    setIsLoading(true);
    try {
      const token = await createShareLink(linkType, target, days);
      setGeneratedUrl(`${window.location.origin}/share/link/${token}`);
      setTimeout(() => inputRef.current?.select(), 100);
      // Refresh the list after creating
      fetchExistingLinks();
    } catch (err) {
      console.error('Failed to generate link:', err);
      setGeneratedUrl('Error generating link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpirationChange = (val: number | null | 'custom') => {
    setExpiresInDays(val);
    setShowDropdown(false);
    if (val !== 'custom') {
      setCustomDays('');
      generateLink(val);
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      await deleteSharedLink(linkId);
      setExistingLinks(prev => prev.filter(l => l.id !== linkId));
    } catch (err) {
      console.error('Failed to delete link:', err);
    }
  };

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!generatedUrl || isLoading) return;
    try {
      await navigator.clipboard.writeText(generatedUrl);
    } catch {
      inputRef.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyExistingLink = async (token: string) => {
    const url = `${window.location.origin}/share/link/${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
        onClick={onClose}
      />

      <div className={`relative w-full max-w-md max-h-[90vh] rounded-[28px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col ${darkMode
        ? 'bg-[#1c1c20]/95 backdrop-blur-3xl border-white/[0.08] shadow-black/60'
        : 'bg-white border-gray-200 shadow-gray-300/50'
        }`}>

        <div className="flex items-center justify-between px-7 pt-7 pb-1 flex-shrink-0">
          <h3 className={`text-[17px] font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 no-scrollbar">
          <div className="px-7 py-5 space-y-5">
            {/* Expiration Dropdown */}
            <div className="space-y-2 relative">
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                Link expiration
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors ${darkMode
                    ? 'bg-black/40 border-white/[0.08] hover:bg-white/[0.04] text-zinc-200'
                    : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800 shadow-sm'
                    }`}
                >
                  <span className="text-sm">
                    {expiresInDays === 'custom'
                      ? customDays ? `Custom: ${customDays} days` : 'Custom...'
                      : EXPIRATION_OPTIONS.find(o => o.value === expiresInDays)?.label || 'Never'}
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${darkMode ? 'text-zinc-500' : 'text-gray-400'} ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Custom styled dropdown to replicate mockup */}
                {showDropdown && (
                  <div className={`absolute left-0 right-0 top-full mt-2 py-2 rounded-2xl border shadow-xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150 ${darkMode
                    ? 'bg-[#2a2a2d]/95 border-white/[0.08] shadow-black/50'
                    : 'bg-white border-gray-100 shadow-gray-200/50'
                    }`}>
                    {EXPIRATION_OPTIONS.map((option) => (
                      <button
                        key={option.label}
                        onClick={() => handleExpirationChange(option.value)}
                        className={`w-full flex items-center px-4 py-2.5 text-sm transition-colors relative ${darkMode
                          ? 'hover:bg-amber-500/20 text-zinc-200'
                          : 'hover:bg-amber-50 text-gray-800'
                          } ${expiresInDays === option.value ? (darkMode ? 'bg-amber-500 text-black font-medium' : 'bg-amber-500 text-white font-medium') : ''}`}
                      >
                        {expiresInDays === option.value && (
                          <Check size={14} className="mr-2.5" />
                        )}
                        <span className={expiresInDays === option.value ? '' : 'ml-6'}>
                          {option.label}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {expiresInDays === 'custom' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className={`block text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                  Number of Days
                </label>
                <style>{`
                  input[type='number']::-webkit-inner-spin-button, 
                  input[type='number']::-webkit-outer-spin-button { 
                    -webkit-appearance: none; 
                    margin: 0; 
                  }
                `}</style>
                <input
                  type="number"
                  min="1"
                  value={customDays}
                  onChange={(e) => setCustomDays(e.target.value)}
                  placeholder="e.g. 2, 45"
                  className={`w-full px-4 py-3 rounded-2xl border transition-colors outline-none focus:ring-2 focus:ring-amber-500/20 ${darkMode
                    ? 'bg-black/40 border-white/[0.08] text-zinc-200 focus:border-amber-500/50'
                    : 'bg-white border-gray-200 text-gray-800 focus:border-amber-500 shadow-sm'
                    }`}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                Share Link
              </label>
              <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border overflow-hidden ${darkMode
                ? 'bg-black/40 border-white/[0.08]'
                : 'bg-gray-50 border-gray-200'
                }`}>
                <Link2 size={16} className={`shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                {isLoading ? (
                  <div className="flex-1 flex items-center py-0.5">
                    <Loader2 size={14} className="animate-spin text-emerald-500 mr-2" />
                    <span className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>Generating unique link...</span>
                  </div>
                ) : (
                  <input
                    ref={inputRef}
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className={`flex-1 text-sm bg-transparent outline-none select-all truncate ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                )}
              </div>
            </div>

            {description && (
              <p className={`text-xs mt-3.5 px-1 leading-relaxed ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                {description}
              </p>
            )}

            {/* Existing Shared Links */}
            <div className="space-y-2.5">
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                Shared Links History
              </label>

              {loadingLinks ? (
                <div className={`flex items-center justify-center py-4 ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span className="text-xs">Loading links...</span>
                </div>
              ) : existingLinks.length === 0 ? (
                <p className={`text-xs py-3 text-center ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                  No shared links yet
                </p>
              ) : (
                <div className="space-y-2 max-h-[200px] overflow-y-auto no-scrollbar">
                  {existingLinks.map((link) => (
                    <div
                      key={link.id}
                      className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-colors ${darkMode
                          ? 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.04]'
                          : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                        }`}
                    >
                      {/* Status badge */}
                      <div className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${link.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : link.status === 'expired'
                            ? 'bg-red-500/15 text-red-400'
                            : darkMode
                              ? 'bg-blue-500/15 text-blue-400'
                              : 'bg-blue-100 text-blue-600'
                        }`}>
                        {link.status === 'no_expiry' ? 'Forever' : link.status === 'active' ? 'Active' : 'Expired'}
                      </div>

                      {/* Link details */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs truncate font-mono ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                          …/share/link/{link.token}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                          Created {formatDate(link.created_at)}
                          {link.expires_at && (
                            <span>
                              {' · '}
                              {link.status === 'expired'
                                ? `Expired ${formatDate(link.expires_at)}`
                                : timeRemaining(link.expires_at)
                              }
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex gap-1">
                        {link.status !== 'expired' && (
                          <button
                            onClick={() => handleCopyExistingLink(link.token)}
                            className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}
                            title="Copy link"
                          >
                            <Copy size={12} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteLink(link.id)}
                          className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                          title="Delete link"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-end gap-3 px-7 py-5 border-t flex-shrink-0 ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            disabled={!generatedUrl || isLoading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] shadow-lg ${!generatedUrl || isLoading
              ? darkMode ? 'bg-zinc-700 text-zinc-500 shadow-none cursor-not-allowed' : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
              : copied
                ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                : darkMode
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-white/10'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
              }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Done'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ShareLinkModal;
