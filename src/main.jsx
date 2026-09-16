import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import LoginPage from './pages/LoginPage.jsx'
import SeatSelectionPage from './pages/SeatSelectionPage.jsx'
import PaymentResultPage from './pages/PaymentResultPage.jsx'
import PerformanceListPage from './pages/PerformanceListPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PerformanceListPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/seats/:scheduleId" element={<SeatSelectionPage />} />
        <Route path="/payment/result" element={<PaymentResultPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
