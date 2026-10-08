import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import SeatSelectionPage from './pages/SeatSelectionPage.jsx'
import PaymentResultPage from './pages/PaymentResultPage.jsx'
import PerformanceListPage from './pages/PerformanceListPage.jsx'
import PerformanceDetailPage from './pages/PerformanceDetailPage.jsx'
import MyReservationsPage from './pages/MyReservationsPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/" element={<RequireAuth><PerformanceListPage /></RequireAuth>} />
          <Route path="/my-reservations" element={<RequireAuth><MyReservationsPage /></RequireAuth>} />
          <Route path="/performances/:performanceId" element={<RequireAuth><PerformanceDetailPage /></RequireAuth>} />
          <Route path="/seats/:scheduleId" element={<RequireAuth><SeatSelectionPage /></RequireAuth>} />
          <Route path="/payment/result" element={<RequireAuth><PaymentResultPage /></RequireAuth>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
