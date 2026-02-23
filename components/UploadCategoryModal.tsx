import React, { useState, useEffect } from 'react';
import { X, MapPin, Building, Globe, Users, Heart, Check, ChevronRight, Cloud, Folder } from 'lucide-react';
import { LibraryBook, BookCategory, CustomCategory } from '../types';

interface UploadCategoryModalProps {
  book: LibraryBook | null;
  currentIndex?: number;
  totalBooks?: number;
  onClose: () => void;
  onConfirm: (bookId: string, category?: BookCategory, isFavorite?: boolean) => void;
  darkMode?: boolean;
  customCategories?: CustomCategory[];
}

const CATEGORIES: { id: BookCategory; label: string; icon: any; color: string; glow: string }[] = [
  { id: 'philippines', label: 'Philippines', icon: MapPin, color: 'bg-blue-500', glow: 'shadow-blue-500/20' },
  { id: 'internal', label: 'Internal', icon: Building, color: 'bg-purple-500', glow: 'shadow-purple-500/20' },
  { id: 'international', label: 'International', icon: Globe, color: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
  { id: 'ph_interns', label: 'PH Interns', icon: Users, color: 'bg-orange-500', glow: 'shadow-orange-500/20' },
  { id: 'deseret', label: 'Deseret', icon: MapPin, color: 'bg-yellow-500', glow: 'shadow-yellow-500/20' },
  { id: 'angelhost', label: 'Angelhost', icon: Cloud, color: 'bg-pink-500', glow: 'shadow-pink-500/20' },
];

const UploadCategoryModal: React.FC<UploadCategoryModalProps> = ({ book, currentIndex = 1, totalBooks = 1, onClose, onConfirm, darkMode = true, customCategories = [] }) => {
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (book) {
      setSelectedCategory(book.category);
      setIsFavorite(book.isFavorite || false);
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [book?.id]);

  if (!book) return null;

  const handleConfirm = () => { onConfirm(book.id, selectedCategory, isFavorite); };
  const isLastBook = currentIndex >= totalBooks;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className={`relative backdrop-blur-3xl rounded-[32px] shadow-2xl shadow-black/50 border w-full max-w-4xl overflow-hidden animate-in zoom-in-95 fade-in duration-300 ${darkMode ? 'bg-[#141418]/95 border-white/[0.06]' : 'bg-white/95 border-gray-200'}`}>
        {/* Close */}
        <button onClick={onClose} className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors ${darkMode ? 'bg-white/[0.05] hover:bg-white/[0.1] text-zinc-500 hover:text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700'}`}>
          <X size={20} />
        </button>

        {/* Progress */}
        {totalBooks > 1 && (
          <div className="absolute top-4 left-4 z-10">
            <span className={`px-3 py-1.5 text-xs font-bold rounded-full border ${darkMode ? 'bg-white/10 text-white border-white/[0.06]' : 'bg-gray-100 text-gray-900 border-gray-200'}`}>
              Book {currentIndex} of {totalBooks}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row min-h-[500px]">
          {/* Left - Preview */}
          <div className={`flex-1 bg-gradient-to-br p-8 flex flex-col items-center justify-center relative overflow-hidden ${darkMode ? 'from-[#0c0c0e] to-[#141418]' : 'from-gray-100 to-gray-50'}`}>
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-purple-500/5 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative perspective-1000" style={{ perspective: '1000px' }}>
              <div className={`absolute inset-0 bg-black/40 rounded-2xl blur-2xl transition-all duration-500 ${isFlipping ? 'translate-y-2 scale-90' : 'translate-y-6 scale-95'}`} />
              <div
                className="relative transition-all duration-600"
                style={{ transformStyle: 'preserve-3d', animation: isFlipping ? 'bookFlip 0.6s ease-out' : 'none' }}
              >
                <div className="relative rounded-2xl shadow-2xl shadow-black/60 overflow-hidden border border-white/[0.06]">
                  <img src={book.coverUrl} alt={book.name} className="w-64 h-80 sm:w-72 sm:h-96 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent" />
                </div>
              </div>
            </div>

            <h3 className={`mt-8 text-xl font-bold text-center max-w-[280px] truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{book.name.replace('.pdf', '')}</h3>
            <p className={`text-sm mt-2 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>{book.totalPages} pages</p>
          </div>

          {/* Right - Categories */}
          <div className="flex-1 p-8 flex flex-col">
            <div className="mb-6">
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Organize Your Flipbook</h2>
              <p className={`mt-1 text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Choose a category to keep things tidy</p>
            </div>

            <div className="flex-1 space-y-2.5">
              {CATEGORIES.map(({ id, label, icon: Icon, color, glow }) => {
                const isSelected = selectedCategory === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedCategory(isSelected ? undefined : id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${isSelected
                        ? darkMode
                          ? `bg-white/[0.08] border-white/[0.15] shadow-lg ${glow}`
                          : 'bg-emerald-50 border-emerald-200 shadow-lg'
                        : darkMode
                          ? 'border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.03] text-zinc-400'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? darkMode ? 'bg-white/15' : 'bg-emerald-100' : color + ' text-white'}`}>
                      <Icon size={20} className={isSelected ? darkMode ? 'text-white' : 'text-emerald-800' : ''} />
                    </div>
                    <span className={`font-medium flex-1 text-left ${isSelected ? darkMode ? 'text-white' : 'text-emerald-800' : ''}`}>{label}</span>
                    {isSelected && <Check size={20} className="text-emerald-500" />}
                  </button>
                );
              })}

              {/* User-created categories */}
              {customCategories.map(cat => {
                const isSelected = selectedCategory === cat.slug;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(isSelected ? undefined : cat.slug)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${isSelected
                        ? darkMode ? 'bg-white/[0.08] border-white/[0.15] shadow-lg' : 'bg-emerald-50 border-emerald-200 shadow-lg'
                        : darkMode ? 'border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.03] text-zinc-400' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color}25` }}
                    >
                      <Folder size={20} style={{ color: cat.color }} />
                    </div>
                    <span className={`font-medium flex-1 text-left ${isSelected ? darkMode ? 'text-white' : 'text-emerald-800' : ''}`}>{cat.name}</span>
                    {isSelected && <Check size={20} className="text-emerald-500" />}
                  </button>
                );
              })}
            </div>

            {/* Favorite */}
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`mt-4 w-full flex items-center gap-4 p-4 rounded-2xl border transition-all duration-200 ${isFavorite
                  ? 'border-red-500/20 bg-red-500/[0.06] text-red-400'
                  : darkMode
                    ? 'border-white/[0.04] hover:border-white/[0.1] hover:bg-white/[0.03] text-zinc-500'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFavorite ? 'bg-red-500/15' : darkMode ? 'bg-white/[0.04]' : 'bg-gray-100'}`}>
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </div>
              <span className="font-medium flex-1 text-left">{isFavorite ? 'Added to Favorites' : 'Add to Favorites'}</span>
              {isFavorite && <Check size={20} />}
            </button>

            {/* Confirm */}
            <button onClick={handleConfirm}
              className={`mt-6 w-full py-4 font-semibold rounded-2xl transition-colors active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${darkMode ? 'bg-white text-zinc-900 hover:bg-zinc-100 shadow-white/5' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-gray-300/30'
                }`}>
              {isLastBook ? 'Add to Library' : 'Next Book'}
              {!isLastBook && <ChevronRight size={20} />}
            </button>

            <button onClick={() => onConfirm(book.id, undefined, false)}
              className={`mt-2 w-full py-2 text-sm font-medium transition-colors ${darkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-gray-400 hover:text-gray-600'}`}>
              Skip {isLastBook ? 'for now' : 'this book'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bookFlip {
          0% { transform: rotateY(-90deg) scale(0.9); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: rotateY(0deg) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default UploadCategoryModal;
