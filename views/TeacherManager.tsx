

import React, { useState, useMemo,useContext,useEffect,useRef } from 'react';
import { Teacher, SchoolSection, Subject, ClassRoom, PaymentRecord, KYCDocument, KYCInfo, ActivityLog } from '../types';
import { Button, PinModal, Toast, Modal, ImageUpload, ImageViewer, Paginator } from '../components/UI';
import { TeacherDetail } from '../components/teachers/TeacherDetail';
import { PayrollCalculator, PaymentReceipt, BankDetailsModal, safeParseFloat } from '../components/teachers/TeacherFinance';
import { TeacherForm } from '@/components/teachers/TeacherForm';
import urls from '@/customHooks/ServerUrls';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import { uiContext } from '@/customContexts/UiContext';

interface TeacherManagerProps {
    onUpdateTeachers: (teachers: Teacher[]) => void;
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

export const TeacherManager: React.FC<TeacherManagerProps> = ({ onUpdateTeachers }) => {
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
    const [pendingAction, setPendingAction] = useState<{ type: 'SUSPEND' | 'DELETE' | "RECORD" |'PAY_SALARY' | 'VERIFY_DOC' | 'ADD-RECORD' | 'UPDATE-RECORD', payload?: any } | null>(null);

    // Modal States
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [payrollData, setPayrollData] = useState({ baseSalary: '', bonus: '0', bonusRemark: '', deductions: '0', deductionRemark: '', tax: '0', month: '' });
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<{ teacher: Teacher, record: PaymentRecord } | null>(null);
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountName: '' });
    const [viewDoc, setViewDoc] = useState<KYCDocument | null>(null);
    let   [serverForm,setServerForm]= useState(new FormData()) // form to handle server data 
    let   [admForm,setAdmForm] = useState({});
    const [recordId,setRecordId] = useState(null);
    const {currentUser} = useContext(authContext);
    const [selectedTeacher,setSelectedTeacher] = useState<any|null>(null)
    const {   selectedSchool,
                setSelectedSchool,
              teachers, setTeachers ,// teachers data
              setToast ,
          } = useContext(uiContext);
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
    // console.log('data: ', data);
    if (data?.success){
        if (data?.success === "searchResults"){
            // only teachers not already in the list of the teachers state will be added to the top of the list 
            let searched = data?.results.filter((res) => !teachers.find(s => s.id === res.id))
            setTeachers((prev) => [...searched,...prev])
            return;
        }
        setToast({ message: data?.success, type: 'success' });

        if (data?.new_teacher){
          setShowPinModal(false);
          setViewMode('LIST');
          setTeachers ([data?.new_teacher,...teachers]);
          setSelectedSchool(s => ({...s,total_teachers: {...s?.total_teachers,count:s?.total_teachers?.count + 1}}))
          return ;
        
        }else if (data?.updated_teacher){
            let u = data?.updated_teacher
          setTeachers(teachers.map(x => x.id === u?.id ? {...x,...u} : x));
          if (selectedTeacher) setSelectedTeacher(t => ({...t,...u})) ;
          setViewMode('DETAIL');
          return 

        }else if (data?.sus_teacher){
            let s = data?.sus_teacher
            let status = s?.is_active
            setTeachers(teachers.map(x => x.id === s?.id ? {...x,is_active:status} : x));
            if (selectedTeacher) setSelectedTeacher(u => ({...u,is_active:status})) ;
            return ;

        }else if (data?.del_teacher){
            setViewMode("LIST") ;
            setTeachers(teachers.filter(x => x.id !== data?.del_teacher.id));
            setSelectedSchool(s => ({...s,total_teachers: {...s?.total_teachers,count:s?.total_teachers?.count - 1}}))
            setSelectedTeacher(null);
            return ;
        
        }else if (data?.new_record){ 
            if (selectedTeacher) setSelectedTeacher(u => {
                return { ...u, disciplinaryRecords: [data?.new_record, ...(u.disciplinaryRecords || [])] };
            }) ;
        }else if (data?.updated_record){
            let ur = data?.updated_record
            if (selectedTeacher) setSelectedTeacher(u => {
                return { ...u, disciplinaryRecords: u?.disciplinaryRecords?.map((rec) => rec.id === ur.id ? {...rec,...ur} :rec) };
            }) ;
        }
    }
  }
    const handleApiCall = (data:any) => {
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
        form.append("address", data.address);
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

        setServerForm(form)  // initialize the server form 
        if (viewMode === "ADD") { 
            sendRequest("/teacher/add-teacher/","POST",form as any ,TriggeredFunc,true,true);
            return ;
        }
        if (!currentUser?.user?.pin_set){ 
        // Make the api call here  when user  need no pin to talk to server 
            if (viewMode === "EDIT") {
                sendRequest(`/teacher/update-teacher/${selectedTeacherId}/`,"PUT",form as any ,TriggeredFunc,true,true)
            }
            return ;
        }
        setShowPinModal(true)
  } 

    // Actions
    const handlePinSuccess = (pins:string) => {
        serverForm.append("pin", pins );
        setShowPinModal(false);
        let admF:any  = admForm
        admF.pin = pins

        // Make the api call here  when user  need no pin to talk to server 
        if (viewMode ===  "ADD") { 
          sendRequest("/teacher/add-teacher/","POST",serverForm as any ,TriggeredFunc,true,true)
        }
        if (viewMode ===  "EDIT") {
          sendRequest(`/teacher/update-teacher/${selectedTeacherId}/`,"PUT",serverForm as any ,TriggeredFunc,true,true)
        }


        if (!pendingAction) return;

        if (pendingAction.type === 'SUSPEND' || pendingAction.type === 'DELETE' && selectedTeacherId) {
            const requestAction = pendingAction.type?.toLowerCase()
            sendRequest(`/teacher/manage-teacher/${selectedSchool?.id}/${selectedTeacherId}/${requestAction}/`,"POST",admF,TriggeredFunc,true,false)
        }
        else if (pendingAction.type === 'ADD-RECORD' || pendingAction.type === 'UPDATE-RECORD' && selectedTeacherId && recordId) {
            if (pendingAction.type === 'ADD-RECORD'){
                sendRequest(`/teacher/teacher-record/${selectedTeacherId}/`,"POST",admForm as any ,TriggeredFunc,true,false)
            }else if (pendingAction.type === 'UPDATE-RECORD'){
                sendRequest(`/teacher/teacher-record/${selectedTeacherId}/${recordId}/`,"PUT",admForm as any ,TriggeredFunc,true,false)
            }
        } 
        
    };
    // ACTIONS
    const triggerSuspend = () => { 
      setPendingAction({ type: 'SUSPEND' }); 
      let adm = {
        school : selectedSchool?.id
      }
      setAdmForm(adm)

      if (!currentUser?.user?.pin_set){
        sendRequest(`/teacher/manage-teacher/${selectedSchool?.id}/${selectedTeacherId}/${'suspend'}/`,"POST",adm as any ,TriggeredFunc,true,false)
        return ;
      }
      setShowPinModal(true) ;
    };

    const triggerDelete = () => { 
      setPendingAction({ type: 'DELETE' }); 
      let adm = {
        school : selectedSchool?.id
      }
      setAdmForm(adm)

      if (!currentUser?.user?.pin_set){
        sendRequest(`/teacher/manage-teacher/${selectedSchool?.id}/${selectedTeacherId}/${'delete'}/`,"POST",adm as any ,TriggeredFunc,true,false)
        return ;
      }
      setShowPinModal(true) 
    };

    const triggerRecord = (form,type:"ADD-RECORD"|"UPDATE-RECORD",record_id ='') => { 
      setPendingAction({ type: type })
      let adm = {
        ...form,
        school : selectedSchool?.id
      }
      setAdmForm(adm)
      setRecordId(record_id);
      if (!currentUser?.user?.pin_set){
        if (type === 'ADD-RECORD'){
            sendRequest(`/teacher/teacher-record/${selectedTeacherId}/`,"POST",adm as any,TriggeredFunc,true,false)
        }else if (type === 'UPDATE-RECORD'){
            sendRequest(`/teacher/teacher-record/${selectedTeacherId}/${recordId}/`,"PUT",adm as any,TriggeredFunc,true,false)
        }
        return ;
      }
      setShowPinModal(true) 
    };

    const filteredTeachers = teachers.filter(t => {
          const matchSearch = (t.title + t.first_name + t.last_name + t?.middle_name + t?.staff_id + t?.phone + t.email ).toLowerCase().includes(searchTerm.toLowerCase());
          const matchGender = filterGender === 'All' || t?.gender?.toLowerCase() === filterGender?.toLowerCase(); ;
          return matchSearch && matchGender ;
      });

      const allowSearch = useRef(true);
      useEffect(() => {
        if (searchTerm.length && !filteredTeachers.length && allowSearch.current) {
          sendRequest(`/teacher/search/teacher/${selectedSchool?.id}/${searchTerm}/`, "GET", null as any , TriggeredFunc, true, false)
          allowSearch.current = false ;
          setTimeout(() => {
            allowSearch.current = true;
          }, 500);
        }
      }, [searchTerm]);
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
        const teacher = selectedTeacher ?? teachers.find(t => t.id === selectedTeacherId);
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

    if (viewMode === 'DETAIL' && selectedTeacherId && selectedTeacher) {
        return (
            <>
                <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
                <TeacherDetail 
                    id={selectedTeacherId}
                    teacher={selectedTeacher}
                    setTeacher={setSelectedTeacher}
                    onBack={() => setViewMode('LIST')}
                    onEdit={() => setViewMode('EDIT')}
                    // onUpdateTeacher={(t) => onUpdateTeachers(teachers.map(old => old.id === t.id ? t : old))}
                    onTriggerSalary={(data) => { setPayrollData(data); setShowPayrollModal(true);}}
                    onViewReceipt={(record) => { setReceiptData({ selectedTeacher, record }); setShowReceipt(true); }}
                    onTriggerSuspend={ triggerSuspend }
                    onTriggerDelete= { triggerDelete }
                    onOpenBankModal={() => { setBankForm(selectedTeacher?.bankDetails || { bankName:'',accountNumber:'',accountName:'' }); setShowBankModal(true); }}
                    onViewDoc={(doc) => setViewDoc(doc)}
                    onVerifyDoc={(doc) => { setPendingAction({ type: 'VERIFY_DOC', payload: { docName: doc.name } }); setShowPinModal(true); }}
                    triggerRecord = { triggerRecord }
                />
                
                <PayrollCalculator isOpen={showPayrollModal} onClose={() => setShowPayrollModal(false)} data={payrollData} setData={setPayrollData} onAuthorize={() => { setShowPayrollModal(false); setPendingAction({ type: 'PAY_SALARY', payload: { month: payrollData.month, breakdown: { ...payrollData, netSalary: (safeParseFloat(payrollData.baseSalary) + safeParseFloat(payrollData.bonus)-safeParseFloat(payrollData.tax)-safeParseFloat(payrollData.deductions)).toString() } } }); setShowPinModal(true); }} />
                <BankDetailsModal isOpen={showBankModal} onClose={() => setShowBankModal(false)} data={bankForm} setData={setBankForm} onSave={() => { onUpdateTeachers(teachers.map(t => t.id === selectedTeacherId ? { ...t, bankDetails: bankForm } : t)); setShowBankModal(false); }} />
                
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
        <div className="">
            {selectedSchool?.total_teachers?.count && <Paginator 
                currentLength={selectedSchool?.total_teachers?.count }
                setData={setTeachers}
                filteredData={filteredTeachers}
                schoolId = {selectedSchool?.id}
                url={`/teacher/all-teachers/${selectedSchool?.id}/`}
                sendRequest={sendRequest}
            />}
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
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm"><p className="text-xs font-bold text-gray-400 uppercase">Total Teachers</p><h3 className="text-2xl font-bold text-navy-900 mt-1">{selectedSchool?.total_teachers?.count}</h3></div>
                    <div onClick={() => setDrillDownType('PRESENT')} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer border-l-4 border-l-green-500"><p className="text-xs font-bold text-gray-400 uppercase">Present Today</p><h3 className="text-2xl font-bold text-green-600 mt-1">{dashboardStats.attendanceList.length}</h3></div>
                    <div onClick={() => setDrillDownType('LATE')} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer border-l-4 border-l-orange-500"><p className="text-xs font-bold text-gray-400 uppercase">Late Comers</p><h3 className="text-2xl font-bold text-orange-600 mt-1">{dashboardStats.lateList.length}</h3></div>
                    <div onClick={() => setDrillDownType('PAID')} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer border-l-4 border-l-blue-500"><p className="text-xs font-bold text-gray-400 uppercase">Paid ({filterMonth.slice(0,3)})</p><h3 className="text-2xl font-bold text-blue-600 mt-1">{dashboardStats.paidList.length}</h3></div>
                    <div onClick={() => setDrillDownType('UNPAID')} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer border-l-4 border-l-red-500"><p className="text-xs font-bold text-gray-400 uppercase">Unpaid</p><h3 className="text-2xl font-bold text-red-600 mt-1">{dashboardStats.unpaidList.length}</h3></div>
                </div>

                {/* List */}
                <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 mt-6">
                    <h2 className="text-lg font-bold text-navy-900">Directories</h2>
                    <div className="flex gap-3"><input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-3 pr-3 py-2 border rounded-md" /><Button className="w-auto px-4" onClick={() => setViewMode('ADD')}><i className="fa-solid fa-plus mr-2"></i> Onboard</Button></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6"> 
                {(filteredTeachers.length > 0) && filteredTeachers?.map(teacher => (
                        <div key={teacher.id} onClick={ () => { setSelectedTeacherId(teacher.id);setSelectedTeacher(teacher) ;setViewMode('DETAIL'); }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center font-bold text-lg border
                                        border-white shadow-sm overflow-hidden">
                                            {teacher?.picture ? <img src={urls.BASE_URL+ teacher?.picture} alt="" className="w-full h-full object-fit"/> : teacher.first_name[0]}
                                            </div>
                                            <div className="ml-3  ">
                                            <h3 className="font-bold text-navy-900">{teacher.title} {teacher.first_name} {teacher.last_name}</h3>
                                                <p className="text-xs text-gray-500 max-w-full ">{teacher?.email?.length < 15 ? teacher?.email : `${teacher?.email?.slice(0,5)}****${teacher?.email?.slice(-10)}`}</p>
                                        </div></div>
                                    <span className={`px-2 py-1 text-xs rounded font-bold ${teacher?.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{teacher?.is_active? "Active" : "Inactive"}</span>
                                </div>
                                <div className="space-y-2 text-sm text-gray-600"><p><i className="fa-solid fa-phone w-5 text-gray-400"></i> {teacher?.phone}</p><p><i className="fa-solid fa-layer-group w-5 text-gray-400"></i> {teacher?.class_rooms?.length || "N/A"} Classe(s)</p></div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs font-medium"><span className="text-gray-500">ID: {teacher.staff_id}</span><span className="text-navy-600">View Profile <i className="fa-solid fa-arrow-right ml-1"></i></span></div>
                        </div>
                    ))}
                    {(filteredTeachers.length === 0) && 
                    <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="w-100 px-6 py-8 text-center text-md text-gray-500">No teachers found matching filters.</div>
                    </div>
                    }
                </div>

                {/* Drill Down Modal */}

                <Modal isOpen={drillDownType !== null} onClose={() => setDrillDownType(null)} title="Detailed List" icon="fa-solid fa-list">
                    <div className="max-h-[60vh] overflow-y-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left text-xs font-bold">Teacher</th><th className="px-4 py-2 text-right text-xs font-bold">Details</th></tr></thead><tbody className="divide-y divide-gray-200">{getDrillDownList().map((t: any) => (<tr key={t.id} onClick={() => { setDrillDownType(null); setSelectedTeacherId(t.id); setViewMode('DETAIL'); }} className="cursor-pointer hover:bg-navy-50"><td className="px-4 py-3"><p className="font-bold text-sm text-navy-900">{t.title} {t.first_name} {t.last_name}</p></td><td className="px-4 py-3 text-right"><span className="font-mono text-xs font-bold bg-gray-100 px-2 py-1 rounded">{t.arrivalTime || (t.paymentHistory ? 'Paid' : 'Unpaid')}</span></td></tr>))}</tbody></table></div>
                </Modal>
            </div>
        </div>
    );
};
