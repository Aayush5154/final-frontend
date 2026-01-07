import axios from 'axios';
import { API_BASE_URL } from '../constants';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    // This is crucial for sending the httpOnly cookies back and forth
    withCredentials: true,
});

// Response interceptor for API calls
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If the error is 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Call the refresh token endpoint
                // Note: We use axios directly or a separate instance to avoid infinite loops if this fails
                await axios.post(`${API_BASE_URL}/user/refresh-token`, {}, { withCredentials: true });

                // If successful, retry the original request
                return apiClient(originalRequest);
            } catch (refreshError) {
                // If refresh fails, redirect to login or handle logout
                // standardized way to handle this via redux is preferred but for now:
                console.error("Session expired:", refreshError);
                // Optionally: store.dispatch(logout()) if we had access to store here
                // For now, let the error propagate, RootLayout will catch authentication failure
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;