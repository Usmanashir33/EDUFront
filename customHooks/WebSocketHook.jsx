import { useContext, useEffect, useRef } from 'react';
import { uiContext } from '../customContexts/UiContext';
import urls from './ServerUrls';
import { authContext } from '@/customContexts/AuthContext';

const useWebSocketHook = () => {
  // useRef to hold the WebSocket instance
  const schoolSocketRef = useRef(null);
  const appSocketRef = useRef(null);
  const { selectedSchool, } = useContext(uiContext);
  const { currentUser, getToken } = useContext(authContext)

  const connectSchoolSocket = async (s) => {
    // Initialize the WebSocket connection and assign it to schoolSocketRef.current
    if (selectedSchool?.id) {
      schoolSocketRef.current = new WebSocket(`${urls.WS_URL}/live-server/${selectedSchool?.id}/`,);
      schoolSocketRef.current.binaryType = 'arraybuffer'; // to handle media data as binary array

      schoolSocketRef.current.onopen = () => {
        console.log('School Socket connection opened');
      };

      schoolSocketRef.current.onclose = () => {
        console.log('School Socket connection closed');
      };

      schoolSocketRef.current.onerror = (error) => {
        console.log(`School Socket error:${error.message}`);
      };
    }
  }
  const connectAppSecket = async () => {
    // Initialize the WebSocket connection and assign it to appSocketRef.current
    const token = await getToken()
    if (token) {
      appSocketRef.current = new WebSocket(`${urls.WS_URL}/live-server/?token=${token}`,);
      appSocketRef.current.binaryType = 'arraybuffer'; // to handle media data as binary array

      appSocketRef.current.onopen = () => {
        console.log('appSocket connection opened');
      };

      appSocketRef.current.onclose = () => {
        console.log('appSocket connection closed');
      };

      appSocketRef.current.onerror = (error) => {
        console.log(`appSocket error:${error.message}`);
      };
    }
  }


  // if (schoolSocketRef.current) {
  //   schoolSocketRef.current.onmessage = async (e) => {
  //     let data = JSON.parse(e.data)
  //     console.log('data: ', data);
  //     if (data?.signal_name === 'money_trx') {
  //       return;
  //     }
  //   }
  // }

  //   const sendMessage = (message,file,filename) => {
  //     // Use schoolSocketRef.current to send a message if the connection is open
  //     if (schoolSocketRef.current && schoolSocketRef.current.readyState === WebSocket.OPEN) {
  //       const JsonData = JSON.stringify(message)
  //       const completeFile = JSON.stringify({
  //         status:"sent",
  //         withFile : false,
  //         filename:filename
  //       });
  //       console.log('JsonData: ', JsonData);
  //       schoolSocketRef.current.send(JsonData);
  //       if (file){
  //         schoolSocketRef.current.send(file);
  //         console.log('file: ', file);
  //         schoolSocketRef.current.send(completeFile);
  //       }
  //     } else {
  //       console.log('WebSocket is not open. ReadyState:', schoolSocketRef.current ? schoolSocketRef.current.readyState : 'N/A');
  //     }
  //   };

  //   const readUnreads = (() => {
  //     if (schoolSocketRef.current && schoolSocketRef.current.readyState === WebSocket.OPEN){
  //       const info = {
  //         status : "unreadMessages",
  //         user_from : frd_id
  //       }
  //       const JsonInfo = JSON.stringify(info)
  //       schoolSocketRef.current.send(JsonInfo);
  //     } else {
  //       console.log('WebSocket failed read unread messages. ReadyState:', schoolSocketRef.current ? schoolSocketRef.current.readyState : 'N/A');
  //     }
  //   });

  return { schoolSocketRef, appSocketRef, connectSchoolSocket, connectAppSecket };
}

export default useWebSocketHook;
