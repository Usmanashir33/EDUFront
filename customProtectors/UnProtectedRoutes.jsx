import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authContext } from "@/customContexts/AuthContext";
import { uiContext } from "@/customContexts/UiContext";

const UnProtectedRoutes = ({ children }) => {
    const { isAuthenticated } = useContext(authContext);
    const { isLoading } = useContext(uiContext);
    const location = useLocation();
    if (isLoading) {
        // return null;
        // or a spinner
    }

    const token = localStorage.getItem("a_token");
    const isLoggedIn = isAuthenticated && token;

    if (isLoggedIn) {
        const from = location.state?.from?.pathname || "/";
        return <Navigate to={from} replace />;
    }

    return children;
};

export default UnProtectedRoutes;