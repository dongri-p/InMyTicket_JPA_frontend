import { useNavigate, useSearchParams } from 'react-router-dom';

// 토스 결제창에서 결제가 실패하거나 취소되면 토스가 이 화면으로 보냄 (주소에 code·message가 붙어 옴).
// 서버 승인 전이라 돈은 나가지 않았고, 예약은 결제 대기로 남아 있어 마이페이지에서 다시 결제할 수 있음
function PaymentFailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');
  const message = searchParams.get('message');
  const canceled = code === 'PAY_PROCESS_CANCELED' || code === 'USER_CANCEL';

  return (
    <div>
      <h1>{canceled ? '결제 취소' : '결제 실패'}</h1>
      <p role="alert">{canceled ? '결제를 취소했습니다.' : message || '결제에 실패했습니다.'}</p>
      <p>예약은 결제 대기 상태로 남아 있어서, 10분 안에 내 예매 목록에서 다시 결제할 수 있습니다.</p>

      <button type="button" onClick={() => navigate('/my-reservations')}>
        내 예매 보기
      </button>
      <button type="button" onClick={() => navigate('/')}>
        다른 공연 보기
      </button>
    </div>
  );
}

export default PaymentFailPage;
