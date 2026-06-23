import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@store/useAuthStore';
import { getInitials } from '@utils/avatarHelper';
import toast from 'react-hot-toast';
import { NotificationDropdown } from './NotificationDropdown';

// ── Design tokens ──────────────────────────────────────────────
const C = {
  primary:      '#1E707D',
  primaryHov:   '#278A99',
  primaryDark:  '#165964',
  primaryLight: '#D7EEF1',
  accentGlow:   '#4EC6D8',
  surface:      '#FFFFFF',
  bg:           '#F8FAFC',
  border:       '#D9E7E4',
  borderLight:  '#EBF5F7',
  textPri:      '#1F2937',
  textSec:      '#6B7280',
  textMuted:    '#9CA3AF',
}

const AVATAR_BG = `linear-gradient(135deg, ${C.primaryHov} 0%, ${C.primary} 55%, ${C.primaryDark} 100%)`

const TopNavBar = () => {
  const fullName = useAuthStore((state) => state.fullName);
  const logout   = useAuthStore((state) => state.logout);
  const initials = getInitials(fullName);

  const [menuOpen, setMenuOpen]     = useState(false);
  const [avatarActive, setAvatarActive] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
        setAvatarActive(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    setAvatarActive(false);
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
  };

  const handleProfileClick = () => {
    setMenuOpen(false);
    setAvatarActive(false);
    navigate('/profile');
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    setAvatarActive(!menuOpen);
  };

  return (
    <header style={{
      position:       'fixed',
      top:            0,
      right:          0,
      left:           '304px',   /* aligns with main content (280 + 12 + 12) */
      height:         '64px',
      background:     C.surface,
      borderBottom:   `1px solid ${C.border}`,
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 32px',
      zIndex:         50,
    }}>

      {/* Left — brand label */}
      <div style={{
        fontSize:    '18px',
        fontWeight:  800,
        color:       C.primary,
        letterSpacing: '-0.03em',
      }}>
        DevTrack AI
      </div>

      {/* Right — search + notifications + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <span
            className="material-symbols-outlined"
            style={{
              position:  'absolute',
              left:      '12px',
              top:       '50%',
              transform: 'translateY(-50%)',
              fontSize:  '18px',
              color:     C.textMuted,
              pointerEvents: 'none',
            }}
          >
            search
          </span>
          <input
            type="text"
            placeholder="Search..."
            style={{
              paddingLeft:   '38px',
              paddingRight:  '16px',
              paddingTop:    '8px',
              paddingBottom: '8px',
              background:    C.bg,
              border:        `1px solid ${C.border}`,
              borderRadius:  '20px',
              fontSize:      '13px',
              color:         C.textPri,
              width:         '240px',
              outline:       'none',
              transition:    'border-color 200ms ease, box-shadow 200ms ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = C.primary
              e.target.style.boxShadow   = `0 0 0 3px ${C.primaryLight}`
            }}
            onBlur={(e) => {
              e.target.style.borderColor = C.border
              e.target.style.boxShadow   = 'none'
            }}
          />
        </div>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Avatar + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={toggleMenu}
            style={{
              width:        '36px',
              height:       '36px',
              borderRadius: '50%',
              background:   AVATAR_BG,
              border:       `2px solid ${avatarActive ? 'rgba(30,112,125,0.55)' : 'transparent'}`,
              color:        '#fff',
              fontSize:     '13px',
              fontWeight:   700,
              cursor:       'pointer',
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              boxShadow:    `0 2px 10px rgba(30,112,125,0.30)`,
              transition:   'border-color 200ms ease, box-shadow 200ms ease',
              outline:      'none',
            }}
            onMouseEnter={(e) => {
              if (!avatarActive) e.currentTarget.style.boxShadow = `0 4px 16px rgba(30,112,125,0.45)`
            }}
            onMouseLeave={(e) => {
              if (!avatarActive) e.currentTarget.style.boxShadow = `0 2px 10px rgba(30,112,125,0.30)`
            }}
          >
            {initials}
          </button>

          {menuOpen && (
            <div style={{
              position:    'absolute',
              right:        0,
              top:          'calc(100% + 8px)',
              width:        '220px',
              background:   C.surface,
              border:       `1px solid ${C.border}`,
              borderRadius: '16px',
              boxShadow:    `0 20px 50px rgba(30,112,125,0.14)`,
              zIndex:       60,
              overflow:     'hidden',
              animation:    'fadeIn 0.15s ease-out',
            }}>
              {/* Profile header */}
              <div style={{
                padding:      '14px 16px',
                borderBottom: `1px solid ${C.borderLight}`,
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
              }}>
                <div style={{
                  width:         '36px',
                  height:        '36px',
                  borderRadius:  '50%',
                  background:    AVATAR_BG,
                  display:       'flex',
                  alignItems:    'center',
                  justifyContent:'center',
                  color:         '#fff',
                  fontWeight:    700,
                  fontSize:      '13px',
                  flexShrink:    0,
                  boxShadow:     `0 4px 12px rgba(30,112,125,0.30)`,
                }}>
                  {initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize:     '13px',
                    fontWeight:   600,
                    color:        C.textPri,
                    overflow:     'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace:   'nowrap',
                  }}>
                    {fullName || 'User'}
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px' }}>
                <DropdownItem
                  icon="account_circle"
                  label="My Profile"
                  onClick={handleProfileClick}
                />
                <div style={{ height: '1px', background: C.borderLight, margin: '4px 0' }} />
                <DropdownItem
                  icon="logout"
                  label="Logout"
                  onClick={handleLogout}
                  danger
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

// ── Dropdown menu item ─────────────────────────────────────────
const DropdownItem = ({ icon, label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    style={{
      display:       'flex',
      alignItems:    'center',
      gap:           '10px',
      width:         '100%',
      padding:       '9px 12px',
      borderRadius:  '10px',
      background:    'transparent',
      border:        'none',
      color:         danger ? '#EF4444' : '#374151',
      fontSize:      '13px',
      fontWeight:    500,
      cursor:        'pointer',
      textAlign:     'left',
      transition:    'background 150ms ease, color 150ms ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = danger ? '#FEF2F2' : '#D7EEF1'
      e.currentTarget.style.color      = danger ? '#EF4444' : '#1E707D'
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = 'transparent'
      e.currentTarget.style.color      = danger ? '#EF4444' : '#374151'
    }}
  >
    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>
    {label}
  </button>
)

export default TopNavBar;
