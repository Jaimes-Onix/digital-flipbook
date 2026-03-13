import React, { useState, useCallback } from 'react';
import { UploadCloud, FileText, Loader2, ChevronLeft, X, RectangleVertical, RectangleHorizontal, Columns3, Info, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const ORIENTATION_DETAILS = {
  portrait: {
    title: 'Portrait Format',
    description: 'The standard vertical orientation for documents. Ideal for books, reports, and traditional reading experiences.',
    features: ['Standard 1:1.4 aspect ratio', 'Best for single-column text', 'Classic vertical flipping'],
    color: '#84cc16' // lime-500
  },
  landscape: {
    title: 'Landscape Format',
    description: 'Horizontal wide-screen format. Perfect for presentations, image-heavy albums, and dual-page spreads.',
    features: ['Wide viewing area', 'Optimized for modern monitors', 'Side-by-side page display'],
    color: '#06b6d4' // cyan-500
  },
  trifold: {
    title: 'Trifold Brochure',
    description: 'A specialized 3-panel folding design. Perfect for marketing brochures and innovative digital artifacts.',
    features: ['Realistic 3-way fold', 'Continuous 3-panel spread', 'Immersive brochure behavior'],
    color: '#10b981' // emerald-500
  }
};

const OrientationModal: React.FC<OrientationModalProps> = ({ files, darkMode, onConfirm, onCancel }) => {
  const [selected, setSelected] = useState<Orientation>('portrait');
  const [rotationOffset, setRotationOffset] = useState(0);
  const [pulseTrigger, setPulseTrigger] = useState(0);

  // Portrait starts at top (−90°), Landscape at bottom-right (30°), Trifold at bottom-left (150°)
  const ORBIT_ITEMS: { type: Orientation; icon: React.ElementType; label: string; baseAngle: number }[] = [
    { type: 'portrait',  icon: RectangleVertical,   label: 'Portrait',  baseAngle: -90 },
    { type: 'landscape', icon: RectangleHorizontal, label: 'Landscape', baseAngle:  30 },
    { type: 'trifold',   icon: Columns3,           label: 'Trifold',   baseAngle: 150 },
  ];

  const RADIUS = 155;

  const handleSelect = (type: Orientation, baseAngle: number) => {
    setSelected(type);
    setPulseTrigger(prev => prev + 1);
    setRotationOffset(prev => {
      // Calculate delta to bring this item to −90° (top)
      let delta = (-90 - baseAngle) - prev;
      // Normalize to shortest path
      delta = ((delta % 360) + 360) % 360;
      if (delta > 180) delta -= 360;
      return prev + delta;
    });
  };

  const getItemPos = (baseAngle: number) => {
    const a = ((baseAngle + rotationOffset) * Math.PI) / 180;
    return { x: Math.cos(a) * RADIUS, y: Math.sin(a) * RADIUS };
  };

  const details = ORIENTATION_DETAILS[selected];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.75)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className={`relative w-full max-w-5xl rounded-[32px] overflow-hidden shadow-2xl flex flex-col lg:flex-row h-auto lg:h-[620px] ${
          darkMode ? 'bg-[#0c0c10]/95 border border-white/[0.08]' : 'bg-white/95 border border-gray-200'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onCancel}
          className={`absolute top-6 right-6 z-20 p-2.5 rounded-full transition-all duration-200 ${
            darkMode ? 'text-zinc-500 hover:text-white hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <X size={20} />
        </button>

        {/* ── Left Side: Radial Orbital Selector ── */}
        <div className="flex-1 relative flex flex-col items-center justify-center p-8 lg:p-12 min-h-[400px] lg:min-h-0 overflow-hidden">
          {/* Title */}
          <div className="absolute top-8 left-8 text-left z-10">
            <h2 className={`text-2xl lg:text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Book Orientation
            </h2>
            <p className={`text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              Select the structure for your digital asset
            </p>
          </div>

          {/* Orbital Stage */}
          <div className="relative flex items-center justify-center" style={{ width: 420, height: 420 }}>

            {/* Click-Activated Pulsing Rings — vibrant lime green */}
            {[0, 1, 2].map(i => (
              <div
                key={`${pulseTrigger}-${i}`}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width:  150 + i * 75,
                  height: 150 + i * 75,
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  border: '3.5px solid rgba(132, 204, 22, 0.9)',
                  boxShadow: '0 0 35px rgba(132, 204, 22, 0.5), inset 0 0 15px rgba(132, 204, 22, 0.3)',
                  animation: `orb-pulse 3.0s ease-in ${i * 0.4}s 1 forwards`,
                }}
              />
            ))}

            {/* Static faint orbit path */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 330, height: 330,
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            />

            {/* Central Book Icon */}
            <div
              className="absolute z-10 w-[96px] h-[96px] rounded-full flex items-center justify-center"
              style={{
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle at 40% 35%, rgba(132,204,22,0.25) 0%, rgba(8,8,12,0.96) 70%)',
                border: '2px solid rgba(132,204,22,0.32)',
                boxShadow: '0 0 50px rgba(132,204,22,0.18), 0 0 100px rgba(132,204,22,0.06), inset 0 0 24px rgba(0,0,0,0.7)',
              }}
            >
              <BookOpen size={42} className="text-lime-400" strokeWidth={1.6} />
            </div>

            {/* Orbit Buttons */}
            {ORBIT_ITEMS.map(item => {
              const { x, y } = getItemPos(item.baseAngle);
              const isActive = selected === item.type;
              const Ic = item.icon as React.FC<{ size?: number; className?: string; strokeWidth?: number }>;

              return (
                <motion.button
                  key={item.type}
                  onClick={() => handleSelect(item.type, item.baseAngle)}
                  className="absolute z-20 flex flex-col items-center"
                  style={{ left: '50%', top: '50%', marginLeft: -40, marginTop: -40 }}
                  animate={{ x, y }}
                  transition={{ type: 'spring', stiffness: 190, damping: 24 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.90 }}
                >
                  {/* Icon box */}
                  <div
                    className={`w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-lime-500 text-white ring-4 ring-lime-500/30'
                        : darkMode
                          ? 'bg-zinc-800/90 text-zinc-400 border border-white/[0.10] hover:border-lime-500/40 hover:text-lime-400'
                          : 'bg-white text-gray-500 border border-gray-200 shadow hover:border-lime-400 hover:text-lime-600'
                    }`}
                    style={isActive ? { boxShadow: '0 0 36px rgba(132,204,22,0.6), 0 0 12px rgba(132,204,22,0.35)' } : {}}
                  >
                    <Ic size={32} />
                  </div>
                  {/* Label */}
                  <span
                    className={`mt-2.5 text-[11px] font-bold tracking-widest uppercase whitespace-nowrap ${
                      isActive ? 'text-lime-400' : 'text-zinc-400'
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Right Side: Info Panel ── */}
        <div className={`w-full lg:w-[380px] flex flex-col transition-colors duration-300 lg:border-l ${
          darkMode ? 'bg-zinc-900/60 border-white/[0.1]' : 'bg-gray-50 border-gray-200'
        }`}>
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar">
            <div className="space-y-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={selected}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* New Format Illustration */}
                <div className={`relative h-48 rounded-2xl flex items-center justify-center overflow-hidden mb-4 ${
                  darkMode ? 'bg-white/[0.03] border border-white/[0.08]' : 'bg-gray-100 border border-gray-200'
                }`}>
                  <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA0Ii8+PHBhdGggZD0iTTAgMGg0djRIMG00IDRoNHY0SDRaIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9Ii4wNCIvPjwvc3ZnPg==')]" />
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={selected}
                    className="relative z-10"
                  >
                    {selected === 'portrait' && (
                      <div className="w-24 h-32 rounded-lg border-2 border-lime-500/50 bg-lime-500/10 flex flex-col p-2 gap-1.5 shadow-2xl shadow-lime-500/10">
                        <div className="h-1.5 w-full bg-lime-500/30 rounded-full" />
                        <div className="h-1.5 w-5/6 bg-lime-500/30 rounded-full" />
                        <div className="flex-1" />
                        <div className="h-1 w-1/3 bg-lime-500/20 rounded-full self-center" />
                      </div>
                    )}
                    {selected === 'landscape' && (
                      <div className="w-40 h-28 rounded-lg border-2 border-cyan-500/50 bg-cyan-500/10 flex p-2 shadow-2xl shadow-cyan-500/10 relative">
                        <div className="flex-1 bg-cyan-500/20 rounded-l h-full" />
                        <div className="w-[2px] h-full bg-cyan-500/40 mx-0.5" /> {/* The Divider */}
                        <div className="flex-1 bg-cyan-500/20 rounded-r h-full" />
                      </div>
                    )}
                    {selected === 'trifold' && (
                      <div className="w-44 h-32 flex shadow-2xl shadow-emerald-500/10">
                        <div className="w-14 h-full rounded-l-lg border-2 border-emerald-500/50 bg-emerald-500/10 transform -skew-y-3" />
                        <div className="w-[2px] h-full bg-emerald-500/40 z-20" /> {/* Divider 1 */}
                        <div className="w-14 h-full border-2 border-emerald-500/50 bg-emerald-500/20 z-10" />
                        <div className="w-[2px] h-full bg-emerald-500/40 z-20" /> {/* Divider 2 */}
                        <div className="w-14 h-full rounded-r-lg border-2 border-emerald-500/50 bg-emerald-500/10 transform skew-y-3" />
                      </div>
                    )}
                  </motion.div>
                </div>

                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${darkMode ? 'bg-lime-500/10 text-lime-400' : 'bg-lime-50 text-lime-600'}`}>
                    <Info size={24} />
                  </div>
                  <h3 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {details.title}
                  </h3>
                </div>

                <p className={`text-lg leading-relaxed font-medium ${darkMode ? 'text-zinc-400' : 'text-gray-600'}`}>
                  {details.description}
                </p>

                <div className="space-y-4 pt-2">
                  <p className={`text-xs font-bold uppercase tracking-[0.2em] ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                    Key Features
                  </p>
                  <ul className="grid grid-cols-1 gap-3">
                    {details.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3.5 text-sm font-semibold">
                        <div className="w-2 h-2 rounded-full bg-lime-500 shadow-lg shadow-lime-500/40" />
                        <span className={darkMode ? 'text-zinc-200' : 'text-gray-800'}>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
            </div>
          </div>

          <div className={`p-8 pt-4 lg:p-10 lg:pt-4 border-t ${darkMode ? 'border-white/[0.05]' : 'border-gray-200'} bg-opacity-50`}>
            <div className="space-y-4">
            <p className={`text-xs text-center mb-2 px-6 ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
              Applying format to{' '}
              <span className="font-semibold text-lime-500">{files.length}</span>{' '}
              {files.length === 1 ? 'document' : 'documents'}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => onConfirm(selected)}
                className="w-full py-4 rounded-2xl font-bold text-sm text-white bg-lime-500 hover:bg-lime-400 shadow-lg shadow-lime-500/20 active:scale-[0.98] transition-all"
              >
                Import Book
              </button>
              <button
                onClick={onCancel}
                className={`w-full py-4 rounded-2xl font-medium text-sm transition-all ${
                  darkMode
                    ? 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Cancel
              </button>
            </div>
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes orb-pulse {
          0%   { opacity: 1.0; transform: translate(-50%, -50%) scale(1);    }
          100% { opacity: 0;   transform: translate(-50%, -50%) scale(1.75); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(132, 204, 22, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(132, 204, 22, 0.4);
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
          <h1 className={`text-3xl font-bold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${darkMode ? 'from-lime-300 via-lime-400 to-teal-400' : 'from-lime-500 via-lime-600 to-teal-600'}`}>Import PDF</h1>
          <p className={`mb-10 text-base ${darkMode ? 'text-white' : 'text-gray-500'}`}>Create premium digital flipbooks from your documents.</p>

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
