import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import RutaProtegida from './components/RutaProtegida'
import MainLayout from './layouts/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Equipos from './pages/Equipos'
import CategoriasEquipo from './pages/CategoriasEquipo'
import Mantenimientos from './pages/Mantenimientos'
import Alertas from './pages/Alertas'
import Reportes from './pages/Reportes'
import Usuarios from './pages/Usuarios'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <RutaProtegida>
                <MainLayout />
              </RutaProtegida>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/equipos" element={<Equipos />} />
            <Route
              path="/equipos/categorias"
              element={
                <RutaProtegida rolesPermitidos={['ADMIN']}>
                  <CategoriasEquipo />
                </RutaProtegida>
              }
            />
            <Route path="/mantenimientos" element={<Mantenimientos />} />
            <Route path="/alertas" element={<Alertas />} />
            <Route
              path="/reportes"
              element={
                <RutaProtegida rolesPermitidos={['ADMIN', 'SUPERVISOR']}>
                  <Reportes />
                </RutaProtegida>
              }
            />
            <Route
              path="/usuarios"
              element={
                <RutaProtegida rolesPermitidos={['ADMIN']}>
                  <Usuarios />
                </RutaProtegida>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
