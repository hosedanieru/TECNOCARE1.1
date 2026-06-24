import api from './api'

export const usuariosService = {
  listar: (params) => api.get('/usuarios/', { params }),
  obtener: (id) => api.get(`/usuarios/${id}/`),
  crear: (datos) => api.post('/usuarios/', datos),
  actualizar: (id, datos) => api.patch(`/usuarios/${id}/`, datos),
  desactivar: (id) => api.patch(`/usuarios/${id}/desactivar/`),
  reactivar: (id) => api.patch(`/usuarios/${id}/reactivar/`),
  perfil: () => api.get('/usuarios/perfil/'),
  cambiarPassword: (datos) => api.patch('/usuarios/cambiar_password/', datos),
}
