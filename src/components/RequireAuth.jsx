import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../api/auth';

// 로그인 화면으로 보낼 때 원래 가려던 화면을 넘겨서, 로그인 뒤 그 화면으로 돌아오게 함
function RequireAuth({ children }) {
  const location = useLocation();
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: { pathname: location.pathname, search: location.search } }} />;
  }
  return children;
}

export default RequireAuth;
