import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

function isTokenExpired(token) {
  try {
    const payload = token.split('.')[1];
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(base64));
    return exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

instance.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    if (isTokenExpired(token)) {
      localStorage.removeItem('accessToken');
    } else {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default instance;