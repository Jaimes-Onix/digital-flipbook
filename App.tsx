import React, { useState, useRef, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { CheckCircle2, AlertCircle } from 'lucide-react';
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
import LandingPage from './components/LandingPage';
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

const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [darkMode, setDarkMode] = useState(true); // Start in dark mode for home
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
        
        // Convert stored books to LibraryBook format
        const libraryBooks: LibraryBook[] = await Promise.all(
          storedBooks.map(async (stored) => {
            // Load the PDF document from the URL
            const response = await fetch(stored.pdf_url);
            const blob = await response.blob();
            const file = new File([blob], stored.original_filename, { type: 'application/pdf' });
            const doc = await getDocument(file);
            
            return {
              id: stored.id,
              name: stored.title,
              doc: doc,
              pdfUrl: stored.pdf_url,
              coverUrl: stored.cover_url || '',
              totalPages: stored.total_pages,
              summary: stored.summary || undefined,
              category: stored.category || undefined,
              isFavorite: stored.is_favorite
            };
          })
        );
        
        setBooks(libraryBooks);
        setLoadingStatus(null);
        console.log(`Loaded ${libraryBooks.length} books from Supabase`);
      } catch (error) {
        console.error('Failed to load books from Supabase:', error);
        setLoadingStatus(null);
        // Continue with empty library - user can still upload new books
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
        setLoadingStatus(`Uploading Book ${i + 1} of ${total}...`);
        
        // Parse PDF first
        const doc = await getDocument(file);
        const coverBase64 = await extractCover(doc);
        
        setLoadingStatus(`Saving Book ${i + 1} of ${total} to cloud...`);
        
        // Upload PDF to Supabase Storage
        const pdfUrl = await uploadPDF(file);
        
        // Generate temporary ID for cover upload
        const tempId = Math.random().toString(36).substr(2, 9) + Date.now();
        
        // Upload cover to Supabase Storage
        let coverUrl = coverBase64; // fallback to base64
        try {
          coverUrl = await uploadCover(coverBase64, tempId);
        } catch (e) {
          console.warn('Cover upload failed, using base64:', e);
        }
        
        // Save metadata to Supabase database
        const savedBook = await saveBookMetadata({
          title: file.name.replace('.pdf', ''),
          original_filename: file.name,
          pdf_url: pdfUrl,
          cover_url: coverUrl,
          total_pages: doc.numPages,
          file_size: file.size
        });
        
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
      
      // Queue all books for category selection (one by one)
      if (newBooks.length > 0) {
        setUploadedBooksPending(newBooks);
      }
      
      setConversionToast(`Successfully uploaded ${newBooks.length} book(s) to cloud!`);
      setTimeout(() => setConversionToast(null), 4000);
      
    } catch (error) {
      console.error("Failed to upload PDF", error);
      setLoadingStatus(null);
      setConversionToast("Conversion failed. Please ensure your files are valid PDFs and try again.");
      setTimeout(() => setConversionToast(null), 5000);
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
      // Quick validation that PDF is accessible
      const doc = pendingBook.doc;
      await doc.getPage(1); // Just verify first page loads
      
      // Set view immediately - BookViewer will handle the detailed loading
      setSelectedBook(pendingBook);
      setPendingBook(null);
      setCurrentPage(0);
      setZoomLevel(1);
      navigate(`/reader/${pendingBook.id}`);
      
      // Small delay for transition
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Error loading book:', error);
      setConversionToast('Failed to load book. Please try again.');
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
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${darkMode ? 'bg-[#0D0D0F] text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
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

      <div className="flex-1 flex flex-col relative overflow-hidden">
        {!isLandingPage && <Header 
          view={view}
          darkMode={darkMode}
          homeVariant={homeVariant}
          onToggleHomeVariant={() => setHomeVariant(prev => prev === 1 ? 2 : 1)}
          onToggleSidebar={() => setSidebarOpen(prev => !prev)}
          fileName={selectedBook?.name} 
        />}

        <main className={`flex-1 relative w-full h-full ${isLandingPage ? '' : 'pt-16'} overflow-y-auto no-scrollbar ${darkMode ? 'bg-[#0D0D0F]' : 'bg-[#F5F5F7]'}`}>
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

            {/* Reader Route */}
            <Route path="/reader/:bookId" element={
              selectedBook && (
            <div className="w-full h-full min-h-0 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 overflow-hidden relative">
              {/* Light Purple/Lavender Background - matching dflip style */}
              <div className="absolute inset-0 bg-[#E8E4EF]" />
              
              {/* Close button */}
              <button 
                onClick={() => navigate('/library')}
                className="absolute top-4 right-4 z-50 w-10 h-10 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              {readerMode === 'preview' && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 bg-gray-900/90 backdrop-blur-xl text-white px-5 py-2.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase flex items-center gap-2 border border-gray-700 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  Preview Mode
                </div>
              )}

              {/* DFlip Viewer - full screen with built-in controls */}
              <div className="relative z-10 w-full h-full">
                <DflipViewer 
                  pdfUrl={selectedBook.pdfUrl}
                  onFlip={setCurrentPage}
                  mode={readerMode}
                />
              </div>

              {readerMode === 'preview' && (
                <button 
                  onClick={() => setReaderMode('manual')}
                  className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-xl text-black px-10 py-4 rounded-full font-bold text-sm shadow-2xl hover:bg-white transition-all active:scale-95 border border-white/50"
                >
                  Start Reading
                </button>
              )}
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

      {/* Upload Category Modal - shown after uploading a book */}
      <UploadCategoryModal
        book={uploadedBooksPending[0] || null}
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
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in fade-in slide-in-from-bottom-4 duration-300 ${
            conversionToast.startsWith('Conversion failed') 
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