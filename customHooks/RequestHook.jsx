import { useContext, useEffect, useState } from "react";
import { uiContext } from "../customContexts/UiContext";
import { authContext } from "../customContexts/AuthContext"; 
import urls from "./ServerUrls";


const useRequest = ( ) => {
    const Aborter = new AbortController();
    const {getToken,isAuthenticated} = useContext(authContext) ;
    const {setIsLoading} = useContext(uiContext);
    const {toast, setToast} = useContext(uiContext);

    const sendRequest = async (url,method,formdata="", triggeredFunc,load =false, is_formData=false) => {
        if (!isAuthenticated){return}
        if (load){
            setIsLoading(true);
        }
        let token = await getToken()
        if (!token) {
            return setToast({message: "Try again later", type: 'error'});
        }
        let options = {
            signal : Aborter.signal ,
            method:method,
            headers : {
                "Content-Type":"application/json",
                Authorization : `Bearer ${token}`
            }}
        if (method !== "GET" &&  method !== "DELETE"){
            if (!is_formData){options.body = JSON.stringify(formdata)}
            if (is_formData){
                options.headers = {Authorization : `Bearer ${token}`};
                options.body = formdata
            }
         }
        setTimeout(() => {
            fetch(`${urls.BASE_URL}${url}`,options
        ).then((resp) => {
                if (resp.ok){
                    return resp.json();
                }
                setIsLoading(false);
            })
            .then((data) => {
                if (data?.error){
                    return setToast({message: data?.error, type: 'error'});
                }
                triggeredFunc(data)
                setIsLoading(false);
            }).catch((err) => {
                 //    show error here 
                setIsLoading(false);
                setToast({message: err.message, type: 'error'});
            })
            .finally(() => {
                setTimeout(() => {
                    setIsLoading(false)
                }, 1000);
            })
            }, 500);
            return (() => {Aborter.abort()})
    }

    const sendAuthRequest = async (url,method,formdata="", triggeredFunc,load =false, is_formData=false) => {
        // console.log('formdata: ', formdata); 
        if (load){
            setIsLoading(true);
        }
        let options = {
            signal : Aborter.signal ,
            method:method,
            headers : {} 
        }
        if (method !== "GET" &&  method !== "DELETE"){ 
            if (!is_formData){
                options.body = JSON.stringify(formdata)
                options.headers = {
                "Content-Type":" application/json ",
            }
            }
             else {
                options.body = formdata
            }
        }
        setTimeout(() => {
            fetch(`${urls.BASE_URL}${url}`,options
        ).then((resp) => {
                if (resp.ok){
                    return resp.json();
                }
                setIsLoading(false);
            })
            .then((data) => {
                if (data?.error){
                    console.log('data?.error: ', data?.error);
                    return setToast({message: data?.error, type: 'error'}); 
                } 
                triggeredFunc(data)
                setIsLoading(false);
            }).catch((err) => {
                 //    show error here 
                setIsLoading(false);
                console.log(err.message)
            })
            .finally(() => {
                setTimeout(() => {
                    setIsLoading(false)
                }, 1000);
            })
            }, 500);
            return (() => {Aborter.abort()})
    }
    return ({sendRequest,sendAuthRequest});
}
 
export default useRequest;