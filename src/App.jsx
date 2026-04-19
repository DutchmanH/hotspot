import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Kaart from './pages/Kaart'
import Admin from './pages/Admin'
import Account from './pages/Account'
import PasswordRecoveryOverlay from './components/PasswordRecoveryOverlay'
import { useAuth } from './context/AuthContext'

export default function App() {
  const { recovering } = useAuth()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Kaart />} />
        <Route path="/kaart" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/account" element={<Account />} />
      </Routes>
      <PasswordRecoveryOverlay isOpen={recovering} />
    </BrowserRouter>
  )
}
