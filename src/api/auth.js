export function isTokenExpired(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64));
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function isLoggedIn() {
  const token = localStorage.getItem('accessToken');
  return !!token && !isTokenExpired(token);
}

export function logout() {
  localStorage.removeItem('accessToken');
}
