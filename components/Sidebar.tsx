import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Library as AllBooksIcon,
  UploadCloud,
  Heart,
  MapPin,
  Building,
  Globe,
  GraduationCap,
  BookOpen,
  Hotel,
  Moon,
  Sun,
  Link2
} from 'lucide-react';
import ShareLinkModal from './ShareLinkModal';

export type LibraryFilter = 'all' | 'favorites' | 'philippines' | 'internal' | 'international' | 'ph_interns' | 'deseret' | 'angelhost';

interface SidebarProps {
  currentView: 'home' | 'library' | 'upload' | 'reader';
  currentFilter: LibraryFilter;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, currentFilter, darkMode, onToggleDarkMode, isMobileOpen, onMobileClose }) => {
  const location = useLocation();

  const [shareModalUrl, setShareModalUrl] = useState<string | null>(null);
  const [shareModalTitle, setShareModalTitle] = useState('');

  const handleShareClick = (e: React.MouseEvent, shareUrl: string, label: string) => {
    e.preventDefault();
    e.stopPropagation();
    setShareModalUrl(shareUrl);
    setShareModalTitle(`Share ${label} Flipbooks`);
  };

  const NavItem = ({ icon: Icon, label, active, to, onClick, color, shareUrl }: any) => {
    const content = (
      <>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
          active
            ? darkMode ? 'bg-white/10 shadow-lg' : 'bg-emerald-50 shadow-lg'
            : darkMode ? 'bg-transparent group-hover:bg-white/[0.04]' : 'bg-transparent group-hover:bg-gray-100'
        }`}>
          {color ? (
            <Icon
              size={20}
              strokeWidth={active ? 2.2 : 1.8}
              style={{ color: color, opacity: active ? 1 : 0.65, filter: active ? `drop-shadow(0 0 6px ${color})` : 'none' }}
              className="transition-all duration-200"
            />
          ) : (
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className={active ? (darkMode ? 'text-white' : 'text-gray-900') : (darkMode ? 'text-zinc-500' : 'text-gray-500')} />
          )}
        </div>
        <span className={`text-sm font-medium tracking-tight transition-colors flex-1 ${
          active 
            ? darkMode ? 'text-white' : 'text-gray-900'
            : darkMode ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-gray-500 group-hover:text-gray-900'
        }`}>
          {label}
        </span>
        {shareUrl && (
          <button
            onClick={(e) => handleShareClick(e, shareUrl, label)}
            className={`p-1.5 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 ${
              darkMode ? 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.06]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
            }`}
            title="Share category"
          >
            <Link2 size={14} />
          </button>
        )}
      </>
    );

    const className = `w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 group relative ${
      active
        ? darkMode ? 'bg-white/[0.07]' : 'bg-gray-100'
        : darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'
    }`;

    if (to) {
      return (
        <Link to={to} className={className} onClick={() => onMobileClose?.()}>
          {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-emerald-500 rounded-r-full" style={{ boxShadow: '0 0 12px rgba(34,197,94,0.4)' }} />}
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
        w-[300px] h-full flex flex-col shrink-0 z-50 transition-all duration-300
        backdrop-blur-xl border-r
        ${darkMode ? 'bg-[#0c0c0e]/90 border-white/[0.04]' : 'bg-white/95 border-gray-200'}
        fixed lg:relative inset-y-0 left-0 transform
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3.5 px-7 pt-8 pb-9">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center">
            <svg viewBox="0 0 512 512" fill="currentColor" className="w-6 h-6 text-emerald-400" xmlns="http://www.w3.org/2000/svg">
              <path d="M256 160c.3 0 160-48 160-48v288s-159.7 48-160 48c-.3 0-160-48-160-48V112s159.7 48 160 48z" opacity="0.2" />
              <path d="M256 160v288M416 112v288M96 112v288M256 160c0-.3-80-32-128-48M256 160c0-.3 80-32 128-48"
                stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className={`text-[15px] font-semibold tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lifewood Philippines</span>
            <span className={`text-[11px] uppercase tracking-[0.15em] font-medium ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Digital Flipbook</span>
          </div>
        </div>

        {/* Navigate */}
        <div className="px-5 space-y-1 mb-7">
          <p className={`px-4 text-[11px] font-semibold uppercase tracking-[0.15em] mb-3 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Navigate</p>
          <NavItem icon={HomeIcon} label="Home" active={location.pathname === '/' || location.pathname === '/home'} to="/" />
          <NavItem icon={AllBooksIcon} label="All Books" active={location.pathname === '/library'} to="/library" />
          <NavItem icon={UploadCloud} label="Import PDF" active={location.pathname === '/upload'} to="/upload" />
          <NavItem icon={Heart} label="Favorites" active={location.pathname === '/favorites'} to="/favorites" />
        </div>

        {/* Categories */}
        <div className="px-5 space-y-1 mb-7">
          <p className={`px-4 text-[11px] font-semibold uppercase tracking-[0.15em] mb-3 ${darkMode ? 'text-zinc-600' : 'text-gray-400'}`}>Categories</p>
          <NavItem icon={MapPin} label="Philippines" color="#3B82F6" active={location.pathname === '/philippines'} to="/philippines" shareUrl={`${window.location.origin}/share/philippines`} />
          <NavItem icon={Building} label="Internal" color="#A855F7" active={location.pathname === '/internal'} to="/internal" shareUrl={`${window.location.origin}/share/internal`} />
          <NavItem icon={Globe} label="International" color="#22C55E" active={location.pathname === '/international'} to="/international" shareUrl={`${window.location.origin}/share/international`} />
          <NavItem icon={GraduationCap} label="PH Interns" color="#F97316" active={location.pathname === '/ph-interns'} to="/ph-interns" shareUrl={`${window.location.origin}/share/ph-interns`} />
          <NavItem icon={BookOpen} label="Deseret" color="#EAB308" active={location.pathname === '/deseret'} to="/deseret" shareUrl={`${window.location.origin}/share/deseret`} />
          <NavItem icon={Hotel} label="Angelhost" color="#EC4899" active={location.pathname === '/angelhost'} to="/angelhost" shareUrl={`${window.location.origin}/share/angelhost`} />
        </div>

        {/* Footer */}
        <div className={`mt-auto px-5 pb-7 pt-5 border-t ${darkMode ? 'border-white/[0.04]' : 'border-gray-200'}`}>
          <NavItem icon={darkMode ? Sun : Moon} label={darkMode ? "Light Mode" : "Dark Mode"} onClick={onToggleDarkMode} />
        </div>
      </aside>

      <ShareLinkModal
        isOpen={!!shareModalUrl}
        onClose={() => setShareModalUrl(null)}
        url={shareModalUrl || ''}
        title={shareModalTitle}
        description="Anyone with this link can view and read these flipbooks."
        darkMode={darkMode}
      />
    </>
  );
};

export default Sidebar;
