import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Link2, Check, Copy, ChevronDown, Loader2, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { createShareLink, loadSharedLinks, deleteSharedLink, type SharedLinkInfo } from '../src/lib/bookStorage';

interface ShareLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkType: 'category' | 'book';
  target: string;
  title?: string;
  description?: string;
  darkMode: boolean;
  bookName?: string;
  bookCategory?: string;
}

const EXPIRATION_OPTIONS: { label: string; value: number | null | 'custom' }[] = [
  { label: 'Never', value: null },
  { label: '30 days', value: 30 },
  { label: '15 days', value: 15 },
  { label: '7 days', value: 7 },
  { label: '1 day', value: 1 },
  { label: 'Custom', value: 'custom' },
];

const CATEGORY_LABELS: Record<string, string> = {
  philippines: 'Philippines',
  internal: 'Internal',
  international: 'International',
  ph_interns: 'PH Interns',
  deseret: 'Deseret',
  angelhost: 'Angelhost',
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getExpirationProgress(createdAt: string, expiresAt: string | null): { percent: number; color: string; label: string } {
  if (!expiresAt) {
    return { percent: 100, color: 'bg-emerald-500', label: 'Never expires' };
  }

  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const expires = new Date(expiresAt).getTime();
  const total = expires - created;
  const remaining = expires - now;

  if (remaining <= 0) {
    return { percent: 0, color: 'bg-red-500', label: 'Expired' };
  }

  const percent = Math.max(0, Math.min(100, (remaining / total) * 100));

  const daysLeft = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  let label = '';
  if (daysLeft > 0) label = `${daysLeft}d ${hoursLeft}h left`;
  else if (hoursLeft > 0) label = `${hoursLeft}h left`;
  else label = `${Math.floor(remaining / 60000)}m left`;

  let color = 'bg-emerald-500';
  if (percent < 25) color = 'bg-red-500';
  else if (percent < 50) color = 'bg-amber-500';
  else if (percent < 75) color = 'bg-yellow-400';

  return { percent, color, label };
}

const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen, onClose, linkType, target, title = 'Share Link', description, darkMode,
  bookName, bookCategory
}) => {
  const [copied, setCopied] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<number | null | 'custom'>(null);
  const [customDays, setCustomDays] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [existingLinks, setExistingLinks] = useState<SharedLinkInfo[]>([]);
  const [loadingLinks, setLoadingLinks] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      setExpiresInDays(null);
      setCustomDays('');
      setGeneratedUrl('');
      fetchExistingLinks();
    } else {
      setGeneratedUrl('');
      setShowDropdown(false);
      setExistingLinks([]);
    }
  }, [isOpen, linkType, target]);

  // Remove the auto-generation from custom days effect
  useEffect(() => {
    if (expiresInDays === 'custom') {
      const days = parseInt(customDays, 10);
      if (isNaN(days) || days <= 0) {
        // Do nothing, just clear any previous url if they clear the input
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
    }
    // We no longer auto-generate here!
  };

  const handleManualGenerate = () => {
    if (expiresInDays === 'custom') {
      const days = parseInt(customDays, 10);
      if (!isNaN(days) && days > 0) {
        generateLink(days);
      }
    } else {
      generateLink(expiresInDays);
    }
  };

  const confirmDeleteLink = async () => {
    if (!linkToDelete) return;
    try {
      await deleteSharedLink(linkToDelete);
      setExistingLinks(prev => prev.filter(l => l.id !== linkToDelete));
      setLinkToDelete(null);
    } catch (err) {
      console.error('Failed to delete link:', err);
    }
  };

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!generatedUrl || isLoading) return;
    try { await navigator.clipboard.writeText(generatedUrl); }
    catch { inputRef.current?.select(); document.execCommand('copy'); }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCopyExistingLink = async (token: string) => {
    const url = `${window.location.origin}/share/link/${token}`;
    try { await navigator.clipboard.writeText(url); } catch { }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayBookName = bookName || (linkType === 'category' ? target : '—');
  const displayCategory = bookCategory ? (CATEGORY_LABELS[bookCategory] || bookCategory) : '—';

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
        onClick={onClose}
      />

      <div className={`relative w-full max-w-6xl max-h-[90vh] rounded-[28px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col ${darkMode
        ? 'bg-[#1c1c20]/95 backdrop-blur-3xl border-white/[0.08] shadow-black/60'
        : 'bg-white border-gray-200 shadow-gray-300/50'
        }`}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-1 flex-shrink-0">
          <h3 className={`text-xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <button onClick={onClose} className={`p-1.5 rounded-full transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}>
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 no-scrollbar">
          <div className="px-7 py-5 space-y-5">

            {/* Expiration Dropdown */}
            <div className="space-y-2 relative">
              <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Link expiration</label>
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
                        {expiresInDays === option.value && <Check size={14} className="mr-2.5" />}
                        <span className={expiresInDays === option.value ? '' : 'ml-6'}>{option.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Custom days input */}
            {expiresInDays === 'custom' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                <label className={`block text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Number of Days</label>
                <style>{`input[type='number']::-webkit-inner-spin-button,input[type='number']::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;}`}</style>
                <input type="number" min="1" value={customDays} onChange={(e) => setCustomDays(e.target.value)} placeholder="e.g. 2, 45"
                  className={`w-full px-4 py-3 rounded-2xl border transition-colors outline-none focus:ring-2 focus:ring-emerald-500/20 ${darkMode
                    ? 'bg-black/40 border-white/[0.08] text-zinc-200 focus:border-emerald-500/50'
                    : 'bg-white border-gray-200 text-gray-800 focus:border-emerald-500 shadow-sm'
                    }`}
                />
              </div>
            )}

            {/* Manual Generate Button */}
            <button
              onClick={handleManualGenerate}
              disabled={isLoading || (expiresInDays === 'custom' && (!customDays || parseInt(customDays, 10) <= 0))}
              className={`w-full py-3.5 rounded-2xl font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${darkMode
                ? 'bg-emerald-500 text-white hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500 disabled:bg-gray-100 disabled:text-gray-400'
                }`}
            >
              {isLoading ? (
                <><Loader2 size={18} className="animate-spin" /> Generating...</>
              ) : (
                <><Link2 size={18} /> Generate Link</>
              )}
            </button>

            {/* Share Link display (only shows when generatedUrl exists) */}
            {generatedUrl && (
              <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                <label className={`block text-sm font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Share Link</label>
                <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border overflow-hidden ${darkMode ? 'bg-black/40 border-white/[0.08]' : 'bg-gray-50 border-gray-200'}`}>
                  <Link2 size={16} className={`shrink-0 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  {isLoading ? (
                    <div className="flex-1 flex items-center py-0.5">
                      <Loader2 size={14} className="animate-spin text-emerald-500 mr-2" />
                      <span className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>Generating unique link...</span>
                    </div>
                  ) : (
                    <input ref={inputRef} type="text" value={generatedUrl} readOnly
                      className={`flex-1 text-sm bg-transparent outline-none select-all truncate ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                    />
                  )}
                </div>
              </div>
            )}

            {description && (
              <p className={`text-xs mt-3.5 px-1 leading-relaxed ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>{description}</p>
            )}

            {/* ─── Shared Links History ─── */}
            <div className="space-y-3">
              <label className={`block text-base font-semibold ${darkMode ? 'text-zinc-200' : 'text-gray-800'}`}>Shared Links History</label>

              {loadingLinks ? (
                <div className={`flex items-center justify-center py-6 ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  <span className="text-xs">Loading links...</span>
                </div>
              ) : existingLinks.length === 0 ? (
                <p className={`text-xs py-4 text-center ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>No shared links yet</p>
              ) : (
                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'border-white/[0.06]' : 'border-gray-200'}`}>
                  <div className="max-h-[280px] overflow-y-auto no-scrollbar">
                    <table className="w-full" style={{ borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                      <colgroup>
                        <col style={{ width: '35%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '17%' }} />
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                      </colgroup>
                      <thead className={`sticky top-0 z-10 ${darkMode ? 'bg-[#1e1e22]' : 'bg-gray-50'}`}>
                        <tr>
                          {['Book Name', 'Category', 'Shared Link', 'Link Expiration', 'Status', ''].map((h, i) => (
                            <th
                              key={i}
                              className={`text-xs font-semibold uppercase tracking-wider py-4 ${i === 0 ? 'pl-5 pr-2 text-left' : i === 4 ? 'px-2 text-center' : i === 5 ? 'px-2 text-center' : 'px-3 text-left'
                                } ${darkMode ? 'text-zinc-500 border-b border-white/[0.06]' : 'text-gray-400 border-b border-gray-200'}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {existingLinks.map((link, idx) => {
                          const progress = getExpirationProgress(link.created_at, link.expires_at);
                          const isLast = idx === existingLinks.length - 1;
                          const rowBorder = !isLast
                            ? darkMode ? 'border-b border-white/[0.04]' : 'border-b border-gray-100'
                            : '';

                          return (
                            <tr key={link.id} className={`transition-colors ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50/80'}`}>
                              {/* Book Name */}
                              <td className={`pl-5 pr-2 py-5 align-middle ${rowBorder}`}>
                                <p className={`text-sm font-semibold whitespace-nowrap ${darkMode ? 'text-zinc-200' : 'text-gray-800'}`}>
                                  {displayBookName}
                                </p>
                                <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                                  {formatDate(link.created_at)}
                                </p>
                              </td>

                              {/* Category */}
                              <td className={`px-3 py-5 align-middle ${rowBorder}`}>
                                <span className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                                  {displayCategory}
                                </span>
                              </td>

                              {/* Shared Link */}
                              <td className={`px-3 py-5 align-middle ${rowBorder}`}>
                                <button
                                  onClick={() => handleCopyExistingLink(link.token)}
                                  disabled={link.status === 'expired'}
                                  className={`text-sm font-mono leading-tight transition-colors ${link.status === 'expired'
                                    ? darkMode ? 'text-zinc-600 line-through cursor-default' : 'text-gray-400 line-through cursor-default'
                                    : darkMode ? 'text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer' : 'text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer'
                                    }`}
                                  title={link.status !== 'expired' ? 'Click to copy' : 'Link expired'}
                                  style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%', textAlign: 'left' }}
                                >
                                  …/{link.token}
                                </button>
                              </td>

                              {/* Link Expiration — Progress Bar */}
                              <td className={`px-3 py-5 align-middle ${rowBorder}`}>
                                <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? 'bg-white/[0.06]' : 'bg-gray-200'}`}>
                                  <div
                                    className={`h-full rounded-full transition-all duration-700 ease-out ${progress.color}`}
                                    style={{ width: `${progress.percent}%` }}
                                  />
                                </div>
                                <p className={`text-[11px] mt-1.5 leading-none ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                                  {progress.label}
                                </p>
                              </td>

                              {/* Status */}
                              <td className={`px-2 py-5 align-middle text-center ${rowBorder}`}>
                                {link.status === 'expired' ? (
                                  <XCircle size={24} className="text-red-400 mx-auto" />
                                ) : (
                                  <CheckCircle2 size={24} className="text-emerald-400 mx-auto" />
                                )}
                              </td>

                              {/* Delete */}
                              <td className={`px-2 py-5 align-middle text-center ${rowBorder}`}>
                                <button
                                  onClick={() => setLinkToDelete(link.id)}
                                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                  title="Delete link"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end gap-3 px-7 py-5 border-t flex-shrink-0 ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
          <button onClick={onClose}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
            Close
          </button>
          <button onClick={handleCopy} disabled={!generatedUrl || isLoading}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.97] shadow-lg ${!generatedUrl || isLoading
              ? darkMode ? 'bg-zinc-700 text-zinc-500 shadow-none cursor-not-allowed' : 'bg-gray-200 text-gray-400 shadow-none cursor-not-allowed'
              : copied
                ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                : darkMode
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-white/10'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20'
              }`}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Newly Generated Link'}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {linkToDelete && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 backdrop-blur-md transition-opacity ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
            onClick={() => setLinkToDelete(null)}
          />
          <div className={`relative w-full max-w-sm rounded-[24px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col p-6 text-center ${darkMode
            ? 'bg-[#1c1c20] border-white/[0.08] shadow-black/60'
            : 'bg-white border-gray-200 shadow-gray-300/50'
            }`}>

            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${darkMode ? 'bg-red-500/10' : 'bg-red-50'}`}>
              <Trash2 size={28} className="text-red-500" />
            </div>

            <h3 className={`text-xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Delete Link?
            </h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              This share link will be permanently revoked. Anyone with the URL will no longer be able to access the content.
            </p>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setLinkToDelete(null)}
                className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${darkMode ? 'bg-white/[0.04] text-white hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                Cancel
              </button>
              <button
                onClick={() => confirmDeleteLink()}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-red-500/20 bg-red-500 text-white hover:bg-red-600 active:scale-[0.98]"
              >
                Yes, Revoke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

export default ShareLinkModal;
