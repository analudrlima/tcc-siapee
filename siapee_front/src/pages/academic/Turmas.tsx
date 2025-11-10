import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout'
import { api } from '../../services/api'
import { StudentAvatar } from '../../components/StudentAvatar'
import { DownloadCsvButton } from '../../components/DownloadCsvButton'
import toast from 'react-hot-toast'

type ClassSummary = { id: string; name: string; code: string; year: number }
type TeacherAssign = { id: string; teacher: { id: string; name: string; email: string }; disciplines: string[] }
type UserLite = { id: string; name: string; email: string; role: string }

export function Turmas() {
  const [classes, setClasses] = useState<ClassSummary[]>([])
  const [classId, setClassId] = useState<string>('')
  const [discentes, setDiscentes] = useState<{ id: string; name: string; registryId?: string|null; phone?: string|null; photoUrl?: string|null }[]>([])
  const [teachers, setTeachers] = useState<TeacherAssign[]>([])
  const [allTeachers, setAllTeachers] = useState<UserLite[]>([])
  const [newTeacherId, setNewTeacherId] = useState('')
  const [newDisciplines, setNewDisciplines] = useState('') // comma separated input
  const [loadingAssign, setLoadingAssign] = useState(false)

  useEffect(() => { 
    (async () => { 
      const r = await api.get('/classes')
      setClasses(r.data)
    })()
  }, [])
  
  useEffect(() => { 
    (async () => { 
      if (!classId) return
      // load class details (students)
      const r = await api.get(`/classes/${classId}`)
      const students = r.data.enrollments.map((e: any) => ({ 
        id: e.student.id,
        name: e.student.name,
        registryId: e.student.registryId ?? null,
        phone: e.student.phone ?? null,
        photoUrl: e.student.photoUrl ?? null,
      }))
      setDiscentes(students)
      // load teacher assignments
      const t = await api.get(`/classes/${classId}/teachers`)
      setTeachers(t.data)
      // fetch all teacher users for assignment options (once per class change)
      const users = await api.get('/users')
      setAllTeachers(users.data.filter((u: any) => u.role === 'TEACHER'))
    })()
  }, [classId])

  async function handleAssignTeacher() {
    if (!classId || !newTeacherId) return
    setLoadingAssign(true)
    try {
      const disciplines = newDisciplines.split(',').map(d => d.trim()).filter(Boolean)
      await api.post(`/classes/${classId}/teachers`, { teacherId: newTeacherId, disciplines })
      // refresh list
      const t = await api.get(`/classes/${classId}/teachers`)
      setTeachers(t.data)
      setNewTeacherId('')
      setNewDisciplines('')
      toast.success('Docente vinculado com sucesso')
    } finally {
      setLoadingAssign(false)
    }
  }

  async function handleRemoveTeacher(teacherId: string) {
    if (!classId) return
    try {
      await api.delete(`/classes/${classId}/teachers/${teacherId}`)
      const t = await api.get(`/classes/${classId}/teachers`)
      setTeachers(t.data)
      toast.success('Vínculo removido')
    } catch (err: any) {
      toast.error('Falha ao remover vínculo')
    }
  }
  
  return (
    <Layout>
      <h1 className="title">Turmas</h1>
      <div className="form-row">
        <div>
          selecione a turma:&nbsp;
            <select data-cy="turmas-class-select" className="select" value={classId} onChange={e => setClassId(e.target.value)}>
            <option value="">-- escolha --</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>
      <div className="panel" style={{ marginTop: 8 }}>
        <h3>Docentes</h3>
        {classId && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
              {teachers.map(t => (
                <div data-cy="turmas-teacher-card" key={t.id} style={{ border:'1px solid #ddd', padding:8, borderRadius:6, background:'#fafafa', minWidth:220 }}>
                  <strong>{t.teacher.name}</strong><br />
                  <span style={{ fontSize:12, color:'#555' }}>{t.teacher.email}</span>
                  <div style={{ marginTop:4, fontSize:12 }}>Disciplinas: {t.disciplines.length ? t.disciplines.join(', ') : '—'}</div>
                  <button data-cy="turmas-remove-button" className="btn btn-danger" style={{ marginTop:6 }} onClick={() => handleRemoveTeacher(t.teacher.id)}>Remover</button>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              <select data-cy="turmas-teacher-select" className="select" value={newTeacherId} onChange={e => setNewTeacherId(e.target.value)}>
                <option value="">-- selecionar docente --</option>
                {allTeachers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <input
                data-cy="turmas-disciplines-input"
                className="input"
                placeholder="Disciplinas (separadas por vírgula)"
                value={newDisciplines}
                onChange={e => setNewDisciplines(e.target.value)}
                style={{ minWidth:260 }}
              />
              <button data-cy="turmas-assign-button" className="btn" disabled={loadingAssign || !newTeacherId} onClick={handleAssignTeacher}>
                {loadingAssign ? 'Salvando...' : 'Vincular docente'}
              </button>
            </div>
          </div>
        )}
        <h3 style={{ marginTop: 16 }}>Discentes</h3>
        {classId && (
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <DownloadCsvButton endpoint={`/reports/attendance.csv?classId=${classId}`} filename={`attendance_${classId}.csv`} label="Exportar Presenças" />
            <DownloadCsvButton endpoint={`/reports/grades.csv?classId=${classId}`} filename={`grades_${classId}.csv`} label="Exportar Notas" />
            <DownloadCsvButton endpoint={`/reports/planning.csv?classId=${classId}`} filename={`planning_${classId}.csv`} label="Exportar Planejamentos" />
            <DownloadCsvButton endpoint={`/reports/projects.csv?classId=${classId}`} filename={`projects_${classId}.csv`} label="Exportar Projetos" />
            <DownloadCsvButton endpoint={`/reports/audit.csv?limit=200`} filename={`audit_latest.csv`} label="Exportar Auditoria" />
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {discentes.map(d => (
            <div key={d.id} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <StudentAvatar src={d.photoUrl || undefined} size={64} rounded={8} />
              <div>
                <div>{d.name}</div>
                <div style={{ color: '#666' }}>Matrícula: {d.registryId || '—'}</div>
                <div style={{ color: '#666' }}>Contato: {d.phone || '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
