import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2, Loader2, Clock, BookX, Undo2 } from 'lucide-react';
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
        } catch (err) {
            console.error('Failed to remove log entry:', err);
        }
    };

    const handleClearAll = async () => {
        try {
            await clearAllDeletedBookLogs(category);
            setLogs([]);
        } catch (err) {
            console.error('Failed to clear all logs:', err);
        }
    };

    const handleRestore = async (bookId: string) => {
        try {
            await restoreBook(bookId);
            setLogs(prev => prev.filter(l => l.id !== bookId));
            onRestore?.(); // Refresh the library
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
                                onClick={handleClearAll}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${darkMode
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
                                            onClick={() => handleRemoveLog(log.id)}
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
        </div>,
        document.body
    );
};

export default DeleteHistoryModal;
