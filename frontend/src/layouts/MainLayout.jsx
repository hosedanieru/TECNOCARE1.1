import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navLinkClass = ({ isActive }) =>
  `transition text-sm ${isActive ? 'text-blue-300 font-semibold' : 'text-gray-300 hover:text-white'}`

export default function MainLayout() {
  const { usuario, logout, puedeVerReportes, puedeGestionarUsuarios } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-bold text-lg tracking-wide">
            {import.meta.env.VITE_APP_NAME || 'TecnoCare'}
          </span>
          <div className="flex gap-5">
            <NavLink to="/" end className={navLinkClass}>Inicio</NavLink>
            <NavLink to="/equipos" className={navLinkClass}>Equipos</NavLink>
            <NavLink to="/mantenimientos" className={navLinkClass}>Mantenimientos</NavLink>
            <NavLink to="/alertas" className={navLinkClass}>Alertas</NavLink>
            {puedeVerReportes && (
              <NavLink to="/reportes" className={navLinkClass}>Reportes</NavLink>
            )}
            {puedeGestionarUsuarios && (
              <NavLink to="/usuarios" className={navLinkClass}>Usuarios</NavLink>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-400">
            {usuario?.nombre_completo}{' '}
            <span className="text-blue-400">({usuario?.rol_display})</span>
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition text-sm"
          >
            Salir
          </button>
        </div>
      </nav>
      <main className="p-6 max-w-screen-xl mx-auto">
        <Outlet />
      </main>
    </div>
  )
}
