import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Retry configurations
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config } = error;

        // If config is missing, reject immediately
        if (!config) {
            return Promise.reject(error);
        }

        // Initialize retry count
        config.__retryCount = config.__retryCount || 0;

        // Check if error is retryable:
        // 1. Network error (no response)
        // 2. Server/Gateway error (5xx status)
        const isNetworkError = !error.response;
        const isServerError = error.response && error.response.status >= 500;

        if ((isNetworkError || isServerError) && config.__retryCount < MAX_RETRIES) {
            config.__retryCount += 1;
            console.warn(`Request to ${config.url} failed (${error.message}). Retrying ${config.__retryCount}/${MAX_RETRIES} in ${RETRY_DELAY_MS}ms...`);
            
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
            return api(config);
        }

        // Handle 401 unauthorized
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Redirect to login page
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
