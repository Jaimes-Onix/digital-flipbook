import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, ChevronLeft, X } from 'lucide-react';

type Orientation = 'landscape' | 'portrait';

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

const OrientationModal: React.FC<OrientationModalProps> = ({ files, darkMode, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<Orientation>('portrait');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <div
        className={`relative w-full max-w-md rounded-3xl p-8 shadow-2xl animate-scale-in ${darkMode
            ? 'bg-zinc-900 border border-white/[0.08]'
            : 'bg-white border border-gray-200'
          }`}
        style={{ animation: 'scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Close */}
        <button
          onClick={onCancel}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${darkMode ? 'text-zinc-500 hover:text-white hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'
            }`}
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className={`text-2xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Book Orientation
          </h2>
          <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            {files.length === 1
              ? `Choose the orientation for "${files[0].name.replace('.pdf', '')}"`
              : `Choose the orientation for ${files.length} books`}
          </p>
        </div>

        {/* Orientation Options */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* Portrait */}
          <button
            onClick={() => setSelected('portrait')}
            className={`group relative flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 ${selected === 'portrait'
                ? darkMode
                  ? 'border-emerald-500 bg-emerald-500/[0.08]'
                  : 'border-emerald-500 bg-emerald-50'
                : darkMode
                  ? 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
          >
            {/* Portrait book illustration */}
            <div className={`relative flex items-center justify-center rounded-lg transition-colors duration-200 ${selected === 'portrait'
                ? 'text-emerald-500'
                : darkMode ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-gray-400 group-hover:text-gray-600'
              }`}>
              {/* Tall rectangle for portrait */}
              <div className={`w-12 h-16 rounded-sm border-2 flex flex-col overflow-hidden transition-colors duration-200 ${selected === 'portrait'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : darkMode ? 'border-zinc-600 bg-zinc-800' : 'border-gray-300 bg-gray-100'
                }`}>
                <div className={`h-[30%] border-b transition-colors ${selected === 'portrait' ? 'border-emerald-500/40 bg-emerald-500/20' : darkMode ? 'border-zinc-700 bg-zinc-700' : 'border-gray-200 bg-gray-200'}`} />
                <div className="flex-1 flex flex-col gap-[3px] p-1 pt-1.5">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className={`h-[2px] rounded-full ${selected === 'portrait' ? 'bg-emerald-500/40' : darkMode ? 'bg-zinc-600' : 'bg-gray-300'}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className={`font-semibold text-sm ${selected === 'portrait' ? 'text-emerald-500' : darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Portrait</p>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Tall format</p>
            </div>

            {selected === 'portrait' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-current">
                  <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>

          {/* Landscape */}
          <button
            onClick={() => setSelected('landscape')}
            className={`group relative flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-200 ${selected === 'landscape'
                ? darkMode
                  ? 'border-emerald-500 bg-emerald-500/[0.08]'
                  : 'border-emerald-500 bg-emerald-50'
                : darkMode
                  ? 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]'
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
          >
            {/* Landscape book illustration */}
            <div className={`relative flex items-center justify-center transition-colors duration-200 ${selected === 'landscape'
                ? 'text-emerald-500'
                : darkMode ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-gray-400 group-hover:text-gray-600'
              }`}>
              {/* Wide rectangle for landscape */}
              <div className={`w-16 h-12 rounded-sm border-2 flex flex-col overflow-hidden transition-colors duration-200 ${selected === 'landscape'
                  ? 'border-emerald-500 bg-emerald-500/10'
                  : darkMode ? 'border-zinc-600 bg-zinc-800' : 'border-gray-300 bg-gray-100'
                }`}>
                <div className={`h-[28%] border-b transition-colors ${selected === 'landscape' ? 'border-emerald-500/40 bg-emerald-500/20' : darkMode ? 'border-zinc-700 bg-zinc-700' : 'border-gray-200 bg-gray-200'}`} />
                <div className="flex-1 flex flex-col gap-[3px] p-1 pt-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className={`h-[2px] rounded-full ${selected === 'landscape' ? 'bg-emerald-500/40' : darkMode ? 'bg-zinc-600' : 'bg-gray-300'}`} />
                  ))}
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className={`font-semibold text-sm ${selected === 'landscape' ? 'text-emerald-500' : darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Landscape</p>
              <p className={`text-xs mt-0.5 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Wide format</p>
            </div>

            {selected === 'landscape' && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg viewBox="0 0 12 12" className="w-3 h-3 text-white fill-current">
                  <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className={`flex-1 py-3 rounded-xl font-medium text-sm transition-colors ${darkMode
                ? 'bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-emerald-500 hover:bg-emerald-400 transition-colors"
          >
            Import Book
          </button>
        </div>
      </div>

      <style>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
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
            className={`absolute top-8 left-8 flex items-center gap-1 transition-colors font-medium text-sm group ${darkMode ? 'text-zinc-600 hover:text-white' : 'text-gray-400 hover:text-gray-900'
              }`}
          >
            <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
            Back to Library
          </button>
        )}

        <div className={`max-w-md w-full text-center px-8 py-10 shadow-2xl ${darkMode
            ? 'glass-card shadow-black/30'
            : 'bg-white shadow-lg shadow-gray-200/60 border border-gray-200 rounded-[24px]'
          }`}>
          <h1 className={`text-3xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Import PDF</h1>
          <p className={`mb-10 text-base ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Create premium digital flipbooks from your documents.</p>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative group w-full aspect-[4/3] rounded-2xl
              border border-dashed transition-all duration-300 ease-out
              flex flex-col items-center justify-center gap-6
              ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}
              ${isLoading ? 'border-emerald-500/30 bg-emerald-500/[0.03] cursor-wait' : ''}
              ${!isLoading && isDragging
                ? 'border-emerald-500 bg-emerald-500/[0.05] scale-[1.02]'
                : !isLoading
                  ? darkMode
                    ? 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.03]'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-100'
                  : ''
              }
            `}
          >
            {isLoading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-lg animate-pulse" />
                  <Loader2 className="relative w-12 h-12 text-emerald-500 animate-spin" strokeWidth={2} />
                </div>
                <span className={`font-medium text-base tracking-wide px-8 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {statusMessage || "Processing..."}
                </span>
              </div>
            ) : (
              <>
                <div className={`p-5 rounded-2xl transition-colors duration-300 ${isDragging
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : darkMode
                      ? 'bg-white/[0.04] text-zinc-600 group-hover:bg-white/[0.06] group-hover:text-zinc-400'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-gray-500'
                  }`}>
                  <UploadCloud size={48} strokeWidth={1.5} />
                </div>

                <div className="space-y-1">
                  <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Drag & Drop PDF</p>
                  <p className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>or click to browse files</p>
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
            <div className={`mt-8 flex items-center justify-center gap-2 text-sm ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
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
