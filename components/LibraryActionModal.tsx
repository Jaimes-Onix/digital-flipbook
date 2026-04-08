import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, X, Trash2, AlertCircle, Check, Heart, Share2, Loader2, Pencil, Calendar, Clock, FolderSync, Settings, Download, FileText } from 'lucide-react';
import { LibraryBook, BookCategory } from '../types';
import ShareLinkModal from './ShareLinkModal';

const CATEGORY_OPTIONS: { value: BookCategory; label: string }[] = [
  { value: 'philippines', label: 'Philippines' },
  { value: 'internal', label: 'Internal' },
  { value: 'international', label: 'International' },
  { value: 'ph_interns', label: 'PH Interns' },
  { value: 'deseret', label: 'Deseret' },
  { value: 'angelhost', label: 'Angelhost' },
];

const ORIENTATION_OPTIONS: { value: 'portrait' | 'landscape' | 'trifold'; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
  { value: 'trifold', label: 'Tri fold' },
];

interface LibraryActionModalProps {
  book: LibraryBook | null;
  onClose: () => void;
  onSelectMode: (mode: 'manual' | 'preview') => void;
  onUpdateCategory?: (id: string, category?: BookCategory) => void;
  onUpdateOrientation?: (id: string, orientation: 'portrait' | 'landscape' | 'trifold') => void;
  onUpdateName?: (id: string, newName: string) => void;
  onToggleFavorite?: (id: string) => void;
  isLoadingBook?: boolean;
  onRemove?: (id: string) => void;
  darkMode?: boolean;
  customCategories?: import('../types').CustomCategory[];
}

