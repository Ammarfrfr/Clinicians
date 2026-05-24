import axios from 'axios';

// API Configuration using environment variables
// In development: uses localhost:7001 (.env.local)
// In production (Vercel): uses backend URL from .env.production

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:7001';

// Debug: Log the API URL being used
console.log('🔌 API Base URL:', API_BASE_URL);
console.log('📝 Vite env variable:', import.meta.env.VITE_API_URL);

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
