import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, ChevronLeft, X, RectangleVertical, RectangleHorizontal, Columns3, Check } from 'lucide-react';
import { motion } from 'framer-motion';

type Orientation = 'landscape' | 'portrait' | 'trifold';

interface UploadProps {
  onFilesSelect: (files: File[], orientation: Orientation) => void;
  onBack?: () => void;
  isLoading: boolean;
  statusMessage?: string;
  darkMode?: boolean;
}

interface OrientationModalProps {
  files: File[];
  darkMode: boolean;
  onConfirm: (orientation: Orientation) => void;
  onCancel: () => void;
}

type OrientationMeta = {
  title: string;
  tagline: string;
  description: string;
  icon: React.ElementType;
  bestFor: string;
};

const ORIENTATION_DETAILS: Record<Orientation, OrientationMeta> = {
  portrait: {
    title: 'Portrait',
    tagline: 'Classic vertical book',
    description: 'Standard vertical pages, perfect for books, reports, and most documents.',
    icon: RectangleVertical,
    bestFor: 'Books · Reports · Documents',
  },
  landscape: {
    title: 'Landscape',
    tagline: 'Wide horizontal spread',
    description: 'Horizontal layout, great for presentations, magazines, and visual content.',
    icon: RectangleHorizontal,
    bestFor: 'Presentations · Magazines · Photo books',
  },
  trifold: {
    title: 'Trifold',
    tagline: '3-panel brochure',
    description: 'Three-panel folding layout for marketing brochures and pamphlets.',
    icon: Columns3,
    bestFor: 'Brochures · Flyers · Pamphlets',
  },
};

// Realistic mini-mockup of what the book will look like in each orientation.
// Kept monochrome (lime accents) so the three tiles read as a coherent set
// rather than a rainbow of competing colors.
const OrientationPreview: React.FC<{ orientation: Orientation; active: boolean }> = ({ orientation, active }) => {
  const accent = active ? 'rgba(132, 204, 22, 0.95)' : 'rgba(255, 255, 255, 0.35)';
  const fill = active ? 'rgba(132, 204, 22, 0.12)' : 'rgba(255, 255, 255, 0.04)';
  const line = active ? 'rgba(132, 204, 22, 0.5)' : 'rgba(255, 255, 255, 0.18)';

  if (orientation === 'portrait') {
    return (
      <div className="flex items-center justify-center gap-1.5">
        {[0, 1].map(i => (
          <div
            key={i}
            className="rounded-[3px] flex flex-col gap-1.5 p-2"
            style={{ width: 46, height: 64, border: `1.5px solid ${accent}`, background: fill }}
          >
            <div className="h-[2px] w-full rounded-full" style={{ background: line }} />
            <div className="h-[2px] w-5/6 rounded-full" style={{ background: line }} />
            <div className="h-[2px] w-full rounded-full" style={{ background: line }} />
            <div className="h-[2px] w-2/3 rounded-full" style={{ background: line }} />
            <div className="h-[2px] w-4/5 rounded-full" style={{ background: line }} />
          </div>
        ))}
      </div>
    );
  }

  if (orientation === 'landscape') {
    return (
      <div
        className="rounded-[4px] flex p-2 gap-1.5"
        style={{ width: 116, height: 64, border: `1.5px solid ${accent}`, background: fill }}
      >
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className="h-[2px] w-full rounded-full" style={{ background: line }} />
          <div className="h-[2px] w-3/4 rounded-full" style={{ background: line }} />
          <div className="h-[2px] w-5/6 rounded-full" style={{ background: line }} />
        </div>
        <div className="w-px" style={{ background: accent, opacity: 0.6 }} />
        <div className="flex-1 flex flex-col gap-1 justify-center">
          <div className="h-[2px] w-5/6 rounded-full" style={{ background: line }} />
          <div className="h-[2px] w-full rounded-full" style={{ background: line }} />
          <div className="h-[2px] w-2/3 rounded-full" style={{ background: line }} />
        </div>
      </div>
    );
  }

  // trifold
  return (
    <div className="flex items-center" style={{ width: 122, height: 64 }}>
      <div
        className="rounded-l-[3px] flex flex-col gap-1 p-1.5"
        style={{ width: 40, height: '100%', border: `1.5px solid ${accent}`, borderRight: 'none', background: fill }}
      >
        <div className="h-[1.5px] w-full rounded-full" style={{ background: line }} />
        <div className="h-[1.5px] w-3/4 rounded-full" style={{ background: line }} />
        <div className="h-[1.5px] w-5/6 rounded-full" style={{ background: line }} />
      </div>
      <div
        className="flex flex-col gap-1 p-1.5"
        style={{ width: 40, height: '100%', border: `1.5px solid ${accent}`, borderRight: 'none', background: active ? 'rgba(132, 204, 22, 0.18)' : 'rgba(255, 255, 255, 0.06)' }}
      >
        <div className="h-[1.5px] w-full rounded-full" style={{ background: line }} />
        <div className="h-[1.5px] w-full rounded-full" style={{ background: line }} />
        <div className="h-[1.5px] w-2/3 rounded-full" style={{ background: line }} />
      </div>
      <div
        className="rounded-r-[3px] flex flex-col gap-1 p-1.5"
        style={{ width: 40, height: '100%', border: `1.5px solid ${accent}`, background: fill }}
      >
        <div className="h-[1.5px] w-5/6 rounded-full" style={{ background: line }} />
        <div className="h-[1.5px] w-full rounded-full" style={{ background: line }} />
        <div className="h-[1.5px] w-3/4 rounded-full" style={{ background: line }} />
      </div>
    </div>
  );
};

