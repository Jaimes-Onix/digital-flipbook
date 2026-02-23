import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { deleteCategory } from '../src/lib/bookStorage';
import type { CustomCategory } from '../types';

interface DeleteCategoryModalProps {
    isOpen: boolean;
    darkMode: boolean;
    category: CustomCategory | null;
    onClose: () => void;
    onCategoryDeleted: (categoryId: string, oldSlug: string) => void;
}

const DeleteCategoryModal: React.FC<DeleteCategoryModalProps> = ({ isOpen, darkMode, category, onClose, onCategoryDeleted }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !category) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);
        try {
            await deleteCategory(category.id, category.slug);
            onCategoryDeleted(category.id, category.slug);
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className={`relative w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden animate-in zoom-in-95 fade-in duration-200 ${darkMode ? 'bg-[#18181b] border-white/10' : 'bg-white border-gray-100'
                } border`}>
                <div className={`absolute top-0 left-0 w-full h-1 bg-red-500`} />

                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                        }`}
                >
                    <X size={20} />
                </button>

                <div className="flex flex-col items-center justify-center text-center mt-2">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                        <AlertTriangle size={32} className="text-red-500" />
                    </div>

                    <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        Delete Category?
                    </h2>
                    <p className={`text-sm mb-8 ${darkMode ? 'text-zinc-400' : 'text-gray-500'}`}>
                        Are you sure you want to delete <span className="font-semibold text-red-400">"{category.name}"</span>?
                        Any books currently in this category will remain in your library, but their category will be cleared. This action cannot be undone.
                    </p>

                    {error && (
                        <p className="text-red-400 text-sm font-medium mb-4">{error}</p>
                    )}

                    <div className="flex gap-3 w-full">
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 ${darkMode
                                    ? 'bg-white/5 hover:bg-white/10 text-white'
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className={`flex-1 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 ${isDeleting
                                    ? 'bg-red-500/50 cursor-not-allowed text-white/70'
                                    : 'bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white shadow-lg shadow-red-500/25'
                                }`}
                        >
                            {isDeleting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    Delete
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteCategoryModal;
