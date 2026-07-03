import { useState, useEffect } from 'react'
import { mantenimientosService } from '../services/mantenimientos'
import { equiposService } from '../services/equipos'
import { useAuth } from '../context/AuthContext'

const PRIORIDAD_ESTILO = {
  BAJA: 'border border-[#DDDDDE] text-[#55585E] bg-transparent',
  MEDIA: 'border border-[#B8BABE] text-[#3A3A3D] bg-transparent',
  ALTA: 'border border-[#0A0A0B] text-[#0A0A0B] bg-transparent',
  CRITICA: 'bg-[#0A0A0B] text-white border border-[#0A0A0B]',
}

const TIPO_ESTILO = {
  PREVENTIVO: 'border border-[#DDDDDE] text-[#55585E]',
  CORRECTIVO: 'border border-[#B8BABE] text-[#3A3A3D]',
  PREDICTIVO: 'border border-[#B8BABE] text-[#3A3A3D]',
}

const PROBABILIDAD_ESTILO = {
  ALTA: 'bg-black text-white',
  MEDIA: 'border border-black text-black',
  BAJA: 'border border-[#B8BABE] text-[#55585E]',
}

const ORDEN_PROBABILIDAD = { ALTA: 3, MEDIA: 2, BAJA: 1 }

export default function ChatbotIA({ onAplicarSugerencia }) {
  const [abierto, setAbierto] = useState(false)
  const [descripcion, setDescripcion] = useState('')
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('')
  const [equipos, setEquipos] = useState([])
  const [cargando, setCargando] = useState(false)
  const [sugerencia, setSugerencia] = useState(null)
  const [error, setError] = useState('')
  const { esTecnico, usuario } = useAuth()

  useEffect(() => {
    if (abierto) {
      const params = esTecnico ? { responsable: usuario.id } : {}
      equiposService.listar(params).then((res) => {
        setEquipos(res.data.results || res.data)
      })
    }
  }, [abierto])

  const [mantenimientoActivo, setMantenimientoActivo] = useState(null)
  const [diagnosticoSeleccionado, setDiagnosticoSeleccionado] = useState(0)

  const equipoInfo = equipos.find((e) => e.id === Number(equipoSeleccionado))

  const diagnosticoPrincipal =
    sugerencia?.diagnostico_principal || sugerencia?.diagnostico_sugerido || ''

  const diagnosticosAlternativos = (sugerencia?.diagnosticos_probables || [])
    .filter((d) => d.diagnostico !== diagnosticoPrincipal)
    .sort((a, b) => (ORDEN_PROBABILIDAD[b.probabilidad] || 0) - (ORDEN_PROBABILIDAD[a.probabilidad] || 0))

  // Lista unificada para poder seleccionar cualquiera de las cards (principal o alternativas)
  const diagnosticosLista = [
    ...(diagnosticoPrincipal ? [{ diagnostico: diagnosticoPrincipal, probabilidad: 'ALTA', esPrincipal: true }] : []),
    ...diagnosticosAlternativos,
  ]

  // Cada vez que llega una sugerencia nueva, seleccionamos el principal por defecto (índice 0)
  useEffect(() => {
    if (sugerencia) setDiagnosticoSeleccionado(0)
  }, [sugerencia])

  // Al elegir un equipo, revisamos si tiene un mantenimiento activo y sincronizamos la descripción
  useEffect(() => {
    if (!equipoSeleccionado) {
      setMantenimientoActivo(null)
      return
    }

    let cancelado = false

    mantenimientosService
      .listar({ equipo: equipoSeleccionado })
      .then((res) => {
        if (cancelado) return
        const lista = res.data.results || res.data
        const activo = lista.find((m) => ['PROGRAMADO', 'EN_PROCESO'].includes(m.estado))
        if (activo) {
          setMantenimientoActivo(activo)
          setDescripcion(activo.descripcion || activo.descripcion_falla || '')
        } else {
          setMantenimientoActivo(null)
        }
      })
      .catch((err) => {
        console.error('Error verificando mantenimiento activo:', err)
      })

    return () => {
      cancelado = true
    }
  }, [equipoSeleccionado])

  const [diagnosticoCargado, setDiagnosticoCargado] = useState(null)

  const seleccionarDiagnostico = (index) => {
    setDiagnosticoSeleccionado(index)
    // Si el equipo ya tiene un mantenimiento activo, el diagnóstico se carga de inmediato
    if (mantenimientoActivo) {
      aplicarConDiagnostico(index)
      setDiagnosticoCargado(index)
      setTimeout(() => setDiagnosticoCargado(null), 2000)
    }
  }

  const consultar = async () => {
  if (!descripcion.trim()) return
  setCargando(true)
  setError('')
  setSugerencia(null)
  try {
    const res = await mantenimientosService.sugerenciaIA({
      descripcion,
      categoria_equipo: equipoInfo?.categoria_nombre || '',
      marca: equipoInfo?.marca || '',
      modelo: equipoInfo?.modelo || '',
    })
    setSugerencia(res.data)
  } catch (err) {
    console.error('Error consultando IA:', err)
    if (err.response) {
      // El backend respondió con un error (400/500/502/403...)
      const detalle = err.response.data?.detail || JSON.stringify(err.response.data)
      setError(`Error del servidor (${err.response.status}): ${detalle}`)
    } else if (err.request) {
      // La request salió pero nunca hubo respuesta (CORS, servidor caído, red)
      setError('No se pudo contactar al servidor. Verifica que Django esté corriendo y que CORS esté configurado.')
    } else {
      setError(`Error inesperado: ${err.message}`)
    }
    } finally {
    setCargando(false)
    }
  }

  const aplicarConDiagnostico = (index) => {
    if (!sugerencia || !onAplicarSugerencia) return
    const diagnosticoElegido = diagnosticosLista[index]?.diagnostico || diagnosticoPrincipal
    onAplicarSugerencia({
      ...sugerencia,
      diagnostico_sugerido: diagnosticoElegido,
      equipo: equipoSeleccionado,
      mantenimiento_activo_id: mantenimientoActivo?.id || null,
    })
  }

  const aplicar = () => {
    aplicarConDiagnostico(diagnosticoSeleccionado)
    setAbierto(false)
  }

  const limpiar = () => {
    setDescripcion('')
    setEquipoSeleccionado('')
    setSugerencia(null)
    setError('')
    setMantenimientoActivo(null)
    setDiagnosticoSeleccionado(0)
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 bg-[#0A0A0B] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-[#26262A] transition-colors z-50"
        title="Asistente IA"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="w-6 h-6">
          <path d="M12 3v3M12 18v3M4.2 12H1M23 12h-3.2M6 6l1.8 1.8M16.2 16.2 18 18M18 6l-1.8 1.8M7.8 16.2 6 18" />
          <circle cx="12" cy="12" r="4.2" />
        </svg>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAbierto(false)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col">

            <div className="bg-[#0A0A0B] text-white px-5 py-4 flex justify-between items-center relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative z-10">
                <div
                  className="text-[10.5px] uppercase tracking-widest text-[#8A8D93] mb-1"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                >
                  TecnoCare · asistente
                </div>
                <h2
                  className="text-lg font-semibold text-[#FAFAFA]"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Diagnóstico IA
                </h2>
              </div>
              <button
                onClick={() => setAbierto(false)}
                className="relative z-10 text-[#C7C9CC] hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              <div>
                <label className="text-[12.5px] font-medium text-[#3A3A3D] block mb-1.5">
                  Equipo relacionado (opcional)
                </label>
                <select
                  value={equipoSeleccionado}
                  onChange={(e) => setEquipoSeleccionado(e.target.value)}
                  className="w-full border border-[#DDDDDE] rounded-[3px] bg-[#FBFBFB] px-3 py-2.5 text-[13.5px] text-[#0A0A0B] outline-none focus:border-[#0A0A0B] focus:bg-white transition-colors"
                >
                  <option value="">Sin equipo específico</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.codigo_interno} — {eq.nombre} ({eq.categoria_nombre})
                    </option>
                  ))}
                </select>
                {equipoInfo && (
                  <p className="text-[12px] text-[#6B6E74] mt-1.5">
                    Marca: {equipoInfo.marca || '—'} | Modelo: {equipoInfo.modelo || '—'}
                  </p>
                )}
                {mantenimientoActivo && (
                  <p className="text-[12px] text-[#0A0A0B] bg-[#F4F1EA] border border-[#EAE4D6] rounded-[3px] px-2.5 py-1.5 mt-2">
                    Este equipo ya tiene un mantenimiento activo (#{mantenimientoActivo.id}). Se cargó su descripción automáticamente.
                  </p>
                )}
              </div>

              <div>
                <label className="text-[12.5px] font-medium text-[#3A3A3D] block mb-1.5">
                  Describe el problema o la falla *
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: El servidor se reinicia solo cada 2 horas y los usuarios pierden conexión..."
                  className="w-full border border-[#DDDDDE] rounded-[3px] bg-[#FBFBFB] px-3 py-2.5 text-[13.5px] text-[#0A0A0B] outline-none focus:border-[#0A0A0B] focus:bg-white transition-colors resize-none"
                  rows={4}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-3.5 py-2.5 rounded-[3px] text-[13px] border border-red-100">
                  {error}
                </div>
              )}

              {sugerencia && (
                <div className="bg-[#FAFAFA] rounded-[3px] p-4 space-y-4 border border-[#EDEDEE]">
                  <h3
                    className="text-[11px] uppercase tracking-widest text-[#55585E]"
                    style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                  >
                    Sugerencia del sistema
                  </h3>

                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${PRIORIDAD_ESTILO[sugerencia.prioridad_sugerida]}`}>
                      Prioridad {sugerencia.prioridad_sugerida}
                    </span>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${TIPO_ESTILO[sugerencia.tipo_sugerido]}`}>
                      {sugerencia.tipo_sugerido}
                    </span>
                  </div>

                  {/* DIAGNÓSTICO PRINCIPAL + ALTERNATIVOS (seleccionables) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11.5px] font-medium text-[#6B6E74]">Diagnóstico técnico</p>
                      <p className="text-[10.5px] text-[#8A8D93]">
                        {mantenimientoActivo ? 'Toca una tarjeta para cargarla al mantenimiento' : 'Toca una tarjeta para elegirla'}
                      </p>
                    </div>

                    {diagnosticoCargado !== null && (
                      <p className="text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-[3px] px-2.5 py-1.5">
                        Diagnóstico cargado en el mantenimiento #{mantenimientoActivo?.id}
                      </p>
                    )}

                    <div className="space-y-2">
                      {diagnosticosLista.map((diag, index) => {
                        const seleccionado = diagnosticoSeleccionado === index
                        return (
                          <button
                            type="button"
                            key={index}
                            onClick={() => seleccionarDiagnostico(index)}
                            className={`w-full text-left rounded-[4px] p-3.5 flex justify-between items-start shadow-sm transition-all ${
                              diag.esPrincipal
                                ? seleccionado
                                  ? 'bg-[#0A0A0B] text-white ring-2 ring-offset-1 ring-[#0A0A0B]'
                                  : 'bg-[#0A0A0B] text-white opacity-80 hover:opacity-100'
                                : seleccionado
                                ? 'bg-white border-2 border-[#0A0A0B]'
                                : 'bg-white border border-[#EDEDEE] hover:shadow-md'
                            }`}
                          >
                            <div className="pr-2 flex-1">
                              {diag.esPrincipal && (
                                <p className="text-[10px] uppercase tracking-widest opacity-70 mb-1">
                                  Diagnóstico principal
                                </p>
                              )}
                              <p
                                className={`leading-relaxed ${
                                  diag.esPrincipal ? 'text-[14px] font-medium' : 'text-[13.5px] text-[#0A0A0B]'
                                }`}
                              >
                                {diag.diagnostico}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {!diag.esPrincipal && (
                                <span
                                  className={`text-[10.5px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap ${
                                    PROBABILIDAD_ESTILO[diag.probabilidad] || 'border border-gray-300'
                                  }`}
                                >
                                  {diag.probabilidad}
                                </span>
                              )}
                              {seleccionado && (
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.2"
                                  className={`w-4 h-4 ${diag.esPrincipal ? 'text-white' : 'text-[#0A0A0B]'}`}
                                >
                                  <path d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <p className="text-[11.5px] font-medium text-[#6B6E74] mb-1">Solución sugerida</p>
                    <p className="text-[13.5px] text-[#0A0A0B] leading-relaxed">{sugerencia.solucion_sugerida}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 bg-white rounded-[3px] p-3.5 border border-[#EDEDEE]">
                    <div>
                      <p className="text-[11px] text-[#6B6E74] mb-0.5">Costo repuestos est.</p>
                      <p className="font-medium text-[#0A0A0B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        ${Number(sugerencia.costo_repuestos_estimado).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-[#6B6E74] mb-0.5">Mano de obra est.</p>
                      <p className="font-medium text-[#0A0A0B]" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                        ${Number(sugerencia.costo_mano_obra_estimado).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="col-span-2 border-t border-[#EDEDEE] pt-2.5 mt-0.5">
                      <p className="text-[11px] text-[#6B6E74] mb-0.5">Total estimado</p>
                      <p
                        className="font-semibold text-[#0A0A0B] text-lg"
                        style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                      >
                        ${(Number(sugerencia.costo_repuestos_estimado) + Number(sugerencia.costo_mano_obra_estimado)).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>

                  <div className="border-l-2 border-[#0A0A0B] bg-white rounded-r-[3px] px-3 py-2.5">
                    <p className="text-[12px] text-[#3A3A3D] leading-relaxed">{sugerencia.justificacion}</p>
                  </div>

                  {onAplicarSugerencia && (
                    <button
                      onClick={aplicar}
                      className="w-full bg-[#0A0A0B] text-white py-2.5 rounded-[3px] hover:bg-[#26262A] transition-colors text-[13.5px] font-medium flex items-center justify-center gap-2"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                      {mantenimientoActivo
                        ? `Actualizar mantenimiento #${mantenimientoActivo.id} con este diagnóstico`
                        : 'Aplicar al formulario de mantenimiento'}
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-[#EDEDEE] p-4 flex gap-2.5">
              <button
                onClick={limpiar}
                className="flex-1 border border-[#DDDDDE] text-[#3A3A3D] py-2.5 rounded-[3px] hover:bg-[#FAFAFA] transition-colors text-[13.5px]"
              >
                Limpiar
              </button>
              <button
                onClick={consultar}
                disabled={cargando || !descripcion.trim()}
                className="flex-1 bg-[#0A0A0B] text-white py-2.5 rounded-[3px] hover:bg-[#26262A] transition-colors disabled:opacity-50 text-[13.5px] font-medium"
              >
                {cargando ? 'Consultando...' : 'Consultar IA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}