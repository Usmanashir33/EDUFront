import { jwtDecode } from "jwt-decode" ;
import { createContext, useEffect, useState,useContext } from "react" ;
import { uiContext } from "./UiContext" ;
import urls from "../customHooks/ServerUrls" ;

export const authContext = createContext() ;
 
const AuthContextProvider = ({children} ) => {  
    const Aborter = new AbortController() ;
    const [currentUser,setCurrentUser] = useState(null) ; // object to hold current user info
    const [currentSchool,setCurrentSchool] = useState(null); // for future use
    const {setError,setIsLoading} = useContext(uiContext) ;
    
    const [isAuthenticated,setIsAuthenticated] = useState(
        localStorage.getItem("a_token")? true : false
    );

    useEffect(() => {
        // if the currrent user fetch failed so we need to trigger it here 
        if (isAuthenticated && !currentUser?.value){ // 
            // getCurrentUser() ;
        }
    },[isAuthenticated])

    const  getCurrentUser = async () => {
        let token = await getToken()
        if (!token) {
            return setError(' User Disconnect Try again later')
        }
        fetch(`${urls.BASE_URL}/authuser/current-user/`,{
            signal : Aborter.signal ,
            method : "GET",
            headers : {
                Authorization : `Bearer ${token}`
            }
        }).then ((resp) => {
            if (resp.ok){
                return resp.json();
            }
            throw Error("failed to fetch user")
        }).then((data) => {
            console.log('currentUSer: ', data);
            if (!data.error){
                setCurrentUser(data);
                setIsAuthenticated(true);
            }else{
                setError(data.error)
            }
        })
        .catch((err) => {
            setError(err.message);
        })

        return (() => {Aborter.abort()})
    }
    const refreshToken = () => {
        console.log('refreshing token.....');
        const RToken = localStorage.getItem('r_token');
        if (RToken && isAuthenticated){
             return(
                fetch(`${urls.BASE_URL}/authuser/api/token/refresh/`,{
                method:"POST",
                headers:{ "Content-Type":"application/json" },
                body : JSON.stringify({"refresh":RToken})
            })
            .then((resp) => {return resp.json()})
            .then((data) => {
                if (data?.access){
                    localStorage.setItem('a_token',data?.access);
                    // console.log('token refreshed done ');
                    return Promise.resolve(data) ;
                }else{
                    return Promise.reject(null) ;
                }
            })
        )}
        else{
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
            if ( token ) {
                const decoded = jwtDecode(token);
                // Check if token is expired 
                if (decoded.exp < Math.floor(Date.now() / 1000)) {
                    // Obtain a new token
                    // console.log('expired refresh starts');
                    const newToken =  await refreshToken();   // this is async funtion 

                    if (newToken?.access) {
                        // console.log('go ahead new token has arrived ');
                        return Promise.resolve(newToken.access); // Return new token
                    } else {
                        console.error("Failed  to refresh in getAccess ");
                        return Promise.reject(null); // Return null if refreshing failed
                    }
                }
                // Return the existing valid token
                return Promise.resolve( token);
            }
            // Return null if token is not present or not authenticated
            return Promise.reject(null);
        } catch (error) {
            console.error("Error in getToken:", error);
            return Promise.reject(null); // Return null in case of an error
        }
    };

    const logout = () => {
        setIsLoading(true);
        setTimeout(() => {
            localStorage.removeItem('a_token');
            localStorage.removeItem('r_token');
            setIsAuthenticated(false);
            setCurrentUser({});
            setIsLoading(false);
        }, 700);
    }
   
    return ( 
        <authContext.Provider value={{
            currentUser,setCurrentUser,getCurrentUser,getToken,
            isAuthenticated,setIsAuthenticated,logout ,
        }} >
            {children}
        </authContext.Provider>
     );
}
 
export default AuthContextProvider  ;