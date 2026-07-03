import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logoTecnocare from '../assets/logo_tecnocare2.png'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err) {
      setError('Usuario o contraseña incorrectos.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEDEE] p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-[1.05fr_1fr] bg-white rounded shadow-xl overflow-hidden">

        {/* Panel izquierdo — marca / estado del sistema */}
        <div className="hidden md:flex relative flex-col justify-between bg-[#0A0A0B] text-[#C7C9CC] p-11 overflow-hidden">
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.09) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-16">
              <span className="w-2 h-2 rounded-full bg-[#7CF29C] shadow-[0_0_0_3px_rgba(124,242,156,0.15)]" />
              <span
                className="text-[11px] uppercase tracking-widest text-[#6B6E74]"
                style={{ fontFamily: "'IBM Plex Mono', monospace" }}
              >
                Bienvenido seas tecnico
              </span>
            </div>

            <h1
              className="text-[34px] leading-tight font-semibold text-[#FAFAFA] max-w-[340px] mb-4"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              TecnoCare
            </h1>
            <p className="text-sm leading-relaxed text-[#6B6E74] max-w-[300px]">
              Registra, prioriza y da seguimiento a cada intervención técnica desde un solo lugar.
            </p>
          </div>

          <div className="relative z-10 my-10 flex items-center justify-center">
            <img
              src={logoTecnocare}
              alt="TecnoCare"
              className="max-h-[300px] w-auto object-contain"
            />
          </div>
        </div>

        {/* Panel derecho — formulario */}
        <div className="p-10 md:p-14 flex flex-col justify-center">
          <div className="mb-9">
            <div
              className="text-[11px] uppercase tracking-widest text-[#6B6E74] mb-2"
              style={{ fontFamily: "'IBM Plex Mono', monospace" }}
            >
              ACCESO TECNICO
            </div>
            <h2
              className="text-2xl font-semibold text-[#0A0A0B]"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              Inicia sesión
            </h2>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2.5 rounded text-sm mb-5 border border-red-100">
                {error}
              </div>
            )}

            <label className="block text-[12.5px] font-medium text-[#3A3A3D] mb-1.5">
              Usuario
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-[#DDDDDE] rounded-[3px] bg-[#FBFBFB] px-3.5 py-3 mb-5 text-[14.5px] text-[#0A0A0B] outline-none focus:border-[#0A0A0B] focus:bg-white transition-colors"
              required
              autoComplete="username"
            />

            <label className="block text-[12.5px] font-medium text-[#3A3A3D] mb-1.5">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-[#DDDDDE] rounded-[3px] bg-[#FBFBFB] px-3.5 py-3 mb-2 text-[14.5px] text-[#0A0A0B] outline-none focus:border-[#0A0A0B] focus:bg-white transition-colors"
              required
              autoComplete="current-password"
            />

            <div className="flex justify-end mb-6">
              <Link
                to="/olvide-contrasena"
                className="text-[13px] text-[#6B6E74] hover:text-[#0A0A0B] border-b border-transparent hover:border-[#0A0A0B] transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#0A0A0B] text-white py-3 rounded-[3px] font-semibold text-[14.5px] hover:bg-[#26262A] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {cargando ? 'Ingresando...' : 'Ingresar'}
              {!cargando && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
          </form>

          <p className="text-center text-[12.5px] text-[#6B6E74] mt-7">
            ¿Problemas para ingresar? Contacta al administrador del sistema al correo Hosedanieru15@gmail.com.
          </p>
        </div>
      </div>
    </div>
  )
}