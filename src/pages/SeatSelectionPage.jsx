import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { isLoggedIn } from '../api/auth';
import { isUserCancel, requestTossPayment } from '../api/tossPayments';
import LoginRequiredModal from '../components/LoginRequiredModal';

// 한 번에 예매할 수 있는 최대 좌석 수 (백엔드 CreateReservationRequest의 @Size(max = 4)와 맞춤)
const MAX_SEATS = 4;

function SeatSelectionPage() {
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  // 로그인하고 돌아온 경우 로그인 전에 골라 둔 좌석들을 그대로 선택해 둠
  const [selectedSeatIds, setSelectedSeatIds] = useState(location.state?.selectedSeatIds ?? []);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const closeLoginModal = useCallback(() => setShowLoginModal(false), []);
  const [isReserving, setIsReserving] = useState(false);
  const [reserveResult, setReserveResult] = useState(null);
  const [reserveError, setReserveError] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelMessage, setCancelMessage] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [isOpeningPayment, setIsOpeningPayment] = useState(false);
  const [payMessage, setPayMessage] = useState('');

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
    if (selectedSeatIds.length === 0) return;
    if (!isLoggedIn()) {
      setShowLoginModal(true);
      return;
    }
    setIsReserving(true);
    setReserveError('');

    try {
      const response = await axiosInstance.post('/api/v1/reservations', {
        seatIds: selectedSeatIds,
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

  // 누르면 선택/해제, 최대 좌석 수를 넘으면 무시
  const toggleSeat = (seatId) => {
    setSelectedSeatIds((prev) => {
      if (prev.includes(seatId)) return prev.filter((id) => id !== seatId);
      if (prev.length >= MAX_SEATS) return prev;
      return [...prev, seatId];
    });
  };

  const selectedSeats = seats.filter((seat) => selectedSeatIds.includes(seat.seatId));
  const totalPrice = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);

  // 데모 결제: 결제창 없이 결제 결과 화면에서 바로 승인 요청
  const handleDemoPay = () => {
    navigate('/payment/result', { state: { demo: { reservationId: reserveResult.id, amount: totalPrice } } });
  };

  // 토스 결제창을 띄움. 결제가 끝나면 토스가 결제 결과 화면(/payment/result)으로 이동시킴
  const handleTossPay = async () => {
    setIsOpeningPayment(true);
    setPayMessage('');
    try {
      await requestTossPayment({
        reservationId: reserveResult.id,
        amount: totalPrice,
        orderName: selectedSeats.length === 1
          ? `좌석 ${selectedSeats[0].seatNumber}번 (${selectedSeats[0].grade})`
          : `좌석 ${selectedSeats[0].seatNumber}번 외 ${selectedSeats.length - 1}석`,
      });
    } catch (err) {
      setPayMessage(isUserCancel(err)
        ? '결제를 취소했습니다. 다시 결제하거나 예매를 취소할 수 있습니다.'
        : err?.message || '결제창을 열지 못했습니다.');
    } finally {
      setIsOpeningPayment(false);
    }
  };

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
        {payMessage && <p role="alert">{payMessage}</p>}

        <ul className="payment-guide">
          <li><strong>데모 결제</strong>: 인증 없이 바로 결제가 완료됩니다.</li>
          <li>
            <strong>토스 테스트 결제</strong>: 토스페이먼츠 테스트 결제창이 열립니다. 본인 카드사 앱 인증이 필요하지만
            실제로 청구되지는 않습니다. (테스트 환경이라 카카오페이는 지원되지 않습니다)
          </li>
        </ul>

        <button type="button" onClick={handleDemoPay} disabled={isOpeningPayment || isCanceling}>
          데모 결제
        </button>
        <button type="button" onClick={handleTossPay} disabled={isOpeningPayment || isCanceling}>
          {isOpeningPayment ? '결제창 여는 중...' : '토스 테스트 결제'}
        </button>
        <button type="button" onClick={handleCancel} disabled={isCanceling || isOpeningPayment}>
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
            className={`seat${selectedSeatIds.includes(seat.seatId) ? ' selected' : ''}`}
            disabled={seat.status !== 'AVAILABLE'}
            aria-pressed={selectedSeatIds.includes(seat.seatId)}
            title={`${seat.seatNumber}번 (${seat.grade}) ${seat.price.toLocaleString()}원`}
            onClick={() => toggleSeat(seat.seatId)}
          >
            {seat.seatNumber}
          </button>
        ))}
      </div>

      {selectedSeats.length > 0 ? (
        <p>
          선택한 좌석 ({selectedSeats.length}/{MAX_SEATS}):{' '}
          <strong>{selectedSeats.map((seat) => `${seat.seatNumber}번 (${seat.grade})`).join(', ')}</strong> ·{' '}
          {totalPrice.toLocaleString()}원
        </p>
      ) : (
        <p>좌석을 선택해주세요. (최대 {MAX_SEATS}석)</p>
      )}

      {reserveError && <p role="alert">{reserveError}</p>}

      <button type="button" onClick={handleReserve} disabled={selectedSeatIds.length === 0 || isReserving}>
        {isReserving ? '예매 중...' : '예매하기'}
      </button>

      {showLoginModal && (
        <LoginRequiredModal onClose={closeLoginModal} returnState={{ selectedSeatIds }} />
      )}
    </div>
  );
}

export default SeatSelectionPage;