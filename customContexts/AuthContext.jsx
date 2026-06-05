import { jwtDecode } from "jwt-decode";
import { createContext, useEffect, useState, useContext } from "react";
import { uiContext } from "./UiContext";
import urls from "../customHooks/ServerUrls";

export const authContext = createContext();

const AuthContextProvider = ({ children }) => {
    const Aborter = new AbortController();
    const [currentUser, setCurrentUser] = useState(null); // object to hold current user info
    const [currentSchool, setCurrentSchool] = useState(null); // for future use
    const [userRole, setUserRole] = useState('director');
    const {
        setError,
        setPageLoading,
        setSelectedSchool,
        setStudents,                    // students data
        setTeachers,                 // teachers data
        setStaffs,                     // staff data
        setSections,                   // sections data
        setClassRooms,                   // classRooms data
        setSubjects,                   // subjects data
        setTemplates,// school templates 
        setFinances,// finances data
        setSchoolFees,// schoolFees data
        setPromotionLogs,
        setActivities,
        setPermissions,
        setRoles
    } = useContext(uiContext);

    const [isAuthenticated, setIsAuthenticated] = useState(
        localStorage.getItem("a_token") ? true : false
    );

    const currentUserFullname = () => {
        return `${currentUser?.title} ${currentUser?.first_name} ${currentUser?.last_name} ${currentUser?.middle_name}`
    }

    const getCurrentUser = async () => {
        let token = await getToken()
        if (!token) {
            return setError(' User Disconnect Try again later')
        }
        fetch(`${urls.BASE_URL}/authuser/current-user/`, {
            signal: Aborter.signal,
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`
            }
        }).then((resp) => {
            if (resp.ok) {
                return resp.json();
            }
            throw Error("failed to fetch user")
        }).then((data) => {
            console.log('currentUSer: ', data);
            if (!data.error) {
                setCurrentUser(data);
                setIsAuthenticated(true);
            } else {
                setError(data.error)
            }
        })
            .catch((err) => {
                setError(err.message);
            })

        return (() => { Aborter.abort() })
    }

    const refreshToken = () => {
        console.log('refreshing token.....');
        const RToken = localStorage.getItem('r_token');
        if (RToken && isAuthenticated) {
            return (
                fetch(`${urls.BASE_URL}/authuser/api/token/refresh/`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ "refresh": RToken })
                })
                    .then((resp) => { return resp.json() })
                    .then((data) => {
                        if (data?.access) {
                            localStorage.setItem('a_token', data?.access);
                            // console.log('token refreshed done ');
                            return Promise.resolve(data);
                        } else {
                            return Promise.reject(null);
                        }
                    })
            )
        }
        else {
            // log user out 
            setIsAuthenticated(false);
            localStorage.removeItem('a_token');
            localStorage.removeItem('r_token');
            return Promise.reject("your logged out ")
        }
    }

    const getToken = async () => { // use this function to get valid access token for protected routes
        try {
            const token = localStorage.getItem("a_token");
            if (token) {
                const decoded = jwtDecode(token);
                // Check if token is expired 
                if (decoded.exp < Math.floor(Date.now() / 1000)) {
                    // Obtain a new token
                    const newToken = await refreshToken();   // this is async funtion 

                    if (newToken?.access) {
                        // console.log('go ahead new token has arrived ');
                        return Promise.resolve(newToken.access); // Return new token
                    } else {
                        console.error("Failed  to refresh in getAccess ");
                        return Promise.reject(null); // Return null if refreshing failed
                    }
                }
                // Return the existing valid token
                return Promise.resolve(token);
            }
            // Return null if token is not present or not authenticated
            return Promise.reject(null);
        } catch (error) {
            console.error("Error in getToken:", error);
            return Promise.reject(null); // Return null in case of an error
        }
    };

    const setSchoolData = (data) => {
        console.log('setSchoolData: ', data);

        setSelectedSchool(data?.school_and_academics || []);
        setSections(data?.school_and_academics?.sections || []);
        setSubjects(data?.school_and_academics?.subjects || []);
        setClassRooms(data?.school_and_academics?.classrooms || []);

        setStudents(data?.school_students || []);
        setTeachers(data?.school_teachers || []);
        setStaffs(data?.school_staffs || []);

        setTemplates(data?.templates || []);
        setFinances(data?.finance || []);
        setSchoolFees(data?.class_fee_settings || []);
        setPromotionLogs(data?.promotion_logs || [])
        setPermissions(data?.school_permissions || [])
        setRoles(data?.school_roles || [])

        setActivities(data?.activity_logs || [])
    }


    return (
        <authContext.Provider value={{
            currentUser, setCurrentUser, currentUserFullname, userRole, setUserRole,
            currentSchool, setCurrentSchool,
            getCurrentUser, getToken, isAuthenticated, setIsAuthenticated, setSchoolData
        }} >
            {children}
        </authContext.Provider>
    );
}

export default AuthContextProvider;