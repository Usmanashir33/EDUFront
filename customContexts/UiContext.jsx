import { createContext, useEffect, useRef, useState } from "react";
// import defaultSound from "../assets/sounds/defaultSound.mp3";
import { ViewState, } from '../types';

    
    
export const uiContext = createContext();

const UiContextProvider = ({children}) => {
    const [selectedSchool, setSelectedSchool] = useState(null) ;
    const [isLoading,setIsLoading] = useState(false) ;
    const [pageLoading,setPageLoading] = useState(false) ;
    const [currentView, setCurrentView] = useState(
        // make it check local storage first
        localStorage.getItem('session') ? ViewState.DASHBOARD :ViewState.LOGIN
    );
    const [toast, setToast] = useState(null); // we must use {message:'', type:''}); or null
    const [students,setStudents] = useState([])
    // { id: '1', firstName: 'Emily', lastName: 'Clarke', middleName: 'Rose', email: 'emily@edu.com', gender: 'Female', status: 'Active', admissionNumber: 'ADM-001', joinedAt: '2024-01-15T10:00:00Z', classRoomIds: ['c1'], picture: '', nin: '', guardian: { fullName: 'Mrs. Sarah Clarke', relationship: 'Mother', phone: '08012345678', email: 'sarah.c@gmail.com', address: '42 Pine Avenue, Springfield', altPhone: '08099991111' }, academicHistory: [] },
    const [teachers, setTeachers] = useState([
          { id: 't1', firstName: 'Robert', lastName: 'Langdon', email: 'rob@edu.com', phone: '000-111', gender: 'Male', title: 'Prof.', staffId: 'STAFF-001', sectionIds: ['sec2'], joinedAt: '2023-09-01', picture: '', nin: '', salary: '120000', status: 'Active', paymentHistory: [{ id: 'p1', date: '2023-10-25', amount: '120000', status: 'Paid', month: 'October', transactionRef: 'TXN-001' }] }
    ]);
    
    const [staffs, setStaffs] = useState([
        { id: 's1', firstName: 'John', lastName: 'Smith', email: 'john.smith@school.edu', phone: '08011122233', role: 'Security Head', department: 'Security', gender: 'Male', staffId: 'STF-001', status: 'Active', joinedAt: '2023-01-15', salary: '85000', address: '12 Guard Post', picture: '', nin: '' }
    ]);
    const [sections, setSections] = useState([{ id: 'sec1', name: 'Junior Secondary' }, { id: 'sec2', name: 'Senior Secondary' }]);
    const [classRooms, setClassRooms] = useState([{ id: 'c1', name: 'JSS 1 A', sectionId: 'sec1' }, { id: 'c2', name: 'JSS 1 B', sectionId: 'sec1' }, { id: 'c3', name: 'SSS 1 Science', sectionId: 'sec2' }]);
    const [subjects, setSubjects] = useState([{ id: 'sub1', name: 'General Math', code: 'MTH101', classRoomIds: ['c1', 'c2'], teacherIds: ['t1'] }, { id: 'sub2', name: 'Physics', code: 'PHY101', classRoomIds: ['c3'], teacherIds: [] }, { id: 'sub3', name: 'English Lang', code: 'ENG101', classRoomIds: ['c1', 'c2', 'c3'], teacherIds: ['t1'] }]);
    const playSound = (alert='defaultSound') => {
        let sound = new Audio(alert)
        sound.play()
    }
    function dataURLtoFile(dataurl, filename) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1]; // "image/jpeg"
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);

        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }

        return new File([u8arr], filename, { type: mime });
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
        formatNaira,greetUser,copyToClipboard,readNotifi,playSound,getFormattedDate,dataURLtoFile,
        isLoading,setIsLoading,     pageLoading,setPageLoading,    toast,setToast,   currentView, setCurrentView,
        selectedSchool, setSelectedSchool,
        students,setStudents, // students data
        teachers, setTeachers ,// teachers data
        staffs, setStaffs, // staff data
        sections, setSections, // sections data
        classRooms, setClassRooms, // classRooms data
        subjects, setSubjects, // subjects data

    }}>
        {children}
    </uiContext.Provider> 
    );
}
 
export default UiContextProvider; 