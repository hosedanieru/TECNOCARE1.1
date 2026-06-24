import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

function parseUsuarioStorage() {
  try {
    const guardado = localStorage.getItem('usuario')
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(parseUsuarioStorage)

  const login = useCallback(async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    localStorage.setItem('usuario', JSON.stringify(data.usuario))
    setUsuario(data.usuario)
    return data.usuario
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('usuario')
    setUsuario(null)
  }, [])

  const actualizarPerfil = useCallback((datos) => {
    const actualizado = { ...usuario, ...datos }
    localStorage.setItem('usuario', JSON.stringify(actualizado))
    setUsuario(actualizado)
  }, [usuario])

  const value = {
    usuario,
    login,
    logout,
    actualizarPerfil,
    isAuthenticated: !!usuario,
    esAdministrador: usuario?.rol === 'ADMIN',
    esSupervisor: usuario?.rol === 'SUPERVISOR',
    esTecnico: usuario?.rol === 'TECNICO',
    puedeCrearMantenimiento: usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPERVISOR',
    puedeGestionarEquipos: usuario?.rol === 'ADMIN',
    puedeGestionarUsuarios: usuario?.rol === 'ADMIN',
    puedeVerReportes: usuario?.rol === 'ADMIN' || usuario?.rol === 'SUPERVISOR',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de un AuthProvider')
  return context
}
