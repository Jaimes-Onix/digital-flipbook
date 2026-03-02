import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, ChevronRight, Heart, BookOpen, Layers, Sparkles } from 'lucide-react';
import { LibraryBook } from '../types';

interface HomeProps {
  books: LibraryBook[];
  darkMode: boolean;
  variant?: 1 | 2;
  categoryCount?: number;
  onUpload: () => void;
  onBrowseLibrary: () => void;
  onSelectBook: (book: LibraryBook) => void;
}

const Home: React.FC<HomeProps> = ({ books, darkMode, variant = 1, categoryCount = 0, onUpload, onBrowseLibrary, onSelectBook }) => {
  const featuredBooks = books.slice(0, 5);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);

  const getCardStyle = (index: number, total: number) => {
    const center = Math.floor(total / 2);
    const offset = index - center;
    const rotation = offset * 8;
    const translateY = Math.abs(offset) * 25;
    const translateX = offset * 120;
    const baseZIndex = total - Math.abs(offset);
    return {
      translateX,
      translateY,
      rotation,
      zIndex: baseZIndex,
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
    };
  };

  return (
    <div className={`min-h-full w-full overflow-hidden relative transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>

      {/* ── Foreground Content ── */}
      <div className="relative z-10 flex flex-col min-h-full">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={`rounded-3xl px-10 py-10 mb-2 max-w-3xl relative overflow-hidden ${darkMode
              ? 'bg-[#141418]/80 backdrop-blur-2xl shadow-2xl shadow-black/30 border border-white/[0.06]'
              : 'bg-white/70 backdrop-blur-2xl shadow-xl shadow-gray-200/50 border border-gray-200/60'
              }`}
          >
            {/* lime glow orbs — dark mode only */}
            {darkMode && (
              <>
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(6,95,70,0.35) 0%, transparent 65%)', filter: 'blur(40px)' }} />
                <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] rounded-full pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.2) 0%, transparent 65%)', filter: 'blur(45px)' }} />
              </>
            )}

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              className="relative z-10 flex flex-wrap justify-center gap-2 mb-7"
            >
              {[
                { icon: BookOpen, label: '3D Flipbook' },
                { icon: Layers, label: `${categoryCount} Categories` },
                { icon: Sparkles, label: 'AI Summaries' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border ${darkMode
                  ? 'bg-emerald-500/[0.08] border-lime-500/[0.15]'
                  : 'bg-emerald-50 border-emerald-200/60'
                  }`}>
                  <Icon size={13} className={darkMode ? 'text-lime-400' : 'text-emerald-600'} />
                  <span className={`text-[11px] font-medium tracking-wide ${darkMode ? 'text-white/80' : 'text-emerald-700'}`}>{label}</span>
                </div>
              ))}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative z-10 text-4xl sm:text-5xl md:text-6xl tracking-tight leading-tight mb-6"
            >
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Lifewood
              </span>
              <br />
              <span className={`font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${darkMode
                ? 'from-lime-300 via-lime-400 to-teal-400'
                : 'from-emerald-600 via-emerald-500 to-teal-500'
                }`}>
                Digital Flipbook
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className={`relative z-10 text-base sm:text-lg max-w-xl mx-auto mb-8 leading-relaxed ${darkMode ? 'text-white/50' : 'text-slate-600'}`}
            >
              Your immersive library experience. Read, share, and explore beautifully crafted flipbooks.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="relative z-10 flex flex-wrap items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(16,185,129,0.2)" }}
                whileTap={{ scale: 0.95 }}
                onClick={onUpload}
                className={`flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold transition-all shadow-xl ${darkMode
                  ? 'text-white shadow-lime-900/30'
                  : 'text-white shadow-emerald-300/40'
                  }`}
                style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)' }}
              >
                <UploadCloud size={18} />
                Upload PDF
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onBrowseLibrary}
                className={`flex items-center gap-2 px-7 py-3.5 rounded-full font-medium border transition-all ${darkMode
                  ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] text-white border-lime-500/20'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
              >
                Discover Library
                <ChevronRight size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Featured Flipbooks - Variant 2: Card Style */}
        {featuredBooks.length > 0 && variant === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="relative px-6 pb-12 pt-4 overflow-hidden"
          >
            <div className="flex justify-center items-end h-[380px] sm:h-[440px]">
              <div className="relative flex items-end justify-center" style={{ perspective: '1000px' }}>
                {featuredBooks.map((book, index) => {
                  const style = getCardStyle(index, featuredBooks.length);
                  const cardBg = darkMode ? 'bg-[#E8E8E8]' : 'bg-[#2A2A2D]';
                  const titleColor = darkMode ? 'text-gray-900' : 'text-slate-900';
                  const cardTextColor = darkMode ? 'text-gray-900' : 'text-slate-900';
                  const cardSubTextColor = darkMode ? 'text-amber-600' : 'text-amber-400';
                  const titlePillColor = darkMode ? 'text-lime-400 bg-emerald-500/10' : 'text-emerald-700 bg-emerald-50';
                  const descriptionColor = darkMode ? 'text-gray-400' : 'text-slate-500';
                  const heartColor = darkMode
                    ? (book.isFavorite ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600')
                    : (book.isFavorite ? 'text-white' : 'text-gray-500 group-hover:text-gray-300');
                  const shadowColor = darkMode ? 'shadow-black/40' : 'shadow-black/60';
                  const hoverShadow = darkMode ? 'group-hover:shadow-black/60' : 'group-hover:shadow-black/80';

                  return (
                    <button
                      key={book.id}
                      onClick={() => onSelectBook(book)}
                      className="absolute group transition-all duration-500 ease-out origin-bottom hover:!-translate-y-6 hover:!z-50"
                      style={{
                        ...style,
                        transformStyle: 'preserve-3d',
                        willChange: 'transform, z-index',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.zIndex = '50';
                        e.currentTarget.style.transform = `translateX(${style.translateX}px) translateY(-24px) rotate(0deg) scale(1.05)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.zIndex = String(style.zIndex);
                        e.currentTarget.style.transform = style.transform;
                      }}
                    >
                      <div className={`w-44 sm:w-52 ${cardBg} rounded-[24px] overflow-hidden shadow-2xl ${shadowColor} transition-all duration-500 ${hoverShadow}`}>
                        <div className="px-4 pt-4 pb-2 flex justify-between items-start gap-2">
                          <div className="text-left flex-1 min-w-0">
                            <p className={`${cardTextColor} text-sm font-bold truncate leading-tight`}>
                              {book.name.replace('.pdf', '').replace(/_/g, ' ')}
                            </p>
                            <p className={`${cardSubTextColor} text-[11px] mt-0.5 font-medium`}>
                              {book.totalPages} pages
                            </p>
                          </div>
                          <div className={`p-1 rounded-full transition-colors duration-300 shrink-0 ${heartColor}`}>
                            <Heart
                              size={20}
                              fill={book.isFavorite ? 'currentColor' : 'none'}
                              strokeWidth={1.5}
                            />
                          </div>
                        </div>
                        <div className="px-3 pb-3">
                          <div className={`rounded-xl overflow-hidden shadow-inner ${darkMode ? 'bg-zinc-900/50' : 'bg-white'} aspect-[3/4]`}>
                            <img
                              src={book.coverUrl}
                              alt={book.name}
                              className="w-full h-full object-contain bg-black/5 transition-transform duration-500 group-hover:scale-105"
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Featured Flipbooks - Variant 1: Infinite Carousel Style */}
        {featuredBooks.length > 0 && variant === 1 && (() => {
          const bookWidth = 224;
          const gap = 32;
          const totalWidth = featuredBooks.length * (bookWidth + gap);

          return (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="relative pb-16 pt-8 overflow-hidden"
            >
              <div className="text-center mb-8">
                <p className={`text-xs uppercase tracking-[0.3em] font-medium ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                  FEATURED FLIPBOOKS
                </p>
              </div>

              <div
                className="relative w-full overflow-hidden"
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => {
                  setIsCarouselPaused(false);
                  setHoveredBookId(null);
                }}
              >
                {/* Gradient Fade Edges */}
                <div className={`absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r ${darkMode ? 'from-[#0a0a12]/80' : 'from-white/60'} to-transparent`} />
                <div className={`absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-l ${darkMode ? 'from-[#0a0a12]/80' : 'from-white/60'} to-transparent`} />

                <div
                  className="flex items-center gap-8 py-8 pl-8"
                  style={{
                    animation: `carouselScroll ${featuredBooks.length * 4}s linear infinite`,
                    animationPlayState: isCarouselPaused ? 'paused' : 'running',
                    width: 'fit-content',
                  }}
                >
                  {[...featuredBooks, ...featuredBooks, ...featuredBooks].map((book, index) => {
                    const isHovered = hoveredBookId === `${book.id}-${index}`;

                    return (
                      <button
                        key={`${book.id}-${index}`}
                        onClick={() => onSelectBook(book)}
                        className="group flex-shrink-0 transition-all duration-300 ease-out"
                        style={{
                          transform: isHovered ? 'scale(1.1) translateY(-20px)' : 'scale(1) translateY(0)',
                          zIndex: isHovered ? 50 : 1,
                        }}
                        onMouseEnter={() => setHoveredBookId(`${book.id}-${index}`)}
                        onMouseLeave={() => setHoveredBookId(null)}
                      >
                        <div className="relative">
                          <div
                            className={`absolute inset-2 bg-black/30 rounded-xl blur-xl transition-all duration-300 ${isHovered ? 'translate-y-6 scale-105 opacity-60' : 'translate-y-4 opacity-40'
                              }`}
                          />
                          <div className={`relative w-40 sm:w-48 md:w-56 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${isHovered
                            ? (darkMode ? 'ring-4 ring-white/30 bg-zinc-900/80' : 'ring-4 ring-black/20 bg-gray-100')
                            : (darkMode ? 'ring-1 ring-white/10 bg-zinc-900/50' : 'ring-1 ring-black/10 bg-gray-50')
                            } aspect-[2/3]`}>
                            <img
                              src={book.coverUrl}
                              alt={book.name}
                              className={`w-full h-full object-contain bg-black/5 transition-transform duration-500 ${isHovered ? 'scale-110' : 'scale-100'
                                }`}
                            />
                            <div className={`absolute inset-0 transition-opacity duration-300 flex flex-col justify-end p-4 ${isHovered ? 'opacity-100' : 'opacity-0'
                              } ${darkMode ? 'bg-gradient-to-t from-black/80 via-black/20 to-transparent' : 'bg-gradient-to-t from-white/95 via-white/40 to-white/10'}`}>
                              <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {book.name.replace('.pdf', '').replace(/_/g, ' ')}
                              </p>
                              <p className={`text-xs mt-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {book.totalPages} pages
                              </p>
                            </div>
                            {book.isFavorite && (
                              <div className="absolute top-3 right-3 p-2 bg-black/40 backdrop-blur-md rounded-full">
                                <Heart size={14} fill="white" className="text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <style>{`
                  @keyframes carouselScroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-${totalWidth}px); }
                  }
                `}</style>
              </div>
            </motion.div>
          );
        })()}

        {/* Empty state when no books */}
        {featuredBooks.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="relative px-6 pb-16 pt-4"
          >
            <div className="flex justify-center items-center h-[280px]">
              <div className="text-center">
                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No flipbooks yet</p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onUpload}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium border transition-all mx-auto ${darkMode
                    ? 'bg-[#2A2A2D] hover:bg-[#353538] text-white border-gray-600'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
                    }`}
                >
                  <UploadCloud size={18} />
                  Upload your first PDF
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Home;
