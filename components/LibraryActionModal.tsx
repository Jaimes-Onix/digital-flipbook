import React, { useState, useEffect } from 'react';
import { BookOpen, X, Trash2, AlertCircle, Sparkles, Loader2, Check, Heart, Share2 } from 'lucide-react';
import { LibraryBook, BookCategory } from '../types';
import ShareLinkModal from './ShareLinkModal';


const CATEGORY_OPTIONS: { value: BookCategory; label: string }[] = [
  { value: 'philippines', label: 'Philippines' },
  { value: 'internal', label: 'Internal' },
  { value: 'international', label: 'International' },
  { value: 'ph_interns', label: 'PH Interns' },
  { value: 'deseret', label: 'Deseret' },
  { value: 'angelhost', label: 'Angelhost' },
];

interface LibraryActionModalProps {
  book: LibraryBook | null;
  onClose: () => void;
  onSelectMode: (mode: 'manual' | 'preview') => void;
  onSummarize?: (id: string) => Promise<string | null>;
  onApplySummary?: (id: string, summary: string) => void;
  onUpdateCategory?: (id: string, category?: BookCategory) => void;
  onToggleFavorite?: (id: string) => void;
  isSummarizing?: boolean;
  isLoadingBook?: boolean;
  onRemove?: (id: string) => void;
  darkMode?: boolean;
}

const LibraryActionModal: React.FC<LibraryActionModalProps> = ({
  book, onClose, onSelectMode, onSummarize, onApplySummary, onUpdateCategory, onToggleFavorite, isSummarizing, isLoadingBook, onRemove, darkMode = true
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [tempSummary, setTempSummary] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => { setTempSummary(null); setShowConfirmDelete(false); setShowShareModal(false); }, [book?.id]);

  if (!book) return null;

  const handleSummarizeClick = async () => {
    if (!onSummarize) return;
    const result = await onSummarize(book.id);
    if (result) setTempSummary(result);
  };

  const handleApplySummary = () => {
    if (onApplySummary && tempSummary) { onApplySummary(book.id, tempSummary); setTempSummary(null); }
  };

  const currentSummary = tempSummary || book.summary;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
        <div className={`backdrop-blur-3xl w-full max-w-sm rounded-[32px] shadow-2xl shadow-black/40 border overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500 ${darkMode ? 'bg-[#141418]/95 border-white/[0.06]' : 'bg-white/95 border-gray-200'}`}>
          {!showConfirmDelete ? (
            <div className="p-8 flex flex-col items-center text-center relative">
              {/* Top action buttons */}
              <div className="absolute top-6 right-6 flex gap-2">
                <button
                  onClick={() => setShowShareModal(true)}
                  className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-white/[0.05] text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10' : 'bg-gray-100 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                  title="Share Book"
                >
                  <Share2 size={16} />
                </button>
                {onToggleFavorite && (
                  <button
                    onClick={() => onToggleFavorite(book.id)}
                    className={`p-2 rounded-full transition-colors ${book.isFavorite ? 'bg-red-500/15 text-red-400' : darkMode ? 'bg-white/[0.05] text-zinc-600 hover:text-red-400 hover:bg-red-500/10' : 'bg-gray-100 text-gray-500 hover:text-red-400 hover:bg-red-50'}`}
                    title={book.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                  >
                    <Heart size={16} fill={book.isFavorite ? 'currentColor' : 'none'} />
                  </button>
                )}
                {onSummarize && !tempSummary && (
                  <button
                    onClick={handleSummarizeClick}
                    disabled={isSummarizing}
                    className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    title="AI Summary"
                  >
                    {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  </button>
                )}
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {/* Book Cover */}
              <div className="relative w-28 aspect-[3/4] mb-6 rounded-xl overflow-hidden shadow-2xl shadow-black/50 border border-white/[0.06]">
                <img src={book.coverUrl} alt={book.name} className="w-full h-full object-cover" />
              </div>

              <h3 className={`text-lg font-bold mb-1 line-clamp-1 px-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {book.name.replace('.pdf', '')}
              </h3>
              <p className={`text-[11px] mb-5 uppercase tracking-widest font-medium ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                {book.totalPages} Pages
              </p>

              {/* Category Chips */}
              {onUpdateCategory && (
                <div className="w-full mb-6">
                  <p className={`text-[10px] font-semibold uppercase tracking-[0.15em] mb-2 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Category</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {CATEGORY_OPTIONS.map(({ value, label }) => (
                      <button
                        key={value}
                        onClick={() => onUpdateCategory(book.id, book.category === value ? undefined : value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${book.category === value
                          ? darkMode
                            ? 'bg-white/15 text-white border-white/20'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : darkMode
                            ? 'bg-white/[0.04] text-zinc-500 hover:bg-white/[0.08] hover:text-zinc-300 border-transparent'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 border-transparent'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                    {book.category && (
                      <button
                        onClick={() => onUpdateCategory(book.id, undefined)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${darkMode ? 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04]' : 'text-gray-500 hover:text-gray-600 hover:bg-gray-100'}`}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              {currentSummary && (
                <div className={`mb-6 p-4 rounded-2xl border transition-all duration-500 w-full ${tempSummary
                  ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                  : darkMode
                    ? 'bg-white/[0.02] border-white/[0.06]'
                    : 'bg-gray-50 border-gray-200'
                  }`}>
                  {tempSummary && (
                    <span className="block text-[9px] font-bold uppercase text-emerald-500 tracking-[0.2em] mb-2">AI Suggestion</span>
                  )}
                  <p className={`text-xs italic leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>"{currentSummary}"</p>
                  {tempSummary && (
                    <button onClick={handleApplySummary}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all active:scale-95 shadow-md shadow-emerald-500/20">
                      <Check size={14} strokeWidth={3} /> Apply Summary
                    </button>
                  )}
                </div>
              )}

              {/* Read Button */}
              <div className="w-full space-y-3">
                <button
                  onClick={() => onSelectMode('manual')}
                  disabled={isLoadingBook}
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-white hover:bg-zinc-100 text-zinc-900 shadow-white/5' : 'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-300/30'
                    }`}
                >
                  {isLoadingBook ? (
                    <><Loader2 size={18} className="animate-spin" /> Loading Book...</>
                  ) : (
                    <><BookOpen size={18} className="group-hover:scale-110 transition-transform" /> Read Now</>
                  )}
                </button>

                <button
                  onClick={() => setShowShareModal(true)}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-medium transition-all active:scale-[0.98] ${darkMode ? 'bg-white/[0.05] hover:bg-white/[0.08] text-zinc-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                >
                  <Share2 size={16} /> Share Book
                </button>
              </div>

              <button onClick={onClose} className={`mt-5 p-2 transition-colors ${darkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-gray-400 hover:text-gray-600'}`}>
                <X size={20} />
              </button>
            </div>
          ) : (
            /* Delete Confirmation */
            <div className="p-10 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Remove Book?</h3>
              <p className={`text-sm mb-10 leading-relaxed ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                Remove <span className={`font-semibold ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>"{book.name.replace('.pdf', '')}"</span>? This can't be undone.
              </p>
              <div className="w-full space-y-3">
                <button onClick={() => onRemove && onRemove(book.id)}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/20">
                  Remove Permanently
                </button>
                <button onClick={() => setShowConfirmDelete(false)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${darkMode ? 'bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ShareLinkModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={`${window.location.origin}/share/book/${book.id}`}
        title="Share Book"
        description={`Anyone with this link can view and read "${book.name.replace('.pdf', '')}".`}
        darkMode={darkMode || true}
      />
    </>
  );
};

export default LibraryActionModal;
