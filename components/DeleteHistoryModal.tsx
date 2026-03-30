import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Loader2, Clock, BookX, Undo2, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { loadDeletedBooks, clearDeletedBookLog, clearAllDeletedBookLogs, restoreBook, type DeletedBookLog } from '../src/lib/bookStorage';

interface DeleteHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    category?: string;
    categoryName?: string;
    darkMode: boolean;
    onRestore?: () => void;
}

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

function timeAgo(dateStr: string): string {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

const DeleteHistoryModal: React.FC<DeleteHistoryModalProps> = ({
    isOpen, onClose, category, categoryName, darkMode, onRestore
}) => {
    const [logs, setLogs] = useState<DeletedBookLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'single' | 'all';
        id?: string;
        title?: string;
    }>({ isOpen: false, type: 'single' });
    const [successModal, setSuccessModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
    }>({ isOpen: false, title: '', message: '' });

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        } else {
            setLogs([]);
        }
    }, [isOpen, category]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await loadDeletedBooks(category);
            setLogs(data);
        } catch (err) {
            console.error('Failed to load delete history:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveLog = async (logId: string) => {
        try {
            await clearDeletedBookLog(logId);
            setLogs(prev => prev.filter(l => l.id !== logId));
            setConfirmModal({ isOpen: false, type: 'single' });
            setSuccessModal({
                isOpen: true,
                title: 'Deleted Permanently',
                message: 'The book record and its files have been removed.'
            });
        } catch (err) {
            console.error('Failed to remove log entry:', err);
        }
    };

    const handleClearAll = async () => {
        try {
            await clearAllDeletedBookLogs(category);
            setLogs([]);
            setConfirmModal({ isOpen: false, type: 'single' });
            setSuccessModal({
                isOpen: true,
                title: 'History Cleared',
                message: 'All book records for this category have been removed.'
            });
        } catch (err) {
            console.error('Failed to clear all logs:', err);
        }
    };

    const handleRestore = async (bookId: string) => {
        try {
            await restoreBook(bookId);
            setLogs(prev => prev.filter(l => l.id !== bookId));
            onRestore?.(); // Refresh the library
            setSuccessModal({
                isOpen: true,
                title: 'Restored Successfully',
                message: 'The book is now back in your library.'
            });
        } catch (err) {
            console.error('Failed to restore book:', err);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
                onClick={onClose}
            />

            <div className={`relative w-full max-w-2xl max-h-[85vh] rounded-[28px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-200 flex flex-col ${darkMode
                ? 'bg-[#1c1c20]/95 backdrop-blur-3xl border-white/[0.08] shadow-black/60'
                : 'bg-white border-gray-200 shadow-gray-300/50'
                }`}>

                {/* Header */}
                <div className={`flex items-center justify-between px-7 pt-6 pb-4 border-b flex-shrink-0 ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                    <div>
                        <h3 className={`text-xl font-semibold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Delete History
                        </h3>
                        <p className={`text-sm mt-1 mb-1 ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                            {categoryName || 'All categories'} · {logs.length} deleted book{logs.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {logs.length > 0 && (
                            <button
                                onClick={() => setConfirmModal({
                                    isOpen: true,
                                    type: 'all',
                                    title: categoryName || 'All categories'
                                })}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${darkMode
                                    ? 'text-red-400 hover:bg-red-500/10'
                                    : 'text-red-500 hover:bg-red-50'
                                    }`}
                            >
                                Clear All
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className={`p-1.5 rounded-full transition-colors ${darkMode ? 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar">
                    {loading ? (
                        <div className={`flex flex-col items-center justify-center py-16 ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>
                            <Loader2 size={24} className="animate-spin mb-3" />
                            <span className="text-sm">Loading history...</span>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-16 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                            <BookX size={40} strokeWidth={1.5} className="mb-4 opacity-50" />
                            <p className="text-sm font-medium">No deleted books</p>
                            <p className="text-xs mt-1 opacity-70">Books you delete will appear here</p>
                        </div>
                    ) : (
                        <div className="px-4 py-3 space-y-1.5">
                            {logs.map((log) => (
                                <div
                                    key={log.id}
                                    className={`flex items-center gap-5 px-6 py-4 rounded-2xl transition-colors ${darkMode
                                        ? 'hover:bg-white/[0.03]'
                                        : 'hover:bg-gray-50'
                                        }`}
                                >
                                    {/* Cover thumbnail */}
                                    <div className={`w-14 h-20 sm:w-16 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 ${darkMode ? 'bg-zinc-800' : 'bg-gray-200'}`}>
                                        {log.cover_url ? (
                                            <img
                                                src={log.cover_url}
                                                alt={log.book_title}
                                                className="w-full h-full object-cover opacity-60"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <BookX size={16} className={`${darkMode ? 'text-zinc-700' : 'text-gray-400'}`} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-base font-medium line-clamp-1 ${darkMode ? 'text-zinc-300' : 'text-gray-700'}`}>
                                            {log.book_title}
                                        </p>
                                        <div className={`flex items-center gap-2 mt-1.5 text-xs uppercase tracking-wider ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                                            {log.total_pages && <span>{log.total_pages} pages</span>}
                                            {log.category && (
                                                <>
                                                    <span>·</span>
                                                    <span>{log.category}</span>
                                                </>
                                            )}
                                        </div>
                                        <div className={`flex items-center gap-1.5 mt-1.5 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                                            <Clock size={12} />
                                            <span className="text-xs">Deleted {timeAgo(log.deleted_at)}</span>
                                            <span className="text-xs opacity-60">· {formatDate(log.deleted_at)}</span>
                                        </div>
                                    </div>

                                    {/* Actions: Undo + Permanently Delete */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleRestore(log.id)}
                                            className={`p-2.5 rounded-xl transition-colors ${darkMode
                                                ? 'text-lime-500/70 hover:text-lime-400 hover:bg-emerald-500/10'
                                                : 'text-lime-500 hover:text-emerald-600 hover:bg-emerald-50'
                                                }`}
                                            title="Undo — Restore this book"
                                        >
                                            <Undo2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => setConfirmModal({
                                                isOpen: true,
                                                type: 'single',
                                                id: log.id,
                                                title: log.book_title
                                            })}
                                            className={`p-2.5 rounded-xl transition-colors ${darkMode
                                                ? 'text-zinc-600 hover:text-red-400 hover:bg-red-500/10'
                                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                                }`}
                                            title="Permanently delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`flex items-center justify-end px-7 py-4 border-t flex-shrink-0 ${darkMode ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                    <button
                        onClick={onClose}
                        className={`px-6 py-2.5 rounded-xl text-base font-medium transition-colors ${darkMode
                            ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                    >
                        Close
                    </button>
                </div>
            </div>

            {/* Confirmation Modal overlay */}
            <ConfirmDeleteModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={() => {
                    if (confirmModal.type === 'single' && confirmModal.id) {
                        handleRemoveLog(confirmModal.id);
                    } else {
                        handleClearAll();
                    }
                }}
                title={confirmModal.type === 'single' ? 'Permanently Delete Book?' : 'Clear All History?'}
                description={confirmModal.type === 'single'
                    ? `You are about to permanently delete "${confirmModal.title}". This action cannot be undone.`
                    : `You are about to clear all deleted book records for "${confirmModal.title}". This action cannot be undone.`
                }
                darkMode={darkMode}
            />

            {/* Success Modal overlay */}
            <DeleteSuccessModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                title={successModal.title}
                message={successModal.message}
                darkMode={darkMode}
            />
        </div>,
        document.body
    );
};

const ConfirmDeleteModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    darkMode: boolean;
}> = ({ isOpen, onClose, onConfirm, title, description, darkMode }) => {
    const [timeLeft, setTimeLeft] = React.useState(5);
    const [isForceLoading, setIsForceLoading] = React.useState(true);

    React.useEffect(() => {
        if (isOpen) {
            setTimeLeft(5);
            setIsForceLoading(true);
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        setIsForceLoading(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const progress = ((5 - timeLeft) / 5) * 100;

    return createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />
            <div className={`relative w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 fade-in duration-200 ${darkMode ? 'bg-[#1c1c20] border border-white/10' : 'bg-white border border-gray-100'}`}>
                <div className="relative p-8">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${darkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-500'}`}>
                        <ShieldAlert size={32} />
                    </div>

                    <h4 className={`text-xl font-bold text-center mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {title}
                    </h4>
                    <p className={`text-center text-sm leading-relaxed mb-8 px-4 ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                        {description}
                    </p>

                    <div className="space-y-3">
                        <button
                            disabled={isForceLoading}
                            onClick={onConfirm}
                            className={`relative w-full py-4 rounded-2xl font-bold transition-all overflow-hidden group ${isForceLoading
                                ? (darkMode ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                                : 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/20 active:scale-95'
                                }`}
                        >
                            {/* Progress bar background */}
                            {isForceLoading && (
                                <div
                                    className="absolute inset-0 bg-red-500/10 transition-all duration-1000 ease-linear"
                                    style={{ width: `${progress}%` }}
                                />
                            )}

                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isForceLoading ? `Wait ${timeLeft}s...` : 'Permanently Delete'}
                                {!isForceLoading && <Trash2 size={18} />}
                            </span>
                        </button>

                        <button
                            onClick={onClose}
                            className={`w-full py-3.5 rounded-2xl font-semibold transition-colors ${darkMode
                                ? 'bg-white/5 hover:bg-white/10 text-white'
                                : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                                }`}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const DeleteSuccessModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    darkMode: boolean;
}> = ({ isOpen, onClose, title, message, darkMode }) => {
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(onClose, 3000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div
                className={`absolute inset-0 backdrop-blur-md transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'} ${darkMode ? 'bg-black/40' : 'bg-black/20'}`}
                onClick={onClose}
            />
            <div className={`relative w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl transition-all duration-500 ease-out transform ${isOpen ? 'scale-100 opacity-100' : 'scale-90 opacity-0'} ${darkMode ? 'bg-[#1c1c20]/95 border border-white/10' : 'bg-white/95 border border-gray-100'}`}>
                <div className="relative p-8">
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="absolute inset-0 bg-lime-500/20 rounded-full blur-2xl animate-pulse" />
                            <div className={`relative w-20 h-20 bg-gradient-to-br from-lime-500 to-lime-600 rounded-full flex items-center justify-center shadow-lg shadow-lime-500/20 transition-transform duration-700 delay-100 ${isOpen ? 'scale-100 rotate-0' : 'scale-0 rotate-12'}`}>
                                <CheckCircle2 className="w-10 h-10 text-white" />
                            </div>
                        </div>
                    </div>

                    <div className={`transition-all duration-500 delay-200 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <h4 className={`text-2xl font-bold text-center mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {title}
                        </h4>
                        <p className={`text-center text-base leading-relaxed px-2 ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                            {message}
                        </p>
                    </div>

                    <div className={`mt-10 transition-all duration-500 delay-300 transform ${isOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                        <button
                            onClick={onClose}
                            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 hover:scale-[1.02] ${darkMode
                                ? 'bg-white text-zinc-900 hover:bg-zinc-100'
                                : 'bg-gray-900 text-white hover:bg-gray-800 shadow-xl shadow-gray-400/20'
                                }`}
                        >
                            Continue
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default DeleteHistoryModal;
