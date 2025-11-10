import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export function Sidebar() {
  const { user } = useAuth()
  
  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <div className="nav-group">
          <div className="nav-heading">Início</div>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/dashboard">Tela de Início</NavLink>
        </div>
        <div className="nav-group">
          <div className="nav-heading">Gerenciamento</div>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/turmas">Turmas</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/alunos">Alunos</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/planejamento">Planejamento</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/faltas">Registro de faltas</NavLink>
        </div>
        <div className="nav-group">
          <div className="nav-heading">Acadêmico</div>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/atividades">Atividades</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/avaliacoes">Avaliações</NavLink>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/projetos">Projetos</NavLink>
        </div>
        <div className="nav-group">
          <div className="nav-heading">Minha Conta</div>
          <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/perfil">Meu perfil</NavLink>
        </div>
        {(user?.role === 'ADMIN' || user?.role === 'SECRETARY') && (
          <div className="nav-group">
              <div className="nav-heading">Secretaria</div>
              <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/secretaria/alunos">Alunos e Turmas</NavLink>
              <NavLink className={({isActive}) => isActive ? 'link active' : 'link'} to="/secretaria/usuarios">Usuários</NavLink>
          </div>
        )}
      </div>
    </aside>
  )
}
