import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { LibraryBook } from '../types';

interface FeaturedCarouselProps {
  books: LibraryBook[];
  darkMode?: boolean;
}

const AUTO_PLAY_INTERVAL = 6000;

const FeaturedCarousel: React.FC<FeaturedCarouselProps> = ({ books, darkMode = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex >= books.length && books.length > 0) {
      setCurrentIndex(0);
    }
  }, [books.length, currentIndex]);

  const nextSlide = useCallback(() => {
    if (books.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % books.length);
  }, [books.length]);

  const prevSlide = useCallback(() => {
    if (books.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? books.length - 1 : prev - 1));
  }, [books.length]);

  useEffect(() => {
    if (books.length <= 1) return;
    const timer = setInterval(nextSlide, AUTO_PLAY_INTERVAL);
    return () => clearInterval(timer);
  }, [nextSlide, books.length]);

  if (books.length === 0) return null;

  const currentBook = books[currentIndex] || books[0];
  if (!currentBook) return null;

  return (
    <div className={`relative w-full h-[520px] overflow-hidden flex items-center justify-center mb-12 ${darkMode ? 'bg-black' : 'bg-gray-100'}`}>
      {/* Dynamic Background with crossfade transition */}
      <div 
        key={`bg-${currentBook.id}`}
        className={`absolute inset-0 z-0 bg-cover bg-center transition-all duration-1000 scale-110 blur-2xl animate-in fade-in duration-1000 ${
          darkMode ? 'brightness-[0.35]' : 'brightness-[0.85] opacity-60'
        }`}
        style={{ backgroundImage: `url(${currentBook.coverUrl})` }}
      />
      
      {/* Vignette */}
      <div className={`absolute inset-0 z-0 ${
        darkMode ? 'bg-gradient-to-b from-black/20 via-transparent to-black/40' : 'bg-gradient-to-b from-white/30 via-transparent to-white/50'
      }`} />

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 px-12 h-full py-16">
        
        {/* Navigation - Left */}
        {books.length > 1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className={`absolute left-6 z-20 p-3 rounded-full transition-all active:scale-90 hidden sm:block ${
              darkMode ? 'text-white/30 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-800 hover:bg-black/10'
            }`}
            aria-label="Previous featured book"
          >
            <ChevronLeft size={48} strokeWidth={1} />
          </button>
        )}

        {/* Book Visual Section */}
        <div className="flex-1 flex justify-center items-center">
            <div 
              key={`book-${currentBook.id}`}
              className="relative w-64 h-96 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.8)] rounded-sm overflow-hidden transform transition-all duration-700 hover:scale-105 perspective-1000 group animate-in zoom-in fade-in duration-700"
            >
                <div className="absolute inset-y-0 left-0 w-2.5 bg-black/30 z-10" />
                <img 
                    src={currentBook.coverUrl} 
                    alt={currentBook.name} 
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
            </div>
        </div>

        {/* Book Info Section */}
        <div 
          key={`info-${currentBook.id}`}
          className={`flex-1 flex flex-col animate-in slide-in-from-right-12 fade-in duration-700 ${darkMode ? 'text-white' : 'text-gray-900'}`}
        >
          <div className="space-y-5">
              <h4 className={`font-black uppercase tracking-[0.4em] text-[10px] opacity-90 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Featured Selection
              </h4>
              <h2 className="text-5xl font-serif font-bold leading-tight mb-2 drop-shadow-lg">
                {currentBook.name.replace('.pdf', '')}
              </h2>
              <div className="w-16 h-1 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" />
              <p className={`text-xl leading-relaxed font-light italic max-w-md line-clamp-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {currentBook.summary || "Explore this premier selection from our curated collection of digital publications."}
              </p>
          </div>
        </div>

        {/* Navigation - Right */}
        {books.length > 1 && (
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className={`absolute right-6 z-20 p-3 rounded-full transition-all active:scale-90 hidden sm:block ${
              darkMode ? 'text-white/30 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-800 hover:bg-black/10'
            }`}
            aria-label="Next featured book"
          >
            <ChevronRight size={48} strokeWidth={1} />
          </button>
        )}
      </div>
      
      {/* Pagination indicators */}
      {books.length > 1 && (
        <div className="absolute bottom-10 flex gap-3 z-20">
          {books.map((_, idx) => (
            <button 
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                idx === currentIndex
                  ? 'w-12 bg-blue-500 shadow-lg shadow-blue-500/40'
                  : darkMode ? 'w-4 bg-white/20 hover:bg-white/40' : 'w-4 bg-black/20 hover:bg-black/40'
              }`}
              aria-label={`Go to featured book ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FeaturedCarousel;
