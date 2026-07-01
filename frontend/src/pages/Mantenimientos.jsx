import { useEffect, useState } from 'react'
import { mantenimientosService } from '../services/mantenimientos'
import { equiposService } from '../services/equipos'
import { usuariosService } from '../services/usuarios'
import { useAuth } from '../context/AuthContext'
import ChatbotIA from '../components/ChatbotIA'

export default function Mantenimientos() {
  const [mantenimientos, setMantenimientos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const { esAdministrador, esSupervisor, esTecnico, usuario } = useAuth()
  const puedeCrear = esAdministrador || esSupervisor

  const [form, setForm] = useState({
    equipo: '', tipo: 'PREVENTIVO', titulo: '', descripcion: '',
    fecha_programada: '', tecnico_asignado: '',
    costo_repuestos: 0, costo_mano_obra: 0,
  })

  const cargarDatos = async () => {
    setCargando(true)
    const params = {}
    if (esTecnico) params.tecnico_asignado = usuario.id

    const [resMant, resEq, resTec] = await Promise.all([
      mantenimientosService.listar(params),
      equiposService.listar(esTecnico ? { responsable: usuario.id } : {}),
      usuariosService.listar({ rol: 'TECNICO', is_active: true }),
    ])
    setMantenimientos(resMant.data.results || resMant.data)
    setEquipos(resEq.data.results || resEq.data)
    setTecnicos(resTec.data.results || resTec.data)
    setCargando(false)
  }

  useEffect(() => { cargarDatos() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const datos = { ...form }
    if (!datos.tecnico_asignado) delete datos.tecnico_asignado
    await mantenimientosService.crear(datos)
    setMostrarForm(false)
    setForm({ equipo: '', tipo: 'PREVENTIVO', titulo: '', descripcion: '',
              fecha_programada: '', tecnico_asignado: '', costo_repuestos: 0, costo_mano_obra: 0 })
    cargarDatos()
  }

  const handleIniciar = async (id) => {
    await mantenimientosService.iniciar(id)
    cargarDatos()
  }

  const handleFinalizar = async (id) => {
    const solucion = prompt('Describe brevemente la solución aplicada:')
    if (solucion === null) return
    await mantenimientosService.finalizar(id, { solucion_aplicada: solucion })
    cargarDatos()
  }

  const aplicarSugerencia = (sugerencia) => {
    setForm((prev) => ({
      ...prev,
      equipo: sugerencia.equipo || prev.equipo,
      tipo: sugerencia.tipo_sugerido || prev.tipo,
      descripcion: prev.descripcion || sugerencia.diagnostico_sugerido,
      costo_repuestos: sugerencia.costo_repuestos_estimado || 0,
      costo_mano_obra: sugerencia.costo_mano_obra_estimado || 0,
    }))
    setMostrarForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const estadoColor = {
    PROGRAMADO: 'bg-blue-100 text-blue-800',
    EN_PROCESO: 'bg-yellow-100 text-yellow-800',
    FINALIZADO: 'bg-green-100 text-green-800',
    CANCELADO: 'bg-gray-100 text-gray-800',
  }

  const tipoColor = {
    PREVENTIVO: 'bg-emerald-100 text-emerald-800',
    CORRECTIVO: 'bg-orange-100 text-orange-800',
    PREDICTIVO: 'bg-purple-100 text-purple-800',
  }

  if (cargando) return <p>Cargando mantenimientos...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mantenimientos</h1>
          {esTecnico && (
            <p className="text-sm text-gray-500 mt-1">Mostrando solo los mantenimientos asignados a ti</p>
          )}
        </div>
        {puedeCrear && (
          <button onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
            {mostrarForm ? 'Cancelar' : '+ Nuevo Mantenimiento'}
          </button>
        )}
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <h2 className="col-span-2 font-semibold text-gray-700">Nuevo mantenimiento</h2>

          <select required value={form.equipo}
            onChange={(e) => setForm({ ...form, equipo: e.target.value })}
            className="border rounded px-3 py-2">
            <option value="">Selecciona equipo</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.codigo_interno} — {eq.nombre}</option>
            ))}
          </select>

          <select required value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            className="border rounded px-3 py-2">
            <option value="PREVENTIVO">Preventivo</option>
            <option value="CORRECTIVO">Correctivo</option>
            <option value="PREDICTIVO">Predictivo</option>
          </select>

          <input placeholder="Título" required value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="border rounded px-3 py-2 col-span-2" />

          <textarea placeholder="Descripción del problema" required value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="border rounded px-3 py-2 col-span-2" rows={3} />

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Fecha programada
            <input type="date" required value={form.fecha_programada}
              onChange={(e) => setForm({ ...form, fecha_programada: e.target.value })}
              className="border rounded px-3 py-2" />
          </label>

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Técnico asignado
            <select value={form.tecnico_asignado}
              onChange={(e) => setForm({ ...form, tecnico_asignado: e.target.value })}
              className="border rounded px-3 py-2">
              <option value="">Sin asignar</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.first_name} {t.last_name} ({t.username})</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Costo repuestos (COP)
            <input type="number" value={form.costo_repuestos} min="0"
              onChange={(e) => setForm({ ...form, costo_repuestos: e.target.value })}
              className="border rounded px-3 py-2" />
          </label>

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Costo mano de obra (COP)
            <input type="number" value={form.costo_mano_obra} min="0"
              onChange={(e) => setForm({ ...form, costo_mano_obra: e.target.value })}
              className="border rounded px-3 py-2" />
          </label>

          <div className="col-span-2 bg-blue-50 rounded px-4 py-2 text-sm text-blue-700">
            Total estimado: <span className="font-bold">
              ${(Number(form.costo_repuestos) + Number(form.costo_mano_obra)).toLocaleString('es-CO')}
            </span>
          </div>

          <button type="submit"
            className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Guardar Mantenimiento
          </button>
        </form>
      )}

      {mantenimientos.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 text-gray-500 px-4 py-8 rounded text-center">
          {esTecnico ? 'No tienes mantenimientos asignados.' : 'No hay mantenimientos registrados.'}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3">Equipo</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Costo total</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mantenimientos.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{m.equipo_codigo}</td>
                  <td className="px-4 py-3">{m.titulo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${tipoColor[m.tipo]}`}>
                      {m.tipo_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${estadoColor[m.estado]}`}>
                      {m.estado_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.tecnico_nombre}</td>
                  <td className="px-4 py-3">{m.fecha_programada}</td>
                  <td className="px-4 py-3 font-medium">
                    ${Number(m.costo_total).toLocaleString('es-CO')}
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    {m.estado === 'PROGRAMADO' && (esTecnico || puedeCrear) && (
                      <button onClick={() => handleIniciar(m.id)}
                        className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                        Iniciar
                      </button>
                    )}
                    {m.estado === 'EN_PROCESO' && (esTecnico || puedeCrear) && (
                      <button onClick={() => handleFinalizar(m.id)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                        Finalizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ChatbotIA onAplicarSugerencia={aplicarSugerencia} />
    </div>
  )
}
