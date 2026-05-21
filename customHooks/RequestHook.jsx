import { useContext, useEffect, useState } from "react";
import { uiContext } from "../customContexts/UiContext";
import urls from "./ServerUrls";
import { authContext } from "@/customContexts/AuthContext";


const useRequest = () => {
    const Aborter = new AbortController();
    // const {getToken,isAuthenticated} = useContext(authContext) ;
    const { isAuthenticated, getToken } = useContext(authContext);
    const { setIsLoading } = useContext(uiContext);
    const { toast, setToast } = useContext(uiContext);

    const sendRequest = async (url, method, formdata = "", triggeredFunc, load = false, is_formData = false) => {
        if (!isAuthenticated) { return }
        if (load) {
            setIsLoading(true);
        }
        let token = await getToken()
        if (!token) {
            return setToast({ message: "Log out and login again", type: 'error' });
        }
        let options = {
            signal: Aborter.signal,
            method: method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        }
        if (method !== "GET" && method !== "DELETE") {
            if (!is_formData) { options.body = JSON.stringify(formdata) }
            if (is_formData) {
                options.headers = { Authorization: `Bearer ${token}` };
                options.body = formdata
            }
        }
        setTimeout(() => {
            fetch(`${urls.BASE_URL}${url}`, options
            ).then((resp) => {
                if (resp.ok) {
                    return resp.json();
                } else {
                    throw new Error(`Request failed with status ${resp.status}`);
                }
            })
                .then((data) => {
                    setIsLoading(false);
                    if (data?.error) {
                        // chek the format error 
                        let msg = typeof data?.error === 'string' ? data.error :
                            Object.entries(data?.error).map(([field, message]) => {
                                return `${field} error: ${message}`;
                            }).join(' ');
                        return setToast({ message: msg, type: 'error' });
                    }
                    triggeredFunc(data)
                }).catch((err) => {
                    //    show error here 
                    setToast({ message: err.message, type: 'error' });
                    setIsLoading(false);
                })
                .finally(() => {
                })
        }, 100);
        return (() => { Aborter.abort() })
    }
    const sendFileRequest = async (url, method, formdata = "", triggeredFunc, fileName, load = false, is_formData = false) => {
        if (!isAuthenticated) { return }
        if (load) {
            setIsLoading(true);
        }
        let token = await getToken()
        if (!token) {
            return setToast({ message: "Log out and login again", type: 'error' });
        }
        let options = {
            signal: Aborter.signal,
            method: method,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        }
        if (method !== "GET" && method !== "DELETE") {
            if (!is_formData) { options.body = JSON.stringify(formdata) }
            if (is_formData) {
                options.headers = { Authorization: `Bearer ${token}` };
                options.body = formdata
            }
        }
        setTimeout(() => {
            fetch(`${urls.BASE_URL}${url}`, options
            ).then(async (resp) => {
                if (!resp.ok) {
                    throw new Error("Failed to download template");
                }
                triggeredFunc(resp, fileName);// send the response to the function to handle the file download
                setIsLoading(false);
                setToast({ message: "Template downloaded successfully", type: 'success' });

            }).catch((err) => {
                //    show error here 
                setToast({ message: err.message, type: 'error' });
                setIsLoading(false);
            })
                .finally(() => {
                })
        }, 500);
        return (() => { Aborter.abort() })
    }

    const sendAuthRequest = async (url, method, formdata = "", triggeredFunc, load = false, is_formData = false) => {
        // console.log('formdata: ', formdata); 
        if (load) {
            setIsLoading(true);
        }
        let options = {
            signal: Aborter.signal,
            method: method,
            headers: {}
        }
        if (method !== "GET" && method !== "DELETE") {
            if (!is_formData) {
                options.body = JSON.stringify(formdata)
                options.headers = {
                    "Content-Type": " application/json ",
                }
            }
            else {
                options.body = formdata
            }
        }
        setTimeout(() => {
            fetch(`${urls.BASE_URL}${url}`, options
            ).then((resp) => {
                if (resp.ok) {
                    return resp.json();
                }
                setIsLoading(false);
            })
                .then((data) => {
                    if (data?.error) {
                        console.log('data?.error: ', data?.error);
                        return setToast({ message: data?.error, type: 'error' });
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
        return (() => { Aborter.abort() })
    }

    return ({ sendRequest, sendAuthRequest, sendFileRequest });
}

export default useRequest;