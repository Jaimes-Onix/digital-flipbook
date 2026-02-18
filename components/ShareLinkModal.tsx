import React, { useState, useRef, useEffect } from 'react';
import { X, Link2, Check, Copy } from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
  description?: string;
  darkMode: boolean;
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen, onClose, url, title = 'Share Link', description, darkMode
}) => {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setTimeout(() => inputRef.current?.select(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      inputRef.current?.select();
      document.execCommand('copy');
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className={`relative w-full max-w-md rounded-[28px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-200 ${
        darkMode
          ? 'bg-[#1c1c20]/95 backdrop-blur-3xl border-white/[0.08] shadow-black/60'
          : 'bg-white border-gray-200 shadow-gray-300/50'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-1">
          <h3 className={`text-[17px] font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* URL Display */}
        <div className="px-7 py-5">
          <div className={`flex items-center gap-3 px-4 py-4 rounded-2xl border ${
            darkMode
              ? 'bg-white/[0.04] border-white/[0.06]'
              : 'bg-gray-50 border-gray-200'
          }`}>
            <Link2 size={16} className={`shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <input
              ref={inputRef}
              type="text"
              value={url}
              readOnly
              className={`flex-1 text-sm bg-transparent outline-none select-all truncate ${
                darkMode ? 'text-zinc-300' : 'text-gray-700'
              }`}
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>

          {description && (
            <p className={`text-xs mt-3.5 px-1 leading-relaxed ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              {description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className={`flex items-center justify-end gap-3 px-7 py-5 border-t ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          <button
            onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              darkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] shadow-lg ${
              copied
                ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                : darkMode
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-white/10'
                  : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-400/20'
            }`}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareLinkModal;
