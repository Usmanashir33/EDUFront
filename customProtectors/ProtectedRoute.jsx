// import { useContext, useEffect, useState } from "react";
// import { authContext } from "../customContexts/AuthContext";
// import { uiContext } from "@/customContexts/UiContext";
// import { Navigate } from "react-router-dom";



// const ProtectedRoute = ({ children }) => {
//     const { isAuthenticated, } = useContext(authContext);
//     const [allow, setAllow] = useState(true);
//     const { setToast } = useContext(uiContext);


//     const allow_access = () => { // base on the availability of users accesstokens
//         let token = localStorage.getItem('a_token')
//         if (isAuthenticated && token) {
//             setAllow(true)
//         } else {
//             setAllow(false);
//         }
//     }
//     useEffect(() => {
//         allow_access()
//     }, [isAuthenticated])
//     return allow ? children : < Navigate to='/auth/login' />;
// }

// export default ProtectedRoute;

import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authContext } from "../customContexts/AuthContext";

const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, currentUser } = useContext(authContext);
    const location = useLocation();

    const token = localStorage.getItem("a_token");

    const isAllowed = isAuthenticated && token;
    // prevent users from accessing routes that are not meant for their role
    let currentLocation = location.pathname.split("/").filter(Boolean)[0];
    let userRole = currentUser?.role?.toLowerCase();
    // if (currentLocation && userRole && currentLocation !== userRole) {
    //     return (
    //         <Navigate
    //             to={`/${userRole}`}
    //             replace
    //             state={{ from: location }}
    //         />
    //     )
    // }
    if (!isAllowed) {
        return (
            <Navigate
                to="/auth/login"
                replace
                state={{ from: location }}
            />
        );
    }

    return children;
};

export default ProtectedRoute;