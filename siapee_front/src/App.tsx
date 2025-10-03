import { Routes, Route, Link, NavLink } from 'react-router-dom'
import SignupRequestPage from './pages/SignupRequest'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { api } from './services/api'
import logo from './assets/logo.svg'
import { useRef } from 'react'

// Auto-resize textarea utility
const autoResizeTextarea = (element: HTMLTextAreaElement) => {
  element.style.height = 'auto';
  element.style.height = Math.max(element.scrollHeight, 100) + 'px';
}

// Hook for auto-resizing textarea
const useAutoResizeTextarea = (value: string) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      autoResizeTextarea(textareaRef.current);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    autoResizeTextarea(e.target);
    return e;
  };

  return { textareaRef, handleChange };
}

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

function Sidebar() {
  const { user } = useAuth()
  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="nav-group">
          <div className="nav-heading">Gerenciamento</div>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/turmas">Turmas</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/alunos">Alunos</NavLink>
          {/* Planejamento (unificado) */}
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/planejamento">Planejamento</NavLink>
          {/* Faltas (unificado) */}
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/faltas">Registro de faltas</NavLink>
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

export function Layout({ children }: { children: React.ReactNode }) {
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
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user?.avatarUrl ?? null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [address, setAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  })

  useEffect(() => {
    (async () => {
      try {
        const r = await api.get('/users/me')
        setName(r.data.name)
        setEmail(r.data.email)
        setPhone(r.data.phone ?? '')
        setAvatarUrl(r.data.avatarUrl ?? null)
        // Simular dados de endereço
        setAddress({
          street: r.data.address?.street ?? 'Rua das Flores',
          number: r.data.address?.number ?? '123',
          complement: r.data.address?.complement ?? 'Apt 45',
          neighborhood: r.data.address?.neighborhood ?? 'Centro',
          city: r.data.address?.city ?? 'São Paulo',
          state: r.data.address?.state ?? 'SP',
          zipCode: r.data.address?.zipCode ?? '01234-567'
        })
      } catch {}
    })()
  }, [])

  const save = async () => {
    try { setSaving(true); setMsg(null)
  const r = await api.put('/users/me', { name, email, phone })
  setName(r.data.name)
  setEmail(r.data.email)
  setPhone(r.data.phone ?? '')
      setMsg('Perfil atualizado')
    } catch { setMsg('Falha ao salvar') } finally { setSaving(false) }
  }

  const saveAddress = async () => {
    try {
      // Simular salvamento do endereço
      setMsg('Endereço atualizado com sucesso')
      setShowAddressModal(false)
    } catch {
      setMsg('Falha ao salvar endereço')
    }
  }

  return (
    <Layout>
      <h1 className="title">Perfil</h1>
      <div className="profile-card">
        <div className="profile-left-panel">
          <div className="profile-avatar-wrap">
            {avatarUrl ? <img src={avatarUrl} alt="avatar" className="big-avatar" /> : <div className="big-avatar" />}
            <div className="profile-role">{user?.role === 'TEACHER' ? 'Professor' : 'Usuário'}</div>
            <h3 className="profile-name">{name || user?.name}</h3>
          </div>
          <div style={{ marginTop: 16 }}>
            <label className="btn btn-outline">
              Alterar foto de perfil
              <input type="file" accept="image/*" style={{ display:'none' }} onChange={async (e)=>{
                const f = e.target.files?.[0]; if (!f) return
                const form = new FormData(); form.append('file', f)
                const r = await api.post('/users/me/avatar', form, { headers: { 'Content-Type':'multipart/form-data' } })
                setAvatarUrl(r.data.avatarUrl)
                setMsg('Foto atualizada')
              }} />
            </label>
          </div>
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
              <input className="input" placeholder="(00) 0000-0000" value={phone} onChange={e=>setPhone(e.target.value)} />
              <button className="icon-edit">✎</button>
            </div>
            <div style={{ marginTop: 8 }}>
              <button className="link-address" onClick={() => setShowAddressModal(true)}>Alterar endereço</button>
            </div>

            {msg && <div style={{ color: '#0a7', marginBottom: 8 }}>{msg}</div>}
            <div style={{ marginTop: 12 }}>
              <button className="btn btn-outline save-btn" disabled={saving} onClick={save}>Salvar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de endereço */}
      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Alterar Endereço</h3>
              <button className="modal-close" onClick={() => setShowAddressModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="field">
                  <label>CEP</label>
                  <input 
                    className="input" 
                    placeholder="00000-000" 
                    value={address.zipCode} 
                    onChange={e => setAddress(prev => ({...prev, zipCode: e.target.value}))} 
                  />
                </div>
                <div className="field">
                  <label>Logradouro</label>
                  <input 
                    className="input" 
                    placeholder="Rua, Avenida..." 
                    value={address.street} 
                    onChange={e => setAddress(prev => ({...prev, street: e.target.value}))} 
                  />
                </div>
                <div className="field">
                  <label>Número</label>
                  <input 
                    className="input" 
                    placeholder="123" 
                    value={address.number} 
                    onChange={e => setAddress(prev => ({...prev, number: e.target.value}))} 
                  />
                </div>
                <div className="field">
                  <label>Complemento</label>
                  <input 
                    className="input" 
                    placeholder="Apt, Bloco..." 
                    value={address.complement} 
                    onChange={e => setAddress(prev => ({...prev, complement: e.target.value}))} 
                  />
                </div>
                <div className="field">
                  <label>Bairro</label>
                  <input 
                    className="input" 
                    placeholder="Centro" 
                    value={address.neighborhood} 
                    onChange={e => setAddress(prev => ({...prev, neighborhood: e.target.value}))} 
                  />
                </div>
                <div className="field">
                  <label>Cidade</label>
                  <input 
                    className="input" 
                    placeholder="São Paulo" 
                    value={address.city} 
                    onChange={e => setAddress(prev => ({...prev, city: e.target.value}))} 
                  />
                </div>
                <div className="field">
                  <label>Estado</label>
                  <select 
                    className="select" 
                    value={address.state} 
                    onChange={e => setAddress(prev => ({...prev, state: e.target.value}))}
                  >
                    <option value="">Selecione</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowAddressModal(false)}>
                Cancelar
              </button>
              <button className="btn" onClick={saveAddress}>
                Salvar Endereço
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

type ClassSummary = { id: string; name: string; code: string; year: number }
type StudentRow = { id: string; name: string }

function FaltasDiario({ embed }: { embed?: boolean }) {
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
  await api.put(`/attendance/days/${dayId}/records`, records)
    } finally { setSaving(false) }
  }

  const alunos = students
  const body = (
      <>
      <h1 className="title">Registro de faltas - Diário</h1>
      <div className="form-row filters">
        <label>Turma:</label>
        <select className="select sm" value={classId} onChange={e=>setClassId(e.target.value)}>
          <option value="">-- escolha --</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label>Data:</label>
        <input className="input sm" type="date" value={date} onChange={e=>setDate(e.target.value)} />
      </div>
      <div className="table card">
        <table className="table">
          <thead>
            <tr><th>Nome do aluno</th><th className="status-col">Data: {date}</th></tr>
          </thead>
          <tbody>
            {alunos.map(a=> (
              <tr key={a.id}>
                <td>{a.name}</td>
                <td className="status-cell">
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
      </>
  )
  return embed ? body : <Layout>{body}</Layout>
}

function PlanejamentoAnual({ embed }: { embed?: boolean }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [discipline, setDiscipline] = useState('Artes')
  const [lessons, setLessons] = useState<number | ''>('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const { textareaRef, handleChange } = useAutoResizeTextarea(content)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  useEffect(() => { (async () => { if (!classId) return; const r = await api.get(`/classes/${classId}/planning`, { params: { kind: 'ANNUAL', discipline } }); const p = r.data; if (p) { setDiscipline(p.discipline ?? discipline); setLessons(p.lessonsPlanned ?? ''); setContent(p.content ?? '') } else { setLessons(''); setContent('') } })() }, [classId, discipline])

  const onSave = async () => {
    if (!classId) return
    setSaving(true)
    try {
  await api.put(`/classes/${classId}/planning`, { kind: 'ANNUAL', title: 'Planejamento', content, discipline, lessonsPlanned: lessons === '' ? null : Number(lessons) })
    } finally { setSaving(false) }
  }

  const body = (
    <>
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
        <textarea 
          ref={textareaRef}
          className="textarea" 
          placeholder="Insira seu texto aqui" 
          value={content} 
          onChange={e => { handleChange(e); setContent(e.target.value) }} 
        />
        <div style={{ marginTop: 8 }}>
          <button className="btn" disabled={saving || !classId} onClick={onSave}>Salvar</button>
        </div>
      </div>
    </>
  )
  return embed ? body : <Layout>{body}</Layout>
}

function PlanejamentoSemestral({ embed }: { embed?: boolean }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [semester, setSemester] = useState<'1'|'2'>('1')
  const [discipline, setDiscipline] = useState('Artes')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const { textareaRef, handleChange } = useAutoResizeTextarea(content)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  useEffect(() => { (async () => { if (!classId) return; const r = await api.get(`/classes/${classId}/planning`, { params: { kind: 'SEMESTER', details: semester, discipline } }); const p = r.data; if (p) { setContent(p.content ?? '') } else { setContent('') } })() }, [classId, semester, discipline])

  const onSave = async () => {
    if (!classId) return
    setSaving(true)
    try {
  await api.put(`/classes/${classId}/planning`, { kind: 'SEMESTER', details: semester, title: 'Planejamento Semestral', content, discipline })
    } finally { setSaving(false) }
  }

  const body = (
    <>
      <h1 className="title">Planejamento Semestral</h1>
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
          <div>Semestre:</div>
          <select className="select" value={semester} onChange={e=>setSemester(e.target.value as '1'|'2')}>
            <option value="1">1º semestre</option>
            <option value="2">2º semestre</option>
          </select>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Planejamento:</div>
        <textarea 
          ref={textareaRef}
          className="textarea" 
          placeholder="Insira seu texto aqui" 
          value={content} 
          onChange={e => { handleChange(e); setContent(e.target.value) }} 
        />
        <div style={{ marginTop: 8 }}>
          <button className="btn" disabled={saving || !classId} onClick={onSave}>Salvar</button>
        </div>
      </div>
    </>
  )
  return embed ? body : <Layout>{body}</Layout>
}

function PlanejamentoIndividual({ embed }: { embed?: boolean }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [students, setStudents] = useState<{ id: string; name: string }[]>([])
  const [studentId, setStudentId] = useState<string>('')
  const [discipline, setDiscipline] = useState('Geral')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const { textareaRef, handleChange } = useAutoResizeTextarea(content)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  useEffect(() => { (async () => { if (!classId) { setStudents([]); setStudentId(''); setContent(''); return }
    const r = await api.get(`/classes/${classId}`)
    const sts = r.data.enrollments.map((e: any) => ({ id: e.student.id, name: e.student.name }))
    setStudents(sts); setStudentId(sts[0]?.id ?? '')
  })() }, [classId])
  useEffect(() => { (async () => { if (!classId || !studentId) { setContent(''); return }
    const r = await api.get(`/classes/${classId}/planning`, { params: { kind: 'INDIVIDUAL', details: studentId, discipline } })
    const p = r.data
    setContent(p?.content ?? '')
  })() }, [classId, studentId, discipline])

  const onSave = async () => {
    if (!classId || !studentId) return
    setSaving(true)
    try {
      await api.put(`/classes/${classId}/planning`, { kind: 'INDIVIDUAL', details: studentId, title: 'Planejamento Individual', content, discipline })
    } finally { setSaving(false) }
  }

  const body = (
    <>
      <h1 className="title">Planejamento Individual</h1>
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div>Aluno:</div>
          <select className="select" value={studentId} onChange={e=>setStudentId(e.target.value)} disabled={!classId}>
            <option value="">-- escolha --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <div>Disciplina:</div>
          <select className="select" value={discipline} onChange={e=>setDiscipline(e.target.value)}>
            <option>Geral</option>
            <option>Artes</option>
            <option>Português</option>
            <option>Matemática</option>
          </select>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>Plano Individual:</div>
        <textarea 
          ref={textareaRef}
          className="textarea" 
          placeholder="Metas, estratégias, recursos, avaliação..." 
          value={content} 
          onChange={e => { handleChange(e); setContent(e.target.value) }} 
        />
        <div style={{ marginTop: 8 }}>
          <button className="btn" disabled={!classId || !studentId || saving} onClick={onSave}>Salvar</button>
        </div>
      </div>
    </>
  )
  return embed ? body : <Layout>{body}</Layout>
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
  <Route path="/alunos" element={<AlunosPage />} />
        <Route path="/faltas" element={<FaltasPage />} />
        {/* Rotas antigas redirecionam para a página unificada */}
        <Route path="/faltas/diario" element={<FaltasPage initialTab="diario" />} />
        <Route path="/faltas/historicos" element={<FaltasPage initialTab="historicos" />} />
        <Route path="/faltas/observacoes" element={<FaltasPage initialTab="observacoes" />} />
        <Route path="/planejamento" element={<PlanningPage />} />
        {/* Rotas antigas apontam para aba correspondente */}
        <Route path="/planejamento/anual" element={<PlanningPage initialTab="anual" />} />
        <Route path="/planejamento/semestral" element={<PlanningPage initialTab="semestral" />} />
        <Route path="/planejamento/individual" element={<PlanningPage initialTab="individual" />} />
        <Route path="/turmas" element={<Turmas />} />
        <Route path="/admin/solicitacoes" element={<AdminSolicitacoes />} />
  <Route path="/atividades" element={<AtividadesTabs />} />
  {/* rotas antigas mantidas para compatibilidade, abrindo a aba correspondente */}
  <Route path="/atividades/materia" element={<AtividadesTabs initial="MATERIA" />} />
  <Route path="/atividades/multidisciplinares" element={<AtividadesTabs initial="MULTI" />} />
  <Route path="/avaliacoes" element={<AvaliacoesTabs />} />
  {/* rotas antigas mantidas para compatibilidade, abrindo a aba correspondente */}
  <Route path="/avaliacoes/desenvolvimento" element={<AvaliacoesTabs initial="DEV" />} />
  <Route path="/avaliacoes/evolutivas" element={<AvaliacoesTabs initial="EVO" />} />
  <Route path="/projetos" element={<ProjetosTabs />} />
  {/* rotas antigas mantidas para compatibilidade, abrindo a aba correspondente */}
  <Route path="/projetos/materia" element={<ProjetosTabs initial="SUBJECT" />} />
  <Route path="/projetos/multidisciplinares" element={<ProjetosTabs initial="MULTI" />} />
        <Route path="/" element={<Turmas />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
function AlunosPage() {
  type Student = { 
    id: string; 
    name: string; 
    email?: string|null; 
    registryId?: string|null; 
    photoUrl?: string|null;
    birthDate?: string|null;
    phone?: string|null;
    comorbidities?: string|null;
    allergies?: string|null;
    medications?: string|null;
    observations?: string|null;
    address?: {
      street: string;
      number: number;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zipCode: string;
    }|null;
    gender?: {
      description: string;
    }|null;
  }
  const [list, setList] = useState<Student[]>([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [registryId, setRegistryId] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student|null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/students?include=address,gender')
      setList(r.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const create = async () => {
    if (!name.trim()) return
    await api.post('/students', { name, email: email || null, registryId: registryId || null })
    setName(''); setEmail(''); setRegistryId('')
    await load()
  }

  const onUpload = async (id: string, file: File) => {
    const form = new FormData(); form.append('file', file)
    await api.post(`/students/${id}/photo`, form, { headers: { 'Content-Type':'multipart/form-data' } })
    await load()
  }

  return (
    <Layout>
      <h1 className="title">Alunos</h1>
      <div className="card">
        <div className="form-grid">
          <div className="field"><label>Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)} /></div>
          <div className="field"><label>E-mail</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div>
          <div className="field"><label>Matrícula</label><input className="input" value={registryId} onChange={e=>setRegistryId(e.target.value)} /></div>
        </div>
        <div className="form-row"><button className="btn" onClick={create}>Cadastrar aluno</button></div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        {loading ? 'Carregando...' : (
          <table className="table">
            <thead><tr><th>Foto</th><th>Nome</th><th>Email</th><th>Matrícula</th><th>Ações</th></tr></thead>
            <tbody>
              {list.map(s => (
                <tr key={s.id}>
                  <td>
                    {s.photoUrl ? <img src={s.photoUrl.startsWith('http')?s.photoUrl:(`${location.origin}${s.photoUrl}`)} style={{width:48,height:48,objectFit:'cover',borderRadius:6}}/> : <div className="avatar" style={{width:48,height:48}}/>}
                  </td>
                  <td>{s.name}</td>
                  <td>{s.email || '-'}</td>
                  <td>{s.registryId || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label className="btn btn-outline">
                        Foto
                        <input type="file" accept="image/*" style={{display:'none'}} onChange={e=>{ const f=e.target.files?.[0]; if (f) onUpload(s.id, f) }} />
                      </label>
                      <button className="btn btn-outline" onClick={() => { setSelectedStudent(s); setShowDetailsModal(true) }}>
                        Ver mais
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={5} style={{textAlign:'center',color:'#666'}}>Nenhum aluno</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de Detalhes do Aluno */}
      {showDetailsModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content student-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Informações Detalhadas do Aluno</h3>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
            </div>
            <div className="student-details-body">
              <div className="student-details-left">
                <div className="student-photo-section">
                  {selectedStudent.photoUrl ? (
                    <img 
                      src={selectedStudent.photoUrl.startsWith('http') ? selectedStudent.photoUrl : `${location.origin}${selectedStudent.photoUrl}`} 
                      className="student-detail-photo"
                      alt="Foto do aluno"
                    />
                  ) : (
                    <div className="student-detail-photo student-photo-placeholder">
                      <span>Sem foto</span>
                    </div>
                  )}
                </div>
                <h4 className="student-detail-name">{selectedStudent.name}</h4>
                <p className="student-detail-id">Matrícula: {selectedStudent.registryId || 'Não informada'}</p>
              </div>
              
              <div className="student-details-right">
                <div className="details-grid">
                  <div className="detail-group">
                    <h5>Dados Pessoais</h5>
                    <div className="detail-item">
                      <span className="detail-label">E-mail:</span>
                      <span className="detail-value">{selectedStudent.email || 'Não informado'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Data de Nascimento:</span>
                      <span className="detail-value">
                        {selectedStudent.birthDate ? new Date(selectedStudent.birthDate).toLocaleDateString('pt-BR') : 'Não informada'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Telefone:</span>
                      <span className="detail-value">{selectedStudent.phone || 'Não informado'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Gênero:</span>
                      <span className="detail-value">{selectedStudent.gender?.description || 'Não informado'}</span>
                    </div>
                  </div>

                  {selectedStudent.address && (
                    <div className="detail-group">
                      <h5>Endereço</h5>
                      <div className="detail-item">
                        <span className="detail-label">Rua:</span>
                        <span className="detail-value">{selectedStudent.address.street}, {selectedStudent.address.number}</span>
                      </div>
                      {selectedStudent.address.complement && (
                        <div className="detail-item">
                          <span className="detail-label">Complemento:</span>
                          <span className="detail-value">{selectedStudent.address.complement}</span>
                        </div>
                      )}
                      <div className="detail-item">
                        <span className="detail-label">Bairro:</span>
                        <span className="detail-value">{selectedStudent.address.neighborhood}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Cidade:</span>
                        <span className="detail-value">{selectedStudent.address.city}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Estado:</span>
                        <span className="detail-value">{selectedStudent.address.state}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">CEP:</span>
                        <span className="detail-value">{selectedStudent.address.zipCode}</span>
                      </div>
                    </div>
                  )}

                  <div className="detail-group">
                    <h5>Informações de Saúde</h5>
                    <div className="detail-item">
                      <span className="detail-label">Comorbidades:</span>
                      <span className="detail-value">{selectedStudent.comorbidities || 'Nenhuma informada'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Alergias:</span>
                      <span className="detail-value">{selectedStudent.allergies || 'Nenhuma informada'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Medicações:</span>
                      <span className="detail-value">{selectedStudent.medications || 'Nenhuma informada'}</span>
                    </div>
                  </div>

                  {selectedStudent.observations && (
                    <div className="detail-group">
                      <h5>Observações</h5>
                      <div className="detail-item">
                        <span className="detail-value observation-text">{selectedStudent.observations}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}


function SimplePlaceholder({ title }: { title: string }) {
  return (
    <Layout>
      <h1 className="title">{title}</h1>
      <div className="panel">
        <p>Esta tela será detalhada na próxima fase. O layout segue o protótipo e já está integrada ao menu e à navegação.</p>
        <ul>
          <li>Filtros de período/turma</li>
          <li>Tabela/lista de registros</li>
          <li>Ações de exportar/imprimir quando aplicável</li>
        </ul>
      </div>
    </Layout>
  )
}

function AtividadesTabs({ initial }: { initial?: 'MATERIA'|'MULTI'|'HISTORICO' }){
  const [tab, setTab] = useState<'MATERIA'|'MULTI'|'HISTORICO'>(initial ?? 'MATERIA')
  return (
    <Layout>
      <h1 className="title">Atividades</h1>
      <div className="tabs" style={{marginBottom:12}}>
        <button className={`tab ${tab==='MATERIA'?'active':''}`} onClick={()=>setTab('MATERIA')}>Matéria</button>
        <button className={`tab ${tab==='MULTI'?'active':''}`} onClick={()=>setTab('MULTI')}>Multidisciplinares</button>
        <button className={`tab ${tab==='HISTORICO'?'active':''}`} onClick={()=>setTab('HISTORICO')}>Histórico</button>
      </div>
      {tab==='MATERIA' ? <AtividadesMateria category="SUBJECT" /> : 
       tab==='MULTI' ? <AtividadesMateria category="MULTIDISCIPLINARY" /> : 
       <HistoricoAcademico type="atividades" embed />}
    </Layout>
  )
}
function AtividadesMultidisciplinares() { return <AtividadesTabs initial="MULTI" /> }

function ProjetosTabs({ initial }: { initial?: 'SUBJECT'|'MULTI'|'HISTORICO' }){
  const [tab, setTab] = useState<'SUBJECT'|'MULTI'|'HISTORICO'>(initial ?? 'SUBJECT')
  return (
    <Layout>
      <h1 className="title">Projetos</h1>
      <div className="tabs" style={{marginBottom:12}}>
        <button className={`tab ${tab==='SUBJECT'?'active':''}`} onClick={()=>setTab('SUBJECT')}>Matéria</button>
        <button className={`tab ${tab==='MULTI'?'active':''}`} onClick={()=>setTab('MULTI')}>Multidisciplinares</button>
        <button className={`tab ${tab==='HISTORICO'?'active':''}`} onClick={()=>setTab('HISTORICO')}>Histórico</button>
      </div>
      {tab==='HISTORICO' ? <HistoricoAcademico type="projetos" embed /> : <ProjetosPage type={tab==='SUBJECT'?'SUBJECT':'MULTIDISCIPLINARY'} />}
    </Layout>
  )
}
function ProjetosMateria() { return <ProjetosTabs initial="SUBJECT" /> }

function ProjetosMultidisciplinares() { return <ProjetosTabs initial="MULTI" /> }

function AvaliacoesTabs({ initial }: { initial?: 'DEV'|'EVO'|'HISTORICO' }) {
  const [tab, setTab] = useState<'DEV'|'EVO'|'HISTORICO'>(initial ?? 'DEV')
  return (
    <Layout>
      <h1 className="title">Avaliações</h1>
      <div className="tabs" style={{ marginBottom: 12 }}>
        <button className={`tab ${tab==='DEV'?'active':''}`} onClick={()=>setTab('DEV')}>Desenvolvimento do aluno</button>
        <button className={`tab ${tab==='EVO'?'active':''}`} onClick={()=>setTab('EVO')}>Evolutivas</button>
        <button className={`tab ${tab==='HISTORICO'?'active':''}`} onClick={()=>setTab('HISTORICO')}>Histórico</button>
      </div>
      {tab==='DEV' ? <AvaliacoesDesenvolvimento embed /> : 
       tab==='EVO' ? <AvaliacoesEvolutivas embed /> : 
       <HistoricoAcademico type="avaliacoes" embed />}
    </Layout>
  )
}

function AvaliacoesDesenvolvimento({ embed }: { embed?: boolean }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState('')
  const [students, setStudents] = useState<{ id: string; name: string }[]>([])
  const [studentId, setStudentId] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  useEffect(() => { (async () => { if (!classId) { setStudents([]); setStudentId(''); setText(''); return }
    const r = await api.get(`/classes/${classId}`)
    const sts = r.data.enrollments.map((e: any) => ({ id: e.student.id, name: e.student.name }))
    setStudents(sts); setStudentId(sts[0]?.id ?? '')
  })() }, [classId])
  useEffect(() => { (async () => { if (!classId || !studentId) { setText(''); return }
    const r = await api.get(`/classes/${classId}/planning`, { params: { kind: 'INDIVIDUAL', details: `dev:${studentId}`, discipline: 'Avaliação' } })
    setText(r.data?.content ?? '')
  })() }, [classId, studentId])
  const save = async () => {
    if (!classId || !studentId) return
    setSaving(true)
    try {
      await api.put(`/classes/${classId}/planning`, { kind: 'INDIVIDUAL', details: `dev:${studentId}`, title: 'Avaliação - Desenvolvimento', content: text, discipline: 'Avaliação' })
    } finally { setSaving(false) }
  }
  const body = (
    <>
      <h1 className="title">Avaliações – Desenvolvimento do aluno</h1>
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div>Aluno:</div>
          <select className="select" value={studentId} onChange={e=>setStudentId(e.target.value)} disabled={!classId}>
            <option value="">-- escolha --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="panel">
        <textarea className="textarea" placeholder="Descreva o desenvolvimento do aluno..." value={text} onChange={e=>setText(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={save} disabled={!classId || !studentId || saving}>Salvar</button>
        </div>
      </div>
    </>
  )
  return embed ? body : <Layout>{body}</Layout>
}

type Project = { id: string; title: string; description?: string; audience?: string; status: 'PLANNING'|'IN_PROGRESS'|'COMPLETED'|'ON_HOLD'|'CANCELLED'; type: 'SUBJECT'|'MULTIDISCIPLINARY'; startDate?: string|null; endDate?: string|null }
type Milestone = { id: string; title: string; dueDate?: string|null; done: boolean; notes?: string }

function ProjetosPage({ type }: { type: 'SUBJECT'|'MULTIDISCIPLINARY' }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState('')
  const [items, setItems] = useState<Project[]>([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [audience, setAudience] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [status, setStatus] = useState<Project['status']>('PLANNING')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({})
  const [msTitle, setMsTitle] = useState('')
  const [msDue, setMsDue] = useState('')
  const [msNotes, setMsNotes] = useState('')
  const [showDisciplineModal, setShowDisciplineModal] = useState(false)
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])
  const [availableDisciplines] = useState(['Artes', 'Português', 'Matemática', 'História', 'Geografia', 'Ciências', 'Inglês', 'Educação Física'])

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  const load = async (cid: string) => {
    if (!cid) return
    const r = await api.get(`/classes/${cid}/projects`, { params: { type } })
    setItems(r.data)
  }
  useEffect(() => { if (classId) load(classId) }, [classId, type])

  const create = async () => {
    if (!classId || !title.trim()) return
    
    const disciplineValue = type === 'MULTIDISCIPLINARY' && selectedDisciplines.length > 0 
      ? selectedDisciplines.join(', ') 
      : undefined
    
    await api.post(`/classes/${classId}/projects`, { 
      title, 
      description: desc, 
      type, 
      audience, 
      startDate: start || null, 
      endDate: end || null,
      disciplines: disciplineValue
    })
    
    setTitle(''); setDesc(''); setAudience(''); setStart(''); setEnd(''); setStatus('PLANNING')
    if (type === 'MULTIDISCIPLINARY') {
      setSelectedDisciplines([])
    }
    await load(classId)
  }

  const toggleDiscipline = (disc: string) => {
    setSelectedDisciplines(prev => 
      prev.includes(disc) 
        ? prev.filter(d => d !== disc)
        : [...prev, disc]
    )
  }

  const openDisciplineModal = () => {
    if (type === 'MULTIDISCIPLINARY') {
      setShowDisciplineModal(true)
    }
  }

  const closeDisciplineModal = () => {
    setShowDisciplineModal(false)
  }

  const getDisciplineDisplay = () => {
    if (type === 'MULTIDISCIPLINARY' && selectedDisciplines.length > 0) {
      return selectedDisciplines.join(', ')
    }
    return ''
  }
  const update = async (p: Project, patch: Partial<Project>) => {
    const upd = { ...p, ...patch }
    await api.put(`/projects/${p.id}`, upd)
    await load(classId)
  }
  const remove = async (id: string) => { await api.delete(`/projects/${id}`); await load(classId) }
  const toggleExpand = async (p: Project) => {
    if (expanded === p.id) { setExpanded(null); return }
    setExpanded(p.id)
    const r = await api.get(`/projects/${p.id}/milestones`)
    setMilestones(prev => ({ ...prev, [p.id]: r.data }))
  }
  const addMilestone = async (p: Project) => {
    if (!msTitle.trim()) return
    const created = await api.post(`/projects/${p.id}/milestones`, { title: msTitle, dueDate: msDue || null, notes: msNotes || undefined })
    setMilestones(prev => ({ ...prev, [p.id]: [ ...(prev[p.id] || []), created.data ] }))
    setMsTitle(''); setMsDue(''); setMsNotes('')
  }
  const updateMilestone = async (p: Project, m: Milestone, patch: Partial<Milestone>) => {
    const upd = { ...m, ...patch }
    const r = await api.put(`/projects/${p.id}/milestones/${m.id}`, upd)
    setMilestones(prev => ({ ...prev, [p.id]: (prev[p.id]||[]).map(x => x.id===m.id ? r.data : x) }))
  }
  const delMilestone = async (p: Project, m: Milestone) => {
    await api.delete(`/projects/${p.id}/milestones/${m.id}`)
    setMilestones(prev => ({ ...prev, [p.id]: (prev[p.id]||[]).filter(x => x.id!==m.id) }))
  }
  const exportCsv = () => {
    const rows = items.map(p => ({
      Titulo: p.title,
      Status: p.status,
      Inicio: p.startDate ? new Date(p.startDate).toLocaleDateString() : '',
      Fim: p.endDate ? new Date(p.endDate).toLocaleDateString() : ''
    }))
    const csv = ['Titulo,Status,Inicio,Fim'].concat(rows.map(r => `${JSON.stringify(r.Titulo)},${r.Status},${JSON.stringify(r.Inicio)},${JSON.stringify(r.Fim)}`)).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'projetos.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const statusPill = (s: Project['status']) => {
    const map: Record<Project['status'], { text: string; cls: string }> = {
      PLANNING: { text: 'Planejamento', cls: 'pill yellow' },
      IN_PROGRESS: { text: 'Em andamento', cls: 'pill blue' },
      COMPLETED: { text: 'Concluído', cls: 'pill green' },
      ON_HOLD: { text: 'Em espera', cls: 'pill orange' },
      CANCELLED: { text: 'Cancelado', cls: 'pill red' }
    }
    const it = map[s]
    return <span className={it.cls} style={{ marginLeft: 8 }}>{it.text}</span>
  }

  return (
    <>
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="card">
        <div className="form-grid">
          <div className="field"><label>Título</label><input className="input" placeholder="Ex.: Semana da Leitura" value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div className="field"><label>Descrição</label><input className="input" placeholder="Resumo do projeto" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
          <div className="field"><label>Público-alvo</label><input className="input" placeholder="Alunos do 5º ano" value={audience} onChange={e=>setAudience(e.target.value)} /></div>
          {type === 'MULTIDISCIPLINARY' && (
            <div className="field">
              <label>Disciplinas</label>
              <div className="discipline-input-container">
                <input 
                  className="input" 
                  readOnly 
                  placeholder="Clique para selecionar disciplinas..." 
                  value={getDisciplineDisplay()}
                  onClick={openDisciplineModal}
                  style={{ cursor: 'pointer' }}
                />
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={openDisciplineModal}
                  style={{ marginLeft: 8 }}
                >
                  Selecionar
                </button>
              </div>
            </div>
          )}
          <div className="field"><label>Início</label><input className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} /></div>
          <div className="field"><label>Fim</label><input className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} /></div>
          <div className="field"><label>Status</label>
            <div style={{ display:'flex', alignItems:'center' }}>
              <select className="select" value={status} onChange={e=>setStatus(e.target.value as Project['status'])} disabled>
                <option value="PLANNING">Em planejamento</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="COMPLETED">Concluído</option>
                <option value="ON_HOLD">Em espera</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
              {statusPill(status)}
            </div>
          </div>
        </div>
        <div className="form-row"><button className="btn" onClick={create} disabled={!classId}>Adicionar projeto</button></div>
  <div className="form-row"><button className="btn btn-outline" onClick={exportCsv} disabled={!items.length}>Exportar CSV</button></div>
  <table className="table">
          <thead><tr><th>Título</th><th>Status</th><th>Início</th><th>Fim</th><th>Ações</th></tr></thead>
          <tbody>
            {items.map(p => (
              <>
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <select className="select" value={p.status} onChange={e=>update(p,{ status: e.target.value as Project['status'] })}>
                      <option value="PLANNING">Em planejamento</option>
                      <option value="IN_PROGRESS">Em andamento</option>
                      <option value="COMPLETED">Concluído</option>
                      <option value="ON_HOLD">Em espera</option>
                      <option value="CANCELLED">Cancelado</option>
                      </select>
                      {statusPill(p.status)}
                    </div>
                  </td>
                  <td>{p.startDate ? new Date(p.startDate).toLocaleDateString() : '-'}</td>
                  <td>{p.endDate ? new Date(p.endDate).toLocaleDateString() : '-'}</td>
                  <td style={{display:'flex',gap:8}}>
                    <button className="btn btn-outline" onClick={()=>toggleExpand(p)}>Marcos</button>
                    <button className="btn btn-outline" onClick={()=>remove(p.id)}>Excluir</button>
                  </td>
                </tr>
                {expanded===p.id && (
                  <tr>
                    <td colSpan={5}>
                      <div className="card">
                        <div className="form-row">
                          <input className="input" placeholder="Título do marco" value={msTitle} onChange={e=>setMsTitle(e.target.value)} />
                          <input className="input" type="date" value={msDue} onChange={e=>setMsDue(e.target.value)} />
                          <input className="input" placeholder="Notas" value={msNotes} onChange={e=>setMsNotes(e.target.value)} />
                          <button className="btn" onClick={()=>addMilestone(p)}>Adicionar marco</button>
                        </div>
                        <table className="table">
                          <thead><tr><th>Título</th><th>Vencimento</th><th>Concluído</th><th>Ações</th></tr></thead>
                          <tbody>
                            {(milestones[p.id]||[]).map(m => (
                              <tr key={m.id}>
                                <td>{m.title}</td>
                                <td>{m.dueDate ? new Date(m.dueDate).toLocaleDateString() : '-'}</td>
                                <td>
                                  <input type="checkbox" checked={m.done} onChange={e=>updateMilestone(p, m, { done: e.target.checked })} />
                                </td>
                                <td>
                                  <button className="btn btn-outline" onClick={()=>delMilestone(p,m)}>Excluir</button>
                                </td>
                              </tr>
                            ))}
                            {!milestones[p.id]?.length && <tr><td colSpan={4} style={{textAlign:'center',color:'#666'}}>Nenhum marco</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {items.length===0 && <tr><td colSpan={5} style={{textAlign:'center',color:'#666'}}>Nenhum projeto</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal de seleção de disciplinas */}
      {showDisciplineModal && (
        <div className="modal-overlay" onClick={closeDisciplineModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selecionar Disciplinas</h3>
              <button className="modal-close" onClick={closeDisciplineModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="discipline-list">
                {availableDisciplines.map(disc => (
                  <label key={disc} className="discipline-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDisciplines.includes(disc)}
                      onChange={() => toggleDiscipline(disc)}
                    />
                    <span className="checkmark"></span>
                    {disc}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeDisciplineModal}>
                Cancelar
              </button>
              <button className="btn" onClick={closeDisciplineModal}>
                Confirmar ({selectedDisciplines.length} selecionadas)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function AvaliacoesEvolutivas({ embed }: { embed?: boolean }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState('')
  const [students, setStudents] = useState<{ id: string; name: string }[]>([])
  const [studentId, setStudentId] = useState('')
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  useEffect(() => { (async () => { if (!classId) { setStudents([]); setStudentId(''); setText(''); return }
    const r = await api.get(`/classes/${classId}`)
    const sts = r.data.enrollments.map((e: any) => ({ id: e.student.id, name: e.student.name }))
    setStudents(sts); setStudentId(sts[0]?.id ?? '')
  })() }, [classId])
  useEffect(() => { (async () => { if (!classId || !studentId) { setText(''); return }
    const r = await api.get(`/classes/${classId}/planning`, { params: { kind: 'INDIVIDUAL', details: `evo:${studentId}`, discipline: 'Avaliação' } })
    setText(r.data?.content ?? '')
  })() }, [classId, studentId])
  const save = async () => {
    if (!classId || !studentId) return
    setSaving(true)
    try {
      await api.put(`/classes/${classId}/planning`, { kind: 'INDIVIDUAL', details: `evo:${studentId}`, title: 'Avaliação – Evolutiva', content: text, discipline: 'Avaliação' })
    } finally { setSaving(false) }
  }
  const body = (
    <>
      <h1 className="title">Avaliações – Evolutivas</h1>
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div>Aluno:</div>
          <select className="select" value={studentId} onChange={e=>setStudentId(e.target.value)} disabled={!classId}>
            <option value="">-- escolha --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="panel">
        <textarea className="textarea" placeholder="Avaliação evolutiva do aluno..." value={text} onChange={e=>setText(e.target.value)} />
        <div style={{ marginTop: 8 }}>
          <button className="btn" onClick={save} disabled={!classId || !studentId || saving}>Salvar</button>
        </div>
      </div>
    </>
  )
  return embed ? body : <Layout>{body}</Layout>
}

function FaltasHistoricos({ embed }: { embed?: boolean }) {
  type Day = { id: string; date: string; records: { studentId: string; status: 'PRESENT'|'ABSENT'|'JUSTIFIED'|'LATE' }[] }
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [from, setFrom] = useState<string>('')
  const [to, setTo] = useState<string>('')
  const [days, setDays] = useState<Day[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])

  const search = async () => {
    if (!classId) return
    setLoading(true)
    try {
      const r = await api.get(`/classes/${classId}/attendance/history`, { params: { from, to } })
      setDays(r.data)
    } finally { setLoading(false) }
  }

  const totals = useMemo(() => {
    const sum = { PRESENT: 0, ABSENT: 0, JUSTIFIED: 0, LATE: 0 }
    for (const d of days) for (const rec of d.records) (sum as any)[rec.status]++
    return sum
  }, [days])

  const body = (
      <>
      <h1 className="title">Históricos de frequência</h1>
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div>De:</div>
          <input className="input" type="date" value={from} onChange={e=>setFrom(e.target.value)} />
        </div>
        <div>
          <div>Até:</div>
          <input className="input" type="date" value={to} onChange={e=>setTo(e.target.value)} />
        </div>
        <div style={{ alignSelf:'end' }}>
          <button className="btn" onClick={search} disabled={!classId || loading}>Buscar</button>
        </div>
      </div>

      <div className="panel">
        <div style={{display:'flex',gap:16,flexWrap:'wrap'}}>
          <strong>Totais:</strong>
          <span>Presenças: {totals.PRESENT}</span>
          <span>Ausências: {totals.ABSENT}</span>
          <span>Justificadas: {totals.JUSTIFIED}</span>
          <span>Atrasos: {totals.LATE}</span>
        </div>
      </div>

      <div className="card" style={{marginTop:12}}>
        {loading ? 'Carregando...' : (
          <table className="table">
            <thead>
              <tr><th>Data</th><th>Presenças</th><th>Ausências</th><th>Justificadas</th><th>Atrasos</th></tr>
            </thead>
            <tbody>
              {days.map(d => {
                const pres = d.records.filter(r=>r.status==='PRESENT').length
                const abs = d.records.filter(r=>r.status==='ABSENT').length
                const jus = d.records.filter(r=>r.status==='JUSTIFIED').length
                const late = d.records.filter(r=>r.status==='LATE').length
                return (
                  <tr key={d.id}>
                    <td>{new Date(d.date).toLocaleDateString()}</td>
                    <td>{pres}</td>
                    <td>{abs}</td>
                    <td>{jus}</td>
                    <td>{late}</td>
                  </tr>
                )
              })}
              {days.length===0 && (
                <tr><td colSpan={5} style={{textAlign:'center',color:'#666'}}>Sem registros no período</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      </>
  )
  return embed ? body : <Layout>{body}</Layout>
}

function AtividadesMateria({ category }: { category?: 'SUBJECT'|'MULTIDISCIPLINARY'|'PROJECT_SUBJECT'|'PROJECT_MULTIDISCIPLINARY' }) {
  type Activity = { id: string; title: string; description?: string; dueDate?: string|null; maxScore: number; discipline?: string; topic?: string; methodology?: string; content?: string; observations?: string }
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [items, setItems] = useState<Activity[]>([])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [due, setDue] = useState('')
  const [max, setMax] = useState<number>(10)
  const [discipline, setDiscipline] = useState('')
  const [topic, setTopic] = useState('')
  const [methodology, setMethodology] = useState('')
  const [content, setContent] = useState('')
  const [observations, setObservations] = useState('')
  const [difficultyList, setDifficultyList] = useState<{ id: string; type: string }[]>([])
  const [difficultyId, setDifficultyId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [tab, setTab] = useState<'relatos'|'notas'>('relatos')
  const [elabList, setElabList] = useState<Record<string, { id: string; text: string; userId: string; createdAt: string }[]>>({})
  const [elabText, setElabText] = useState('')
  const [gradeRows, setGradeRows] = useState<{ studentId: string; name: string; score: number; feedback?: string }[]>([])
  const [showDisciplineModal, setShowDisciplineModal] = useState(false)
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])
  const [availableDisciplines] = useState(['Artes', 'Português', 'Matemática', 'História', 'Geografia', 'Ciências', 'Inglês', 'Educação Física'])

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data); const d = await api.get('/difficulties'); setDifficultyList(d.data) })() }, [])
  const load = async (cid: string) => {
    if (!cid) return; setLoading(true);
    try {
      const cat = category || 'SUBJECT'
      const r = await api.get(`/classes/${cid}/activities`, { params: { category: cat, discipline: discipline || undefined } });
      setItems(r.data)
    } finally { setLoading(false) }
  }
  useEffect(() => { if (classId) load(classId) }, [classId, category])

  const create = async () => {
    if (!classId || !title.trim()) return
    
    const disciplineValue = category === 'MULTIDISCIPLINARY' && selectedDisciplines.length > 0 
      ? selectedDisciplines.join(', ') 
      : discipline || undefined
    
    await api.post(`/classes/${classId}/activities`, { 
      title, 
      description: desc, 
      dueDate: due || null, 
      maxScore: max,
      discipline: disciplineValue, 
      topic: topic || undefined, 
      methodology: methodology || undefined, 
      content: content || undefined, 
      observations: observations || undefined,
      difficultyId: difficultyId || undefined, 
      category: category || 'SUBJECT' 
    })
    
    setTitle(''); setDesc(''); setDue(''); setMax(10); setDiscipline(''); setTopic(''); setMethodology(''); setContent(''); setObservations(''); setDifficultyId(''); 
    if (category === 'MULTIDISCIPLINARY') {
      setSelectedDisciplines([])
    }
    await load(classId)
  }
  const remove = async (id: string) => { await api.delete(`/activities/${id}`); await load(classId) }
  const refresh = async () => load(classId)
  const exportCsv = () => {
    const rows = items.map(a => ({
      Titulo: a.title,
      Disciplina: a.discipline ?? '',
      Vencimento: a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '',
      NotaMax: a.maxScore
    }))
    const csv = ['Titulo,Disciplina,Vencimento,NotaMax'].concat(rows.map(r => `${JSON.stringify(r.Titulo)},${JSON.stringify(r.Disciplina)},${JSON.stringify(r.Vencimento)},${r.NotaMax}`)).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'atividades.csv'; a.click(); URL.revokeObjectURL(url)
  }

  const toggleExpand = async (a: Activity, which: 'relatos'|'notas') => {
    setTab(which)
    if (expandedId === a.id && tab === which) { setExpandedId(null); return }
    setExpandedId(a.id)
    if (which === 'relatos') {
      const r = await api.get(`/activities/${a.id}/elaborations`)
      setElabList(prev => ({ ...prev, [a.id]: r.data }))
      setElabText('')
    } else {
      // notas: load class enrollments and existing grades
      const r = await api.get(`/classes/${classId}`)
      const students: { id: string; name: string }[] = r.data.enrollments.map((e: any) => ({ id: e.student.id, name: e.student.name }))
  const g = await api.get(`/activities/${a.id}/grades`)
  const map: Map<string, any> = new Map((g.data as any[]).map((x: any) => [x.studentId, x]))
  setGradeRows(students.map(s => ({ studentId: s.id, name: s.name, score: (map.get(s.id) as any)?.score ?? 0 })))
    }
  }

  const addElaboration = async (activityId: string) => {
    if (!elabText.trim()) return
    const r = await api.post(`/activities/${activityId}/elaborations`, { text: elabText })
    setElabList(prev => ({ ...prev, [activityId]: [r.data, ...(prev[activityId] || [])] }))
    setElabText('')
  }

  const saveGrades = async (activityId: string) => {
    const payload = gradeRows.map(r => ({ studentId: r.studentId, score: Number(r.score) }))
    await api.put(`/activities/${activityId}/grades`, payload)
  }

  const toggleDiscipline = (disc: string) => {
    setSelectedDisciplines(prev => 
      prev.includes(disc) 
        ? prev.filter(d => d !== disc)
        : [...prev, disc]
    )
  }

  const openDisciplineModal = () => {
    if (category === 'MULTIDISCIPLINARY') {
      setShowDisciplineModal(true)
    }
  }

  const closeDisciplineModal = () => {
    setShowDisciplineModal(false)
  }

  const getDisciplineDisplay = () => {
    if (category === 'MULTIDISCIPLINARY' && selectedDisciplines.length > 0) {
      return selectedDisciplines.join(', ')
    }
    return discipline || ''
  }

  return (
    <>
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div>Disciplina{category === 'MULTIDISCIPLINARY' ? 's' : ''}:</div>
          {category === 'MULTIDISCIPLINARY' ? (
            <div className="discipline-input-container">
              <input 
                className="input" 
                readOnly 
                placeholder="Clique para selecionar disciplinas..." 
                value={getDisciplineDisplay()}
                onClick={openDisciplineModal}
                style={{ cursor: 'pointer' }}
              />
              <button 
                type="button" 
                className="btn btn-outline" 
                onClick={openDisciplineModal}
                style={{ marginLeft: 8 }}
              >
                Selecionar
              </button>
            </div>
          ) : (
            <select className="select" value={discipline} onChange={e=>setDiscipline(e.target.value)}>
              <option value="">(todas)</option>
              <option>Artes</option><option>Português</option><option>Matemática</option>
            </select>
          )}
        </div>
        <div style={{alignSelf:'end'}}>
          <button className="btn btn-outline" onClick={refresh} disabled={!classId}>Atualizar</button>
        </div>
      </div>
      <div className="card">
        <div className="form-grid">
          <div className="field"><label>Título</label><input className="input" placeholder="Ex.: Lista de multiplicação" value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div className="field"><label>Descrição</label><input className="input" placeholder="Descrição breve" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
          <div className="field"><label>Tema</label><input className="input" placeholder="Tema" value={topic} onChange={e=>setTopic(e.target.value)} /></div>
          <div className="field"><label>Metodologia</label><input className="input" placeholder="Metodologia" value={methodology} onChange={e=>setMethodology(e.target.value)} /></div>
          <div className="field"><label>Conteúdo</label><input className="input" placeholder="Conteúdo" value={content} onChange={e=>setContent(e.target.value)} /></div>
          <div className="field"><label>Vencimento</label><input className="input" type="date" value={due} onChange={e=>setDue(e.target.value)} /></div>
          <div className="field"><label>Nota máx.</label><input className="input" style={{width:120}} type="number" min={1} max={100} value={max} onChange={e=>setMax(Number(e.target.value))} /></div>
          <div className="field"><label>Dificuldade</label><select className="select" value={difficultyId} onChange={e=>setDifficultyId(e.target.value)}>
            <option value="">Selecione</option>
            {difficultyList.map(d => <option key={d.id} value={d.id}>{d.type}</option>)}
          </select></div>
          <div className="field" style={{gridColumn:'1 / -1'}}><label>Observações</label><input className="input" placeholder="Observações" value={observations} onChange={e=>setObservations(e.target.value)} /></div>
        </div>
        <div className="form-row">
          <button className="btn" onClick={create} disabled={!classId}>Adicionar</button>
          <button className="btn btn-outline" onClick={exportCsv} disabled={!items.length}>Exportar CSV</button>
        </div>
        {loading ? 'Carregando...' : (
          <table className="table">
            <thead><tr><th>Título</th><th>Disciplina</th><th>Vencimento</th><th>Nota máx.</th><th>Ações</th></tr></thead>
            <tbody>
              {items.map(a => (
                <>
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td>{a.discipline ?? '-'}</td>
                    <td>{a.dueDate ? new Date(a.dueDate).toLocaleDateString() : '-'}</td>
                    <td>{a.maxScore}</td>
                    <td style={{display:'flex',gap:8}}>
                      <button className="btn btn-outline" onClick={()=>toggleExpand(a,'relatos')}>Relatos</button>
                      <button className="btn btn-outline" onClick={()=>toggleExpand(a,'notas')}>Notas</button>
                      <button className="btn btn-outline" onClick={()=>remove(a.id)}>Excluir</button>
                    </td>
                  </tr>
                  {expandedId === a.id && (
                    <tr>
                      <td colSpan={5}>
                        <div className="card">
                          <div className="tabs">
                            <button className={`tab ${tab==='relatos'?'active':''}`} onClick={()=>toggleExpand(a,'relatos')}>Relatos</button>
                            <button className={`tab ${tab==='notas'?'active':''}`} onClick={()=>toggleExpand(a,'notas')}>Notas</button>
                          </div>
                          {tab==='relatos' ? (
                            <div style={{marginTop:12}}>
                              <div className="form-row">
                                <textarea className="textarea" placeholder="Adicionar relato de desenvolvimento..." value={elabText} onChange={e=>setElabText(e.target.value)} />
                              </div>
                              <div><button className="btn" onClick={()=>addElaboration(a.id)}>Adicionar relato</button></div>
                              <div style={{marginTop:12}}>
                                {(elabList[a.id]||[]).map(el => (
                                  <div key={el.id} style={{padding:'8px 0', borderBottom:'1px solid #eee'}}>
                                    <div style={{fontSize:12,color:'#666'}}>{new Date(el.createdAt).toLocaleString()}</div>
                                    <div>{el.text}</div>
                                  </div>
                                ))}
                                {!elabList[a.id]?.length && <div style={{color:'#666'}}>Sem relatos ainda.</div>}
                              </div>
                            </div>
                          ) : (
                            <div style={{marginTop:12}}>
                              <table className="table">
                                <thead><tr><th>Aluno</th><th>Nota</th></tr></thead>
                                <tbody>
                                  {gradeRows.map(gr => (
                                    <tr key={gr.studentId}>
                                      <td>{gr.name}</td>
                                      <td><input className="input" style={{width:120}} type="number" min={0} max={100} value={gr.score} onChange={e=>setGradeRows(rows=>rows.map(r=>r.studentId===gr.studentId?{...r, score: Number(e.target.value)}:r))} /></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div><button className="btn" onClick={()=>saveGrades(a.id)}>Salvar notas</button></div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {items.length===0 && <tr><td colSpan={5} style={{textAlign:'center',color:'#666'}}>Nenhuma atividade</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de seleção de disciplinas */}
      {showDisciplineModal && (
        <div className="modal-overlay" onClick={closeDisciplineModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Selecionar Disciplinas</h3>
              <button className="modal-close" onClick={closeDisciplineModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="discipline-list">
                {availableDisciplines.map(disc => (
                  <label key={disc} className="discipline-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedDisciplines.includes(disc)}
                      onChange={() => toggleDiscipline(disc)}
                    />
                    <span className="checkmark"></span>
                    {disc}
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={closeDisciplineModal}>
                Cancelar
              </button>
              <button className="btn" onClick={closeDisciplineModal}>
                Confirmar ({selectedDisciplines.length} selecionadas)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function FaltasPage({ initialTab }: { initialTab?: 'diario'|'observacoes'|'historicos' }) {
  const [tab, setTab] = useState<'diario'|'observacoes'|'historicos'>(initialTab ?? 'diario')
  return (
    <Layout>
      <h1 className="title">Registro de faltas</h1>
      <div className="tabs">
        <button className={`tab ${tab==='diario'?'active':''}`} onClick={()=>setTab('diario')}>Diário</button>
        <button className={`tab ${tab==='observacoes'?'active':''}`} onClick={()=>setTab('observacoes')}>Observações</button>
        <button className={`tab ${tab==='historicos'?'active':''}`} onClick={()=>setTab('historicos')}>Históricos</button>
      </div>
      <div style={{ marginTop: 12 }}>
        {tab==='diario' && <FaltasDiario embed />}
        {tab==='observacoes' && <FaltasObservacoes embed />}
        {tab==='historicos' && <FaltasHistoricos embed />}
      </div>
    </Layout>
  )
}

function PlanningPage({ initialTab }: { initialTab?: 'anual'|'semestral'|'individual' }) {
  const [tab, setTab] = useState<'anual'|'semestral'|'individual'>(initialTab ?? 'anual')
  return (
    <Layout>
      <h1 className="title">Planejamento</h1>
      <div className="tabs">
        <button className={`tab ${tab==='anual'?'active':''}`} onClick={()=>setTab('anual')}>Anual</button>
        <button className={`tab ${tab==='semestral'?'active':''}`} onClick={()=>setTab('semestral')}>Semestral</button>
        <button className={`tab ${tab==='individual'?'active':''}`} onClick={()=>setTab('individual')}>Individual</button>
      </div>
      <div style={{ marginTop: 12 }}>
        {tab==='anual' && <PlanejamentoAnual embed />}
        {tab==='semestral' && <PlanejamentoSemestral embed />}
        {tab==='individual' && <PlanejamentoIndividual embed />}
      </div>
    </Layout>
  )
}

function FaltasObservacoes({ embed }: { embed?: boolean }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState('')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [dayId, setDayId] = useState<string>('')
  const [rows, setRows] = useState<{ studentId: string; name: string; status: 'PRESENT'|'ABSENT'|'JUSTIFIED'|'LATE'; observation?: string }[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])

  const load = async () => {
    if (!classId || !date) return
    // reuse the GET /classes/:id/attendance to create/find the day and get enrolled students
    const r = await api.get(`/classes/${classId}/attendance`, { params: { date } })
    const day = r.data as { id: string; class: { enrollments: { student: { id: string; name: string } }[] }; records: { studentId: string; status: any; observation?: string }[] }
    const recMap = new Map(day.records.map(x => [x.studentId, x]))
    setDayId(day.id)
    setRows(day.class.enrollments.map(e => ({
      studentId: e.student.id, name: e.student.name,
      status: (recMap.get(e.student.id)?.status ?? 'PRESENT'),
      observation: recMap.get(e.student.id)?.observation ?? ''
    })))
  }

  useEffect(() => { load() }, [classId, date])

  const updateRow = (sid: string, patch: Partial<{ status: 'PRESENT'|'ABSENT'|'JUSTIFIED'|'LATE'; observation: string }>) => {
    setRows(rs => rs.map(r => r.studentId === sid ? { ...r, ...patch } : r))
  }

  const saveAll = async () => {
    if (!dayId) return
    setSaving(true)
    try {
  await api.put(`/attendance/days/${dayId}/records`, rows.map(r => ({ studentId: r.studentId, status: r.status, observation: r.observation })) )
    } finally { setSaving(false) }
  }

  const body = (
      <>
      <h1 className="title">Observações de frequência</h1>
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div>Data:</div>
          <input className="input" type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Aluno</th><th>Status</th><th>Observação</th></tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.studentId}>
                <td>{r.name}</td>
                <td>
                  <select className="select" value={r.status} onChange={e=>updateRow(r.studentId, { status: e.target.value as any })}>
                    <option value="PRESENT">Presente</option>
                    <option value="ABSENT">Ausente</option>
                    <option value="JUSTIFIED">Justificada</option>
                    <option value="LATE">Atraso</option>
                  </select>
                </td>
                <td><input className="input" value={r.observation ?? ''} onChange={e=>updateRow(r.studentId,{ observation: e.target.value })} /></td>
              </tr>
            ))}
            {rows.length===0 && (<tr><td colSpan={3} style={{textAlign:'center',color:'#666'}}>Selecione turma e data</td></tr>)}
          </tbody>
        </table>
        <div style={{ paddingTop: 12 }}>
          <button className="btn" onClick={saveAll} disabled={!dayId || saving}>Salvar observações</button>
        </div>
      </div>
      </>
  )
  return embed ? body : <Layout>{body}</Layout>
}

function HistoricoAcademico({ type, embed }: { type?: 'atividades'|'projetos'|'avaliacoes'; embed?: boolean }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState(type || 'todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [photos, setPhotos] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<string>('')

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])
  
  const loadHistorico = async (cid: string) => {
    if (!cid) return
    setLoading(true)
    try {
      setItems([])
      // Em caso de erro na API, usar dados mockados
      const mockData = [
        { id: '1', title: 'Projeto da Feira de Ciências', type: 'projeto', completedAt: '2024-09-15', description: 'Projeto multidisciplinar sobre meio ambiente' },
        { id: '2', title: 'Avaliação de Matemática - 2º Bimestre', type: 'avaliacao', completedAt: '2024-09-10', maxScore: 10, averageScore: 8.5 },
        { id: '3', title: 'Atividade de Leitura - Dom Casmurro', type: 'atividade', completedAt: '2024-09-08', discipline: 'Português' },
        { id: '4', title: 'Experimento de Física - Densidade', type: 'atividade', completedAt: '2024-09-05', discipline: 'Ciências' },
        { id: '5', title: 'Projeto Cultural - Folclore Brasileiro', type: 'projeto', completedAt: '2024-08-30', description: 'Resgate das tradições culturais brasileiras' }
      ]
      
      let filteredData = mockData
      if (typeFilter !== 'todos') {
        filteredData = mockData.filter(item => {
          if (typeFilter === 'atividades') return item.type === 'atividade'
          if (typeFilter === 'projetos') return item.type === 'projeto'
          if (typeFilter === 'avaliacoes') return item.type === 'avaliacao'
          return true
        })
      }
      setItems(filteredData)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (classId) loadHistorico(classId) 
  }, [classId, typeFilter])

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (item.discipline && item.discipline.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesDate = !dateFilter || (item.completedAt && item.completedAt.startsWith(dateFilter))
    
    return matchesSearch && matchesDate
  })

  const openPhotoModal = (itemId: string) => {
    setCurrentItemId(itemId)
    setShowPhotoModal(true)
  }

  const closePhotoModal = () => {
    setShowPhotoModal(false)
    setCurrentItemId('')
  }

  const uploadPhoto = async (file: File) => {
    if (!currentItemId) return
    
    try {
      // Simular upload - em produção seria uma chamada real à API
      const mockUrl = URL.createObjectURL(file)
      setPhotos(prev => ({
        ...prev,
        [currentItemId]: [...(prev[currentItemId] || []), mockUrl]
      }))
    } catch (error) {
      console.error('Erro ao fazer upload da foto:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'atividade': return 'A'
      case 'projeto': return 'P'
      case 'avaliacao': return 'Av'
      default: return 'I'
    }
  }

  const getTypeName = (type: string) => {
    switch (type) {
      case 'atividade': return 'Atividade'
      case 'projeto': return 'Projeto'
      case 'avaliacao': return 'Avaliação'
      default: return 'Item'
    }
  }

  const body = (
    <>
      <h1 className="title">Histórico Acadêmico</h1>
      
      {/* Filtros */}
      <div className="form-row">
        <div>
          <div>Turma:</div>
          <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <div>Tipo:</div>
          <select className="select" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}>
            <option value="todos">Todos</option>
            <option value="atividades">Atividades</option>
            <option value="projetos">Projetos</option>
            <option value="avaliacoes">Avaliações</option>
          </select>
        </div>
        <div>
          <div>Período:</div>
          <input className="input" type="month" value={dateFilter} onChange={e=>setDateFilter(e.target.value)} />
        </div>
        <div>
          <div>Buscar:</div>
          <input className="input" placeholder="Título, descrição..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
        </div>
      </div>

      {/* Lista do histórico */}
      <div className="panel">
        {loading ? (
          <div style={{textAlign:'center',padding:40,color:'#666'}}>Carregando histórico...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{textAlign:'center',padding:40,color:'#666'}}>
            {classId ? 'Nenhum registro encontrado' : 'Selecione uma turma para ver o histórico'}
          </div>
        ) : (
          <div className="historico-grid">
            {filteredItems.map(item => (
              <div key={item.id} className="historico-card">
                <div className="historico-header">
                  <span className="historico-icon">{getTypeIcon(item.type)}</span>
                  <span className="historico-type">{getTypeName(item.type)}</span>
                  <span className="historico-date">
                    {item.completedAt ? new Date(item.completedAt).toLocaleDateString() : '-'}
                  </span>
                </div>
                
                <h3 className="historico-title">{item.title}</h3>
                
                {item.description && (
                  <p className="historico-description">{item.description}</p>
                )}
                
                {item.discipline && (
                  <div className="historico-meta">
                    <strong>Disciplina:</strong> {item.discipline}
                  </div>
                )}
                
                {item.maxScore && (
                  <div className="historico-meta">
                    <strong>Nota máxima:</strong> {item.maxScore}
                    {item.averageScore && <span> | <strong>Média:</strong> {item.averageScore}</span>}
                  </div>
                )}

                {/* Fotos */}
                <div className="historico-photos">
                  {photos[item.id]?.map((photo, index) => (
                    <img 
                      key={index} 
                      src={photo} 
                      className="historico-photo" 
                      alt={`Foto ${index + 1}`}
                      onClick={() => window.open(photo, '_blank')}
                    />
                  ))}
                </div>

                <div className="historico-actions">
                  <button 
                    className="btn btn-outline"
                    onClick={() => openPhotoModal(item.id)}
                  >
                    Adicionar Foto
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de upload de foto */}
      {showPhotoModal && (
        <div className="modal-overlay" onClick={closePhotoModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Adicionar Foto</h3>
              <button className="modal-close" onClick={closePhotoModal}>×</button>
            </div>
            <div className="modal-body">
              <div style={{textAlign:'center',padding:20}}>
                <label className="btn" style={{cursor:'pointer'}}>
                  Selecionar Foto
                  <input 
                    type="file" 
                    accept="image/*" 
                    style={{display:'none'}} 
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        uploadPhoto(file)
                        closePhotoModal()
                      }
                    }}
                  />
                </label>
                <p style={{color:'#666',marginTop:10,fontSize:14}}>
                  Selecione uma imagem relacionada a este registro acadêmico
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
  
  return embed ? body : <Layout>{body}</Layout>
}
