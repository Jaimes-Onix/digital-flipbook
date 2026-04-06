import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Video, Trash2, ExternalLink, Plus, History, Grid2X2, Pencil, Check, Loader2 } from 'lucide-react';
import { loadVideos, updateVideo, deleteVideo, uploadVideoThumbnail } from '../src/lib/videoStorage';
import { VideoEntry } from './VideoLinksModal';

/* ─────────────── helpers ─────────────── */
function galleryTitle(name: string): string {
    return name.replace(/\s*Flipbooks?\s*$/i, '').trim() + ' Videos';
}
function fmtDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}
type View = 'grid' | 'history';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    categorySlug: string;
    categoryName: string;
    darkMode: boolean;
    onAddVideo?: () => void;
}

/* ─────────────── component ─────────────── */
const VideoGalleryModal: React.FC<Props> = ({
    isOpen, onClose, categorySlug, categoryName, darkMode, onAddVideo
}) => {
    const dm = darkMode;
    const [entries, setEntries] = useState<VideoEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);

    const [hovered, setHovered] = useState<string | null>(null);
    const [view, setView] = useState<View>('grid');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingItem, setDeletingItem] = useState<VideoEntry | null>(null);
    const [editName, setEditName] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [isEditingSaving, setIsEditingSaving] = useState(false);

    const fetchVideos = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await loadVideos(categorySlug);
            setEntries(data);
        } catch (error) {
            console.error("Failed to fetch videos", error);
        } finally {
            setIsLoading(false);
        }
    }, [categorySlug]);

    useEffect(() => {
        if (isOpen) {
            fetchVideos();
            setView('grid');
        }
    }, [isOpen, fetchVideos]);

    if (!isOpen) return null;

    const title = galleryTitle(categoryName);

    async function confirmDelete(id: string) {
        setIsCommitting(true);
        try {
            await deleteVideo(id);
            setEntries(entries.filter(e => e.id !== id));
            setDeletingItem(null);
        } catch (error: any) {
            console.error('Failed to delete video', error);
            alert(`Failed to delete: ${error.message}`);
        } finally {
            setIsCommitting(false);
        }
    }

    function startEdit(e: VideoEntry) {
        setEditingId(e.id);
        setEditName(e.name);
        setEditUrl(e.sourceUrl);
    }

    async function saveEdit(id: string) {
        setIsEditingSaving(true);
        try {
            await updateVideo(id, {
                name: editName.trim() || undefined,
                sourceUrl: editUrl.trim() || undefined
            });

            setEntries(entries.map(e =>
                e.id === id ? { ...e, name: editName.trim() || e.name, sourceUrl: editUrl.trim() || e.sourceUrl } : e
            ));
            setEditingId(null);
        } catch (error: any) {
            console.error('Failed to update video', error);
            alert(`Failed to update: ${error.message}`);
        } finally {
            setIsEditingSaving(false);
        }
    }

    /* ── theme tokens ── */
    const bg = dm ? 'bg-[#18181c] border-white/[0.08]' : 'bg-white border-gray-200';
    const divider = dm ? 'border-white/[0.07]' : 'border-gray-100';
    const footer = dm ? 'bg-[#1e1e22] border-white/[0.07]' : 'bg-gray-50 border-gray-100';
    const title1 = dm ? 'text-white' : 'text-gray-900';
    const sub = dm ? 'text-zinc-500' : 'text-gray-400';
    const rowHov = dm ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50';
    const colName = dm ? 'text-zinc-100' : 'text-gray-900';
    const colDate = dm ? 'text-zinc-400' : 'text-gray-800';
    const colHdr = dm ? 'text-zinc-700' : 'text-gray-400';
    const inputCls = `w-full text-sm px-3 py-2 rounded-xl border outline-none transition-colors
    ${dm ? 'bg-white/[0.05] border-white/[0.10] text-zinc-200 placeholder-zinc-600 focus:border-lime-500/50'
            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-400'}`;
    const tabActive = `flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-lime-500 text-white shadow-md shadow-emerald-200/40 transition-all`;
    const tabInactive = `flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${dm ? 'text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`;
    const tabWrap = `flex items-center gap-1 p-1 rounded-xl mr-1 ${dm ? 'bg-white/[0.06]' : 'bg-gray-100'}`;

    return createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 shadow-2xl">
            <div className="absolute inset-0 backdrop-blur-md bg-black/50" onClick={onClose} />

            <div className={`relative w-full max-w-6xl rounded-[28px] shadow-2xl border flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300 ${bg}`}
                style={{ height: 'min(90vh, 860px)' }}>


                {/* ── Header ── */}
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 sm:px-8 py-4 sm:pt-7 sm:pb-5 border-b shrink-0 gap-4 sm:gap-3 ${divider}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl flex-shrink-0 ${dm ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                            <Video size={18} className={`sm:w-5 sm:h-5 ${dm ? 'text-lime-400' : 'text-emerald-600'}`} />
                        </div>
                        <div className="min-w-0">
                            <h2 className={`text-[15px] sm:text-xl font-bold tracking-tight truncate ${title1}`}>{title}</h2>
                            <p className={`text-[9px] sm:text-xs mt-0.5 ${sub}`}>{entries.length} video{entries.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                            {/* View tabs */}
                            <div className={`${tabWrap} flex-grow sm:flex-grow-0`}>
                                <button className={`${view === 'grid' ? tabActive : tabInactive} flex-1 sm:flex-none justify-center px-3 sm:px-4`} onClick={() => setView('grid')}>
                                    <Grid2X2 size={14} /> <span className="hidden xs:inline sm:inline">Grid</span>
                                </button>
                                <button className={`${view === 'history' ? tabActive : tabInactive} flex-1 sm:flex-none justify-center px-3 sm:px-4`} onClick={() => setView('history')}>
                                    <History size={14} /> <span className="hidden xs:inline sm:inline">History</span>
                                </button>
                            </div>
                            {onAddVideo && (
                                <button onClick={onAddVideo}
                                    className="flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold
                      bg-lime-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-300/40 transition-all active:scale-95 shrink-0">
                                    <Plus size={15} /> <span className="hidden sm:inline">Add Video</span>
                                </button>
                            )}
                        </div>
                        <button onClick={onClose}
                            className={`p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0 ${dm ? 'text-zinc-500 hover:text-white hover:bg-white/[0.07]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                            <X size={18} className="sm:w-[19px] sm:h-[19px]" />
                        </button>
                    </div>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto px-3.5 sm:px-8 py-4 sm:py-6">

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Loader2 size={40} className={`animate-spin mb-4 ${dm ? 'text-lime-500' : 'text-emerald-500'}`} />
                            <p className={`text-base font-medium ${dm ? 'text-zinc-400' : 'text-gray-500'}`}>Loading videos...</p>
                        </div>
                    ) : (
                        <>
                            {/* ════ GRID ════ */}
                            {view === 'grid' && (
                                entries.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full gap-3">
                                        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${dm ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                                            <Play size={36} strokeWidth={1.2} className={dm ? 'text-lime-500 ml-1' : 'text-lime-400 ml-1'} />
                                        </div>
                                        <p className={`text-base font-semibold ${dm ? 'text-zinc-400' : 'text-gray-500'}`}>No videos yet</p>
                                        <p className={`text-sm ${dm ? 'text-zinc-700' : 'text-gray-300'}`}>Click "Add Video" to get started</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-4 sm:gap-x-5 gap-y-6 sm:gap-y-7">
                                        {entries.map(e => (
                                            <div key={e.id} className="group relative cursor-pointer"
                                                onMouseEnter={() => setHovered(e.id)} onMouseLeave={() => setHovered(null)}>
                                                <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
                                                    <div className={`relative w-full aspect-video rounded-xl overflow-hidden mb-2.5 border
                                transition-all duration-200 group-hover:scale-[1.03] group-hover:shadow-xl
                                ${dm ? 'bg-white/[0.05] border-white/[0.06] group-hover:shadow-black/40' : 'bg-gray-100 border-gray-100 group-hover:shadow-gray-200/80'}`}>
                                                        {e.thumbnailUrl
                                                            ? <img src={e.thumbnailUrl} alt={e.name} className="w-full h-full object-cover" />
                                                            : <div className="w-full h-full flex items-center justify-center">
                                                                <Play size={28} className={dm ? 'text-zinc-700' : 'text-gray-300'} />
                                                            </div>}
                                                        <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 bg-black/30 opacity-0 group-hover:opacity-100">
                                                            <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                                                <Play size={20} fill="#111" className="text-black ml-0.5" />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className={`text-[13px] sm:text-sm font-semibold line-clamp-2 leading-snug transition-colors ${dm ? 'text-zinc-200 group-hover:text-white' : 'text-gray-900 group-hover:text-black'}`}>
                                                        {e.name}
                                                    </p>
                                                </a>
                                                <div className="flex items-center justify-between mt-1">
                                                    <p className={`text-[11px] ${dm ? 'text-zinc-500' : 'text-gray-600'}`}>{fmtDate(e.addedAt)}</p>
                                                    <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"
                                                            className={`p-1 rounded-md transition-colors ${dm ? 'text-zinc-600 hover:text-lime-400' : 'text-gray-400 hover:text-emerald-600'}`}>
                                                            <ExternalLink size={12} />
                                                        </a>
                                                        <button onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setDeletingItem(e); }}
                                                            className={`p-1 rounded-md transition-colors ${dm ? 'text-zinc-600 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}>
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* ════ HISTORY ════ */}
                            {view === 'history' && (
                                entries.length === 0 ? (
                                    <div className={`flex flex-col items-center justify-center h-full gap-3 ${dm ? 'text-zinc-700' : 'text-gray-300'}`}>
                                        <History size={40} strokeWidth={1.2} />
                                        <p className={`text-sm font-medium ${dm ? 'text-zinc-500' : 'text-gray-400'}`}>No history yet</p>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {/* Table header — hidden on mobile */}
                                        <div className={`hidden lg:grid grid-cols-[64px_1fr_1.2fr_180px_80px] text-[11px] font-bold uppercase tracking-[0.1em] pb-3 px-4 ${colHdr}`}>
                                            <span />
                                            <span>Name</span>
                                            <span>Link / Source</span>
                                            <span>Date Added</span>
                                            <span className="text-right">Actions</span>
                                        </div>

                                        {entries.map(e => (
                                            <div key={e.id}>
                                                {editingId === e.id ? (
                                                    <div className={`p-5 rounded-2xl border space-y-4 ${dm ? 'border-lime-500/30 bg-lime-500/10' : 'border-emerald-200 bg-lime-50'}`}>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className={`text-[11px] font-bold uppercase tracking-widest block mb-1.5 ${dm ? 'text-zinc-500' : 'text-gray-400'}`}>Display Name</label>
                                                                <input value={editName} onChange={ev => setEditName(ev.target.value)} className={inputCls} />
                                                            </div>
                                                            <div>
                                                                <label className={`text-[11px] font-bold uppercase tracking-widest block mb-1.5 ${dm ? 'text-zinc-500' : 'text-gray-400'}`}>Video URL</label>
                                                                <input value={editUrl} onChange={ev => setEditUrl(ev.target.value)} className={inputCls} disabled={e.isFile} />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-3">
                                                            <button onClick={() => setEditingId(null)} disabled={isEditingSaving}
                                                                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${dm ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                                                                Cancel
                                                            </button>
                                                            <button onClick={() => saveEdit(e.id)} disabled={isEditingSaving}
                                                                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-lime-500 hover:bg-emerald-600 text-white transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                                                                {isEditingSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Save Changes
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className={`group grid grid-cols-1 lg:grid-cols-[64px_1fr_1.2fr_180px_80px] items-start lg:items-center gap-2 lg:gap-4 px-3 sm:px-4 py-3 sm:py-4 rounded-2xl transition-all ${rowHov} border border-transparent hover:border-white/5`}>
                                                        <div className={`w-14 h-9 rounded-lg overflow-hidden flex items-center justify-center shrink-0 border ${dm ? 'bg-black border-white/10' : 'bg-gray-100 border-gray-200'} hidden lg:flex`}>
                                                            {e.thumbnailUrl
                                                                ? <img src={e.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                                                : <Play size={14} className={dm ? 'text-zinc-700' : 'text-gray-300'} />}
                                                        </div>

                                                        {/* Name & Source stacked on mobile */}
                                                        <div className="min-w-0 flex-1 w-full">
                                                            <p className={`text-sm sm:text-[15px] font-bold truncate pr-3 ${colName}`}>{e.name}</p>
                                                            <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"
                                                                onClick={ev => ev.stopPropagation()}
                                                                className={`text-[12px] sm:text-sm font-medium truncate hover:underline block mt-0.5 ${dm ? 'text-lime-400/80 hover:text-lime-400' : 'text-emerald-600 hover:text-emerald-700'}`}>
                                                                {e.sourceUrl}
                                                            </a>
                                                        </div>

                                                        {/* Date & Actions */}
                                                        <div className="flex items-center justify-between lg:justify-start gap-4 w-full lg:w-auto mt-2 lg:mt-0">
                                                            <span className={`text-[11px] sm:text-[13px] font-medium shrink-0 ${colDate}`}>{fmtDate(e.addedAt)}</span>

                                                            {/* Actions */}
                                                            <div className={`flex items-center gap-1 sm:gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                                <button onClick={() => startEdit(e)}
                                                                    className={`p-2 rounded-xl transition-all ${dm ? 'text-zinc-500 hover:text-lime-400 hover:bg-lime-500/10' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                                                                    <Pencil size={15} />
                                                                </button>
                                                                <button onClick={() => setDeletingItem(e)}
                                                                    className={`p-2 rounded-xl transition-all ${dm ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                                                                    <Trash2 size={15} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className={`flex items-center justify-between px-4 sm:px-8 py-4 border-t shrink-0 ${footer}`}>
                    <p className={`text-xs ${dm ? 'text-zinc-600' : 'text-gray-500'}`}>{entries.length} total item{entries.length !== 1 ? 's' : ''}</p>
                    <button onClick={onClose}
                        className={`px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${dm ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}>
                        Close
                    </button>
                </div>
            </div>

            {/* ── Delete Confirmation Overlay ── */}
            {deletingItem && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !isCommitting && setDeletingItem(null)} />
                    <div className={`relative w-full max-sm:max-w-xs max-w-sm rounded-[24px] shadow-2xl border p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${dm ? 'bg-[#18181c] border-white/10' : 'bg-white border-gray-200'}`}>
                        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                            {isCommitting ? <Loader2 size={24} className="animate-spin" /> : <Trash2 size={24} strokeWidth={1.5} />}
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>Delete Video</h3>
                        <p className={`text-sm mb-6 ${dm ? 'text-zinc-400' : 'text-gray-500'}`}>
                            Are you sure you want to remove <strong className={dm ? 'text-zinc-200' : 'text-gray-700'}>"{deletingItem.name}"</strong>? This action cannot be undone.
                        </p>
                        <div className="flex items-center gap-3 w-full">
                            <button onClick={() => setDeletingItem(null)} disabled={isCommitting}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${dm ? 'bg-white/[0.06] hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                                Cancel
                            </button>
                            <button onClick={() => confirmDelete(deletingItem.id)} disabled={isCommitting}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white transition-all active:scale-95 shadow-md shadow-red-500/20 disabled:opacity-50">
                                {isCommitting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes vgIn {
          from { opacity:0; transform: translateY(100%); }
          to   { opacity:1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          @keyframes vgIn {
            from { opacity:0; transform: scale(.95) translateY(12px); }
            to   { opacity:1; transform: scale(1) translateY(0); }
          }
        }
      `}</style>
        </div>,
        document.body
    );
};

export default VideoGalleryModal;
