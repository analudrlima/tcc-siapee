import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import logo from '../assets/logo.svg'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loginOrEmail, setLoginOrEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true)
      setError(null)
      if (!loginOrEmail.trim() || !password) {
        // Mensagens específicas por campo ausente
        if (!loginOrEmail.trim() && !password) {
          setError('Informe e-mail/usuário e a senha')
        } else if (!loginOrEmail.trim()) {
          setError('Informe e-mail ou usuário')
        } else {
          setError('Informe a senha')
        }
        return
      }
      await login(loginOrEmail, password)
      navigate('/')
    } catch (err: any) {
      const status = err?.response?.status
      const apiError = (err?.response?.data?.error as string | undefined) || ''
      if (status === 401 || /invalid credentials/i.test(apiError)) {
        setError('E-mail/usuário ou senha incorretos')
      } else {
        setError('Falha ao entrar')
      }
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="login-page">
      <div className="login-topbar">
        <Link to="/">
          <img src={logo} alt="SIAPEE" />
        </Link>
      </div>
      <div className="login-center">
        <div className="card login-card">
          <h2 className="login-title">Bem-vindo(a),<br/><strong>Acesse sua conta!</strong></h2>
          <form onSubmit={onSubmit} className="login-form">
            <div className="form-row">
              <input className="input" placeholder="E-mail ou usuário" value={loginOrEmail} onChange={e=>setLoginOrEmail(e.target.value)} />
            </div>
            <div className="form-row">
              <input className="input" placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <Link to="/recuperar-senha" className="link-signup" style={{ color: '#dbe9ff' }}>Esqueci minha senha</Link>
            </div>
            {error && <div role="alert" style={{ color: '#ffb4b4', marginBottom: 8, textAlign: 'center' }}>{error}</div>}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="btn login-btn" disabled={loading} type="submit">Entrar</button>
            </div>
          </form>
          <div style={{ marginTop: 14, textAlign: 'center', color: '#fff' }}>
            <div>Ainda não tem uma conta?</div>
            <Link to="/signup" className="link-signup">Solicite seu cadastro</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
