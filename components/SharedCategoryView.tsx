import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Moon, Sun, ArrowLeft, Search } from 'lucide-react';
import BookViewer from './BookViewer';
import VantaFogBackground from './VantaFogBackground';
import { getDocument } from '../utils/pdfUtils';
import { loadBooksByCategory } from '../src/lib/bookStorage';
import type { LibraryBook, BookCategory, BookRef } from '../types';

const CATEGORY_MAP: Record<string, { dbValue: BookCategory; displayName: string; color: string }> = {
  'philippines': { dbValue: 'philippines', displayName: 'Philippines', color: '#3B82F6' },
  'internal': { dbValue: 'internal', displayName: 'Internal', color: '#A855F7' },
  'international': { dbValue: 'international', displayName: 'International', color: '#22C55E' },
  'ph-interns': { dbValue: 'ph_interns', displayName: 'PH Interns', color: '#F97316' },
  'deseret': { dbValue: 'deseret', displayName: 'Deseret', color: '#EAB308' },
  'angelhost': { dbValue: 'angelhost', displayName: 'Angelhost', color: '#EC4899' },
};

export default function SharedCategoryView() {
  const { category } = useParams<{ category: string }>();
  const categoryInfo = category ? CATEGORY_MAP[category] : null;

  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);

  // Reader state
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const bookRef = useRef<BookRef | null>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Update page title
  useEffect(() => {
    if (categoryInfo) {
      document.title = `${categoryInfo.displayName} Flipbooks - Lifewood Philippines`;
    }
    return () => { document.title = 'Lifewood Digital Flipbook'; };
  }, [categoryInfo]);

  // Fetch books for this category
  useEffect(() => {
    if (!categoryInfo) {
      setError('Invalid category');
      setLoading(false);
      return;
    }

    const fetchBooks = async () => {
      try {
        const storedBooks = await loadBooksByCategory(categoryInfo.dbValue);
        setBooks(storedBooks.map(s => ({
          id: s.id,
          name: s.title,
          doc: null,
          pdfUrl: s.pdf_url,
          coverUrl: s.cover_url || '',
          totalPages: s.total_pages,
          summary: s.summary || undefined,
          category: s.category || undefined,
          isFavorite: s.is_favorite,
        })));
      } catch (err: any) {
        setError(err.message || 'Failed to load books');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [categoryInfo?.dbValue]);

  // Open a book in the reader
  const handleOpenBook = useCallback(async (book: LibraryBook) => {
    setLoadingBookId(book.id);
    try {
      let doc = book.doc;
      if (!doc || typeof doc.getPage !== 'function') {
        const response = await fetch(book.pdfUrl);
        if (!response.ok) throw new Error('Failed to download PDF');
        const blob = await response.blob();
        const file = new File([blob], book.name + '.pdf', { type: 'application/pdf' });
        doc = await getDocument(file);
        setBooks(prev => prev.map(b => b.id === book.id ? { ...b, doc } : b));
      }

      const pagesToPreload = Math.min(3, doc.numPages);
      for (let i = 1; i <= pagesToPreload; i++) {
        await doc.getPage(i);
      }

      setSelectedBook({ ...book, doc });
      setCurrentPage(0);
      setShowSearch(false);
    } catch (err: any) {
      console.error('Failed to open book:', err);
    } finally {
      setLoadingBookId(null);
    }
  }, []);

  // Keyboard navigation for reader
  useEffect(() => {
    if (!selectedBook) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') bookRef.current?.pageFlip()?.flipNext();
      if (e.key === 'ArrowLeft') bookRef.current?.pageFlip()?.flipPrev();
      if (e.key === 'Escape') { setSelectedBook(null); setShowSearch(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedBook]);

  // --- Invalid category ---
  if (!categoryInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <VantaFogBackground darkMode={true} />
        <div className="relative z-10 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Search size={28} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Category Not Found</h1>
          <p className="text-zinc-500 max-w-md mx-auto">This shared link may be invalid. Please ask for a new link from the person who shared it.</p>
        </div>
      </div>
    );
  }

  // --- Reader mode ---
  if (selectedBook) {
    const readerHeaderBg = darkMode ? 'bg-black/30 border-white/[0.06]' : 'bg-white/80 border-gray-200';
    const readerCloseBtn = darkMode ? 'text-white hover:bg-white/[0.12]' : 'text-gray-700 hover:bg-gray-200';
    const readerTitle = darkMode ? 'text-white' : 'text-gray-900';
    const readerPageInfoColor = darkMode ? 'text-white/40' : 'text-gray-400';
    const toggleBtn = darkMode ? 'text-zinc-400 hover:bg-white/[0.08]' : 'text-gray-500 hover:bg-gray-100';

    const pageInfoText = currentPage + 1 < selectedBook.totalPages
      ? `pages ${currentPage + 1} - ${Math.min(currentPage + 2, selectedBook.totalPages)} of ${selectedBook.totalPages}`
      : `page ${currentPage + 1} of ${selectedBook.totalPages}`;

    return (
      <div ref={readerContainerRef} className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-black">
        <VantaFogBackground variant="reader" />

        <header className={`relative z-50 h-14 flex items-center justify-between px-5 backdrop-blur-xl border-b transition-colors shrink-0 ${readerHeaderBg}`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => { setSelectedBook(null); setShowSearch(false); }}
              className={`p-1.5 -ml-1 rounded-full transition-colors shrink-0 ${readerCloseBtn}`}
              title="Back to books"
            >
              <ArrowLeft size={18} />
            </button>
            <span className={`text-sm font-semibold truncate ${readerTitle}`}>{selectedBook.name.replace('.pdf', '')}</span>
            <span className={`text-sm shrink-0 ${readerPageInfoColor}`}>{pageInfoText}</span>
          </div>
          <button onClick={() => setDarkMode(d => !d)} className={`p-2 rounded-full transition-colors ${toggleBtn}`}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>

        <div className="flex-1 w-full min-h-0 relative z-10">
          <BookViewer
            pdfDocument={selectedBook.doc}
            onFlip={setCurrentPage}
            onBookInit={(book) => { bookRef.current = book; }}
            showSearch={showSearch}
            onToggleSearch={() => setShowSearch(!showSearch)}
            fullscreenContainerRef={readerContainerRef as React.RefObject<HTMLDivElement>}
          />
        </div>
      </div>
    );
  }

  // --- Category book grid ---
  const headerBg = darkMode ? 'bg-[#09090b]/70 border-white/[0.04]' : 'bg-white/80 border-gray-200';
  const titleColor = darkMode ? 'text-white' : 'text-gray-900';
  const subtitleColor = darkMode ? 'text-zinc-500' : 'text-gray-500';
  const toggleBtn = darkMode ? 'text-zinc-400 hover:bg-white/[0.08]' : 'text-gray-500 hover:bg-gray-100';
  const cardBorder = darkMode ? 'border-white/[0.06] hover:border-white/[0.12]' : 'border-gray-200 hover:border-gray-300';
  const cardShadow = darkMode ? 'shadow-black/30 hover:shadow-black/50' : 'shadow-gray-200/60 hover:shadow-gray-300/80';
  const bookTitleColor = darkMode ? 'text-zinc-200 group-hover:text-white' : 'text-gray-800 group-hover:text-gray-900';
  const bookMeta = darkMode ? 'text-zinc-600' : 'text-gray-400';

  return (
    <div className={`min-h-screen relative transition-colors duration-300 ${darkMode ? 'bg-[#09090b]' : 'bg-[#f8f9fa]'}`}>
      <VantaFogBackground darkMode={darkMode} />

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 backdrop-blur-xl border-b transition-colors ${headerBg}`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 512 512" fill="currentColor" className="w-5 h-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg">
              <path d="M256 160c.3 0 160-48 160-48v288s-159.7 48-160 48c-.3 0-160-48-160-48V112s159.7 48 160 48z" opacity="0.2" />
              <path d="M256 160v288M416 112v288M96 112v288M256 160c0-.3-80-32-128-48M256 160c0-.3 80-32 128-48"
                stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div>
            <h1 className={`text-lg font-bold tracking-tight ${titleColor}`}>
              <span style={{ color: categoryInfo.color }}>{categoryInfo.displayName}</span>
              {' '}Flipbooks
            </h1>
            <p className={`text-xs ${subtitleColor}`}>Lifewood Philippines Digital Library</p>
          </div>
        </div>
        <button onClick={() => setDarkMode(d => !d)} className={`p-2.5 rounded-xl transition-colors ${toggleBtn}`}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Content */}
      <main className="relative z-10 pt-16 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10 mt-10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className={`aspect-[3/4] rounded-2xl mb-3 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`} />
                  <div className={`h-3 rounded-full w-3/4 mb-2 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`} />
                  <div className={`h-2 rounded-full w-1/2 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-200'}`} />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="text-center py-20">
              <p className="text-red-400 text-lg font-semibold mb-2">Something went wrong</p>
              <p className={subtitleColor}>{error}</p>
            </div>
          )}

          {/* Books */}
          {!loading && !error && (
            <>
              <div className="flex items-center justify-between mb-10">
                <p className={`text-sm font-medium ${subtitleColor}`}>
                  {books.length} book{books.length !== 1 ? 's' : ''} available
                </p>
              </div>

              {books.length === 0 ? (
                <div className="text-center py-20">
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${darkMode ? 'bg-white/[0.04]' : 'bg-gray-100'}`}>
                    <Search size={32} className={darkMode ? 'text-zinc-600' : 'text-gray-400'} />
                  </div>
                  <p className={`text-lg font-semibold mb-2 ${titleColor}`}>No books yet</p>
                  <p className={subtitleColor}>This category doesn't have any books yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-6 gap-y-10">
                  {books.map(book => {
                    const isBookLoading = loadingBookId === book.id;
                    return (
                      <div
                        key={book.id}
                        className={`group cursor-pointer ${isBookLoading ? 'pointer-events-none' : ''}`}
                        onClick={() => handleOpenBook(book)}
                      >
                        <div className="relative aspect-[3/4] mb-3">
                          <div className={`w-full h-full rounded-2xl overflow-hidden border transition-all duration-500 ease-out
                            ${!isBookLoading ? 'group-hover:-translate-y-2 group-hover:scale-[1.02]' : ''}
                            ${cardBorder} shadow-lg ${cardShadow}
                          `}>
                            <img src={book.coverUrl} alt={book.name} className="w-full h-full object-cover" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          </div>

                          {isBookLoading && (
                            <div className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                              <Loader2 className="animate-spin text-white" size={28} />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <h3 className={`text-sm font-medium line-clamp-1 transition-colors ${bookTitleColor}`}>
                            {book.name.replace('.pdf', '')}
                          </h3>
                          <p className={`text-[10px] font-medium uppercase tracking-[0.12em] ${bookMeta}`}>
                            {book.totalPages} Pages
                          </p>
                          {book.summary && (
                            <p className={`text-[11px] line-clamp-2 leading-relaxed ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                              {book.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className={`text-center py-10 border-t ${darkMode ? 'border-white/[0.04]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
              <svg viewBox="0 0 512 512" fill="currentColor" className="w-3.5 h-3.5 text-emerald-400" xmlns="http://www.w3.org/2000/svg">
                <path d="M256 160c.3 0 160-48 160-48v288s-159.7 48-160 48c-.3 0-160-48-160-48V112s159.7 48 160 48z" opacity="0.2" />
                <path d="M256 160v288M416 112v288M96 112v288M256 160c0-.3-80-32-128-48M256 160c0-.3 80-32 128-48"
                  stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </div>
            <span className={`text-xs font-medium ${subtitleColor}`}>Lifewood Philippines Digital Flipbook</span>
          </div>
        </div>
      </main>
    </div>
  );
}
