import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
    X, Video, Upload, Link2, Play, Trash2, Image, Check,
    ArrowLeft, Film, Clock, Pencil, Loader2
} from 'lucide-react';
import {
    loadVideos, saveVideoMetadata,
    uploadVideoThumbnail, deleteVideo, updateVideo,
    uploadVideoFile
} from '../src/lib/videoStorage';

/* ─────────────────── types ─────────────────── */
type Step = 'upload' | 'meta';

export interface VideoEntry {
    id: string;
    name: string;
    thumbnailUrl: string;
    sourceUrl: string;
    isFile: boolean;
    addedAt: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    categorySlug?: string;
    categoryName?: string;
    darkMode: boolean;
    readOnly?: boolean;
}

/* ─────────────────── helpers ─────────────────── */

function ytId(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
        if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    } catch { /* */ }
    return null;
}
function ytThumb(url: string) {
    const id = ytId(url);
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}
function fmtDate(ts: number): string {
    return new Date(ts).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}
function fmtSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ─────────────────── component ─────────────────── */
const VideoLinksModal: React.FC<Props> = ({
    isOpen, onClose, onBack, categorySlug, categoryName = '', darkMode, readOnly = false
}) => {
    const dm = darkMode;

    const [entries, setEntries] = useState<VideoEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCommitting, setIsCommitting] = useState(false);

    const [step, setStep] = useState<Step>(readOnly ? 'meta' : 'upload');
    const [linkInput, setLinkInput] = useState('');
    const [linkError, setLinkError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [pendingName, setPendingName] = useState('');
    const [pendingUrl, setPendingUrl] = useState('');
    const [pendingThumb, setPendingThumb] = useState('');
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [customThumb, setCustomThumb] = useState<string | null>(null);
    const [thumbSuggestions, setThumbSuggestions] = useState<string[]>([]);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [deletingItem, setDeletingItem] = useState<VideoEntry | null>(null);
    const [editName, setEditName] = useState('');
    const [editUrl, setEditUrl] = useState('');
    const [editThumb, setEditThumb] = useState('');
    const [isEditingSaving, setIsEditingSaving] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const thumbInputRef = useRef<HTMLInputElement>(null);
    const editThumbRef = useRef<HTMLInputElement>(null);

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
            resetToUpload();
            setDeletingItem(null);
        }
    }, [isOpen, fetchVideos]);

    function resetToUpload() {
        setStep('upload'); setLinkInput(''); setLinkError('');
        setUploadProgress(0);
        setPendingName(''); setPendingUrl(''); setPendingThumb('');
        setPendingFile(null);
        setCustomThumb(null); setThumbSuggestions([]);
        setEditingId(null);
    }

    async function commitEntry() {
        if (!pendingName.trim() || isCommitting) return;
        setIsCommitting(true);
        try {
            let finalUrl = pendingUrl;
            let isVideoFile = !!pendingFile;

            // Step 1: Upload video file if provided
            if (pendingFile) {
                finalUrl = await uploadVideoFile(pendingFile, (progress) => {
                    setUploadProgress(progress);
                });
            }

            // Step 2: Handle Thumbnail
            let finalThumb = customThumb || pendingThumb;
            const tempId = Date.now().toString();

            if (finalThumb.startsWith('data:') || finalThumb.startsWith('blob:')) {
                finalThumb = await uploadVideoThumbnail(finalThumb, tempId);
            }

            // Step 3: Save Metadata
            const newEntry = await saveVideoMetadata({
                name: pendingName.trim(),
                thumbnailUrl: finalThumb,
                sourceUrl: finalUrl,
                isFile: isVideoFile,
            }, categorySlug);

            setEntries([newEntry, ...entries]);
            resetToUpload();
        } catch (error: any) {
            console.error('Error saving video:', error);
            alert(`Failed to save video: ${error.message}`);
        } finally {
            setIsCommitting(false);
        }
    }

    function handleLinkSubmit() {
        if (!linkInput.trim()) { setLinkError('Please enter a URL.'); return; }
        try { new URL(linkInput.trim()); } catch { setLinkError('Please enter a valid URL.'); return; }
        const url = linkInput.trim();
        const thumb = ytThumb(url) || '';
        setPendingUrl(url);
        setPendingThumb(thumb); setThumbSuggestions(thumb ? [thumb] : []);
        setPendingName(''); setStep('meta');
    }

    function handleThumbFile(e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) {
        const f = e.target.files?.[0]; if (!f) return;
        const r = new FileReader(); r.onload = () => setter(r.result as string); r.readAsDataURL(f);
    }

    const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setStep('meta');
        setPendingFile(file);
        setPendingName(file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "));
        setPendingUrl(URL.createObjectURL(file));

        // Generate thumbnail
        try {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.crossOrigin = 'anonymous';
            video.currentTime = 1; // Seek to 1s mark
            
            video.onloadeddata = () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumb = canvas.toDataURL('image/jpeg', 0.8);
                setPendingThumb(thumb);
                setThumbSuggestions([thumb]);
            };
        } catch (err) {
            console.warn("Could not generate thumbnail", err);
        }
    };

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
        setEditThumb(e.thumbnailUrl);
    }

    async function saveEdit(id: string) {
        setIsEditingSaving(true);
        try {
            let finalThumb = editThumb;
            if (editThumb.startsWith('data:') || editThumb.startsWith('blob:')) {
                finalThumb = await uploadVideoThumbnail(editThumb, id);
            }

            await updateVideo(id, {
                name: editName.trim() || undefined,
                sourceUrl: editUrl.trim() || undefined,
                thumbnailUrl: finalThumb
            });

            setEntries(entries.map(e =>
                e.id === id ? { ...e, name: editName.trim() || e.name, sourceUrl: editUrl.trim() || e.sourceUrl, thumbnailUrl: finalThumb } : e
            ));
            setEditingId(null);
        } catch (error: any) {
            console.error('Failed to update video', error);
            alert(`Failed to update: ${error.message}`);
        } finally {
            setIsEditingSaving(false);
        }
    }

    if (!isOpen) return null;

    /* ── theme tokens ── */
    const bg = dm ? 'bg-[#18181c] border-white/[0.08] shadow-black/70' : 'bg-white border-gray-200 shadow-gray-200/50';
    const divider = dm ? 'border-white/[0.07]' : 'border-gray-100';
    const footBg = dm ? 'bg-[#1e1e22] border-white/[0.07]' : 'bg-gray-50 border-gray-100';
    const title1 = dm ? 'text-white' : 'text-gray-900';
    const sub = dm ? 'text-zinc-500' : 'text-gray-400';
    const colName = dm ? 'text-zinc-100' : 'text-gray-900';
    const colDate = dm ? 'text-zinc-400' : 'text-gray-800';
    const colHdr = dm ? 'text-zinc-700' : 'text-gray-400';
    const rowHov = dm ? 'hover:bg-white/[0.04]' : 'hover:bg-gray-50';
    const inputCls = `w-full text-sm px-3.5 py-2.5 rounded-xl outline-none border transition-colors
    ${dm ? 'bg-white/[0.08] border-white/[0.15] text-zinc-100 placeholder-zinc-500 focus:border-lime-500/60 focus:ring-1 focus:ring-lime-500/30'
            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20'}`;
    const smInputCls = `w-full text-sm px-3 py-2 rounded-xl outline-none border transition-colors
    ${dm ? 'bg-white/[0.08] border-white/[0.15] text-zinc-100 placeholder-zinc-500 focus:border-lime-500/60'
            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-400'}`;
    const btnGreen = `flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-[0.97] shadow-md bg-lime-500 hover:bg-emerald-600 text-white shadow-emerald-300/40`;
    const btnGhost = `px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${dm ? 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`;

    return createPortal(
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4 shadow-2xl">
            <div className={`absolute inset-0 backdrop-blur-md ${dm ? 'bg-black/60' : 'bg-black/40'}`} onClick={onBack || onClose} />

            <div className={`relative w-full max-w-2xl rounded-[28px] shadow-2xl border flex flex-col overflow-hidden max-h-[90vh] animate-in zoom-in-95 fade-in duration-300 ${bg}`}>


                {/* ── Header ── */}
                <div className={`flex items-center justify-between px-5 sm:px-7 py-4 sm:pt-6 sm:pb-5 border-b shrink-0 ${divider}`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                        {onBack && (
                            <button onClick={onBack}
                                className={`p-1.5 rounded-full transition-colors ${dm ? 'text-zinc-500 hover:text-white hover:bg-white/[0.07]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                                <ArrowLeft size={17} />
                            </button>
                        )}
                        <div className={`p-1.5 sm:p-2 rounded-xl ${dm ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
                            {isCommitting ? (
                                <Loader2 size={16} className={`animate-spin ${dm ? 'text-lime-400' : 'text-emerald-600'}`} />
                            ) : (
                                <Video size={16} className={dm ? 'text-lime-400' : 'text-emerald-600'} />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className={`text-[15px] sm:text-[18px] font-bold tracking-tight truncate ${title1}`}>
                                {readOnly ? 'Video Gallery' : (step === 'meta' ? 'Video Details' : 'Add New Video')}
                            </h3>
                            <p className={`text-[9px] sm:text-[12px] font-medium truncate ${sub}`}>{categoryName}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className={`p-1.5 rounded-full transition-colors ${dm ? 'text-zinc-500 hover:text-white hover:bg-white/[0.07]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                        <X size={18} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div className="flex-1 overflow-y-auto">

                    {/* Loading State for initial fetch */}
                    {isLoading && (
                        <div className="px-7 py-20 flex flex-col items-center justify-center">
                            <Loader2 size={32} className={`animate-spin mb-3 ${dm ? 'text-zinc-500' : 'text-gray-400'}`} />
                            <p className={`text-sm ${dm ? 'text-zinc-400' : 'text-gray-500'}`}>Loading videos...</p>
                        </div>
                    )}

                    {/* ═══ UPLOAD STEP ═══ */}
                    {step === 'upload' && !readOnly && !isLoading && (
                        <div className="px-5 sm:px-7 py-5 sm:py-6 space-y-4 sm:space-y-5">
                            {/* File Upload Button */}
                            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-[24px] py-6 sm:py-10 px-5 sm:px-6 transition-all group bg-white/[0.02] border-white/[0.1] hover:border-lime-500/40 hover:bg-lime-500/[0.02]">
                                <div className="p-3 sm:p-4 rounded-full bg-white/[0.05] group-hover:bg-lime-500/10 group-hover:scale-110 transition-all mb-3 sm:mb-4">
                                    <Upload size={28} className="text-zinc-600 group-hover:text-lime-400" />
                                </div>
                                <h4 className={`text-sm sm:text-lg font-bold mb-1 text-center ${dm ? 'text-zinc-200' : 'text-gray-900'}`}>Upload Video</h4>
                                <p className={`text-[11px] sm:text-sm mb-5 sm:mb-6 text-center ${dm ? 'text-zinc-500' : 'text-gray-500'}`}>MP4, MOV, or AVI files</p>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full sm:w-auto px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-white text-zinc-900 text-sm font-bold shadow-lg hover:bg-zinc-100 transition-all active:scale-95"
                                >
                                    Choose Video File
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="video/*"
                                    className="hidden"
                                    onChange={handleVideoFileSelect}
                                />
                            </div>

                            <div className="flex items-center gap-4 py-2">
                                <div className={`flex-1 h-px ${dm ? 'bg-white/5' : 'bg-gray-100'}`} />
                                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-zinc-700' : 'text-gray-300'}`}>Or Add via Link</span>
                                <div className={`flex-1 h-px ${dm ? 'bg-white/5' : 'bg-gray-100'}`} />
                            </div>


                            {/* Link input */}
                            <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="flex-1 relative">
                                        <Link2 size={15} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${dm ? 'text-zinc-600' : 'text-gray-400'}`} />
                                        <input type="url" placeholder="Paste video URL here..."
                                            value={linkInput}
                                            onChange={e => { setLinkInput(e.target.value); setLinkError(''); }}
                                            onKeyDown={e => e.key === 'Enter' && handleLinkSubmit()}
                                            className={`${inputCls} pl-9`} />
                                    </div>
                                    <button onClick={handleLinkSubmit} className={btnGreen}>Add Link</button>
                                </div>
                                {linkError && <p className="text-red-500 text-xs px-1">{linkError}</p>}
                            </div>
                        </div>
                    )}

                    {/* ═══ META STEP ═══ */}
                    {step === 'meta' && !readOnly && (
                        <div className="px-5 sm:px-7 py-5 sm:py-6 space-y-5 sm:space-y-6">
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                                <div className={`w-full sm:w-44 aspect-video rounded-2xl overflow-hidden shrink-0 flex items-center justify-center border ${dm ? 'bg-white/[0.05] border-white/[0.08]' : 'bg-gray-100 border-gray-200'}`}>
                                    {(customThumb || pendingThumb)
                                        ? <img src={customThumb || pendingThumb} className="w-full h-full object-cover" alt="" />
                                        : <Play size={28} className={dm ? 'text-zinc-700' : 'text-gray-300'} />}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className={`text-[11px] font-bold uppercase tracking-widest block mb-1.5 ${dm ? 'text-zinc-500' : 'text-gray-400'}`}>Video Name</label>
                                        <input type="text" placeholder="Enter a display name" value={pendingName}
                                            onChange={e => setPendingName(e.target.value)} className={inputCls} autoFocus />
                                    </div>
                                    <div>
                                        <label className={`text-[11px] font-bold uppercase tracking-widest block mb-1.5 ${dm ? 'text-zinc-500' : 'text-gray-400'}`}>Video URL / Source</label>
                                        <input type="url" placeholder="Video URL" value={pendingUrl}
                                            onChange={e => setPendingUrl(e.target.value)} className={inputCls}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Thumb picker */}
                            <div>
                                <label className={`text-[11px] font-bold uppercase tracking-widest block mb-3 ${dm ? 'text-zinc-500' : 'text-gray-400'}`}>Choose Thumbnail</label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {thumbSuggestions.map((t, i) => (
                                        <button key={i} onClick={() => setCustomThumb(t)}
                                            className={`relative aspect-video rounded-xl overflow-hidden border-2 transition-all
                                ${(customThumb ?? pendingThumb) === t ? 'border-lime-500' : dm ? 'border-transparent hover:border-white/20' : 'border-transparent hover:border-gray-300'}`}>
                                            <img src={t} className="w-full h-full object-cover" alt="" />
                                            {(customThumb ?? pendingThumb) === t && (
                                                <div className="absolute inset-0 bg-lime-500/20 flex items-center justify-center">
                                                    <Check size={20} className="text-white drop-shadow" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                    <button onClick={() => thumbInputRef.current?.click()}
                                        className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all
                                      ${dm ? 'border-white/[0.10] hover:border-lime-500/50 text-zinc-600 hover:text-lime-400' : 'border-gray-200 hover:border-emerald-400 text-gray-400 hover:text-emerald-500'}`}>
                                        <Image size={16} />
                                        <span className="text-[9px] font-medium">Custom</span>
                                    </button>
                                    <input ref={thumbInputRef} type="file" accept="image/*" className="hidden"
                                        onChange={e => handleThumbFile(e, setCustomThumb)} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ═══ HISTORY ═══ */}
                    {(step === 'upload' || readOnly) && !isLoading && (
                        <div className="px-4 sm:px-7 pb-6 space-y-4 pt-4 sm:pt-6">
                            {entries.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 px-1">
                                        <Clock size={13} className={sub} />
                                        <p className={`text-[10px] sm:text-xs font-semibold uppercase tracking-widest ${colHdr}`}>Recent Activity</p>
                                    </div>
                                    
                                    {/* Responsive Table / Card List */}
                                    <div className="space-y-2">
                                        {/* Table Header (Desktop only) */}
                                        <div className={`hidden lg:grid grid-cols-[56px_1fr_1fr_130px_64px] text-[11px] font-bold uppercase tracking-[0.1em] px-4 pb-2 border-b ${divider} ${colHdr}`}>
                                            <span /><span>Name</span><span>Source</span><span>Date Added</span><span className="text-right">Actions</span>
                                        </div>

                                        <div className="space-y-2 lg:space-y-1">
                                            {entries.map(e => (
                                                <div key={e.id}>
                                                    {editingId === e.id ? (
                                                        <div className={`p-4 rounded-xl border space-y-3 ${dm ? 'border-lime-500/30 bg-lime-500/10' : 'border-emerald-200 bg-lime-50'}`}>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                                <input value={editName} onChange={ev => setEditName(ev.target.value)} placeholder="Name" className={smInputCls} />
                                                                <input value={editUrl} onChange={ev => setEditUrl(ev.target.value)} placeholder="URL" className={smInputCls} disabled={e.isFile} />
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                {editThumb && <img src={editThumb} className="w-16 aspect-video object-cover rounded-lg border border-white/10" alt="" />}
                                                                <button onClick={() => editThumbRef.current?.click()} className={`text-xs font-semibold hover:underline ${dm ? 'text-lime-400' : 'text-emerald-600'}`}>
                                                                    Change thumbnail
                                                                </button>
                                                                <input type="file" accept="image/*" className="hidden" ref={editThumbRef}
                                                                    onChange={ev => handleThumbFile(ev, setEditThumb)} />
                                                            </div>
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={() => setEditingId(null)} className={btnGhost} disabled={isEditingSaving}>Cancel</button>
                                                                <button onClick={() => saveEdit(e.id)} className={btnGreen} disabled={isEditingSaving}>
                                                                    {isEditingSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Save
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`group flex flex-col lg:grid lg:grid-cols-[56px_1fr_1fr_130px_64px] items-start lg:items-center gap-2 lg:gap-4 px-3 sm:px-4 py-3 sm:py-3.5 rounded-2xl transition-all ${rowHov} border ${dm ? 'bg-white/[0.02] border-white/[0.05]' : 'bg-white border-gray-100'} lg:bg-transparent lg:border-transparent`}>
                                                            <div className="flex items-center gap-3 w-full lg:w-auto">
                                                                <div className={`w-14 lg:w-12 h-9 lg:h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border ${dm ? 'bg-black border-white/10' : 'bg-gray-100 border-gray-200'}`}>
                                                                    {e.thumbnailUrl
                                                                        ? <img src={e.thumbnailUrl} className="w-full h-full object-cover" alt="" />
                                                                        : <Play size={12} className={dm ? 'text-zinc-700' : 'text-gray-300'} />}
                                                                </div>
                                                                <div className="flex-1 min-w-0 lg:hidden">
                                                                    <p className={`text-sm font-bold truncate ${colName}`}>{e.name}</p>
                                                                    <p className={`text-[11px] font-medium truncate ${dm ? 'text-lime-400/80' : 'text-emerald-600'}`}>{e.sourceUrl}</p>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Desktop Columns */}
                                                            <p className={`hidden lg:block text-[14px] font-bold truncate pr-2 ${colName}`}>{e.name}</p>
                                                            <a href={e.sourceUrl} target="_blank" rel="noopener noreferrer"
                                                                onClick={ev => ev.stopPropagation()}
                                                                className={`hidden lg:block text-[13px] font-medium truncate hover:underline ${dm ? 'text-lime-400/80 hover:text-lime-400' : 'text-emerald-600 hover:text-emerald-700'}`}>
                                                                {e.sourceUrl}
                                                            </a>
                                                            
                                                            <div className="flex items-center justify-between w-full lg:w-auto lg:contents mt-1 lg:mt-0 pt-2 lg:pt-0 border-t lg:border-none border-white/5">
                                                                <span className={`text-[11px] lg:text-[12px] font-medium shrink-0 ${colDate}`}>{fmtDate(e.addedAt)}</span>
                                                                
                                                                {!readOnly && (
                                                                    <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button onClick={() => startEdit(e)}
                                                                            className={`p-1.5 sm:p-2 rounded-xl transition-all ${dm ? 'text-zinc-500 hover:text-lime-400 hover:bg-lime-500/10' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}>
                                                                            <Pencil size={14} />
                                                                        </button>
                                                                        <button onClick={() => setDeletingItem(e)}
                                                                            className={`p-1.5 sm:p-2 rounded-xl transition-all ${dm ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}>
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className={`flex flex-col items-center justify-center py-10 gap-3 rounded-[24px] border-2 border-dashed ${dm ? 'border-white/[0.06] text-zinc-700' : 'border-gray-100 text-gray-300'}`}>
                                    <Film size={28} strokeWidth={1} />
                                    <p className="text-xs font-medium">No videos found</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Footer ── */}
                <div className={`flex items-center justify-between px-5 sm:px-7 py-4 border-t shrink-0 ${footBg}`}>
                    <p className={`hidden sm:block text-xs ${sub}`}>{entries.length} video{entries.length !== 1 ? 's' : ''}</p>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {step === 'meta' && !readOnly ? (
                            <>
                                <button onClick={resetToUpload} className={`flex-1 sm:flex-none ${btnGhost}`} disabled={isCommitting}>Back</button>
                                <button onClick={commitEntry} disabled={!pendingName.trim() || !pendingUrl.trim() || isCommitting}
                                    className={`flex-1 sm:flex-none ${btnGreen} disabled:opacity-40 disabled:cursor-not-allowed`}>
                                    {isCommitting ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                                    {isCommitting ? 'Saving...' : 'Save Video'}
                                </button>
                            </>
                        ) : (
                            <button onClick={onClose} className={`w-full sm:w-auto ${btnGhost}`}>Close</button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Delete Confirmation Overlay ── */}
            {deletingItem && (
                <div className="fixed inset-0 z-[230] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !isCommitting && setDeletingItem(null)} />
                    <div className={`relative w-full max-sm:max-w-[320px] max-w-sm rounded-[24px] shadow-2xl border p-6 flex flex-col items-center text-center animate-in zoom-in-95 duration-200 ${dm ? 'bg-[#18181c] border-white/10' : 'bg-white border-gray-200'}`}>
                        <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-500">
                            {isCommitting ? <Loader2 size={24} className="animate-spin" /> : <Trash2 size={24} strokeWidth={1.5} />}
                        </div>
                        <h3 className={`text-lg font-bold mb-1 ${dm ? 'text-white' : 'text-gray-900'}`}>Delete Video</h3>
                        <p className={`text-sm mb-6 ${dm ? 'text-zinc-400' : 'text-gray-500'}`}>
                            Are you sure you want to remove <strong className={dm ? 'text-zinc-200' : 'text-gray-700'}>"{deletingItem.name}"</strong>?
                        </p>
                        <div className="flex items-center gap-3 w-full">
                            <button onClick={() => setDeletingItem(null)} disabled={isCommitting}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${dm ? 'bg-white/[0.06] hover:bg-white/10 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}>
                                Cancel
                            </button>
                            <button onClick={() => confirmDelete(deletingItem.id)} disabled={isCommitting}
                                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/20 disabled:opacity-50">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Upload Progress Overlay ── */}
            {isCommitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="absolute inset-x-0 bottom-0 z-[240] p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
                    <div className={`rounded-2xl border p-4 shadow-2xl ${dm ? 'bg-[#18181c] border-white/10 shadow-black' : 'bg-white border-gray-200 shadow-gray-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${dm ? 'text-lime-400' : 'text-emerald-600'}`}>Uploading Video...</span>
                            <span className={`text-xs font-mono font-bold ${dm ? 'text-zinc-400' : 'text-gray-500'}`}>{Math.round(uploadProgress)}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${dm ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <div 
                                className="h-full bg-lime-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(132,204,22,0.4)]"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        @keyframes vlIn {
          from { opacity:0; transform: translateY(100%); }
          to   { opacity:1; transform: translateY(0); }
        }
        @media (min-width: 768px) {
          @keyframes vlIn {
            from { opacity:0; transform: scale(.96) translateY(8px); }
            to   { opacity:1; transform: scale(1) translateY(0); }
          }
        }
      `}</style>
        </div>,
        document.body
    );
};

export default VideoLinksModal;
