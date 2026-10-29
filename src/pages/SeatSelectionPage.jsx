import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { isLoggedIn } from '../api/auth';
import LoginRequiredModal from '../components/LoginRequiredModal';
import TossPaymentWidget from '../components/TossPaymentWidget';
import { AdmissionBanner, OpenCountdown, QueueWaiting } from '../components/BookingGate';
import { useBookingGate } from '../hooks/useBookingGate';

// 한 번에 예매할 수 있는 최대 좌석 수 (백엔드 CreateReservationRequest의 @Size(max = 4)와 맞춤)
const MAX_SEATS = 4;

// 무대에서 가까운 순서 (백엔드 SeatGrade 선언 순서와 같음). 범례도 이 순서로 보여줌
const GRADE_ORDER = ['VIP', 'R', 'S', 'A'];

// 이 회차에 있는 등급만, 등급별 가격과 함께 (같은 등급은 한 가격이지만 혹시 다르면 최저가~최고가)
function gradeLegend(seats) {
  return GRADE_ORDER.map((grade) => {
    const prices = seats.filter((seat) => seat.grade === grade).map((seat) => seat.price);
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const price = min === max ? `${min.toLocaleString()}원` : `${min.toLocaleString()}~${max.toLocaleString()}원`;
    return { grade, price };
  }).filter(Boolean);
}

// 좌석 API는 한 번에 최대 100개까지만 주므로(공개 API 대량조회 방지), 전체 좌석을 다 받을 때까지 페이지를 넘겨 받음
const SEAT_PAGE_SIZE = 100;

async function fetchAllSeats(scheduleId) {
  const all = [];
  for (let page = 0; ; page++) {
    const { data } = await axiosInstance.get(`/api/v1/schedules/${scheduleId}/seats`, {
      params: { page, size: SEAT_PAGE_SIZE },
    });
    all.push(...data.data);
    // 받는 사이 좌석 수가 바뀌어도 끝없이 돌지 않도록 마지막 페이지(덜 찬 페이지)에서도 멈춤
    if (data.count < SEAT_PAGE_SIZE || all.length >= data.totalCount) return all;
  }
}

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
  const [showTossWidget, setShowTossWidget] = useState(false);
  // 예매 오픈 전이면 카운트다운, 오픈 직후 대기열 운영 중이면 차례가 될 때까지 대기 화면
  const gate = useBookingGate(scheduleId);

  useEffect(() => {
    fetchAllSeats(scheduleId)
      .then(setSeats)
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
      // 입장 시간이 지났거나 아직 줄을 안 섰으면(로그인 전에 좌석을 골라 둔 경우) 다시 줄을 세움
      if (err.response?.data?.code === 'QUEUE_ENTRY_REQUIRED') {
        setReserveError(err.response.data.message);
        gate.refresh();
        return;
      }
      // 고르는 사이 다른 사람이 먼저 예매한 좌석이 있으면, 문구만 띄우지 않고 좌석 현황을 새로 받아 그 좌석을 선택에서 뺌
      // (서버 문구가 바뀌어도 동작하도록 message가 아니라 code로 판단)
      if (err.response?.data?.code === 'SEAT_ALREADY_RESERVED') {
        try {
          const latest = await fetchAllSeats(scheduleId);
          const available = new Set(latest.filter((s) => s.status === 'AVAILABLE').map((s) => s.seatId));
          setSeats(latest);
          setSelectedSeatIds((prev) => prev.filter((id) => available.has(id)));
          setReserveError('선택한 좌석 중 다른 분이 먼저 예매한 좌석이 있어 좌석 현황을 새로 불러왔어요. 다시 골라주세요.');
        } catch {
          setReserveError(err.response.data.message);
        }
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
      await axiosInstance.post(`/api/v1/reservations/${reserveResult.id}/cancel`);
      setCancelMessage('예매가 취소되었습니다.');
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

  const orderName = selectedSeats.length === 1
    ? `좌석 ${selectedSeats[0].seatNumber}번 (${selectedSeats[0].grade})`
    : `좌석 ${selectedSeats[0]?.seatNumber}번 외 ${selectedSeats.length - 1}석`;

  if (isLoading || gate.state === 'LOADING') return <p>로딩 중...</p>;
  if (error) return <p role="alert">{error}</p>;
  // 예매를 마친 뒤에는 대기열 상태와 관계없이 결제 화면을 보여줌
  if (!reserveResult && gate.state === 'NOT_OPEN') {
    return <OpenCountdown bookingOpenAt={gate.bookingOpenAt} onOpen={gate.refresh} />;
  }
  if (!reserveResult && gate.state === 'WAITING') {
    return <QueueWaiting position={gate.position} estimatedWaitSeconds={gate.estimatedWaitSeconds} />;
  }

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
        <p>티켓 예매가 완료되었습니다. 결제를 진행해주세요.</p>
        <p>예약 번호: {reserveResult.id}</p>

        {cancelError && <p role="alert">{cancelError}</p>}

        <ul className="payment-guide">
          <li><strong>데모 결제</strong>: 인증 없이 바로 결제가 완료됩니다.</li>
          <li>
            <strong>토스 테스트 결제</strong>: 토스페이먼츠 테스트 결제위젯이 열립니다. 퀵계좌이체를 고르면 테스트 비밀번호
            000000으로 끝까지 결제해 볼 수 있고, 실제로 청구되지는 않습니다.
          </li>
        </ul>

        <button type="button" onClick={handleDemoPay} disabled={isCanceling}>
          데모 결제
        </button>
        <button type="button" onClick={() => setShowTossWidget(true)} disabled={isCanceling || showTossWidget}>
          토스 테스트 결제
        </button>
        <button type="button" onClick={handleCancel} disabled={isCanceling}>
          {isCanceling ? '취소 중...' : '예매 취소'}
        </button>

        {showTossWidget && (
          <TossPaymentWidget
            reservationId={reserveResult.id}
            amount={totalPrice}
            orderName={orderName}
            onClose={() => setShowTossWidget(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <h1>좌석 선택</h1>
      {gate.state === 'ADMITTED' && <AdmissionBanner admissionExpiresInSeconds={gate.admissionExpiresInSeconds} />}

      <ul className="grade-legend" aria-label="좌석 등급과 가격">
        {gradeLegend(seats).map(({ grade, price }) => (
          <li key={grade} className={`grade-${grade.toLowerCase()}`}>
            <strong>{grade}석</strong> {price}
          </li>
        ))}
      </ul>
      <div className="seat-legend">
        <span className="legend-selected">선택</span>
        <span className="legend-taken">예약됨</span>
      </div>

      <div className="stage">STAGE</div>
      <div className="seat-grid">
        {seats.map((seat) => (
          <button
            key={seat.seatId}
            type="button"
            className={`seat grade-${seat.grade.toLowerCase()}${selectedSeatIds.includes(seat.seatId) ? ' selected' : ''}`}
            disabled={seat.status !== 'AVAILABLE'}
            aria-pressed={selectedSeatIds.includes(seat.seatId)}
            title={`${seat.seatNumber}번 (${seat.grade}석) ${seat.price.toLocaleString()}원`}
            aria-label={`${seat.seatNumber}번 ${seat.grade}석 ${seat.price.toLocaleString()}원`}
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