import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import api from "../services/api";

const OwnerRestaurantContext = createContext(null);

export const OwnerRestaurantProvider = ({ children }) => {
    const { user } = useAuth();
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadRestaurant = useCallback(async () => {
        if (!user?._id) { setLoading(false); return; }
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.get("/api/owner/my-restaurant");
            setRestaurant(data.data ?? null);
        } catch (err) {
            setError(err?.response?.data?.message ?? "Failed to load restaurant");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { loadRestaurant(); }, [loadRestaurant]);

    return (
        <OwnerRestaurantContext.Provider value={{ restaurant, setRestaurant, loading, error, reload: loadRestaurant }}>
            {children}
        </OwnerRestaurantContext.Provider>
    );
};

export const useOwnerRestaurant = () => useContext(OwnerRestaurantContext);
