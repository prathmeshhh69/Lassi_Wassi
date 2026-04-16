import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * /owner/login is kept for backward compatibility.
 * It redirects straight to the unified login page pre-set to Owner mode.
 */
export default function OwnerLogin() {
    const navigate = useNavigate();

    useEffect(() => {
        navigate("/login?mode=owner", { replace: true });
    }, [navigate]);

    return null;
}

