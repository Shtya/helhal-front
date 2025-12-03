// lib/axios.ts
import axios from 'axios';

export const baseImg = process.env.NEXT_PUBLIC_WS_URL;
export const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
});


export const uploadTimeout = 15 * 60 * 1000; // 15m
export const fileTimeout = 54 * 60 * 1000; // 5m

// a plain client WITHOUT interceptors for refresh
export const refreshClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});



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


// auth interseptor will be added in useAuthInterceptor hook at @/hooks/useAuthInterceptor;

export default api;
