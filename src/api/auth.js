// JWT 가운데 부분(payload)만 디코딩. 서명 검증은 서버가 하므로 여기 값은 화면 표시용으로만 씀
function readPayload(token) {
  const payload = token.split('.')[1];
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

export function isTokenExpired(token) {
  try {
    const { exp } = readPayload(token);
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function isLoggedIn() {
  const token = localStorage.getItem('accessToken');
  return !!token && !isTokenExpired(token);
}

// 관리자 메뉴 노출용. 토큰을 고쳐서 ADMIN으로 바꿔도 서버가 서명 검증 후 403을 주므로 보안 경계는 아님
export function isAdmin() {
  if (!isLoggedIn()) return false;
  try {
    return readPayload(localStorage.getItem('accessToken')).role === 'ADMIN';
  } catch {
    return false;
  }
}

export function logout() {
  localStorage.removeItem('accessToken');
}
