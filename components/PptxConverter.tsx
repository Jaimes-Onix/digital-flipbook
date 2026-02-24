import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, ChevronLeft, Presentation, AlertCircle } from 'lucide-react';

interface PptxConverterProps {
  onBack?: () => void;
  darkMode?: boolean;
  onConvertSuccess?: (pdfFile: File, orientation: 'portrait' | 'landscape') => void;
}

const PptxConverter: React.FC<PptxConverterProps> = ({ onBack, darkMode = false, onConvertSuccess }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const [actionOption, setActionOption] = useState<'import' | 'download'>('import');
  const [orientationOption, setOrientationOption] = useState<'portrait' | 'landscape'>('landscape');

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

        if (actionOption === 'download') {
          // Trigger browser download
          const url = window.URL.createObjectURL(pdfBlob);
          const a = document.createElement('a');
          a.href = url;
          a.download = newFileName;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          setStatusMessage('Downloaded successfully!');

          // Show message briefly before resetting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          // Pass it back up to be handled by the main App
          if (onConvertSuccess) {
            onConvertSuccess(pdfFile, orientationOption);
          }
        }
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
    if (isLoading || errorDetails) return;

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
  }, [isLoading, errorDetails]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
  }, []);

  return (
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
          <div className={`mt-8 flex flex-col items-center gap-6 text-sm ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
            <div className={`w-full max-w-[85%] flex flex-col gap-5 text-left border-t pt-6 ${darkMode ? 'border-white/10' : 'border-gray-200'}`}>
              <div className="flex flex-col gap-3">
                <span className={`text-sm font-semibold tracking-wide ${darkMode ? 'text-white' : 'text-gray-900'}`}>After Conversion:</span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="action"
                      value="import"
                      checked={actionOption === 'import'}
                      onChange={() => setActionOption('import')}
                      className="accent-orange-500 w-4 h-4 transition-all"
                    />
                    <span className={`text-[15px] font-medium transition-colors ${darkMode ? 'text-zinc-300 group-hover:text-white' : 'text-gray-700 group-hover:text-black'}`}>Import directly</span>
                  </label>
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="radio"
                      name="action"
                      value="download"
                      checked={actionOption === 'download'}
                      onChange={() => setActionOption('download')}
                      className="accent-orange-500 w-4 h-4 transition-all"
                    />
                    <span className={`text-[15px] font-medium transition-colors ${darkMode ? 'text-zinc-300 group-hover:text-white' : 'text-gray-700 group-hover:text-black'}`}>Download only</span>
                  </label>
                </div>
              </div>

              {actionOption === 'import' && (
                <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                  <span className={`text-sm font-semibold tracking-wide flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Flipbook Orientation:
                  </span>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="orientation"
                        value="landscape"
                        checked={orientationOption === 'landscape'}
                        onChange={() => setOrientationOption('landscape')}
                        className="accent-orange-500 w-4 h-4 transition-all"
                      />
                      <span className={`text-[15px] font-medium transition-colors ${darkMode ? 'text-zinc-300 group-hover:text-white' : 'text-gray-700 group-hover:text-black'}`}>Landscape</span>
                    </label>
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="radio"
                        name="orientation"
                        value="portrait"
                        checked={orientationOption === 'portrait'}
                        onChange={() => setOrientationOption('portrait')}
                        className="accent-orange-500 w-4 h-4 transition-all"
                      />
                      <span className={`text-[15px] font-medium transition-colors ${darkMode ? 'text-zinc-300 group-hover:text-white' : 'text-gray-700 group-hover:text-black'}`}>Portrait</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 w-full pt-2">
              <FileText size={16} />
              <span>Supports .pptx and .ppt formats</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PptxConverter;
