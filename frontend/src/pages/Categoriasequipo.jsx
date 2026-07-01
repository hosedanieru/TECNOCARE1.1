import { useEffect, useState } from 'react'
import { equiposService } from '../services/equipos'
import { extractErrorMessage } from '../hooks/useErrorHandler'

const FORM_VACIO = {
  nombre: '', descripcion: '',
}

export default function CategoriasEquipo() {
  const [categorias, setCategorias] = useState([])
  const [cargando, setCargando] = useState(true)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState(FORM_VACIO)

  const cargarCategorias = async () => {
    setCargando(true)
    const res = await equiposService.categorias()
    setCategorias(res.data.results || res.data)
    setCargando(false)
  }

  useEffect(() => { cargarCategorias() }, [])

  const abrirNuevo = () => {
    setEditandoId(null)
    setForm(FORM_VACIO)
    setError('')
    setMostrarForm(true)
  }

  const abrirEdicion = (c) => {
    setEditandoId(c.id)
    setForm({
      nombre: c.nombre,
      descripcion: c.descripcion || '',
    })
    setError('')
    setMostrarForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (editandoId) {
        await equiposService.actualizarCategoria(editandoId, form)
      } else {
        await equiposService.crearCategoria(form)
      }
      setMostrarForm(false)
      setForm(FORM_VACIO)
      setEditandoId(null)
      cargarCategorias()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleEliminar = async (c) => {
    if (c.total_equipos > 0) return // protegido por el UI, además el backend lo rechaza igual
    if (!confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return
    try {
      await equiposService.eliminarCategoria(c.id)
      cargarCategorias()
    } catch (err) {
      alert(extractErrorMessage(err))
    }
  }

  if (cargando) return <p className="text-gray-500 p-6">Cargando categorías...</p>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categorías de Equipo</h1>
        <button onClick={abrirNuevo}
          className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800">
          + Nueva Categoría
        </button>
      </div>

      {/* Form */}
      {mostrarForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow mb-6 grid grid-cols-2 gap-4">
          <h2 className="col-span-2 font-semibold text-gray-700">
            {editandoId ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          {error && (
            <div className="col-span-2 bg-red-100 text-red-700 px-4 py-2 rounded text-sm">{error}</div>
          )}

          <input placeholder="Nombre" required value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            className="border rounded px-3 py-2" />

          <input placeholder="Descripción (opcional)" value={form.descripcion}
            onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            className="border rounded px-3 py-2" />

          <div className="col-span-2 flex gap-3 justify-end">
            <button type="button" onClick={() => setMostrarForm(false)}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-50">
              Cancelar
            </button>
            <button type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
              {editandoId ? 'Guardar cambios' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Equipos asociados</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  No hay categorías registradas aún.
                </td>
              </tr>
            ) : (
              categorias.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3">{c.descripcion || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                      {c.total_equipos}
                    </span>
                  </td>
                  <td className="px-4 py-3 space-x-2">
                    <button onClick={() => abrirEdicion(c)}
                      className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">
                      Editar
                    </button>
                    <button
                      onClick={() => handleEliminar(c)}
                      disabled={c.total_equipos > 0}
                      title={c.total_equipos > 0 ? 'No se puede eliminar: tiene equipos asociados' : ''}
                      className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-red-100">
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
