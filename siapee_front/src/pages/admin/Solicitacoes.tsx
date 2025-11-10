import { useState, useEffect } from 'react'
import { Layout } from '../../components/layout'
import { api } from '../../services/api'

export function AdminSolicitacoes({ embed }: { embed?: boolean }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ALL'|'PENDING'|'APPROVED'|'REJECTED'>('ALL')
  const [rejectModal, setRejectModal] = useState<{ id: string; name: string }|null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  const load = async () => {
    setLoading(true)
    try { 
      const r = await api.get('/signup/requests')
      setItems(r.data)
    } finally { 
      setLoading(false)
    }
  }
  
  useEffect(() => { 
    load()
  }, [])
  
  const approve = async (id: string, name: string) => {
    const ok = confirm(`Aprovar a solicitação de "${name}"?`)
    if (!ok) return
    setSubmitting(true)
    try {
      await api.post(`/signup/requests/${id}/decide`, { approved: true })
      await load()
    } finally { setSubmitting(false) }
  }

  const openReject = (id: string, name: string) => {
    setRejectModal({ id, name })
    setRejectReason('')
  }

  const confirmReject = async () => {
    if (!rejectModal) return
    setSubmitting(true)
    try {
      await api.post(`/signup/requests/${rejectModal.id}/decide`, { approved: false, reason: rejectReason || undefined })
      setRejectModal(null)
      setRejectReason('')
      await load()
    } finally { setSubmitting(false) }
  }
  
  const body = (
    <>
      {!embed && <h1 className="title">Solicitações de cadastro</h1>}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Solicitações recebidas</div>
          <div className="card-actions">
            <label className="muted">Status:&nbsp;</label>
            <select className="select sm" value={filterStatus} onChange={e=>setFilterStatus(e.target.value as any)}>
              <option value="ALL">Todas</option>
              <option value="PENDING">Pendentes</option>
              <option value="APPROVED">Aprovadas</option>
              <option value="REJECTED">Rejeitadas</option>
            </select>
          </div>
        </div>
        {loading ? 'Carregando...' : (
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Email</th>
                <th>Papel</th>
                <th>Status</th>
                <th>Criada</th>
                <th>Decisão</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter(it => filterStatus==='ALL' ? true : it.status===filterStatus)
                .map(it => (
                <tr key={it.id}>
                  <td>{it.name}</td>
                  <td>{it.email}</td>
                  <td>{it.roleRequested}</td>
                  <td>
                    <span className={`pill ${it.status==='PENDING'?'yellow': it.status==='APPROVED'?'green':'red'}`}>
                      {it.status}
                    </span>
                  </td>
                  <td>{new Date(it.createdAt).toLocaleString('pt-BR')}</td>
                  <td>{it.decidedAt ? new Date(it.decidedAt).toLocaleString('pt-BR') : '—'}</td>
                  <td>
                    {it.status === 'PENDING' && (
                      <>
                        <button className="btn" disabled={submitting} onClick={() => approve(it.id, it.name)}>
                          Aprovar
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ marginLeft: 8 }} 
                          onClick={() => openReject(it.id, it.name)}
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {rejectModal && (
        <div className="modal-overlay" onClick={()=>setRejectModal(null)}>
          <div className="modal-content" style={{maxWidth:520}} onClick={e=>e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rejeitar solicitação</h3>
              <button className="modal-close" onClick={()=>setRejectModal(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="muted" style={{marginBottom:8}}>Informe o motivo (opcional) para rejeitar "{rejectModal.name}".</div>
              <textarea className="textarea" placeholder="Motivo da rejeição (opcional)" value={rejectReason} onChange={e=>setRejectReason(e.target.value)} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={()=>setRejectModal(null)}>Cancelar</button>
              <button className="btn btn-danger" disabled={submitting} onClick={confirmReject}>Confirmar rejeição</button>
            </div>
          </div>
        </div>
      )}
    </>
  )

  return embed ? body : <Layout>{body}</Layout>
}
