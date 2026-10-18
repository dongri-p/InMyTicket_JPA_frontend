import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// 로그인 없이 둘러보다가 예매처럼 회원만 할 수 있는 동작을 누르면 띄우는 안내 팝업.
// '로그인하기'를 누르면 지금 화면(과 넘겨받은 state)을 기억해 두고 로그인 화면으로 보내서, 로그인 뒤 이 화면으로 돌아옴
function LoginRequiredModal({ onClose, returnState }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Esc로도 닫히게
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const goLogin = () => {
    navigate('/login', {
      state: { from: { pathname: location.pathname, search: location.search, state: returnState } },
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p id="login-required-title" className="modal-message">로그인 후 이용 가능합니다.</p>
        <div className="modal-actions">
          <button type="button" onClick={goLogin} autoFocus>
            로그인하기
          </button>
          <button type="button" className="button-secondary" onClick={onClose}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginRequiredModal;
