import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2, Check, Copy, ChevronDown, Loader2 } from 'lucide-react';
import { createShareLink } from '../src/lib/bookStorage';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkType: 'category' | 'book';
  target: string;
  title?: string;
  description?: string;
  darkMode: boolean;
}

const EXPIRATION_OPTIONS = [
  { label: 'Never', value: null },
  { label: '30 days', value: 30 },
  { label: '15 days', value: 15 },
  { label: '7 days', value: 7 },
  { label: '1 day', value: 1 },
];

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen, onClose, linkType, target, title = 'Share Link', description, darkMode
}) => {
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setExpiresInDays(null);
      generateLink(null);
    } else {
      setGeneratedUrl('');
      setShowDropdown(false);
    }
  }, [isOpen, linkType, target]);

  const generateLink = async (days: number | null) => {
    setIsLoading(true);
    try {
      const token = await createShareLink(linkType, target, days);
      setGeneratedUrl(`${window.location.origin}/share/link/${token}`);
      setTimeout(() => inputRef.current?.select(), 100);
    } catch (err) {
      console.error('Failed to generate link:', err);
      setGeneratedUrl('Error generating link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpirationChange = (days: number | null) => {
    setExpiresInDays(days);
    setShowDropdown(false);
    generateLink(days);
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

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
        onClick={onClose}
      />

      <div className={`relative w-full max-w-md rounded-[28px] shadow-2xl border overflow-visible animate-in zoom-in-95 fade-in duration-200 ${darkMode
        ? 'bg-[#1c1c20]/95 backdrop-blur-3xl border-white/[0.08] shadow-black/60'
        : 'bg-white border-gray-200 shadow-gray-300/50'
        }`}>
        <div className="flex items-center justify-between px-7 pt-7 pb-1">
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
                  {EXPIRATION_OPTIONS.find(o => o.value === expiresInDays)?.label || 'Never'}
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
        </div>

        <div className={`flex items-center justify-end gap-3 px-7 py-5 border-t ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
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
