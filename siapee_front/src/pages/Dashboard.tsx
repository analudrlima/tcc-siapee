import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Layout } from '../components/layout'
import { api } from '../services/api'

export function Dashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{
    totalStudents: number
    totalClasses: number
    totalActivities: number
    totalProjects: number
    recentActivities: any[]
  }>({
    totalStudents: 0,
    totalClasses: 0,
    totalActivities: 0,
    totalProjects: 0,
    recentActivities: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true)
      try {
        const [studentsRes, classesRes] = await Promise.all([
          api.get('/students'),
          api.get('/classes')
        ])

        // Carregar atividades e projetos recentes
        let recentActivities: any[] = []
        let totalAct = 0
        let totalProj = 0
        
        if (classesRes.data.length > 0) {
          const firstClassId = classesRes.data[0].id
          try {
            const actRes = await api.get(`/classes/${firstClassId}/activities`)
            totalAct = actRes.data.length
            recentActivities = [...recentActivities, ...actRes.data.slice(0, 3).map((a: any) => ({ ...a, type: 'Atividade' }))]
          } catch {}
          
          try {
            const projRes = await api.get(`/classes/${firstClassId}/projects`)
            totalProj = projRes.data.length
            recentActivities = [...recentActivities, ...projRes.data.slice(0, 2).map((p: any) => ({ ...p, type: 'Projeto' }))]
          } catch {}
        }

        setStats({
          totalStudents: studentsRes.data.length,
          totalClasses: classesRes.data.length,
          totalActivities: totalAct,
          totalProjects: totalProj,
          recentActivities: recentActivities.slice(0, 5)
        })
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [])

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <h1 className="title">Bem-vindo(a), {user?.name?.split(' ')[0] || 'Usuário'}!</h1>
          <p className="dashboard-subtitle">SIAPEE - Sistema Integrado de Apoio para Educação Especial</p>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>Carregando estatísticas...</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e3f2fd' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0b3e79" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalStudents}</div>
                  <div className="stat-label">Alunos cadastrados</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e0f2f1' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0c757c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalClasses}</div>
                  <div className="stat-label">Turmas ativas</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e8eaf6' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#164d93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalActivities}</div>
                  <div className="stat-label">Atividades registradas</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e1f5fe' }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0c757c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                </div>
                <div className="stat-info">
                  <div className="stat-value">{stats.totalProjects}</div>
                  <div className="stat-label">Projetos em andamento</div>
                </div>
              </div>
            </div>

            <div className="dashboard-content">
              <div className="dashboard-section">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">Atividades recentes</div>
                  </div>
                  <div className="panel">
                    {stats.recentActivities.length > 0 ? (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Tipo</th>
                            <th>Título</th>
                            <th>Disciplina</th>
                            <th>Data</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentActivities.map((item, idx) => (
                            <tr key={idx}>
                              <td><span className="badge">{item.type}</span></td>
                              <td>{item.title}</td>
                              <td>{item.discipline || '-'}</td>
                              <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                        Nenhuma atividade recente
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}
