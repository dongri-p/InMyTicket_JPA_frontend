import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';

function PaymentResultPage() {
  const location = useLocation();
  const reservationId = location.state?.reservationId;
  const hasRequestedRef = useRef(false);

  const [isProcessing, setIsProcessing] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reservationId) {
      setIsProcessing(false);
      setError('예약 정보가 없습니다. 예매 화면부터 다시 진행해주세요.');
      return;
    }

    if (hasRequestedRef.current) return;
    hasRequestedRef.current = true;

    axiosInstance
      .post('/api/v1/payments', {
        reservationId,
        paymentKey: crypto.randomUUID(),
      })
      .then((response) => {
        setResult(response.data);
      })
      .catch((err) => {
        const message = err.response?.data?.message || '결제에 실패했습니다.';
        setError(message);
      })
      .finally(() => {
        setIsProcessing(false);
      });
  }, [reservationId]);

  if (isProcessing) return <p>결제 처리 중...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div>
      <h1>결제 완료</h1>
      <p>{result.message}</p>
      <p>결제 번호: {result.id}</p>
    </div>
  );
}

export default PaymentResultPage;