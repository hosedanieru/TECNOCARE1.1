import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ChatbotIA from '../components/ChatbotIA'
import logoTecnocare from '../assets/logo_tecnocare2.png'

const NAV_ITEMS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/equipos', label: 'Equipos' },
  { to: '/equipos/categorias', label: 'Categorías', roles: ['ADMIN'] },
  { to: '/mantenimientos', label: 'Mantenimientos' },
  { to: '/alertas', label: 'Alertas' },
  { to: '/reportes', label: 'Reportes', roles: ['ADMIN', 'SUPERVISOR'] },
  { to: '/usuarios', label: 'Usuarios', roles: ['ADMIN'] },
]

export default function MainLayout() {
  const { usuario, logout, esAdministrador, esSupervisor } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const puedeVer = (roles) => {
    if (!roles) return true
    if (roles.includes('ADMIN') && esAdministrador) return true
    if (roles.includes('SUPERVISOR') && esSupervisor) return true
    return false
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-[#0A0A0B] text-[#C7C9CC] flex flex-col relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-50 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Logo */}
        <div className="relative z-15 px-11 pt-12 pb-11 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <img src={logoTecnocare} alt="TecnoCare" className="h-9 w-auto object-contain" />
            <span
              className="text-[27px] font-semibold text-[#FAFAFA]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              TecnoCare
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7CF29C] shadow-[0_0_0_3px_rgba(124,242,156,0.15)]" />
            <span
              className="text-[10px] uppercase tracking-widest text-[#6B6E74]"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              Hola {usuario?.nombre_completo}
            </span>
          </div>
        </div>

        {/* Navegación */}
        <nav className="relative z-10 flex-1 px-3 py-5">
          <div
            className="px-3 mb-2 text-[10.5px] uppercase tracking-widest text-[#55585E]"
            style={{ fontFamily: "'IBM Plex Mono', monospace" }}
          >
            Menú
          </div>
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.filter((item) => puedeVer(item.roles)).map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `px-3 py-2.5 rounded-[3px] text-[14px] transition-colors ${
                    isActive
                      ? 'bg-white/10 text-[#FAFAFA] font-medium'
                      : 'text-[#B8BABE] hover:bg-white/5 hover:text-[#FAFAFA]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Usuario + salir */}
        <div className="relative z-10 border-t border-white/10 px-4 py-4">
          <div className="mb-3">
            <div className="text-[13.5px] text-[#FAFAFA] truncate">{usuario?.nombre_completo}</div>
            <div
              className="text-[11px] text-[#6B6E74] uppercase tracking-wide"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {usuario?.rol_display}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-[13px] text-[#C7C9CC] border border-white/15 rounded-[3px] py-2 hover:bg-white/5 hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal */}
      <main className="flex-1 p-6 min-h-screen relative">
        {/* Marca de agua */}
        <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center">
          <img
            src={logoTecnocare}
            alt=""
            className="w-200 select-none"
            style={{ opacity: 0.05 }}
          />
        </div>
        {/* Contenido */}
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>

      <ChatbotIA />
    </div>
  )
}