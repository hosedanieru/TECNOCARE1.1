/**
 * Extrae un mensaje legible de errores de axios/DRF.
 */
export function extractErrorMessage(err, fallback = 'Ocurrió un error inesperado.') {
  const data = err?.response?.data
  if (!data) return fallback
  if (typeof data === 'string') return data
  if (data.detail) return data.detail
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
      .join(' | ')
  }
  return fallback
}
