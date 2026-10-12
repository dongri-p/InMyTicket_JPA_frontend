import { Navigate } from 'react-router-dom';
import { isAdmin, isLoggedIn } from '../api/auth';

// 로그인 안 했으면 로그인 화면으로, 일반 회원이면 메인으로 보냄
function RequireAdmin({ children }) {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return children;
}

export default RequireAdmin;
