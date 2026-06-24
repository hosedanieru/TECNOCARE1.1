import { useEffect, useState } from 'react'
import { equiposService } from '../services/equipos'
import { reportesService, descargarBlob } from '../services/reportes'

export default function Reportes() {
  const [equipos, setEquipos] = useState([])
  const [equipoSeleccionado, setEquipoSeleccionado] = useState('')
  const [descargando, setDescargando] = useState(null)
  const [estadisticas, setEstadisticas] = useState(null)
  const [filtros, setFiltros] = useState({ tipo: '', estado: '', fecha_desde: '', fecha_hasta: '' })

  useEffect(() => {
    equiposService.listar().then((res) => setEquipos(res.data.results || res.data))
    reportesService.estadisticas().then((res) => setEstadisticas(res.data)).catch(() => {})
  }, [])

  const descargarHistorial = async () => {
    if (!equipoSeleccionado) return alert('Selecciona un equipo primero.')
    setDescargando('historial')
    try {
      const res = await reportesService.descargarHistorialEquipo(equipoSeleccionado)
      descargarBlob(res.data, `historial_equipo_${equipoSeleccionado}.pdf`)
    } catch {
      alert('Error al generar el reporte.')
    } finally {
      setDescargando(null)
    }
  }

  const descargarGeneral = async () => {
    setDescargando('general')
    const params = {}
    if (filtros.tipo) params.tipo = filtros.tipo
    if (filtros.estado) params.estado = filtros.estado
    if (filtros.fecha_desde) params.fecha_desde = filtros.fecha_desde
    if (filtros.fecha_hasta) params.fecha_hasta = filtros.fecha_hasta
    try {
      const res = await reportesService.descargarReporteGeneral(params)
      descargarBlob(res.data, 'reporte_general.pdf')
    } catch {
      alert('Error al generar el reporte.')
    } finally {
      setDescargando(null)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reportes</h1>

      {/* KPIs */}
      {estadisticas && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Kpi label="Total equipos" valor={estadisticas.equipos.total} color="blue" />
          <Kpi label="Total mantenimientos" valor={estadisticas.mantenimientos.total} color="purple" />
          <Kpi
            label="Costo total"
            valor={`$${Number(estadisticas.costos.total).toLocaleString('es-CO')}`}
            color="green"
          />
          <Kpi
            label="Calificación promedio"
            valor={estadisticas.costos.promedio_calificacion
              ? `${estadisticas.costos.promedio_calificacion} / 5`
              : '—'}
            color="yellow"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Historial por equipo */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Historial por Equipo</h2>
          <p className="text-sm text-gray-500 mb-4">
            PDF con la ficha del equipo y su historial completo de mantenimientos.
          </p>
          <select value={equipoSeleccionado}
            onChange={(e) => setEquipoSeleccionado(e.target.value)}
            className="w-full border rounded px-3 py-2 mb-4">
            <option value="">Selecciona un equipo</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>{eq.codigo_interno} — {eq.nombre}</option>
            ))}
          </select>
          <button onClick={descargarHistorial} disabled={descargando === 'historial'}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50">
            {descargando === 'historial' ? 'Generando PDF...' : '⬇ Descargar PDF'}
          </button>
        </div>

        {/* Reporte general */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700 mb-1">Reporte General</h2>
          <p className="text-sm text-gray-500 mb-4">
            PDF de todos los mantenimientos con filtros opcionales.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <select value={filtros.tipo}
              onChange={(e) => setFiltros({ ...filtros, tipo: e.target.value })}
              className="border rounded px-3 py-2 text-sm">
              <option value="">Todos los tipos</option>
              <option value="PREVENTIVO">Preventivo</option>
              <option value="CORRECTIVO">Correctivo</option>
              <option value="PREDICTIVO">Predictivo</option>
            </select>
            <select value={filtros.estado}
              onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
              className="border rounded px-3 py-2 text-sm">
              <option value="">Todos los estados</option>
              <option value="PROGRAMADO">Programado</option>
              <option value="EN_PROCESO">En proceso</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="CANCELADO">Cancelado</option>
            </select>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Desde
              <input type="date" value={filtros.fecha_desde}
                onChange={(e) => setFiltros({ ...filtros, fecha_desde: e.target.value })}
                className="border rounded px-3 py-2" />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Hasta
              <input type="date" value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({ ...filtros, fecha_hasta: e.target.value })}
                className="border rounded px-3 py-2" />
            </label>
          </div>
          <button onClick={descargarGeneral} disabled={!!descargando}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50">
            {descargando === 'general' ? 'Generando PDF...' : '⬇ Descargar Reporte General'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, valor, color }) {
  const colors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
  }
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <p className={`text-2xl font-bold ${colors[color]}`}>{valor}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
