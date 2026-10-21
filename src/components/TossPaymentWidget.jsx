import { useEffect, useRef, useState } from 'react';
import { isUserCancel, renderTossWidgets, requestTossWidgetPayment } from '../api/tossPayments';

// 토스 결제위젯을 화면 안에 펼쳐 결제수단을 고르고 결제. 결제가 끝나면 토스가 결제 결과 화면(/payment/result)으로 이동시킴
function TossPaymentWidget({ reservationId, amount, orderName, onClose }) {
  const widgetsRef = useRef(null);
  // 개발 모드(StrictMode)에서 effect가 두 번 실행돼도 위젯을 한 번만 그리도록
  const hasRenderedRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (hasRenderedRef.current) return;
    hasRenderedRef.current = true;

    renderTossWidgets({ amount, methodSelector: '#toss-payment-method', agreementSelector: '#toss-agreement' })
      .then((widgets) => {
        widgetsRef.current = widgets;
        setIsReady(true);
      })
      .catch((err) => {
        setMessage(err?.message || '결제 화면을 불러오지 못했습니다.');
      });
  }, [amount]);

  const handlePay = async () => {
    setIsRequesting(true);
    setMessage('');
    try {
      await requestTossWidgetPayment(widgetsRef.current, { reservationId, orderName });
    } catch (err) {
      setMessage(isUserCancel(err)
        ? '결제를 취소했습니다. 다시 결제하거나 예매를 취소할 수 있습니다.'
        : err?.message || '결제를 진행하지 못했습니다.');
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="toss-widget">
      <div id="toss-payment-method" />
      <div id="toss-agreement" />
      {message && <p role="alert">{message}</p>}
      <button type="button" onClick={handlePay} disabled={!isReady || isRequesting}>
        {isRequesting ? '결제 진행 중...' : `${amount.toLocaleString()}원 결제하기`}
      </button>
      <button type="button" className="button-secondary" onClick={onClose} disabled={isRequesting}>
        닫기
      </button>
    </div>
  );
}

export default TossPaymentWidget;