const OrientationModal: React.FC<OrientationModalProps> = ({ files, darkMode, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<Orientation>('portrait');

  const options: Orientation[] = ['portrait', 'landscape', 'trifold'];
  const fileCount = files.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backdropFilter: 'blur(16px)', backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl ${
          darkMode
            ? 'bg-[#0d0d11] border border-white/[0.06]'
            : 'bg-white border border-gray-200'
        }`}
        style={{
          boxShadow: darkMode
            ? '0 24px 60px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.04)'
            : '0 24px 60px -12px rgba(0, 0, 0, 0.18)',
        }}
      >
        {/* Header */}
        <div className="px-6 sm:px-8 pt-6 sm:pt-7 pb-4 sm:pb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className={`text-lg sm:text-xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Choose a format
            </h2>
            <p className={`mt-1 text-[13px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              How should we lay out{' '}
              <span className={`font-medium ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                {fileCount === 1 ? files[0].name.replace(/\.pdf$/i, '') : `${fileCount} documents`}
              </span>
              ?
            </p>
          </div>
          <button
            onClick={onCancel}
            aria-label="Close"
            className={`p-2 rounded-lg transition-colors shrink-0 ${
              darkMode
                ? 'text-zinc-500 hover:text-white hover:bg-white/[0.06]'
                : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Tile Grid */}
        <div className="px-6 sm:px-8 pb-5 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {options.map((opt) => {
              const meta = ORIENTATION_DETAILS[opt];
              const active = selected === opt;
              const Icon = meta.icon as React.FC<{ size?: number; className?: string; strokeWidth?: number }>;

              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setSelected(opt)}
                  className={`group relative text-left rounded-xl p-4 sm:p-5 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-lime-500/50 ${
                    active
                      ? darkMode
                        ? 'bg-lime-500/[0.08] border border-lime-500/60'
                        : 'bg-lime-50 border border-lime-500'
                      : darkMode
                        ? 'bg-white/[0.02] border border-white/[0.06] hover:border-white/15 hover:bg-white/[0.04]'
                        : 'bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  style={
                    active
                      ? { boxShadow: '0 0 0 1px rgba(132, 204, 22, 0.4), 0 8px 24px -8px rgba(132, 204, 22, 0.25)' }
                      : undefined
                  }
                >
                  {/* Checkmark on selected */}
                  {active && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                      className="absolute top-3 right-3 w-5 h-5 rounded-full bg-lime-500 flex items-center justify-center"
                    >
                      <Check size={12} strokeWidth={3} className="text-white" />
                    </motion.div>
                  )}

                  {/* Preview */}
                  <div
                    className={`h-24 rounded-lg flex items-center justify-center mb-4 transition-colors ${
                      darkMode
                        ? active ? 'bg-black/40' : 'bg-black/30'
                        : active ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <OrientationPreview orientation={opt} active={active} />
                  </div>

                  {/* Title + icon */}
                  <div className="flex items-center gap-2 mb-1">
                    <Icon
                      size={14}
                      strokeWidth={2}
                      className={active ? 'text-lime-500' : darkMode ? 'text-zinc-500' : 'text-gray-400'}
                    />
                    <span className={`text-[15px] font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {meta.title}
                    </span>
                  </div>

                  <p className={`text-[12px] leading-snug ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                    {meta.tagline}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Subtle description of the selected format */}
          <p
            className={`mt-5 text-[13px] leading-relaxed ${
              darkMode ? 'text-zinc-400' : 'text-gray-600'
            }`}
          >
            {ORIENTATION_DETAILS[selected].description}{' '}
            <span className={darkMode ? 'text-zinc-600' : 'text-gray-400'}>
              · Best for {ORIENTATION_DETAILS[selected].bestFor}.
            </span>
          </p>
        </div>

        {/* Footer */}
        <div
          className={`px-6 sm:px-8 py-4 flex items-center justify-between gap-3 border-t ${
            darkMode ? 'border-white/[0.05] bg-black/20' : 'border-gray-100 bg-gray-50/60'
          }`}
        >
          <span className={`text-[12px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            Applying to{' '}
            <span className={`font-semibold ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
              {fileCount}
            </span>{' '}
            {fileCount === 1 ? 'document' : 'documents'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className={`px-4 py-2 rounded-lg text-[13px] font-medium transition-colors ${
                darkMode
                  ? 'text-zinc-400 hover:text-white hover:bg-white/[0.06]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(selected)}
              className="px-5 py-2 rounded-lg text-[13px] font-semibold text-black bg-lime-500 hover:bg-lime-400 active:bg-lime-600 transition-colors shadow-sm shadow-lime-500/30"
            >
              Import book
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Upload: React.FC<UploadProps> = ({ onFilesSelect, onBack, isLoading, statusMessage, darkMode = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); if (!isLoading) setIsDragging(true); }, [isLoading]);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (isLoading) return;
    const pdfFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) setPendingFiles(pdfFiles);
    else if (e.dataTransfer.files.length > 0) alert('Please upload valid PDF files.');
  }, [isLoading]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const pdfFiles = e.target.files ? Array.from(e.target.files).filter(f => f.type === 'application/pdf') : [];
    if (pdfFiles.length > 0) setPendingFiles(pdfFiles);
    else if (e.target.files && e.target.files.length > 0) alert('Please select valid PDF files.');
    e.target.value = '';
  }, []);

  const handleOrientationConfirm = useCallback((orientation: Orientation) => {
    if (pendingFiles) {
      onFilesSelect(pendingFiles, orientation);
      setPendingFiles(null);
    }
  }, [pendingFiles, onFilesSelect]);

  const handleOrientationCancel = useCallback(() => {
    setPendingFiles(null);
  }, []);

  return (
    <>
      {pendingFiles && (
        <OrientationModal
          files={pendingFiles}
          darkMode={darkMode}
          onConfirm={handleOrientationConfirm}
          onCancel={handleOrientationCancel}
        />
      )}

      <div className="flex flex-col items-center justify-center h-full w-full px-4 fade-in relative">
        {onBack && !isLoading && (
          <button
            onClick={onBack}
            className={`absolute top-6 left-4 sm:top-8 sm:left-8 flex items-center gap-1 transition-colors font-medium text-[13px] sm:text-sm group ${darkMode ? 'text-zinc-600 hover:text-white' : 'text-gray-400 hover:text-gray-900'
              }`}
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform sm:size-[18px]" />
            Back to Library
          </button>
        )}

        <div className={`max-w-md w-full text-center px-6 py-8 sm:px-8 sm:py-10 shadow-2xl ${darkMode
          ? 'glass-card shadow-black/30'
          : 'bg-white shadow-lg shadow-gray-200/60 border border-gray-200 rounded-[24px]'
          }`}>
          <h1 className={`text-2xl sm:text-3xl font-bold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${darkMode ? 'from-lime-300 via-lime-400 to-teal-400' : 'from-lime-500 via-lime-600 to-teal-600'}`}>Import PDF</h1>
          <p className={`mb-6 sm:mb-10 text-sm sm:text-base ${darkMode ? 'text-white' : 'text-gray-500'}`}>Create premium digital books from your documents.</p>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative group w-full aspect-[4/3] rounded-2xl
              border border-dashed transition-all duration-300 ease-out
              flex flex-col items-center justify-center gap-6
              ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}
              ${isLoading ? 'border-lime-500/30 bg-lime-500/[0.03] cursor-wait' : ''}
              ${!isLoading && isDragging
                ? 'border-lime-500 bg-lime-500/[0.05] shadow-[0_0_30px_rgba(132,204,22,0.2)] scale-[1.02]'
                : !isLoading
                  ? darkMode
                    ? 'border-white/[0.08] hover:border-lime-500/50 hover:bg-lime-500/[0.03] hover:shadow-[0_0_20px_rgba(132,204,22,0.1)]'
                    : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50'
                  : ''
              }
            `}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-lime-500/20 rounded-full blur-lg animate-pulse" />
                  <Loader2 className="relative w-12 h-12 text-lime-500 animate-spin" strokeWidth={2} />
                </div>
                <span className={`font-medium text-base tracking-wide px-8 ${darkMode ? 'text-white' : 'text-gray-500'}`}>
                  {statusMessage || "Processing..."}
                </span>
              </div>
            ) : (
              <>
                <div className={`p-5 rounded-2xl transition-colors duration-300 ${isDragging
                  ? 'bg-lime-500/20 text-lime-400'
                  : darkMode
                    ? 'bg-lime-500/10 text-lime-500 group-hover:bg-lime-500/20 group-hover:text-lime-400 group-hover:shadow-[0_0_20px_rgba(132,204,22,0.2)]'
                    : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200 group-hover:text-emerald-700'
                  }`}>
                  <UploadCloud size={48} strokeWidth={1.5} />
                </div>

                <div className="space-y-1">
                  <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Drag & Drop PDF</p>
                  <p className={`text-sm ${darkMode ? 'text-white/80' : 'text-gray-400'}`}>or click to browse files</p>
                </div>

                <input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={handleFileInput}
                  disabled={isLoading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
              </>
            )}
          </div>

          {!isLoading && (
            <div className={`mt-8 flex items-center justify-center gap-2 text-sm ${darkMode ? 'text-white/80' : 'text-gray-400'}`}>
              <FileText size={16} />
              <span>Lifewood Standard PDF Support</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Upload;
