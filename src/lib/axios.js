// lib/axios.ts
import axios from 'axios';

export const baseImg = 'http://localhost:8081/';
const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});

// a plain client WITHOUT interceptors for refresh
const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// mark routes that should never trigger refresh
const AUTH_BLOCKLIST = ['/auth/login', '/auth/register', '/auth/verify-email', '/auth/resend-verification-email', '/auth/forgot-password', '/auth/reset-password', '/auth/refresh'];

// attach access token if present
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');

    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ----- refresh logic -----
let refreshPromise = null;

function isAuthBlocked(url) {
  if (!url) return false;
  try {
    // url may already be absolute or relative – normalize the path part only
    const u = new URL(url, BASE_URL);
    const path = u.pathname.replace(/\/+$/, ''); // strip trailing slash
    return AUTH_BLOCKLIST.some(b => path.endsWith(b));
  } catch {
    return false;
  }
}

api.interceptors.response.use(
  res => res,
  async error => {
    const response = error.response;
    const original = error.config;

    // If no response (network error / CORS), just bubble up
    if (!response || !original) return Promise.reject(error);

    // do NOT refresh for blocked endpoints
    if (isAuthBlocked(original.url)) {
      return Promise.reject(error);
    }

    // only handle 401 with a single retry
    if (response.status === 401 && !original._retry) {
      original._retry = true;

      // require a refresh token to attempt refresh
      const storedRt = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
      if (!storedRt) {
        // no RT → hard logout once
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          // optional: window.location.href = '/auth?tab=login';
        }
        return Promise.reject(error);
      }

      try {
        // share one refresh call across concurrent 401s
        if (!refreshPromise) {
          refreshPromise = refreshClient
            .post('/auth/refresh', { refreshToken: storedRt })
            .then(r => r.data)
            .finally(() => {
              refreshPromise = null;
            });
        }

        const { accessToken, refreshToken } = await refreshPromise;

        if (typeof window !== 'undefined') {
          if (accessToken) localStorage.setItem('accessToken', accessToken);
          if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        }

        // retry original with the fresh access token
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch (e) {
        // refresh failed → hard logout and stop retrying
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          // optional: window.location.href = '/auth?tab=login';
        }
        return Promise.reject(e);
      }
    }

    // For any other error/status, just bubble up
    return Promise.reject(error);
  },
);

export default api;
