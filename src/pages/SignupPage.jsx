import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { isLoggedIn } from '../api/auth';

function SignupPage() {
  const [form, setForm] = useState({ loginId: '', email: '', password: '', name: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (isLoggedIn()) return <Navigate to="/" replace />;

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await axiosInstance.post('/api/v1/members', form);
      navigate('/login', { replace: true, state: { signedUp: true } });
    } catch (err) {
      const message = err.response?.data?.message || '회원가입에 실패했습니다.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>회원가입</h1>

      <div>
        <label htmlFor="loginId">아이디 (4~20자)</label>
        <input
          id="loginId"
          name="loginId"
          value={form.loginId}
          onChange={handleChange}
          minLength={4}
          maxLength={20}
          required
        />
      </div>

      <div>
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          value={form.email}
          onChange={handleChange}
          maxLength={100}
          required
        />
      </div>

      <div>
        <label htmlFor="password">비밀번호 (8자 이상)</label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={handleChange}
          minLength={8}
          maxLength={100}
          required
        />
      </div>

      <div>
        <label htmlFor="name">이름</label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={handleChange}
          maxLength={30}
          required
        />
      </div>

      {error && <p role="alert">{error}</p>}

      <button type="submit" disabled={isLoading}>
        {isLoading ? '가입 중...' : '회원가입'}
      </button>

      <p>
        이미 계정이 있나요? <Link to="/login">로그인</Link>
      </p>
    </form>
  );
}

export default SignupPage;
