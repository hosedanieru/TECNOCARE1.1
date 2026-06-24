import { useEffect, useState } from 'react'
import { reportesService } from '../services/reportes'
import { equiposService } from '../services/equipos'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [alertas, setAlertas] = useState({ total: 0, vencidos: 0 })
  const { puedeVerReportes, usuario } = useAuth()

  useEffect(() => {
    if (puedeVerReportes) {
      reportesService.estadisticas()
        .then((res) => setStats(res.data))
        .catch(() => {})
    }
    equiposService.alertasProximas(7)
      .then((res) => setAlertas({ total: res.data.total, vencidos: res.data.vencidos }))
      .catch(() => {})
  }, [puedeVerReportes])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Bienvenido, {usuario?.nombre_completo}
      </h1>
      <p className="text-gray-500 mb-6">Panel de control — TecnoCare</p>

      {/* Alertas rápidas */}
      {alertas.total > 0 && (
        <div className={`mb-6 border-l-4 px-4 py-3 rounded ${alertas.vencidos > 0 ? 'border-red-500 bg-red-50 text-red-800' : 'border-yellow-500 bg-yellow-50 text-yellow-800'}`}>
          <strong>
            {alertas.vencidos > 0
              ? `⚠️ ${alertas.vencidos} equipo(s) con mantenimiento vencido`
              : `📅 ${alertas.total} equipo(s) con mantenimiento en los próximos 7 días`}
          </strong>
        </div>
      )}

      {/* KPIs (solo supervisores/admins) */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Equipos registrados" valor={stats.equipos.total} color="blue" />
          <KpiCard label="Mantenimientos totales" valor={stats.mantenimientos.total} color="purple" />
          <KpiCard
            label="Costo acumulado"
            valor={`$${Number(stats.costos.total).toLocaleString('es-CO')}`}
            color="green"
          />
          <KpiCard
            label="Calificación promedio"
            valor={stats.costos.promedio_calificacion
              ? `${stats.costos.promedio_calificacion} / 5`
              : '—'}
            color="yellow"
          />
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, valor, color }) {
  const colors = {
    blue: 'text-blue-600', purple: 'text-purple-600',
    green: 'text-green-600', yellow: 'text-yellow-600',
  }
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <p className={`text-3xl font-bold ${colors[color]}`}>{valor}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  )
}
