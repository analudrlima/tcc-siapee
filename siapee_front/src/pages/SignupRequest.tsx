import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import logo from '../assets/logo.svg'

export default function SignupRequestPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [roleRequested, setRoleRequested] = useState<'TEACHER' | 'SECRETARY'>('TEACHER')
  const [msg, setMsg] = useState<string | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(undefined)
    setError(undefined)
    setLoading(true)
    try {
      const nameNorm = name.trim()
      const emailNorm = email.trim().toLowerCase()
      if (!nameNorm) throw new Error('Informe seu nome completo')
      if (!emailNorm) throw new Error('Informe seu e-mail')
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)
      if (!emailOk) throw new Error('E-mail inválido')
      if (password.length < 6) throw new Error('A senha deve ter pelo menos 6 caracteres')
      if (password !== confirm) throw new Error('As senhas não conferem')
      await api.post('/signup/request', { name: nameNorm, email: emailNorm, password, roleRequested })
      setMsg('Solicitação enviada! Aguarde a aprovação pela secretaria.')
      // limpa campos após sucesso
      setName(''); setEmail(''); setPassword(''); setConfirm(''); setRoleRequested('TEACHER')
    } catch (e: any) {
      setError(e?.message || 'Falha ao enviar solicitação')
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
          <h2 className="login-title">Solicitar acesso<br /><strong>Preencha seus dados</strong></h2>
          <form onSubmit={submit} className="login-form">
            <div className="form-grid">
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>Nome completo</label>
                <input className="input" placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label>E-mail</label>
                <input className="input" placeholder="seu@email.com" type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
              </div>
              <div className="field">
                <label>Senha</label>
                <input className="input" placeholder="Crie uma senha (mín. 6)" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
              </div>
              <div className="field">
                <label>Confirmar senha</label>
                <input className="input" placeholder="Repita a senha" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} disabled={loading} />
              </div>
              <div className="field">
                <label>Perfil desejado</label>
                <select className="select" value={roleRequested} onChange={e => setRoleRequested(e.target.value as any)} disabled={loading}>
                  <option value="TEACHER">Professor(a)</option>
                  <option value="SECRETARY">Secretaria</option>
                </select>
              </div>
            </div>

            {error && <div style={{ color: '#ffd8d8', background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>{error}</div>}
            {msg && <div style={{ color: '#d4ffd8', background: 'rgba(0,0,0,0.12)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>{msg}</div>}

            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <button className="btn login-btn" disabled={loading} type="submit">{loading ? 'Enviando...' : 'Enviar solicitação'}</button>
            </div>
          </form>
          <div style={{ marginTop: 14, textAlign: 'center', color: '#fff' }}>
            <div>Já possui acesso?</div>
            <Link to="/login" className="link-signup">Entrar na minha conta</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
