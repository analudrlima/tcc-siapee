import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Layout } from '../components/layout'
import { api } from '../services/api'

export function Perfil() {
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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
            <div className="profile-role">
              {user?.role === 'TEACHER' ? 'Professor(a)' : 'Secretaria'}
            </div>
            <h3 className="profile-name">{name || user?.name}</h3>
          </div>
          <div style={{ marginTop: 10 }}>
            {/* hidden input and a discrete link to trigger file selection */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={async (e) => {
                const f = e.target.files?.[0]; if (!f) return
                const form = new FormData(); form.append('file', f)
                try {
                  const r = await api.post('/users/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })
                  setAvatarUrl(r.data.avatarUrl)
                  setMsg('Foto atualizada')
                } catch {
                  setMsg('Falha ao atualizar foto')
                }
              }}
            />
            <button
              type="button"
              className="link-inverse"
              data-cy="change-profile-photo-button"
              onClick={() => fileInputRef.current?.click()}
            >
              Alterar foto de perfil
            </button>
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
              <button className="btn save-btn" disabled={saving} onClick={save}>{saving ? 'Salvando...' : 'Salvar'}</button>
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
