import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface OpeningTransitionProps {
  isOpen: boolean;
  coverUrl?: string;
  bookName?: string;
  darkMode?: boolean;
}

const OpeningTransition: React.FC<OpeningTransitionProps> = ({ 
  isOpen, 
  coverUrl, 
  bookName, 
  darkMode = true 
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      // Ensure the transition is visible for at least 800ms to avoid 'flicker' on fast loads
      const timer = setTimeout(() => setShouldRender(false), 500); 
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[500] flex items-center justify-center transition-all duration-500 ease-out ${
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Heavy Backdrop Blur Overlay */}
      <div className={`absolute inset-0 backdrop-blur-3xl ${
        darkMode ? 'bg-[#0a0a0c]/80' : 'bg-white/80'
      }`} />

      {/* Glossy Core Container */}
      <div className={`relative flex flex-col items-center max-w-sm w-full p-8 transition-transform duration-700 ${
        isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
      }`}>
        
        {/* Animated Glow behind the cover */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-80 bg-lime-500/10 blur-[100px] rounded-full animate-pulse" />

        {/* The Cover Placeholder */}
        <div className="relative group perspective-1000 shadow-2xl shadow-black/50 rounded-lg overflow-hidden border border-white/10 mb-8 bg-[#141418]">
          {coverUrl ? (
            <img 
              src={coverUrl} 
              alt="Loading Book" 
              className="w-48 sm:w-64 h-auto object-contain transition-transform duration-500 hover:scale-105"
            />
          ) : (
            <div className="w-48 sm:w-64 h-72 flex items-center justify-center bg-zinc-900">
               <Loader2 className="animate-spin text-zinc-700" size={32} />
            </div>
          )}
          
          {/* Subtle Shine Effect over cover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Loading Info */}
        <div className="text-center">
          <h2 className={`text-xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-zinc-900'}`}>
            {bookName || 'Preparing Book'}
          </h2>
          <div className="flex items-center justify-center gap-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-lime-500 rounded-full animate-bounce"></span>
            </div>
            <span className={`text-xs font-medium uppercase tracking-[0.2em] ${darkMode ? 'text-zinc-500' : 'text-zinc-400'}`}>
              Parsing Content
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Loading Bar (Seamless feel) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-48 h-1 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full bg-lime-500 w-1/3 rounded-full animate-[loading_2s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default OpeningTransition;
