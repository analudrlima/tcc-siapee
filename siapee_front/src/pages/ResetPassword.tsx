import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../services/api'
import logo from '../assets/logo.svg'

export default function ResetPasswordPage() {
  const [search] = useSearchParams()
  const initialToken = search.get('token') ?? ''
  const [token, setToken] = useState(initialToken)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(undefined); setError(undefined)
    if (!token.trim()) { setError('Informe o código recebido'); return }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return }
    if (password !== confirm) { setError('As senhas não conferem'); return }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token: token.trim(), password })
      setMsg('Senha redefinida com sucesso! Você já pode entrar.')
      setPassword(''); setConfirm('')
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Falha ao redefinir a senha')
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
          <h2 className="login-title">Redefinir senha<br /><strong>Insira o código e a nova senha</strong></h2>
          <form onSubmit={submit} className="login-form">
            <div className="form-grid">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Código</label>
                <input className="input" placeholder="Cole o código recebido" value={token} onChange={e => setToken(e.target.value)} disabled={loading} />
              </div>
              <div className="field">
                <label>Nova senha</label>
                <input className="input" placeholder="Mínimo 6 caracteres" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
              </div>
              <div className="field">
                <label>Confirmar senha</label>
                <input className="input" placeholder="Repita a senha" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={loading} />
              </div>
            </div>

            {error && <div style={{ color: '#ffd8d8', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>{error}</div>}
            {msg && <div style={{ color: '#d4ffd8', background: 'rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>{msg}</div>}

            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <button className="btn login-btn" disabled={loading} type="submit">{loading ? 'Salvando...' : 'Redefinir senha'}</button>
            </div>
          </form>
          <div style={{ marginTop: 14, textAlign: 'center', color: '#fff' }}>
            <div>Lembrou a senha?</div>
            <Link to="/login" className="link-signup">Entrar na minha conta</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
