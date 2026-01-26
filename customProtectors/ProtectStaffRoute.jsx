import { useContext, useEffect, useState } from "react";
// import { jwtDecode } from "jwt-decode";
import { authContext } from "../customContexts/AuthContext";
import { Navigate } from "react-router-dom";

const ProtectStaff = ({children}) => {
    const {currentUser} = useContext(authContext) ;
    const {is_staff} = currentUser ;
    const [allow,setAllow] = useState(true) ; 

    useEffect(() => {
        if (is_staff == false){
            setAllow(false);
        }
    },[is_staff])
     
    return allow? children : <Navigate to='/dashbord/' replace/>;
}
 
export default ProtectStaff;