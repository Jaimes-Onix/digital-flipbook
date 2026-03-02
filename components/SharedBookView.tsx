import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Moon, Sun, ArrowLeft, BookOpen } from 'lucide-react';
import BookViewer from './BookViewer';
import { getDocument } from '../utils/pdfUtils';
import { loadBookById } from '../src/lib/bookStorage';
import type { LibraryBook, BookRef } from '../types';

interface SharedBookViewProps {
  bookIdOverride?: string;
}

export default function SharedBookView({ bookIdOverride }: SharedBookViewProps) {
  const { bookId: bookIdParam } = useParams<{ bookId: string }>();
  const bookId = bookIdOverride || bookIdParam;

  const [book, setBook] = useState<LibraryBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);

  // Reader state
  const [readerOpen, setReaderOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [showSearch, setShowSearch] = useState(false);
  const bookRef = useRef<BookRef | null>(null);
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Fetch book metadata
  useEffect(() => {
    if (!bookId) {
      setError('No book ID provided');
      setLoading(false);
      return;
    }

    const fetchBook = async () => {
      try {
        const stored = await loadBookById(bookId);
        if (!stored) {
          setError('Book not found');
          setLoading(false);
          return;
        }

        setBook({
          id: stored.id,
          name: stored.title,
          doc: null,
          pdfUrl: stored.pdf_url,
          coverUrl: stored.cover_url || '',
          totalPages: stored.total_pages,
          summary: stored.summary || undefined,
          category: stored.category || undefined,
          isFavorite: stored.is_favorite,
          orientation: (stored.orientation as "portrait" | "landscape") || 'portrait',
        });
        document.title = `${stored.title} - Lifewood Digital Flipbook`;
      } catch (err: any) {
        setError(err.message || 'Failed to load book');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [bookId]);

  // Open reader
  const handleReadNow = useCallback(async () => {
    if (!book) return;
    setIsLoadingPdf(true);
    try {
      let doc = book.doc;
      if (!doc || typeof doc.getPage !== 'function') {
        const response = await fetch(book.pdfUrl);
        if (!response.ok) throw new Error('Failed to download PDF');
        const blob = await response.blob();
        const file = new File([blob], book.name + '.pdf', { type: 'application/pdf' });
        doc = await getDocument(file);
        setBook(prev => prev ? { ...prev, doc } : null);
      }

      for (let i = 1; i <= Math.min(3, doc.numPages); i++) {
        await doc.getPage(i);
      }

      setReaderOpen(true);
      setCurrentPage(0);
      setShowSearch(false);
    } catch (err: any) {
      console.error('Failed to load PDF:', err);
      setError('Failed to load the PDF. Please try again.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setIsLoadingPdf(false);
    }
  }, [book]);

  // Keyboard navigation
  useEffect(() => {
    if (!readerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') bookRef.current?.pageFlip()?.flipNext();
      if (e.key === 'ArrowLeft') bookRef.current?.pageFlip()?.flipPrev();
      if (e.key === 'Escape') { setReaderOpen(false); setShowSearch(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [readerOpen]);

  const toggleBtn = darkMode ? 'text-zinc-400 hover:bg-white/[0.08]' : 'text-gray-500 hover:bg-gray-100';

  // --- Loading ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="relative z-10 text-center">
          <Loader2 className="animate-spin text-zinc-500 mx-auto mb-4" size={36} />
          <p className="text-zinc-500 text-sm">Loading book...</p>
        </div>
      </div>
    );
  }

  // --- Error / Not found ---
  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
        <div className="relative z-10 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <BookOpen size={28} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Book Not Found</h1>
          <p className="text-zinc-500 max-w-md mx-auto">{error || 'This shared link may be invalid. Please ask for a new link.'}</p>
        </div>
      </div>
    );
  }

  // --- Reader mode ---
  if (readerOpen && book.doc) {
    const readerHeaderBg = darkMode ? 'bg-black/30 border-white/[0.06]' : 'bg-white/80 border-gray-200';
    const readerCloseBtn = darkMode ? 'text-white hover:bg-white/[0.12]' : 'text-gray-700 hover:bg-gray-200';
    const readerTitle = darkMode ? 'text-white' : 'text-gray-900';
    const readerPageInfoColor = darkMode ? 'text-white/40' : 'text-gray-400';

    const pageInfoText = currentPage + 1 < book.totalPages
      ? `pages ${currentPage + 1} - ${Math.min(currentPage + 2, book.totalPages)} of ${book.totalPages}`
      : `page ${currentPage + 1} of ${book.totalPages}`;

    return (
      <div ref={readerContainerRef} className="fixed inset-0 z-0 overflow-hidden bg-black">
        <header className={`absolute top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-5 backdrop-blur-xl border-b transition-colors ${readerHeaderBg}`}>
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => { setReaderOpen(false); setShowSearch(false); }} className={`p-1.5 -ml-1 rounded-full transition-colors shrink-0 ${readerCloseBtn}`} title="Back">
              <ArrowLeft size={18} />
            </button>
            <span className={`text-sm font-semibold truncate ${readerTitle}`}>{book.name.replace('.pdf', '').replace(/_/g, ' ')}</span>
            <span className={`text-sm shrink-0 ${readerPageInfoColor}`}>{pageInfoText}</span>
          </div>
          <button onClick={() => setDarkMode(d => !d)} className={`p-2 rounded-full transition-colors ${toggleBtn}`}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </header>
        <div className="absolute inset-0 w-full h-full z-10">
          <BookViewer
            pdfDocument={book.doc}
            onFlip={setCurrentPage}
            onBookInit={(b) => { bookRef.current = b; }}
            showSearch={showSearch}
            onToggleSearch={() => setShowSearch(!showSearch)}
            fullscreenContainerRef={readerContainerRef as React.RefObject<HTMLDivElement>}
          />
        </div>
      </div>
    );
  }

  // --- Book landing page ---
  const headerBg = darkMode ? 'bg-[#09090b]/70 border-white/[0.04]' : 'bg-white/80 border-gray-200';
  const titleColor = darkMode ? 'text-white' : 'text-gray-900';
  const subtitleColor = darkMode ? 'text-zinc-500' : 'text-gray-500';

  return (
    <div className={`h-screen w-full overflow-y-auto overflow-x-hidden relative transition-colors duration-300 thin-scrollbar ${darkMode ? 'bg-[#09090b]' : 'bg-[#f8f9fa]'}`}>

      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-6 z-50 backdrop-blur-xl border-b transition-colors ${headerBg}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-lime-500/20 to-lime-500/5 border border-lime-500/20 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 512 512" fill="currentColor" className="w-4.5 h-4.5 text-lime-400" xmlns="http://www.w3.org/2000/svg">
              <path d="M256 160c.3 0 160-48 160-48v288s-159.7 48-160 48c-.3 0-160-48-160-48V112s159.7 48 160 48z" opacity="0.2" />
              <path d="M256 160v288M416 112v288M96 112v288M256 160c0-.3-80-32-128-48M256 160c0-.3 80-32 128-48"
                stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <span className={`text-sm font-semibold tracking-tight ${titleColor}`}>Lifewood Digital Flipbook</span>
        </div>
        <button onClick={() => setDarkMode(d => !d)} className={`p-2.5 rounded-xl transition-colors ${toggleBtn}`}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </header>

      {/* Centered book card */}
      <main className="relative z-10 pt-16 min-h-screen flex items-center justify-center px-6">
        <div className={`w-full max-w-sm rounded-[32px] shadow-2xl border overflow-hidden ${darkMode ? 'bg-[#141418]/90 backdrop-blur-3xl border-white/[0.06] shadow-black/50' : 'bg-white/95 backdrop-blur-3xl border-gray-200 shadow-gray-300/40'
          }`}>
          <div className="p-8 flex flex-col items-center text-center">
            <div className={`relative mb-7 rounded-2xl overflow-hidden shadow-2xl border ${darkMode ? 'shadow-black/50 border-white/[0.06] bg-zinc-900/50' : 'shadow-gray-300/50 border-gray-200 bg-gray-100'
              } ${book.orientation === 'landscape' ? 'w-56 aspect-[4/3]' : 'w-40 aspect-[3/4]'}`}>
              <img src={book.coverUrl} alt={book.name} className="w-full h-full object-cover" />
            </div>

            {/* Info */}
            <h2 className={`text-xl font-bold mb-1.5 line-clamp-2 ${titleColor}`}>
              {book.name.replace('.pdf', '').replace(/_/g, ' ')}
            </h2>
            <p className={`text-[11px] uppercase tracking-widest font-medium mb-2 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
              {book.totalPages} Pages
            </p>
            {book.summary && (
              <p className={`text-xs leading-relaxed mb-6 italic ${subtitleColor}`}>
                "{book.summary}"
              </p>
            )}

            {/* Read Now */}
            <button
              onClick={handleReadNow}
              disabled={isLoadingPdf}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-white hover:bg-zinc-100 text-zinc-900 shadow-white/5' : 'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-300/30'
                }`}
            >
              {isLoadingPdf ? (
                <><Loader2 size={18} className="animate-spin" /> Loading Book...</>
              ) : (
                <><BookOpen size={18} className="group-hover:scale-110 transition-transform" /> Read Now</>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={`fixed bottom-0 left-0 right-0 text-center py-5 ${subtitleColor}`}>
          <p className="text-xs">Powered by Lifewood Philippines Digital Flipbook</p>
        </div>
      </main>
    </div>
  );
}
