import api from './api'

export const mantenimientosService = {
  listar: (params) => api.get('/mantenimientos/', { params }),
  obtener: (id) => api.get(`/mantenimientos/${id}/`),
  crear: (datos) => api.post('/mantenimientos/', datos),
  actualizar: (id, datos) => api.patch(`/mantenimientos/${id}/`, datos),
  iniciar: (id) => api.patch(`/mantenimientos/${id}/iniciar/`),
  finalizar: (id, datos) => api.patch(`/mantenimientos/${id}/finalizar/`, datos),
  cancelar: (id, motivo) => api.patch(`/mantenimientos/${id}/cancelar/`, { motivo }),
  calificar: (id, calificacion) => api.patch(`/mantenimientos/${id}/calificar/`, { calificacion_resultado: calificacion }),
  misTareas: () => api.get('/mantenimientos/mis_tareas/'),
  resumen: () => api.get('/mantenimientos/resumen/'),
  intervenciones: {
    listar: (mantenimientoId) => api.get('/intervenciones/', { params: { mantenimiento: mantenimientoId } }),
    crear: (datos) => api.post('/intervenciones/', datos),
    eliminar: (id) => api.delete(`/intervenciones/${id}/`),
  },
}
