import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, ChevronLeft, Presentation, AlertCircle, X, Download, PlusSquare } from 'lucide-react';

interface PptxConverterProps {
  onBack?: () => void;
  darkMode?: boolean;
  onConvertSuccess?: (pdfFile: File, orientation: 'portrait' | 'landscape') => void;
}

interface ConverterActionModalProps {
  file: File | null;
  darkMode: boolean;
  onConfirm: (action: 'import' | 'download', orientation: 'portrait' | 'landscape') => void;
  onCancel: () => void;
}

const ConverterActionModal: React.FC<ConverterActionModalProps> = ({ file, darkMode, onConfirm, onCancel }) => {
  const [actionOption, setActionOption] = useState<'import' | 'download'>('import');
  const [orientationOption, setOrientationOption] = useState<'landscape' | 'portrait'>('landscape');

  if (!file) return null;

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
            Conversion Complete
          </h2>
          <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            "{file.name}" is ready. What would you like to do?
          </p>
        </div>

        {/* Action Options */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setActionOption('import')}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${actionOption === 'import'
              ? darkMode ? 'border-orange-500 bg-orange-500/[0.08]' : 'border-orange-500 bg-orange-50'
              : darkMode ? 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
          >
            <div className={`p-2 rounded-xl ${actionOption === 'import' ? 'bg-orange-500 text-white' : darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-500'}`}>
              <PlusSquare size={20} />
            </div>
            <span className={`font-semibold text-sm ${actionOption === 'import' ? 'text-orange-500' : darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Import to Library</span>
          </button>

          <button
            onClick={() => setActionOption('download')}
            className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 ${actionOption === 'download'
              ? darkMode ? 'border-orange-500 bg-orange-500/[0.08]' : 'border-orange-500 bg-orange-50'
              : darkMode ? 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
              }`}
          >
            <div className={`p-2 rounded-xl ${actionOption === 'download' ? 'bg-orange-500 text-white' : darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-500'}`}>
              <Download size={20} />
            </div>
            <span className={`font-semibold text-sm ${actionOption === 'download' ? 'text-orange-500' : darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Download PDF</span>
          </button>
        </div>

        {/* Orientation Options (Only if Import) */}
        {actionOption === 'import' && (
          <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
            <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Flipbook Orientation</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setOrientationOption('landscape')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${orientationOption === 'landscape'
                  ? darkMode ? 'border-orange-500 bg-orange-500/[0.08]' : 'border-orange-500 bg-orange-50'
                  : darkMode ? 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
              >
                <div className={`w-6 h-4 rounded-sm border-2 ${orientationOption === 'landscape' ? 'border-orange-500' : darkMode ? 'border-zinc-500' : 'border-gray-400'}`} />
                <span className={`font-medium text-sm ${orientationOption === 'landscape' ? 'text-orange-500' : darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Landscape</span>
              </button>

              <button
                onClick={() => setOrientationOption('portrait')}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${orientationOption === 'portrait'
                  ? darkMode ? 'border-orange-500 bg-orange-500/[0.08]' : 'border-orange-500 bg-orange-50'
                  : darkMode ? 'border-white/[0.08] hover:border-white/[0.15] bg-white/[0.02]' : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                  }`}
              >
                <div className={`w-4 h-6 rounded-sm border-2 ${orientationOption === 'portrait' ? 'border-orange-500' : darkMode ? 'border-zinc-500' : 'border-gray-400'}`} />
                <span className={`font-medium text-sm ${orientationOption === 'portrait' ? 'text-orange-500' : darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>Portrait</span>
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className={`flex gap-3 ${actionOption === 'download' ? 'mt-8' : ''}`}>
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
            onClick={() => onConfirm(actionOption, orientationOption)}
            className="flex-1 py-3 rounded-xl font-semibold text-sm text-white bg-orange-500 hover:bg-orange-400 transition-colors"
          >
            Confirm
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

const PptxConverter: React.FC<PptxConverterProps> = ({ onBack, darkMode = false, onConvertSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const [pendingConvertedFile, setPendingConvertedFile] = useState<File | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!isLoading && !errorDetails) setIsDragging(true);
  }, [isLoading, errorDetails]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const convertFile = async (file: File) => {
    setIsLoading(true);
    setErrorDetails(null);
    setStatusMessage('Uploading presentation...');

    try {
      // 1. ConvertAPI requires the file to be base64 encoded for direct upload, or sent via multipart/form-data
      // We will use standard multipart/form-data which works well with their REST API

      const formData = new FormData();
      formData.append('File', file);
      formData.append('StoreFile', 'true'); // Required to get a download URL back

      setStatusMessage('Converting slides to PDF format... (this may take a minute)');

      // Using the user-provided Production API Secret
      const API_SECRET = 'QSvGEVb5pXsZ3RKgCFi1tIpzNl2TMBBT';

      const response = await fetch(`https://v2.convertapi.com/convert/pptx/to/pdf?Secret=${API_SECRET}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.Message || 'Conversion failed. Please try again.');
      }

      const data = await response.json();

      if (data.Files && data.Files.length > 0) {
        setStatusMessage('Downloading converted PDF...');

        // Let's fetch the actual file from the URL provided by ConvertAPI
        const fileUrl = data.Files[0].Url;
        const pdfResponse = await fetch(fileUrl);
        const pdfBlob = await pdfResponse.blob();

        // Create a new File object from the Blob
        const newFileName = file.name.replace(/\.(pptx|ppt)$/i, '.pdf');
        const pdfFile = new File([pdfBlob], newFileName, { type: 'application/pdf' });

        setPendingConvertedFile(pdfFile);
        setStatusMessage('Conversion Successful!');
      } else {
        throw new Error('No PDF file was returned from the conversion service.');
      }

    } catch (err: any) {
      console.error("Conversion Error:", err);
      setErrorDetails(err.message || 'An unexpected error occurred during conversion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading || errorDetails || pendingConvertedFile) return;

    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.name.endsWith('.pptx') || f.name.endsWith('.ppt') ||
      f.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      f.type === 'application/vnd.ms-powerpoint'
    );

    if (files.length > 0) {
      convertFile(files[0]);
    } else {
      alert('Please upload a valid PowerPoint (.pptx or .ppt) file.');
    }
  }, [isLoading, errorDetails, pendingConvertedFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (pendingConvertedFile) return;

    const files = e.target.files ? Array.from(e.target.files).filter(f =>
      f.name.endsWith('.pptx') || f.name.endsWith('.ppt') ||
      f.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      f.type === 'application/vnd.ms-powerpoint'
    ) : [];

    if (files.length > 0) {
      convertFile(files[0]);
    } else if (e.target.files && e.target.files.length > 0) {
      alert('Please select a valid PowerPoint (.pptx or .ppt) file.');
    }
    e.target.value = '';
  }, [pendingConvertedFile]);

  const handleConfirmAction = async (action: 'import' | 'download', orientation: 'portrait' | 'landscape') => {
    if (!pendingConvertedFile) return;

    if (action === 'download') {
      // Trigger browser download
      const url = window.URL.createObjectURL(pendingConvertedFile);
      const a = document.createElement('a');
      a.href = url;
      a.download = pendingConvertedFile.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      // Reset state so they can do another conversion
      setPendingConvertedFile(null);
      setStatusMessage('');

    } else {
      // Pass it back up to be handled by the main App
      if (onConvertSuccess) {
        onConvertSuccess(pendingConvertedFile, orientation);
      }
      setPendingConvertedFile(null);
      setStatusMessage('');
    }
  };

  const handleCancelAction = () => {
    setPendingConvertedFile(null);
    setStatusMessage('');
  };

  return (
    <>
      <ConverterActionModal
        file={pendingConvertedFile}
        darkMode={darkMode}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

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
          <h1 className={`text-3xl font-bold mb-2 tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            PPTX to PDF
          </h1>
          <p className={`mb-10 text-base ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
            Convert your PowerPoint presentations to PDF format before importing.
          </p>

          {errorDetails ? (
            <div className={`p-6 rounded-2xl border text-left flex flex-col items-center justify-center gap-4 ${darkMode ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50'
              }`}>
              <AlertCircle size={40} className={`mb-2 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
              <h3 className={`font-semibold text-lg ${darkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                API Integration Required
              </h3>
              <p className={`text-sm text-center leading-relaxed ${darkMode ? 'text-amber-200/70' : 'text-amber-700/80'}`}>
                {errorDetails}
              </p>
              <button
                onClick={() => setErrorDetails(null)}
                className={`mt-4 px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors ${darkMode
                  ? 'bg-amber-500 text-amber-950 hover:bg-amber-400'
                  : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
              >
                Try Another File
              </button>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`
              relative group w-full aspect-[4/3] rounded-2xl
              border border-dashed transition-all duration-300 ease-out
              flex flex-col items-center justify-center gap-6
              ${darkMode ? 'bg-white/[0.02]' : 'bg-gray-50'}
              ${isLoading ? 'border-orange-500/30 bg-orange-500/[0.03] cursor-wait' : ''}
              ${!isLoading && isDragging
                  ? 'border-orange-500 bg-orange-500/[0.05] scale-[1.02]'
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
                    <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-lg animate-pulse" />
                    <Loader2 className="relative w-12 h-12 text-orange-500 animate-spin" strokeWidth={2} />
                  </div>
                  <span className={`font-medium text-base tracking-wide px-8 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                    {statusMessage}
                  </span>
                </div>
              ) : (
                <>
                  <div className={`p-5 rounded-2xl transition-colors duration-300 ${isDragging
                    ? 'bg-orange-500/10 text-orange-500'
                    : darkMode
                      ? 'bg-white/[0.04] text-zinc-600 group-hover:bg-white/[0.06] group-hover:text-amber-500'
                      : 'bg-gray-100 text-gray-400 group-hover:bg-gray-200 group-hover:text-orange-500'
                    }`}>
                    <Presentation size={48} strokeWidth={1.5} />
                  </div>

                  <div className="space-y-1">
                    <p className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Drag & Drop PowerPoint</p>
                    <p className={`text-sm ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>or click to browse files</p>
                  </div>

                  <input
                    type="file"
                    accept=".pptx,.ppt,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-powerpoint"
                    onChange={handleFileInput}
                    disabled={isLoading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                </>
              )}
            </div>
          )}

          {!isLoading && !errorDetails && (
            <div className={`mt-8 flex items-center justify-center gap-2 text-sm ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
              <FileText size={16} />
              <span>Supports .pptx and .ppt formats</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default PptxConverter;
