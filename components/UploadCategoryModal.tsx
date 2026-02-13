import React, { useState, useEffect } from 'react';
import { X, MapPin, Building, Globe, Users, Heart, Check, ChevronRight, Cloud } from 'lucide-react';
import { LibraryBook, BookCategory } from '../types';

interface UploadCategoryModalProps {
  book: LibraryBook | null;
  currentIndex?: number;
  totalBooks?: number;
  onClose: () => void;
  onConfirm: (bookId: string, category?: BookCategory, isFavorite?: boolean) => void;
}

const CATEGORIES: { id: BookCategory; label: string; icon: any; color: string }[] = [
  { id: 'philippines', label: 'Philippines', icon: MapPin, color: 'bg-blue-500' },
  { id: 'internal', label: 'Internal', icon: Building, color: 'bg-purple-500' },
  { id: 'international', label: 'International', icon: Globe, color: 'bg-green-500' },
  { id: 'ph_interns', label: 'PH Interns', icon: Users, color: 'bg-orange-500' },
  { id: 'deseret', label: 'Deseret', icon: MapPin, color: 'bg-yellow-500' },
  { id: 'angelhost', label: 'Angelhost', icon: Cloud, color: 'bg-pink-500' },
];

const UploadCategoryModal: React.FC<UploadCategoryModalProps> = ({
  book,
  currentIndex = 1,
  totalBooks = 1,
  onClose,
  onConfirm
}) => {
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | undefined>(undefined);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);

  // Reset state when book changes
  useEffect(() => {
    if (book) {
      setSelectedCategory(book.category);
      setIsFavorite(book.isFavorite || false);
      // Trigger flip animation
      setIsFlipping(true);
      const timer = setTimeout(() => setIsFlipping(false), 600);
      return () => clearTimeout(timer);
    }
  }, [book?.id]);

  if (!book) return null;

  const handleConfirm = () => {
    onConfirm(book.id, selectedCategory, isFavorite);
  };

  const isLastBook = currentIndex >= totalBooks;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/5 hover:bg-black/10 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Progress indicator for multiple books */}
        {totalBooks > 1 && (
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
            <span className="px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-full">
              Book {currentIndex} of {totalBooks}
            </span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row min-h-[500px]">
          {/* Left side - Book Preview with Flip Animation */}
          <div className="flex-1 bg-gradient-to-br from-gray-100 to-gray-200 p-8 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Liquid glass effects */}
            <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-white/40 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-gray-400/30 rounded-full blur-[60px] pointer-events-none" />

            {/* Book with flip animation */}
            <div
              className="relative perspective-1000"
              style={{ perspective: '1000px' }}
            >
              {/* Book shadow */}
              <div className={`absolute inset-0 bg-black/25 rounded-2xl blur-2xl transition-all duration-500 ${isFlipping ? 'translate-y-2 scale-90' : 'translate-y-6 scale-95'
                }`} />

              {/* Book container with flip */}
              <div
                className={`relative transition-all duration-600 ease-out ${isFlipping ? 'animate-flip' : ''
                  }`}
                style={{
                  transformStyle: 'preserve-3d',
                  animation: isFlipping ? 'bookFlip 0.6s ease-out' : 'none',
                }}
              >
                {/* Book cover - BIGGER */}
                <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-black/5">
                  <img
                    src={book.coverUrl}
                    alt={book.name}
                    className="w-64 h-80 sm:w-72 sm:h-96 object-cover"
                  />

                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50" />
                </div>
              </div>
            </div>

            {/* Book title */}
            <h3 className="mt-8 text-xl font-bold text-gray-900 text-center max-w-[280px] truncate">
              {book.name.replace('.pdf', '')}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              {book.totalPages} pages
            </p>
          </div>

          {/* Right side - Categories */}
          <div className="flex-1 p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Organize Your Flipbook</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Choose a category to keep your library organized
              </p>
            </div>

            {/* Category Selection */}
            <div className="flex-1 space-y-3">
              {CATEGORIES.map(({ id, label, icon: Icon, color }) => {
                const isSelected = selectedCategory === id;
                return (
                  <button
                    key={id}
                    onClick={() => setSelectedCategory(isSelected ? undefined : id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${isSelected
                      ? 'border-gray-900 bg-gray-900 text-white shadow-lg'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-white/20' : color + ' text-white'
                      }`}>
                      <Icon size={20} />
                    </div>
                    <span className="font-medium flex-1 text-left">{label}</span>
                    {isSelected && (
                      <Check size={20} className="text-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Favorite Toggle */}
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className={`mt-4 w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${isFavorite
                ? 'border-red-200 bg-red-50 text-red-600'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-500'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isFavorite ? 'bg-red-100' : 'bg-gray-100'
                }`}>
                <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
              </div>
              <span className="font-medium flex-1 text-left">
                {isFavorite ? 'Added to Favorites' : 'Add to Favorites'}
              </span>
              {isFavorite && (
                <Check size={20} />
              )}
            </button>

            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className="mt-6 w-full py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-colors active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
            >
              {isLastBook ? 'Add to Library' : 'Next Book'}
              {!isLastBook && <ChevronRight size={20} />}
            </button>

            {/* Skip option */}
            <button
              onClick={() => onConfirm(book.id, undefined, false)}
              className="mt-2 w-full py-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
            >
              Skip {isLastBook ? 'for now' : 'this book'}
            </button>
          </div>
        </div>
      </div>

      {/* CSS for flip animation */}
      <style>{`
        @keyframes bookFlip {
          0% {
            transform: rotateY(-90deg) scale(0.9);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: rotateY(0deg) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default UploadCategoryModal;
