import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Link2,
  LogOut
} from 'lucide-react';
import ShareLinkModal from './ShareLinkModal';
import { supabase } from '../src/lib/supabase';

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
  const navigate = useNavigate();

  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [shareModalTitle, setShareModalTitle] = useState('');
  const [showSignOutModal, setShowSignOutModal] = useState(false);

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



  const NavItem = ({ icon: Icon, label, active, to, onClick, color, categorySlug }: any) => {
    const content = (
      <>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${active
          ? darkMode ? 'bg-emerald-500/15 shadow-lg shadow-emerald-800/20' : 'bg-emerald-50 shadow-lg'
          : darkMode ? 'bg-transparent group-hover:bg-emerald-500/[0.06]' : 'bg-transparent group-hover:bg-gray-100'
          }`}>
          {color ? (
            <Icon
              size={20}
              strokeWidth={active ? 2.2 : 1.8}
              style={{ color: color, opacity: active ? 1 : 0.65, filter: active ? `drop-shadow(0 0 6px ${color})` : 'none' }}
              className="transition-all duration-200"
            />
          ) : (
            <Icon size={20} strokeWidth={active ? 2.2 : 1.8} className={active ? (darkMode ? 'text-emerald-300' : 'text-gray-900') : (darkMode ? 'text-emerald-400/50 group-hover:text-emerald-300' : 'text-gray-500')} />
          )}
        </div>
        <span className={`text-sm font-medium tracking-tight transition-colors flex-1 ${active
          ? darkMode ? 'text-white' : 'text-gray-900'
          : darkMode ? 'text-emerald-300/50 group-hover:text-emerald-200' : 'text-gray-500 group-hover:text-gray-900'
          }`}>
          {label}
        </span>
        {categorySlug && (
          <button
            onClick={(e) => handleShareClick(e, categorySlug, label)}
            className={`p-1.5 rounded-lg transition-all shrink-0 opacity-0 group-hover:opacity-100 ${darkMode ? 'text-emerald-400/40 hover:text-emerald-300 hover:bg-emerald-500/[0.08]' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            title="Generate share link"
          >
            <Link2 size={14} />
          </button>
        )}
      </>
    );

    const className = `w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 group relative ${active
      ? darkMode ? 'bg-emerald-500/[0.1]' : 'bg-gray-100'
      : darkMode ? 'hover:bg-emerald-500/[0.06]' : 'hover:bg-gray-50'
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
        ${darkMode ? 'bg-[#10241e]/95 border-emerald-700/15' : 'bg-white/95 border-gray-200'}
        fixed lg:relative inset-y-0 left-0 transform
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex
      `}>
        {/* Brand */}
        <div className="flex items-center gap-3.5 px-7 pt-8 pb-9">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/25 to-emerald-600/10 border border-emerald-500/25 flex items-center justify-center">
            <svg viewBox="0 0 512 512" fill="currentColor" className="w-6 h-6 text-emerald-400" xmlns="http://www.w3.org/2000/svg">
              <path d="M256 160c.3 0 160-48 160-48v288s-159.7 48-160 48c-.3 0-160-48-160-48V112s159.7 48 160 48z" opacity="0.2" />
              <path d="M256 160v288M416 112v288M96 112v288M256 160c0-.3-80-32-128-48M256 160c0-.3 80-32 128-48"
                stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className={`text-[15px] font-semibold tracking-tight leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>Lifewood Philippines</span>
            <span className={`text-[11px] uppercase tracking-[0.15em] font-medium ${darkMode ? 'text-emerald-400/50' : 'text-gray-400'}`}>Digital Flipbook</span>
          </div>
        </div>

        {/* Navigate */}
        <div className="px-5 space-y-1 mb-7">
          <p className={`px-4 text-[11px] font-semibold uppercase tracking-[0.15em] mb-3 ${darkMode ? 'text-emerald-400/40' : 'text-gray-400'}`}>Navigate</p>
          <NavItem icon={HomeIcon} label="Home" active={location.pathname === '/' || location.pathname === '/home'} to="/" />
          <NavItem icon={AllBooksIcon} label="All Books" active={location.pathname === '/library'} to="/library" />
          <NavItem icon={UploadCloud} label="Import PDF" active={location.pathname === '/upload'} to="/upload" />
          <NavItem icon={Heart} label="Favorites" active={location.pathname === '/favorites'} to="/favorites" />
        </div>

        {/* Categories */}
        <div className="px-5 space-y-1 mb-7">
          <p className={`px-4 text-[11px] font-semibold uppercase tracking-[0.15em] mb-3 ${darkMode ? 'text-emerald-400/40' : 'text-gray-400'}`}>Categories</p>
          <NavItem icon={MapPin} label="Philippines" color="#3B82F6" active={location.pathname === '/philippines'} to="/philippines" categorySlug="philippines" />
          <NavItem icon={Building} label="Internal" color="#A855F7" active={location.pathname === '/internal'} to="/internal" categorySlug="internal" />
          <NavItem icon={Globe} label="International" color="#22C55E" active={location.pathname === '/international'} to="/international" categorySlug="international" />
          <NavItem icon={GraduationCap} label="PH Interns" color="#F97316" active={location.pathname === '/ph-interns'} to="/ph-interns" categorySlug="ph-interns" />
          <NavItem icon={BookOpen} label="Deseret" color="#EAB308" active={location.pathname === '/deseret'} to="/deseret" categorySlug="deseret" />
          <NavItem icon={Hotel} label="Angelhost" color="#EC4899" active={location.pathname === '/angelhost'} to="/angelhost" categorySlug="angelhost" />
        </div>

        {/* Footer */}
        <div className={`mt-auto px-5 pb-7 pt-5 border-t space-y-1 ${darkMode ? 'border-emerald-700/15' : 'border-gray-200'}`}>
          <button
            onClick={() => setShowSignOutModal(true)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-200 group ${darkMode ? 'hover:bg-red-500/[0.08]' : 'hover:bg-red-50'
              }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${darkMode ? 'group-hover:bg-red-500/10' : 'group-hover:bg-red-100'
              }`}>
              <LogOut size={20} strokeWidth={1.8} className={`transition-colors ${darkMode ? 'text-red-400/60 group-hover:text-red-400' : 'text-red-400/60 group-hover:text-red-500'}`} />
            </div>
            <span className={`text-sm font-medium tracking-tight transition-colors ${darkMode ? 'text-red-400/60 group-hover:text-red-400' : 'text-red-400/60 group-hover:text-red-500'
              }`}>
              Sign Out
            </span>
          </button>
          <NavItem icon={darkMode ? Sun : Moon} label={darkMode ? "Light Mode" : "Dark Mode"} onClick={onToggleDarkMode} />
        </div>
      </aside>

      <ShareLinkModal
        isOpen={!!shareSlug}
        onClose={() => setShareSlug(null)}
        url={shareSlug ? `${window.location.origin}/share/category/${shareSlug}` : ''}
        title={shareModalTitle}
        description="Anyone with this link can view and read these flipbooks."
        darkMode={darkMode}
      />

      {/* Sign Out Confirmation Modal */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className={`absolute inset-0 backdrop-blur-md ${darkMode ? 'bg-black/60' : 'bg-black/25'}`}
            onClick={() => setShowSignOutModal(false)}
          />

          <div className={`relative w-full max-w-sm rounded-[28px] shadow-2xl border overflow-hidden animate-in zoom-in-95 fade-in duration-200 ${darkMode
            ? 'bg-[#122a22]/95 backdrop-blur-3xl border-emerald-700/15 shadow-black/60'
            : 'bg-white border-gray-200 shadow-gray-300/50'
            }`}>
            <div className="flex flex-col items-center text-center p-8 pt-10">
              {/* Icon */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 ${darkMode ? 'bg-red-500/10' : 'bg-red-50'
                }`}>
                <LogOut size={28} className="text-red-400" />
              </div>

              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Sign Out?
              </h3>
              <p className={`text-sm leading-relaxed mb-8 max-w-[260px] ${darkMode ? 'text-emerald-300/40' : 'text-gray-500'}`}>
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
                    ? 'bg-emerald-500/[0.06] hover:bg-emerald-500/[0.1] text-emerald-300/70'
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
