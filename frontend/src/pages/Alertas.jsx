import { useEffect, useState } from 'react'
import { equiposService } from '../services/equipos'

export default function Alertas() {
  const [datos, setDatos] = useState({ total: 0, vencidos: 0, proximos: 0, equipos: [] })
  const [dias, setDias] = useState(30)
  const [cargando, setCargando] = useState(true)

  const cargarAlertas = async () => {
    setCargando(true)
    const res = await equiposService.alertasProximas(dias)
    setDatos(res.data)
    setCargando(false)
  }

  useEffect(() => { cargarAlertas() }, [dias])

  const urgenciaColor = (diasRestantes) => {
    if (diasRestantes < 0) return 'border-red-500 bg-red-50'
    if (diasRestantes <= 7) return 'border-orange-500 bg-orange-50'
    return 'border-yellow-400 bg-yellow-50'
  }

  const urgenciaLabel = (diasRestantes) => {
    if (diasRestantes < 0) return { texto: `Vencido hace ${Math.abs(diasRestantes)} días`, color: 'bg-red-100 text-red-800' }
    if (diasRestantes === 0) return { texto: 'Vence hoy', color: 'bg-orange-100 text-orange-800' }
    return { texto: `${diasRestantes} días`, color: 'bg-yellow-100 text-yellow-800' }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Alertas de Mantenimiento</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-600">Horizonte:</span>
          <select value={dias} onChange={(e) => setDias(Number(e.target.value))}
            className="border rounded px-3 py-1">
            <option value={7}>7 días</option>
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
          </select>
        </div>
      </div>

      {/* Resumen */}
      {!cargando && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-gray-800">{datos.total}</p>
            <p className="text-sm text-gray-500 mt-1">Total en alerta</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{datos.vencidos}</p>
            <p className="text-sm text-gray-500 mt-1">Vencidos</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{datos.proximos}</p>
            <p className="text-sm text-gray-500 mt-1">Próximos a vencer</p>
          </div>
        </div>
      )}

      {cargando ? (
        <p className="text-gray-500">Cargando alertas...</p>
      ) : datos.equipos.length === 0 ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          No hay equipos con mantenimiento pendiente en los próximos {dias} días. ✅
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datos.equipos.map((eq) => {
            const label = urgenciaLabel(eq.dias_para_proximo_mantenimiento)
            return (
              <div key={eq.id} className={`border-l-4 rounded-lg shadow p-4 ${urgenciaColor(eq.dias_para_proximo_mantenimiento)}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-gray-800">{eq.codigo_interno}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${label.color}`}>
                    {label.texto}
                  </span>
                </div>
                <p className="text-gray-700 font-medium mb-1">{eq.nombre}</p>
                <p className="text-sm text-gray-500 mb-1">📍 {eq.ubicacion}</p>
                <p className="text-sm text-gray-500">
                  Próximo: <span className="font-medium">{eq.proximo_mantenimiento}</span>
                </p>
                {eq.responsable_nombre && (
                  <p className="text-sm text-gray-500 mt-1">
                    Responsable: <span className="font-medium">{eq.responsable_nombre}</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
