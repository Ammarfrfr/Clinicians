import axios from 'axios';

// API Configuration using environment variables
// In development: uses localhost:7001 (.env.local)
// In production (Vercel): uses backend URL from .env.production

// Helper to format and ensure valid API URL with protocol
const formatApiBaseUrl = (rawUrl) => {
  let url = (rawUrl || '').trim();
  if (!url) {
    return 'http://localhost:7001';
  }
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');
  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    const isLocal = url.includes('localhost') || url.includes('127.0.0.1');
    url = isLocal ? `http://${url}` : `https://${url}`;
  }
  return url;
};

const API_BASE_URL = formatApiBaseUrl(import.meta.env.VITE_API_URL);

// Debug: Log the API URL being used
console.log('🔌 API Base URL:', API_BASE_URL);
console.log('📝 Raw Vite env variable:', import.meta.env.VITE_API_URL);

// Create Axios instance with base URL
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enabled for cookie sessions
});

// Request interceptor to attach Bearer token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized access
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Trigger a redirect if we are not on landing/login/register pages
      const path = window.location.pathname;
      if (path !== '/' && path !== '/login' && path !== '/register') {
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

// Helper to get full URL (for debugging)
export const createApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export base URL for reference
export { API_BASE_URL };
