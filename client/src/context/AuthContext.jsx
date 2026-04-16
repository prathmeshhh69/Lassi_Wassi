import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

/** Keep the axios default header in sync with the stored token */
const setAxiosToken = (token) => {
    if (token) {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
        delete api.defaults.headers.common["Authorization"];
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    // On app boot: restore session from localStorage
    useEffect(() => {
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setAxiosToken(storedToken);
            api.get("/api/auth/me")
                .then(({ data }) => {
                    setToken(storedToken);
                    setUser(data.data);
                })
                .catch(() => {
                    // Token is invalid or expired — wipe everything
                    localStorage.removeItem("token");
                    setAxiosToken(null);
                    setToken(null);
                    setUser(null);
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const _persist = (userData, userToken) => {
        localStorage.setItem("token", userToken);
        setAxiosToken(userToken);
        setToken(userToken);
        setUser(userData);
    };

    const register = async (formData) => {
        const { data } = await api.post("/api/auth/register", formData);
        _persist(data.data, data.token);
        return data;
    };

    const login = async (formData) => {
        const { data } = await api.post("/api/auth/login", formData);
        _persist(data.data, data.token);
        return data;
    };

    const ownerLogin = async (formData) => {
        const { data } = await api.post("/api/auth/owner-login", formData);
        _persist(data.data, data.token);
        return data;
    };

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        setAxiosToken(null);
        setToken(null);
        setUser(null);
    }, []);

    // Listen for 401 responses dispatched by the axios interceptor
    useEffect(() => {
        window.addEventListener("auth:logout", logout);
        return () => window.removeEventListener("auth:logout", logout);
    }, [logout]);

    return (
        <AuthContext.Provider value={{ user, token, loading, role: user?.role ?? null, register, login, ownerLogin, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
