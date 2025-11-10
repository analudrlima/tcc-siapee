import { Routes, Route, Link, NavLink, Navigate } from 'react-router-dom'
import SignupRequestPage from './pages/SignupRequest'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { api } from './services/api'
import { useClasses, useStudents } from './hooks/useClasses'
import { useRef } from 'react'

// Import layout components
import { Layout } from './components/layout'

// Import form components
import { EditStudentForm, EditClassForm } from './components/forms'

// Import utilities
import { autoResizeTextarea, useAutoResizeTextarea } from './utils/textarea'
import toast from 'react-hot-toast'

// Import pages
import { Dashboard, Login, Perfil, NotFound, ForgotPassword, ResetPassword } from './pages'
import { AlunosMatriculas, AdminUsuarios } from './pages/admin'
import { Turmas, AlunosPage } from './pages/academic'

// Import assets
import logo from './assets/logo.svg'

type ClassSummary = { id: string; name: string; code: string; year: number }
type StudentRow = { id: string; name: string }

function FaltasDiario({ embed }: { embed?: boolean }) {
  const { classes } = useClasses()
  const [classId, setClassId] = useState<string>('')
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0,10))
  const [students, setStudents] = useState<StudentRow[]>([])
  const [statuses, setStatuses] = useState<Record<string, 'PRESENT'|'ABSENT'|'JUSTIFIED'>>({})
  const [dayId, setDayId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

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
      toast.success('Presenças salvas')
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
      toast.success('Planejamento anual salvo')
    } finally { setSaving(false) }
  }

  const body = (
    <>
      <h1 className="title">Planejamento Anual</h1>
      <div className="card">
        <div className="card-header"><div className="card-title">Seleção</div></div>
        <div className="panel">
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
        </div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-header"><div className="card-title">Planejamento</div></div>
        <div className="panel">
          <textarea 
            ref={textareaRef}
            className="textarea" 
            placeholder="Insira seu texto aqui" 
            value={content} 
            onChange={e => { handleChange(e); setContent(e.target.value) }} 
          />
          <div className="form-actions">
            <button className="btn" disabled={saving || !classId} onClick={onSave}>Salvar</button>
          </div>
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
      toast.success('Planejamento semestral salvo')
    } finally { setSaving(false) }
  }

  const body = (
    <>
      <h1 className="title">Planejamento Semestral</h1>
      <div className="card">
        <div className="card-header"><div className="card-title">Seleção</div></div>
        <div className="panel">
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
        </div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-header"><div className="card-title">Planejamento</div></div>
        <div className="panel">
          <textarea 
            ref={textareaRef}
            className="textarea" 
            placeholder="Insira seu texto aqui" 
            value={content} 
            onChange={e => { handleChange(e); setContent(e.target.value) }} 
          />
          <div className="form-actions">
            <button className="btn" disabled={saving || !classId} onClick={onSave}>Salvar</button>
          </div>
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
      toast.success('Planejamento individual salvo')
    } finally { setSaving(false) }
  }

  const body = (
    <>
      <h1 className="title">Planejamento Individual</h1>
      <div className="card">
        <div className="card-header"><div className="card-title">Seleção</div></div>
        <div className="panel">
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
        </div>
      </div>
      <div className="card" style={{ marginTop: 12 }}>
        <div className="card-header"><div className="card-title">Plano Individual</div></div>
        <div className="panel">
          <textarea 
            ref={textareaRef}
            className="textarea" 
            placeholder="Metas, estratégias, recursos, avaliação..." 
            value={content} 
            onChange={e => { handleChange(e); setContent(e.target.value) }} 
          />
          <div className="form-actions">
            <button className="btn" disabled={!classId || !studentId || saving} onClick={onSave}>Salvar</button>
          </div>
        </div>
      </div>
    </>
  )
  return embed ? body : <Layout>{body}</Layout>
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignupRequestPage />} />
  <Route path="/recuperar-senha" element={<ForgotPassword />} />
  <Route path="/resetar-senha" element={<ResetPassword />} />
      <Route element={<ProtectedRoute /> }>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
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
  {/* rotas para Secretaria */}
  <Route path="/secretaria/usuarios" element={<AdminUsuarios />} />
    <Route path="/secretaria/alunos" element={<AlunosMatriculas />} />
  {/* rotas legadas /admin redirecionam para /secretaria */}
  <Route path="/admin/solicitacoes" element={<Navigate to="/secretaria/usuarios?tab=solicitacoes" replace />} />
  <Route path="/admin/usuarios" element={<Navigate to="/secretaria/usuarios" replace />} />
    <Route path="/admin/alunos" element={<Navigate to="/secretaria/alunos" replace />} />
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
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
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
      toast.success('Avaliação salva')
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
    toast.success('Projeto criado')
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
    toast.success('Projeto atualizado')
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
    toast.success('Marco adicionado')
  }
  const updateMilestone = async (p: Project, m: Milestone, patch: Partial<Milestone>) => {
    const upd = { ...m, ...patch }
    const r = await api.put(`/projects/${p.id}/milestones/${m.id}`, upd)
    setMilestones(prev => ({ ...prev, [p.id]: (prev[p.id]||[]).map(x => x.id===m.id ? r.data : x) }))
    toast.success('Marco atualizado')
  }
  const delMilestone = async (p: Project, m: Milestone) => {
    await api.delete(`/projects/${p.id}/milestones/${m.id}`)
    setMilestones(prev => ({ ...prev, [p.id]: (prev[p.id]||[]).filter(x => x.id!==m.id) }))
    toast.success('Marco excluído')
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
        <div className="card-header"><div className="card-title">Cadastrar projeto</div></div>
        <div className="form-grid">
          <div className="field"><label>Título</label><input data-cy="project-title" className="input" placeholder="Ex.: Semana da Leitura" value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div className="field"><label>Descrição</label><input data-cy="project-description" className="input" placeholder="Resumo do projeto" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
          <div className="field"><label>Público-alvo</label><input data-cy="project-audience" className="input" placeholder="Alunos do 5º ano" value={audience} onChange={e=>setAudience(e.target.value)} /></div>
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
          <div className="field"><label>Início</label><input data-cy="project-start" className="input" type="date" value={start} onChange={e=>setStart(e.target.value)} /></div>
          <div className="field"><label>Fim</label><input data-cy="project-end" className="input" type="date" value={end} onChange={e=>setEnd(e.target.value)} /></div>
          <div className="field"><label>Status</label>
            <div style={{ display:'flex', alignItems:'center' }}>
              <select className="select" value={status} onChange={e=>setStatus(e.target.value as Project['status'])} disabled>
                <option value="PLANNING">Em planejamento</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="COMPLETED">Concluído</option>
                <option value="ON_HOLD">Em espera</option>
                <option value="CANCELLED">Cancelado</option>
              </select>
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button data-cy="project-add" className="btn" onClick={create} disabled={!classId}>Adicionar projeto</button>
          <button data-cy="project-export" className="btn btn-outline" onClick={exportCsv} disabled={!items.length}>Exportar CSV</button>
        </div>
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
                    <button className="btn btn-danger" onClick={()=>remove(p.id)}>Excluir</button>
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
                                  <button className="btn btn-danger" onClick={()=>delMilestone(p,m)}>Excluir</button>
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
      toast.success('Avaliação evolutiva salva')
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
    toast.success('Atividade criada')
  }
  const remove = async (id: string) => { await api.delete(`/activities/${id}`); await load(classId); toast.success('Atividade excluída') }
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
    toast.success('Relato adicionado')
  }

  const saveGrades = async (activityId: string) => {
    const payload = gradeRows.map(r => ({ studentId: r.studentId, score: Number(r.score) }))
    await api.put(`/activities/${activityId}/grades`, payload)
    toast.success('Notas salvas')
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
        <div className="card-header"><div className="card-title">Cadastrar atividade</div></div>
        <div className="form-grid">
          <div className="field"><label>Título</label><input data-cy="activity-title" className="input" placeholder="Ex.: Lista de multiplicação" value={title} onChange={e=>setTitle(e.target.value)} /></div>
          <div className="field"><label>Descrição</label><input data-cy="activity-description" className="input" placeholder="Descrição breve" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
          <div className="field"><label>Tema</label><input className="input" placeholder="Tema" value={topic} onChange={e=>setTopic(e.target.value)} /></div>
          <div className="field"><label>Metodologia</label><input className="input" placeholder="Metodologia" value={methodology} onChange={e=>setMethodology(e.target.value)} /></div>
          <div className="field"><label>Conteúdo</label><input className="input" placeholder="Conteúdo" value={content} onChange={e=>setContent(e.target.value)} /></div>
          <div className="field"><label>Vencimento</label><input data-cy="activity-due" className="input" type="date" value={due} onChange={e=>setDue(e.target.value)} /></div>
          <div className="field"><label>Nota máx.</label><input data-cy="activity-max" className="input" style={{width:120}} type="number" min={1} max={100} value={max} onChange={e=>setMax(Number(e.target.value))} /></div>
          <div className="field"><label>Dificuldade</label><select className="select" value={difficultyId} onChange={e=>setDifficultyId(e.target.value)}>
            <option value="">Selecione</option>
            {difficultyList.map(d => <option key={d.id} value={d.id}>{d.type}</option>)}
          </select></div>
          <div className="field" style={{gridColumn:'1 / -1'}}><label>Observações</label><input className="input" placeholder="Observações" value={observations} onChange={e=>setObservations(e.target.value)} /></div>
        </div>
        <div className="form-actions">
          <button data-cy="activity-add" className="btn" onClick={create} disabled={!classId}>Adicionar</button>
          <button data-cy="activity-export" className="btn btn-outline" onClick={exportCsv} disabled={!items.length}>Exportar CSV</button>
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
                      <button data-cy="activity-relatos" className="btn btn-outline" onClick={()=>toggleExpand(a,'relatos')}>Relatos</button>
                      <button data-cy="activity-notas" className="btn btn-outline" onClick={()=>toggleExpand(a,'notas')}>Notas</button>
                      <button data-cy="activity-delete" className="btn btn-danger" onClick={()=>remove(a.id)}>Excluir</button>
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
                              <div><button data-cy="activity-elab-add" className="btn" onClick={()=>addElaboration(a.id)}>Adicionar relato</button></div>
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
                              <div><button data-cy="activity-grades-save" className="btn" onClick={()=>saveGrades(a.id)}>Salvar notas</button></div>
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

function PlanningPage({ initialTab }: { initialTab?: 'anual'|'semestral'|'individual'|'historico' }) {
  const [tab, setTab] = useState<'anual'|'semestral'|'individual'|'historico'>(initialTab ?? 'anual')
  return (
    <Layout>
      <h1 className="title">Planejamento</h1>
      <div className="tabs">
        <button className={`tab ${tab==='anual'?'active':''}`} onClick={()=>setTab('anual')}>Anual</button>
        <button className={`tab ${tab==='semestral'?'active':''}`} onClick={()=>setTab('semestral')}>Semestral</button>
        <button className={`tab ${tab==='individual'?'active':''}`} onClick={()=>setTab('individual')}>Individual</button>
        <button className={`tab ${tab==='historico'?'active':''}`} onClick={()=>setTab('historico')}>Histórico</button>
      </div>
      <div style={{ marginTop: 12 }}>
        {tab==='anual' && <PlanejamentoAnual embed />}
        {tab==='semestral' && <PlanejamentoSemestral embed />}
        {tab==='individual' && <PlanejamentoIndividual embed />}
        {tab==='historico' && <PlanejamentoHistorico embed />}
      </div>
    </Layout>
  )
}

function PlanejamentoHistorico({ embed }: { embed?: boolean }) {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState('')
  const [kind, setKind] = useState<'ANNUAL'|'SEMESTER'|'INDIVIDUAL'|'TODOS'>('TODOS')
  const [discipline, setDiscipline] = useState('')
  const [month, setMonth] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { (async () => { const r = await api.get('/classes'); setClasses(r.data) })() }, [])

  const load = async () => {
    if (!classId) return
    setLoading(true)
    try {
      const params: any = {}
      if (kind !== 'TODOS') params.kind = kind
      if (discipline) params.discipline = discipline
      const r = await api.get(`/classes/${classId}/plannings`, { params })
      let list = r.data as any[]
      if (month) list = list.filter(p => p.date && p.date.startsWith(month))
      setItems(list)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [classId, kind, discipline, month])

  const body = (
    <>
      <h1 className="title">Histórico de Planejamentos</h1>
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
          <select className="select" value={kind} onChange={e=>setKind(e.target.value as any)}>
            <option value="TODOS">Todos</option>
            <option value="ANNUAL">Anual</option>
            <option value="SEMESTER">Semestral</option>
            <option value="INDIVIDUAL">Individual</option>
          </select>
        </div>
        <div>
          <div>Disciplina:</div>
          <input className="input" placeholder="Ex.: Artes" value={discipline} onChange={e=>setDiscipline(e.target.value)} />
        </div>
        <div>
          <div>Período:</div>
          <input className="input" type="month" value={month} onChange={e=>setMonth(e.target.value)} />
        </div>
      </div>

      <div className="panel">
        {loading ? 'Carregando...' : (
          <table className="table">
            <thead><tr><th>Data</th><th>Título</th><th>Tipo</th><th>Disciplina</th><th>Resumo</th></tr></thead>
            <tbody>
              {items.map((p:any) => (
                <tr key={p.id}>
                  <td>{p.date ? new Date(p.date).toLocaleDateString() : '-'}</td>
                  <td>{p.title || '-'}</td>
                  <td>{p.kind}</td>
                  <td>{p.discipline || '-'}</td>
                  <td title={p.content || ''}>{(p.content || '').slice(0, 120)}{(p.content||'').length>120?'...':''}</td>
                </tr>
              ))}
              {!classId && <tr><td colSpan={5} style={{textAlign:'center',color:'#666'}}>Selecione uma turma</td></tr>}
              {classId && !items.length && <tr><td colSpan={5} style={{textAlign:'center',color:'#666'}}>Nenhum planejamento encontrado</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </>
  )
  return embed ? body : <Layout>{body}</Layout>
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
  const { classes } = useClasses()
  const [classId, setClassId] = useState('')
  const [dateFilter, setDateFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState(type || 'todos')
  const [searchTerm, setSearchTerm] = useState('')
  const [items, setItems] = useState<any[]>([])
  const [photos, setPhotos] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [currentItemId, setCurrentItemId] = useState<string>('')
  
  const loadHistorico = async (cid: string) => {
    if (!cid) return
    setLoading(true)
    try {
      let allItems: any[] = []
      
      // Carregar atividades
      if (typeFilter === 'todos' || typeFilter === 'atividades') {
        try {
          const activitiesRes = await api.get(`/classes/${cid}/activities`)
          const activities = activitiesRes.data.map((a: any) => ({
            ...a,
            type: 'atividade',
            completedAt: a.createdAt
          }))
          allItems = [...allItems, ...activities]
        } catch (error) {
          console.warn('Failed to load activities:', error)
        }
      }
      
      // Carregar projetos
      if (typeFilter === 'todos' || typeFilter === 'projetos') {
        try {
          const projectsRes = await api.get(`/classes/${cid}/projects`)
          const projects = projectsRes.data.map((p: any) => ({
            ...p,
            type: 'projeto',
            completedAt: p.createdAt,
            title: p.title,
            description: p.description
          }))
          allItems = [...allItems, ...projects]
        } catch (error) {
          console.warn('Failed to load projects:', error)
        }
      }
      
      // Para avaliações, usar dados do planejamento individual
      if (typeFilter === 'todos' || typeFilter === 'avaliacoes') {
        // Avaliações são específicas e podem ser implementadas posteriormente
        // Por enquanto, deixar vazio ou usar dados existentes
      }
      
      setItems(allItems)
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
