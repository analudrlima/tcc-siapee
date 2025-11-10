import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import logo from '../../assets/logo.svg'

interface TopbarProps {
  onToggleSidebar?: () => void
}

export function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // close on click outside or Escape
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current) return
      if (!wrapRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger" onClick={() => onToggleSidebar && onToggleSidebar()} aria-label="Toggle menu">☰</button>
        <div className="logo-box">
          <Link to="/">
            <img src={logo} alt="SIAPEE" />
          </Link>
        </div>
        <div className="brand-text">
          <div className="brand-sub">APAE - Balneário Arroio do Silva</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="user-info">
          <div className="user-name">{user?.name ?? 'Usuário'}</div>
          <div className="user-role">{user?.role === 'TEACHER' ? 'Professor(a)' : 'Secretaria'}</div>
        </div>
        <div className="profile-menu-wrap" ref={wrapRef}>
          <button className="profile-trigger" onClick={() => setMenuOpen(v=>!v)} aria-expanded={menuOpen} aria-haspopup="true">
            {user?.avatarUrl ? <img src={user.avatarUrl} alt={user?.name ?? 'avatar'} className="avatar-img"/> : <span className="avatar-circle" />}
          </button>
          {menuOpen && (
            <div className="profile-dropdown" role="menu">
              <Link to="/perfil" onClick={()=>setMenuOpen(false)} role="menuitem">Perfil</Link>
              <button onClick={async ()=>{ setMenuOpen(false); await logout(); navigate('/login') }} role="menuitem">Sair</button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
