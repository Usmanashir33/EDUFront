

import React, { useState, useMemo,useContext } from 'react';
import { Teacher, SchoolSection, Subject, ClassRoom, PaymentRecord, KYCDocument, KYCInfo, ActivityLog } from '../types';
import { Button, PinModal, Toast, Modal, ImageUpload, ImageViewer } from '../components/UI';
import { TeacherDetail } from '../components/teachers/TeacherDetail';
import { PayrollCalculator, PaymentReceipt, BankDetailsModal, safeParseFloat } from '../components/teachers/TeacherFinance';
import { TeacherForm } from '@/components/teachers/TeacherForm';
import urls from '@/customHooks/ServerUrls';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import { uiContext } from '@/customContexts/UiContext';

interface TeacherManagerProps {
    onUpdateTeachers: (teachers: Teacher[]) => void;
    onLogActivity: (action: ActivityLog['action'], module: ActivityLog['module'], description: string) => void;
}

type ViewMode = 'LIST' | 'DETAIL' | 'ADD' | 'EDIT';
type DrillDownType = 'PRESENT' | 'LATE' | 'PAID' | 'UNPAID' | null;

// Mock Helper for Attendance
const getMockAttendance = (teacherId: string, dateStr: string) => {
    const hash = (teacherId.charCodeAt(0) + new Date(dateStr).getDate()) % 10;
    if (hash === 0) return null; // Absent
    let hour = 7;
    let minute = 0;
    if (hash <= 3) { hour = 8; minute = hash * 15; } 
    else { hour = 7; minute = hash * 8; }
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} AM`;
};

export const TeacherManager: React.FC<TeacherManagerProps> = ({ onUpdateTeachers, onLogActivity }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Filters
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterMonth, setFilterMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [filterGender, setFilterGender] = useState<'All' | 'Male' | 'Female'>('All');
    
    // DrillDown
    const [drillDownType, setDrillDownType] = useState<DrillDownType>(null);

    // Security & Toast
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'SUSPEND' | 'DELETE' | 'PAY_SALARY' | 'VERIFY_DOC', payload?: any } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Modal States
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [payrollData, setPayrollData] = useState({ baseSalary: '', bonus: '0', bonusRemark: '', deductions: '0', deductionRemark: '', tax: '0', month: '' });
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<{ teacher: Teacher, record: PaymentRecord } | null>(null);
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountName: '' });
    const [viewDoc, setViewDoc] = useState<KYCDocument | null>(null);
    let [serverForm,setServerForm]= useState(new FormData()) // form to handle server data 
    const {currentUser} = useContext(authContext);
    const {     selectedSchool,
              students,setStudents, // students data
              teachers, setTeachers ,// teachers data
              staff, setStaff, // staff data
              sections, setSections, // sections data
              classRooms, setClassRooms, // classRooms data
              subjects, setSubjects, // subjects data
          } = useContext(uiContext)
    const {sendRequest} = useRequest();

    // Date Navigation
    const handleDateChange = (offset: number) => {
        const date = new Date(filterDate);
        date.setDate(date.getDate() + offset);
        setFilterDate(date.toISOString().split('T')[0]);
    };
    const formattedDateDisplay = new Date(filterDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    // Stats
    const dashboardStats = useMemo(() => {
        const attendanceList = teachers.map(t => ({ ...t, arrivalTime: getMockAttendance(t.id, filterDate) })).filter(t => t.arrivalTime !== null);
        const lateList = attendanceList.filter(t => parseInt(t.arrivalTime!.split(':')[0]) >= 8);
        const paidList = teachers.filter(t => t.paymentHistory?.some(p => p.month === filterMonth && p.status === 'Paid'));
        const unpaidList = teachers.filter(t => !t.paymentHistory?.some(p => p.month === filterMonth && p.status === 'Paid'));
        return { attendanceList, lateList, paidList, unpaidList };
    }, [teachers, filterDate, filterMonth]);

    const getDrillDownList = () => {
        switch(drillDownType) {
            case 'PRESENT': return dashboardStats.attendanceList;
            case 'LATE': return dashboardStats.lateList;
            case 'PAID': return dashboardStats.paidList;
            case 'UNPAID': return dashboardStats.unpaidList;
            default: return [];
        }
    };
    // /   this is react function
  const TriggeredFunc = (data:any) => { 
    console.log('data: ', data);
    if (data?.success){
        if (viewMode === "ADD"){
          setToast({ message: "New Teacher registered.", type: 'success' });
          setShowPinModal(false);
          setViewMode('LIST');
          setTeachers ([data?.new_teacher,...teachers]);
          onLogActivity('CREATE', 'TEACHERS', `Onboarded ${data?.new_student?.first_name}`);
        
        }else if (viewMode === "EDIT"){
          setTeachers(teachers.map(x => x.id === selectedTeacherId ? data?.updated_teacher : x));
          setViewMode('DETAIL');
          onLogActivity('UPDATE', 'TEACHERS', `Updated profile`);
          setToast({ message: "Teacher updated.", type: 'success' });
        }
    }
  }
    const handleApiCall = (data:any) => {
        // console.log('data: ', data);
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
        if (viewMode === "ADD") { 
          sendRequest("/director/add-teacher/","POST",serverForm,TriggeredFunc,true,true)
        }
        if (viewMode === "EDIT") {
          sendRequest(`/director/update-teacher/${selectedTeacherId}/`,"PUT",serverForm,TriggeredFunc,true,true)
        }
        return 
    }
    setShowPinModal(true)
    let form = new FormData() 
    // Only include id if updating
    form.append("first_name", data.firstName);
    form.append("title", data.title);
    form.append("last_name", data.lastName);
    form.append("middle_name", data.middleName || "");
    form.append("email", data.email);
    form.append("phone", data.phone);
    form.append("gender", data.gender.toLowerCase() );
    form.append("school", selectedSchool?.id);
    form.append("date_of_birth", data.dateOfBirth);
    form.append("nin", data.nin);
    form.append("address", data.nin);
    form.append("salary", data.salary);

    form.append("bank_details", JSON.stringify({
        "bank_name":data.bankDetails?.bankName,
        "account_number":data.bankDetails?.accountNumber,
        "account_name":data.bankDetails?.accountName,
    }));

    // Image file only if selected
    if (data.picture instanceof File) {
      form.append("picture", data.picture);
    }
    // ManyToMany → append each classroom id
    data.classRoomIds?.forEach((id:string) => {
        form.append("class_rooms", id);
    })
    // Teacher dont need section 
    // data.sectionIds?.forEach((id:string) => {
    //     form.append("sections", id);
    // })
    setServerForm(form)  // initialize the server form 
  }

    // Actions
    const handlePinSuccess = (pins:string) => {
        serverForm.append("pin", pins );
        setShowPinModal(false);

        // Make the api call here  when user  need no pin to talk to server 
        if (viewMode ===  "ADD") { 
          sendRequest("/director/add-teacher/","POST",serverForm,TriggeredFunc,true,true)
        }
        if (viewMode ===  "EDIT") {
          sendRequest(`/director/update-teacher/${selectedTeacherId}/`,"PUT",serverForm,TriggeredFunc,true,true)
        }


        if (!pendingAction) return;

        // if (pendingAction.type === 'SUSPEND' && selectedTeacherId) {
        //     const updated = teachers.map(t => t.id === selectedTeacherId ? { ...t, status: t.status === 'Suspended' ? 'Active' : 'Suspended' } as Teacher : t);
        //     onUpdateTeachers(updated);
        //     onLogActivity('SUSPEND', 'TEACHERS', `Teacher status changed`);
        //     setToast({ message: "Status updated", type: 'success' });
        // } 
        // else if (pendingAction.type === 'DELETE' && selectedTeacherId) {
        //     onUpdateTeachers(teachers.filter(t => t.id !== selectedTeacherId));
        //     onLogActivity('DELETE', 'TEACHERS', `Deleted teacher record`);
        //     setViewMode('LIST'); setSelectedTeacherId(null);
        //     setToast({ message: "Teacher deleted", type: 'success' });
        // }
        // else if (pendingAction.type === 'PAY_SALARY' && selectedTeacherId) {
        //     const { month, breakdown } = pendingAction.payload;
        //     const updated = teachers.map(t => {
        //         if (t.id === selectedTeacherId) {
        //             const newPayment: PaymentRecord = {
        //                 id: Date.now().toString(),
        //                 date: new Date().toISOString(),
        //                 amount: breakdown.netSalary,
        //                 status: 'Paid',
        //                 month,
        //                 transactionRef: `TXN-${Date.now().toString().slice(-8)}`,
        //                 breakdown
        //             };
        //             setReceiptData({ teacher: t, record: newPayment }); setShowReceipt(true);
        //             return { ...t, paymentHistory: [newPayment, ...(t.paymentHistory || [])] };
        //         }
        //         return t;
        //     });
        //     onUpdateTeachers(updated);
        //     onLogActivity('PAYMENT', 'FINANCE', `Salary paid`);
        // }
        // else if (pendingAction.type === 'VERIFY_DOC' && selectedTeacherId) {
        //      const { docName } = pendingAction.payload;
        //      const updated = teachers.map(t => {
        //          if (t.id !== selectedTeacherId) return t;
        //          const newDocs = t.kyc?.documents.map(d => d.name === docName ? { ...d, status: 'Verified' as const } : d) || [];
        //          return { ...t, kyc: { ...t.kyc, isVerified: newDocs.every(d => d.status === 'Verified'), documents: newDocs } as KYCInfo };
        //      });
        //      onUpdateTeachers(updated);
        //      setToast({ message: `Document verified.`, type: 'success' });
        // }
        // setPendingAction(null);
    };

    // Render Views
    if (viewMode === 'ADD') {
        return (<>
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
                <TeacherForm 
                    onSubmit={(data) => {handleApiCall(data)}} 
                    onCancel={() => setViewMode('LIST')} 
                />
                
            </>
        );
    }

    if (viewMode === 'EDIT' && selectedTeacherId) {
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        return (
            <>
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
                <TeacherForm 
                    initialData={teacher}
                    onSubmit={(data) => {handleApiCall(data)}}
                    onCancel={() => setViewMode('DETAIL')} 
                />
            </>
        );
    }

    if (viewMode === 'DETAIL' && selectedTeacherId) {
        const teacher = teachers.find(t => t.id === selectedTeacherId);
        if (!teacher) return null;
        return (
            <>
                <TeacherDetail 
                    id={selectedTeacherId}
                    teacher={teacher}
                    sections={sections}
                    subjects={subjects}
                    classRooms={classRooms}
                    onBack={() => setViewMode('LIST')}
                    onEdit={() => setViewMode('EDIT')}
                    onUpdateTeacher={(t) => onUpdateTeachers(teachers.map(old => old.id === t.id ? t : old))}
                    onLogActivity={onLogActivity}
                    onTriggerSalary={(data) => { setPayrollData(data); setShowPayrollModal(true); }}
                    onViewReceipt={(record) => { setReceiptData({ teacher, record }); setShowReceipt(true); }}
                    onTriggerSuspend={() => { setPendingAction({ type: 'SUSPEND' }); setShowPinModal(true); }}
                    onTriggerDelete={() => { setPendingAction({ type: 'DELETE' }); setShowPinModal(true); }}
                    onOpenBankModal={() => { setBankForm(teacher.bankDetails || { bankName:'',accountNumber:'',accountName:'' }); setShowBankModal(true); }}
                    onSetToast={setToast}
                    onViewDoc={(doc) => setViewDoc(doc)}
                    onVerifyDoc={(doc) => { setPendingAction({ type: 'VERIFY_DOC', payload: { docName: doc.name } }); setShowPinModal(true); }}
                />
                
                <PayrollCalculator isOpen={showPayrollModal} onClose={() => setShowPayrollModal(false)} data={payrollData} setData={setPayrollData} onAuthorize={() => { setShowPayrollModal(false); setPendingAction({ type: 'PAY_SALARY', payload: { month: payrollData.month, breakdown: { ...payrollData, netSalary: (safeParseFloat(payrollData.baseSalary)+safeParseFloat(payrollData.bonus)-safeParseFloat(payrollData.tax)-safeParseFloat(payrollData.deductions)).toString() } } }); setShowPinModal(true); }} />
                <BankDetailsModal isOpen={showBankModal} onClose={() => setShowBankModal(false)} data={bankForm} setData={setBankForm} onSave={() => { onUpdateTeachers(teachers.map(t => t.id === selectedTeacherId ? { ...t, bankDetails: bankForm } : t)); setShowBankModal(false); setToast({ message: "Bank details saved", type: "success" }); }} />
                {showReceipt && receiptData && <PaymentReceipt data={receiptData} onClose={() => setShowReceipt(false)} />}
                {viewDoc && (
                    <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-4">
                            <div className="flex justify-between mb-4"><h3 className="font-bold">{viewDoc.name}</h3><button onClick={() => setViewDoc(null)}>Close</button></div>
                            <div className="h-64 bg-gray-100 flex items-center justify-center"><i className="fa-regular fa-file-lines text-4xl text-gray-400"></i></div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="animate-fadeIn space-y-6">
            
            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                <div><h2 className="text-xl font-bold text-navy-900">Teacher Dashboard</h2><p className="text-sm text-gray-500">Overview, Attendance & Payroll</p></div>
                <div className="flex flex-wrap gap-3">
                    <div className="flex items-center border border-gray-300 rounded-md bg-gray-50">
                        <button onClick={() => handleDateChange(-1)} className="px-3 py-2 text-gray-500 hover:text-navy-900 border-r"><i className="fa-solid fa-chevron-left"></i></button>
                        <div className="px-3 py-2 text-sm font-semibold text-navy-900 min-w-[180px] text-center">{formattedDateDisplay}</div>
                        <button onClick={() => handleDateChange(1)} className="px-3 py-2 text-gray-500 hover:text-navy-900 border-l"><i className="fa-solid fa-chevron-right"></i></button>
                    </div>
                    <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm font-semibold">{['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}</select>
                    <select value={filterGender} onChange={(e) => setFilterGender(e.target.value as any)} className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm font-semibold"><option value="All">All Genders</option><option value="Male">Male</option><option value="Female">Female</option></select>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase">Total Teachers</p><h3 className="text-2xl font-bold text-navy-900 mt-1">{teachers.length}</h3></div>
                <div onClick={() => setDrillDownType('PRESENT')} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer border-l-4 border-l-green-500"><p className="text-xs font-bold text-gray-400 uppercase">Present Today</p><h3 className="text-2xl font-bold text-green-600 mt-1">{dashboardStats.attendanceList.length}</h3></div>
                <div onClick={() => setDrillDownType('LATE')} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer border-l-4 border-l-orange-500"><p className="text-xs font-bold text-gray-400 uppercase">Late Comers</p><h3 className="text-2xl font-bold text-orange-600 mt-1">{dashboardStats.lateList.length}</h3></div>
                <div onClick={() => setDrillDownType('PAID')} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer border-l-4 border-l-blue-500"><p className="text-xs font-bold text-gray-400 uppercase">Paid ({filterMonth.slice(0,3)})</p><h3 className="text-2xl font-bold text-blue-600 mt-1">{dashboardStats.paidList.length}</h3></div>
                <div onClick={() => setDrillDownType('UNPAID')} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer border-l-4 border-l-red-500"><p className="text-xs font-bold text-gray-400 uppercase">Unpaid</p><h3 className="text-2xl font-bold text-red-600 mt-1">{dashboardStats.unpaidList.length}</h3></div>
            </div>

            {/* List */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6">
                <h2 className="text-lg font-bold text-navy-900">Directory</h2>
                <div className="flex gap-3"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 pr-3 py-2 border rounded-md" /><Button className="w-auto px-4" onClick={() => setViewMode('ADD')}><i className="fa-solid fa-plus mr-2"></i> Onboard</Button></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {teachers.filter(t => (t.title + " "+ t.first_name + ' ' + t.last_name + " " + t.email).toLowerCase().includes(searchTerm.toLowerCase()) && (filterGender === 'All' || t.gender === filterGender.toLowerCase())).map(teacher => (
                    <div key={teacher.id} onClick={ () => { setSelectedTeacherId(teacher.id); setViewMode('DETAIL'); }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center font-bold text-lg border
                                     border-white shadow-sm overflow-hidden">
                                        {teacher.picture ? <img src={urls.BASE_URL+ teacher.picture} alt="" className="w-full h-full object-fit"/> : teacher.first_name[0]}
                                        </div>
                                        <div className="ml-3  ">
                                        <h3 className="font-bold text-navy-900">{teacher.title} {teacher.first_name} {teacher.last_name}</h3>
                                            <p className="text-xs text-gray-500 max-w-full ">{teacher?.email.length < 15 ? teacher?.email : `${teacher?.email.slice(0,5)}****${teacher?.email.slice(-10)}`}</p>
                                    </div></div>
                                <span className={`px-2 py-1 text-xs rounded font-bold ${teacher?.user?.is_active? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{teacher?.user?.is_active? "Active" : "Inactive"}</span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600"><p><i className="fa-solid fa-phone w-5 text-gray-400"></i> {teacher?.phone}</p><p><i className="fa-solid fa-layer-group w-5 text-gray-400"></i> {teacher?.class_room?.length} Classes</p></div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs font-medium"><span className="text-gray-500">ID: {teacher.staff_id}</span><span className="text-navy-600">View Profile <i className="fa-solid fa-arrow-right ml-1"></i></span></div>
                    </div>
                ))}
            </div>

            {/* Drill Down Modal */}

            <Modal isOpen={drillDownType !== null} onClose={() => setDrillDownType(null)} title="Detailed List" icon="fa-solid fa-list">
                <div className="max-h-[60vh] overflow-y-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left text-xs font-bold">Teacher</th><th className="px-4 py-2 text-right text-xs font-bold">Details</th></tr></thead><tbody className="divide-y divide-gray-200">{getDrillDownList().map((t: any) => (<tr key={t.id} onClick={() => { setDrillDownType(null); setSelectedTeacherId(t.id); setViewMode('DETAIL'); }} className="cursor-pointer hover:bg-navy-50"><td className="px-4 py-3"><p className="font-bold text-sm text-navy-900">{t.title} {t.first_name} {t.last_name}</p></td><td className="px-4 py-3 text-right"><span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded">{t.arrivalTime || (t.paymentHistory ? 'Paid' : 'Unpaid')}</span></td></tr>))}</tbody></table></div>
            </Modal>
        </div>
    );
};
