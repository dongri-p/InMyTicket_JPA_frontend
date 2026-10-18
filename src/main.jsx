import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Layout from './components/Layout.jsx'
import RequireAuth from './components/RequireAuth.jsx'
import RequireAdmin from './components/RequireAdmin.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignupPage from './pages/SignupPage.jsx'
import SeatSelectionPage from './pages/SeatSelectionPage.jsx'
import PaymentResultPage from './pages/PaymentResultPage.jsx'
import PerformanceListPage from './pages/PerformanceListPage.jsx'
import PerformanceDetailPage from './pages/PerformanceDetailPage.jsx'
import MyReservationsPage from './pages/MyReservationsPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          {/* 공연 목록·상세·좌석은 로그인 없이 둘러볼 수 있음. 예매 버튼을 누를 때 로그인 안내 */}
          <Route path="/" element={<PerformanceListPage />} />
          <Route path="/my-reservations" element={<RequireAuth><MyReservationsPage /></RequireAuth>} />
          <Route path="/performances/:performanceId" element={<PerformanceDetailPage />} />
          <Route path="/seats/:scheduleId" element={<SeatSelectionPage />} />
          <Route path="/payment/result" element={<RequireAuth><PaymentResultPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
)
