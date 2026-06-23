import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '@store/useAuthStore'
import { getInitials } from '@utils/avatarHelper'
import toast from 'react-hot-toast'
import { NotificationDropdown } from './NotificationDropdown'

const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

const FloatingTopBar = () => {
  const fullName = useAuthStore((s) => s.fullName)
  const logout   = useAuthStore((s) => s.logout)
  const initials = getInitials(fullName)
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen]   = useState(false)
  const [avatarHov, setAvatarHov] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    toast.success('Đăng xuất thành công!')
    navigate('/login')
  }

  return (
    /* Fixed pill — top-right, floats above content */
    <div style={{
      position:      'fixed',
      top:           16,
      right:         20,
      zIndex:        50,
      display:       'flex',
      alignItems:    'center',
      gap:           4,
      padding:       '5px 6px',
      background:    '#FFFFFF',
      border:        '1px solid #D9E7E4',
      borderRadius:  40,
      boxShadow:     '0 4px 20px rgba(30,112,125,0.10), 0 1px 4px rgba(0,0,0,0.05)',
    }}>

      {/* Notification bell */}
      <NotificationDropdown />

      {/* Divider */}
      <div style={{ width: 1, height: 20, background: '#EBF5F7', margin: '0 2px' }} />

      {/* Avatar + dropdown */}
      <div ref={menuRef} style={{ position: 'relative' }}>
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
            transition:    `box-shadow 200ms ${EASE}, border-color 200ms ${EASE}`,
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
            width:        200,
            background:   '#FFFFFF',
            border:       '1px solid #D9E7E4',
            borderRadius: 16,
            boxShadow:    '0 16px 48px rgba(30,112,125,0.14)',
            overflow:     'hidden',
            animation:    'fadeIn 0.12s ease-out',
            zIndex:       60,
          }}>
            {/* Profile header */}
            <div style={{
              display:       'flex',
              alignItems:    'center',
              gap:           10,
              padding:       '12px 14px',
              borderBottom:  '1px solid #EBF5F7',
            }}>
              <div style={{
                width:         32,
                height:        32,
                borderRadius:  '50%',
                background:    'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)',
                display:       'flex',
                alignItems:    'center',
                justifyContent:'center',
                color:         '#fff',
                fontSize:      11,
                fontWeight:    700,
                flexShrink:    0,
                boxShadow:     '0 3px 10px rgba(30,112,125,0.30)',
              }}>
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize:     13,
                  fontWeight:   600,
                  color:        '#1F2937',
                  overflow:     'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace:   'nowrap',
                }}>
                  {fullName || 'User'}
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div style={{ padding: 6 }}>
              <DropItem icon="account_circle" label="My Profile"  onClick={() => { setMenuOpen(false); navigate('/profile') }} />
              <div style={{ height: 1, background: '#EBF5F7', margin: '4px 0' }} />
              <DropItem icon="logout" label="Đăng xuất" onClick={handleLogout} danger />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Dropdown row ─────────────────────────────────────────── */
const DropItem = ({ icon, label, onClick, danger = false }) => {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:     'flex',
        alignItems:  'center',
        gap:         9,
        width:       '100%',
        padding:     '8px 10px',
        borderRadius: 10,
        border:      'none',
        background:  hov ? (danger ? '#FEF2F2' : '#D7EEF1') : 'transparent',
        color:       danger ? '#EF4444' : (hov ? '#1E707D' : '#374151'),
        fontSize:    13,
        fontWeight:  500,
        cursor:      'pointer',
        textAlign:   'left',
        transition:  `background 150ms ${EASE}, color 150ms ${EASE}`,
        fontFamily:  'Inter,-apple-system,sans-serif',
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 17 }}>{icon}</span>
      {label}
    </button>
  )
}

export default FloatingTopBar
