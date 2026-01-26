import { createContext, useEffect, useRef, useState } from "react";
// import defaultSound from "../assets/sounds/defaultSound.mp3";
import { ViewState, } from '../types';

    
    
export const uiContext = createContext();

const UiContextProvider = ({children}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(!false) ;
    const [isLoading,setIsLoading] = useState(false) ;
    const [pageLoading,setPageLoading] = useState(false) ;
    const [currentView, setCurrentView] = useState(
        // make it check local storage first
        localStorage.getItem('session') ? ViewState.DASHBOARD :ViewState.LOGIN
    );
    
    const [toast, setToast] = useState(null); // we must use {message:'', type:''}); or null
    const sideBarRef = useRef();

    const playSound = (alert='defaultSound') => {
        let sound = new Audio(alert)
        sound.play()
    }
   
    const getFormattedDate = (rawDate) => {
        const date = new Date(rawDate);
        if (isNaN(date.getTime())) return null;
      
        const options = { hour: '2-digit', minute: '2-digit', hour12: true };
      
        let string = `${date.getDate()}-${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()} at ${date.toLocaleTimeString('en-US', options)}`
   
        return string;}

    const formatNaira  = (amount) =>   {
        const dig = Number(amount).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return "₦" + dig
    }
    const readNotifi =(unreads) => {
     if ( unreads > 99 ){
      return "99+"
     }
     return  unreads ;
  }
    
    const  greetUser = () =>  {
        const hour = new Date().getHours();
        let greeting;
        if (hour < 12) {
            greeting = "Good morning";
        } else if (hour < 18) {
            greeting = "Good afternoon";
        } else {
            greeting = "Good evening";
        }
        return `${greeting}!`;
        }

    const copyToClipboard = (text,message) => {
        navigator.clipboard.writeText(text);
        setSuccess(message);
    };

    return ( 

    <uiContext.Provider value={{
        isLoading,setIsLoading,pageLoading,setPageLoading,toast,setToast,
        sideBarRef,isSidebarOpen, setIsSidebarOpen ,getFormattedDate,
        formatNaira,greetUser,copyToClipboard,readNotifi,playSound,
        currentView, setCurrentView
    }}>
        {children}
    </uiContext.Provider> 
    );
}
 
export default UiContextProvider; 