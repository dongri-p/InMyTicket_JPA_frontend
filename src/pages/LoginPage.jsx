import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { isLoggedIn } from '../api/auth';

// README에도 공개하는 체험용 일반 회원 계정
const DEMO_ACCOUNT = { loginId: 'demo', password: 'demo1234!' };

function LoginPage() {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoggedIn()) return <Navigate to="/" replace />;

  const login = async (credentials) => {
    setError('');
    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/api/v1/members/login', credentials);
      localStorage.setItem('accessToken', response.data.accessToken);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err.response?.data?.message || '로그인에 실패했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ loginId, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>로그인</h1>

      {location.state?.signedUp && <p>회원가입이 완료되었습니다. 로그인해 주세요.</p>}

      <div>
        <label htmlFor="loginId">아이디</label>
        <input
          id="loginId"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          required
        />
      </div>

      <div>
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? '로그인 중...' : '로그인'}
      </button>

      <button type="button" onClick={() => login(DEMO_ACCOUNT)} disabled={isLoading}>
        체험 계정으로 둘러보기
      </button>
      <p>가입 없이 바로 예매·결제를 체험할 수 있습니다. (결제는 실제 청구되지 않는 가상 결제입니다)</p>

      <p>
        계정이 없나요? <Link to="/signup">회원가입</Link>
      </p>
    </form>
  );
}

export default LoginPage;