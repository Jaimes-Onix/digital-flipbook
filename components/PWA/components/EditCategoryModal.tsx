import React, { useState, useEffect } from 'react';
import {
    X,
    FolderEdit,
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
import { editCategory } from '../src/lib/bookStorage';
import type { CustomCategory } from '../types';

interface EditCategoryModalProps {
    isOpen: boolean;
    darkMode: boolean;
    category: CustomCategory | null;
    onClose: () => void;
    onCategoryEdited: (updatedCategory: CustomCategory, oldSlug: string) => void;
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
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ isOpen, darkMode, category, onClose, onCategoryEdited }) => {
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [icon, setIcon] = useState(PRESET_ICONS[0].id);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && category) {
            setName(category.name);
            setColor(category.color);
            setIcon(category.icon || 'folder');
            setError(null);
        }
    }, [isOpen, category]);

    if (!isOpen || !category) return null;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        const newSlug = toSlug(name);

        setIsSaving(true);
        setError(null);
        try {
            const updatedCategory = await editCategory(category.id, category.slug, name.trim(), newSlug, color, icon);
            onCategoryEdited(updatedCategory, category.slug);
            onClose();
        } catch (e: any) {
            setError(e.message.includes('unique') ? 'A category with this name already exists.' : e.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className={`relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-200 ${darkMode ? 'bg-[#18181b] border-white/10' : 'bg-white border-gray-100'
                } border`}>

                {/* Header */}
                <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'border-white/5 bg-white/[0.02]' : 'border-gray-100 bg-gray-50/50'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-lime-500/20 text-lime-400' : 'bg-emerald-100 text-emerald-600'
                            }`}>
                            <FolderEdit size={16} strokeWidth={2.5} />
                        </div>
                        <h2 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Edit Category
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${darkMode ? 'hover:bg-white/10 text-zinc-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className="p-6 space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-lime-400/50' : 'text-gray-400'}`}>
                            Category Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Sales Presentations"
                            autoFocus
                            className={`w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none focus:ring-2 focus:ring-lime-500/20 ${darkMode
                                ? 'bg-[#0f0f11] border-white/10 text-white placeholder:text-zinc-600 focus:border-lime-500/50'
                                : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-400'
                                }`}
                        />
                    </div>

                    {/* Color */}
                    <div className="space-y-2">
                        <label className={`text-xs font-semibold uppercase tracking-widest ${darkMode ? 'text-lime-400/50' : 'text-gray-400'}`}>
                            Color theme
                        </label>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full transition-all duration-200 relative flex items-center justify-center hover:scale-110 active:scale-95`}
                                    style={{
                                        backgroundColor: c,
                                        boxShadow: color === c ? `0 0 0 2px ${darkMode ? '#18181b' : 'white'}, 0 0 0 4px ${c}` : 'none'
                                    }}
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
                                        type="button"
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

                    {/* Submit */}
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={!name.trim() || isSaving}
                            className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${!name.trim() || isSaving
                                ? (darkMode ? 'bg-white/5 text-zinc-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                                : 'bg-emerald-500 hover:bg-lime-400 active:scale-[0.98] text-lime-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                                }`}
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-lime-950/30 border-t-lime-950 rounded-full animate-spin" />
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditCategoryModal;
