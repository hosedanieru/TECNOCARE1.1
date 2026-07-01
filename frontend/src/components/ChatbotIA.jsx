import { useState, useEffect } from 'react'
import { mantenimientosService } from '../services/mantenimientos'
import { equiposService } from '../services/equipos'
import { useAuth } from '../context/AuthContext'

const PRIORIDAD_COLOR = {
  BAJA: 'bg-green-100 text-green-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
}

const TIPO_COLOR = {
  PREVENTIVO: 'bg-emerald-100 text-emerald-800',
  CORRECTIVO: 'bg-orange-100 text-orange-800',
  PREDICTIVO: 'bg-purple-100 text-purple-800',
}

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

  const equipoInfo = equipos.find((e) => e.id === Number(equipoSeleccionado))

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

  const aplicar = () => {
    if (sugerencia && onAplicarSugerencia) {
      onAplicarSugerencia({ ...sugerencia, equipo: equipoSeleccionado })
      setAbierto(false)
    }
  }

  const limpiar = () => {
    setDescripcion('')
    setEquipoSeleccionado('')
    setSugerencia(null)
    setError('')
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-700 text-2xl z-50"
        title="Asistente IA"
      >
        🤖
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30" onClick={() => setAbierto(false)} />
          <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col">

            <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
              <div>
                <h2 className="font-bold text-lg">Asistente IA</h2>
                <p className="text-blue-200 text-xs">Diagnóstico inteligente de mantenimiento</p>
              </div>
              <button onClick={() => setAbierto(false)} className="text-white text-xl hover:text-blue-200">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Equipo relacionado (opcional)
                </label>
                <select
                  value={equipoSeleccionado}
                  onChange={(e) => setEquipoSeleccionado(e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">Sin equipo específico</option>
                  {equipos.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.codigo_interno} — {eq.nombre} ({eq.categoria_nombre})
                    </option>
                  ))}
                </select>
                {equipoInfo && (
                  <p className="text-xs text-gray-500 mt-1">
                    Marca: {equipoInfo.marca || '—'} | Modelo: {equipoInfo.modelo || '—'}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Describe el problema o la falla *
                </label>
                <textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: El servidor se reinicia solo cada 2 horas y los usuarios pierden conexión..."
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  rows={4}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm border border-red-200">
                  {error}
                </div>
              )}

              {sugerencia && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3 border">
                  <h3 className="font-semibold text-gray-800 text-sm">Sugerencia de la IA:</h3>

                  <div className="flex gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORIDAD_COLOR[sugerencia.prioridad_sugerida]}`}>
                      Prioridad: {sugerencia.prioridad_sugerida}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${TIPO_COLOR[sugerencia.tipo_sugerido]}`}>
                      {sugerencia.tipo_sugerido}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Diagnóstico:</p>
                    <p className="text-sm text-gray-800">{sugerencia.diagnostico_sugerido}</p>
                  </div>

                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Solución sugerida:</p>
                    <p className="text-sm text-gray-800">{sugerencia.solucion_sugerida}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-white rounded p-3 border">
                    <div>
                      <p className="text-xs text-gray-500">Costo repuestos est.</p>
                      <p className="font-semibold text-gray-800">
                        ${Number(sugerencia.costo_repuestos_estimado).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Costo mano de obra est.</p>
                      <p className="font-semibold text-gray-800">
                        ${Number(sugerencia.costo_mano_obra_estimado).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div className="col-span-2 border-t pt-2 mt-1">
                      <p className="text-xs text-gray-500">Total estimado</p>
                      <p className="font-bold text-blue-700 text-lg">
                        ${(Number(sugerencia.costo_repuestos_estimado) + Number(sugerencia.costo_mano_obra_estimado)).toLocaleString('es-CO')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-xs text-blue-700">{sugerencia.justificacion}</p>
                  </div>

                  {onAplicarSugerencia && (
                    <button
                      onClick={aplicar}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-sm font-medium"
                    >
                      ✓ Aplicar al formulario de mantenimiento
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="border-t p-4 flex gap-2">
              <button
                onClick={limpiar}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded hover:bg-gray-50 text-sm"
              >
                Limpiar
              </button>
              <button
                onClick={consultar}
                disabled={cargando || !descripcion.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {cargando ? '⏳ Consultando...' : '🤖 Consultar IA'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
