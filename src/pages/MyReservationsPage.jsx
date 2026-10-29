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

// 취소 확인 - 결제한 예약이면 결제 금액·수수료·환불액을 보여주고 확정받음
function RefundPreview({ quote, isCancelling, onConfirm, onClose }) {
  const won = (amount) => `${amount.toLocaleString()}원`;
  return (
    <div className="refund-preview" role="group" aria-label="예매 취소 확인">
      {quote.paidAmount > 0 ? (
        <>
          <dl>
            <dt>결제 금액</dt>
            <dd>{won(quote.paidAmount)}</dd>
            <dt>취소 수수료</dt>
            <dd>
              {won(quote.cancelFee)} ({quote.feeRate}%)
            </dd>
            <dt>환불 금액</dt>
            <dd>
              <strong>{won(quote.refundAmount)}</strong>
            </dd>
          </dl>
          <p className="refund-reason">{quote.reason}</p>
        </>
      ) : (
        <p className="refund-reason">{quote.reason} 바로 취소됩니다.</p>
      )}
      <div className="refund-actions">
        <button type="button" onClick={onConfirm} disabled={isCancelling}>
          {isCancelling ? '취소 처리 중...' : '취소 확정'}
        </button>
        <button type="button" className="button-secondary" onClick={onClose} disabled={isCancelling}>
          닫기
        </button>
      </div>
    </div>
  );
}

function MyReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  // 취소 전에 보여주는 환불 미리 보기 (한 번에 하나만) - { reservationId, quote }
  const [refundPreview, setRefundPreview] = useState(null);
  const [quotingId, setQuotingId] = useState(null);
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

  // 1단계: 지금 취소하면 수수료와 환불액이 얼마인지 서버에 물어서 보여줌 (취소 API와 같은 계산)
  const handleCancel = async (reservationId) => {
    setQuotingId(reservationId);
    setActionMessage('');
    try {
      const { data } = await axiosInstance.get(`/api/v1/reservations/${reservationId}/refund-quote`);
      setRefundPreview({ reservationId, quote: data });
    } catch (err) {
      setActionMessage(err.response?.data?.message || '환불 금액을 확인하지 못했습니다.');
    } finally {
      setQuotingId(null);
    }
  };

  // 2단계: 미리 본 금액으로 취소 확정
  const confirmCancel = async () => {
    const { reservationId, quote } = refundPreview;
    setCancellingId(reservationId);
    setActionMessage('');
    try {
      // 성공은 204(본문 없음)라 안내 문구는 화면에서 정함
      await axiosInstance.post(`/api/v1/reservations/${reservationId}/cancel`);
      const paid = quote.paidAmount > 0;
      setReservations((prev) =>
        prev.map((r) =>
          r.reservationId === reservationId
            ? {
                ...r,
                status: 'CANCELLED',
                cancelFee: paid ? quote.cancelFee : r.cancelFee,
                refundedAmount: paid ? quote.refundAmount : r.refundedAmount,
              }
            : r
        )
      );
      setRefundPreview(null);
      setActionMessage(
        paid
          ? `예매가 취소되었습니다. ${quote.refundAmount.toLocaleString()}원을 환불했습니다.`
          : '예매가 취소되었습니다.'
      );
    } catch (err) {
      // 미리 본 사이 날짜가 바뀌어 수수료 구간이 달라질 수 있어, 실패하면 미리 보기를 닫고 다시 누르게 함
      setRefundPreview(null);
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
      <p className="cancel-policy">
        취소 수수료: 공연 7일 전까지 무료 · 6~3일 전 10% · 2일 전부터 30% · 공연 시작 후 취소 불가
        <br />
        예매 후 24시간 안에 취소하면 무료 (공연 2일 전부터 한 예매는 제외)
      </p>

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
            {r.status === 'CANCELLED' && r.refundedAmount != null && (
              <p>
                환불: {r.refundedAmount.toLocaleString()}원
                {r.cancelFee > 0 && ` (수수료 ${r.cancelFee.toLocaleString()}원)`}
              </p>
            )}
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
            {canCancel(r) && refundPreview?.reservationId !== r.reservationId && (
              <button
                onClick={() => handleCancel(r.reservationId)}
                disabled={quotingId === r.reservationId}
              >
                {quotingId === r.reservationId ? '환불 금액 확인 중...' : '예매 취소'}
              </button>
            )}
            {canCancel(r) && refundPreview?.reservationId === r.reservationId && (
              <RefundPreview
                quote={refundPreview.quote}
                isCancelling={cancellingId === r.reservationId}
                onConfirm={confirmCancel}
                onClose={() => setRefundPreview(null)}
              />
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