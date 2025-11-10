import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import logo from '../assets/logo.svg'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | undefined>()
  const [token, setToken] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(undefined); setError(undefined); setToken(undefined)
    const mail = email.trim().toLowerCase()
    if (!mail) { setError('Informe seu e-mail'); return }
    setLoading(true)
    try {
      const r = await api.post('/auth/forgot-password', { email: mail })
      setMsg('Se existir uma conta com este e-mail, enviaremos um link para redefinir a senha.')
      if (r.data?.token) setToken(r.data.token) // útil para ambiente de testes
    } catch {
      setMsg('Se existir uma conta com este e-mail, enviaremos um link para redefinir a senha.')
    } finally { setLoading(false) }
  }

  return (
    <div className="login-page">
      <div className="login-topbar">
        <Link to="/">
          <img src={logo} alt="SIAPEE" />
        </Link>
      </div>
      <div className="login-center">
        <div className="card login-card" style={{ width: 520, maxWidth: '94%' }}>
          <h2 className="login-title">Esqueceu a senha?<br /><strong>Recupere seu acesso</strong></h2>
          <form onSubmit={submit} className="login-form">
            <div className="form-grid">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>E-mail</label>
                <input className="input" placeholder="seu@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
              </div>
            </div>
            {error && <div style={{ color: '#ffd8d8', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>{error}</div>}
            {msg && <div style={{ color: '#d4ffd8', background: 'rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>{msg}</div>}
            {token && (
              <div style={{ color: '#fff', background: 'rgba(0,0,0,0.18)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
                Código (teste): {token}
                <div style={{fontSize:13,opacity:.9}}>Use o código para redefinir abaixo ou na página de reset.</div>
              </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <button className="btn login-btn" disabled={loading} type="submit">{loading ? 'Enviando...' : 'Enviar link'}</button>
            </div>
          </form>
          <div style={{ marginTop: 14, textAlign: 'center', color: '#fff' }}>
            <div>Já possui o código?</div>
            <Link to="/resetar-senha" className="link-signup">Redefinir senha</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
