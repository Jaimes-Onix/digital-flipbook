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

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      if (isLoading) return;

      const droppedFiles = Array.from(e.dataTransfer.files) as File[];
      const pdfFiles = droppedFiles.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length > 0) {
        onFilesSelect(pdfFiles);
      } else if (droppedFiles.length > 0) {
        alert('Please upload valid PDF files.');
      }
    },
    [onFilesSelect, isLoading]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files ? Array.from(e.target.files) as File[] : [];
      const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
      
      if (pdfFiles.length > 0) {
        onFilesSelect(pdfFiles);
      } else if (selectedFiles.length > 0) {
        alert('Please select valid PDF files. Only PDF format is supported for conversion to digital flipbooks.');
      }
      e.target.value = ''; // Reset so the same file can be selected again
    },
    [onFilesSelect]
  );

  return (
    <div className={`flex flex-col items-center justify-center h-full w-full px-4 fade-in relative transition-colors duration-300`}>
      {onBack && !isLoading && (
        <button
          onClick={onBack}
          className={`absolute top-8 left-8 flex items-center gap-1 transition-colors font-medium text-sm group ${
            darkMode ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-900'
          }`}
        >
          <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Library
        </button>
      )}

      <div className={`max-w-md w-full text-center rounded-3xl px-8 py-10 ${
        darkMode
          ? 'bg-black/40 backdrop-blur-2xl shadow-2xl shadow-black/20 border border-white/10'
          : 'bg-white/50 backdrop-blur-2xl shadow-2xl shadow-black/5 border border-white/60'
      }`}>
        <h1 className={`text-4xl font-semibold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Lifewood Flipbook
        </h1>
        <p className={`mb-10 text-lg ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Create premium digital flipbooks from PDF.
        </p>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative group
            w-full aspect-[4/3] rounded-3xl
            border-2 border-dashed transition-all duration-300 ease-out
            flex flex-col items-center justify-center gap-6
            ${darkMode 
              ? 'bg-[#1A1A1D] shadow-xl shadow-black/50' 
              : 'bg-white shadow-xl shadow-gray-200/50'
            }
            ${isLoading 
              ? 'border-blue-200 bg-blue-50/50 cursor-wait' 
              : ''
            }
            ${!isLoading && isDragging 
              ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
              : darkMode 
                ? 'border-gray-700 hover:border-gray-600 hover:bg-[#222225]' 
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
          `}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-400/20 rounded-full blur-lg animate-pulse"></div>
                <Loader2 className="relative w-12 h-12 text-blue-600 animate-spin" strokeWidth={2} />
              </div>
              <span className={`font-medium text-lg tracking-wide px-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {statusMessage || "Processing..."}
              </span>
            </div>
          ) : (
            <>
              <div className={`
                p-5 rounded-2xl transition-colors duration-300
                ${isDragging 
                  ? 'bg-blue-100 text-blue-600' 
                  : darkMode 
                    ? 'bg-gray-800 text-gray-400 group-hover:bg-gray-700 group-hover:text-gray-300' 
                    : 'bg-gray-100 text-gray-500 group-hover:bg-white group-hover:shadow-md'
                }
              `}>
                <UploadCloud size={48} strokeWidth={1.5} />
              </div>

              <div className="space-y-1">
                <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Import New PDF
                </p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Select files to add to your library
                </p>
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
          <div className={`mt-8 flex items-center justify-center gap-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <FileText size={16} />
            <span>Lifewood Standard PDF Support</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upload;