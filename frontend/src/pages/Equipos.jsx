import { useEffect, useState } from 'react'
import { equiposService } from '../services/equipos'
import { usuariosService } from '../services/usuarios'
import { useAuth } from '../context/AuthContext'

const formVacio = {
  nombre: '', categoria: '', marca: '', ubicacion: '',
  frecuencia_mantenimiento_dias: 90, fecha_adquisicion: '',
  fecha_ultimo_mantenimiento: '', responsable: '',
}

export default function Equipos() {
  const [equipos, setEquipos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [error, setError] = useState('')
  const { esAdministrador, esSupervisor, esTecnico, usuario } = useAuth()
  const puedeGestionar = esAdministrador
  const [form, setForm] = useState(formVacio)

  const cargarDatos = async () => {
    setCargando(true)
    const params = {}

    // Si es técnico, solo ve sus equipos asignados
    if (esTecnico) {
      params.responsable = usuario.id
    }

    const [resEquipos, resCategorias, resTecnicos] = await Promise.all([
      equiposService.listar(params),
      equiposService.categorias(),
      usuariosService.listar({ rol: 'TECNICO', is_active: true }),
    ])
    setEquipos(resEquipos.data.results || resEquipos.data)
    setCategorias(resCategorias.data.results || resCategorias.data)
    setTecnicos(resTecnicos.data.results || resTecnicos.data)
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [])

  const abrirNuevo = () => {
    setEditandoId(null)
    setForm(formVacio)
    setError('')
    setMostrarForm(true)
  }

  const abrirEdicion = (eq) => {
    setEditandoId(eq.id)
    setForm({
      nombre: eq.nombre,
      categoria: eq.categoria,
      marca: eq.marca || '',
      ubicacion: eq.ubicacion,
      frecuencia_mantenimiento_dias: eq.frecuencia_mantenimiento_dias,
      fecha_adquisicion: eq.fecha_adquisicion || '',
      fecha_ultimo_mantenimiento: eq.fecha_ultimo_mantenimiento || '',
      responsable: eq.responsable || '',
    })
    setError('')
    setMostrarForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const datos = { ...form }
    if (!datos.fecha_adquisicion) delete datos.fecha_adquisicion
    if (!datos.fecha_ultimo_mantenimiento) delete datos.fecha_ultimo_mantenimiento
    if (!datos.responsable) delete datos.responsable

    try {
      if (editandoId) {
        await equiposService.actualizar(editandoId, datos)
      } else {
        await equiposService.crear(datos)
      }
      setMostrarForm(false)
      setForm(formVacio)
      setEditandoId(null)
      cargarDatos()
    } catch (err) {
      const data = err.response?.data
      if (data) {
        const msgs = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(' | ')
        setError(msgs)
      } else {
        setError('Error al guardar el equipo.')
      }
    }
  }

  const estadoColor = {
    OPERATIVO: 'bg-green-100 text-green-800',
    EN_MANTENIMIENTO: 'bg-yellow-100 text-yellow-800',
    FUERA_DE_SERVICIO: 'bg-red-100 text-red-800',
    DADO_DE_BAJA: 'bg-gray-100 text-gray-800',
  }

  if (cargando) return <p>Cargando equipos...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Equipos</h1>
          {esTecnico && (
            <p className="text-sm text-gray-500 mt-1">
              Mostrando solo los equipos asignados a ti
            </p>
          )}
        </div>
        {puedeGestionar && (
          <button
            onClick={() => mostrarForm ? setMostrarForm(false) : abrirNuevo()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {mostrarForm ? 'Cancelar' : '+ Nuevo Equipo'}
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <h2 className="col-span-2 font-semibold text-gray-700">
            {editandoId ? 'Editar equipo' : 'Nuevo equipo'}
          </h2>

          {error && (
            <div className="col-span-2 bg-red-100 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <input placeholder="Nombre" required value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border rounded px-3 py-2" />

          <select required value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            className="border rounded px-3 py-2">
            <option value="">Selecciona categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>

          <input placeholder="Marca" value={form.marca}
            onChange={(e) => setForm({ ...form, marca: e.target.value })}
            className="border rounded px-3 py-2" />

          <input placeholder="Ubicación" required value={form.ubicacion}
            onChange={(e) => setForm({ ...form, ubicacion: e.target.value })}
            className="border rounded px-3 py-2" />

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Técnico responsable
            <select value={form.responsable}
              onChange={(e) => setForm({ ...form, responsable: e.target.value })}
              className="border rounded px-3 py-2">
              <option value="">Sin asignar</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.first_name} {t.last_name} ({t.username})
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Frecuencia mantenimiento (días)
            <input type="number" value={form.frecuencia_mantenimiento_dias}
              onChange={(e) => setForm({ ...form, frecuencia_mantenimiento_dias: e.target.value })}
              className="border rounded px-3 py-2" />
          </label>

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Fecha de adquisición
            <input type="date" value={form.fecha_adquisicion}
              onChange={(e) => setForm({ ...form, fecha_adquisicion: e.target.value })}
              className="border rounded px-3 py-2" />
          </label>

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Último mantenimiento
            <input type="date" value={form.fecha_ultimo_mantenimiento}
              onChange={(e) => setForm({ ...form, fecha_ultimo_mantenimiento: e.target.value })}
              className="border rounded px-3 py-2" />
          </label>

          <button type="submit"
            className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">
            {editandoId ? 'Guardar cambios' : 'Guardar Equipo'}
          </button>
        </form>
      )}

      {equipos.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-8 rounded text-center">
          {esTecnico
            ? 'No tienes equipos asignados actualmente.'
            : 'No hay equipos registrados aún.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3">Código</th>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Próximo mant.</th>
                {puedeGestionar && <th className="px-4 py-3">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {equipos.map((eq) => (
                <tr key={eq.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{eq.codigo_interno}</td>
                  <td className="px-4 py-3">{eq.nombre}</td>
                  <td className="px-4 py-3">{eq.categoria_nombre}</td>
                  <td className="px-4 py-3">{eq.ubicacion}</td>
                  <td className="px-4 py-3">{eq.responsable_nombre || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${estadoColor[eq.estado]}`}>
                      {eq.estado_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">{eq.proximo_mantenimiento || '—'}</td>
                  {puedeGestionar && (
                    <td className="px-4 py-3">
                      <button onClick={() => abrirEdicion(eq)}
                        className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
