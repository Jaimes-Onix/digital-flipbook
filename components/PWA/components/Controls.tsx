import React from 'react';
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';

interface ControlsProps {
  currentPage: number;
  totalPages: number;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onPrev: () => void;
  onNext: () => void;
  onFullscreen?: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  currentPage,
  totalPages,
  zoomLevel,
  onZoomChange,
  onPrev,
  onNext,
  onFullscreen
}) => {
  const MAX_ZOOM = 10;
  const MIN_ZOOM = 1;

  return (
    <div className="fade-in">
      {/* Truly Floating Controls - No Background */}
      <div className="flex items-center gap-3">
          {/* Navigation - Floating Buttons */}
          <button
            onClick={onPrev}
            disabled={currentPage === 0}
            className="p-2 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white hover:shadow-xl text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 border border-gray-200"
            title="Previous"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          
          <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-200">
            <span className="text-sm font-medium text-gray-900">
              {currentPage + 1} / {totalPages}
            </span>
          </div>

          <button
            onClick={onNext}
            disabled={currentPage >= totalPages - 1}
            className="p-2 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white hover:shadow-xl text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 border border-gray-200"
            title="Next"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>

          <div className="w-px h-6 bg-gray-300/50" />

          {/* Zoom Slider - Floating Glass */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-lg border border-gray-200">
            <ZoomOut size={16} className="text-gray-500" strokeWidth={2} />
            
            <div className="relative w-24 h-6 flex items-center group">
              {/* Track */}
              <div className="absolute inset-x-0 h-0.5 bg-gray-300 rounded-full" />
              
              {/* Active Track */}
              <div 
                className="absolute h-0.5 bg-gray-900 rounded-full transition-all"
                style={{ width: `${((zoomLevel - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100}%` }}
              />
              
              {/* Slider Input */}
              <input 
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step="0.1"
                value={zoomLevel}
                onChange={(e) => onZoomChange(parseFloat(e.target.value))}
                className="relative w-full h-6 appearance-none cursor-grab active:cursor-grabbing bg-transparent z-10
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3.5
                  [&::-webkit-slider-thumb]:h-3.5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:border-2
                  [&::-webkit-slider-thumb]:border-gray-400
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-webkit-slider-thumb]:active:scale-100
                  [&::-webkit-slider-thumb]:active:border-gray-600
                  [&::-moz-range-thumb]:w-3.5
                  [&::-moz-range-thumb]:h-3.5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-white
                  [&::-moz-range-thumb]:border-2
                  [&::-moz-range-thumb]:border-gray-400
                  [&::-moz-range-thumb]:shadow-lg
                  [&::-moz-range-thumb]:cursor-grab
                  [&::-moz-range-thumb]:active:cursor-grabbing"
                title="Drag to zoom"
              />
            </div>
            
            <ZoomIn size={16} className="text-gray-500" strokeWidth={2} />
            
            <span className="text-xs font-medium text-gray-600 min-w-[38px] text-right">
              {Math.round(zoomLevel * 100)}%
            </span>
          </div>

          <div className="w-px h-6 bg-gray-300/50" />

          {/* Fullscreen */}
          <button
            onClick={onFullscreen}
            className="p-2 rounded-full bg-white/90 backdrop-blur-md shadow-lg hover:bg-white hover:shadow-xl text-gray-900 transition-all active:scale-95 border border-gray-200"
            title="Fullscreen"
          >
            <Maximize2 size={18} strokeWidth={2} />
          </button>
        </div>
    </div>
  );
};

export default Controls;