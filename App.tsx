import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { CheckCircle2, AlertCircle, X, BookOpen } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import Upload from './components/Upload';
import BookViewer from './components/BookViewer';
import DflipViewer from './components/DflipViewer';
import Controls from './components/Controls';
import Library from './components/Library';
import LibraryActionModal from './components/LibraryActionModal';
import UploadCategoryModal from './components/UploadCategoryModal';
import FeaturedCarousel from './components/FeaturedCarousel';
import VantaFogBackground from './components/VantaFogBackground';
import { getDocument } from './utils/pdfUtils';
import { BookRef, LibraryBook, BookCategory } from './types';
import type { LibraryFilter } from './components/Sidebar';
import {
  uploadPDF,
  uploadCover,
  saveBookMetadata,
  loadBooks as loadBooksFromSupabase,
  updateBook as updateBookInSupabase,
  deleteBook as deleteBookFromSupabase,
  type StoredBook
} from './src/lib/bookStorage';

// Apple-style Success Modal Component
const ConversionSuccessModal: React.FC<{
  isOpen: boolean;
  bookCount: number;
  onClose: () => void;
  onViewBooks: () => void;
}> = ({ isOpen, bookCount, onClose, onViewBooks }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      {/* Backdrop with blur */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-[90%] max-w-md p-8 animate-in zoom-in-95 fade-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Success icon with glow */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400/30 rounded-full blur-xl animate-pulse" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-green-400 to-green-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle2 size={40} className="text-white" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
          Conversion Successful
        </h2>

        {/* Subtitle */}
        <p className="text-gray-500 text-center mb-8">
          {bookCount === 1
            ? "Your PDF has been converted to a digital flipbook!"
            : `${bookCount} PDFs have been converted to digital flipbooks!`
          }
        </p>

        {/* Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onViewBooks}
            className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-blue-700 transition-all active:scale-[0.98]"
          >
            <span className="flex items-center justify-center gap-2">
              <BookOpen size={18} />
              View in Library
            </span>
          </button>

          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-all active:scale-[0.98]"
          >
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
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isLoadingBook, setIsLoadingBook] = useState(false);

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successBookCount, setSuccessBookCount] = useState(0);

  const bookRef = useRef<BookRef | null>(null);

  // Derive current view and filter from route
  const getCurrentView = (): 'home' | 'upload' | 'library' | 'reader' => {
    if (location.pathname === '/' || location.pathname === '/home') return 'home';
    if (location.pathname === '/upload') return 'upload';
    if (location.pathname.startsWith('/reader')) return 'reader';
    return 'library';
  };

  const getCurrentFilter = (): LibraryFilter => {
    if (location.pathname === '/favorites') return 'favorites';
    if (location.pathname === '/philippines') return 'philippines';
    if (location.pathname === '/internal') return 'internal';
    if (location.pathname === '/international') return 'international';
    if (location.pathname === '/ph-interns') return 'ph_interns';
    if (location.pathname === '/deseret') return 'deseret';
    if (location.pathname === '/angelhost') return 'angelhost';
    return 'all';
  };

  const view = getCurrentView();
  const libraryFilter = getCurrentFilter();

  // Load books from Supabase on app start
  useEffect(() => {
    const loadSavedBooks = async () => {
      try {
        setLoadingStatus('Loading your library...');
        const storedBooks = await loadBooksFromSupabase();

        if (storedBooks.length === 0) {
          setLoadingStatus(null);
          return;
        }

        // Load books in parallel with individual error handling
        const libraryBooks: LibraryBook[] = [];

        await Promise.all(
          storedBooks.map(async (stored, index) => {
            try {
              setLoadingStatus(`Loading book ${index + 1} of ${storedBooks.length}...`);

              // Fetch PDF and create document
              const response = await fetch(stored.pdf_url);
              if (!response.ok) throw new Error('Failed to fetch PDF');

              const blob = await response.blob();
              const file = new File([blob], stored.original_filename, { type: 'application/pdf' });
              const doc = await getDocument(file);

              libraryBooks.push({
                id: stored.id,
                name: stored.title,
                doc: doc,
                pdfUrl: stored.pdf_url,
                coverUrl: stored.cover_url || '',
                totalPages: stored.total_pages,
                summary: stored.summary || undefined,
                category: stored.category || undefined,
                isFavorite: stored.is_favorite
              });
            } catch (bookError) {
              console.error(`Failed to load book "${stored.title}":`, bookError);
              // Continue with other books even if one fails
            }
          })
        );

        setBooks(libraryBooks);
        setLoadingStatus(null);
        console.log(`Loaded ${libraryBooks.length} of ${storedBooks.length} books from Supabase`);
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

  const handleFilesSelect = async (selectedFiles: File[]) => {
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
            file_size: file.size
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
          isFavorite: savedBook.is_favorite
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
        if (error.message.includes('upload') || error.message.includes('storage')) {
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
        // All books categorized, go to library
        navigate('/library');
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

    // Delete from Supabase
    if (book) {
      try {
        await deleteBookFromSupabase(bookId, book.pdfUrl, book.coverUrl);
        console.log('Book deleted from Supabase');
      } catch (e) {
        console.error('Failed to delete book from Supabase:', e);
      }
    }
  };

  const handleSummarize = async (bookId: string): Promise<string | null> => {
    const book = books.find(b => b.id === bookId);
    if (!book || !book.doc) return null;

    setIsSummarizing(true);
    try {
      let sampleText = "";
      for (let i = 1; i <= Math.min(3, book.totalPages); i++) {
        const page = await book.doc.getPage(i);
        const textContent = await page.getTextContent();
        sampleText += textContent.items.map((item: any) => item.str).join(" ") + " ";
      }

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a extremely concise one-sentence hook/summary (under 25 words) for a book based on this extracted text. Make it sound professional and intriguing: ${sampleText.substring(0, 2000)}`,
      });

      return response.text?.trim() || "No summary available.";
    } catch (err) {
      console.error("AI Summarization failed", err);
      return null;
    } finally {
      setIsSummarizing(false);
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
      // Validate PDF document exists and is valid
      const doc = pendingBook.doc;
      if (!doc || typeof doc.getPage !== 'function') {
        throw new Error('Invalid PDF document');
      }

      // Check total pages
      if (!doc.numPages || doc.numPages < 1) {
        throw new Error('PDF has no pages');
      }

      // Pre-load first few pages to ensure they render
      console.log(`Loading book: ${pendingBook.name} (${doc.numPages} pages)`);

      const pagesToPreload = Math.min(3, doc.numPages);
      for (let i = 1; i <= pagesToPreload; i++) {
        const page = await doc.getPage(i);
        if (!page) throw new Error(`Failed to load page ${i}`);
      }

      console.log('Book pre-loaded successfully');

      // All validation passed - open the reader
      setSelectedBook(pendingBook);
      setPendingBook(null);
      setCurrentPage(0);
      setZoomLevel(1);
      navigate(`/reader/${pendingBook.id}`);

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
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Vanta.js Fog Background - covers entire viewport */}
      <VantaFogBackground darkMode={darkMode} />

      {/* Sidebar - Shared across views except reader (optional) */}
      {view !== 'reader' && !isLandingPage && (
        <Sidebar
          currentView={view}
          currentFilter={libraryFilter}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(prev => !prev)}
          isMobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col relative overflow-hidden z-10">
        {!isLandingPage && <Header
          view={view}
          darkMode={darkMode}
          homeVariant={homeVariant}
          onToggleHomeVariant={() => setHomeVariant(prev => prev === 1 ? 2 : 1)}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          fileName={selectedBook?.name}
        />}

        <main className={`flex-1 relative w-full h-full ${isLandingPage ? '' : 'pt-16'} overflow-y-auto no-scrollbar`}>
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
                onBack={() => navigate('/library')}
                isLoading={!!loadingStatus}
                statusMessage={loadingStatus || ""}
                darkMode={darkMode}
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
                  onSelectBook={(b) => setPendingBook(b)}
                  onAddNew={() => navigate('/upload')}
                  onRemoveBook={handleRemoveBook}
                />
              </div>
            } />

            <Route path="/favorites" element={
              <Library
                books={books}
                filter="favorites"
                darkMode={darkMode}
                onSelectBook={(b) => setPendingBook(b)}
                onAddNew={() => navigate('/upload')}
                onRemoveBook={handleRemoveBook}
              />
            } />

            <Route path="/philippines" element={
              <Library
                books={books}
                filter="philippines"
                darkMode={darkMode}
                onSelectBook={(b) => setPendingBook(b)}
                onAddNew={() => navigate('/upload')}
                onRemoveBook={handleRemoveBook}
              />
            } />

            <Route path="/internal" element={
              <Library
                books={books}
                filter="internal"
                darkMode={darkMode}
                onSelectBook={(b) => setPendingBook(b)}
                onAddNew={() => navigate('/upload')}
                onRemoveBook={handleRemoveBook}
              />
            } />

            <Route path="/international" element={
              <Library
                books={books}
                filter="international"
                darkMode={darkMode}
                onSelectBook={(b) => setPendingBook(b)}
                onAddNew={() => navigate('/upload')}
                onRemoveBook={handleRemoveBook}
              />
            } />

            <Route path="/ph-interns" element={
              <Library
                books={books}
                filter="ph_interns"
                darkMode={darkMode}
                onSelectBook={(b) => setPendingBook(b)}
                onAddNew={() => navigate('/upload')}
                onRemoveBook={handleRemoveBook}
              />
            } />

            <Route path="/deseret" element={
              <Library
                books={books}
                filter="deseret"
                darkMode={darkMode}
                isLoading={!!loadingStatus}
                onSelectBook={(b) => setPendingBook(b)}
                onAddNew={() => navigate('/upload')}
                onRemoveBook={handleRemoveBook}
              />
            } />

            <Route path="/angelhost" element={
              <Library
                books={books}
                filter="angelhost"
                darkMode={darkMode}
                isLoading={!!loadingStatus}
                onSelectBook={(b) => setPendingBook(b)}
                onAddNew={() => navigate('/upload')}
                onRemoveBook={handleRemoveBook}
              />
            } />

            {/* Reader Route - Using DFlip library */}
            <Route path="/reader/:bookId" element={
              selectedBook && (
                <div className="w-full h-full min-h-0 flex flex-col overflow-hidden relative">
                  {/* Close button */}
                  <button
                    onClick={() => { navigate('/library'); setSelectedBook(null); }}
                    className="absolute top-3 right-3 z-[9999] w-10 h-10 flex items-center justify-center text-white/80 hover:text-white hover:bg-black/30 transition-all rounded-full"
                  >
                    <X size={24} />
                  </button>

                  {/* BookViewer - uses pre-parsed PDF, works reliably */}
                  <div className="flex-1 w-full h-full">
                    <BookViewer
                      pdfDocument={selectedBook.doc}
                      onFlip={setCurrentPage}
                      onBookInit={(book) => { bookRef.current = book; }}
                      autoPlay={readerMode === 'preview'}
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
        onClose={() => setPendingBook(null)}
        onSelectMode={handleSelectMode}
        onSummarize={handleSummarize}
        onApplySummary={handleUpdateSummary}
        onUpdateCategory={handleUpdateBookCategory}
        onToggleFavorite={handleToggleFavorite}
        isSummarizing={isSummarizing}
        isLoadingBook={isLoadingBook}
        onRemove={handleRemoveBook}
      />

      {/* Apple-style Conversion Success Modal */}
      <ConversionSuccessModal
        isOpen={showSuccessModal}
        bookCount={successBookCount}
        onClose={() => setShowSuccessModal(false)}
        onViewBooks={() => {
          setShowSuccessModal(false);
          // Don't navigate yet - let category modal show first
        }}
      />

      {/* Upload Category Modal - shown after uploading a book */}
      <UploadCategoryModal
        book={!showSuccessModal ? uploadedBooksPending[0] : null}
        currentIndex={uploadedBooksPending.length > 0 ? 1 : 0}
        totalBooks={uploadedBooksPending.length}
        onClose={() => {
          setUploadedBooksPending([]);
          navigate('/library');
        }}
        onConfirm={handleUploadCategoryConfirm}
      />

      {/* Conversion success/error toast */}
      {conversionToast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-300 ${conversionToast.startsWith('Conversion failed')
            ? darkMode ? 'bg-red-900/80 border-red-700 text-red-200' : 'bg-red-50 border-red-200 text-red-800'
            : darkMode ? 'bg-gray-800/95 backdrop-blur-xl border-gray-700 text-white' : 'bg-white/95 backdrop-blur-xl border-gray-200 text-gray-900'
            }`}
        >
          {conversionToast.startsWith('Conversion failed') ? (
            <AlertCircle size={24} className="text-red-500 shrink-0" />
          ) : (
            <CheckCircle2 size={24} className="text-green-500 shrink-0" />
          )}
          <span className="font-medium text-sm max-w-md">{conversionToast}</span>
        </div>
      )}
    </div>
  );
};

export default App;