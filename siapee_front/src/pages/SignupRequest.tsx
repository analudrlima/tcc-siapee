import { useState } from 'react'
import { api } from '../services/api'

export default function SignupRequestPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [roleRequested, setRoleRequested] = useState<'TEACHER'|'SECRETARY'>('TEACHER')
  const [msg, setMsg] = useState<string|undefined>()
  const [loading, setLoading] = useState(false)
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(undefined); setLoading(true)
    try {
      if (password.length < 6) throw new Error('Senha muito curta')
      if (password !== confirm) throw new Error('Senhas não conferem')
      await api.post('/signup/request', { name, email, password, roleRequested })
      setMsg('Solicitação enviada! Aguarde aprovação.')
    } catch (e:any) {
      setMsg(e?.message || 'Falha ao enviar solicitação')
    } finally { setLoading(false) }
  }
  return (
    <div style={{ maxWidth: 520, margin: '40px auto' }}>
      <h2>Solicitar cadastro</h2>
      <form onSubmit={submit}>
        <div style={{ display: 'grid', gap: 12 }}>
          <input className="input" placeholder="Nome completo" value={name} onChange={e=>setName(e.target.value)} />
          <input className="input" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="input" placeholder="Confirmar senha" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} />
          <select className="select" value={roleRequested} onChange={e=>setRoleRequested(e.target.value as any)}>
            <option value="TEACHER">Professor(a)</option>
            <option value="SECRETARY">Secretaria</option>
          </select>
          <button className="btn" disabled={loading} type="submit">Enviar</button>
        </div>
      </form>
      {msg && <div style={{ marginTop: 12 }}>{msg}</div>}
    </div>
  )
}
