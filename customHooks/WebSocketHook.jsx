import { useContext, useEffect, useRef, useState } from 'react';
import { authContext } from '../customContexts/AuthContext';
import { uiContext } from '../customContexts/UiContext';
import config from './ServerUrls';

const  useWebSocketHook = () => {
    // useRef to hold the WebSocket instance
    const webSocketRef = useRef(null);
    const {setError} = useContext(uiContext) ;
    const {getToken} = useContext(authContext) ;
    

    const connectSecket = async () => {
        // Initialize the WebSocket connection and assign it to webSocketRef.current
        const token = await getToken()
        if (token) {
            webSocketRef.current = new WebSocket(`${config.WS_URL}/live-server/?token=${token}`,);
            webSocketRef.current.binaryType = 'arraybuffer'; // to handle media data as binary array
    
            webSocketRef.current.onopen = () => {
              console.log('WebSocket connection opened');
            //   readUnreads();
            };
    
            webSocketRef.current.onclose = () => {
              console.log('WebSocket connection closed');
            };
    
            webSocketRef.current.onerror = (error) => {
              console.log(`WebSocket error:${error.message}`);
            };
        }
    }

    useEffect(() => {
        connectSecket()
        // when the file demounted 
        return () => {
            if (webSocketRef.current) {
                // webSocketRef.current.close();
            }}
    },[]); // Empty dependency array means this effect runs only once


  if (webSocketRef.current) {
    webSocketRef.current.onmessage = async (e) => {
        let data = JSON.parse(e.data)
        if (data?.signal_name === 'money_trx'){
          return ;
        }
        if (data?.signal_name === 'money_notif'){
          return ;
        }
        if (data?.signal_name === 'approval_request'){
          return ;
        }
        
    }
  }

//   const sendMessage = (message,file,filename) => {
//     // Use webSocketRef.current to send a message if the connection is open
//     if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {
//       const JsonData = JSON.stringify(message)
//       const completeFile = JSON.stringify({
//         status:"sent",
//         withFile : false,
//         filename:filename
//       });
//       console.log('JsonData: ', JsonData);
//       webSocketRef.current.send(JsonData);
//       if (file){
//         webSocketRef.current.send(file);
//         console.log('file: ', file);
//         webSocketRef.current.send(completeFile);
//       }
//     } else {
//       console.log('WebSocket is not open. ReadyState:', webSocketRef.current ? webSocketRef.current.readyState : 'N/A');
//     }
//   };

//   const readUnreads = (() => {
//     if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN){
//       const info = {
//         status : "unreadMessages",
//         user_from : frd_id
//       }
//       const JsonInfo = JSON.stringify(info)
//       webSocketRef.current.send(JsonInfo);
//     } else {
//       console.log('WebSocket failed read unread messages. ReadyState:', webSocketRef.current ? webSocketRef.current.readyState : 'N/A');
//     }
//   });

  return {};
}

export default useWebSocketHook;
