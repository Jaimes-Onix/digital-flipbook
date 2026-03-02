import React, { useState, useCallback } from 'react';
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
  Trash2
} from 'lucide-react';
import ShareLinkModal from './ShareLinkModal';
import AddCategoryModal from './AddCategoryModal';
import { supabase } from '../src/lib/supabase';
import type { CustomCategory } from '../types';

export type LibraryFilter = string;

interface SidebarProps {
  currentView: 'home' | 'library' | 'upload' | 'convert-pptx' | 'reader';
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
              size={20}
              strokeWidth={active ? 2.2 : 1.8}
              style={{ color: color, opacity: active ? 1 : 0.65, filter: active ? `drop-shadow(0 0 6px ${color})` : 'none' }}
              className="transition-all duration-200"
            />
          ) : (
            <Icon size={18} strokeWidth={active ? 2.2 : 1.8} className={active ? (darkMode ? 'text-lime-400' : 'text-gray-900') : (darkMode ? 'text-zinc-400 group-hover:text-zinc-200' : 'text-gray-500')} />
          )}
        </div>
        <div className="flex-1 overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[200px] lg:group-hover/sidebar:opacity-100">
          <span className={`text-sm font-medium tracking-tight text-left block w-[150px] truncate ${active
            ? darkMode ? 'text-white' : 'text-gray-900'
            : darkMode ? 'text-zinc-400 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'
            }`}>
            {label}
          </span>
        </div>

        {categorySlug && (
          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity lg:hidden lg:group-hover/sidebar:flex shrink-0">
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

    const className = `flex items-center gap-3 py-2 rounded-2xl transition-all duration-300 group relative overflow-hidden
      w-[calc(100vw-40px)] sm:w-[260px] lg:w-12 lg:group-hover/sidebar:w-[260px]
      px-4 lg:px-0 lg:group-hover/sidebar:px-4
      justify-start lg:justify-center lg:group-hover/sidebar:justify-start
      ${active
        ? darkMode ? 'bg-lime-500/[0.1]' : 'bg-gray-100'
        : darkMode ? 'hover:bg-lime-500/[0.06]' : 'hover:bg-gray-50'
      }`;

    if (to) {
      return (
        <Link to={to} className={className} onClick={() => onMobileClose?.()}>
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
      <aside className={`
        group/sidebar lg:w-[88px] lg:hover:w-[300px] w-[300px]
        h-full flex flex-col shrink-0 z-50 transition-all duration-300
        backdrop-blur-xl border-r
        ${darkMode ? 'bg-[#0e0e11]/95 border-white/[0.06]' : 'bg-white/95 border-gray-200'}
        fixed lg:relative inset-y-0 left-0 transform
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3.5 px-7 lg:px-[22px] lg:group-hover/sidebar:px-7 pt-6 pb-6 overflow-hidden transition-all duration-300">
          <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gradient-to-br from-lime-500/25 to-lime-600/10 border border-lime-500/25' : 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/20'}`}>
            <svg viewBox="0 0 512 512" fill="currentColor" className={`w-6 h-6 ${darkMode ? 'text-lime-400' : 'text-emerald-500'}`} xmlns="http://www.w3.org/2000/svg">
              <path d="M256 160c.3 0 160-48 160-48v288s-159.7 48-160 48c-.3 0-160-48-160-48V112s159.7 48 160 48z" opacity="0.2" />
              <path d="M256 160v288M416 112v288M96 112v288M256 160c0-.3-80-32-128-48M256 160c0-.3 80-32 128-48"
                stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="flex flex-col whitespace-nowrap overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[200px] lg:group-hover/sidebar:opacity-100">
            <span className={`text-[15px] font-semibold tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lifewood Philippines</span>
            <span className={`text-[11px] uppercase tracking-[0.15em] font-medium ${darkMode ? 'text-zinc-500' : 'text-gray-400'}`}>Digital Flipbook</span>
          </div>
        </div>

        <div className="px-5 space-y-0.5 mb-5 mt-2">
          <div className="flex items-center overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[200px] lg:group-hover/sidebar:opacity-100 mb-2">
            <p className={`px-4 text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Navigate</p>
          </div>
          <NavItem icon={HomeIcon} label="Home" active={location.pathname === '/' || location.pathname === '/home'} to="/" />
          <NavItem icon={AllBooksIcon} label="All Books" active={location.pathname === '/library'} to="/library" />
          <NavItem icon={Presentation} label="PPTX to PDF" active={location.pathname === '/convert-pptx'} to="/convert-pptx" />
          <NavItem icon={UploadCloud} label="Import PDF" active={location.pathname === '/upload'} to="/upload" />

          {/* + Add Category button */}
          <button
            onClick={() => setShowAddCategory(true)}
            className={`flex items-center gap-3 py-2 rounded-2xl transition-all duration-300 group mt-1 overflow-hidden
              w-[calc(100vw-40px)] sm:w-[260px] lg:w-12 lg:group-hover/sidebar:w-[260px]
              px-4 lg:px-0 lg:group-hover/sidebar:px-4
              justify-start lg:justify-center lg:group-hover/sidebar:justify-start
              ${darkMode
                ? 'hover:bg-lime-500/[0.06] border border-dashed border-lime-700/20 hover:border-lime-500/30'
                : 'hover:bg-gray-50 border border-dashed border-gray-200 hover:border-emerald-300'
              }`}
          >
            <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${darkMode ? 'group-hover:bg-lime-500/[0.06]' : 'group-hover:bg-gray-100'
              }`}>
              <FolderPlus size={18} strokeWidth={1.8} className={`transition-colors ${darkMode ? 'text-zinc-500 group-hover:text-lime-400' : 'text-gray-400 group-hover:text-emerald-500'}`} />
            </div>
            <div className="flex-1 overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[200px] lg:group-hover/sidebar:opacity-100">
              <span className={`text-sm font-medium tracking-tight block w-[150px] truncate text-left transition-colors ${darkMode ? 'text-zinc-600 group-hover:text-zinc-300' : 'text-gray-400 group-hover:text-emerald-500'
                }`}>
                Add Category
              </span>
            </div>
          </button>
        </div>

        {/* Categories */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative flex flex-col">
          <div className={`sticky top-0 z-10 pt-1 pb-1.5 mb-1 ${darkMode ? 'bg-[#0e0e11]/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'} transition-all duration-300`}>
            <div className="overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[200px] lg:group-hover/sidebar:opacity-100">
              <p className={`px-9 text-[11px] font-semibold uppercase tracking-[0.15em] whitespace-nowrap ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Categories</p>
            </div>
          </div>
          <div className="px-5 space-y-0.5 pb-4">
            {/* All categories are now dynamic and come from the database */}
            {customCategories.map(cat => (
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
        <div className={`px-5 pb-5 pt-4 border-t space-y-0.5 ${darkMode ? 'border-white/[0.06]' : 'border-gray-200'}`}>
          <button
            onClick={() => setShowSignOutModal(true)}
            className={`flex items-center gap-3 py-2 rounded-2xl transition-all duration-300 overflow-hidden group
              w-[calc(100vw-40px)] sm:w-[260px] lg:w-12 lg:group-hover/sidebar:w-[260px]
              px-4 lg:px-0 lg:group-hover/sidebar:px-4
              justify-start lg:justify-center lg:group-hover/sidebar:justify-start
              ${darkMode ? 'hover:bg-red-500/[0.08]' : 'hover:bg-red-50'
              }`}
          >
            <div className={`w-8 h-8 shrink-0 rounded-xl flex items-center justify-center transition-all duration-200 ${darkMode ? 'group-hover:bg-red-500/10' : 'group-hover:bg-red-100'
              }`}>
              <LogOut size={18} strokeWidth={1.8} className={`transition-colors ${darkMode ? 'text-red-400/60 group-hover:text-red-400' : 'text-red-400/60 group-hover:text-red-500'}`} />
            </div>
            <div className="flex-1 overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[200px] lg:group-hover/sidebar:opacity-100">
              <span className={`text-sm font-medium tracking-tight block w-[150px] truncate text-left transition-colors ${darkMode ? 'text-red-400/60 group-hover:text-red-400' : 'text-red-400/60 group-hover:text-red-500'
                }`}>
                Sign Out
              </span>
            </div>
          </button>
          <NavItem icon={darkMode ? Sun : Moon} label={darkMode ? "Light Mode" : "Dark Mode"} onClick={onToggleDarkMode} />

          {/* Lifewood Branding Footer */}
          <div className="mt-3 overflow-hidden transition-all duration-300 lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[260px] lg:group-hover/sidebar:opacity-100">
            <div className="w-[260px]">
              <div className={`w-full py-3 px-3 rounded-2xl flex items-center justify-center transition-colors ${darkMode ? 'bg-white border border-white' : 'bg-white border border-gray-100 shadow-sm'}`}>
                <img src="/Lifewood_Transparent_LOGO.png" alt="Lifewood Exact Logo" className={`h-[24px] w-auto ${darkMode ? 'opacity-90' : ''}`} />
              </div>
              <div className="flex justify-center items-center mt-2.5 gap-1 text-[11px] font-medium tracking-wide">
                <span className={darkMode ? 'text-zinc-500' : 'text-[#0B543D]'}>Powered by</span>
                <span className={darkMode ? 'text-[#e5a02e]' : 'text-[#F3A530]'}>Lifewood PH</span>
              </div>
            </div>
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
