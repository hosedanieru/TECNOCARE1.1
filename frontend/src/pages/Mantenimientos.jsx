import { useEffect, useState } from 'react'
import { mantenimientosService } from '../services/mantenimientos'
import { equiposService } from '../services/equipos'
import { usuariosService } from '../services/usuarios'
import { useAuth } from '../context/AuthContext'
import { extractErrorMessage } from '../hooks/useErrorHandler'

const ESTADO_COLOR = {
  PROGRAMADO: 'bg-blue-100 text-blue-800',
  EN_PROCESO: 'bg-yellow-100 text-yellow-800',
  FINALIZADO: 'bg-green-100 text-green-800',
  CANCELADO: 'bg-gray-100 text-gray-800',
}

const TIPO_COLOR = {
  PREVENTIVO: 'bg-emerald-100 text-emerald-800',
  CORRECTIVO: 'bg-orange-100 text-orange-800',
  PREDICTIVO: 'bg-purple-100 text-purple-800',
}

const PRIORIDAD_COLOR = {
  BAJA: 'bg-gray-100 text-gray-600',
  MEDIA: 'bg-blue-100 text-blue-700',
  ALTA: 'bg-orange-100 text-orange-700',
  CRITICA: 'bg-red-100 text-red-700',
}

const FORM_VACIO = {
  equipo: '', tipo: 'PREVENTIVO', prioridad: 'MEDIA',
  titulo: '', descripcion: '', fecha_programada: '', tecnico_asignado: '',
}

