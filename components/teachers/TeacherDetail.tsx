
import React, { useState ,useContext, useRef, useEffect} from 'react';
import { Teacher, SchoolSection, Subject, ClassRoom, DisciplinaryRecord, KYCInfo, KYCDocument } from '../../types';
import { Button, Input, ImageViewer, Modal } from '../UI';
import { safeParseFloat } from './TeacherFinance';
import { uiContext } from '@/customContexts/UiContext';
import urls from '@/customHooks/ServerUrls';
import useRequest from '@/customHooks/RequestHook';

interface TeacherDetailProps { 
    id: string;
    teacher: Teacher | any ;
    setTeacher: (teacher:any) => void;
    onBack: () => void;
    onEdit: () => void;
    onTriggerSalary: (data: any) => void;
    onViewReceipt: (data: any) => void;
    onTriggerSuspend: () => void;
    onTriggerDelete: () => void;
    onOpenBankModal: () => void;
    onViewDoc: (doc: KYCDocument) => void;
    onVerifyDoc: (doc: KYCDocument) => void;
    triggerRecord: (form:any , type:any ) => void ;
}

type Tab = 'OVERVIEW' | 'ACADEMIC' | 'FINANCE' | 'ADMIN';

export const TeacherDetail: React.FC<TeacherDetailProps> = ({ 
    id,
    teacher,
    setTeacher ,
    onBack, onEdit,
    onTriggerSalary,
    onViewReceipt, 
    onTriggerSuspend,
    onTriggerDelete,
    onOpenBankModal,
    onViewDoc,
    onVerifyDoc ,
    triggerRecord
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
    const [showImage, setShowImage] = useState(false) ;
    const [isDeletingModalOpen,setIsDeletingModalOpen] = useState(false) ; 
    const {
        selectedSchool,
        teachers,
        isLoading,
        sections,
        subjects,
        setToast,
        classRooms
    } = useContext(uiContext);
    const {sendRequest} = useRequest() ;
    
    // Admin Form States
    const [disciplinaryForm, setDisciplinaryForm] = useState({ title: '', description: '', severity: 'Low' as 'Low'|'Medium'|'High' });

    const assignedSections = sections.filter(sec => teacher?.sections?.includes(sec?.id)) 
    const assignedSubjects = teacher?.subjects || []
    const formClasses = classRooms.filter(c => teacher?.form_classes?.includes(c.id)) ;
    const teachingClasses = classRooms.filter(c => teacher?.class_rooms?.includes(c.id)) ;

    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const isPaidThisMonth = teacher.paymentHistory?.some(p => p.month === currentMonth && p.status === 'Paid');
 
    const handleAddDisciplinary = () => {
         if (!disciplinaryForm.title || !disciplinaryForm.description) return;
         const newRecord: DisciplinaryRecord = {
             title: disciplinaryForm.title,
             description: disciplinaryForm.description,
             severity: disciplinaryForm.severity,
             school : selectedSchool.id,
             teacher : teacher?.id  
         };
         
         triggerRecord(newRecord,'ADD-RECORD')
         setDisciplinaryForm({ title: '', description: '', severity: 'Low' }); // clear the form
    };
    const triggeredFunc =  (resp) => {
        // console.log('resp: ', resp);
        if (resp?.teacher_details){ 
        setTeacher(t => ({...t,...resp?.teacher_details}));
        }
    }
    useEffect(() => {
        if (id){ 
          let sUrl = `/teacher/details/${selectedSchool?.id}/${id}/`
          sendRequest(sUrl,"GET",null as any ,triggeredFunc,!true,false);
        }
      },[id]);

    const topRef = useRef<any>(null)
    useEffect(() => {
          topRef.current?.scrollIntoView({
               behavior: "smooth",
              block: "start"
                  })
    }, []);

    useEffect(() => {
         setDisciplinaryForm({ title: '', description: '', severity: 'Low' }); // clear the form
    },[teacher])

    return (
        <div className="animate-fadeIn space-y-2 -mt-2 ">
            <div className="absolute bbd -top-10 " ref={topRef} >  </div>
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="h-32 bg-gradient-to-r from-navy-800 to-navy-600 relative">
                     <button onClick={onBack} className="absolute left-2 top-0 flex items-center text-gold-400 hover:text-gold-700 transition-colors no-print animate-pulse">
                        <i className="fa-solid fa-arrow-left mr-2 text-xl rounded-lg p-2 rounded-lg bg-gold-50"></i> Back 
                    </button>
                    {/* <div className="absolute inset-0 bg-pattern opacity-10"></div> */}

                 </div>
                 <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end">
                            <div 
                                className={`w-28 h-28 rounded-xl bg-white p-1.5 shadow-lg relative shrink-0 ${teacher.picture ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                onClick={() => teacher.picture && setShowImage(true)}
                                title={teacher.picture ? "Click to view full image" : ""} 
                            >
                                <div className="w-full h-full bg-navy-50 rounded-lg flex items-center justify-center text-4xl text-navy-300 font-bold border border-gray-100 overflow-hidden">
                                    {teacher.picture ? <img src={urls.BASE_URL+teacher.picture} alt="" className="w-full h-full object-cover"/> : `${teacher.first_name[0]}${teacher.last_name[0]}`}
                                </div>
                                <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${teacher?.is_active? 'bg-green-500' : 'bg-red-500'}`}>
                                    <i className={`fa-solid ${teacher?.is_active? 'fa-check' : 'fa-ban'}`}></i>
                                </span>
                            </div>
                            <div className="ml-5 mb-1">
                                <h1 className="text-3xl font-bold text-navy-900 leading-tight">{teacher.title} {teacher.first_name} {teacher.last_name}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-gray-500 font-medium text-sm">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 mr-2">{teacher.staff_id}</span>
                                    </p>
                                    {teacher.kyc?.isVerified ? (
                                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center"><i className="fa-solid fa-shield-halved mr-1"></i> KYC Verified</span>
                                    ) : (
                                        <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded flex items-center"><i className="fa-solid fa-circle-exclamation mr-1"></i> KYC Pending</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4 md:mt-0">
                            <Button variant="outline" className="w-auto px-4" onClick={onEdit}>
                                <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Profile
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-8 border-b border-gray-200 mt-8 overflow-x-auto">
                        {[
                            { id: 'OVERVIEW', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
                            { id: 'ACADEMIC', label: 'Academic', icon: 'fa-solid fa-book' },
                            { id: 'FINANCE', label: 'Finance', icon: 'fa-solid fa-file-invoice-dollar' },
                            { id: 'ADMIN', label: 'Admin', icon: 'fa-solid fa-shield-halved' }
                        ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id as Tab)} className={`pb-4 text-sm font-bold flex items-center transition-all ${activeTab === t.id ? 'text-navy-900 border-b-2 border-navy-900' : 'text-gray-400 hover:text-navy-600'}`}>
                                <i className={`${t.icon} mr-2`}></i>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="pt-8 min-h-[300px]">
                        {/* OVERVIEW TAB */}
                        {activeTab === 'OVERVIEW' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {/* Column 1 & 2 */}
                                <div className="md:col-span-2 space-y-6">

                                    {/* Personal Details */}
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                        <h3 className="font-bold text-navy-900 border-b border-gray-100 pb-3 mb-4 flex items-center">
                                            <i className="fa-solid fa-user mr-2 text-navy-600"></i>
                                            Personal Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase font-bold">Full Name</p>
                                                <p className="font-semibold text-navy-900">{teacher?.title} {teacher?.first_name} {teacher?.last_name} {teacher?.middle_name} </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase font-bold">Gender</p>
                                                <p className="font-semibold text-navy-900">{teacher?.gender}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase font-bold">Date of Birth</p>
                                                <p className="font-semibold text-navy-900">{teacher?.date_of_birth ? new Date(teacher?.date_of_birth).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 text-xs uppercase font-bold">Date Joined</p>
                                                <p className="font-semibold text-navy-900">{new Date(teacher?.joined_at).toLocaleDateString()}</p>
                                            </div>
                                             <div>
                                                <p className="text-gray-500 text-xs uppercase font-bold">NIN</p>
                                                <p className="font-semibold text-navy-900">{teacher?.nin || 'Not Provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Conduct & Discipline (Bad Records) */}
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="bg-navy-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                            <h3 className="font-bold text-navy-900 flex items-center">
                                                <i className="fa-solid fa-gavel mr-2 text-navy-600"></i>
                                                Conduct & Performance Record
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            {(!teacher?.disciplinaryRecords || teacher?.disciplinaryRecords.length === 0) ? (
                                                 <div className="flex flex-col items-center justify-center py-6 text-green-600 bg-green-50 rounded border border-green-100 border-dashed">
                                                     <i className="fa-solid fa-certificate text-3xl mb-2"></i>
                                                     <span className="font-bold">Clean Record</span>
                                                     <span className="text-xs text-green-700">No disciplinary actions or negative reports.</span>
                                                 </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {teacher?.disciplinaryRecords.map(rec => (
                                                        <div key={rec.id} className={`flex gap-4 p-3 border-l-4 ${rec.severity === 'High' ? 'border-red-600 bg-red-50' : 'border-orange-500 bg-orange-50'} rounded`}>
                                                            <div className="flex-1">
                                                                <div className="flex justify-between">
                                                                    <h4 className="font-bold text-navy-900 text-sm">{rec.title} <span className="text-xs uppercase px-1 rounded bg-white border ml-2">{rec.severity}</span></h4>
                                                                    <span className="text-xs font-bold text-gray-500">{new Date(rec.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-700 mt-1">{rec.description}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Class Schedule Overview */}
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                        <div className="p-4 border-b border-gray-200">
                                            <h3 className="font-bold text-navy-900 flex items-center">
                                                <i className="fa-solid fa-chalkboard mr-2 text-navy-600"></i>
                                                Teaching Schedule
                                            </h3>
                                        </div>
                                        <div className="p-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {teachingClasses?.map(cls => (
                                                    <div key={cls.id} className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                                                        <div className="w-8 h-8 rounded bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-xs mr-3">
                                                            {cls.name.substring(0,2)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-navy-900">{cls.name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {assignedSubjects.filter(s => s.classroom__name===cls?.name).map(s => s.subject__name).join(', ')}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {teachingClasses.length === 0 && <p className="text-gray-500 text-sm italic">No classes assigned yet.</p>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Sidebar */}
                                <div className="space-y-4">
                                     <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase ">Status</h4>
                                        <div className={`text-xl font-bold my-2 ${teacher?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                            {teacher?.is_active ? `${teacher?.role} Active` : `${teacher?.role} Inactive`}
                                        </div>
                                        <p className="text-xs text-gray-400">Account Standing</p>
                                    </div>
                                     <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Contact Info</h4>
                                        <div className="space-y-3">
                                            <div className="flex items-center text-sm text-navy-900">
                                                <i className="fa-solid fa-phone w-6 text-gray-400"></i>
                                                {teacher?.phone}
                                            </div>
                                            <div className="flex items-center text-sm text-navy-900">
                                                <i className="fa-solid fa-envelope w-6 text-gray-400"></i>
                                                <span className="truncate">{teacher?.email}</span>
                                            </div>
                                            <div className="flex items-center text-sm text-navy-900">
                                                <i className="fa-solid fa-location-dot w-6 text-gray-400"></i>
                                                <span className="truncate">{teacher?.address || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ACADEMIC' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                 <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded bg-navy-100 flex items-center justify-center text-navy-600"><i className="fa-solid fa-layer-group"></i></div>
                                        <span className="text-2xl font-bold text-navy-900">{assignedSections.length}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-700 mb-2">Assigned Sections</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {assignedSections.map(s => <span key={s.id} className="bg-navy-900 text-white px-2 py-1 rounded text-xs">{s.name}</span>)}
                                        {assignedSections.length === 0 && <span className="text-gray-400 italic text-sm">None</span>}
                                    </div>
                                </div>
                                
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="w-10 h-10 rounded bg-gold-100 flex items-center justify-center text-gold-600"><i className="fa-solid fa-chalkboard"></i></div>
                                        <span className="text-2xl font-bold text-navy-900">{formClasses.length}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-700 mb-2">Form Classes</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {formClasses?.map(c => <span key={c.id} className="bg-navy-900 text-white px-2 py-1 rounded text-xs">{c.name}</span>)}
                                        {formClasses.length === 0 && <span className="text-gray-400 italic text-sm">Not a class teacher</span>}
                                    </div>
                                </div>
                                
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-4">
                                         <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600"><i className="fa-solid fa-book"></i></div>
                                         <span className="text-2xl font-bold text-navy-900">{assignedSubjects.length}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-700 mb-2">Subjects Taught</h4>
                                    <ul className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                        {assignedSubjects.map(sub => (
                                            <li key={sub.id} className="bg-navy-900 text-white px-2 py-1 rounded text-xs text-sm flex justify-between border-b border-gray-50 pb-1 last:border-0">
                                                <span>
                                                    <span className="text-xs p-2">{sub.subject__name}</span>
                                                        •
                                                    <span className="text-xs p-2">{sub.subject__code}</span>
                                                </span>
                                                 <span className="text-xs">{sub.classroom__name}</span>
                                            </li>
                                        ))}
                                        <div className="flex flex-wrap gap-2">
                                    </div>
                                        {assignedSubjects.length === 0 && <span className="text-gray-400 italic text-sm">No subjects assigned</span>}
                                    </ul>
                                </div>
                            </div>
                        )}

                        {activeTab === 'FINANCE' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Action Card */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-navy-900">Payroll Action</h3>
                                                <p className="text-sm text-gray-500">Processing for: <span className="font-bold text-navy-900">{currentMonth}</span></p>
                                            </div>
                                            <span className={`px-3 py-1 rounded text-xs font-bold border ${isPaidThisMonth ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {isPaidThisMonth ? 'PAID' : 'PENDING'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base Salary (₦)</label>
                                                <div className="flex">
                                                    <div className="p-3 border rounded-md font-mono font-bold text-lg bg-gray-50 text-gray-600 border-gray-200 flex-1">
                                                        ₦{teacher?.salary}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => onTriggerSalary({
                                                    baseSalary: teacher?.salary || '0',
                                                    bonus: '0', bonusRemark: '',
                                                    deductions: '0', deductionRemark: '',
                                                    tax: '0',
                                                    month: currentMonth
                                                })} 
                                                disabled={isPaidThisMonth}
                                                variant={isPaidThisMonth ? 'secondary' : 'primary'}
                                                type="button"
                                            >
                                                {isPaidThisMonth ? <><i className="fa-solid fa-check mr-2"></i> Salary Paid</> : <><i className="fa-solid fa-calculator mr-2"></i> Calculate & Pay</>}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Payment History */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Payment History</h4>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Month</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Net Pay</th>
                                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {teacher?.paymentHistory?.map(p => (
                                                        <tr key={p.id}>
                                                            <td className="px-6 py-4 text-sm text-navy-900 font-medium">{p.month}</td>
                                                            <td className="px-6 py-4 text-sm text-navy-900 font-bold">{new Date(p.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-sm text-navy-900 font-bold">₦{safeParseFloat(p.amount).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button 
                                                                    onClick={() => onViewReceipt(p)}
                                                                    className="text-xs text-navy-600 hover:text-navy-900 font-medium hover:underline bg-navy-50 px-3 py-1 rounded-full border border-navy-100"
                                                                >
                                                                    <i className="fa-solid fa-receipt mr-1"></i> Slip
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!teacher?.paymentHistory || teacher?.paymentHistory.length === 0) && (
                                                        <tr><td colSpan={4} className="p-4 text-center text-gray-500 text-sm">No payment history found.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                {/* Bank Info */}
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-navy-900 to-navy-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
                                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                                        
                                        {/* Edit Button */}
                                        <button 
                                            onClick={() => {
                                                setToast({message:'Edit inside Edit Profile.',type:'info'})
                                                topRef?.current?.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "start"
                                                })
                                            }}
                                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
                                            title="Edit Bank Details"
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>

                                        <h4 className="text-sm font-bold text-gold-500 uppercase mb-4 tracking-wider flex items-center">
                                            <i className="fa-solid fa-building-columns mr-2"></i> Bank Details
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-navy-300 text-xs uppercase">Bank Name</p>
                                                <p className="font-bold text-lg">{teacher?.bank_details?.bank_name || 'Not Provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-navy-300 text-xs uppercase">Account Number</p>
                                                <p className="font-mono text-xl tracking-widest">{teacher?.bank_details?.account_number || '**** ****'}</p>
                                            </div>
                                            <div>
                                                <p className="text-navy-300 text-xs uppercase">Account Name</p>
                                                <p className="font-medium text-sm">{teacher?.bank_details?.account_name || 'Not Provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ADMIN' && (
                            <div className="space-y-8">
                                {/* KYC Management */}
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                     <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                        <h3 className="font-bold text-navy-900 flex items-center">
                                            <i className="fa-solid fa-file-contract mr-2 text-navy-600"></i> KYC & Verification
                                        </h3>
                                        {teacher?.kyc?.isVerified && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Verified</span>}
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-3">
                                             <p className="text-sm text-gray-600 mb-2">Submitted Documents</p>
                                             {teacher?.kyc?.documents.map((doc, idx) => (
                                                 <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                                     <div className="flex items-center gap-3">
                                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${doc.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                             <i className={`fa-solid ${doc.status === 'Verified' ? 'fa-check' : 'fa-hourglass'}`}></i>
                                                         </div>
                                                         <div>
                                                             <p className="text-sm font-medium text-navy-900">{doc.name}</p>
                                                             <p className="text-[10px] text-gray-500 uppercase">{doc.status}</p>
                                                         </div>
                                                     </div>
                                                     <button 
                                                        onClick={() => onViewDoc(doc)}
                                                        className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-navy-50 text-navy-700"
                                                     >
                                                         View
                                                     </button>
                                                     {doc.status !== 'Verified' && (
                                                         <button 
                                                            onClick={() => onVerifyDoc(doc)}
                                                            className="text-xs bg-blue-50 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100 text-blue-700 ml-2"
                                                         >
                                                             Verify
                                                         </button>
                                                     )}
                                                 </div>
                                             ))}
                                         </div>
                                         
                                         <div className="border-l border-gray-100 pl-6 flex flex-col justify-center">
                                             <div className="text-center p-6 bg-navy-50 rounded-lg border border-dashed border-navy-200">
                                                 <i className="fa-solid fa-upload text-3xl text-navy-300 mb-2"></i>
                                                 <p className="text-sm font-bold text-navy-700">Request Update</p>
                                                 <p className="text-xs text-gray-500 mb-4">Send a notification to teacher to upload pending documents.</p>
                                                 <Button variant="outline" className="text-xs w-auto px-4">Send Request</Button>
                                             </div>
                                         </div>
                                     </div>
                                </div>

                                {/* Disciplinary Actions Form */}
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                     <h3 className="font-bold text-navy-900 mb-4 border-b border-gray-100 pb-4 flex items-center">
                                        <i className="fa-solid fa-triangle-exclamation mr-2 text-orange-500"></i> Record Disciplinary Action
                                     </h3>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                         <Input 
                                            label="Infraction Title" 
                                            placeholder='Title'
                                            value={disciplinaryForm.title} 
                                            onChange={e => setDisciplinaryForm({...disciplinaryForm, title: e.target.value})} 
                                            iconClass="fa-solid fa-heading"
                                         />
                                         <div>
                                            <label className="block text-sm font-semibold text-navy-800 mb-1.5">Severity Level</label>
                                            <select 
                                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 outline-none"
                                                value={disciplinaryForm.severity}
                                                onChange={e => setDisciplinaryForm({...disciplinaryForm, severity: e.target.value as any})}
                                            >
                                                <option value="Low">Low - Warning/Minor</option>
                                                <option value="Medium">Medium - Reportable Incident</option>
                                                <option value="High">High - Suspension Risk</option>
                                            </select>
                                         </div>
                                     </div>
                                     <div className="mb-4">
                                          <label className="block text-sm font-semibold text-navy-800 mb-1.5">Description & Comments</label>
                                          <textarea 
                                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 outline-none"
                                            rows={3}
                                            placeholder="Provide detailed context about the incident..."
                                            value={disciplinaryForm.description}
                                            onChange={e => setDisciplinaryForm({...disciplinaryForm, description: e.target.value})}
                                          ></textarea>
                                     </div>
                                     <div className="flex justify-end">
                                         <Button onClick={handleAddDisciplinary} className="w-auto max-w-fit  px-6" variant="secondary">
                                             <i className="fa-solid fa-save mr-2"></i> Log Record
                                         </Button>
                                     </div>

                                      {/* History List */}
                                     {teacher?.disciplinaryRecords && teacher?.disciplinaryRecords.length > 0 && (
                                         <div className="mt-8 pt-6 border-t border-gray-100">
                                             <h4 className="font-bold text-gray-700 text-sm uppercase mb-4">History Log</h4>
                                             <div className="space-y-3">
                                                 {teacher?.disciplinaryRecords.map(rec => (
                                                     <div key={rec.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex justify-between items-start">
                                                         <div>
                                                             <div className="flex items-center gap-2 mb-1">
                                                                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                                                                    rec.severity === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 
                                                                    rec.severity === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                                                                    'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                }`}>
                                                                    {rec.severity}
                                                                </span>
                                                                <span className="font-bold text-navy-900 text-sm">{rec.title}</span>
                                                             </div>
                                                             <p className="text-xs text-gray-600">{rec.description}</p>
                                                         </div>
                                                         <span className="text-xs font-mono text-gray-400">{new Date(rec.created_at).toLocaleDateString()}</span>
                                                     </div>
                                                 ))}
                                             </div>
                                         </div>
                                     )}
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-red-800 mb-4">Account Control</h3>
                                    <div className="flex gap-4">
                                        <Button variant="secondary" className="w-auto max-w-fit px-4" onClick={onTriggerSuspend}>
                                            {!teacher?.is_active ? 'Activate Account' : 'Suspend Account'}
                                        </Button>
                                        <Button variant="danger" className="w-auto max-w-fit px-4" onClick={() => {setIsDeletingModalOpen(true)}}>Delete Teacher</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
            </div>
            {/* Rejection Note Modal */}
                              <Modal isOpen={isDeletingModalOpen} onClose={() => {setIsDeletingModalOpen(false);  }} title="Teacher Deletion" size="md">
                                  <div className="space-y-4">
                                      <p className=" bg-red-50 p-2 text-sm text-red-600 rounded-md ">Please confirm teacher deleting. This action is irreversible and all the student related data will also be deleted!</p>
                                      <div className="flex justify-end gap-3">
                                          <Button isLoading={isLoading}  variant="secondary" onClick={() => setIsDeletingModalOpen(false)}>Cancel</Button>
                                          <Button 
                                              isLoading={isLoading}
                                              onClick={() => {
                                                onTriggerDelete() ;
                                                setIsDeletingModalOpen(false);
                                              }}
                                              className="bg-red-600 text-white"
            
                                          >
                                              Confirm Deleting
                                          </Button>
                                      </div>
                                  </div>
                              </Modal>
            
            <ImageViewer 
                isOpen={showImage} 
                imageUrl={teacher?.picture} 
                onClose={() => setShowImage(false)} 
            />
        </div>
    );
};
