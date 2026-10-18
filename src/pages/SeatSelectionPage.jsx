import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { isLoggedIn } from '../api/auth';
import LoginRequiredModal from '../components/LoginRequiredModal';

function SeatSelectionPage() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // 로그인하고 돌아온 경우 로그인 전에 골라 둔 좌석을 그대로 선택해 둠
  const [selectedSeatId, setSelectedSeatId] = useState(location.state?.selectedSeatId ?? null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const closeLoginModal = useCallback(() => setShowLoginModal(false), []);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveResult, setReserveResult] = useState(null);
  const [reserveError, setReserveError] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelError, setCancelError] = useState('');

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
    if (!isLoggedIn()) {
      setShowLoginModal(true);
      return;
    }
    setIsReserving(true);
    setReserveError('');

    try {
      const response = await axiosInstance.post('/api/v1/reservations', {
        seatId: selectedSeatId,
      });
      setReserveResult(response.data);
    } catch (err) {
      // 화면을 연 사이 로그인이 만료됐으면 오류 문구 대신 로그인 안내
      if (err.response?.status === 401) {
        setShowLoginModal(true);
        return;
      }
      const message = err.response?.data?.message || '예매에 실패했습니다.';
      setReserveError(message);
    } finally {
      setIsReserving(false);
    }
  };

  const handleCancel = async () => {
    setIsCanceling(true);
    setCancelError('');

    try {
      const response = await axiosInstance.delete(`/api/v1/reservations/${reserveResult.id}`);
      setCancelMessage(response.data.message);
    } catch (err) {
      const message = err.response?.data?.message || '예매 취소에 실패했습니다.';
      setCancelError(message);
    } finally {
      setIsCanceling(false);
    }
  };

  const selectedSeat = seats.find((seat) => seat.seatId === selectedSeatId);

  if (isLoading) return <p>로딩 중...</p>;
  if (error) return <p role="alert">{error}</p>;

  if (reserveResult) {
    if (cancelMessage) {
      return (
        <div>
          <h1>예매 취소 완료</h1>
          <p>{cancelMessage}</p>
        </div>
      );
    }

    return (
      <div>
        <h1>예매 완료</h1>
        <p>{reserveResult.message}</p>
        <p>예약 번호: {reserveResult.id}</p>

        {cancelError && <p role="alert">{cancelError}</p>}

        <p>결제는 실제 카드 청구가 없는 가상 결제(모의 PG)로 진행됩니다. 안심하고 눌러보세요.</p>

        <button
          type="button"
          onClick={() => navigate('/payment/result', { state: { reservationId: reserveResult.id } })}
        >
          결제하기
        </button>
        <button type="button" onClick={handleCancel} disabled={isCanceling}>
          {isCanceling ? '취소 중...' : '예매 취소'}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>좌석 선택</h1>

      <div className="seat-legend">
        <span>선택 가능</span>
        <span className="legend-selected">선택</span>
        <span className="legend-taken">예약됨</span>
      </div>

      <div className="stage">STAGE</div>
      <div className="seat-grid">
        {seats.map((seat) => (
          <button
            key={seat.seatId}
            type="button"
            className={`seat${selectedSeatId === seat.seatId ? ' selected' : ''}`}
            disabled={seat.status !== 'AVAILABLE'}
            aria-pressed={selectedSeatId === seat.seatId}
            title={`${seat.seatNumber}번 (${seat.grade}) ${seat.price.toLocaleString()}원`}
            onClick={() => setSelectedSeatId(seat.seatId)}
          >
            {seat.seatNumber}
          </button>
        ))}
      </div>

      {selectedSeat ? (
        <p>
          선택한 좌석: <strong>{selectedSeat.seatNumber}번 ({selectedSeat.grade})</strong> ·{' '}
          {selectedSeat.price.toLocaleString()}원
        </p>
      ) : (
        <p>좌석을 선택해주세요.</p>
      )}

      {reserveError && <p role="alert">{reserveError}</p>}

      <button type="button" onClick={handleReserve} disabled={!selectedSeatId || isReserving}>
        {isReserving ? '예매 중...' : '예매하기'}
      </button>

      {showLoginModal && (
        <LoginRequiredModal onClose={closeLoginModal} returnState={{ selectedSeatId }} />
      )}
    </div>
  );
}

export default SeatSelectionPage;