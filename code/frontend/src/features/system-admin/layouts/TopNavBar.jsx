import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@store/useAuthStore';
import { getInitials } from '@utils/avatarHelper';
import toast from 'react-hot-toast';

const TopNavBar = () => {
  const fullName = useAuthStore((state) => state.fullName);
  const logout = useAuthStore((state) => state.logout);
  const initials = getInitials(fullName);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

  const handleProfileClick = () => {
    setMenuOpen(false);
    navigate('/profile');
  };

  return (
    <header className="fixed top-0 left-sidebar_width right-0 h-topbar_height bg-surface-container-lowest border-b border-outline-variant z-40 flex items-center justify-between px-margin_desktop">
      <div className="relative w-96">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
        <input 
          className="w-full bg-surface-container-low border-none rounded-lg pl-10 py-2 font-body-md text-sm focus:ring-1 focus:ring-primary focus:outline-none" 
          placeholder="Search users, projects, mentors, resources..." 
          type="text" 
        />
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-body-md font-semibold text-on-surface">Admin Console</div>
            <div className="text-[10px] font-label-md text-on-surface-variant uppercase">Online</div>
          </div>
          
          {/* Avatar động với dropdown menu giống Leader */}
          <div className="relative" ref={menuRef}>
            <div 
              onClick={() => setMenuOpen(!menuOpen)}
              className="w-10 h-10 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-sm shadow-inner shrink-0 cursor-pointer border border-outline-variant/40 hover:opacity-90 transition-opacity"
            >
              {initials}
            </div>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-lowest border border-outline-variant/60 shadow-lg py-1.5 z-[60] animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-outline-variant/40">
                  <p className="font-semibold text-sm text-on-surface truncate">{fullName || 'Admin User'}</p>
                </div>
                <button
                  onClick={handleProfileClick}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-high transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">account_circle</span>
                  My Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-left text-sm text-error hover:bg-error-container/20 hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
