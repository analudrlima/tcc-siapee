import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../../components/layout'
import { api } from '../../services/api'
import { StudentAvatar } from '../../components/StudentAvatar'
import { AdminSolicitacoes } from './Solicitacoes'
import { useLocation, useNavigate } from 'react-router-dom'

export type UserRow = {
  id: string
  name: string
  email: string
  role: 'ADMIN'|'TEACHER'|'SECRETARY'
  phone?: string | null
  birthDate?: string | null
  avatarUrl?: string | null
  createdAt?: string
}

export function AdminUsuarios() {
  const [items, setItems] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<'TODOS'|'TEACHER'|'SECRETARIA'>('TODOS')
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const initialTab = (params.get('tab') === 'solicitacoes') ? 'solicitacoes' : 'usuarios'
  const [tab, setTab] = useState<'usuarios'|'solicitacoes'>(initialTab as any)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/users')
      setItems(r.data)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return items.filter(u => {
      const matchesSearch = !s || u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || (u.phone||'').toLowerCase().includes(s)
      const isSecretaria = (u.role === 'SECRETARY' || u.role === 'ADMIN')
      const matchesRole = role === 'TODOS' || (role === 'TEACHER' ? u.role === 'TEACHER' : isSecretaria)
      return matchesSearch && matchesRole
    })
  }, [items, role, search])

  const changeTab = (t: 'usuarios'|'solicitacoes') => {
    setTab(t)
    const sp = new URLSearchParams(location.search)
    if (t === 'solicitacoes') sp.set('tab','solicitacoes'); else sp.delete('tab')
    navigate({ pathname: location.pathname, search: sp.toString() })
  }

  return (
    <Layout>
  <h1 className="title">Secretaria</h1>
      <div className="tabs" style={{ marginBottom: 12 }}>
        <button className={`tab ${tab==='usuarios'?'active':''}`} onClick={()=>changeTab('usuarios')}>Usuários</button>
        <button className={`tab ${tab==='solicitacoes'?'active':''}`} onClick={()=>changeTab('solicitacoes')}>Solicitações</button>
      </div>
      {tab === 'solicitacoes' ? (
        <AdminSolicitacoes embed />
      ) : (
      <>
      <div className="form-row">
        <div>
          <div>Buscar:</div>
          <input className="input" placeholder="Nome, e-mail ou telefone" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div>
          <div>Perfil:</div>
          <select className="select" value={role} onChange={e=>setRole(e.target.value as any)}>
            <option value="TODOS">Todos</option>
            <option value="TEACHER">Professor(a)</option>
            <option value="SECRETARIA">Secretaria</option>
          </select>
        </div>
        <div style={{ alignSelf:'end' }}>
          <button className="btn btn-outline" onClick={load} disabled={loading}>Atualizar</button>
        </div>
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 24, textAlign: 'center', color: '#666' }}>Carregando...</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Telefone</th>
                <th>Nascimento</th>
                <th>Criado em</th>
                <th style={{ width:120 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap: 10 }}>
                      <StudentAvatar src={u.avatarUrl||undefined} size={32} alt={`Foto de ${u.name}`} rounded={16} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                        <div style={{ fontSize: 12, color: '#666' }}>{u.id.slice(0,8)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className="badge">{u.role === 'TEACHER' ? 'Professor(a)' : 'Secretaria'}</span></td>
                  <td>{u.phone || '-'}</td>
                  <td>{u.birthDate ? new Date(u.birthDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>
                    {(u.role !== 'ADMIN') && (
                      <button
                        className="btn btn-danger sm"
                        style={{ fontSize:12, padding:'6px 10px' }}
                        data-cy="usuarios-delete-btn"
                        onClick={async () => {
                          if (!confirm('Excluir este usuário?')) return
                          try {
                            await api.delete(`/users/${u.id}`)
                            setItems(items.filter(it => it.id !== u.id))
                          } catch (e: any) {
                            alert(e?.response?.data?.error || 'Falha ao excluir')
                          }
                        }}
                      >Excluir</button>
                    )}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#666' }}>Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      </>
      )}
    </Layout>
  )
}

export default AdminUsuarios
