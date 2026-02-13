import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon,
  Library as AllBooksIcon,
  UploadCloud,
  Heart,
  MapPin,
  Building,
  Globe,
  Users,
  Moon,
  Sun,
  Cloud
} from 'lucide-react';

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
  // Sidebar is OPPOSITE color of system - if darkMode is on, sidebar is light
  const sidebarIsLight = darkMode;

  const NavItem = ({ icon: Icon, label, active, to, onClick, color, isDestructive }: any) => {
    const content = (
      <>
        {color && (
          <div className={`w-2 h-2 rounded-full shrink-0`} style={{ backgroundColor: color }} />
        )}
        <Icon size={20} strokeWidth={active ? 2.5 : 2} className={active ? 'text-white' : ''} />
        <span className={`text-[15px] font-semibold tracking-tight ${active ? 'text-white' : ''}`}>
          {label}
        </span>
      </>
    );

    const className = `w-full flex items-center gap-3 px-4 py-3 rounded-[18px] transition-all duration-200 group ${active
      ? sidebarIsLight
        ? 'bg-black text-white shadow-xl shadow-black/20'
        : 'bg-white text-black shadow-xl shadow-white/20'
      : sidebarIsLight
        ? 'hover:bg-gray-200/50 text-[#1D1D1F]'
        : 'hover:bg-gray-800/50 text-gray-200'
      } ${isDestructive ? (sidebarIsLight ? 'text-red-500 hover:bg-red-50' : 'text-red-400 hover:bg-red-900/20') : ''}`;

    if (to) {
      return (
        <Link to={to} className={className} onClick={() => onMobileClose?.()}>
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
      {/* Mobile overlay when sidebar is open */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      <aside className={`
        w-72 h-full flex flex-col shrink-0 p-6 z-50 transition-colors duration-300
        ${sidebarIsLight ? 'bg-[#F5F5F7] border-r border-gray-200' : 'bg-[#131316] border-r border-gray-800'}
        fixed lg:relative inset-y-0 left-0 transform transition-transform duration-300 ease-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} 
        lg:flex
      `}>
        {/* Brand Section with Book Logo */}
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${sidebarIsLight ? 'bg-black' : 'bg-white'}`}>
            <svg
              viewBox="0 0 512 512"
              fill="currentColor"
              className={`w-5 h-5 ${sidebarIsLight ? 'text-white' : 'text-black'}`}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M256 160c.3 0 160-48 160-48v288s-159.7 48-160 48c-.3 0-160-48-160-48V112s159.7 48 160 48z" opacity="0.2" />
              <path d="M256 160v288M416 112v288M96 112v288M256 160c0-.3-80-32-128-48M256 160c0-.3 80-32 128-48"
                stroke="currentColor"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path d="M128 112l32-16 32 16M384 112l-32-16-32 16"
                stroke="currentColor"
                strokeWidth="20"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className={`text-sm font-bold tracking-tight leading-tight ${sidebarIsLight ? 'text-gray-900' : 'text-white'}`}>Lifewood Philippines</span>
            <span className={`text-[10px] uppercase tracking-widest font-bold ${sidebarIsLight ? 'text-gray-400' : 'text-gray-500'}`}>Flipbook</span>
          </div>
        </div>

        {/* Library Section */}
        <div className="space-y-1 mb-8">
          <p className={`px-4 text-[11px] font-black uppercase tracking-[0.1em] mb-3 ${sidebarIsLight ? 'text-gray-400' : 'text-gray-500'}`}>Navigate</p>
          <NavItem
            icon={HomeIcon}
            label="Home"
            active={location.pathname === '/' || location.pathname === '/home'}
            to="/"
          />
          <NavItem
            icon={AllBooksIcon}
            label="All Books"
            active={location.pathname === '/library'}
            to="/library"
          />
          <NavItem
            icon={UploadCloud}
            label="Import PDF"
            active={location.pathname === '/upload'}
            to="/upload"
          />
          <NavItem
            icon={Heart}
            label="Favorites"
            active={location.pathname === '/favorites'}
            to="/favorites"
          />
        </div>

        {/* Categories Section */}
        <div className="space-y-1 mb-10">
          <p className={`px-4 text-[11px] font-black uppercase tracking-[0.1em] mb-3 ${sidebarIsLight ? 'text-gray-400' : 'text-gray-500'}`}>Categories</p>
          <NavItem
            icon={MapPin}
            label="Philippines"
            color="#3B82F6"
            active={location.pathname === '/philippines'}
            to="/philippines"
          />
          <NavItem
            icon={Building}
            label="Internal"
            color="#A855F7"
            active={location.pathname === '/internal'}
            to="/internal"
          />
          <NavItem
            icon={Globe}
            label="International"
            color="#22C55E"
            active={location.pathname === '/international'}
            to="/international"
          />
          <NavItem
            icon={Users}
            label="PH Interns"
            color="#F97316"
            active={location.pathname === '/ph-interns'}
            to="/ph-interns"
          />
          <NavItem
            icon={MapPin}
            label="Deseret"
            color="#EAB308"
            active={location.pathname === '/deseret'}
            to="/deseret"
          />
          <NavItem
            icon={HomeIcon}
            label="Angelhost"
            color="#EC4899"
            active={location.pathname === '/angelhost'}
            to="/angelhost"
          />
        </div>

        {/* Footer Actions */}
        <div className={`mt-auto space-y-1 pt-6 border-t ${sidebarIsLight ? 'border-gray-200/60' : 'border-gray-700'}`}>
          <NavItem
            icon={darkMode ? Sun : Moon}
            label={darkMode ? "Light Mode" : "Dark Mode"}
            onClick={onToggleDarkMode}
          />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;