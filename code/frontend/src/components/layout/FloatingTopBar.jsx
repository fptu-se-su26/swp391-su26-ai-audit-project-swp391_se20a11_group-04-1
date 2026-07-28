import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import { getInitials } from '@utils/avatarHelper'
import toast from 'react-hot-toast'
import { NotificationDropdown } from './NotificationDropdown'
import axiosClient from '@/api/axiosConfig'

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const FloatingTopBar = () => {
  const fullName = useAuthStore((s) => s.fullName)
  const logout   = useAuthStore((s) => s.logout)
  const initials = getInitials(fullName)
  const navigate = useNavigate()
  const location = useLocation()

  // Lấy projectId từ URL (vd: /projects/5/... → 5)
  const getProjectIdFromUrl = () => {
    const match = location.pathname.match(/\/projects?\/([0-9]+)/)
    return match ? match[1] : null
  }

  const [menuOpen, setMenuOpen]   = useState(false)
  const [avatarHov, setAvatarHov] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
        setSettingsOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
    setSettingsOpen(false)
    logout()
    toast.success('Đăng xuất thành công!')
    navigate('/login')
  }

  return (
    /* Floating pill — top-right, notification + avatar only */
    <div style={{
      position:      'fixed',
      top:           14,
      right:         20,
      zIndex:        50,
      display:       'flex',
      alignItems:    'center',
      gap:           6,
      padding:       '5px 8px',
      background:    'rgba(255,255,255,0.82)',
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border:        '1px solid rgba(255,255,255,0.70)',
      borderRadius:  40,
      boxShadow:     '0 4px 20px rgba(30,112,125,0.10), 0 1px 0 rgba(255,255,255,0.90) inset, 0 6px 24px rgba(0,0,0,0.06)',
    }}>

      {/* Notification bell */}
      <NotificationDropdown />

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: 'rgba(217,231,228,0.80)', flexShrink: 0 }} />

      {/* Avatar + dropdown */}
      <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setMenuOpen(o => !o)}
          onMouseEnter={() => setAvatarHov(true)}
          onMouseLeave={() => setAvatarHov(false)}
          title={fullName}
          style={{
            width:         34,
            height:        34,
            borderRadius:  '50%',
            background:    'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)',
            border:        `2px solid ${menuOpen ? 'rgba(30,112,125,0.55)' : 'transparent'}`,
            color:         '#fff',
            fontSize:      12,
            fontWeight:    700,
            cursor:        'pointer',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            boxShadow:     avatarHov || menuOpen
              ? '0 4px 16px rgba(30,112,125,0.40)'
              : '0 2px 8px rgba(30,112,125,0.25)',
            transition:    `box-shadow 200ms ${EASE}, border-color 200ms ${EASE}, transform 200ms ${EASE}`,
            transform:     avatarHov ? 'scale(1.06)' : 'scale(1)',
            outline:       'none',
            fontFamily:    'Inter,-apple-system,sans-serif',
          }}
        >
          {initials}
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div style={{
            position:     'absolute',
            right:        0,
            top:          'calc(100% + 10px)',
            width:        210,
            background:   'rgba(255,255,255,0.97)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border:       '1px solid rgba(217,231,228,0.90)',
            borderRadius: 16,
            boxShadow:    '0 16px 48px rgba(30,112,125,0.14), 0 4px 12px rgba(0,0,0,0.06)',
            overflow:     'hidden',
            animation:    'fadeIn 0.12s ease-out',
            zIndex:       60,
          }}>
            {/* Profile header */}
            <div style={{
              display:      'flex',
              alignItems:   'center',
              gap:          10,
              padding:      '12px 14px',
              borderBottom: '1px solid rgba(235,245,247,0.90)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0,
                boxShadow: '0 3px 10px rgba(30,112,125,0.30)',
              }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#1F2937',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{fullName || 'User'}</div>
              </div>
            </div>

            <div style={{ padding: 6 }}>
              <DropItem icon="account_circle" label="My Profile" onClick={() => { setMenuOpen(false); setSettingsOpen(false); navigate('/profile') }} />
              <DropItem icon="settings" label="Cài đặt" onClick={() => setSettingsOpen((open) => !open)} trailingIcon={settingsOpen ? 'expand_less' : 'expand_more'} active={settingsOpen} />
              {settingsOpen && (
                <DropItem icon="lock_reset" label="Đổi mật khẩu" onClick={() => { setMenuOpen(false); setSettingsOpen(false); navigate('/profile', { state: { openSettings: true } }) }} nested />
              )}
              <div style={{ height: 1, background: 'rgba(235,245,247,0.90)', margin: '4px 0' }} />
              <DropItem icon="logout" label="Đăng xuất" onClick={handleLogout} danger />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Dropdown row ─────────────────────────────────────────── */
const DropItem = ({ icon, label, onClick, danger = false, active = false, nested = false, trailingIcon }) => {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        width: '100%', padding: nested ? '8px 10px 8px 28px' : '8px 10px', borderRadius: 10,
        border: 'none',
        background: hov || active ? (danger ? '#FEF2F2' : '#D7EEF1') : 'transparent',
        color: danger ? '#EF4444' : (hov || active ? '#1E707D' : '#374151'),
        fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
        transition: `background 150ms ${EASE}, color 150ms ${EASE}`,
        fontFamily: 'Inter,-apple-system,sans-serif',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {trailingIcon && <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{trailingIcon}</span>}
    </button>
  )
}

export default FloatingTopBar
