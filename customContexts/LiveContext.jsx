import { createContext, useContext, useEffect, useRef, useState } from "react";
import useWebSocketHook from "../customHooks/WebSocketHook";
import { uiContext } from "./UiContext";

export const liveContext = createContext();

const LiveContextProvider = ({ children }) => {
    const { schoolSocketRef, appSocketRef, connectSchoolSocket, connectAppSecket } = useWebSocketHook();
    const { selectedSchool,
        pendingPayments,
        setPendingPayments,
        setPromotionLogs,
        setActivities,
        setReportsRecord

    } = useContext(uiContext);
    useEffect(() => {
        if (appSocketRef.current) {
            appSocketRef.current.onmessage = async (e) => {
                let data = JSON.parse(e.data)
                if (data?.newPendingPayment) {
                    let newData = data?.newPendingPayment;
                    let updated = pendingPayments.filter(p => p?.id != newData.id)
                    setPendingPayments([data?.newPendingPayment, ...updated])
                    return;
                }
                if (data?.activity_log) {
                    setActivities((prev) => [data?.activity_log, ...prev])
                    return;
                }
            }
        }
    }, [appSocketRef.current])

    useEffect(() => {
        if (schoolSocketRef.current) {
            schoolSocketRef.current.onmessage = async (e) => {
                let res = JSON.parse(e.data);
                // console.log('res: ', res);
                if (res?.promotion_log) {
                    setPromotionLogs((prev) => {
                        const newLog = res.promotion_log;
                        const exists = prev.some(log => log.id === newLog.id);
                        if (exists) {
                            return prev.map(log =>
                                log.id === newLog.id ? newLog : log
                            );
                        }
                        return [newLog, ...prev];
                    });
                    return;
                }
                if (res?.report_record) {
                    setReportsRecord((prev) => {
                        const newLog = res.report_record;
                        const exists = prev.some(log => log.id === newLog.id);
                        if (exists) {
                            return prev.map(log =>
                                log.id === newLog.id ? newLog : log
                            );
                        }
                        return [newLog, ...prev];
                    });
                    return;
                }
            }
        }
    }, [schoolSocketRef.current])

    useEffect(() => {
        if (selectedSchool?.id) {
            connectSchoolSocket();
            connectAppSecket();
        }
        return () => {
            if (schoolSocketRef.current) {
                schoolSocketRef.current.close();
            }
            if (appSocketRef.current) {
                appSocketRef.current.close();
            }
        }

    }, [selectedSchool])

    return (
        <liveContext.Provider value={{
            schoolSocketRef, appSocketRef
        }}>
            {children}
        </liveContext.Provider>
    );
}

export default LiveContextProvider;