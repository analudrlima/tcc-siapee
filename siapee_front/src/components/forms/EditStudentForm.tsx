import { useState, useEffect } from 'react'
import { api } from '../../services/api'
import { StudentAvatar } from '../StudentAvatar'

interface EditStudentFormProps {
  student: any
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export function EditStudentForm({ student, onSave, onCancel }: EditStudentFormProps) {
  const [name, setName] = useState(student.name || '')
  const [email, setEmail] = useState(student.email || '')
  const [registryId, setRegistryId] = useState(student.registryId || '')
  const [birthDate, setBirthDate] = useState(student.birthDate ? student.birthDate.split('T')[0] : '')
  const [phone, setPhone] = useState(student.phone || '')
  const [genderId, setGenderId] = useState(student.genderId || '')
  const [comorbidities, setComorbidities] = useState(student.comorbidities || '')
  const [allergies, setAllergies] = useState(student.allergies || '')
  const [medications, setMedications] = useState(student.medications || '')
  const [observations, setObservations] = useState(student.observations || '')
  const [addr, setAddr] = useState({
    zipCode: student.address?.zipCode || '',
    state: student.address?.state || '',
    city: student.address?.city || '',
    neighborhood: student.address?.neighborhood || '',
    street: student.address?.street || '',
    number: student.address?.number ? String(student.address.number) : '',
    complement: student.address?.complement || ''
  })
  const [genders, setGenders] = useState<{ id: string; description: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  // Linking to classes
  const [allClasses, setAllClasses] = useState<{ id: string; name: string; code: string; year: number }[]>([])
  const [enrollments, setEnrollments] = useState<{ enrollmentId: string; class: { id: string; name: string; code: string; year: number } }[]>([])
  const [linkClassId, setLinkClassId] = useState('')

  useEffect(() => {
    api.get('/genders').then(r => setGenders(r.data)).catch(() => setGenders([]))
  }, [])

  useEffect(() => {
    // Load classes and current enrollments for this student
    (async () => {
      try {
        const [cr, er] = await Promise.all([
          api.get('/classes'),
          api.get(`/students/${student.id}/enrollments`)
        ])
        setAllClasses(cr.data)
        setEnrollments(er.data)
      } catch {
        // ignore
      }
    })()
  }, [student.id])

  const linkToClass = async () => {
    if (!linkClassId) return
    await api.post(`/classes/${linkClassId}/enrollments`, { studentId: student.id })
    setLinkClassId('')
    const er = await api.get(`/students/${student.id}/enrollments`)
    setEnrollments(er.data)
  }

  const unlinkFromClass = async (classId: string, enrollmentId: string) => {
    await api.delete(`/classes/${classId}/enrollments/${enrollmentId}`)
    const er = await api.get(`/students/${student.id}/enrollments`)
    setEnrollments(er.data)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
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
        observations: observations || null,
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
      await onSave(payload)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{maxHeight:'70vh',overflowY:'auto',padding:'0 4px'}}>
      <div className="form-grid">
        <div className="field" style={{gridColumn:'1/-1'}}>
          <label>Foto do aluno</label>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <StudentAvatar src={student.photoUrl || undefined} size={56} rounded={8} />
            <label className="btn btn-outline sm">
              Trocar foto
              <input type="file" accept="image/*" style={{display:'none'}} onChange={async e=>{
                const f = e.target.files?.[0]
                if (!f) return
                setUploading(true)
                try {
                  const form = new FormData(); form.append('file', f)
                  await api.post(`/students/${student.id}/photo`, form, { headers: { 'Content-Type':'multipart/form-data' } })
                } finally { setUploading(false) }
              }} />
            </label>
          </div>
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
        <div className="field" style={{gridColumn:'1/-1'}}><label>Observações</label><input className="input" value={observations} onChange={e=>setObservations(e.target.value)} /></div>
        <div className="field"><label>CEP</label><input className="input" value={addr.zipCode} onChange={e=>setAddr({...addr,zipCode:e.target.value})} /></div>
        <div className="field"><label>Estado</label><input className="input" value={addr.state} onChange={e=>setAddr({...addr,state:e.target.value})} /></div>
        <div className="field"><label>Cidade</label><input className="input" value={addr.city} onChange={e=>setAddr({...addr,city:e.target.value})} /></div>
        <div className="field"><label>Bairro</label><input className="input" value={addr.neighborhood} onChange={e=>setAddr({...addr,neighborhood:e.target.value})} /></div>
        <div className="field"><label>Rua</label><input className="input" value={addr.street} onChange={e=>setAddr({...addr,street:e.target.value})} /></div>
        <div className="field"><label>Número</label><input className="input" value={addr.number} onChange={e=>setAddr({...addr,number:e.target.value})} /></div>
        <div className="field"><label>Complemento</label><input className="input" value={addr.complement} onChange={e=>setAddr({...addr,complement:e.target.value})} /></div>
      </div>
      <div className="card" style={{marginTop:12}}>
        <div className="card-header"><div className="card-title">Turmas vinculadas</div></div>
        <div className="panel">
          <div className="form-grid">
            <div className="field" style={{gridColumn:'1/-1'}}>
              <label>Adicionar a uma turma</label>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <select className="select" value={linkClassId} onChange={e=>setLinkClassId(e.target.value)}>
                  <option value="">Selecione</option>
                  {allClasses
                    .filter(c => !enrollments.some(e => e.class.id === c.id))
                    .map(c => (
                      <option key={c.id} value={c.id}>{c.name} — {c.code}</option>
                    ))}
                </select>
                <button className="btn" onClick={linkToClass} disabled={!linkClassId}>Vincular</button>
              </div>
            </div>
          </div>
          <div className="panel" style={{padding:0, marginTop:8}}>
            <table className="table">
              <thead><tr><th>Turma</th><th>Código</th><th>Ano</th><th>Ações</th></tr></thead>
              <tbody>
                {enrollments.map(e => (
                  <tr key={e.enrollmentId}>
                    <td>{e.class.name}</td>
                    <td>{e.class.code}</td>
                    <td>{e.class.year}</td>
                    <td><button className="btn btn-danger" onClick={()=>unlinkFromClass(e.class.id, e.enrollmentId)}>Remover</button></td>
                  </tr>
                ))}
                {!enrollments.length && <tr><td colSpan={4} style={{textAlign:'center',color:'#666'}}>Nenhuma turma vinculada</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="form-row" style={{marginTop:12,gap:8}}>
        <button className="btn" onClick={handleSave} disabled={saving || uploading}>Salvar</button>
        <button className="btn btn-outline" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
