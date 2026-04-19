import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Kaart from './pages/Kaart'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Kaart />} />
        <Route path="/kaart" element={<Navigate to="/" replace />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}
