import React, { useState, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home as HomeIcon,
  Library as AllBooksIcon,
  Presentation,
  UploadCloud,
  MapPin,
  Building,
  Globe,
  GraduationCap,
  BookOpen,
  Hotel,
  Moon,
  Sun,
  Link2,
  LogOut,
  FolderPlus,
  Folder,
  LucideIcon,
  Pencil,
  Trash2,
  Star,
  Search,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react';
import ShareLinkModal from './ShareLinkModal';
import AddCategoryModal from './AddCategoryModal';
import { supabase } from '../src/lib/supabase';
import type { CustomCategory } from '../types';

export type LibraryFilter = string;

interface SidebarProps {
  currentView: 'home' | 'library' | 'upload' | 'convert-pptx' | 'create-trifold' | 'reader';
  currentFilter: LibraryFilter;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  customCategories: CustomCategory[];
  onCategoryAdded: (cat: CustomCategory) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  currentFilter,
  darkMode,
  onToggleDarkMode,
  isMobileOpen,
  onMobileClose,
  customCategories,
  onCategoryAdded,
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [shareModalTitle, setShareModalTitle] = useState('');
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<CustomCategory | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<CustomCategory | null>(null);

  // Category Search & Sort state
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [categorySortBy, setCategorySortBy] = useState<'az' | 'za' | 'newest'>('az');
  const [sortOpen, setSortOpen] = useState(false);

  const filteredAndSortedCategories = useMemo(() => {
    let result = [...customCategories];

    if (categorySearchQuery.trim()) {
      const q = categorySearchQuery.toLowerCase();
      result = result.filter(cat => cat.name.toLowerCase().includes(q));
    }

    switch (categorySortBy) {
      case 'az':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
    }

    return result;
  }, [customCategories, categorySearchQuery, categorySortBy]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/signin');
  };

  const handleShareClick = (e: React.MouseEvent, slug: string, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShareSlug(slug);
    setShareModalTitle(`Share ${label} Flipbooks`);
  };

  // Helper function to map string icon names to Lucide components
  const getCategoryIcon = (iconName?: string): LucideIcon => {
    switch (iconName) {
      case 'map-pin': return MapPin;
      case 'building': return Building;
      case 'globe': return Globe;
      case 'graduation-cap': return GraduationCap;
      case 'book-open': return BookOpen;
      case 'hotel': return Hotel;
      default: return Folder;
    }
  };

  const NavItem = ({ icon: Icon, label, active, to, onClick, color, categorySlug, cat }: any) => {
    const content = (
      <>
        <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${active
          ? darkMode ? 'bg-lime-500/15 shadow-lg shadow-lime-800/20' : 'bg-emerald-50 shadow-lg'
          : darkMode ? 'bg-transparent group-hover:bg-lime-500/[0.06]' : 'bg-transparent group-hover:bg-gray-100'
          }`}>
          {color ? (
            <Icon
              className="w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200"
              strokeWidth={active ? 2.2 : 1.8}
              style={{ color: color, opacity: active ? 1 : 0.65, filter: active ? `drop-shadow(0 0 6px ${color})` : 'none' }}
            />
          ) : (
            <Icon className={`w-4 h-4 sm:w-[18px] sm:h-[18px] ${active ? (darkMode ? 'text-lime-400' : 'text-gray-900') : (darkMode ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-black group-hover:text-black')}`} strokeWidth={active ? 2.2 : 1.8} />
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <span className={`text-[13px] sm:text-sm font-medium tracking-tight text-left block w-full truncate ${active
            ? darkMode ? 'text-white' : 'text-gray-900'
            : darkMode ? 'text-zinc-400 group-hover:text-white' : 'text-black group-hover:text-black'
            }`}>
            {label}
          </span>
        </div>

        {categorySlug && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => handleShareClick(e, categorySlug, label)}
              className={`p-1.5 rounded-lg transition-all shrink-0 ${darkMode ? 'text-zinc-500 hover:text-white hover:bg-white/[0.08]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
              title="Generate share link"
            >
              <Link2 size={14} />
            </button>
          </div>
        )}
      </>
    );

    const className = `flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl sm:rounded-2xl transition-all duration-300 group relative overflow-hidden w-full
      ${active
        ? darkMode ? 'bg-lime-500/[0.1]' : 'bg-gray-100'
        : darkMode ? 'hover:bg-lime-500/[0.06]' : 'hover:bg-gray-50'
      }`;

    if (to) {
      return (
        <Link to={to} className={className} 
          onClick={() => {
            onClick?.();
            onMobileClose?.();
          }}>
          {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-lime-500 rounded-r-full" style={{ boxShadow: '0 0 12px rgba(34,197,94,0.4)' }} />}
          {content}
        </Link>
      );
    }

    return (
      <button onClick={onClick} className={className}>
        {content}
      </button>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className={`fixed inset-0 backdrop-blur-sm z-40 lg:hidden ${darkMode ? 'bg-black/60' : 'bg-black/30'}`}
          onClick={onMobileClose}
        />
      )}
      <aside
        className={`
        w-[260px] sm:w-[300px]
        h-full flex flex-col shrink-0 z-50
        backdrop-blur-xl border-r
        ${darkMode ? 'bg-[#0e0e11]/95 border-white/[0.06]' : 'bg-white/95 border-gray-200'}
        fixed lg:relative inset-y-0 left-0 transform
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex
      `}
      >
        {/* Lifewood logo at top */}
        <div className="px-5 pt-6 pb-2">
          <div className={`w-full py-2.5 px-3 rounded-2xl flex items-center justify-center ${darkMode ? 'bg-white' : 'bg-white border border-gray-100 shadow-sm'}`}>
            <img src="/Lifewood_Transparent_LOGO.png" alt="Lifewood Logo" className="h-[22px] w-auto" />
          </div>
        </div>

        <div className="px-5 space-y-0.5 mb-5 mt-2">
          <NavItem icon={HomeIcon} label="Home" active={location.pathname === '/' || location.pathname === '/home'} to="/" />

          {/* + Add Category button */}
          <button
            onClick={() => setShowAddCategory(true)}
            className={`flex items-center gap-3 py-2 px-4 rounded-2xl transition-all duration-300 group mt-1 overflow-hidden w-full
              ${darkMode
                ? 'hover:bg-lime-500/[0.06] border border-dashed border-lime-700/20 hover:border-lime-500/30'
                : 'hover:bg-gray-50 border border-dashed border-gray-200 hover:border-emerald-300'
              }`}
          >
            <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${darkMode ? 'group-hover:bg-lime-500/[0.06]' : 'group-hover:bg-gray-100'}`}>
              <FolderPlus size={18} strokeWidth={1.8} className={`transition-colors ${darkMode ? 'text-zinc-500 group-hover:text-lime-400' : 'text-black group-hover:text-emerald-500'}`} />
            </div>
            <div className="flex-1">
              <span className={`text-sm font-medium tracking-tight block w-full truncate text-left transition-colors ${darkMode ? 'text-zinc-600 group-hover:text-zinc-300' : 'text-black group-hover:text-emerald-500'}`}>
                Add Category
              </span>
            </div>
          </button>
        </div>

        {/* Green glow separator before categories */}
        <div className="relative mx-4 mb-2">
          <div className={`h-px w-full ${darkMode ? 'bg-gradient-to-r from-transparent via-lime-500/60 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent'}`} />
          <div className={`absolute inset-0 blur-sm ${darkMode ? 'bg-gradient-to-r from-transparent via-lime-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent'}`} />
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative flex flex-col">
          <div className={`sticky top-0 z-10 pt-1 pb-1.5 mb-1 flex flex-col gap-2 ${darkMode ? 'bg-[#0e0e11]/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}`}>
            <div className="flex items-center justify-between px-9">
              <p className={`text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap ${darkMode ? 'text-zinc-600' : 'text-black'}`}>Categories</p>
              
              <div className="relative">
                <button 
                  onClick={() => setSortOpen(!sortOpen)}
                  className={`p-1 rounded-md transition-all ${darkMode ? 'text-zinc-600 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
                  title="Sort Categories"
                >
                  <ArrowUpDown size={12} />
                </button>
                
                {sortOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                    <div className={`absolute right-0 top-full mt-1 z-50 min-w-[140px] rounded-xl shadow-2xl border overflow-hidden ${darkMode
                      ? 'bg-[#1c1c20] border-white/[0.08] shadow-black/60'
                      : 'bg-white border-gray-200 shadow-gray-300/50'
                      }`}>
                      {([
                        { value: 'az', label: 'A → Z' },
                        { value: 'za', label: 'Z → A' },
                        { value: 'newest', label: 'Newest' },
                      ] as const).map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => { setCategorySortBy(opt.value); setSortOpen(false); }}
                          className={`w-full text-left px-3 py-2 text-[12px] transition-colors flex items-center justify-between ${categorySortBy === opt.value
                            ? darkMode ? 'bg-white/[0.08] text-lime-400 font-medium' : 'bg-emerald-50 text-emerald-700 font-medium'
                            : darkMode ? 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                        >
                          {opt.label}
                          {categorySortBy === opt.value && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Category Search Bar */}
            <div className="px-5">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${darkMode
                ? 'bg-white/[0.03] border border-white/[0.06] focus-within:border-lime-500/30'
                : 'bg-gray-50 border border-gray-100 focus-within:border-emerald-200'
                }`}>
                <Search size={12} className={darkMode ? 'text-zinc-600' : 'text-gray-400'} />
                <input 
                  type="text"
                  placeholder="Search categories..."
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  className={`bg-transparent border-none outline-none text-[12px] w-full ${darkMode ? 'text-zinc-300 placeholder:text-zinc-600' : 'text-gray-700 placeholder:text-gray-400'}`}
                />
                {categorySearchQuery && (
                  <button onClick={() => setCategorySearchQuery('')}>
                    <X size={12} className={darkMode ? 'text-zinc-600 hover:text-zinc-400' : 'text-gray-400 hover:text-gray-600'} />
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="px-5 space-y-0.5 pb-4">
            {/* All categories are now dynamic and come from the database */}
            {filteredAndSortedCategories.map(cat => (
              <NavItem
                key={cat.id}
                icon={getCategoryIcon(cat.icon)}
                label={cat.name}
                color={cat.color}
                active={location.pathname === `/category/${cat.slug}`}
                to={`/category/${cat.slug}`}
                categorySlug={cat.slug}
                cat={cat}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col">

          {/* Green glow separator */}
          <div className="relative mx-4 mb-1">
            <div className={`h-px w-full ${darkMode ? 'bg-gradient-to-r from-transparent via-lime-500/60 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent'}`} />
            <div className={`absolute inset-0 blur-sm ${darkMode ? 'bg-gradient-to-r from-transparent via-lime-500/30 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent'}`} />
          </div>

          <div className="px-4 pb-4 pt-3 space-y-1">

            {/* Sign Out */}
            <button
              onClick={() => setShowSignOutModal(true)}
              className={`flex items-center gap-3 py-2 px-3 rounded-2xl w-full overflow-hidden group ${darkMode ? 'hover:bg-red-500/[0.08]' : 'hover:bg-red-50'}`}
            >
              <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${darkMode ? 'group-hover:bg-red-500/10' : 'group-hover:bg-red-50'}`}>
                <LogOut size={18} strokeWidth={1.8} className={`transition-colors ${darkMode ? 'text-red-400/60 group-hover:text-red-400' : 'text-red-400/50 group-hover:text-red-500'}`} />
              </div>
              <span className={`text-sm font-medium tracking-tight whitespace-nowrap ${darkMode ? 'text-red-400/60 group-hover:text-red-400' : 'text-red-400/50 group-hover:text-red-500'}`}>Sign Out</span>
            </button>

            {/* Dark Mode Toggle */}
            <div style={{ width: '100%', display: 'flex', alignItems: 'center' }} className="py-1">
              <button
                onClick={onToggleDarkMode}
                style={{
                  width: '100%',
                  height: '40px',
                  boxShadow: darkMode ? 'inset 0 3px 6px rgba(0,0,0,0.6)' : 'inset 0 2px 5px rgba(200,80,0,0.4)',
                  position: 'relative', overflow: 'hidden', borderRadius: '20px', flexShrink: 0, border: '1px solid',
                  borderColor: darkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
                  background: darkMode ? '#313338' : 'linear-gradient(to right, #ffd32a, #ff9f1a)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {/* Label text */}
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', width: '200%', transform: darkMode ? 'translateX(0%)' : 'translateX(-50%)', transition: 'transform 0.5s ease' }}>
                  <div style={{ width: '50%', display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '-0.05em', color: 'white', fontFamily: '"Arial Rounded MT Bold", Arial, sans-serif', userSelect: 'none' }}>NIGHTMODE</span>
                  </div>
                  <div style={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '16px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 900, letterSpacing: '-0.05em', color: 'white', fontFamily: '"Arial Rounded MT Bold", Arial, sans-serif', userSelect: 'none' }}>DAYMODE</span>
                  </div>
                </div>
                {/* Toggle knob */}
                <div style={{
                  position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                  width: '34px', height: '34px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'left 0.5s ease',
                  background: darkMode ? '#0f0f11' : 'white',
                  border: darkMode ? '1px solid rgba(0,0,0,0.5)' : '1px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                  left: darkMode ? 'calc(100% - 37px)' : '3px',
                }}>
                  {darkMode ? (
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                      <Moon size={16} fill="#FFD700" color="#FFD700" strokeWidth={0} style={{ transform: 'scaleX(-1)' }} />
                      <Star size={6} fill="#FFD700" color="#FFD700" strokeWidth={0} style={{ position: 'absolute', top: '8px', right: '6px' }} />
                      <Star size={4} fill="#FFD700" color="#FFD700" strokeWidth={0} style={{ position: 'absolute', bottom: '6px', left: '6px' }} />
                    </div>
                  ) : (
                    <Sun size={18} fill="none" stroke="#FFD700" strokeWidth={2.5} />
                  )}
                </div>
              </button>
            </div>

          </div>

          {/* Powered by text at bottom */}
          <div className="flex justify-center items-center mt-2 pb-8 gap-1 text-[10px] font-medium tracking-wide">
            <span className={darkMode ? 'text-zinc-500' : 'text-[#0B543D]'}>Powered by</span>
            <span className={darkMode ? 'text-[#e5a02e]' : 'text-[#F3A530]'}>Lifewood PH</span>
          </div>
        </div>
      </aside>

      <ShareLinkModal
        isOpen={!!shareSlug}
        onClose={() => setShareSlug(null)}
        linkType="category"
        target={shareSlug || ''}
        title={shareModalTitle}
        description="Anyone with this link can view and read these flipbooks."
        darkMode={darkMode}
      />

      <AddCategoryModal
        isOpen={showAddCategory}
        darkMode={darkMode}
        onClose={() => setShowAddCategory(false)}
        onCategoryAdded={(cat) => {
          onCategoryAdded(cat);
          setShowAddCategory(false);
        }}
      />

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
            onClick={() => setShowSignOutModal(false)}
          />

          <div className={`relative w-full max-w-sm rounded-[28px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-200 ${darkMode
            ? 'bg-[#141418]/95 backdrop-blur-3xl border-white/[0.06] shadow-black/60'
            : 'bg-white border-gray-200 shadow-gray-300/50'
            }`}>
            <div className="flex flex-col items-center text-center p-8 pt-10">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'
                }`}>
                <LogOut size={28} className="text-red-400" />
              </div>

              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Sign Out?
              </h3>
              <p className={`text-sm leading-relaxed mb-8 max-w-[260px] ${darkMode ? 'text-zinc-500' : 'text-gray-500'}`}>
                Are you sure you want to sign out of your account?
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={() => { setShowSignOutModal(false); handleSignOut(); }}
                  className="w-full py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold transition-all active:scale-[0.98] shadow-lg shadow-red-500/20"
                >
                  Sign Out
                </button>
                <button
                  onClick={() => setShowSignOutModal(false)}
                  className={`w-full py-3.5 rounded-2xl font-bold transition-all active:scale-[0.98] ${darkMode
                    ? 'bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
