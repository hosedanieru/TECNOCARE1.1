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

  // --- Edición en línea (técnicos, cuando el mantenimiento está EN_PROCESO) ---
  const [editandoId, setEditandoId] = useState(null)
  const [formEdit, setFormEdit] = useState(null)
  const [guardandoEdit, setGuardandoEdit] = useState(false)

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

  // --- Revisión antes de finalizar ---
  const [finalizando, setFinalizando] = useState(null) // objeto mantenimiento o null
  const [solucionFinal, setSolucionFinal] = useState('')
  const [guardandoFinal, setGuardandoFinal] = useState(false)

  const abrirRevisionFinal = (m) => {
    setFinalizando(m)
    setSolucionFinal(m.solucion_aplicada || '')
  }

  const cancelarRevisionFinal = () => {
    setFinalizando(null)
    setSolucionFinal('')
  }

  const confirmarFinalizar = async () => {
    if (!finalizando) return
    setGuardandoFinal(true)
    try {
      await mantenimientosService.finalizar(finalizando.id, { solucion_aplicada: solucionFinal })
      setFinalizando(null)
      setSolucionFinal('')
      cargarDatos()
    } catch (err) {
      console.error('Error finalizando mantenimiento:', err)
      alert('No se pudo finalizar el mantenimiento. Revisa la consola para más detalles.')
    } finally {
      setGuardandoFinal(false)
    }
  }

  // Un técnico solo puede editar su propio mantenimiento; admin/supervisor pueden cualquiera
  const puedeEditar = (m) =>
    m.estado === 'EN_PROCESO' && (puedeCrear || (esTecnico && m.tecnico_asignado === usuario.id))

  const iniciarEdicion = (m) => {
    setEditandoId(m.id)
    setFormEdit({
      titulo: m.titulo || '',
      descripcion: m.descripcion || '',
      tipo: m.tipo || 'CORRECTIVO',
      costo_repuestos: m.costo_repuestos ?? 0,
      costo_mano_obra: m.costo_mano_obra ?? 0,
    })
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setFormEdit(null)
  }

  const guardarEdicion = async (id) => {
    setGuardandoEdit(true)
    try {
      await mantenimientosService.actualizar(id, formEdit)
      setEditandoId(null)
      setFormEdit(null)
      cargarDatos()
    } catch (err) {
      console.error('Error actualizando mantenimiento:', err)
      alert('No se pudo guardar el cambio. Revisa la consola para más detalles.')
    } finally {
      setGuardandoEdit(false)
    }
  }

  const aplicarSugerencia = async (sugerencia) => {
    // Si el chatbot detectó un mantenimiento ya activo para ese equipo,
    // actualizamos ese registro directamente con el diagnóstico elegido
    // en vez de abrir el formulario de "nuevo mantenimiento".
    if (sugerencia.mantenimiento_activo_id) {
      try {
        await mantenimientosService.actualizar(sugerencia.mantenimiento_activo_id, {
          descripcion: sugerencia.diagnostico_sugerido,
          costo_repuestos: sugerencia.costo_repuestos_estimado || 0,
          costo_mano_obra: sugerencia.costo_mano_obra_estimado || 0,
        })
        cargarDatos()
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } catch (err) {
        console.error('Error aplicando diagnóstico al mantenimiento activo:', err)
        alert('No se pudo actualizar el mantenimiento activo con este diagnóstico.')
      }
      return
    }

    setForm((prev) => ({
      ...prev,
      equipo: sugerencia.equipo || prev.equipo,
      tipo: sugerencia.tipo_sugerido || prev.tipo,
      descripcion: sugerencia.diagnostico_sugerido || prev.descripcion,
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
              {mantenimientos.map((m) => {
                const enEdicion = editandoId === m.id

                if (enEdicion) {
                  return (
                    <tr key={m.id} className="border-t bg-yellow-50/60">
                      <td className="px-4 py-3 font-medium align-top">{m.equipo_codigo}</td>
                      <td className="px-4 py-3 align-top" colSpan={6}>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={formEdit.titulo}
                            onChange={(e) => setFormEdit({ ...formEdit, titulo: e.target.value })}
                            placeholder="Título"
                            className="border rounded px-3 py-2 col-span-2"
                          />
                          <textarea
                            value={formEdit.descripcion}
                            onChange={(e) => setFormEdit({ ...formEdit, descripcion: e.target.value })}
                            placeholder="Descripción / diagnóstico"
                            className="border rounded px-3 py-2 col-span-2"
                            rows={3}
                          />
                          <select
                            value={formEdit.tipo}
                            onChange={(e) => setFormEdit({ ...formEdit, tipo: e.target.value })}
                            className="border rounded px-3 py-2"
                          >
                            <option value="PREVENTIVO">Preventivo</option>
                            <option value="CORRECTIVO">Correctivo</option>
                            <option value="PREDICTIVO">Predictivo</option>
                          </select>
                          <div />
                          <label className="text-xs text-gray-600 flex flex-col gap-1">
                            Costo repuestos (COP)
                            <input
                              type="number" min="0"
                              value={formEdit.costo_repuestos}
                              onChange={(e) => setFormEdit({ ...formEdit, costo_repuestos: e.target.value })}
                              className="border rounded px-3 py-2"
                            />
                          </label>
                          <label className="text-xs text-gray-600 flex flex-col gap-1">
                            Costo mano de obra (COP)
                            <input
                              type="number" min="0"
                              value={formEdit.costo_mano_obra}
                              onChange={(e) => setFormEdit({ ...formEdit, costo_mano_obra: e.target.value })}
                              className="border rounded px-3 py-2"
                            />
                          </label>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => guardarEdicion(m.id)}
                          disabled={guardandoEdit}
                          className="text-xs bg-black text-white px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
                        >
                          {guardandoEdit ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          className="text-xs border border-gray-300 text-gray-600 px-2 py-1 rounded hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  )
                }

                return (
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
                    <td className="px-4 py-3 space-x-2 whitespace-nowrap">
                      {m.estado === 'PROGRAMADO' && (esTecnico || puedeCrear) && (
                        <button onClick={() => handleIniciar(m.id)}
                          className="text-xs bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600">
                          Iniciar
                        </button>
                      )}
                      {puedeEditar(m) && (
                        <button onClick={() => iniciarEdicion(m)}
                          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                          Editar
                        </button>
                      )}
                      {m.estado === 'EN_PROCESO' && (esTecnico || puedeCrear) && (
                        <button onClick={() => abrirRevisionFinal(m)}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
                          Finalizar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {finalizando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={cancelarRevisionFinal} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b">
              <h2 className="font-semibold text-gray-800">Revisar antes de finalizar</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Confirma que los datos del mantenimiento están correctos antes de cerrarlo.
              </p>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Equipo</p>
                  <p className="font-medium text-gray-800">{finalizando.equipo_codigo}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Técnico</p>
                  <p className="font-medium text-gray-800">{finalizando.tecnico_nombre || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Tipo</p>
                  <p className="font-medium text-gray-800">{finalizando.tipo_display}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Fecha programada</p>
                  <p className="font-medium text-gray-800">{finalizando.fecha_programada}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Título</p>
                <p className="text-sm text-gray-800 bg-gray-50 border rounded px-3 py-2">{finalizando.titulo}</p>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Diagnóstico / descripción</p>
                <p className="text-sm text-gray-800 bg-gray-50 border rounded px-3 py-2 whitespace-pre-wrap">
                  {finalizando.descripcion}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm bg-blue-50 rounded px-3 py-2.5">
                <div>
                  <p className="text-blue-700 text-xs mb-0.5">Repuestos</p>
                  <p className="font-semibold text-blue-900">
                    ${Number(finalizando.costo_repuestos ?? 0).toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 text-xs mb-0.5">Mano de obra</p>
                  <p className="font-semibold text-blue-900">
                    ${Number(finalizando.costo_mano_obra ?? 0).toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <p className="text-blue-700 text-xs mb-0.5">Total</p>
                  <p className="font-semibold text-blue-900">
                    ${Number(finalizando.costo_total ?? 0).toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              <label className="block">
                <span className="text-sm text-gray-600">Solución aplicada *</span>
                <textarea
                  required
                  value={solucionFinal}
                  onChange={(e) => setSolucionFinal(e.target.value)}
                  placeholder="Describe brevemente qué se hizo para resolver la falla..."
                  className="border rounded px-3 py-2 w-full mt-1"
                  rows={3}
                />
              </label>
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-2">
              <button
                onClick={cancelarRevisionFinal}
                className="px-4 py-2 text-sm rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarFinalizar}
                disabled={guardandoFinal || !solucionFinal.trim()}
                className="px-4 py-2 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {guardandoFinal ? 'Finalizando...' : 'Confirmar y finalizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChatbotIA onAplicarSugerencia={aplicarSugerencia} />
    </div>
  )
}