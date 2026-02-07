import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Library as LibraryIcon, Menu, LayoutGrid, Layers } from 'lucide-react';

// Recreated Lifewood logo as inline SVG (open book + hexagonal emblem)
const LifewoodLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg viewBox="0 0 100 72" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <mask id="lw-book-pages">
        <rect width="100" height="72" fill="white"/>
        {/* Page groove lines - cut into the filled book to show page layers */}
        <path d="M50 16 C40 9, 24 7, 15 14 L15 55 C24 62, 40 58, 50 66" stroke="black" strokeWidth="1.2" fill="none"/>
        <path d="M50 16 C44 11, 34 10, 26 15 L26 56 C34 62, 44 59, 50 66" stroke="black" strokeWidth="1.2" fill="none"/>
        <path d="M50 16 C60 9, 76 7, 85 14 L85 55 C76 62, 60 58, 50 66" stroke="black" strokeWidth="1.2" fill="none"/>
        <path d="M50 16 C56 11, 66 10, 74 15 L74 56 C66 62, 56 59, 50 66" stroke="black" strokeWidth="1.2" fill="none"/>
      </mask>
    </defs>
    {/* Filled book silhouette with hexagonal cutout and page grooves */}
    <path 
      fillRule="evenodd"
      clipRule="evenodd"
      d="M50 16 C34 7, 10 5, 2 14 L2 54 C10 63, 34 57, 50 66 C66 57, 90 63, 98 54 L98 14 C90 5, 66 7, 50 16 Z M50 21 L67 30.5 L67 49.5 L50 59 L33 49.5 L33 30.5 Z"
      fill="currentColor"
      mask="url(#lw-book-pages)"
    />
    {/* Outer hexagon */}
    <polygon points="50,22 66,31 66,49 50,58 34,49 34,31" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" fill="none"/>
    {/* Inner hexagon */}
    <polygon points="50,30 58.5,35 58.5,45 50,50 41.5,45 41.5,35" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
    {/* 3D cube connecting lines between hexagons */}
    <line x1="34" y1="31" x2="41.5" y2="35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="66" y1="31" x2="58.5" y2="35" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="34" y1="49" x2="41.5" y2="45" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
    <line x1="66" y1="49" x2="58.5" y2="45" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
  </svg>
);

interface HeaderProps {
  view: 'home' | 'library' | 'reader' | 'upload';
  darkMode: boolean;
  homeVariant?: 1 | 2;
  onToggleHomeVariant?: () => void;
  onToggleSidebar?: () => void;
  fileName?: string;
}

const Header: React.FC<HeaderProps> = ({ view, darkMode, homeVariant = 1, onToggleHomeVariant, onToggleSidebar, fileName }) => {
  const navigate = useNavigate();
  return (
    <header className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 transition-all duration-300 ${
      darkMode 
        ? 'bg-[#0D0D0F]/60 backdrop-blur-xl border-b border-gray-800/50' 
        : 'bg-white/50 backdrop-blur-xl border-b border-gray-200/30'
    }`}>
      <div className="flex items-center gap-3">
        {view !== 'reader' && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`lg:hidden p-2 -ml-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="Toggle menu"
          >
            <Menu size={24} strokeWidth={2} />
          </button>
        )}
        <LifewoodLogo className={`w-8 h-8 ${darkMode ? 'text-white' : 'text-gray-900'}`} />
        <span className={`font-semibold tracking-tight text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Lifewood PH
        </span>
      </div>

      <div className="flex items-center gap-3">
        {view !== 'upload' && (
          <>
            {view !== 'home' && (
              <button
                onClick={() => navigate('/')}
                className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <span>Home</span>
              </button>
            )}
            <button
              onClick={() => navigate('/library')}
              className={`flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                view === 'library' 
                  ? darkMode ? 'bg-white text-black' : 'bg-black text-white' 
                  : darkMode ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <LibraryIcon size={16} />
              <span>My Books</span>
            </button>
            
            {/* Home Variant Toggle */}
            {view === 'home' && onToggleHomeVariant && (
              <div className={`flex items-center rounded-full p-1 ${darkMode ? 'bg-gray-800/50' : 'bg-gray-200/50'}`}>
                <button
                  onClick={homeVariant === 1 ? undefined : onToggleHomeVariant}
                  className={`p-2 rounded-full transition-all ${
                    homeVariant === 1
                      ? darkMode ? 'bg-white text-black' : 'bg-black text-white'
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Card View"
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={homeVariant === 2 ? undefined : onToggleHomeVariant}
                  className={`p-2 rounded-full transition-all ${
                    homeVariant === 2
                      ? darkMode ? 'bg-white text-black' : 'bg-black text-white'
                      : darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Showcase View"
                >
                  <Layers size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};

export default Header;