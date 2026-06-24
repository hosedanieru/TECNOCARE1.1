import api from './api'

export const equiposService = {
  listar: (params) => api.get('/equipos/', { params }),
  obtener: (id) => api.get(`/equipos/${id}/`),
  crear: (datos) => api.post('/equipos/', datos),
  actualizar: (id, datos) => api.patch(`/equipos/${id}/`, datos),
  eliminar: (id) => api.delete(`/equipos/${id}/`),
  cambiarEstado: (id, estado) => api.patch(`/equipos/${id}/cambiar_estado/`, { estado }),
  alertasProximas: (dias = 30) => api.get('/equipos/alertas_proximas/', { params: { dias } }),
  categorias: () => api.get('/categorias-equipo/'),
  crearCategoria: (datos) => api.post('/categorias-equipo/', datos),
}
