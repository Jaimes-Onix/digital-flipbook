import React, { useState, useMemo } from 'react';
import { Plus, Trash2, X, Check, Heart } from 'lucide-react';
import { LibraryBook } from '../types';
import type { LibraryFilter } from './Sidebar';

const SECTION_TITLES: Record<LibraryFilter, string> = {
  all: 'Your Library',
  favorites: 'Favorite Flipbooks',
  philippines: 'Philippines Flipbooks',
  internal: 'Internal Flipbooks',
  international: 'International Flipbooks',
  ph_interns: 'PH Interns Flipbooks',
  deseret: 'Deseret Flipbooks',
  angelhost: 'Angelhost Flipbooks',
};

interface LibraryProps {
  books: LibraryBook[];
  filter: LibraryFilter;
  darkMode?: boolean;
  onSelectBook: (book: LibraryBook) => void;
  onAddNew: () => void;
  onRemoveBook: (id: string) => void;
}

const Library: React.FC<LibraryProps> = ({ books, filter, darkMode = false, onSelectBook, onAddNew, onRemoveBook }) => {
  const filteredBooks = useMemo(() => {
    if (filter === 'all') return books;
    if (filter === 'favorites') return books.filter(b => b.isFavorite);
    return books.filter(b => b.category === filter);
  }, [books, filter]);
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);

  const handleBookClick = (book: LibraryBook) => {
    if (openingBookId || confirmingDeleteId) return;

    // Start animation
    setOpeningBookId(book.id);

    // Delay the actual transition to allow the animation to play
    setTimeout(() => {
      onSelectBook(book);
      // Reset state so that if the modal is closed, the library is interactive again
      setOpeningBookId(null);
    }, 600);
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setConfirmingDeleteId(id);
  };

  const cancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmingDeleteId(null);
  };

  const confirmDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onRemoveBook(id);
    setConfirmingDeleteId(null);
  };

  return (
    <div className={`w-full max-w-7xl mx-auto px-6 py-12 transition-all duration-500 ${openingBookId ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
      <div className="flex items-center justify-between mb-12">
        <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{SECTION_TITLES[filter]}</h2>
        <button
          onClick={onAddNew}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all active:scale-95 shadow-lg text-sm font-medium ${darkMode
              ? 'bg-white text-black hover:bg-gray-200 shadow-white/10'
              : 'bg-black text-white hover:bg-gray-800 shadow-black/10'
            }`}
        >
          <Plus size={18} />
          Add PDF
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-8 gap-y-12">
        {filteredBooks.map((book) => {
          const isOpening = openingBookId === book.id;
          const isConfirming = confirmingDeleteId === book.id;

          return (
            <div
              key={book.id}
              className={`group cursor-pointer perspective-1000 ${isOpening ? 'z-50 pointer-events-none' : 'z-10'}`}
              onClick={() => handleBookClick(book)}
            >
              <div className={`relative aspect-[3/4] mb-4 transition-all duration-500 ${isOpening ? 'animate-zoom-forward' : ''}`}>

                {/* Book 3D Effect Container */}
                <div className={`w-full h-full relative transition-transform duration-500 ease-out 
                  ${!isOpening && !isConfirming ? 'group-hover:-translate-y-2 group-hover:rotate-y-[-12deg]' : ''} 
                  shadow-xl group-hover:shadow-2xl rounded-sm overflow-hidden bg-white`}
                >
                  {/* Book Spine Shadow */}
                  <div className="absolute inset-y-0 left-0 w-2.5 bg-black/20 z-10" />

                  {/* Cover Image */}
                  <img
                    src={book.coverUrl}
                    alt={book.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* Edge Lighting */}
                  <div className="absolute inset-0 border-l border-white/30 z-20 pointer-events-none" />

                  {/* Favorite indicator */}
                  {book.isFavorite && (
                    <div className="absolute top-2 left-2 p-2 bg-black/40 backdrop-blur-md text-red-400 rounded-full z-20" title="Favorite">
                      <Heart size={12} fill="currentColor" />
                    </div>
                  )}

                  {/* Remove Button (Hover state) */}
                  {!isConfirming && !isOpening && (
                    <button
                      onClick={(e) => initiateDelete(e, book.id)}
                      className="absolute top-2 right-2 p-2.5 bg-black/40 hover:bg-red-500 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-30"
                      title="Remove Book"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  {/* Confirmation Overlay */}
                  {isConfirming && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 text-center animate-in fade-in duration-300">
                      <p className="text-white text-[10px] font-black mb-4 uppercase tracking-widest">Delete Book?</p>
                      <div className="flex gap-3">
                        <button
                          onClick={(e) => confirmDelete(e, book.id)}
                          className="p-3 bg-red-600 text-white rounded-full hover:bg-red-500 transition-all active:scale-90 shadow-lg shadow-red-900/40"
                          title="Confirm Delete"
                        >
                          <Check size={20} strokeWidth={3} />
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-all active:scale-90"
                          title="Cancel"
                        >
                          <X size={20} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`space-y-1 transition-all duration-300 ${openingBookId ? 'opacity-0 translate-y-2' : 'opacity-100'}`}>
                <h3 className={`text-sm font-semibold line-clamp-1 group-hover:text-blue-500 transition-colors ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {book.name.replace('.pdf', '')}
                </h3>
                <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {book.totalPages} Pages
                </p>
              </div>
            </div>
          );
        })}

        {/* Empty State / Add Card */}
        {filteredBooks.length === 0 && (
          <button
            onClick={onAddNew}
            className={`group aspect-[3/4] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 ${darkMode
                ? 'border-gray-700 text-gray-500 hover:border-blue-500 hover:bg-blue-900/20 hover:text-blue-400'
                : 'border-gray-200 text-gray-400 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-600'
              }`}
          >
            <div className={`p-5 rounded-full group-hover:scale-110 transition-all ${darkMode
                ? 'bg-gray-800 group-hover:bg-blue-900/30'
                : 'bg-gray-50 group-hover:bg-blue-100'
              }`}>
              <Plus size={36} strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <span className="block text-sm font-bold">
                {filter === 'all' && books.length === 0 ? 'Add first book' : `No ${SECTION_TITLES[filter].toLowerCase()} yet`}
              </span>
              <span className="text-[10px] uppercase tracking-widest opacity-60">Upload PDF</span>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default Library;