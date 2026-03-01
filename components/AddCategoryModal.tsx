import React, { useState } from 'react';
import {
    X,
    FolderPlus,
    Check,
    MapPin,
    Building,
    Globe,
    GraduationCap,
    BookOpen,
    Hotel,
    Folder,
    Briefcase,
    Users,
    Heart,
    Star,
    Zap
} from 'lucide-react';
import { saveCategory } from '../src/lib/bookStorage';
import type { CustomCategory } from '../types';

interface AddCategoryModalProps {
    isOpen: boolean;
    darkMode: boolean;
    onClose: () => void;
    onCategoryAdded: (category: CustomCategory) => void;
}

const PRESET_COLORS = [
    '#3B82F6', // blue
    '#A855F7', // purple
    '#22C55E', // green
    '#F97316', // orange
    '#EAB308', // yellow
    '#EC4899', // pink
    '#06B6D4', // cyan
    '#EF4444', // red
];

const PRESET_ICONS = [
    { id: 'folder', icon: Folder },
    { id: 'map-pin', icon: MapPin },
    { id: 'building', icon: Building },
    { id: 'globe', icon: Globe },
    { id: 'graduation-cap', icon: GraduationCap },
    { id: 'book-open', icon: BookOpen },
    { id: 'hotel', icon: Hotel },
    { id: 'briefcase', icon: Briefcase },
    { id: 'users', icon: Users },
    { id: 'heart', icon: Heart },
    { id: 'star', icon: Star },
    { id: 'zap', icon: Zap },
];

function toSlug(name: string): string {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s_]/g, '')
        .replace(/\s+/g, '_');
}

const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, darkMode, onClose, onCategoryAdded }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [icon, setIcon] = useState(PRESET_ICONS[0].id);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen) return null;

    const slug = toSlug(name);

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Please enter a category name.');
            return;
        }
        if (!slug) {
            setError('Category name must contain valid characters.');
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            const newCategory = await saveCategory(name.trim(), slug, color, icon);
            onCategoryAdded(newCategory);
            setName('');
            setColor(PRESET_COLORS[0]);
            setIcon(PRESET_ICONS[0].id);
            onClose();
        } catch (e: any) {
            setError(e.message.includes('unique') ? 'A category with this name already exists.' : e.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') onClose();
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`relative w-full max-w-sm max-h-[90vh] rounded-[28px] shadow-2xl border overflow-y-auto animate-in zoom-in-95 fade-in duration-200 ${darkMode
                ? 'bg-[#141418]/95 backdrop-blur-3xl border-white/[0.06] shadow-black/60'
                : 'bg-white border-gray-200 shadow-gray-300/50'
                }`}>
                {/* Header */}
                <div className="flex items-center justify-between px-7 pt-7 pb-5">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-lime-500/15' : 'bg-emerald-50'}`}>
                            <FolderPlus size={20} className="text-lime-400" />
                        </div>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            New Category
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-xl transition-all ${darkMode ? 'hover:bg-white/[0.06] text-zinc-400' : 'hover:bg-gray-100 text-gray-500'}`}
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="px-7 pb-7 space-y-5">
                    {/* Name Input */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-lime-400/50' : 'text-gray-400'}`}>
                            Category Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => { setName(e.target.value); setError(null); }}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g. Marketing, HR, Finance..."
                            maxLength={40}
                            className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all border ${darkMode
                                ? 'bg-white/[0.04] border-white/[0.08] text-white placeholder-zinc-600 focus:border-lime-500/40 focus:bg-white/[0.07]'
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:bg-white'
                                }`}
                        />
                        {slug && name && (
                            <p className={`text-[11px] ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>
                                Slug: <span className={`font-mono ${darkMode ? 'text-lime-400/60' : 'text-lime-500'}`}>{slug}</span>
                            </p>
                        )}
                    </div>

                    {/* Color Picker */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-lime-400/50' : 'text-gray-400'}`}>
                            Color
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className="w-8 h-8 rounded-full transition-all duration-150 flex items-center justify-center hover:scale-110 active:scale-95"
                                    style={{ backgroundColor: c, boxShadow: color === c ? `0 0 0 2px ${darkMode ? '#122a22' : '#fff'}, 0 0 0 4px ${c}` : 'none' }}
                                >
                                    {color === c && <Check size={14} className="text-white" strokeWidth={3} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Icon Picker */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-lime-400/50' : 'text-gray-400'}`}>
                            Icon
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {PRESET_ICONS.map(i => {
                                const IconComp = i.icon;
                                const isSelected = icon === i.id;
                                return (
                                    <button
                                        key={i.id}
                                        onClick={() => setIcon(i.id)}
                                        className={`w-10 h-10 rounded-xl transition-all duration-150 flex items-center justify-center hover:scale-105 active:scale-95 ${isSelected
                                            ? darkMode ? 'bg-lime-500/20 text-lime-400 border border-lime-500/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                            : darkMode ? 'bg-white/[0.04] text-zinc-400 border border-transparent hover:bg-white/[0.08]' : 'bg-gray-50 text-gray-500 border border-transparent hover:bg-gray-100'
                                            }`}
                                    >
                                        <IconComp size={18} strokeWidth={isSelected ? 2.5 : 2} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-red-400 text-sm font-medium">{error}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-1">
                        <button
                            onClick={onClose}
                            className={`flex-1 py-3 rounded-2xl font-semibold text-sm transition-all active:scale-[0.98] ${darkMode
                                ? 'bg-white/[0.05] hover:bg-white/[0.09] text-zinc-400'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !name.trim()}
                            className="flex-1 py-3 rounded-2xl font-semibold text-sm text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            style={{ backgroundColor: color, boxShadow: `0 4px 20px ${color}40` }}
                        >
                            {isSaving ? 'Saving...' : 'Create'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddCategoryModal;
