import axios from 'axios';
import { isTokenExpired } from './auth';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
});

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