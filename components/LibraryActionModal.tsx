import React, { useState, useEffect } from 'react';
import { Play, BookOpen, X, Trash2, AlertCircle, Sparkles, Loader2, Check, Heart } from 'lucide-react';
import { LibraryBook, BookCategory } from '../types';

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
}

const LibraryActionModal: React.FC<LibraryActionModalProps> = ({ 
  book, 
  onClose, 
  onSelectMode, 
  onSummarize, 
  onApplySummary,
  onUpdateCategory,
  onToggleFavorite,
  isSummarizing,
  isLoadingBook,
  onRemove
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [tempSummary, setTempSummary] = useState<string | null>(null);

  // Clear local state when modal book changes or closes
  useEffect(() => {
    setTempSummary(null);
    setShowConfirmDelete(false);
  }, [book?.id]);

  if (!book) return null;

  const handleSummarizeClick = async () => {
    if (!onSummarize) return;
    const result = await onSummarize(book.id);
    if (result) {
      setTempSummary(result);
    }
  };

  const handleApplySummary = () => {
    if (onApplySummary && tempSummary) {
      onApplySummary(book.id, tempSummary);
      setTempSummary(null); // Clear after applying
    }
  };

  const currentSummary = tempSummary || book.summary;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white/90 backdrop-blur-3xl w-full max-w-sm rounded-[40px] shadow-2xl border border-white/40 overflow-hidden animate-in zoom-in slide-in-from-bottom-8 duration-500"
      >
        {!showConfirmDelete ? (
          <div className="p-8 flex flex-col items-center text-center">
            {/* Action buttons at top */}
            <div className="absolute top-6 right-6 flex gap-2">
              {onToggleFavorite && (
                <button
                  onClick={() => onToggleFavorite(book.id)}
                  className={`p-2.5 rounded-full transition-colors ${book.isFavorite ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400'}`}
                  title={book.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                >
                  <Heart size={18} fill={book.isFavorite ? 'currentColor' : 'none'} />
                </button>
              )}
              {onSummarize && !tempSummary && (
                <button
                  onClick={handleSummarizeClick}
                  disabled={isSummarizing}
                  className="p-2.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                  title="Generate AI Summary"
                >
                  {isSummarizing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                </button>
              )}
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-2.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                title="Remove Book"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="relative w-32 aspect-[3/4] mb-6 shadow-2xl rounded-sm overflow-hidden perspective-1000 rotate-y-[-5deg] group">
               <img src={book.coverUrl} alt={book.name} className="w-full h-full object-cover" />
               <div className="absolute inset-y-0 left-0 w-1.5 bg-black/20" />
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1 line-clamp-1 px-4">
              {book.name.replace('.pdf', '')}
            </h3>
            <p className="text-xs text-gray-400 mb-4 uppercase tracking-widest font-bold">
              {book.totalPages} Pages
            </p>

            {onUpdateCategory && (
              <div className="w-full mb-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Category</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {CATEGORY_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => onUpdateCategory(book.id, book.category === value ? undefined : value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        book.category === value 
                          ? 'bg-gray-900 text-white' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                  {book.category && (
                    <button
                      onClick={() => onUpdateCategory(book.id, undefined)}
                      className="px-3 py-1.5 rounded-full text-xs font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}

            {currentSummary && (
              <div className={`mb-8 p-4 rounded-2xl border transition-all duration-500 animate-in fade-in slide-in-from-top-2 
                ${tempSummary ? 'bg-blue-50 border-blue-100' : 'bg-gray-50/50 border-gray-100'}`}
              >
                {tempSummary && (
                  <span className="block text-[8px] font-black uppercase text-blue-500 tracking-[0.2em] mb-2">
                    AI Suggestion
                  </span>
                )}
                <p className="text-xs text-gray-600 italic leading-relaxed">
                  "{currentSummary}"
                </p>
                
                {tempSummary && (
                  <button
                    onClick={handleApplySummary}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-md shadow-blue-500/20"
                  >
                    <Check size={14} strokeWidth={3} />
                    Apply Summary
                  </button>
                )}
              </div>
            )}

            <div className="w-full space-y-3">
              <button
                onClick={() => onSelectMode('preview')}
                disabled={isLoadingBook}
                className="w-full flex items-center justify-center gap-3 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[20px] font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingBook ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading Book...
                  </>
                ) : (
                  <>
                    <Play size={18} fill="currentColor" className="group-hover:scale-110 transition-transform" />
                    Preview Mode
                  </>
                )}
              </button>
              
              <button
                onClick={() => onSelectMode('manual')}
                disabled={isLoadingBook}
                className="w-full flex items-center justify-center gap-3 py-4 bg-gray-900 hover:bg-black text-white rounded-[20px] font-bold transition-all active:scale-95 shadow-lg shadow-black/10 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingBook ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Loading Book...
                  </>
                ) : (
                  <>
                    <BookOpen size={18} className="group-hover:scale-110 transition-transform" />
                    Read Now
                  </>
                )}
              </button>
            </div>

            <button 
              onClick={onClose}
              className="mt-6 p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          /* Confirmation View */
          <div className="p-10 flex flex-col items-center text-center animate-in zoom-in fade-in duration-300">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
              <AlertCircle size={32} />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Book?</h3>
            <p className="text-sm text-gray-500 mb-10 leading-relaxed">
              Are you sure you want to remove <span className="font-semibold text-gray-800">"{book.name.replace('.pdf', '')}"</span>? This action cannot be undone.
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={() => onRemove && onRemove(book.id)}
                className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-[20px] font-bold transition-all active:scale-95 shadow-lg shadow-red-500/20"
              >
                Remove Permanently
              </button>
              
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="w-full py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-[20px] font-bold transition-all active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryActionModal;