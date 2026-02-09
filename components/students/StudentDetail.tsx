
import React, { useState, useEffect, useRef ,useContext } from 'react';
import { Student, ClassRoom, Subject, AcademicRecord } from '../../types';
import { Input, Button, FadeIn, MultiSelectDropdown, PinModal, Toast, ImageUpload, ImageViewer } from '../UI';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import urls from '@/customHooks/ServerUrls';
import { authContext } from '@/customContexts/AuthContext';


interface StudentDetailProps {
  id : string;
  setViewMode?: () => void;
}

type ViewMode = 'LIST' | 'DETAIL' | 'ADD' | 'EDIT';
type DetailTab = 'OVERVIEW' | 'ACADEMIC' | 'GUARDIAN' | 'ADMIN';
type TermViewTab = 'REPORT' | 'ANALYSIS' | 'RECORDS';

// --- MOCK DATA GENERATORS FOR REPORT CARD ---
const generateMockReportData = (student: any, className: string, session: string, term: string, subjects: Subject[]) => {
    // Deterministic random based on student ID and term
    const seed = (student.id.charCodeAt(0) + term.length);
    
    return {
        studentDetails: {
            name: `${student.first_name} ${student.middle_name || ''} ${student.last_name}`,
            admissionNo: student.admission_number,
            class: className,
            session: session,
            term: term,
            gender: student.gender,
            dob: student.dateOfBirth,
            attendance: { present: 112 + (seed % 10), total: 120 }
        },
        academics: subjects.map(sub => {
            const ca = 20 + (Math.floor(Math.random() * 20)); // 20-40
            const exam = 30 + (Math.floor(Math.random() * 30)); // 30-60
            const total = ca + exam;
            // Mock Class Average for analysis
            const classAvg = total - 5 + (seed % 10);
            
            let grade = 'F';
            let remark = 'Fail';
            if (total >= 75) { grade = 'A'; remark = 'Excellent'; }
            else if (total >= 65) { grade = 'B'; remark = 'Very Good'; }
            else if (total >= 50) { grade = 'C'; remark = 'Credit'; }
            else if (total >= 40) { grade = 'D'; remark = 'Pass'; }
            
            return { subject: sub.name, ca, exam, total, grade, remark, classAvg };
        }),
        affective: [
            { trait: 'Punctuality', rating: 4 },
            { trait: 'Neatness', rating: 5 },
            { trait: 'Politeness', rating: 5 },
            { trait: 'Honesty', rating: 4 },
            { trait: 'Leadership', rating: 3 },
            { trait: 'Attentiveness', rating: 4 }
        ],
        psychomotor: [
            { skill: 'Sports', rating: 4 },
            { skill: 'Handwriting', rating: 5 },
            { skill: 'Verbal Fluency', rating: 4 },
            { skill: 'Creativity', rating: 3 }
        ],
        remarks: {
            teacher: "A disciplined and focused student. Shows great promise in sciences.",
            principal: "Result is satisfactory. Promoted to the next class."
        },
        // Extra records for the "Records" tab
        termRecords: {
            fees: { status: 'Paid', amount: '150,000', date: '2023-09-15' },
            incidents: [
                { date: '2023-10-10', title: 'Late to Assembly', description: 'Arrived 15 mins late.' },
                { date: '2023-11-05', title: 'Forgot Homework', description: 'Math assignment not submitted.' }
            ],
            activities: ['Science Club', 'Debate Team']
        }
    };
};
  // --- DETAIL VIEW ---
