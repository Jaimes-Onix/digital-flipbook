import React, { useState, Suspense } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { UploadCloud, ChevronRight, Heart } from 'lucide-react';
import { LibraryBook } from '../types';
import { ConveyorBelt } from './3d/ConveyorBelt';

interface HomeProps {
  books: LibraryBook[];
  darkMode: boolean;
  variant?: 1 | 2;
  onUpload: () => void;
  onBrowseLibrary: () => void;
  onSelectBook: (book: LibraryBook) => void;
}

const Home: React.FC<HomeProps> = ({ books, darkMode, variant = 1, onUpload, onBrowseLibrary, onSelectBook }) => {
  const featuredBooks = books.slice(0, 5);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [hoveredBookId, setHoveredBookId] = useState<string | null>(null);

  // Calculate rotation and position for fanned card effect - spread fan, not circular
  const getCardStyle = (index: number, total: number) => {
    const center = Math.floor(total / 2);
    const offset = index - center;
    const rotation = offset * 8; // degrees - gentler rotation for spread fan
    const translateY = Math.abs(offset) * 25; // pixels - subtle vertical offset
    const translateX = offset * 120; // horizontal spread
    const baseZIndex = total - Math.abs(offset); // center card has highest z-index
    
    return {
      translateX,
      translateY,
      rotation,
      zIndex: baseZIndex,
      transform: `translateX(${translateX}px) translateY(${translateY}px) rotate(${rotation}deg)`,
    };
  };

  return (
    <div className={`min-h-full w-full overflow-hidden transition-colors duration-300 relative ${darkMode ? 'bg-[#1A1A1D] text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      {/* Animated Gradient Background */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${darkMode ? 'opacity-30' : 'opacity-20'}`}
        style={{
          background: darkMode 
            ? 'radial-gradient(ellipse at 20% 30%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)'
            : 'radial-gradient(ellipse at 20% 30%, rgba(139, 92, 246, 0.2) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 50%)',
        }}
      />

      {/* 3D Conveyor Belt Background */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: darkMode ? 0.5 : 0.7 }}>
        <Canvas 
          camera={{ position: [0, 2, 8], fov: 50 }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} color="#ffffff" />
          <directionalLight position={[-5, 5, 5]} intensity={0.5} color="#f0abfc" />
          <Suspense fallback={null}>
            <ConveyorBelt darkMode={darkMode} />
          </Suspense>
        </Canvas>
      </div>

      {/* Animated Gradient Orbs */}
      <motion.div
        animate={{
          x: [0, 30, 0],
          y: [0, -20, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-blue-500/10' : 'bg-purple-500/10'}`}
      />
      <motion.div
        animate={{
          x: [0, -20, 0],
          y: [0, 30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl pointer-events-none ${darkMode ? 'bg-purple-500/10' : 'bg-blue-500/10'}`}
      />

      {/* Subtle dot pattern background */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: darkMode 
            ? `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)`
            : `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.04) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Animated Decorative stars/sparkles */}
      <motion.div 
        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-20 left-20 text-2xl ${darkMode ? 'text-blue-400/50' : 'text-purple-400/50'}`}
      >✦</motion.div>
      <motion.div 
        animate={{ rotate: -360, scale: [1, 1.3, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-32 right-32 text-lg ${darkMode ? 'text-purple-400/50' : 'text-blue-400/50'}`}
      >✦</motion.div>
      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-1/3 left-16 text-sm ${darkMode ? 'text-cyan-400/40' : 'text-pink-400/40'}`}
      >✦</motion.div>
      <motion.div 
        animate={{ y: [0, 10, 0], rotate: 180 }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute top-1/4 right-1/4 text-xl ${darkMode ? 'text-pink-400/40' : 'text-cyan-400/40'}`}
      >✦</motion.div>
      <motion.div 
        animate={{ scale: [1, 1.5, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute bottom-1/3 left-1/3 text-base ${darkMode ? 'text-blue-400/30' : 'text-purple-400/30'}`}
      >✦</motion.div>

      <div className="relative z-10 flex flex-col min-h-full">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-6xl tracking-tight max-w-4xl leading-tight mb-6"
          >
            <span className="font-light italic">Welcome to</span>{' '}
            <motion.span 
              className={`font-bold not-italic bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? 'from-blue-400 via-purple-400 to-pink-400' : 'from-purple-600 via-blue-600 to-cyan-600'}`}
              animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
              transition={{ duration: 5, repeat: Infinity }}
            >
              Lifewood PH:
            </motion.span>
            <br />
            <span className="font-light italic">Your Digital Flipbook Gallery</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className={`text-base sm:text-lg max-w-xl mb-10 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            Transform your PDFs into premium digital flipbooks. Create, organize, and share your documents in a beautiful 
            flipbook experience where professional publishing meets modern design.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: darkMode ? "0 20px 40px rgba(0,0,0,0.4)" : "0 20px 40px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onUpload}
              className={`flex items-center gap-2 px-7 py-3.5 rounded-full font-medium transition-all shadow-xl border ${
                darkMode 
                  ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-black/30 border-gray-200' 
                  : 'bg-black text-white hover:bg-gray-800 shadow-gray-300/50 border-black'
              }`}
            >
              Upload PDF
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onBrowseLibrary}
              className={`flex items-center gap-2 px-7 py-3.5 rounded-full font-medium border transition-all ${
                darkMode 
                  ? 'bg-[#2A2A2D] hover:bg-[#353538] text-white border-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300'
              }`}
            >
              Discover Library
              <ChevronRight size={18} />
            </motion.button>
          </motion.div>
        </div>

        {/* Featured Flipbooks - Variant 1: Card Style */}
        {featuredBooks.length > 0 && variant === 1 && (
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
                  // Cards are OPPOSITE color: dark mode = light cards, light mode = dark cards
                  const cardBg = darkMode ? 'bg-[#E8E8E8]' : 'bg-[#2A2A2D]';
                  const cardTextColor = darkMode ? 'text-gray-900' : 'text-white';
                  const cardSubTextColor = darkMode ? 'text-amber-600' : 'text-amber-400';
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
                      {/* Card Container - Opposite color based on mode */}
                      <div className={`w-44 sm:w-52 ${cardBg} rounded-[24px] overflow-hidden shadow-2xl ${shadowColor} transition-all duration-500 ${hoverShadow}`}>
                        {/* Card Header - Title and Heart */}
                        <div className="px-4 pt-4 pb-2 flex justify-between items-start gap-2">
                          <div className="text-left flex-1 min-w-0">
                            <p className={`${cardTextColor} text-sm font-bold truncate leading-tight`}>
                              {book.name.replace('.pdf', '')}
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
                        
                        {/* Card Image */}
                        <div className="px-3 pb-3">
                          <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-inner">
                            <img
                              src={book.coverUrl}
                              alt={book.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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

        {/* Featured Flipbooks - Variant 2: Infinite Carousel Style */}
        {featuredBooks.length > 0 && variant === 2 && (() => {
          // Calculate total width for one set of books (book width + gap)
          const bookWidth = 224; // w-56 = 14rem = 224px
          const gap = 32; // gap-8 = 2rem = 32px
          const totalWidth = featuredBooks.length * (bookWidth + gap);
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
              className="relative pb-16 pt-8 overflow-hidden"
            >
              {/* Section Title */}
              <div className="text-center mb-8">
                <p className={`text-xs uppercase tracking-[0.3em] font-medium ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  FEATURED FLIPBOOKS
                </p>
              </div>
              
              {/* Infinite Scrolling Carousel */}
              <div 
                className="relative w-full overflow-hidden"
                onMouseEnter={() => setIsCarouselPaused(true)}
                onMouseLeave={() => {
                  setIsCarouselPaused(false);
                  setHoveredBookId(null);
                }}
              >
                {/* Gradient Fade Edges */}
                <div className={`absolute left-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-r ${darkMode ? 'from-[#1A1A1D]' : 'from-[#F5F5F7]'} to-transparent`} />
                <div className={`absolute right-0 top-0 bottom-0 w-32 z-10 pointer-events-none bg-gradient-to-l ${darkMode ? 'from-[#1A1A1D]' : 'from-[#F5F5F7]'} to-transparent`} />
                
                {/* Scrolling Track */}
                <div 
                  className="flex items-center gap-8 py-8 pl-8"
                  style={{
                    animation: `carouselScroll ${featuredBooks.length * 4}s linear infinite`,
                    animationPlayState: isCarouselPaused ? 'paused' : 'running',
                    width: 'fit-content',
                  }}
                >
                  {/* Duplicate books for seamless loop */}
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
                        {/* Book Cover */}
                        <div className="relative">
                          {/* Shadow */}
                          <div 
                            className={`absolute inset-2 bg-black/30 rounded-xl blur-xl transition-all duration-300 ${
                              isHovered ? 'translate-y-6 scale-105 opacity-60' : 'translate-y-4 opacity-40'
                            }`} 
                          />
                          
                          {/* Book */}
                          <div className={`relative w-40 sm:w-48 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl transition-all duration-300 ${
                            isHovered ? 'ring-4 ring-white/30' : 'ring-1 ring-white/10'
                          }`}>
                            <img
                              src={book.coverUrl}
                              alt={book.name}
                              className={`w-full h-full object-cover transition-transform duration-500 ${
                                isHovered ? 'scale-110' : 'scale-100'
                              }`}
                            />
                            
                            {/* Hover overlay with info */}
                            <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 flex flex-col justify-end p-4 ${
                              isHovered ? 'opacity-100' : 'opacity-0'
                            }`}>
                              <p className="text-white text-sm font-semibold truncate">
                                {book.name.replace('.pdf', '')}
                              </p>
                              <p className="text-gray-300 text-xs mt-1">
                                {book.totalPages} pages
                              </p>
                            </div>
                            
                            {/* Favorite indicator */}
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
                
                {/* CSS Animation - Dynamic based on book count */}
                <style>{`
                  @keyframes carouselScroll {
                    0% {
                      transform: translateX(0);
                    }
                    100% {
                      transform: translateX(-${totalWidth}px);
                    }
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
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium border transition-all mx-auto ${
                    darkMode 
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
