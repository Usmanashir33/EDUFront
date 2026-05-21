import { createContext, useEffect, useRef, useState } from "react";
// import defaultSound from "../assets/sounds/defaultSound.mp3";
import { ViewState, } from '../types';

export const uiContext = createContext();

const UiContextProvider = ({ children }) => {
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(false);
    const [currentView, setCurrentView] = useState(
        // make it check local storage first
        localStorage.getItem('session') ? ViewState.DASHBOARD : ViewState.LOGIN
    );
    const [toast, setToast] = useState(null); //  we must use { messag, type:''}); or null
    const [students, setStudents] = useState([])
    const [finances, setFinances] = useState([])
    const [schoolFees, setSchoolFees] = useState([])
    const [pendingPayments, setPendingPayments] = useState([]);
    const [promotionLogs, setPromotionLogs] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [roles, setRoles] = useState([]);

    const [templates, setTemplates] = useState([])
    const [teachers, setTeachers] = useState([]);
    const [staffs, setStaffs] = useState([]);

    const [sections, setSections] = useState([]);
    const [classRooms, setClassRooms] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [activities, setActivities] = useState([]);
    const playSound = (alert = 'defaultSound') => {
        let sound = new Audio(alert)
        sound.play()
    }
    function dataURLtoFile(dataUrl, filename) {
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) {
            throw new Error('Invalid data URL');
        }

        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
    }

    const findSessionById = (sessionId) => {
        if (!selectedSchool?.sessions.length) return;
        let s = selectedSchool?.sessions.find((t) => t.id === sessionId);
        return s;

    }
    const findTermById = (termId) => {
        if (!selectedSchool?.terms.length) return;
        let s = selectedSchool?.terms.find((t) => t.id === termId);
        return s;

    }
    const getFormattedDate = (rawDate) => {
        const date = new Date(rawDate);
        if (isNaN(date.getTime())) return null;

        const options = { hour: '2-digit', minute: '2-digit', hour12: true };

        let string = `${date.getDate()}-${date.toLocaleString('en-US', { month: 'short' })}-${date.getFullYear()} at ${date.toLocaleTimeString('en-US', options)}`

        return string;
    }

    const formatNaira = (amount) => {
        const dig = Number(amount).toLocaleString('en-NG', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return "₦" + dig
    }
    const readNotifi = (unreads) => {
        if (unreads > 99) {
            return "99+"
        }
        return unreads;
    }

    const greetUser = () => {
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

    const copyToClipboard = (text, message) => {
        navigator.clipboard.writeText(text);
        setSuccess(message);
    };

    return (

        <uiContext.Provider value={{
            formatNaira, greetUser, copyToClipboard, readNotifi, playSound, getFormattedDate, dataURLtoFile,
            isLoading, setIsLoading, pageLoading, setPageLoading, toast, setToast, currentView, setCurrentView,
            findSessionById,
            findTermById,
            selectedSchool, setSelectedSchool,
            students, setStudents, // students data
            teachers, setTeachers,// teachers data
            staffs, setStaffs, // staff data
            sections, setSections, // sections data
            classRooms, setClassRooms, // classRooms data
            subjects, setSubjects, // subjects data
            templates, setTemplates,// templates data
            finances, setFinances,// finances data
            schoolFees, setSchoolFees,// schoolFees data
            pendingPayments, setPendingPayments,// all payments 
            promotionLogs, setPromotionLogs,
            activities, setActivities,
            permissions, setPermissions,
            roles, setRoles

        }}>
            {children}
        </uiContext.Provider >
    );
}

export default UiContextProvider; 