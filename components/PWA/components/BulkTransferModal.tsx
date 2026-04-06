import React, { useState } from 'react';
import { X, Check, Loader2, FolderSync } from 'lucide-react';
import { BookCategory, CustomCategory } from '../types';

const CATEGORY_OPTIONS: { value: BookCategory; label: string }[] = [
  { value: 'philippines', label: 'Philippines' },
  { value: 'internal', label: 'Internal' },
  { value: 'international', label: 'International' },
  { value: 'ph_interns', label: 'PH Interns' },
  { value: 'deseret', label: 'Deseret' },
  { value: 'angelhost', label: 'Angelhost' },
];

interface BulkTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: (categorySlug: string) => Promise<void>;
  darkMode?: boolean;
  customCategories?: CustomCategory[];
  currentCategory?: string;
}

const BulkTransferModal: React.FC<BulkTransferModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  darkMode = true,
  customCategories = [],
  currentCategory
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{ slug: string, name: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedTarget) return;
    setIsSubmitting(true);
    try {
      await onConfirm(selectedTarget.slug);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        setSelectedTarget(null);
      }, 2000);
    } catch (error) {
      console.error('Bulk transfer failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className={`relative w-full max-w-xl rounded-[32px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-500 ${darkMode ? 'bg-[#141418] border-white/[0.06]' : 'bg-white border-gray-200'}`}
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
              <Check size={40} />
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Transfer Successful</h3>
            <p className={`${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
              {selectedCount} book{selectedCount !== 1 ? 's' : ''} moved to <span className="font-bold text-orange-400">{selectedTarget?.name}</span>
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-3 rounded-2xl ${darkMode ? 'bg-orange-500/10 text-orange-400' : 'bg-orange-50 text-orange-600'}`}>
                <FolderSync size={24} />
              </div>
              <div>
                <h3 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Bulk Transfer</h3>
                <p className={`text-[11px] sm:text-sm ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>Moving {selectedCount} selected flipbook{selectedCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            <div className="mb-8">
              <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Select Destination Category</p>
              <div className="flex flex-wrap gap-2">
                {[...CATEGORY_OPTIONS, ...customCategories.filter(c => !CATEGORY_OPTIONS.some(o => o.value === c.slug)).map(c => ({ value: c.slug, label: c.name }))].map((cat) => {
                  const isCurrent = currentCategory === cat.value;
                  const isSelected = selectedTarget?.slug === cat.value;
                  
                  return (
                    <button
                      key={cat.value}
                      disabled={isCurrent}
                      onClick={() => setSelectedTarget({ slug: cat.value as string, name: cat.label })}
                      className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all border ${
                        isSelected 
                          ? darkMode ? 'bg-lime-500/20 text-lime-400 border-lime-500/50 shadow-lg shadow-lime-500/10' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : isCurrent
                            ? darkMode ? 'bg-white/[0.02] text-zinc-700 border-white/[0.05] cursor-not-allowed' : 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                            : darkMode ? 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white border-transparent' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-transparent'
                      }`}
                    >
                      {cat.label}
                      {isCurrent && <span className="ml-1.5 opacity-50 text-[10px]">(current)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-2">
              <button
                disabled={!selectedTarget || isSubmitting}
                onClick={handleConfirm}
                className={`flex-1 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-[0.98] shadow-lg flex items-center justify-center gap-1.5 sm:gap-2 ${
                  !selectedTarget || isSubmitting
                    ? darkMode ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : darkMode ? 'bg-white hover:bg-zinc-100 text-zinc-900' : 'bg-gray-900 hover:bg-gray-800 text-white'
                }`}
              >
                {isSubmitting ? <Loader2 size={16} className="animate-spin sm:w-[18px] sm:h-[18px]" /> : <Check size={16} className="sm:w-[18px] sm:h-[18px]" />}
                Confirm Transfer
              </button>
              <button
                onClick={onClose}
                className={`flex-1 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all active:scale-[0.98] ${
                  darkMode ? 'bg-white/[0.05] hover:bg-white/[0.08] text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkTransferModal;
