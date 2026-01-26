import { createContext, useContext, useEffect, useRef, useState } from "react";
import useWebSocketHook from "../customHooks/WebSocketHook";
import { authContext } from "./AuthContext";
import { uiContext } from "./UiContext";
import useRequest from "../customHooks/RequestHook";

export const liveContext = createContext();

const LiveContextProvider = ({children}) => {
    return ( 
        <liveContext.Provider value={{
            
            
        }}>
            {children}
        </liveContext.Provider> 
    );
}
 
export default LiveContextProvider;