const LibraryActionModal: React.FC<LibraryActionModalProps> = ({
  book, onClose, onSelectMode, onUpdateCategory, onUpdateOrientation, onUpdateName, onToggleFavorite, isLoadingBook, onRemove, darkMode = true, customCategories = []
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [showTransferSuccess, setShowTransferSuccess] = useState(false);
  const [transferredTo, setTransferredTo] = useState('');
  const [pendingTransferCategory, setPendingTransferCategory] = useState<{ slug: string, name: string } | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isChangingOrientation, setIsChangingOrientation] = useState(false);
  const [editedName, setEditedName] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShowConfirmDelete(false);
    setShowShareModal(false);
    setIsEditingName(false);
    setIsTransferring(false);
    setShowTransferSuccess(false);
    setPendingTransferCategory(null);
    setShowSettingsMenu(false);
    setIsDownloadingPDF(false);
    setDownloadError(null);
    setIsChangingOrientation(false);
  }, [book?.id]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  const handleStartEditing = () => {
    if (!book) return;
    setEditedName(book.name.replace('.pdf', '').replace(/_/g, ' '));
    setIsEditingName(true);
  };

  const handleSaveName = () => {
    if (!book || !onUpdateName) return;
    const trimmed = editedName.trim();
    if (trimmed && trimmed !== book.name.replace('.pdf', '').replace(/_/g, ' ')) {
      onUpdateName(book.id, trimmed);
    }
    setIsEditingName(false);
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
  };

  const handleDownloadPDF = async () => {
    if (!book) return;
    setIsDownloadingPDF(true);
    setDownloadError(null);
    try {
      const response = await fetch(book.pdfUrl);
      if (!response.ok) throw new Error('Failed to download PDF');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = book.name.endsWith('.pdf') ? book.name : `${book.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF Download Error:', err);
      setDownloadError('Failed to download PDF.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  if (!book) return null;

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 animate-in fade-in duration-300" onClick={onClose}>
        <div
          className={`relative backdrop-blur-3xl w-full max-w-5xl max-h-[90vh] rounded-[32px] shadow-2xl shadow-black/40 border overflow-hidden animate-in zoom-in-95 fade-in duration-500 ${darkMode ? 'bg-[#141418] border-white/[0.06]' : 'bg-white border-gray-200'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Absolute Close Button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 sm:top-6 sm:right-6 z-[70] p-2 sm:p-2.5 rounded-full transition-colors ${darkMode ? 'bg-white/[0.05] text-zinc-500 hover:text-zinc-300' : 'bg-gray-100 text-gray-500 hover:text-gray-700'}`}
            title="Close"
          >
            <X size={18} className="sm:w-5 sm:h-5" />
          </button>
          {showTransferSuccess ? (
            <div className="p-10 flex flex-col items-center justify-center text-center w-full min-h-[400px]">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg ${darkMode ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'bg-orange-50 text-orange-500 border border-orange-200'}`}>
                <Check size={40} className="animate-in zoom-in duration-300" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transfer Successful!</h3>
              <p className={`text-base mb-10 leading-relaxed max-w-sm ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                "<span className={`font-semibold ${darkMode ? 'text-zinc-200' : 'text-gray-700'}`}>{book?.name.replace('.pdf', '').replace(/_/g, ' ')}</span>" has been successfully moved to <span className={`font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>{transferredTo}</span>.
              </p>
              <button
                onClick={() => setShowTransferSuccess(false)}
                className={`w-full max-w-[200px] py-4 rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg ${darkMode ? 'bg-white hover:bg-zinc-100 text-zinc-900 shadow-white/5' : 'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-300/30'}`}>
                Done
              </button>
            </div>
          ) : !showConfirmDelete ? (
            <div className="flex flex-col md:flex-row">

              {/* Left side — Book Cover */}
              <div className={`flex-shrink-0 flex items-center justify-center p-5 md:p-14 ${darkMode ? 'bg-black/20' : 'bg-gray-50/80'} md:w-[380px] lg:w-[420px]`}>
                <div className={`relative ${book.orientation === 'landscape' ? 'w-full max-w-[85vw] md:max-w-xs md:w-80 aspect-[4/3]' : 'w-full max-w-[70vw] md:max-w-[280px] md:w-72 aspect-[3/4]'}`}>
                  {/* Decorative background layers for "thick book" effect (Portrait Only) */}
                  {book.orientation === 'portrait' && (
                    <>
                      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl bg-black/30 border border-white/5" />
                      <div className="absolute inset-0 translate-x-0.5 translate-y-0.5 rounded-2xl bg-black/30 border border-white/5" />
                    </>
                  )}

                  {/* Actual Cover */}
                  <div className={`relative h-full rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-white/[0.06] ${darkMode ? 'bg-zinc-900/80' : 'bg-gray-100'}`}>
                    {/* Blurred Background Fallback */}
                    <img src={book.coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-xl scale-110" />
                    {/* Main Cover Image */}
                    <img src={book.coverUrl} alt={book.name} className="relative w-full h-full object-contain z-10" />
                  </div>
                </div>
              </div>

              {/* Right side — Details */}
              <div className="flex-1 p-5 md:p-10 pt-2 md:pt-8 overflow-y-auto max-h-[60vh] md:max-h-[70vh] no-scrollbar">

                {/* Settings & Actions Reveal */}
                {/* Settings & Actions Reveal */}
                {!isEditingName && (
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                        className={`p-2 rounded-xl transition-all duration-500 ${showSettingsMenu ? 'rotate-180 bg-white/10' : 'bg-transparent'} ${darkMode ? 'text-zinc-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
                        title="Settings"
                      >
                        <Settings size={22} className={showSettingsMenu ? 'text-lime-400' : ''} />
                      </button>

                      {showSettingsMenu && (
                        <div className="flex items-center gap-2.5 animate-in slide-in-from-left-4 duration-500 fade-in">
                          {onToggleFavorite && (
                            <button
                              onClick={() => onToggleFavorite(book.id)}
                              className={`p-2.5 rounded-xl transition-all ${book.isFavorite ? 'bg-red-500/15 text-red-500' : darkMode ? 'bg-white/[0.05] text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'bg-gray-100 text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                              title={book.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                            >
                              <Heart size={20} fill={book.isFavorite ? 'currentColor' : 'none'} className="transition-transform active:scale-125" />
                            </button>
                          )}
                          <button
                            onClick={() => setShowConfirmDelete(true)}
                            className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-500 hover:bg-red-100 border border-red-200/50'}`}
                            title="Remove Book"
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {downloadError && (
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium animate-in slide-in-from-right-2 ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                          <AlertCircle size={14} />
                          {downloadError}
                        </div>
                      )}
                      <button
                        onClick={handleDownloadPDF}
                        disabled={isDownloadingPDF}
                        className={`p-2.5 rounded-xl transition-all ${isDownloadingPDF ? 'bg-lime-500/10 text-lime-400' : darkMode ? 'bg-white/[0.05] text-zinc-500 hover:text-lime-400 hover:bg-lime-500/10' : 'bg-gray-100 text-gray-400 hover:text-lime-600 hover:bg-emerald-50'}`}
                        title="Download PDF"
                      >
                        {isDownloadingPDF ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Download size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Editable Book Name */}
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveName();
                        if (e.key === 'Escape') handleCancelEdit();
                      }}
                      className={`flex-1 text-2xl font-bold rounded-xl px-3 py-1.5 outline-none border transition-colors min-w-0 ${darkMode
                        ? 'bg-white/[0.06] text-white border-white/10 focus:border-white/25'
                        : 'bg-gray-100 text-gray-900 border-gray-200 focus:border-gray-400'
                        }`}
                    />
                    <button
                      onClick={handleSaveName}
                      className="p-2 rounded-full bg-lime-500/15 text-lime-400 hover:bg-lime-500/25 transition-colors flex-shrink-0"
                      title="Save"
                    >
                      <Check size={16} />
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className={`p-2 rounded-full transition-colors flex-shrink-0 ${darkMode ? 'bg-white/[0.05] text-zinc-500 hover:bg-white/[0.1]' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 mb-2 group cursor-pointer" onClick={onUpdateName ? handleStartEditing : undefined}>
                    <h3 className={`text-base sm:text-2xl font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {book.name.replace('.pdf', '').replace(/_/g, ' ')}
                    </h3>
                    {onUpdateName && (
                      <button
                        className={`p-1.5 rounded-full transition-all flex-shrink-0 mt-1 ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        title="Edit name"
                      >
                        <Pencil size={16} />
                      </button>
                    )}
                  </div>
                )}

                <p className={`text-[11px] mb-1.5 uppercase tracking-widest font-medium ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                  {book.totalPages} Pages
                </p>
                {book.createdAt && (
                  <div className={`flex flex-col gap-1.5 mb-4 ${darkMode ? 'text-lime-400' : 'text-emerald-600'}`}>
                    <div className="flex items-center gap-1.2">
                      <Calendar size={13} />
                      <span className="text-[12px] font-medium">
                        Date Added: {new Date(book.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.2">
                      <Clock size={13} className={darkMode ? 'text-lime-400/70' : 'text-emerald-600/70'} />
                      <span className={`text-[11px] font-medium ${darkMode ? 'text-lime-400/70' : 'text-emerald-600/70'}`}>
                        Time Added: {new Date(book.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Orientation Display or Selection */}
                {onUpdateOrientation && (
                  <div className="mb-2.5 sm:mb-4">
                    {!isChangingOrientation ? (
                      <div className="flex items-center gap-1.5 cursor-pointer group" onClick={() => setIsChangingOrientation(true)}>
                        <p className={`text-xs sm:text-[11px] font-bold uppercase tracking-[0.15em] ${darkMode ? 'text-orange-500/80' : 'text-orange-600/80'}`}>Orientation:</p>
                        <span className={`text-xs sm:text-xl font-bold transition-colors ${darkMode ? 'text-orange-400 group-hover:text-orange-300' : 'text-orange-600 group-hover:text-orange-700'}`}>
                          {ORIENTATION_OPTIONS.find(o => o.value === (book.orientation || 'portrait'))?.label}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] mb-1 ${darkMode ? 'text-orange-500/80' : 'text-orange-600/80'}`}>Select Orientation</p>
                        <div className="flex flex-wrap gap-2">
                          {ORIENTATION_OPTIONS.map(({ value, label }) => {
                            const isSelected = book.orientation === value || (!book.orientation && value === 'portrait');
                            return (
                              <button
                                key={value}
                                onClick={() => {
                                  onUpdateOrientation(book.id, value);
                                  setIsChangingOrientation(false);
                                }}
                                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer border ${isSelected
                                  ? darkMode
                                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.15)]'
                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                  : darkMode
                                    ? 'bg-white/[0.04] text-zinc-400 hover:bg-orange-500/10 hover:text-orange-400 border-transparent'
                                    : 'bg-gray-100 text-gray-600 hover:bg-orange-50 border-transparent'
                                  }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => setIsChangingOrientation(false)}
                          className={`text-xs sm:text-sm tracking-wide ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Category Display or Selection */}
                {onUpdateCategory && (
                  <div className="mb-4">
                    {!isTransferring ? (
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs sm:text-[11px] font-bold uppercase tracking-[0.15em] ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Category:</p>
                        <span className={`text-xs sm:text-xl font-bold ${darkMode ? (book.category ? 'text-white' : 'text-zinc-500') : (book.category ? 'text-gray-900' : 'text-gray-400')}`}>
                          {book.category
                            ? (CATEGORY_OPTIONS.find(c => c.value === book.category)?.label || customCategories.find(c => c.slug === book.category)?.name || book.category)
                            : "Uncategorized"}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2.5">
                          {/* Built-in Categories */}
                          {CATEGORY_OPTIONS.map(({ value, label }) => {
                            const isSelected = pendingTransferCategory ? pendingTransferCategory.slug === value : book.category === value;
                            return (
                              <button
                                key={value}
                                onClick={() => setPendingTransferCategory({ slug: value, name: label })}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border ${isSelected
                                  ? darkMode
                                    ? 'bg-lime-500/20 text-lime-400 border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.15)]'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : darkMode
                                    ? 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white border-transparent'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
                                  }`}
                              >
                                {label}
                              </button>
                            );
                          })}
                          {/* Custom Categories */}
                          {customCategories.filter(cat =>
                            !CATEGORY_OPTIONS.some(option => option.value === cat.slug)
                          ).reduce((unique: typeof customCategories, cat) => {
                            if (!unique.some(u => u.slug === cat.slug)) {
                              unique.push(cat);
                            }
                            return unique;
                          }, []).map((cat) => {
                            const isSelected = pendingTransferCategory ? pendingTransferCategory.slug === cat.slug : book.category === cat.slug;
                            return (
                              <button
                                key={cat.slug}
                                onClick={() => setPendingTransferCategory({ slug: cat.slug, name: cat.name })}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer border ${isSelected
                                  ? darkMode
                                    ? 'bg-lime-500/20 text-lime-400 border-lime-500/50 shadow-[0_0_15px_rgba(132,204,22,0.15)]'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : darkMode
                                    ? 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white border-transparent'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
                                  }`}
                              >
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>

                        {pendingTransferCategory && pendingTransferCategory.slug !== book.category && (
                          <div className="pt-2">
                            <button
                              onClick={() => {
                                onUpdateCategory(book.id, pendingTransferCategory.slug);
                                setTransferredTo(pendingTransferCategory.name);
                                setShowTransferSuccess(true);
                                setIsTransferring(false);
                                setPendingTransferCategory(null);
                              }}
                              className={`w-full py-2.5 rounded-xl font-bold transition-all shadow-md mt-2 ${darkMode ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-300'}`}
                            >
                              Confirm Transfer
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            setIsTransferring(false);
                            setPendingTransferCategory(null);
                          }}
                          className={`text-sm tracking-wide mt-2 ${darkMode ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2.5 sm:space-y-4 mt-3 sm:mt-6">
                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => onSelectMode('manual')}
                      disabled={isLoadingBook}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-base font-bold transition-all active:scale-[0.98] shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed ${darkMode ? 'bg-white hover:bg-zinc-100 text-zinc-900 shadow-white/5' : 'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-300/30'
                        }`}
                    >
                      {isLoadingBook ? (
                        <>
                          <Loader2 size={14} className="animate-spin sm:w-5 sm:h-5" />
                          <span>Loading...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen size={14} className="transition-transform group-hover:scale-110 sm:w-5 sm:h-5" />
                          <span>Read Now</span>
                        </>
                      )}
                    </button>

                    {onUpdateCategory && (
                      <button
                        onClick={() => setIsTransferring(!isTransferring)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 sm:py-4 rounded-xl sm:rounded-2xl text-[11px] sm:text-base font-bold transition-all active:scale-[0.98] shadow-lg ${isTransferring
                          ? (darkMode ? 'bg-white/[0.15] text-white border border-white/20' : 'bg-gray-200 text-gray-800 border-gray-300')
                          : (darkMode ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.15)]' : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-300')
                          }`}
                      >
                        <FolderSync size={14} className="sm:w-5 sm:h-5" />
                        <span>Transfer Book</span>
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2 sm:gap-3">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className={`w-full flex items-center justify-center gap-2 sm:gap-3 py-2.5 sm:py-5 rounded-xl sm:rounded-2xl text-[13px] sm:text-lg font-semibold transition-all active:scale-[0.98] ${darkMode ? 'bg-lime-500/10 hover:bg-lime-500/20 text-lime-400 border border-lime-500/20' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                    >
                      <Share2 size={15} className="sm:w-5 sm:h-5" /> Share Book
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Delete Confirmation */
            <div className="p-6 sm:p-10 flex flex-col items-center text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-red-500/10 text-red-400 rounded-full flex items-center justify-center mb-6">
                <AlertCircle size={28} className="sm:w-8 sm:h-8" />
              </div>
              <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Remove Book?</h3>
              <p className={`text-sm mb-10 leading-relaxed ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                Remove <span className={`font-semibold ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>"{book.name.replace('.pdf', '').replace(/_/g, ' ')}"</span>? This can't be undone.
              </p>
              <div className="w-full max-w-sm space-y-3">
                <button onClick={() => onRemove && onRemove(book.id)}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/20">
                  Remove Permanently
                </button>
                <button onClick={() => setShowConfirmDelete(false)}
                  className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${darkMode ? 'bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {book && (
        <ShareLinkModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          linkType="book"
          target={book.id}
          title={`Share "${book.name.replace('.pdf', '').replace(/_/g, ' ')}"`}
          darkMode={darkMode}
          bookName={book.name.replace('.pdf', '').replace(/_/g, ' ')}
          bookCategory={book.category}
        />
      )}
    </>
  );
};

export default LibraryActionModal;
