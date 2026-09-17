import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

function SeatSelectionPage() {
  const { scheduleId } = useParams();
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveResult, setReserveResult] = useState(null);
  const [reserveError, setReserveError] = useState('');

  useEffect(() => {
    axiosInstance
      .get(`/api/v1/schedules/${scheduleId}/seats`, { params: { page: 0, size: 100 } })
      .then((response) => {
        setSeats(response.data.data);
      })
      .catch(() => {
        setError('좌석 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [scheduleId]);

  const handleReserve = async () => {
    if (!selectedSeatId) return;
    setIsReserving(true);
    setReserveError('');

    try {
      const response = await axiosInstance.post('/api/v1/reservations', {
        seatId: selectedSeatId,
      });
      setReserveResult(response.data);
    } catch (err) {
      const message = err.response?.data?.message || '예매에 실패했습니다.';
      setReserveError(message);
    } finally {
      setIsReserving(false);
    }
  };

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p role="alert">{error}</p>;

  if (reserveResult) {
  return (
    <div>
      <h1>예매 완료</h1>
      <p>{reserveResult.message}</p>
      <p>예약 번호: {reserveResult.id}</p>
      <button
        type="button"
        onClick={() => navigate('/payment/result', { state: { reservationId: reserveResult.id } })}
      >
        결제하기
      </button>
    </div>
    );
  }

  return (
    <div>
      <h1>좌석 선택</h1>
      <ul>
        {seats.map((seat) => (
          <li key={seat.seatId}>
            <label>
              <input
                type="radio"
                name="seat"
                disabled={seat.status !== 'AVAILABLE'}
                checked={selectedSeatId === seat.seatId}
                onChange={() => setSelectedSeatId(seat.seatId)}
              />
              {seat.seatNumber}번 ({seat.grade}) - {seat.price.toLocaleString()}원
              {seat.status !== 'AVAILABLE' && ' [예약됨]'}
            </label>
          </li>
        ))}
      </ul>

      {reserveError && <p role="alert">{reserveError}</p>}

      <button type="button" onClick={handleReserve} disabled={!selectedSeatId || isReserving}>
        {isReserving ? '예매 중...' : '예매하기'}
      </button>
    </div>
  );
}

export default SeatSelectionPage;