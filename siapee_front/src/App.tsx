import { Routes, Route, Link, NavLink } from 'react-router-dom'
import SignupRequestPage from './pages/SignupRequest'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { api } from './services/api'
import logo from './assets/logo.svg'
import { useRef } from 'react'

function Topbar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
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
          <img src={logo} alt="SIAPEE" />
        </div>
        <div className="brand-text">
          <div className="brand-name">SIAPEE</div>
          <div className="brand-sub">APAE - Balneário Arroio do Silva</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="user-info">
          <div className="user-name">{user?.name ?? 'Usuário'}</div>
          <div className="user-role">{user?.role}</div>
        </div>
        <div className="profile-menu-wrap" ref={wrapRef}>
          <button className="profile-trigger" onClick={() => setMenuOpen(v=>!v)} aria-expanded={menuOpen} aria-haspopup="true">
            {((user as any)?.photoUrl || (user as any)?.avatarUrl) ? <img src={(user as any).photoUrl || (user as any).avatarUrl} alt={user?.name ?? 'avatar'} className="avatar-img"/> : <span className="avatar-circle" />}
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

function Sidebar() {
  const { user } = useAuth()
  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="nav-group">
          <div className="nav-heading">Gerenciamento</div>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/turmas">Turmas</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/planejamento/anual">Planejamento</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/faltas/diario">Registro de faltas</NavLink>
        </div>
        <div className="nav-group">
          <div className="nav-heading">Acadêmico</div>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/atividades">Atividades</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/avaliacoes">Avaliações</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/projetos">Projetos</NavLink>
        </div>
        <div className="nav-group">
          <div className="nav-heading">Minha Conta</div>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/perfil">Meu perfil</NavLink>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
          <div className="nav-group">
            <div className="nav-heading">Admin</div>
            <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/admin/solicitacoes">Solicitações</NavLink>
          </div>
        )}
      </div>
    </aside>
  )
}
function AdminSolicitacoes() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const load = async () => {
    setLoading(true)
    try { const r = await api.get('/signup/requests'); setItems(r.data) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  const decide = async (id: string, approved: boolean) => {
    await api.post(`/signup/requests/${id}/decide`, { approved })
    await load()
  }
  return (
    <Layout>
      <h1 className="title">Solicitações de cadastro</h1>
      <div className="panel">
        {loading ? 'Carregando...' : (
          <table className="table">
            <thead><tr><th>Nome</th><th>Email</th><th>Papel</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {items.map(it => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td>{it.email}</td>
                  <td>{it.roleRequested}</td>
                  <td>{it.status}</td>
                  <td>
                    {it.status === 'PENDING' && (
                      <>
                        <button className="btn" onClick={()=>decide(it.id, true)}>Aprovar</button>
                        <button className="btn btn-outline" style={{ marginLeft: 8 }} onClick={()=>decide(it.id, false)}>Rejeitar</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  return (
    <>
      <Topbar onToggleSidebar={() => setSidebarOpen(v => !v)} />
      <div className={`layout ${sidebarOpen ? '' : 'collapsed'}`}>
        <Sidebar />
        <main className="content">{children}</main>
      </div>
    </>
  )
}

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setLoading(true); setError(null)
  await login(email, password)
  navigate('/')
    } catch (err: any) {
      setError('Falha ao entrar')
    } finally {
      setLoading(false)
    }
  }
  return (
    <div className="login-page">
      <div className="login-topbar">
        <img src={logo} alt="SIAPEE" />
      </div>
      <div className="login-center">
        <div className="card login-card">
          <h2 className="login-title">Bem-vindo(a),<br/><strong>Acesse sua conta!</strong></h2>
          <form onSubmit={onSubmit} className="login-form">
            <div className="form-row input-with-icon">
              <span className="icon user">👤</span>
              <input className="input" placeholder="Usuário" value={username} onChange={e=>setUsername(e.target.value)} />
            </div>
            <div className="form-row input-with-icon">
              <span className="icon mail">✉️</span>
              <input className="input" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div className="form-row input-with-icon">
              <span className="icon lock">🔒</span>
              <input className="input" placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
              <button type="button" className="icon eye">👁️</button>
            </div>
            <div style={{ textAlign: 'center', marginTop: 6 }}>
              <Link to="#" className="link-forgot">esqueci minha senha</Link>
            </div>
            {error && <div style={{ color: 'crimson', marginBottom: 8 }}>{error}</div>}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button className="btn btn-outline login-btn" disabled={loading} type="submit">Entrar</button>
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

function Perfil() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/users/me')
        setName(r.data.name)
        setEmail(r.data.email)
      } catch {}
    })()
  }, [])

  const save = async () => {
    try { setSaving(true); setMsg(null)
      const r = await api.put('/users/me', { name })
      setName(r.data.name)
      setMsg('Perfil atualizado')
    } catch { setMsg('Falha ao salvar') } finally { setSaving(false) }
  }

  return (
    <Layout>
      <h1 className="title">Perfil</h1>
      <div className="profile-card">
        <div className="profile-left-panel">
          <div className="profile-back-arrow">‹</div>
          <h2 className="profile-panel-title">Perfil</h2>
          <div className="profile-avatar-wrap">
            <div className="big-avatar" />
            <div className="profile-role">{user?.role === 'TEACHER' ? 'Professor' : 'Usuário'}</div>
            <h3 className="profile-name">{name || user?.name}</h3>
          </div>
          <div style={{ marginTop: 16 }}><a href="#">Alterar foto de perfil</a></div>
        </div>
        <div className="profile-right-panel">
          <div className="form-column">
            <label>Nome de Usuário:</label>
            <div className="input-edit-row">
              <input className="input" value={name} onChange={e=>setName(e.target.value)} />
              <button className="icon-edit">✎</button>
            </div>

            <label>E-mail:</label>
            <div className="input-edit-row">
              <input className="input" value={email} onChange={e=>setEmail(e.target.value)} />
              <button className="icon-edit">✎</button>
            </div>

            <label>Nome completo:</label>
            <div className="input-edit-row">
              <input className="input" placeholder="Nome completo" value={user?.name ?? ''} disabled />
            </div>

            <div className="two-columns">
              <div>
                <label>Data de Nascimento:</label>
                <div className="input-edit-row"><input className="input" placeholder="--/--/----" disabled /></div>
              </div>
              <div>
                <label>Gênero:</label>
                <div className="input-edit-row"><input className="input" placeholder="Feminino" disabled /></div>
              </div>
            </div>

            <label>Telefone:</label>
            <div className="input-edit-row">
              <input className="input" placeholder="(00) 0000-0000" />
              <button className="icon-edit">✎</button>
              <Link to="#" className="link-small">Alterar endereço</Link>
            </div>

            {msg && <div style={{ color: '#0a7', marginBottom: 8 }}>{msg}</div>}
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-outline save-btn" disabled={saving} onClick={save}>Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

type ClassSummary = { id: string; name: string; code: string; year: number }
type StudentRow = { id: string; name: string }

function FaltasDiario() {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [students, setStudents] = useState<StudentRow[]>([])
  const [statuses, setStatuses] = useState<Record<string, 'PRESENT'|'ABSENT'|'JUSTIFIED'>>({})
  const [dayId, setDayId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])

  useEffect(() => { (async () => {
    if (!classId || !date) return
    const r = await api.get(`/classes/${classId}/attendance`, { params: { date } })
    const day = r.data as { id: string; records: { studentId: string; status: 'PRESENT'|'ABSENT'|'JUSTIFIED' }[]; class: { enrollments: { student: { id: string; name: string } }[] } }
    const rows = day.class.enrollments.map(e => ({ id: e.student.id, name: e.student.name }))
    setStudents(rows)
    const st: Record<string, 'PRESENT'|'ABSENT'|'JUSTIFIED'> = {}
    for (const rec of day.records) st[rec.studentId] = rec.status
    setStatuses(st)
    setDayId(day.id)
  })() }, [classId, date])

  const onSave = async () => {
    if (!dayId) return
    setSaving(true)
    try {
      const records = students.map(s => ({ studentId: s.id, status: statuses[s.id] ?? 'PRESENT' }))
      await api.put(`/attendance/days/${dayId}/records`, { records })
    } finally { setSaving(false) }
  }

  const alunos = students
  return (
    <Layout>
      <h1 className="title">Registro de faltas - Diário</h1>
      <div className="form-row">
        <label>selecione a turma:</label>
        <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
          <option value="">-- escolha --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <div style={{ marginLeft: 16 }}>
          <label>Data:&nbsp;</label>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
      </div>
      <div className="table card">
        <table className="table">
          <thead>
            <tr><th>Nome do aluno</th><th style={{width:520}}>Data: {date}</th></tr>
          </thead>
          <tbody>
            {alunos.map(a=> (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td>
                  <div className="radio-group">
                    <label><input type="radio" name={`s-${a.id}`} checked={(statuses[a.id] ?? 'PRESENT')==='PRESENT'} onChange={()=>setStatuses(p=>({...p,[a.id]:'PRESENT'}))}/> Presente</label>
                    <label><input type="radio" name={`s-${a.id}`} checked={(statuses[a.id] ?? 'PRESENT')==='ABSENT'} onChange={()=>setStatuses(p=>({...p,[a.id]:'ABSENT'}))}/> Ausente</label>
                    <label><input type="radio" name={`s-${a.id}`} checked={(statuses[a.id] ?? 'PRESENT')==='JUSTIFIED'} onChange={()=>setStatuses(p=>({...p,[a.id]:'JUSTIFIED'}))}/> Justificada</label>
                    <Link to="#">Observações</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ padding: 12 }}>
          <button className="btn" onClick={onSave} disabled={saving || !dayId}>Salvar</button>
        </div>
      </div>
    </Layout>
  )
}

function PlanejamentoAnual() {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [discipline, setDiscipline] = useState('Artes')
  const [lessons, setLessons] = useState<number | ''>('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  useEffect(() => { (async () => { if (!classId) return; const r = await api.get(`/classes/${classId}/planning`, { params: { kind: 'ANNUAL' } }); const p = r.data; if (p) { setDiscipline(p.discipline ?? ''); setLessons(p.lessonsPlanned ?? ''); setContent(p.content ?? '') } })() }, [classId])

  const onSave = async () => {
    if (!classId) return
    setSaving(true)
    try {
      await api.put(`/classes/${classId}/planning`, { kind: 'ANNUAL', title: 'Planejamento', content, discipline, lessonsPlanned: lessons === '' ? null : Number(lessons) })
    } finally { setSaving(false) }
  }

  return (
    <Layout>
      <h1 className="title">Planejamento Anual</h1>
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div>Disciplina:</div>
          <select className="select" value={discipline} onChange={e=>setDiscipline(e.target.value)}>
            <option>Artes</option>
            <option>Português</option>
            <option>Matemática</option>
          </select>
        </div>
        <div>
          <div>Aulas previstas:</div>
          <input className="input" placeholder="00" style={{ width: 80 }} value={lessons} onChange={e=>{ const v = e.target.value; setLessons(v === '' ? '' : Number(v)) }} />
        </div>
      </div>
      <div className="panel" style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Planejamento:</div>
        <textarea className="textarea" placeholder="Insira seu texto aqui" value={content} onChange={e=>setContent(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button className="btn" disabled={saving || !classId} onClick={onSave}>Salvar</button>
        </div>
      </div>
    </Layout>
  )
}

function Turmas() {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [discentes, setDiscentes] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  useEffect(() => { (async () => { if (!classId) return; const r = await api.get(`/classes/${classId}`); const students = r.data.enrollments.map((e: any) => ({ id: e.student.id, nome: e.student.name })); setDiscentes(students) })() }, [classId])
  return (
    <Layout>
      <h1 className="title">Turmas</h1>
      <div className="form-row">
        <div>selecione a turma:&nbsp;
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 8 }}>
        <h3>Docentes</h3>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div className="avatar" style={{ width: 64, height: 64, borderRadius: 8 }} />
          <div>
            <div>Professor responsável</div>
            <div style={{ color: '#666' }}>Usuário: analuisadarosadelima</div>
            <div style={{ color: '#666' }}>Contato: (00) 0000-0000</div>
          </div>
        </div>
        <h3 style={{ marginTop: 16 }}>Discentes</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {discentes.map(d => (
            <div key={d.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="avatar" style={{ width: 64, height: 64, borderRadius: 8 }} />
              <div>
                <div>{d.nome}</div>
                <div style={{ color: '#666' }}>Matrícula: 000000</div>
                <div style={{ color: '#666' }}>Contato: (00) 0000-0000</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}

function NotFound() {
  return <div style={{ padding: 16 }}>Página não encontrada</div>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignupRequestPage />} />
      <Route element={<ProtectedRoute /> }>
        <Route path="/perfil" element={<Perfil />} />
        <Route path="/faltas/diario" element={<FaltasDiario />} />
        <Route path="/planejamento/anual" element={<PlanejamentoAnual />} />
        <Route path="/turmas" element={<Turmas />} />
        <Route path="/admin/solicitacoes" element={<AdminSolicitacoes />} />
        <Route path="/" element={<Turmas />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
