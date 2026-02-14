import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, ChevronLeft } from 'lucide-react';

interface UploadProps {
  onFilesSelect: (files: File[]) => void;
  onBack?: () => void;
  isLoading: boolean;
  statusMessage?: string;
  darkMode?: boolean;
}

const Upload: React.FC<UploadProps> = ({ onFilesSelect, onBack, isLoading, statusMessage, darkMode = false }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); if (!isLoading) setIsDragging(true); }, [isLoading]);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (isLoading) return;
    const pdfFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (pdfFiles.length > 0) onFilesSelect(pdfFiles);
    else if (e.dataTransfer.files.length > 0) alert('Please upload valid PDF files.');
  }, [onFilesSelect, isLoading]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const pdfFiles = e.target.files ? Array.from(e.target.files).filter(f => f.type === 'application/pdf') : [];
    if (pdfFiles.length > 0) onFilesSelect(pdfFiles);
    else if (e.target.files && e.target.files.length > 0) alert('Please select valid PDF files.');
    e.target.value = '';
  }, [onFilesSelect]);

  return (
    <div className="flex flex-col items-center justify-center h-full w-full px-4 fade-in relative">
      {onBack && !isLoading && (
        <button
          onClick={onBack}
          className={`absolute top-8 left-8 flex items-center gap-1 transition-colors font-medium text-sm group ${
            darkMode ? 'text-zinc-600 hover:text-white' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Library
        </button>
      )}

      <div className={`max-w-md w-full text-center px-8 py-10 shadow-2xl ${
        darkMode 
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
              <div className={`p-5 rounded-2xl transition-colors duration-300 ${
                isDragging 
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
  );
};

export default Upload;
