import { useContext, useEffect, useState } from "react";
import { authContext } from "../customContexts/AuthContext";
// import { Navigate } from "react-router-dom";
import { uiContext } from "@/customContexts/UiContext";
import { ViewState } from '../types';



const ProtectedRoute = ({children}) => {
    const {isAuthenticated,} = useContext(authContext); 
    const [allow,setAllow] = useState(true); 
    const {setCurrentView,setToast } = useContext(uiContext)


    const allow_access =  () => { // base on the availability of users accesstokens 
        let token = localStorage.getItem('a_token') 
        if (isAuthenticated && token ){
            setAllow(true)
        }else{ 
            setAllow(false);
        }
    }
    const REDIRECT = () => { // only when user is authenticated 
        setCurrentView(ViewState.SELECT_SCHOOL)
        setToast({message: 'Login Required!', type: 'error'});
    }
    useEffect(() => {
        // allow_access()
    },[isAuthenticated])
    return allow? children :REDIRECT;
}
 
export default ProtectedRoute;