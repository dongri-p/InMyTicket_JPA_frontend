import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

const STATUS_LABEL = {
  PENDING: '결제 대기',
  PROCESSING: '결제 진행 중',
  CONFIRMED: '결제 완료',
  CANCELLED: '취소됨',
};

function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    axiosInstance
      .get('/api/v1/reservations/me')
      .then((response) => {
        setReservations(response.data.data);
      })
      .catch(() => {
        setError('예매 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>내 예매 목록</h1>
      <Link to="/">공연 목록으로</Link>

      {reservations.length === 0 && <p>예매 내역이 없습니다.</p>}

      <ul>
        {reservations.map((r) => (
          <li key={r.reservationId}>
            <strong>{r.performanceTitle}</strong>
            <p>공연 일시: {new Date(r.scheduleStartTime).toLocaleString()}</p>
            <p>좌석: {r.seats.map((s) => `${s.grade} ${s.seatNumber}번`).join(', ')}</p>
            <p>총 금액: {r.totalPrice.toLocaleString()}원</p>
            <p>상태: {STATUS_LABEL[r.status] || r.status}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MyReservationsPage;