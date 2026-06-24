import api from './api'

export const reportesService = {
  estadisticas: () => api.get('/reportes/estadisticas/'),
  descargarHistorialEquipo: (equipoId) =>
    api.get(`/reportes/equipo/${equipoId}/pdf/`, { responseType: 'blob' }),
  descargarReporteGeneral: (params) =>
    api.get('/reportes/general/pdf/', { params, responseType: 'blob' }),
}

export function descargarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nombreArchivo
  link.click()
  URL.revokeObjectURL(url)
}
