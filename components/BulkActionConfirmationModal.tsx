import React, { useState } from 'react';
import { X, Check, Loader2, Download, Trash2, AlertCircle } from 'lucide-react';

interface BulkActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  action: 'download' | 'delete';
  selectedCount: number;
  darkMode?: boolean;
}

const BulkActionConfirmationModal: React.FC<BulkActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  selectedCount,
  darkMode = true
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDelete = action === 'delete';
  const Icon = isDelete ? Trash2 : Download;
  const title = isDelete ? 'Confirm Delete' : 'Confirm Download';
  const confirmText = isDelete ? 'Confirm Delete' : 'Confirm Download';
  const description = isDelete 
    ? `You are about to remove ${selectedCount} selected flipbooks. This will move them to your delete history where they can be restored later.` 
    : `You are about to download ${selectedCount} selected flipbooks. Your browser may ask for permission to download multiple files.`;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`relative w-full max-w-md rounded-[32px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-500 ${darkMode ? 'bg-[#141418] border-white/[0.06]' : 'bg-white border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className={`absolute top-6 right-6 p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-zinc-500' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <X size={20} />
        </button>

        {showSuccess ? (
          <div className="p-8 sm:p-12 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${darkMode ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20' : 'bg-emerald-50 text-emerald-500 border border-emerald-200'}`}>
              <Check size={40} className="animate-in zoom-in duration-300" />
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isDelete ? 'Deleted' : 'Downloading'}</h3>
            <p className={`${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              {selectedCount} book{selectedCount !== 1 ? 's' : ''} {isDelete ? 'moved to history' : 'sent to browser'}
            </p>
          </div>
        ) : (
          <div className="p-6 sm:p-10">
            <div className="flex flex-col items-center text-center mb-8">
              <div className={`p-4 rounded-[24px] mb-6 animate-in zoom-in duration-500 ${
                isDelete 
                  ? (darkMode ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-500 border border-red-100')
                  : (darkMode ? 'bg-lime-500/10 text-lime-400 border border-lime-500/20' : 'bg-emerald-50 text-emerald-600 border border-emerald-100')
              }`}>
                <Icon size={32} />
              </div>
              
              <h3 className={`text-xl sm:text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{title}</h3>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                {description}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                disabled={isSubmitting}
                onClick={handleConfirm}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-2 ${
                  isDelete
                    ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
                    : (darkMode ? 'bg-white hover:bg-zinc-100 text-zinc-900 shadow-white/5' : 'bg-gray-900 hover:bg-gray-800 text-white shadow-gray-400/20')
                }`}
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                {confirmText}
              </button>
              
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className={`w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] ${
                  darkMode ? 'bg-white/[0.05] hover:bg-white/[0.08] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                Cancel
              </button>
            </div>
            
            {isDelete && (
              <div className={`mt-6 p-4 rounded-2xl flex items-start gap-3 text-xs leading-tight border ${
                darkMode ? 'bg-orange-500/5 text-orange-400/80 border-orange-500/10' : 'bg-orange-50 text-orange-600 border-orange-100'
              }`}>
                <AlertCircle size={16} className="shrink-0" />
                <span>You can always restore these books from the "Delete History" panel in your library.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkActionConfirmationModal;
