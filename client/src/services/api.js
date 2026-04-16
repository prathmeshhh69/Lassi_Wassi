import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:5000",
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
