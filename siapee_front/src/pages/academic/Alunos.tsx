import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout'
import { api } from '../../services/api'
import { StudentAvatar } from '../../components/StudentAvatar'

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

export function AlunosPage() {
  const [list, setList] = useState<Student[]>([])
  const [filterName, setFilterName] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [filterRegistry, setFilterRegistry] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student|null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/students?include=address,gender')
      setList(r.data)
    } finally { 
      setLoading(false)
    }
  }
  
  useEffect(() => { 
    load()
  }, [])

  const clearFilters = () => {
    setFilterName('')
    setFilterEmail('')
    setFilterRegistry('')
  }

  const onUpload = async (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    await api.post(`/students/${id}/photo`, form, { 
      headers: { 'Content-Type':'multipart/form-data' } 
    })
    await load()
  }

  const removeStudent = async (id: string, name: string) => {
    const ok = confirm(`Deseja realmente excluir o aluno(a) "${name}"?\nIsso também irá removê-lo(a) de todas as turmas.`)
    if (!ok) return
    await api.delete(`/students/${id}`)
    await load()
  }

  const filtered = list.filter(s => {
    const m1 = !filterName || s.name.toLowerCase().includes(filterName.toLowerCase())
    const m2 = !filterEmail || (s.email ?? '').toLowerCase().includes(filterEmail.toLowerCase())
    const m3 = !filterRegistry || (s.registryId ?? '').toLowerCase().includes(filterRegistry.toLowerCase())
    return m1 && m2 && m3
  })

  return (
    <Layout>
      <h1 className="title">Alunos</h1>
      <div className="card">
        <div className="card-header">
          <div className="card-title">Filtros</div>
          <div className="card-actions">
            <span className="muted">Resultados: {filtered.length}</span>
            <button className="btn btn-outline sm" onClick={clearFilters}>Limpar filtros</button>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Nome</label>
            <input className="input" placeholder="Pesquisar por nome" value={filterName} onChange={e=>setFilterName(e.target.value)} />
          </div>
          <div className="field">
            <label>E-mail</label>
            <input className="input" placeholder="Pesquisar por e-mail" value={filterEmail} onChange={e=>setFilterEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Matrícula</label>
            <input className="input" placeholder="Pesquisar por matrícula" value={filterRegistry} onChange={e=>setFilterRegistry(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 12 }}>
        {loading ? 'Carregando...' : (
          <table className="table">
            <thead>
              <tr>
                <th>Foto</th>
                <th>Nome</th>
                <th>Email</th>
                <th>Matrícula</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <StudentAvatar src={s.photoUrl || undefined} size={48} />
                  </td>
                  <td>{s.name}</td>
                  <td>{s.email || '-'}</td>
                  <td>{s.registryId || '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <label className="btn btn-outline">
                        Foto
                        <input 
                          type="file" 
                          accept="image/*" 
                          style={{display:'none'}} 
                          onChange={e=>{ 
                            const f=e.target.files?.[0]
                            if (f) onUpload(s.id, f)
                          }} 
                        />
                      </label>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => { 
                          setSelectedStudent(s)
                          setShowDetailsModal(true)
                        }}
                      >
                        Ver mais
                      </button>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => removeStudent(s.id, s.name)}
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length===0 && (
                <tr>
                  <td colSpan={5} style={{textAlign:'center',color:'#666'}}>
                    Nenhum aluno
                  </td>
                </tr>
              )}
              {list.length>0 && filtered.length===0 && (
                <tr>
                  <td colSpan={5} style={{textAlign:'center',color:'#666'}}>
                    Nenhum aluno encontrado com os filtros
                  </td>
                </tr>
              )}
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
                  <StudentAvatar src={selectedStudent.photoUrl || undefined} size={160} rounded={12} />
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
