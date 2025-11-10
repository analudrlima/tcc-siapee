import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout'
import { EditStudentForm, EditClassForm } from '../../components/forms'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../services/api'

export function AlunosMatriculas() {
  type Student = { id: string; name: string; email?: string|null; registryId?: string|null }
  type Klass = { id: string; name: string; code: string; year: number; disciplines?: string[] }
  const { user } = useAuth()
  const [tab, setTab] = useState<'CADASTRAR'|'CRIAR_TURMA'>('CADASTRAR')
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Klass[]>([])
  const [loading, setLoading] = useState(false)
  
  // Edit modals
  const [showEditStudentModal, setShowEditStudentModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState<any>(null)
  const [showEditClassModal, setShowEditClassModal] = useState(false)
  const [editingClass, setEditingClass] = useState<any>(null)

  // cadastro form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [registryId, setRegistryId] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [phone, setPhone] = useState('')
  const [genderId, setGenderId] = useState('')
  const [comorbidities, setComorbidities] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medications, setMedications] = useState('')
  const [observations, setObservations] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [addr, setAddr] = useState({
    zipCode: '', state: '', city: '', neighborhood: '', street: '', number: '', complement: ''
  })
  const [genders, setGenders] = useState<{ id: string; description: string }[]>([])
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([])
  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])
  const availableDisciplines = ['Artes','Português','Matemática','História','Geografia','Ciências','Inglês','Educação Física']
  // disciplinas da turma (criação)
  const [newClassDisciplines, setNewClassDisciplines] = useState<string[]>([])
  // disciplinas da turma selecionada (gerenciamento)
  const [classDisciplines, setClassDisciplines] = useState<string[]>([])
  const [savingDiscip, setSavingDiscip] = useState(false)

  // estados para criar matrículas na aba CRIAR_TURMA
  const [classId, setClassId] = useState('')
  const [studentId, setStudentId] = useState('')
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState<{ enrollmentId: string; student: Student }[]>([])
  const [enrolledLoading, setEnrolledLoading] = useState(false)
  // criar turma
  const [newClassName, setNewClassName] = useState('')
  const [newClassCode, setNewClassCode] = useState('')
  const [newClassYear, setNewClassYear] = useState<string>(() => String(new Date().getFullYear()))
  const [creatingClass, setCreatingClass] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [sr, cr, gr] = await Promise.all([
        api.get('/students'),
        api.get('/classes'),
        api.get('/genders').catch(()=>({ data: [] }))
      ])
      setStudents(sr.data)
      setClasses(cr.data)
      setGenders(gr.data || [])
    } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const loadEnrolled = async (cid: string) => {
    if (!cid) { setEnrolled([]); return }
    setEnrolledLoading(true)
    try {
      const r = await api.get(`/classes/${cid}`)
      const rows = (r.data.enrollments || []).map((e: any) => ({ enrollmentId: e.id, student: { id: e.student.id, name: e.student.name, email: e.student.email, registryId: e.student.registryId } }))
      setEnrolled(rows)
    } finally { setEnrolledLoading(false) }
  }

  const loadClassDisciplines = async (cid: string) => {
    if (!cid) { setClassDisciplines([]); return }
    const r = await api.get(`/classes/${cid}/planning`, { params: { kind: 'ANNUAL', details: 'DISCIPLINES' } })
    const content = r.data?.content as string | undefined
    const arr = content ? content.split(',').map(s => s.trim()).filter(Boolean) : []
    setClassDisciplines(arr)
  }

  useEffect(() => { if (tab==='CRIAR_TURMA') { loadEnrolled(classId); loadClassDisciplines(classId) } }, [classId, tab])

  const create = async () => {
    if (!name.trim()) return
    const payload: any = {
      name,
      email: email || null,
      registryId: registryId || null,
      birthDate: birthDate || null,
      phone: phone || null,
      genderId: genderId || null,
      comorbidities: comorbidities || null,
      allergies: allergies || null,
      medications: medications || null,
      observations: observations ? observations : (selectedDisciplines.length ? `Disciplinas: ${selectedDisciplines.join(', ')}` : null),
    }
    if (addr.street && addr.number && addr.neighborhood && addr.city && addr.state && addr.zipCode) {
      payload.address = {
        street: addr.street,
        number: Number(addr.number),
        complement: addr.complement || null,
        neighborhood: addr.neighborhood,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode
      }
    }
    const created = await api.post('/students', payload)
    const sid = created.data.id as string
    // se houver foto selecionada, faz upload
    if (photoFile) {
      const form = new FormData()
      form.append('file', photoFile)
      await api.post(`/students/${sid}/photo`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    }
    // enroll to selected classes
    for (const cid of selectedClassIds) {
      await api.post(`/classes/${cid}/enrollments`, { studentId: sid })
    }
    // reset form
    setName(''); setEmail(''); setRegistryId(''); setBirthDate(''); setPhone(''); setGenderId(''); setComorbidities(''); setAllergies(''); setMedications(''); setObservations(''); setAddr({ zipCode:'', state:'', city:'', neighborhood:'', street:'', number:'', complement:'' }); setSelectedClassIds([]); setSelectedDisciplines([]); setPhotoFile(null)
    await load()
  }

  // ações de matrícula removidas

  const createClass = async () => {
    if (!newClassName.trim() || !newClassCode.trim() || !newClassYear.trim()) return
    setCreatingClass(true)
    try {
      const payload = { name: newClassName.trim(), code: newClassCode.trim(), year: Number(newClassYear) }
      const cr = await api.post('/classes', payload)
      await load()
      // seta a turma criada para gerenciamento
      setClassId(cr.data.id)
      // salva disciplinas iniciais se houver
      if (newClassDisciplines.length) {
        await api.put(`/classes/${cr.data.id}/planning`, { kind: 'ANNUAL', details: 'DISCIPLINES', title: 'Disciplinas da Turma', content: newClassDisciplines.join(', ') })
      }
      await Promise.all([loadEnrolled(cr.data.id), loadClassDisciplines(cr.data.id)])
      setNewClassName('')
      setNewClassCode('')
      setNewClassYear(String(new Date().getFullYear()))
      setNewClassDisciplines([])
    } catch (e: any) {
      alert(e?.response?.data?.error ?? 'Falha ao criar turma')
    } finally {
      setCreatingClass(false)
    }
  }

  const toggleClassDiscipline = (d: string) => {
    setClassDisciplines(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  const saveDisciplinas = async () => {
    if (!classId) return
    setSavingDiscip(true)
    try {
      await api.put(`/classes/${classId}/planning`, { kind: 'ANNUAL', details: 'DISCIPLINES', title: 'Disciplinas da Turma', content: classDisciplines.join(', ') })
    } finally { setSavingDiscip(false) }
  }

  const enroll = async () => {
    if (!classId || !studentId) return
    setEnrolling(true)
    try {
      await api.post(`/classes/${classId}/enrollments`, { studentId })
      setStudentId('')
      await Promise.all([load(), loadEnrolled(classId)])
    } finally { setEnrolling(false) }
  }

  const unenroll = async (enrollmentId: string) => {
    if (!classId) return
    await api.delete(`/classes/${classId}/enrollments/${enrollmentId}`)
    await loadEnrolled(classId)
  }

  if (user?.role !== 'ADMIN' && user?.role !== 'SECRETARY') {
    return <Layout><div style={{ padding: 16 }}>Sem permissão para acessar esta área.</div></Layout>
  }

  return (
    <Layout>
  <h1 className="title">Secretaria – Alunos e Turmas</h1>
      <div className="tabs" style={{marginBottom:12}}>
        <button className={`tab ${tab==='CADASTRAR'?'active':''}`} onClick={()=>setTab('CADASTRAR')}>Cadastrar aluno</button>
        <button className={`tab ${tab==='CRIAR_TURMA'?'active':''}`} onClick={()=>setTab('CRIAR_TURMA')}>Criar turma</button>
      </div>

      {tab==='CADASTRAR' ? (
        <div className="card">
          <div className="form-grid">
            <div className="field" style={{gridColumn:'1/-1'}}>
              <label>Foto do aluno (opcional)</label>
              <input className="input" type="file" accept="image/*" onChange={e=>setPhotoFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="field"><label>Nome</label><input className="input" value={name} onChange={e=>setName(e.target.value)} /></div>
            <div className="field"><label>E-mail</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div>
            <div className="field"><label>Matrícula</label><input className="input" value={registryId} onChange={e=>setRegistryId(e.target.value)} /></div>
            <div className="field"><label>Data de nascimento</label><input className="input" type="date" value={birthDate} onChange={e=>setBirthDate(e.target.value)} /></div>
            <div className="field"><label>Telefone</label><input className="input" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
            <div className="field"><label>Gênero</label>
              <select className="select" value={genderId} onChange={e=>setGenderId(e.target.value)}>
                <option value="">Selecione</option>
                {genders.map(g => <option key={g.id} value={g.id}>{g.description}</option>)}
              </select>
            </div>
            <div className="field"><label>Comorbidades</label><input className="input" value={comorbidities} onChange={e=>setComorbidities(e.target.value)} /></div>
            <div className="field"><label>Alergias</label><input className="input" value={allergies} onChange={e=>setAllergies(e.target.value)} /></div>
            <div className="field"><label>Medicações</label><input className="input" value={medications} onChange={e=>setMedications(e.target.value)} /></div>
            <div className="field" style={{gridColumn:'1/-1'}}><label>Observações</label><input className="input" value={observations} onChange={e=>setObservations(e.target.value)} placeholder="Opcional. Se vazio e disciplinas selecionadas, serão gravadas em observações" /></div>
          </div>
          <div style={{fontWeight:600, marginTop:8}}>Endereço</div>
          <div className="form-grid">
            <div className="field"><label>CEP</label><input className="input" value={addr.zipCode} onChange={e=>setAddr({...addr, zipCode:e.target.value})} /></div>
            <div className="field"><label>Estado</label><input className="input" value={addr.state} onChange={e=>setAddr({...addr, state:e.target.value})} /></div>
            <div className="field"><label>Cidade</label><input className="input" value={addr.city} onChange={e=>setAddr({...addr, city:e.target.value})} /></div>
            <div className="field"><label>Bairro</label><input className="input" value={addr.neighborhood} onChange={e=>setAddr({...addr, neighborhood:e.target.value})} /></div>
            <div className="field"><label>Rua</label><input className="input" value={addr.street} onChange={e=>setAddr({...addr, street:e.target.value})} /></div>
            <div className="field"><label>Número</label><input className="input" value={addr.number} onChange={e=>setAddr({...addr, number:e.target.value})} /></div>
            <div className="field"><label>Complemento</label><input className="input" value={addr.complement} onChange={e=>setAddr({...addr, complement:e.target.value})} /></div>
          </div>
          <div style={{fontWeight:600, marginTop:8}}>Disciplinas (opcional)</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
            {availableDisciplines.map(d => (
              <label key={d} className="discipline-checkbox" style={{padding:'8px 10px'}}>
                <input type="checkbox" checked={selectedDisciplines.includes(d)} onChange={() => setSelectedDisciplines(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d])} />
                <span className="checkmark"></span>{d}
              </label>
            ))}
          </div>
          <div style={{fontWeight:600, marginTop:8}}>Matricular em turmas</div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px,1fr))', gap:12}}>
            {classes.map(c => (
              <label key={c.id} className="discipline-checkbox" style={{padding:'8px 10px'}}>
                <input type="checkbox" checked={selectedClassIds.includes(c.id)} onChange={() => setSelectedClassIds(prev => prev.includes(c.id) ? prev.filter(x=>x!==c.id) : [...prev, c.id])} />
                <span className="checkmark"></span>{c.name} — {c.code}
              </label>
            ))}
          </div>
          <div className="form-row" style={{marginTop:12}}><button className="btn" onClick={create}>Salvar e matricular</button></div>
        </div>
      ) : (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Criar nova turma</div>
          </div>
          <div className="form-grid">
            <div className="field"><label>Nome</label><input className="input" placeholder="Ex.: 5º Ano A" value={newClassName} onChange={e=>setNewClassName(e.target.value)} /></div>
            <div className="field"><label>Código</label><input className="input" placeholder="Ex.: 5A-2025" value={newClassCode} onChange={e=>setNewClassCode(e.target.value)} /></div>
            <div className="field"><label>Ano</label><input className="input" type="number" min="2000" max="2100" value={newClassYear} onChange={e=>setNewClassYear(e.target.value)} /></div>
          </div>
          <div style={{fontWeight:600, marginTop:8}}>Disciplinas da turma (opcional)</div>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
            {availableDisciplines.map(d => (
              <label key={d} className="discipline-checkbox" style={{padding:'8px 10px'}}>
                <input type="checkbox" checked={newClassDisciplines.includes(d)} onChange={() => setNewClassDisciplines(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d])} />
                <span className="checkmark"></span>{d}
              </label>
            ))}
          </div>
          <div className="form-row">
            <button className="btn" onClick={createClass} disabled={creatingClass}>Criar turma</button>
          </div>
        </div>
      )}

      {tab==='CRIAR_TURMA' && (
        <>
          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-header"><div className="card-title">Turma para gerenciar</div></div>
            <div className="form-grid">
              <div className="field"><label>Turma</label>
                <select className="select" value={classId} onChange={e=>setClassId(e.target.value)}>
                  <option value="">Selecione</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.code}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-header"><div className="card-title">Disciplinas da turma</div></div>
            {!classId ? (
              <div className="muted">Selecione uma turma para configurar as disciplinas.</div>
            ) : (
              <>
                <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
                  {availableDisciplines.map(d => (
                    <label key={d} className="discipline-checkbox" style={{padding:'8px 10px'}}>
                      <input type="checkbox" checked={classDisciplines.includes(d)} onChange={() => toggleClassDiscipline(d)} />
                      <span className="checkmark"></span>{d}
                    </label>
                  ))}
                </div>
                <div className="form-row"><button className="btn" onClick={saveDisciplinas} disabled={savingDiscip}>Salvar disciplinas</button></div>
              </>
            )}
          </div>

          <div className="card" style={{ marginTop: 12 }}>
            <div className="card-header"><div className="card-title">Matricular aluno em turma</div></div>
            {!classId ? (
              <div className="muted">Selecione uma turma acima para matricular alunos.</div>
            ) : (
              <>
                <div className="form-grid">
                  <div className="field"><label>Aluno</label>
                    <select className="select" value={studentId} onChange={e=>setStudentId(e.target.value)}>
                      <option value="">Selecione</option>
                      {students.map(s => <option key={s.id} value={s.id}>{s.name} {s.registryId?`(${s.registryId})`:''}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <button className="btn" disabled={enrolling || !studentId} onClick={enroll}>Matricular</button>
                </div>
                <div className="panel" style={{ marginTop: 12 }}>
                  {enrolledLoading ? 'Carregando alunos da turma...' : (
                    <table className="table">
                      <thead><tr><th>Aluno</th><th>Matrícula</th><th>Ações</th></tr></thead>
                      <tbody>
                        {enrolled.map(row => (
                          <tr key={row.enrollmentId}>
                            <td>{row.student.name}</td>
                            <td>{row.student.registryId || '-'}</td>
                            <td>
                              <button className="btn btn-danger" onClick={()=>unenroll(row.enrollmentId)}>Remover</button>
                            </td>
                          </tr>
                        ))}
                        {!enrolled.length && <tr><td colSpan={3} style={{textAlign:'center',color:'#666'}}>Nenhum aluno matriculado nesta turma</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}

      {tab==='CADASTRAR' && (
        <div className="panel" style={{ marginTop: 12 }}>
          {loading ? 'Carregando...' : (
            <table className="table">
              <thead><tr><th>Nome</th><th>E-mail</th><th>Matrícula</th><th>Ações</th></tr></thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email || '-'}</td>
                    <td>{s.registryId || '-'}</td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="btn btn-outline" onClick={async()=>{
                          const r = await api.get(`/students/${s.id}?include=address,gender`)
                          setEditingStudent(r.data)
                          setShowEditStudentModal(true)
                        }}>Editar</button>
                        <button className="btn btn-danger" onClick={async ()=>{ const ok = confirm(`Excluir o aluno(a) "${s.name}"?`); if (!ok) return; await api.delete(`/students/${s.id}`); await load() }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!students.length && <tr><td colSpan={3} style={{textAlign:'center',color:'#666'}}>Nenhum aluno cadastrado</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab==='CRIAR_TURMA' && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-header"><div className="card-title">Turmas cadastradas</div></div>
          <div className="panel">
            <table className="table">
              <thead><tr><th>Nome</th><th>Código</th><th>Ano</th><th>Ações</th></tr></thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.code}</td>
                    <td>{c.year}</td>
                    <td>
                      <div style={{display:'flex',gap:'8px'}}>
                        <button className="btn btn-outline" onClick={()=>{ setEditingClass(c); setShowEditClassModal(true) }}>Editar</button>
                        <button className="btn btn-danger" onClick={async ()=>{ const ok = confirm(`Excluir a turma "${c.name}"?\nIsso irá remover todas as matrículas, faltas, planejamentos, atividades e projetos associados.`); if (!ok) return; await api.delete(`/classes/${c.id}`); await load() }}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!classes.length && <tr><td colSpan={4} style={{textAlign:'center',color:'#666'}}>Nenhuma turma cadastrada</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Edição de Aluno */}
      {showEditStudentModal && editingStudent && (
        <div className="modal-overlay" onClick={() => setShowEditStudentModal(false)}>
          <div className="modal-content" style={{maxWidth:700}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Aluno</h3>
              <button className="modal-close" onClick={() => setShowEditStudentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <EditStudentForm student={editingStudent} onSave={async (data)=>{ await api.put(`/students/${editingStudent.id}`, data); setShowEditStudentModal(false); await load() }} onCancel={()=>setShowEditStudentModal(false)} />
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Turma */}
      {showEditClassModal && editingClass && (
        <div className="modal-overlay" onClick={() => setShowEditClassModal(false)}>
          <div className="modal-content" style={{maxWidth:500}} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Editar Turma</h3>
              <button className="modal-close" onClick={() => setShowEditClassModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <EditClassForm klass={editingClass} onSave={async (data)=>{ await api.put(`/classes/${editingClass.id}`, data); setShowEditClassModal(false); await load() }} onCancel={()=>setShowEditClassModal(false)} />
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
