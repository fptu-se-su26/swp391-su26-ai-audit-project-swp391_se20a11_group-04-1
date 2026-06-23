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

  const [menuOpen, setMenuOpen]     = useState(false)
  const [avatarHov, setAvatarHov]   = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchVal, setSearchVal]   = useState('')
  const menuRef   = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ⌘K / Ctrl+K shortcut to focus search
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    toast.success('Đăng xuất thành công!')
    navigate('/login')
  }

  return (
    /*
      Floating bar: fixed, centered horizontally at top.
      Width ≈ 60vw, min 480px. Glassmorphism style.
    */
    <div style={{
      position:      'fixed',
      top:           14,
      left:          '50%',
      transform:     'translateX(-50%)',
      zIndex:        50,
      display:       'flex',
      alignItems:    'center',
      gap:           8,
      padding:       '5px 8px',
      /* Glassmorphism */
      background:    'rgba(255,255,255,0.78)',
      backdropFilter:'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border:        '1px solid rgba(255,255,255,0.70)',
      borderRadius:  40,
      boxShadow:     '0 4px 24px rgba(30,112,125,0.10), 0 1px 0 rgba(255,255,255,0.90) inset, 0 8px 32px rgba(0,0,0,0.06)',
      /* Fluid width ~1/2 of previous (~58vw → ~30vw), min 300px */
      width:         'min(32vw, 440px)',
      minWidth:      '300px',
    }}>

      {/* ── Search bar — center, takes most space ── */}
      <div style={{
        flex:     1,
        position: 'relative',
        display:  'flex',
        alignItems: 'center',
      }}>
        <span className="material-symbols-outlined" style={{
          position:     'absolute',
          left:         10,
          fontSize:     16,
          color:        searchFocused ? '#1E707D' : '#9CA3AF',
          pointerEvents:'none',
          transition:   `color 150ms ${EASE}`,
        }}>search</span>

        <input
          ref={searchRef}
          type="text"
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          placeholder="Search anything..."
          style={{
            width:        '100%',
            padding:      '7px 60px 7px 34px',
            background:   searchFocused ? 'rgba(255,255,255,0.90)' : 'rgba(248,250,252,0.70)',
            border:       `1px solid ${searchFocused ? 'rgba(30,112,125,0.40)' : 'rgba(217,231,228,0.80)'}`,
            borderRadius: 28,
            fontSize:     13,
            fontWeight:   400,
            color:        '#1F2937',
            outline:      'none',
            fontFamily:   'Inter,-apple-system,BlinkMacSystemFont,sans-serif',
            transition:   `all 200ms ${EASE}`,
            boxShadow:    searchFocused ? '0 0 0 3px rgba(30,112,125,0.12)' : 'none',
          }}
        />

        {/* ⌘K hint */}
        {!searchFocused && !searchVal && (
          <div style={{
            position:     'absolute',
            right:        10,
            display:      'flex',
            alignItems:   'center',
            gap:          3,
            pointerEvents:'none',
          }}>
            <kbd style={{
              fontSize:     10,
              color:        '#9CA3AF',
              background:   'rgba(0,0,0,0.05)',
              border:       '1px solid rgba(0,0,0,0.10)',
              borderRadius: 4,
              padding:      '1px 5px',
              fontFamily:   'inherit',
            }}>⌘K</kbd>
          </div>
        )}

        {/* Clear button */}
        {searchVal && (
          <button
            onClick={() => { setSearchVal(''); searchRef.current?.focus() }}
            style={{
              position:   'absolute',
              right:      10,
              background: 'none',
              border:     'none',
              cursor:     'pointer',
              padding:    2,
              display:    'flex',
              alignItems: 'center',
              color:      '#9CA3AF',
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
          </button>
        )}
      </div>

      {/* ── Divider ── */}
      <div style={{ width: 1, height: 22, background: 'rgba(217,231,228,0.80)', flexShrink: 0 }} />

      {/* ── Notification bell ── */}
      <NotificationDropdown />

      {/* ── Divider ── */}
      <div style={{ width: 1, height: 22, background: 'rgba(217,231,228,0.80)', flexShrink: 0 }} />

      {/* ── Avatar + dropdown ── */}
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
            background:   'rgba(255,255,255,0.95)',
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
                width:         32, height: 32, borderRadius: '50%',
                background:    'linear-gradient(135deg, #278A99 0%, #1E707D 55%, #165964 100%)',
                display:       'flex', alignItems: 'center', justifyContent: 'center',
                color:         '#fff', fontSize: 11, fontWeight: 700,
                flexShrink:    0,
                boxShadow:     '0 3px 10px rgba(30,112,125,0.30)',
              }}>{initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#1F2937',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{fullName || 'User'}</div>
              </div>
            </div>

            <div style={{ padding: 6 }}>
              <DropItem icon="account_circle" label="My Profile" onClick={() => { setMenuOpen(false); navigate('/profile') }} />
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
const DropItem = ({ icon, label, onClick, danger = false }) => {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:     'flex', alignItems: 'center', gap: 9,
        width:       '100%', padding:    '8px 10px', borderRadius: 10,
        border:      'none',
        background:  hov ? (danger ? '#FEF2F2' : '#D7EEF1') : 'transparent',
        color:       danger ? '#EF4444' : (hov ? '#1E707D' : '#374151'),
        fontSize:    13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
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
