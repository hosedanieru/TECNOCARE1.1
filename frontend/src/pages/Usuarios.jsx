import { useEffect, useState } from 'react'
import { usuariosService } from '../services/usuarios'
import { extractErrorMessage } from '../hooks/useErrorHandler'

const ROLES = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'TECNICO', label: 'Técnico' },
]

const FORM_VACIO = {
  username: '', first_name: '', last_name: '',
  email: '', rol: 'TECNICO', telefono: '', cargo: '',
  password: '', password2: '',
}

const ROL_COLOR = {
  ADMIN: 'bg-red-100 text-red-800',
  SUPERVISOR: 'bg-blue-100 text-blue-800',
  TECNICO: 'bg-green-100 text-green-800',
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(FORM_VACIO)
  const [filtroRol, setFiltroRol] = useState('')
  const [filtroActivo, setFiltroActivo] = useState('')

  const cargarUsuarios = async () => {
    setCargando(true)
    const params = {}
    if (filtroRol) params.rol = filtroRol
    if (filtroActivo !== '') params.is_active = filtroActivo
    const res = await usuariosService.listar(params)
    setUsuarios(res.data.results || res.data)
    setCargando(false)
  }

  useEffect(() => { cargarUsuarios() }, [filtroRol, filtroActivo])

  const abrirNuevo = () => {
    setEditandoId(null)
    setForm(FORM_VACIO)
    setError('')
    setMostrarForm(true)
  }

  const abrirEdicion = (u) => {
    setEditandoId(u.id)
    setForm({
      username: u.username,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      rol: u.rol,
      telefono: u.telefono || '',
      cargo: u.cargo || '',
      password: '',
      password2: '',
    })
    setError('')
    setMostrarForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editandoId) {
        const datos = { ...form }
        delete datos.password
        delete datos.password2
        delete datos.username
        await usuariosService.actualizar(editandoId, datos)
      } else {
        if (form.password !== form.password2) {
          setError('Las contraseñas no coinciden.')
          return
        }
        await usuariosService.crear(form)
      }
      setMostrarForm(false)
      setForm(FORM_VACIO)
      setEditandoId(null)
      cargarUsuarios()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleToggleActivo = async (u) => {
    const accion = u.is_active ? 'desactivar' : 'reactivar'
    if (!confirm(`¿${u.is_active ? 'Desactivar' : 'Reactivar'} a ${u.username}?`)) return
    try {
      if (u.is_active) {
        await usuariosService.desactivar(u.id)
      } else {
        await usuariosService.reactivar(u.id)
      }
      cargarUsuarios()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  if (cargando) return <p className="text-gray-500 p-6">Cargando usuarios...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios y Roles</h1>
        <button onClick={abrirNuevo}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          + Nuevo Usuario
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <select value={filtroRol} onChange={(e) => setFiltroRol(e.target.value)}
          className="border rounded px-3 py-2 text-sm">
          <option value="">Todos los roles</option>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={filtroActivo} onChange={(e) => setFiltroActivo(e.target.value)}
          className="border rounded px-3 py-2 text-sm">
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Form */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <h2 className="col-span-2 font-semibold text-gray-700">
            {editandoId ? 'Editar usuario' : 'Nuevo usuario'}
          </h2>
          {error && (
            <div className="col-span-2 bg-red-100 text-red-700 px-4 py-2 rounded text-sm">{error}</div>
          )}

          <input placeholder="Username" required value={form.username} disabled={!!editandoId}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="border rounded px-3 py-2 disabled:bg-gray-50" />

          <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}
            className="border rounded px-3 py-2">
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          <input placeholder="Nombre" value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="border rounded px-3 py-2" />

          <input placeholder="Apellido" value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="border rounded px-3 py-2" />

          <input placeholder="Email" type="email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border rounded px-3 py-2" />

          <input placeholder="Cargo" value={form.cargo}
            onChange={(e) => setForm({ ...form, cargo: e.target.value })}
            className="border rounded px-3 py-2" />

          <input placeholder="Teléfono" value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            className="border rounded px-3 py-2" />

          <div />

          {!editandoId && (
            <>
              <input placeholder="Contraseña" type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="border rounded px-3 py-2" />
              <input placeholder="Confirmar contraseña" type="password" required value={form.password2}
                onChange={(e) => setForm({ ...form, password2: e.target.value })}
                className="border rounded px-3 py-2" />
            </>
          )}

          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setMostrarForm(false)}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {editandoId ? 'Guardar cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Nombre completo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Cargo</th>
              <th className="px-4 py-3">Teléfono</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">{u.nombre_completo}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${ROL_COLOR[u.rol]}`}>
                    {u.rol_display}
                  </span>
                </td>
                <td className="px-4 py-3">{u.cargo || '—'}</td>
                <td className="px-4 py-3">{u.telefono || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                    {u.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-2">
                  <button onClick={() => abrirEdicion(u)}
                    className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">
                    Editar
                  </button>
                  <button onClick={() => handleToggleActivo(u)}
                    className={`text-xs px-2 py-1 rounded ${u.is_active ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                    {u.is_active ? 'Desactivar' : 'Reactivar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
