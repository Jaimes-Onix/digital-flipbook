import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, User, Library as LibraryIcon, Search, Settings } from 'lucide-react';
import PWAHandler from '../PWAHandler';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('library');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col font-sans selection:bg-[#ccff00]/30 overflow-hidden">
      <PWAHandler />
      
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#09090b] flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="absolute inset-0 bg-[#ccff00]/20 blur-[50px] rounded-full animate-pulse" />
              <img src="/Digital Logo.png" alt="Logo" className="w-32 h-32 relative z-10 drop-shadow-2xl" />
            </motion.div>
            
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mt-8 tracking-tight"
            >
              PH LifeBook <span className="text-[#ccff00]">Mobile</span>
            </motion.h1>
            
            <div className="mt-12 w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "0%" }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="w-full h-full bg-gradient-to-r from-transparent via-[#ccff00] to-transparent"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="px-6 pt-12 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Explore</h1>
            <p className="text-white/50 text-sm mt-0.5 font-medium">Your Digital Library</p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <User className="w-5 h-5 text-white/50" />
          </button>
        </div>
        
        {/* Search Bar */}
        <div className="mt-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input 
            type="text" 
            placeholder="Search Books..." 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-[#ccff00]/50 transition-colors placeholder:text-white/20"
          />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 py-4 overflow-y-auto no-scrollbar pb-32">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Recently Opened</h2>
            <span className="text-[#ccff00] text-xs font-bold uppercase tracking-wider">See All</span>
          </div>
          
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shrink-0 w-40 group select-none">
                <div className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative active:scale-95 transition-transform">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                    <span className="text-xs font-medium text-white/90 line-clamp-2">Example Flipbook Name {i}</span>
                    <span className="text-[10px] text-white/50 mt-1 uppercase tracking-tight">Portrait Mode</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold mb-4">Categories</h2>
          <div className="grid grid-cols-2 gap-3">
            {['Magazines', 'Catalogs', 'Reports', 'Portfolios'].map((cat) => (
              <div key={cat} className="p-4 rounded-3xl bg-white/5 border border-white/10 flex flex-col gap-3 active:bg-white/10 transition-colors">
                <div className="w-8 h-8 rounded-xl bg-[#ccff00]/10 flex items-center justify-center">
                   <BookOpen className="w-4 h-4 text-[#ccff00]" />
                </div>
                <span className="text-sm font-semibold">{cat}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Custom Tab Bar */}
      <nav className="fixed bottom-0 left-0 w-full bg-[#09090b]/80 backdrop-blur-2xl border-t border-white/10 px-6 pt-3 pb-10 z-[50]">
        <div className="flex items-center justify-between">
          {[
            { id: 'library', icon: LibraryIcon, label: 'Library' },
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'favorites', icon: BookOpen, label: 'Favorites' },
            { id: 'settings', icon: Settings, label: 'Settings' }
          ].map((tab) => (
            <button 
              key={tab.id}
               onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === tab.id ? 'text-[#ccff00]' : 'text-white/40'}`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'scale-110' : 'scale-100'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;
