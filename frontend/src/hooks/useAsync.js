import { useState, useCallback } from 'react'

/**
 * Hook genérico para manejar estado de llamadas async.
 * Retorna { run, cargando, error }.
 */
export function useAsync() {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const run = useCallback(async (fn, onSuccess) => {
    setCargando(true)
    setError('')
    try {
      const result = await fn()
      if (onSuccess) onSuccess(result)
      return result
    } catch (err) {
      const { extractErrorMessage } = await import('./useErrorHandler')
      setError(extractErrorMessage(err))
    } finally {
      setCargando(false)
    }
  }, [])

  return { run, cargando, error, setError }
}
