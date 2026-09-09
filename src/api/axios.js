import axios from 'axios';
import { API_BASE_URL } from '../constants';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await axios.post(`${API_BASE_URL}/user/refresh-token`, {}, { withCredentials: true });
                return apiClient(originalRequest);
            } catch (refreshError) {
                console.error("Session expired:", refreshError);
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;