export const StudentDetail: React.FC<StudentDetailProps> = ({ id ,setViewMode}) => {
    const [activeTab, setActiveTab] = useState<DetailTab>('OVERVIEW');
    const [showImage, setShowImage] = useState(false);
    
    // Academic History State
    const [selectedHistoryClass, setSelectedHistoryClass] = useState<string | null>(null);
    const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
    const [termViewTab, setTermViewTab] = useState<TermViewTab>('REPORT');
    const [reportData, setReportData] = useState<any>(null);

    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null) ;
    let [serverForm,setServerForm]= useState(new FormData()) // form to handle server data 
    const {sendRequest} = useRequest()

     // Security & Notification State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'SUSPEND' | 'DELETE', payload?: any } | null>(null);
    const {toast, setToast,selectedSchool} = useContext(uiContext);
    const {students,setStudents, // students data
          teachers, setTeachers ,// teachers data
          staff, setStaff, // staff data
          sections, setSections, // sections data
          classRooms, setClassRooms, // classRooms data
          subjects, setSubjects, // subjects data
      } = useContext(uiContext)
    const {currentUser} = useContext(authContext); // to check some other things 
  

    const s = students.find(st => st.id === id);
    if (!s) return null;
    const assignedClasses = classRooms.filter(c => s.class_room.includes(c.id));

    // Handle Report Card Generation
    const handleViewReport = (className: string, session: string, term: string) => {
        const cls = classRooms.find(c => c.name === className);
        const relevantSubjects = subjects.filter(sub => sub.class_room.includes(cls?.id || ''));
        const data = generateMockReportData(s, className, session, term, relevantSubjects);
        setReportData(data);
        setSelectedTerm(term);
        setTermViewTab('REPORT'); // Default to report view
    };

    // Print Handler
    const handlePrint = () => {
        window.print();
    };


    // ACTIONS
    const triggerSuspend = () => { setPendingAction({ type: 'SUSPEND' }); setShowPinModal(true); };
    const triggerDelete = () => { setPendingAction({ type: 'DELETE' }); setShowPinModal(true); };

    return (
        <div className="animate-fadeIn space-y-6">
            {/* Print Styling - Ensures scrollable content is visible on paper */}
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #report-card-container, #report-card-container * { visibility: visible; }
                    #report-card-container { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <button onClick={() => setViewMode('LIST')} className="flex items-center text-gray-500 hover:text-navy-900 transition-colors no-print">
                <i className="fa-solid fa-arrow-left mr-2"></i> Back to Directory
            </button>
            
            {/* Professional Profile Header (Hidden when printing Report Card) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print">
                <div className="h-32 bg-gradient-to-r from-navy-900 to-navy-700 relative">
                     <div className="absolute inset-0 bg-pattern opacity-10"></div>
                     <div className="absolute bottom-4 right-6 text-white/20 text-4xl">
                         <i className="fa-solid fa-graduation-cap"></i>
                     </div>
                </div>
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end">
                            <div 
                                className={`w-28 h-28 rounded-xl bg-white p-1.5 shadow-lg relative shrink-0 ${s.picture ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                onClick={() => s.picture && setShowImage(true)}
                            >
                                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-5xl text-gray-400 overflow-hidden border border-gray-200">
                                    {s.picture ? <img src={urls.BASE_URL + s.picture} alt="Student" className="w-full h-full object-cover"/> : <i className="fa-solid fa-user"></i>}
                                </div>
                                <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${s?.user.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                    <i className={`fa-solid ${s?.user.is_active ? 'fa-check' : 'fa-ban'}`}></i>
                                </span>
                            </div>
                            <div className="ml-5 mb-1">
                                <h1 className="text-3xl font-bold text-navy-900 leading-tight">{s.first_name} {s.last_name}</h1>
                                <p className="text-gray-500 font-medium flex items-center text-sm mt-1">
                                    <span>{s?.user?.role}</span>
                                    <span className="bg-navy-50 text-navy-700 px-2 py-0.5 rounded border border-navy-100 mr-2">{s.admission_number}</span>
                                    {s.email}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4 md:mt-0">
                            <Button variant="outline" className="w-auto px-4" onClick={() => setViewMode('EDIT')}>
                                <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Profile
                            </Button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex space-x-8 border-b border-gray-200 mt-8 overflow-x-auto">
                        {[
                            { id: 'OVERVIEW', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
                            { id: 'ACADEMIC', label: 'Academic History', icon: 'fa-solid fa-book-open' },
                            { id: 'GUARDIAN', label: 'Guardian Info', icon: 'fa-solid fa-house-user' },
                            { id: 'ADMIN', label: 'Administrative', icon: 'fa-solid fa-shield-halved' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id as DetailTab); setSelectedTerm(null); }}
                                className={`pb-4 text-sm font-semibold flex items-center transition-all whitespace-nowrap ${
                                    activeTab === tab.id 
                                    ? 'text-navy-900 border-b-2 border-navy-900' 
                                    : 'text-gray-500 hover:text-navy-700'
                                }`}
                            >
                                <i className={`${tab.icon} mr-2`}></i>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="pt-8 min-h-[300px]">
                        {activeTab === 'OVERVIEW' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-6">
                                     <div className="bg-navy-50 p-6 rounded-lg border border-navy-100 flex items-start gap-4">
                                         <i className="fa-solid fa-bullhorn text-navy-600 text-xl mt-1"></i>
                                         <div>
                                             <h3 className="font-bold text-navy-900">Latest Activity</h3>
                                             <p className="text-sm text-gray-600 mt-1">
                                                 Enrolled in {assignedClasses.length} classes for the current session. 
                                                 Guardian contact updated on {new Date(s.joinedAt).toLocaleDateString()}.
                                             </p>
                                         </div>
                                     </div>
                                     <h3 className="text-lg font-bold text-navy-900">Personal Details</h3>
                                     <div className="grid grid-cols-2 gap-y-4 text-sm border-t pt-4">
                                         <div><p className="text-gray-500 text-xs uppercase font-bold">Full Name</p><p className="font-semibold text-navy-900">{s.first_name} {s.middle_name} {s.last_name}</p></div>
                                         <div><p className="text-gray-500 text-xs uppercase font-bold">Gender</p><p className="font-semibold text-navy-900">{s.gender}</p></div>
                                         <div><p className="text-gray-500 text-xs uppercase font-bold">Date of Birth</p><p className="font-semibold text-navy-900">{s.date_of_birth || 'N/A'}</p></div>
                                         <div><p className="text-gray-500 text-xs uppercase font-bold">Joined At</p><p className="font-semibold text-navy-900">{new Date(s.joined_at).toLocaleDateString()}</p></div>
                                     </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase">Attendance</h4>
                                        <div className="relative w-24 h-24 mx-auto my-4 flex items-center justify-center">
                                            <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-green-500 rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' }}></div>
                                            <span className="text-xl font-bold text-navy-900">96%</span>
                                        </div>
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Excellent</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {activeTab === 'ACADEMIC' && (
                            <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px]">
                                {/* Left: History Navigation */}
                                <div className="lg:w-1/3 space-y-4 no-print flex-shrink-0">
                                    <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center"><i className="fa-solid fa-clock-rotate-left mr-2"></i> Class History</h3>
                                    <div className="space-y-3">
                                        {assignedClasses.map((cls, idx) => (
                                            <div key={cls.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                                <div 
                                                    className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${selectedHistoryClass === cls.id ? 'bg-navy-900 text-white' : 'hover:bg-gray-50'}`}
                                                    onClick={() => {
                                                        setSelectedHistoryClass(selectedHistoryClass === cls.id ? null : cls.id);
                                                        setSelectedTerm(null);
                                                    }}
                                                >
                                                    <div>
                                                        <h4 className="font-bold text-sm">{cls.name}</h4>
                                                        <p className={`text-xs ${selectedHistoryClass === cls.id ? 'text-navy-300' : 'text-gray-500'}`}>{idx === 0 ? 'Current Session' : '2022/2023 Session'}</p>
                                                    </div>
                                                    <i className={`fa-solid fa-chevron-down transition-transform ${selectedHistoryClass === cls.id ? 'rotate-180' : ''}`}></i>
                                                </div>
                                                
                                                {/* Terms Accordion */}
                                                {selectedHistoryClass === cls.id && (
                                                    <div className="bg-gray-50 border-t border-gray-200 p-2 space-y-1 animate-fadeIn">
                                                        {['1st Term', '2nd Term', '3rd Term'].map(term => (
                                                            <button
                                                                key={term}
                                                                onClick={() => handleViewReport(cls.name, idx === 0 ? '2023/2024' : '2022/2023', term)}
                                                                className={`w-full text-left px-4 py-2 text-sm rounded flex justify-between items-center ${
                                                                    selectedTerm === term 
                                                                    ? 'bg-gold-100 text-gold-800 font-bold border border-gold-300' 
                                                                    : 'text-gray-600 hover:bg-white hover:shadow-sm'
                                                                }`}
                                                            >
                                                                <span>{term} Report</span>
                                                                {selectedTerm === term && <i className="fa-solid fa-circle-check"></i>}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {assignedClasses.length === 0 && <p className="text-gray-500 italic p-4 text-center bg-gray-50 rounded">No enrolled classes found.</p>}
                                    </div>
                                </div>

                                {/* Right: Result View */}
                                <div className="lg:w-2/3 flex-1">
                                    {selectedTerm && reportData ? (
                                        <div className="animate-fadeIn flex flex-col h-full">
                                            {/* Term View Tabs */}
                                            <div className="flex items-center gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit no-print">
                                                <button onClick={() => setTermViewTab('REPORT')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${termViewTab === 'REPORT' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}>Report Sheet</button>
                                                <button onClick={() => setTermViewTab('ANALYSIS')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${termViewTab === 'ANALYSIS' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}>Performance Analysis</button>
                                                <button onClick={() => setTermViewTab('RECORDS')} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${termViewTab === 'RECORDS' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}>Term Records</button>
                                            </div>

                                            {/* REPORT VIEW */}
                                            {termViewTab === 'REPORT' && (
                                                <>
                                                    <div className="flex justify-between items-center mb-6 no-print">
                                                        <div>
                                                            <h3 className="font-bold text-xl text-navy-900">Result Sheet</h3>
                                                            <p className="text-xs text-gray-500">{reportData.studentDetails.term} • {reportData.studentDetails.session}</p>
                                                        </div>
                                                        <Button onClick={handlePrint} className="w-auto px-4 gap-2">
                                                            <i className="fa-solid fa-print"></i> Print
                                                        </Button>
                                                    </div>

                                                    <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-inner flex-1">
                                                        <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-6">
                                                            {/* THE REPORT CARD CONTAINER */}
                                                            <div id="report-card-container" className="bg-white p-8 border-4 border-double border-navy-900/20 shadow-xl relative min-h-[800px] text-navy-900 max-w-3xl mx-auto">
                                                                {/* Watermark */}
                                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                                                                    <i className="fa-solid fa-graduation-cap text-[400px]"></i>
                                                                </div>

                                                                {/* Header */}
                                                                <div className="text-center border-b-2 border-navy-900 pb-4 mb-6">
                                                                    <div className="w-16 h-16 bg-navy-900 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                                                                        <i className="fa-solid fa-school"></i>
                                                                    </div>
                                                                    <h1 className="text-2xl font-bold uppercase tracking-wide text-navy-900">{selectedSchool?.name || "Director School"}</h1>
                                                                    <p className="text-sm text-gray-600 font-serif italic">{selectedSchool?.motto ||  "Excellence in Knowledge & Character"}</p>
                                                                    <p className="text-xs text-gray-500 mt-1">{selectedSchool?.address || "Current Address "}</p>
                                                                    <div className="mt-4 bg-navy-900 text-white inline-block px-6 py-1 text-sm font-bold uppercase tracking-widest rounded-full">
                                                                        Termly Report Sheet
                                                                    </div>
                                                                </div>

                                                                {/* Student Info Grid */}
                                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm border border-gray-300 p-4 rounded bg-gray-50/50">
                                                                    <div><span className="block text-xs font-bold text-gray-500 uppercase">Name</span><span className="font-bold text-navy-900">{reportData.studentDetails.name}</span></div>
                                                                    <div><span className="block text-xs font-bold text-gray-500 uppercase">Admission No</span><span className="font-mono font-bold text-navy-900">{reportData.studentDetails.admissionNo}</span></div>
                                                                    <div><span className="block text-xs font-bold text-gray-500 uppercase">Class</span><span className="font-bold text-navy-900">{reportData.studentDetails.class}</span></div>
                                                                    <div><span className="block text-xs font-bold text-gray-500 uppercase">Attendance</span><span className="font-bold text-navy-900">{reportData.studentDetails.attendance.present} / {reportData.studentDetails.attendance.total}</span></div>
                                                                </div>

                                                                {/* Grades Table */}
                                                                <div className="mb-8">
                                                                    <h4 className="text-sm font-bold text-navy-900 uppercase border-b border-gray-300 mb-2 pb-1">Academic Performance</h4>
                                                                    <table className="w-full text-sm border-collapse border border-gray-300">
                                                                        <thead>
                                                                            <tr className="bg-navy-50 text-navy-900">
                                                                                <th className="border border-gray-300 p-2 text-left">Subject</th>
                                                                                <th className="border border-gray-300 p-2 text-center w-16">CA (40)</th>
                                                                                <th className="border border-gray-300 p-2 text-center w-16">Exam (60)</th>
                                                                                <th className="border border-gray-300 p-2 text-center w-16">Total</th>
                                                                                <th className="border border-gray-300 p-2 text-center w-16">Grade</th>
                                                                                <th className="border border-gray-300 p-2 text-left">Remark</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {reportData.academics.map((sub: any, i: number) => (
                                                                                <tr key={i} className="even:bg-gray-50/50">
                                                                                    <td className="border border-gray-300 p-2 font-medium">{sub.subject}</td>
                                                                                    <td className="border border-gray-300 p-2 text-center text-gray-600">{sub.ca}</td>
                                                                                    <td className="border border-gray-300 p-2 text-center text-gray-600">{sub.exam}</td>
                                                                                    <td className="border border-gray-300 p-2 text-center font-bold text-navy-900">{sub.total}</td>
                                                                                    <td className={`border border-gray-300 p-2 text-center font-bold ${sub.grade === 'F' ? 'text-red-600' : 'text-green-700'}`}>{sub.grade}</td>
                                                                                    <td className="border border-gray-300 p-2 text-xs italic text-gray-600">{sub.remark}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>

                                                                {/* Behavioral & Skills Grid */}
                                                                <div className="grid grid-cols-2 gap-8 mb-8">
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-navy-900 uppercase border-b border-gray-300 mb-2 pb-1">Affective Domain</h4>
                                                                        <table className="w-full text-xs border border-gray-300">
                                                                            <tbody>
                                                                                {reportData.affective.map((trait: any, i: number) => (
                                                                                    <tr key={i} className="border-b border-gray-200">
                                                                                        <td className="p-1 pl-2 font-medium">{trait.trait}</td>
                                                                                        <td className="p-1 text-right pr-2">
                                                                                            {[1,2,3,4,5].map(star => (
                                                                                                <i key={star} className={`fa-solid fa-star mr-0.5 ${star <= trait.rating ? 'text-gold-500' : 'text-gray-200'}`}></i>
                                                                                            ))}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-sm font-bold text-navy-900 uppercase border-b border-gray-300 mb-2 pb-1">Psychomotor Skills</h4>
                                                                        <table className="w-full text-xs border border-gray-300">
                                                                            <tbody>
                                                                                {reportData.psychomotor.map((skill: any, i: number) => (
                                                                                    <tr key={i} className="border-b border-gray-200">
                                                                                        <td className="p-1 pl-2 font-medium">{skill.skill}</td>
                                                                                        <td className="p-1 text-right pr-2">
                                                                                            {[1,2,3,4,5].map(star => (
                                                                                                <i key={star} className={`fa-solid fa-star mr-0.5 ${star <= skill.rating ? 'text-blue-500' : 'text-gray-200'}`}></i>
                                                                                            ))}
                                                                                        </td>
                                                                                    </tr>
                                                                                ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                </div>

                                                                {/* Remarks */}
                                                                <div className="border border-gray-300 rounded p-4 bg-gray-50/30 space-y-4">
                                                                    <div className="flex gap-4">
                                                                        <div className="w-32 text-xs font-bold uppercase text-gray-500 pt-1">Form Teacher:</div>
                                                                        <div className="flex-1 border-b border-gray-300 pb-1 text-sm font-serif italic text-navy-900">{reportData.remarks.teacher}</div>
                                                                    </div>
                                                                    <div className="flex gap-4">
                                                                        <div className="w-32 text-xs font-bold uppercase text-gray-500 pt-1">Principal:</div>
                                                                        <div className="flex-1 border-b border-gray-300 pb-1 text-sm font-serif italic text-navy-900">{reportData.remarks.principal}</div>
                                                                    </div>
                                                                </div>

                                                                {/* Footer Signatures */}
                                                                <div className="flex justify-between mt-12 pt-4">
                                                                    <div className="text-center">
                                                                        <div className="w-32 border-b border-black mb-1"></div>
                                                                        <p className="text-xs text-gray-500 uppercase">Teacher's Signature</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="w-24 h-24 border-2 border-dashed border-navy-200 rounded-full flex items-center justify-center text-navy-200 mb-1 mx-auto -mt-10">
                                                                            <span className="text-[10px] uppercase font-bold rotate-12">Official Stamp</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 uppercase mt-2">Date: {new Date().toLocaleDateString()}</p>
                                                                    </div>
                                                                    <div className="text-center">
                                                                        <div className="w-32 border-b border-black mb-1"></div>
                                                                        <p className="text-xs text-gray-500 uppercase">Principal's Signature</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* ANALYSIS VIEW */}
                                            {termViewTab === 'ANALYSIS' && (
                                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1 overflow-y-auto">
                                                    <h3 className="font-bold text-navy-900 mb-6">Subject Performance Analysis</h3>
                                                    <div className="space-y-6">
                                                        {reportData.academics.map((sub: any, idx: number) => {
                                                            const diff = sub.total - sub.classAvg;
                                                            return (
                                                                <div key={idx} className="space-y-2">
                                                                    <div className="flex justify-between text-sm">
                                                                        <span className="font-bold text-navy-800">{sub.subject}</span>
                                                                        <span className="text-gray-500">{sub.total}% (Class Avg: {sub.classAvg.toFixed(1)}%)</span>
                                                                    </div>
                                                                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                                                        <div 
                                                                            className={`h-full ${sub.total >= 70 ? 'bg-green-500' : sub.total >= 50 ? 'bg-blue-500' : 'bg-red-500'}`} 
                                                                            style={{ width: `${Math.min(sub.total, 100)}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 text-right">
                                                                        {diff > 0 ? <span className="text-green-600">+{diff.toFixed(1)} above avg</span> : <span className="text-red-500">{diff.toFixed(1)} below avg</span>}
                                                                    </p>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* RECORDS VIEW */}
                                            {termViewTab === 'RECORDS' && (
                                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1 overflow-y-auto space-y-8">
                                                    <div>
                                                        <h4 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center"><i className="fa-solid fa-money-bill-wave mr-2 text-green-600"></i> Fee Status for Term</h4>
                                                        <div className="bg-gray-50 p-4 rounded border border-gray-200 flex justify-between items-center">
                                                            <div>
                                                                <p className="text-xs text-gray-500 uppercase font-bold">Total Fees</p>
                                                                <p className="text-lg font-bold text-navy-900">₦{reportData.termRecords.fees.amount}</p>
                                                            </div>
                                                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-bold uppercase">{reportData.termRecords.fees.status}</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center"><i className="fa-solid fa-triangle-exclamation mr-2 text-orange-500"></i> Disciplinary Incidents</h4>
                                                        {reportData.termRecords.incidents.length > 0 ? (
                                                            <div className="space-y-3">
                                                                {reportData.termRecords.incidents.map((inc: any, i: number) => (
                                                                    <div key={i} className="p-3 border border-orange-200 bg-orange-50 rounded">
                                                                        <div className="flex justify-between">
                                                                            <span className="font-bold text-orange-800 text-sm">{inc.title}</span>
                                                                            <span className="text-xs text-orange-600">{inc.date}</span>
                                                                        </div>
                                                                        <p className="text-xs text-gray-700 mt-1">{inc.description}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p className="text-gray-500 italic text-sm">No incidents recorded this term.</p>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h4 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center"><i className="fa-solid fa-trophy mr-2 text-gold-500"></i> Activities & Clubs</h4>
                                                        <div className="flex flex-wrap gap-2">
                                                            {reportData.termRecords.activities.map((act: string, i: number) => (
                                                                <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">{act}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                                                <i className="fa-solid fa-file-invoice text-2xl text-navy-200"></i>
                                            </div>
                                            <h3 className="text-lg font-bold text-navy-900 mb-2">Select a Term</h3>
                                            <p className="max-w-xs">Click on a class from the history list on the left, then select a term to view reports and records.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        
                         {activeTab === 'GUARDIAN' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 mr-4">
                                            <i className="fa-solid fa-user-shield text-xl"></i>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-navy-900 text-lg">{s.guardian?.full_name || 'Not Listed'}</h3>
                                            <p className="text-sm text-gray-500">{s.guardian?.relation_ship || 'Guardian'}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start"><i className="fa-solid fa-phone w-6 text-gold-500 mt-1"></i><div><p className="text-xs text-gray-400 uppercase font-bold">Primary Phone</p><p className="font-bold text-navy-900">{s.guardian?.phone || 'N/A'}</p></div></div>
                                        <div className="flex items-start"><i className="fa-solid fa-envelope w-6 text-gold-500 mt-1"></i><div><p className="text-xs text-gray-400 uppercase font-bold">Email Address</p><p className="font-medium text-navy-800">{s.guardian?.email || 'N/A'}</p></div></div>
                                        <div className="flex items-start"><i className="fa-solid fa-location-dot w-6 text-gold-500 mt-1"></i><div><p className="text-xs text-gray-400 uppercase font-bold">Home Address</p><p className="font-medium text-navy-800">{s.guardian?.address || 'N/A'}</p></div></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ADMIN' && (
                            <div className="bg-red-50 border border-red-100 rounded-lg p-8">
                                <h3 className="text-xl font-bold text-red-800 mb-2 flex items-center"><i className="fa-solid fa-triangle-exclamation mr-3"></i> Danger Zone</h3>
                                <p className="text-sm text-red-600 mb-8 max-w-2xl">These actions are critical and require Director Verification (PIN).</p>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between bg-white p-5 rounded border border-red-100 shadow-sm">
                                        <div><h4 className="font-bold text-gray-800">{s.status === 'Suspended' ? 'Reactivate Student' : 'Suspend Student'}</h4><p className="text-xs text-gray-500 mt-1">Temporarily revoke access.</p></div>
                                        <Button variant={s.status === 'Suspended' ? 'primary' : 'secondary'} className="w-auto px-6" onClick={triggerSuspend}>{s.status === 'Suspended' ? 'Activate' : 'Suspend'}</Button>
                                    </div>
                                    <div className="flex items-center justify-between bg-white p-5 rounded border border-red-100 shadow-sm">
                                        <div><h4 className="font-bold text-red-700">Delete Record</h4><p className="text-xs text-gray-500 mt-1">Permanently remove student record.</p></div>
                                        <Button variant="danger" className="w-auto px-6" onClick={triggerDelete}>Delete Student</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <ImageViewer 
                isOpen={showImage} 
                imageUrl={urls.BASE_URL + s.picture} 
                onClose={() => setShowImage(false)} 
            />
        </div>
    );
  };
