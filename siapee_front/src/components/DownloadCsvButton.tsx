import { useState } from 'react'
import { api } from '../services/api'
import toast from 'react-hot-toast'

interface DownloadCsvButtonProps {
  endpoint: string // e.g. /reports/attendance.csv?classId=...
  filename?: string
  label?: string
}

export function DownloadCsvButton({ endpoint, filename, label }: DownloadCsvButtonProps) {
  const [loading, setLoading] = useState(false)
  return (
    <button
      data-cy="csv-export"
      className="btn"
      disabled={loading}
      onClick={async () => {
        try {
          setLoading(true)
          const res = await api.get(endpoint, { responseType: 'text' })
          const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = filename || 'export.csv'
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          toast.success('Exportado com sucesso')
        } catch (err: any) {
          toast.error('Falha ao exportar CSV')
        } finally {
          setLoading(false)
        }
      }}
    >{loading ? 'Exportando...' : (label || 'Exportar CSV')}</button>
  )
}
