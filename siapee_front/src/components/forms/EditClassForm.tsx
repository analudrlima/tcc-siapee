import { useState } from 'react'

interface EditClassFormProps {
  klass: any
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export function EditClassForm({ klass, onSave, onCancel }: EditClassFormProps) {
  const [name, setName] = useState(klass.name || '')
  const [code, setCode] = useState(klass.code || '')
  const [year, setYear] = useState(klass.year ? String(klass.year) : String(new Date().getFullYear()))
  const [disciplines, setDisciplines] = useState<string[]>(klass.disciplines || [])
  const [saving, setSaving] = useState(false)
  const availableDisciplines = ['Artes','Português','Matemática','História','Geografia','Ciências','Inglês','Educação Física']

  const handleSave = async () => {
    if (!name.trim() || !code.trim() || !year.trim()) return
    setSaving(true)
    try {
      await onSave({ name: name.trim(), code: code.trim(), year: Number(year), disciplines })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="form-grid">
        <div className="field"><label>Nome</label><input className="input" placeholder="Ex.: 5º Ano A" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div className="field"><label>Código</label><input className="input" placeholder="Ex.: 5A-2025" value={code} onChange={e=>setCode(e.target.value)} /></div>
        <div className="field"><label>Ano</label><input className="input" type="number" min="2000" max="2100" value={year} onChange={e=>setYear(e.target.value)} /></div>
      </div>
      <div style={{fontWeight:600, marginTop:12, marginBottom:8}}>Disciplinas da turma (opcional)</div>
      <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:12}}>
        {availableDisciplines.map(d => (
          <label key={d} className="discipline-checkbox" style={{padding:'8px 10px'}}>
            <input type="checkbox" checked={disciplines.includes(d)} onChange={() => setDisciplines(prev => prev.includes(d) ? prev.filter(x=>x!==d) : [...prev, d])} />
            <span className="checkmark"></span>{d}
          </label>
        ))}
      </div>
      <div className="form-row" style={{gap:8}}>
        <button className="btn" onClick={handleSave} disabled={saving}>Salvar</button>
        <button className="btn btn-outline" onClick={onCancel}>Cancelar</button>
      </div>
    </div>
  )
}
