import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { createDemoPaymentKey, createOrderId } from '../api/tossPayments';

// 결제 승인 화면. 두 경로로 들어옴
// - 토스 결제창에서 결제를 마치면 토스가 주소에 paymentKey·orderId·amount를 붙여 이 화면으로 보냄
// - 데모 결제는 예매 화면에서 예약 번호·금액을 state로 넘겨 바로 들어옴
// 어느 쪽이든 서버에 승인을 요청하고(토스면 서버가 토스 승인 API 호출) 결과를 보여줌
function readPaymentRequest(searchParams, demo) {
  if (demo) {
    return {
      provider: 'DEMO',
      reservationId: demo.reservationId,
      paymentKey: createDemoPaymentKey(),
      orderId: createOrderId(demo.reservationId),
      amount: demo.amount,
    };
  }
  return {
    provider: 'TOSS',
    reservationId: Number(searchParams.get('reservationId')),
    paymentKey: searchParams.get('paymentKey'),
    orderId: searchParams.get('orderId'),
    amount: Number(searchParams.get('amount')),
  };
}

function PaymentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // 렌더할 때마다 데모 결제 키가 새로 만들어지지 않도록 처음 한 번만 읽음
  const [paymentRequest] = useState(() => readPaymentRequest(searchParams, location.state?.demo));
  // 이미 결제가 끝난 기록(뒤로가기로 다시 들어온 경우)이면 결제 요청 없이 그 결과를 보여줌
  const paidResult = location.state?.paymentResult;
  const hasRequestedRef = useRef(false);

  const [isProcessing, setIsProcessing] = useState(!paidResult);
  const [result, setResult] = useState(paidResult ?? null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (paidResult) return;

    const { reservationId, paymentKey, orderId, amount } = paymentRequest;
    if (!reservationId || !paymentKey || !orderId || !amount) {
      setIsProcessing(false);
      setError('결제 정보가 없습니다. 예매 화면부터 다시 진행해주세요.');
      return;
    }

    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    axiosInstance
      .post('/api/v1/payments', paymentRequest)
      .then((response) => {
        setResult(response.data);
        // 이 화면의 방문 기록에서 주소의 결제 정보를 지우고 결제 결과로 바꿔 둠. 그대로 두면 다른 화면에 갔다가
        // 뒤로가기로 돌아왔을 때 결제 요청이 다시 나가고, 서버가 막으면서 오류 메시지가 보임
        navigate(location.pathname, { replace: true, state: { paymentResult: response.data } });
      })
      .catch((err) => {
        const message = err.response?.data?.message || '결제에 실패했습니다.';
        setError(message);
      })
      .finally(() => {
        setIsProcessing(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentRequest, paidResult]);

  if (isProcessing) return <p>결제 처리 중...</p>;
  if (error) {
    // 승인에 실패해도 예약은 결제 대기로 남아 있어서 마이페이지에서 다시 결제할 수 있음
    return (
      <div>
        <h1>결제 실패</h1>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => navigate('/my-reservations')}>
          내 예매 보기
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1>결제 완료</h1>
      <p>결제가 승인 완료되었습니다. 티켓 예매가 확정되었습니다.</p>
      <p>결제 번호: {result.id}</p>

      {/* 결제가 끝나면 다음에 할 일(예매 확인, 다른 공연 보기)로 바로 갈 수 있게 */}
      <button type="button" onClick={() => navigate('/my-reservations')}>
        내 예매 보기
      </button>
      <button type="button" onClick={() => navigate('/')}>
        다른 공연 보기
      </button>
    </div>
  );
}

export default PaymentResultPage;