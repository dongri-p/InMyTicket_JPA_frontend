import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import TossPaymentWidget from '../components/TossPaymentWidget';

const STATUS_LABEL = {
  PENDING: '결제 대기',
  PROCESSING: '결제 진행 중',
  CONFIRMED: '결제 완료',
  CANCELLED: '취소됨',
};

function MyReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  // 토스 결제위젯을 펼친 예약 (한 번에 하나만)
  const [tossPayingId, setTossPayingId] = useState(null);

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

  const handleCancel = async (reservationId) => {
    if (!window.confirm('예매를 취소할까요? 결제 완료 건은 환불 처리됩니다.')) return;

    setCancellingId(reservationId);
    setActionMessage('');
    try {
      // 성공은 204(본문 없음)라 안내 문구는 화면에서 정함
      await axiosInstance.post(`/api/v1/reservations/${reservationId}/cancel`);
      setReservations((prev) =>
        prev.map((r) => (r.reservationId === reservationId ? { ...r, status: 'CANCELLED' } : r))
      );
      setActionMessage('예매가 취소되었습니다.');
    } catch (err) {
      setActionMessage(err.response?.data?.message || '예매 취소에 실패했습니다.');
    } finally {
      setCancellingId(null);
    }
  };

  // 결제창을 닫았거나 결제에 실패해 결제 대기로 남은 예약을 다시 결제
  const handleDemoPay = (r) => {
    navigate('/payment/result', { state: { demo: { reservationId: r.reservationId, amount: r.totalPrice } } });
  };

  const canPay = (r) => r.status === 'PENDING' && new Date(r.scheduleStartTime) > new Date();

  const canCancel = (r) =>
    (r.status === 'PENDING' || r.status === 'CONFIRMED') &&
    new Date(r.scheduleStartTime) > new Date();

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>내 예매 목록</h1>
      <Link to="/">공연 목록으로</Link>

      {actionMessage && <p role="status">{actionMessage}</p>}

      {reservations.length === 0 && <p>예매 내역이 없습니다.</p>}

      <ul>
        {reservations.map((r) => (
          <li key={r.reservationId}>
            <strong>{r.performanceTitle}</strong>
            <p>공연 일시: {new Date(r.scheduleStartTime).toLocaleString()}</p>
            <p>좌석: {r.seats.map((s) => `${s.grade} ${s.seatNumber}번`).join(', ')}</p>
            <p>총 금액: {r.totalPrice.toLocaleString()}원</p>
            <p>상태: {STATUS_LABEL[r.status] || r.status}</p>
            {canPay(r) && (
              <>
                <button
                  type="button"
                  onClick={() => handleDemoPay(r)}
                  disabled={cancellingId === r.reservationId}
                >
                  데모 결제
                </button>
                <button
                  type="button"
                  onClick={() => setTossPayingId(r.reservationId)}
                  disabled={tossPayingId === r.reservationId || cancellingId === r.reservationId}
                >
                  토스 테스트 결제
                </button>
              </>
            )}
            {canCancel(r) && (
              <button
                onClick={() => handleCancel(r.reservationId)}
                disabled={cancellingId === r.reservationId}
              >
                {cancellingId === r.reservationId ? '취소 처리 중...' : '예매 취소'}
              </button>
            )}
            {canPay(r) && tossPayingId === r.reservationId && (
              <TossPaymentWidget
                reservationId={r.reservationId}
                amount={r.totalPrice}
                orderName={`${r.performanceTitle}`.slice(0, 100)}
                onClose={() => setTossPayingId(null)}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MyReservationsPage;