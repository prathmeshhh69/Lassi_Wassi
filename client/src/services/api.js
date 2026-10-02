import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL?.trim() || "http://localhost:5000";

const api = axios.create({
    baseURL: apiBaseUrl,
});

// Handle 401 responses globally — dispatch a custom event so AuthContext
// can react without a hard page reload.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            window.dispatchEvent(new Event("auth:logout"));
        }
        return Promise.reject(error);
    }
);

export default api;
