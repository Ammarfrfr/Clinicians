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
  withCredentials: false, // Disable for now since backend doesn't need cookies
});

// Helper to get full URL (for debugging)
export const createApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

// Export base URL for reference
export { API_BASE_URL };
