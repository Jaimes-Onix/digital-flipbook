import React, { useState, useMemo } from 'react';
import { Plus, Trash2, X, Check, Heart, Link2, Video } from 'lucide-react';
import { LibraryBook, CustomCategory } from '../types';
import type { LibraryFilter } from './Sidebar';
import ShareLinkModal from './ShareLinkModal';
import VideoLinksModal from './VideoLinksModal';
import VideoGalleryModal from './VideoGalleryModal';



const BUILTIN_TITLES: Record<string, string> = {
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
  isLoading?: boolean;
  customCategories?: CustomCategory[];
  onSelectBook: (book: LibraryBook) => void;
  onAddNew: () => void;
  onRemoveBook: (id: string) => void;
}

const Library: React.FC<LibraryProps> = ({ books, filter, darkMode = false, isLoading = false, customCategories = [], onSelectBook, onAddNew, onRemoveBook }) => {
  const filteredBooks = useMemo(() => {
    if (filter === 'all') return books;
    if (filter === 'favorites') return books.filter(b => b.isFavorite);
    return books.filter(b => b.category === filter);
  }, [books, filter]);

  // Resolve title: built-in, or from custom categories list, or fallback
  const customTitle = customCategories.find(c => c.slug === filter)?.name;
  const sectionTitle = BUILTIN_TITLES[filter] || (customTitle ? `${customTitle} Flipbooks` : `${filter} Flipbooks`);
  const [openingBookId, setOpeningBookId] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showVideoLinksModal, setShowVideoLinksModal] = useState(false);
  const [showVideoGallery, setShowVideoGallery] = useState(false);

  // Share slug: any non-special filter is a shareable category (built-in or user-created)
  const shareSlug = (filter !== 'all' && filter !== 'favorites') ? filter : undefined;

  const handleBookClick = (book: LibraryBook) => {
    if (openingBookId || confirmingDeleteId) return;
    setOpeningBookId(book.id);
    setTimeout(() => { onSelectBook(book); setOpeningBookId(null); }, 600);
  };

  const initiateDelete = (e: React.MouseEvent, id: string) => { e.stopPropagation(); setConfirmingDeleteId(id); };
  const cancelDelete = (e: React.MouseEvent) => { e.stopPropagation(); setConfirmingDeleteId(null); };
  const confirmDelete = (e: React.MouseEvent, id: string) => { e.stopPropagation(); onRemoveBook(id); setConfirmingDeleteId(null); };

  return (
    <div className={`w-full max-w-7xl mx-auto px-6 py-12 transition-all duration-500 ${openingBookId ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}>
      <div className="flex items-center justify-between mb-12">
        <div>
          <h2 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{sectionTitle}</h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>{filteredBooks.length} book{filteredBooks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3">
          {shareSlug && (
            <button
              onClick={() => setShowShareModal(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all active:scale-95 text-sm font-medium shadow-lg ${darkMode
                ? 'bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.08] shadow-black/20'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
                }`}
            >
              <Link2 size={16} />
              Share Category
            </button>
          )}
          {shareSlug && (
            <button
              onClick={() => setShowVideoGallery(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all active:scale-95 text-sm font-medium shadow-lg ${darkMode
                ? 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 border border-violet-500/30 shadow-black/20'
                : 'bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200'
                }`}
            >
              <Video size={16} />
              Video Links
            </button>
          )}
          <button
            onClick={onAddNew}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all active:scale-95 text-sm font-medium shadow-lg ${darkMode
              ? 'bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.08] shadow-black/20'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200'
              }`}
          >
            <Plus size={16} />
            Add PDF
          </button>
        </div>
      </div>

      {/* Skeleton loading */}
      {isLoading && filteredBooks.length === 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className={`aspect-[3/4] rounded-2xl mb-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`} />
              <div className={`h-3 rounded-full w-3/4 mb-2 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`} />
              <div className={`h-2 rounded-full w-1/2 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`} />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
        {filteredBooks.map((book) => {
          const isOpening = openingBookId === book.id;
          const isConfirming = confirmingDeleteId === book.id;

          return (
            <div
              key={book.id}
              className={`group cursor-pointer perspective-1000 ${isOpening ? 'z-50 pointer-events-none' : 'z-10'} col-span-1`}
              onClick={() => handleBookClick(book)}
            >
              <div className={`relative mb-3 transition-all duration-500 ${isOpening ? 'animate-zoom-forward' : ''} aspect-[3/4]`}>
                <div className={`w-full h-full relative transition-all duration-500 ease-out rounded-2xl overflow-hidden
                  ${!isOpening && !isConfirming ? 'group-hover:-translate-y-2 group-hover:scale-[1.02]' : ''}
                  ${darkMode ? 'border border-white/[0.06] group-hover:border-white/[0.12] bg-zinc-900/50' : 'border border-gray-200 group-hover:border-gray-300 bg-gray-100'}
                  ${darkMode ? 'shadow-lg shadow-black/30 group-hover:shadow-xl group-hover:shadow-black/40' : 'shadow-lg shadow-gray-200/60 group-hover:shadow-xl group-hover:shadow-gray-200/80'}
                `}>
                  {/* Cover Image */}
                  <img src={book.coverUrl} alt={book.name} className="w-full h-full object-contain bg-black/5" loading="lazy" />

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Favorite */}
                  {book.isFavorite && (
                    <div className="absolute top-2.5 left-2.5 p-1.5 bg-black/40 backdrop-blur-md text-red-400 rounded-full z-20">
                      <Heart size={12} fill="currentColor" />
                    </div>
                  )}

                  {/* Remove Button */}
                  {!isConfirming && !isOpening && (
                    <button
                      onClick={(e) => initiateDelete(e, book.id)}
                      className="absolute top-2.5 right-2.5 p-2 bg-black/40 hover:bg-red-500/80 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 z-30"
                      title="Remove"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  {/* Delete Confirmation */}
                  {isConfirming && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-white text-[10px] font-bold mb-4 uppercase tracking-widest">Delete?</p>
                      <div className="flex gap-3">
                        <button onClick={(e) => confirmDelete(e, book.id)} className="p-2.5 bg-red-600 text-white rounded-full hover:bg-red-500 transition-all active:scale-90 shadow-lg">
                          <Check size={18} strokeWidth={3} />
                        </button>
                        <button onClick={cancelDelete} className="p-2.5 bg-white/15 text-white rounded-full hover:bg-white/25 transition-all active:scale-90">
                          <X size={18} strokeWidth={3} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={`space-y-1 transition-all duration-300 ${openingBookId ? 'opacity-0 translate-y-2' : 'opacity-100'}`}>
                <h3 className={`text-sm font-medium line-clamp-1 transition-colors ${darkMode ? 'text-zinc-200 group-hover:text-white' : 'text-gray-800 group-hover:text-gray-900'
                  }`}>
                  {book.name.replace('.pdf', '')}
                </h3>
                <p className={`text-[10px] font-medium uppercase tracking-[0.12em] ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                  {book.totalPages} Pages
                </p>
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredBooks.length === 0 && !isLoading && (
          <button
            onClick={onAddNew}
            className={`group aspect-[3/4] border border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all duration-300 hover:bg-emerald-500/[0.03] ${darkMode ? 'border-white/[0.08] hover:border-emerald-500/30' : 'border-gray-200 hover:border-emerald-400'
              }`}
          >
            <div className="p-5 rounded-full bg-white/[0.03] group-hover:bg-emerald-500/10 group-hover:scale-110 transition-all">
              <Plus size={32} strokeWidth={1.5} className={`group-hover:text-emerald-500 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`} />
            </div>
            <div className="text-center">
              <span className={`block text-sm font-medium ${darkMode ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-gray-500 group-hover:text-gray-300'
                }`}>
                {filter === 'all' && books.length === 0 ? 'Add first book' : `No books yet`}
              </span>
              <span className={`text-[10px] uppercase tracking-widest ${darkMode ? 'text-zinc-700' : 'text-gray-300'}`}>Upload PDF</span>
            </div>
          </button>
        )}
      </div>

      {shareSlug && (
        <ShareLinkModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          linkType="category"
          target={shareSlug}
          title={`Share ${sectionTitle}`}
          description="Anyone with this link can view and read these flipbooks."
          darkMode={darkMode || false}
        />
      )}

      {shareSlug && (
        <VideoLinksModal
          isOpen={showVideoLinksModal}
          onClose={() => setShowVideoLinksModal(false)}
          onBack={() => { setShowVideoLinksModal(false); setShowVideoGallery(true); }}
          categorySlug={shareSlug}
          categoryName={sectionTitle}
          darkMode={darkMode || false}
        />
      )}

      {shareSlug && (
        <VideoGalleryModal
          isOpen={showVideoGallery}
          onClose={() => setShowVideoGallery(false)}
          categorySlug={shareSlug}
          categoryName={sectionTitle}
          darkMode={darkMode || false}
          onAddVideo={() => { setShowVideoGallery(false); setShowVideoLinksModal(true); }}
        />
      )}
    </div>
  );
};

export default Library;
