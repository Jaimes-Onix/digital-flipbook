import React from 'react';
import { X, Youtube, Volume2, Info, Play } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ytUrl: string;
  setYtUrl: (url: string) => void;
  startTime: number;
  setStartTime: (time: number) => void;
  isSoundEnabled: boolean;
  setIsSoundEnabled: (enabled: boolean) => void;
  onTestSound: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  ytUrl,
  setYtUrl,
  startTime,
  setStartTime,
  isSoundEnabled,
  setIsSoundEnabled,
  onTestSound
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white/95 backdrop-blur-2xl w-full max-w-md rounded-[32px] shadow-2xl border border-white/40 overflow-hidden animate-in zoom-in duration-300"
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="text-blue-600" size={22} />
            Audio Settings
          </h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
            <div className="space-y-0.5">
              <label className="font-medium text-gray-900">Enable Flip Sound</label>
              <p className="text-xs text-gray-500">Play audio on every page turn</p>
            </div>
            <button
              onClick={() => setIsSoundEnabled(!isSoundEnabled)}
              className={`w-12 h-6 rounded-full transition-colors relative ${isSoundEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${isSoundEnabled ? 'translate-x-6' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 ml-1">
              <Youtube size={16} className="text-red-500" />
              YouTube Audio Link
            </label>
            <input
              type="text"
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            />
            <p className="text-[10px] text-gray-400 flex items-center gap-1 px-1">
              <Info size={10} />
              Using reference video for clean foley sound.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <label className="text-sm font-medium text-gray-700">Start Offset (seconds)</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onTestSound}
                  className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Play size={10} fill="currentColor" />
                  Test Sound
                </button>
                <span className="text-sm font-mono text-blue-600 font-bold w-12 text-right">{startTime.toFixed(1)}s</span>
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.1"
              value={startTime}
              onChange={(e) => setStartTime(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-3 bg-gray-900 text-white text-sm font-semibold rounded-2xl hover:bg-black transition-all active:scale-95 shadow-lg shadow-black/10"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;