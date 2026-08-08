import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`
});

let accessToken = null;
let refreshToken = null;

export function setTokens(tokens) {
  accessToken = tokens?.accessToken ?? null;
  refreshToken = tokens?.refreshToken ?? null;
  if (tokens) {
    localStorage.setItem('bizzguest.refreshToken', tokens.refreshToken);
  } else {
    localStorage.removeItem('bizzguest.refreshToken');
  }
}

export function loadStoredRefreshToken() {
  refreshToken = localStorage.getItem('bizzguest.refreshToken');
  return refreshToken;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

let refreshInFlight = null;

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.includes('/auth/');

    if (error.response?.status === 401 && refreshToken && !original._retried && !isAuthEndpoint) {
      original._retried = true;
      try {
        refreshInFlight = refreshInFlight || apiClient.post('/auth/refresh', { refreshToken });
        const { data } = await refreshInFlight;
        refreshInFlight = null;
        setTokens(data.data);
        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return apiClient(original);
      } catch (refreshError) {
        refreshInFlight = null;
        setTokens(null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.error?.message || fallback;
}
