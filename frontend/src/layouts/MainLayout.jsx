import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChatbotIA from '../components/ChatbotIA'

export default function MainLayout() {
  const { usuario, logout, esAdministrador, esSupervisor } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="font-bold text-lg">TecnoCare</span>
          <div className="flex gap-4 text-sm">
            <Link to="/" className="hover:text-blue-300">Inicio</Link>
            <Link to="/equipos" className="hover:text-blue-300">Equipos</Link>
            <Link to="/mantenimientos" className="hover:text-blue-300">Mantenimientos</Link>
            <Link to="/alertas" className="hover:text-blue-300">Alertas</Link>
            {(esAdministrador || esSupervisor) && (
              <Link to="/reportes" className="hover:text-blue-300">Reportes</Link>
            )}
            {esAdministrador && (
              <Link to="/usuarios" className="hover:text-blue-300">Usuarios</Link>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-300">
            {usuario?.nombre_completo} <span className="text-blue-400">({usuario?.rol_display})</span>
          </span>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded transition"
          >
            Salir
          </button>
        </div>
      </nav>
      <main className="p-6">
        <Outlet />
      </main>
      <ChatbotIA />
    </div>
  )
}
