import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { CheckCircle2, AlertCircle, X, BookOpen, Search } from 'lucide-react';
import { supabase } from './src/lib/supabase';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Upload from './components/Upload';
import PptxConverter from './components/PptxConverter';
import BookViewer from './components/BookViewer';
import DflipViewer from './components/DflipViewer';
import Controls from './components/Controls';
import Library from './components/Library';
import LibraryActionModal from './components/LibraryActionModal';
import UploadCategoryModal from './components/UploadCategoryModal';
import SharedLinkResolver from './components/SharedLinkResolver';
import FeaturedCarousel from './components/FeaturedCarousel';
import SignIn from './components/SignIn';
import { getDocument } from './utils/pdfUtils';
import { BookRef, LibraryBook, BookCategory, CustomCategory } from './types';
import type { LibraryFilter } from './components/Sidebar';
import {
  uploadPDF,
  uploadCover,
  saveBookMetadata,
  loadBooks as loadBooksFromSupabase,
  updateBook as updateBookInSupabase,
  deleteBook as deleteBookFromSupabase,
  loadCategories as loadCategoriesFromSupabase,
  type StoredBook
} from './src/lib/bookStorage';

// Apple-style Success Modal Component
const ConversionSuccessModal: React.FC<{
  isOpen: boolean;
  bookCount: number;
  darkMode?: boolean;
  onClose: () => void;
  onViewBooks: () => void;
}> = ({ isOpen, bookCount, darkMode = true, onClose, onViewBooks }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/40' : 'bg-black/20'}`} onClick={onClose} />

      <div className={`relative backdrop-blur-3xl rounded-[32px] shadow-2xl w-[90%] max-w-md p-8 animate-in zoom-in-95 fade-in duration-300 border ${darkMode ? 'bg-[#141418]/95 shadow-black/50 border-white/[0.06]' : 'bg-white/95 shadow-gray-300/40 border-gray-200'
        }`}>
        <button onClick={onClose} className={`absolute top-4 right-4 p-2 transition-colors ${darkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-gray-400 hover:text-gray-600'}`}>
          <X size={20} />
        </button>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={40} className="text-white" />
            </div>
          </div>
        </div>

        <h2 className={`text-2xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Conversion Successful</h2>
        <p className={`text-center mb-8 ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
          {bookCount === 1
            ? "Your PDF has been converted to a digital flipbook!"
            : `${bookCount} PDFs have been converted to digital flipbooks!`
          }
        </p>

        <div className="flex flex-col gap-3">
          <button onClick={onViewBooks}
            className={`w-full py-3.5 font-semibold rounded-2xl shadow-lg transition-all active:scale-[0.98] ${darkMode ? 'bg-white text-zinc-900 shadow-white/5 hover:bg-zinc-100' : 'bg-gray-900 text-white shadow-gray-400/20 hover:bg-gray-800'
              }`}>
            <span className="flex items-center justify-center gap-2">
              <BookOpen size={18} /> View in Library
            </span>
          </button>
          <button onClick={onClose}
            className={`w-full py-3.5 font-medium rounded-2xl transition-all active:scale-[0.98] ${darkMode ? 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [darkMode, setDarkMode] = useState(true);

  // Sync data-theme attribute on document for CSS variables
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Disable right-click and developer tools shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
      }
      // Prevent Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
      }
      // Prevent Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const [homeVariant, setHomeVariant] = useState<1 | 2>(1);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [readerMode, setReaderMode] = useState<'manual' | 'preview'>('manual');
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [pendingBook, setPendingBook] = useState<LibraryBook | null>(null);
  const [uploadedBooksPending, setUploadedBooksPending] = useState<LibraryBook[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);
  const [conversionToast, setConversionToast] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoadingBook, setIsLoadingBook] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  // Custom categories state
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBookCount, setSuccessBookCount] = useState(0);

  const bookRef = useRef<BookRef | null>(null);
  const previousRouteRef = useRef<string>('/library');
  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Derive current view and filter from route
  const getCurrentView = (): 'home' | 'upload' | 'convert-pptx' | 'library' | 'reader' | 'signin' | 'shared' => {
    if (location.pathname === '/' || location.pathname === '/home') return 'home';
    if (location.pathname === '/upload') return 'upload';
    if (location.pathname === '/convert-pptx') return 'convert-pptx';
    if (location.pathname === '/signin') return 'signin';
    if (location.pathname.startsWith('/reader')) return 'reader';
    if (location.pathname.startsWith('/share')) return 'shared';
    return 'library';
  };

  const getCurrentFilter = (): LibraryFilter => {
    if (location.pathname.startsWith('/category/')) return location.pathname.replace('/category/', '');
    return 'all';
  };

  const view = getCurrentView();
  const libraryFilter = getCurrentFilter();


  // Load books from Supabase on app start — metadata only (instant, no PDF downloads)
  useEffect(() => {
    // Auth Check
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      // Allow public access to shared routes
      if (location.pathname.startsWith('/share')) return;

      if (!session && location.pathname !== '/signin') {
        // No session, and not on signin page -> Redirect to Sign In
        navigate('/signin', { replace: true });
      } else if (session && location.pathname === '/signin') {
        // Session exists, but on signin page -> Redirect to Library
        navigate('/library', { replace: true });
      }
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Allow public access to shared routes
      if (location.pathname.startsWith('/share')) return;

      if (!session && location.pathname !== '/signin') {
        navigate('/signin', { replace: true });
      } else if (session && location.pathname === '/signin') {
        navigate('/library', { replace: true });
      }
    });

    const loadSavedBooks = async () => {
      try {
        setLoadingStatus('Loading your library...');
        const [storedBooks, storedCategories] = await Promise.all([
          loadBooksFromSupabase(),
          loadCategoriesFromSupabase(),
        ]);
        setCustomCategories(storedCategories);

        if (storedBooks.length === 0) {
          setLoadingStatus(null);
          return;
        }

        // Only load metadata + cover URLs (no PDF downloading or parsing!)
        // PDFs are lazy-loaded when the user actually opens a book
        const libraryBooks: LibraryBook[] = storedBooks.map((stored) => ({
          id: stored.id,
          name: stored.title,
          doc: null, // PDF loaded lazily when user opens the book
          pdfUrl: stored.pdf_url,
          coverUrl: stored.cover_url || '',
          totalPages: stored.total_pages,
          summary: stored.summary || undefined,
          category: stored.category || undefined,
          isFavorite: stored.is_favorite,
          orientation: (stored.orientation as any) || 'portrait',
          createdAt: stored.created_at
        }));

        setBooks(libraryBooks);
        setLoadingStatus(null);
        console.log(`Loaded ${libraryBooks.length} books from Supabase (metadata only — instant!)`);
      } catch (error) {
        console.error('Failed to load books from Supabase:', error);
        setLoadingStatus(null);
      }
    };

    loadSavedBooks();
  }, []);

  const extractCover = async (doc: any): Promise<string> => {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;

    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleFilesSelect = async (selectedFiles: File[], orientation: 'landscape' | 'portrait' = 'portrait') => {
    const total = selectedFiles.length;
    if (total === 0) return;

    try {
      const newBooks: LibraryBook[] = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];

        // Check file size before uploading (bucket limit: 500MB)
        const MAX_FILE_SIZE_MB = 150;
        const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
          const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
          throw new Error(`File "${file.name}" is ${fileSizeMB}MB which exceeds the ${MAX_FILE_SIZE_MB}MB upload limit. Please use a smaller PDF or compress it first.`);
        }

        // Step 1: Converting PDF
        setLoadingStatus(`Converting PDF to Digital Book... (${i + 1}/${total})`);

        // Parse PDF first
        let doc;
        try {
          doc = await getDocument(file);
          console.log(`✓ PDF parsed: ${doc.numPages} pages`);
        } catch (pdfError: any) {
          console.error('PDF parsing failed:', pdfError);
          throw new Error(`PDF parsing failed: ${pdfError.message || 'Invalid PDF format'}`);
        }

        let coverBase64;
        try {
          coverBase64 = await extractCover(doc);
          console.log('✓ Cover extracted');
        } catch (coverError: any) {
          console.error('Cover extraction failed:', coverError);
          throw new Error(`Cover extraction failed: ${coverError.message}`);
        }

        // Step 2: Uploading PDF
        setLoadingStatus(`Uploading PDF... (${i + 1}/${total})`);

        // Upload PDF to Supabase Storage
        let pdfUrl;
        try {
          pdfUrl = await uploadPDF(file);
          console.log('✓ PDF uploaded:', pdfUrl);
        } catch (uploadError: any) {
          console.error('PDF upload failed:', uploadError);
          throw new Error(`PDF upload failed: ${uploadError.message}`);
        }

        // Generate temporary ID for cover upload
        const tempId = Math.random().toString(36).substr(2, 9) + Date.now();

        // Upload cover to Supabase Storage
        let coverUrl = coverBase64; // fallback to base64
        try {
          coverUrl = await uploadCover(coverBase64, tempId);
          console.log('✓ Cover uploaded:', coverUrl);
        } catch (e) {
          console.warn('Cover upload failed, using base64:', e);
        }

        // Step 3: Saving metadata
        setLoadingStatus(`Finalizing... (${i + 1}/${total})`);

        // Save metadata to Supabase database
        let savedBook;
        try {
          savedBook = await saveBookMetadata({
            title: file.name.replace('.pdf', ''),
            original_filename: file.name,
            pdf_url: pdfUrl,
            cover_url: coverUrl,
            total_pages: doc.numPages,
            file_size: file.size,
            orientation
          });
          console.log('✓ Metadata saved:', savedBook.id);
        } catch (dbError: any) {
          console.error('Database save failed:', dbError);
          throw new Error(`Database save failed: ${dbError.message}`);
        }

        newBooks.push({
          id: savedBook.id,
          name: savedBook.title,
          doc: doc,
          pdfUrl: savedBook.pdf_url,
          coverUrl: savedBook.cover_url || coverBase64,
          totalPages: savedBook.total_pages,
          category: savedBook.category || undefined,
          isFavorite: savedBook.is_favorite,
          orientation: savedBook.orientation || orientation,
          createdAt: savedBook.created_at
        });
      }

      setLoadingStatus(null);
      setSidebarOpen(false);

      // Add books to library
      setBooks(prev => [...prev, ...newBooks]);

      // Show Apple-style success modal
      setSuccessBookCount(newBooks.length);
      setShowSuccessModal(true);

      // Queue books for category selection after modal closes
      if (newBooks.length > 0) {
        setUploadedBooksPending(newBooks);
      }

    } catch (error: any) {
      console.error("===== UPLOAD PROCESS ERROR =====");
      console.error("Full error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);
      console.error("================================");

      setLoadingStatus(null);

      // Show more specific error message
      let errorMessage = "Conversion failed. ";
      if (error?.message) {
        if (error.message.includes('User authentication required')) {
          errorMessage = "Session expired. Redirecting to Sign In...";
          setTimeout(() => navigate('/signin'), 1500);
        } else if (error.message.includes('upload') || error.message.includes('storage')) {
          errorMessage += "Storage upload error - check Supabase bucket permissions.";
        } else if (error.message.includes('save') || error.message.includes('insert') || error.message.includes('user_id')) {
          errorMessage += "Database error - check RLS policies or user authentication.";
        } else if (error.message.includes('PDF') || error.message.includes('document')) {
          errorMessage += "Invalid PDF file format.";
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += "Please ensure your files are valid PDFs and try again.";
      }

      setConversionToast(errorMessage);
      setTimeout(() => setConversionToast(null), 8000);
    }
  };

  const handleUploadCategoryConfirm = async (bookId: string, category?: BookCategory, isFavorite?: boolean) => {
    // Update the book with category in local state
    setBooks(prev => prev.map(book =>
      book.id === bookId
        ? { ...book, category, isFavorite: isFavorite || false }
        : book
    ));

    // Save to Supabase
    try {
      await updateBookInSupabase(bookId, {
        category: category || null,
        is_favorite: isFavorite || false
      });
    } catch (e) {
      console.error('Failed to update book in Supabase:', e);
    }

    // Remove this book from pending queue and show next
    setUploadedBooksPending(prev => {
      const remaining = prev.slice(1);
      if (remaining.length === 0) {
        // All books categorized, go back to originating view or library
        navigate((location.state as any)?.returnTo || '/library');
        setConversionToast(
          prev.length === 1
            ? "Your flipbook has been added to the library!"
            : "All flipbooks have been added to the library!"
        );
        setTimeout(() => setConversionToast(null), 4000);
      }
      return remaining;
    });
  };

  const handleRemoveBook = async (bookId: string) => {
    const book = books.find(b => b.id === bookId);

    // Remove from local state immediately
    setBooks(prev => prev.filter(b => b.id !== bookId));
    if (pendingBook?.id === bookId) setPendingBook(null);

    // Soft-delete in Supabase
    if (book) {
      try {
        await deleteBookFromSupabase(bookId);
        console.log('Book soft-deleted in Supabase');
      } catch (e) {
        console.error('Failed to delete book from Supabase:', e);
      }
    }
  };

  const handleRestoreBook = async () => {
    // Reload all books from Supabase to get the restored one
    try {
      const storedBooks = await loadBooksFromSupabase();
      const libraryBooks: LibraryBook[] = storedBooks.map((stored) => ({
        id: stored.id,
        name: stored.title,
        doc: null,
        pdfUrl: stored.pdf_url,
        coverUrl: stored.cover_url || '',
        totalPages: stored.total_pages,
        summary: stored.summary || undefined,
        category: stored.category || undefined,
        isFavorite: stored.is_favorite,
        orientation: (stored.orientation as any) || 'portrait',
        createdAt: stored.created_at
      }));
      setBooks(libraryBooks);
      console.log('Books reloaded after restore');
    } catch (e) {
      console.error('Failed to reload books after restore:', e);
    }
  };

  const handleUpdateSummary = async (bookId: string, summary: string) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, summary: summary } : b));
    if (pendingBook?.id === bookId) {
      setPendingBook(prev => prev ? { ...prev, summary: summary } : null);
    }
    // Save to Supabase
    try {
      await updateBookInSupabase(bookId, { summary });
    } catch (e) {
      console.error('Failed to save summary to Supabase:', e);
    }
  };

  const handleUpdateBookName = async (bookId: string, newName: string) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, name: newName } : b));
    if (pendingBook?.id === bookId) {
      setPendingBook(prev => prev ? { ...prev, name: newName } : null);
    }
    // Save to Supabase
    try {
      await updateBookInSupabase(bookId, { title: newName });
    } catch (e) {
      console.error('Failed to save book name to Supabase:', e);
    }
  };

  const handleUpdateBookCategory = async (bookId: string, category?: import('./types').BookCategory) => {
    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, category } : b));
    if (pendingBook?.id === bookId) {
      setPendingBook(prev => prev ? { ...prev, category } : null);
    }
    // Save to Supabase
    try {
      await updateBookInSupabase(bookId, { category: category || null });
    } catch (e) {
      console.error('Failed to save category to Supabase:', e);
    }
  };

  const handleToggleFavorite = async (bookId: string) => {
    const book = books.find(b => b.id === bookId);
    const newFavoriteState = !book?.isFavorite;

    setBooks(prev => prev.map(b => b.id === bookId ? { ...b, isFavorite: newFavoriteState } : b));
    if (pendingBook?.id === bookId) {
      setPendingBook(prev => prev ? { ...prev, isFavorite: newFavoriteState } : null);
    }
    // Save to Supabase
    try {
      await updateBookInSupabase(bookId, { is_favorite: newFavoriteState });
    } catch (e) {
      console.error('Failed to save favorite to Supabase:', e);
    }
  };

  const handleSelectMode = async (mode: 'manual' | 'preview') => {
    if (!pendingBook) return;

    // Show loading state
    setIsLoadingBook(true);
    setReaderMode(mode);

    try {
      let doc = pendingBook.doc;
      let bookToOpen = pendingBook;

      // Lazy-load: download and parse PDF only when user opens it
      if (!doc || typeof doc.getPage !== 'function') {
        console.log(`Downloading PDF for: ${pendingBook.name}...`);

        const response = await fetch(pendingBook.pdfUrl);
        if (!response.ok) throw new Error('Failed to fetch PDF');

        const blob = await response.blob();
        const file = new File([blob], pendingBook.name + '.pdf', { type: 'application/pdf' });
        doc = await getDocument(file);

        // Cache the loaded doc in state so it doesn't re-download
        bookToOpen = { ...pendingBook, doc };
        setBooks(prev => prev.map(b => b.id === pendingBook.id ? bookToOpen : b));
      }

      // Check total pages
      if (!doc.numPages || doc.numPages < 1) {
        throw new Error('PDF has no pages');
      }

      // Pre-load first few pages to ensure they render
      console.log(`Loading book: ${bookToOpen.name} (${doc.numPages} pages)`);

      const pagesToPreload = Math.min(3, doc.numPages);
      for (let i = 1; i <= pagesToPreload; i++) {
        const page = await doc.getPage(i);
        if (!page) throw new Error(`Failed to load page ${i}`);
      }

      console.log('Book pre-loaded successfully');

      // All validation passed - open the reader
      previousRouteRef.current = location.pathname; // remember where we came from
      setSelectedBook(bookToOpen);
      setPendingBook(null);
      setCurrentPage(0);
      setZoomLevel(1);
      navigate(`/reader/${bookToOpen.id}`);

      // Small delay for transition
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error loading book:', error);
      setConversionToast('Failed to load book. The PDF may be corrupted.');
      setTimeout(() => setConversionToast(null), 4000);
    } finally {
      setIsLoadingBook(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'reader') return;
      if (e.key === 'ArrowRight') bookRef.current?.pageFlip()?.flipNext();
      if (e.key === 'ArrowLeft') bookRef.current?.pageFlip()?.flipPrev();
      if (e.key === 'Escape') { navigate('/library'); setSelectedBook(null); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, navigate]);

  const isLandingPage = false; // Sidebar always visible

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 relative ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* ── Universal Background Video ── */}
      <div className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute min-w-full min-h-full object-cover opacity-30 mix-blend-screen"
        >
          <source src={`https://www.pexels.com/download/video/10922866/`} type="video/mp4" />
        </video>
        {/* Semi-transparent overlay to ensure text readability */}
        <div className={`absolute inset-0 ${darkMode ? 'bg-[#0a0a0a]/70' : 'bg-white/80'} backdrop-blur-[2px]`} />
      </div>

      {/* Sidebar - Shared across views except reader (optional) */}
      {view !== 'reader' && view !== 'signin' && view !== 'shared' && !isLandingPage && (
        <Sidebar
          currentView={view}
          currentFilter={libraryFilter}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(prev => !prev)}
          isMobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          customCategories={customCategories}
          onCategoryAdded={(cat) => setCustomCategories(prev => [...prev, cat])}
          onCategoryEdited={(updatedCat, oldSlug) => {
            setCustomCategories(prev => prev.map(c => c.id === updatedCat.id ? updatedCat : c));
            if (updatedCat.slug !== oldSlug) {
              setBooks(prev => prev.map(b => b.category === oldSlug ? { ...b, category: updatedCat.slug } : b));
            }
          }}
          onCategoryDeleted={(id, oldSlug) => {
            setCustomCategories(prev => prev.filter(c => c.id !== id));
            setBooks(prev => prev.map(b => b.category === oldSlug ? { ...b, category: undefined } : b));
            if (location.pathname === `/category/${oldSlug}`) {
              navigate('/library');
            }
          }}
        />
      )}

      <div className="flex-1 flex flex-col relative overflow-hidden z-10">
        {!isLandingPage && view !== 'signin' && view !== 'shared' && <Header
          view={view}
          darkMode={darkMode}
          homeVariant={homeVariant}
          onToggleHomeVariant={() => setHomeVariant(prev => prev === 1 ? 2 : 1)}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          fileName={selectedBook?.name}
          onCloseReader={() => { navigate(previousRouteRef.current); setSelectedBook(null); setShowSearch(false); }}
          readerBookName={selectedBook?.name.replace('.pdf', '')}
          readerBookId={selectedBook?.id}
          readerPageInfo={
            selectedBook
              ? (currentPage + 1 < selectedBook.totalPages
                ? `pages ${currentPage + 1} - ${Math.min(currentPage + 2, selectedBook.totalPages)} of ${selectedBook.totalPages}`
                : `page ${currentPage + 1} of ${selectedBook.totalPages}`)
              : undefined
          }
        />}

        <main className={`flex-1 relative w-full h-full ${isLandingPage ? '' : 'pt-14'} overflow-y-auto no-scrollbar`}>
          <Routes>
            {/* Home Route - with 3D effects */}
            <Route path="/" element={
              <Home
                books={books}
                darkMode={darkMode}
                variant={homeVariant}
                onUpload={() => navigate('/upload')}
                onBrowseLibrary={() => navigate('/library')}
                onSelectBook={(b) => setPendingBook(b)}
              />
            } />

            <Route path="/home" element={
              <Home
                books={books}
                darkMode={darkMode}
                variant={homeVariant}
                onUpload={() => navigate('/upload')}
                onBrowseLibrary={() => navigate('/library')}
                onSelectBook={(b) => setPendingBook(b)}
              />
            } />

            {/* Upload Route */}
            <Route path="/upload" element={
              <Upload
                onFilesSelect={handleFilesSelect}
                onBack={() => navigate((location.state as any)?.returnTo || '/library')}
                isLoading={!!loadingStatus}
                statusMessage={loadingStatus || ""}
                darkMode={darkMode}
              />
            } />

            {/* PPTX to PDF Converter Route */}
            <Route path="/convert-pptx" element={
              <PptxConverter
                onBack={() => navigate('/library')}
                darkMode={darkMode}
                onConvertSuccess={(pdfFile, orientation) => {
                  // Pass the PDF directly to the existing upload handler process
                  handleFilesSelect([pdfFile], orientation);
                }}
              />
            } />

            {/* Library Routes */}
            <Route path="/library" element={
              <div className="animate-in fade-in duration-700">
                {books.length > 0 && libraryFilter === 'all' && (
                  <FeaturedCarousel books={books.slice(0, 5)} darkMode={darkMode} />
                )}
                <Library
                  books={books}
                  filter={libraryFilter}
                  darkMode={darkMode}
                  customCategories={customCategories}
                  onSelectBook={(b) => setPendingBook(b)}
                  onAddNew={() => navigate('/upload', { state: { returnTo: location.pathname } })}
                  onRemoveBook={handleRemoveBook}
                  onRestoreBook={handleRestoreBook}
                />
              </div>
            } />

            {/* Dynamic category route — handles both built-in and user-created categories */}
            <Route path="/category/:slug" element={
              <Library
                books={books}
                filter={libraryFilter}
                darkMode={darkMode}
                isLoading={!!loadingStatus}
                customCategories={customCategories}
                onSelectBook={(b) => setPendingBook(b)}
                onAddNew={() => navigate('/upload', { state: { returnTo: location.pathname } })}
                onRemoveBook={handleRemoveBook}
                onRestoreBook={handleRestoreBook}
              />
            } />

            {/* Sharing Route - Token resolution */}
            <Route path="/share/link/:token" element={<SharedLinkResolver />} />

            {/* Reader Route - Using DFlip library */}
            <Route path="/reader/:bookId" element={
              selectedBook && (
                <div ref={readerContainerRef} className="w-full h-full min-h-0 flex flex-col overflow-hidden relative">

                  {/* BookViewer */}
                  <div className="flex-1 w-full h-full min-h-0 relative z-10">
                    <BookViewer
                      pdfDocument={selectedBook.doc}
                      onFlip={setCurrentPage}
                      onBookInit={(book) => { bookRef.current = book; }}
                      autoPlay={readerMode === 'preview'}
                      showSearch={showSearch}
                      onToggleSearch={() => setShowSearch(!showSearch)}
                      fullscreenContainerRef={readerContainerRef as React.RefObject<HTMLDivElement>}
                      orientation={selectedBook.orientation || 'portrait'}
                    />
                  </div>
                </div>
              )
            } />
          </Routes>
        </main>
      </div>

      <LibraryActionModal
        book={pendingBook}
        darkMode={darkMode}
        onClose={() => setPendingBook(null)}
        onSelectMode={handleSelectMode}
        onUpdateCategory={handleUpdateBookCategory}
        onUpdateName={handleUpdateBookName}
        onToggleFavorite={handleToggleFavorite}
        isLoadingBook={isLoadingBook}
        onRemove={handleRemoveBook}
      />

      {/* Apple-style Conversion Success Modal */}
      <ConversionSuccessModal
        isOpen={showSuccessModal}
        bookCount={successBookCount}
        darkMode={darkMode}
        onClose={() => setShowSuccessModal(false)}
        onViewBooks={() => {
          setShowSuccessModal(false);
          // Don't navigate yet - let category modal show first
        }}
      />

      {/* Upload Category Modal - shown after uploading a book */}
      <UploadCategoryModal
        book={!showSuccessModal ? uploadedBooksPending[0] : null}
        darkMode={darkMode}
        currentIndex={uploadedBooksPending.length > 0 ? 1 : 0}
        totalBooks={uploadedBooksPending.length}
        customCategories={customCategories}
        onClose={() => {
          setUploadedBooksPending([]);
          navigate('/library');
        }}
        onConfirm={handleUploadCategoryConfirm}
      />

      {/* Toast */}
      {conversionToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl shadow-black/40 border animate-in fade-in slide-in-from-bottom-4 duration-300 ${conversionToast.startsWith('Conversion failed')
          ? 'bg-red-900/80 border-red-700/50 text-red-200'
          : 'bg-[#141418]/95 backdrop-blur-xl border-white/[0.06] text-white'
          }`}>
          {conversionToast.startsWith('Conversion failed') ? (
            <AlertCircle size={22} className="text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 size={22} className="text-emerald-500 shrink-0" />
          )}
          <span className="font-medium text-sm max-w-md">{conversionToast}</span>
        </div>
      )}
    </div>
  );
};

export default App;