export default function Mantenimientos() {
  const [mantenimientos, setMantenimientos] = useState([])
  const [equipos, setEquipos] = useState([])
  const [tecnicos, setTecnicos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(FORM_VACIO)

  // Modal finalizar
  const [finalizandoId, setFinalizandoId] = useState(null)
  const [formFinalizar, setFormFinalizar] = useState({
    solucion_aplicada: '', diagnostico: '', costo_repuestos: '', costo_mano_obra: '',
  })

  const { esTecnico, puedeCrearMantenimiento, usuario } = useAuth()

  const cargarDatos = async () => {
    setCargando(true)
    const params = esTecnico ? { tecnico_asignado: usuario.id } : {}
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
    setError('')
    const datos = { ...form }
    if (!datos.tecnico_asignado) delete datos.tecnico_asignado
    try {
      await mantenimientosService.crear(datos)
      setMostrarForm(false)
      setForm(FORM_VACIO)
      cargarDatos()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleIniciar = async (id) => {
    try {
      await mantenimientosService.iniciar(id)
      cargarDatos()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  const handleFinalizar = async (e) => {
    e.preventDefault()
    try {
      await mantenimientosService.finalizar(finalizandoId, formFinalizar)
      setFinalizandoId(null)
      setFormFinalizar({ solucion_aplicada: '', diagnostico: '', costo_repuestos: '', costo_mano_obra: '' })
      cargarDatos()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  const handleCancelar = async (id, titulo) => {
    const motivo = prompt(`¿Motivo para cancelar "${titulo}"? (opcional)`)
    if (motivo === null) return
    try {
      await mantenimientosService.cancelar(id, motivo)
      cargarDatos()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  if (cargando) return <p className="text-gray-500 p-6">Cargando mantenimientos...</p>

  return (
    <div>
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Mantenimientos</h1>
          {esTecnico && (
            <p className="text-sm text-gray-500 mt-1">Mostrando tus mantenimientos asignados</p>
          )}
        </div>
        {puedeCrearMantenimiento && (
          <button
            onClick={() => setMostrarForm(!mostrarForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {mostrarForm ? 'Cancelar' : '+ Nuevo Mantenimiento'}
          </button>
        )}
      </div>

      {/* Formulario nuevo */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <h2 className="col-span-2 font-semibold text-gray-700">Nuevo mantenimiento</h2>
          {error && (
            <div className="col-span-2 bg-red-100 text-red-700 px-4 py-2 rounded text-sm">{error}</div>
          )}

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

          <select value={form.prioridad}
            onChange={(e) => setForm({ ...form, prioridad: e.target.value })}
            className="border rounded px-3 py-2">
            <option value="BAJA">Baja</option>
            <option value="MEDIA">Media</option>
            <option value="ALTA">Alta</option>
            <option value="CRITICA">Crítica</option>
          </select>

          <label className="text-sm text-gray-600 flex flex-col gap-1">
            Fecha programada
            <input type="date" required value={form.fecha_programada}
              onChange={(e) => setForm({ ...form, fecha_programada: e.target.value })}
              className="border rounded px-3 py-2" />
          </label>

          <input placeholder="Título" required value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            className="border rounded px-3 py-2 col-span-2" />

          <textarea placeholder="Descripción del trabajo a realizar" required
            value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="border rounded px-3 py-2 col-span-2" rows={3} />

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

          <button type="submit"
            className="col-span-2 bg-green-600 text-white py-2 rounded hover:bg-green-700">
            Guardar Mantenimiento
          </button>
        </form>
      )}

      {/* Modal finalizar */}
      {finalizandoId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleFinalizar} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md grid gap-4">
            <h2 className="font-semibold text-gray-800 text-lg">Finalizar mantenimiento</h2>

            <textarea placeholder="Diagnóstico (opcional)"
              value={formFinalizar.diagnostico}
              onChange={(e) => setFormFinalizar({ ...formFinalizar, diagnostico: e.target.value })}
              className="border rounded px-3 py-2" rows={2} />

            <textarea placeholder="Solución aplicada" required
              value={formFinalizar.solucion_aplicada}
              onChange={(e) => setFormFinalizar({ ...formFinalizar, solucion_aplicada: e.target.value })}
              className="border rounded px-3 py-2" rows={3} />

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-gray-600 flex flex-col gap-1">
                Costo repuestos ($)
                <input type="number" min="0" step="0.01"
                  value={formFinalizar.costo_repuestos}
                  onChange={(e) => setFormFinalizar({ ...formFinalizar, costo_repuestos: e.target.value })}
                  className="border rounded px-3 py-2" />
              </label>
              <label className="text-sm text-gray-600 flex flex-col gap-1">
                Costo mano de obra ($)
                <input type="number" min="0" step="0.01"
                  value={formFinalizar.costo_mano_obra}
                  onChange={(e) => setFormFinalizar({ ...formFinalizar, costo_mano_obra: e.target.value })}
                  className="border rounded px-3 py-2" />
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setFinalizandoId(null)}
                className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">
                Cancelar
              </button>
              <button type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                Confirmar finalización
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
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
                <th className="px-4 py-3">Prioridad</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Técnico</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {mantenimientos.map((m) => (
                <tr key={m.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.equipo_codigo}</td>
                  <td className="px-4 py-3">{m.titulo}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${TIPO_COLOR[m.tipo]}`}>
                      {m.tipo_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${PRIORIDAD_COLOR[m.prioridad]}`}>
                      {m.prioridad_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${ESTADO_COLOR[m.estado]}`}>
                      {m.estado_display}
                    </span>
                  </td>
                  <td className="px-4 py-3">{m.tecnico_nombre}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{m.fecha_programada}</td>
                  <td className="px-4 py-3 space-x-1 whitespace-nowrap">
                    {m.estado === 'PROGRAMADO' && (esTecnico || puedeCrearMantenimiento) && (
                      <button onClick={() => handleIniciar(m.id)}
                        className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                        Iniciar
                      </button>
                    )}
                    {m.estado === 'EN_PROCESO' && (esTecnico || puedeCrearMantenimiento) && (
                      <button onClick={() => setFinalizandoId(m.id)}
                        className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                        Finalizar
                      </button>
                    )}
                    {['PROGRAMADO', 'EN_PROCESO'].includes(m.estado) && puedeCrearMantenimiento && (
                      <button onClick={() => handleCancelar(m.id, m.titulo)}
                        className="text-xs bg-gray-300 text-gray-700 px-2 py-1 rounded hover:bg-gray-400">
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
