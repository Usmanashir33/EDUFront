
import React, { useState, useMemo ,useContext,useRef,useEffect} from 'react';
import { Staff, PaymentRecord, KYCDocument, KYCInfo,  } from '../types';
import { Button, PinModal, Modal, Paginator } from '../components/UI';
import { StaffForm } from '@/components/staffs/StaffForm';
import { StaffDetail } from '../components/staffs/StaffDetail';
import { PayrollCalculator, PaymentReceipt, BankDetailsModal, safeParseFloat } from '../components/staffs/StaffFinance';
import { authContext } from '@/customContexts/AuthContext';
import { uiContext } from '@/customContexts/UiContext'; 
import useRequest from '@/customHooks/RequestHook';
import urls from '@/customHooks/ServerUrls';

interface StaffManagerProps {
  staff: Staff[];
}

type ViewMode = 'LIST' | 'DETAIL' | 'ADD' | 'EDIT';
type DrillDownType = 'LATE' | 'PAID' | 'UNPAID' | null;

// Mock Helper for Attendance
const getMockAttendance = (staffId: string, dateStr: string) => {
    const hash = (staffId.charCodeAt(0) + new Date(dateStr).getDate()) % 10;
    if (hash === 0) return null; // Absent
    let hour = 7;
    let minute = 0;
    if (hash <= 3) { hour = 8; minute = hash * 15; } 
    else { hour = 7; minute = hash * 8; }
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} AM`;
};

export const StaffManager: React.FC<StaffManagerProps> = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedStaff,setselectedStaff] = useState<any|null>(null)
  const [searchTerm, setSearchTerm] = useState('');
  let [serverForm,setServerForm]= useState(new FormData()) // form to handle server data 
  let [admForm,setAdmForm] = useState({});
  
  const {currentUser} = useContext(authContext) ;
  const { 
      selectedSchool,setSelectedSchool,
      staffs, setStaffs, // staff data
      setToast,roles
  } = useContext(uiContext) ;
  const {sendRequest} = useRequest() ;
  
  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
  const [filterDept, setFilterDept] = useState<"All" | any >('All');
  const [filterGender, setFilterGender] = useState<'All' | 'male' | "other"|'female'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | "active" | "inactive">('All');
  
  const resetFilter = () => {
    setFilterDept("All");
    setFilterGender("All");
    setFilterStatus("All");
  }
  
  // DrillDown
  const [drillDownType, setDrillDownType] = useState<DrillDownType>(null);

  // Security & Toast
  const [showPinModal, setShowPinModal] = useState(false);
  type PTYPES = 'SUSPEND' | 'DELETE' | 'PAY_SALARY' | 'VERIFY_DOC' | "EDIT_USER_ROLE"
  const [pendingAction, setPendingAction] = useState<{ type: PTYPES, payload?: any } | null>(null);

  // Modal States
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [payrollData, setPayrollData] = useState({ baseSalary: '', bonus: '0', bonusRemark: '', deductions: '0', deductionRemark: '', tax: '0', month: '' });
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<{ staff: Staff, record: PaymentRecord } | null>(null);
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountName: '' });
  const [viewDoc, setViewDoc] = useState<KYCDocument | null>(null);

  const dep = ['All', ...Array.from(new Set(staffs.map(s => s.activity_role?.role || 'academic')))];
  const rols = [...Array.from(new Set(roles.map(s => s.name)))];
  let departments =[...dep,...rols] ;

  // Date Navigation
  const handleDateChange = (offset: number) => {
    const date = new Date(filterDate);
    date.setDate(date.getDate() + offset);
    setFilterDate(date.toISOString().split('T')[0]);
  };
  const formattedDateDisplay = new Date(filterDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Stats
  const dashboardStats = useMemo(() => {
     const attendanceList = staffs.map(s => ({ ...s, arrivalTime: getMockAttendance(s.id, filterDate) })).filter(s => s.arrivalTime !== null);
     const lateList = attendanceList.filter(s => parseInt(s.arrivalTime!.split(':')[0]) >= 8);
     const paidList = staffs.filter(s => s.paymentHistory?.some(p => p.month === filterMonth && p.status === 'Paid'));
     const unpaidList = staffs.filter(s => !s.paymentHistory?.some(p => p.month === filterMonth && p.status === 'Paid'));
     return { attendanceList, lateList, paidList, unpaidList };
  }, [staffs, filterDate, filterMonth]);
  

  const getDrillDownList = () => {
    switch(drillDownType) {
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
            // only students not already in the list of the students 
            let searched = data?.results.filter((res) => !staffs.find(s => s.id === res.id))
            setStaffs((prev) => [...searched,...prev])
            return;
        }
        setToast({ message: data?.success, type: "success" });
        if (data?.new_staff){
            setStaffs([ data?.new_staff,...staffs]);
            setSelectedSchool(s => ({...s,total_staffs: {...s?.total_staffs,count:s?.total_staffs?.count + 1}}))
            setViewMode('LIST') ;

        }else if (data?.updated_staff){
          let u = data?.updated_staff
          setStaffs(staffs.map(x => x.id === u?.id ? {...x,...u} : x));
          if (selectedStaff) setselectedStaff(t => ({...t,...u})) ;
          setViewMode('DETAIL');
          return 

        }else if (data?.sus_staff){
            let s = data?.sus_staff
            let status = s?.is_active
            setStaffs(staffs.map(x => x.id === s?.id ? {...x,is_active:status} : x));
            if (selectedStaff) setselectedStaff(u => ({...u,is_active:status})) ;
            return ;

        }else if (data?.del_staff){
          setViewMode('LIST');
          setStaffs(staffs.filter(x => x.id !== data?.del_staff.id)) ;
          setSelectedSchool(s => ({...s,total_staffs: {...s?.total_staffs,count:s?.total_staffs?.count - 1}}))

        }
    }
  }
  const onServerSave = (name:string, action:string, formData:any) => {
    // console.log('formData: ', formData);
      if (name === 'ROLE_USER' && action === 'EDIT') {
        if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
          sendRequest(`/staff/manage-staff-role/${formData.staffId}/`,"PUT",formData as any,TriggeredFunc,true,false)
          return ;
        }
      }
      setPendingAction({type:"EDIT_USER_ROLE",payload:formData.staffId})
      setServerForm(formData)
      setShowPinModal(true) ;
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
    form.append("gender", data.gender?.toLowerCase());
    form.append("school", selectedSchool?.id);
    form.append("date_of_birth", data.dateOfBirth);
    form.append("nin", data.nin);
    form.append("address", data.address);
    form.append("salary", data.salary);

    // Image file only if selected
    if (data.picture instanceof File) {
      form.append("picture", data.picture);
    }
    // ManyToMany → append each classroom id
    form.append("activity_role", JSON.stringify({
        "role": data?.activityRole?.role,
        "rank": data?.activityRole?.rank,
        "active": data?.activityRole?.active,
        "description": data?.activityRole?.description
    }));

    form.append("bank_details", JSON.stringify({
      "bank_name":data?.bankDetails?.bankName,
      "account_name":data?.bankDetails?.accountName,
      "account_number":data?.bankDetails?.accountNumber,
    }));

    setServerForm(form)  // initialize the server form 
    if (viewMode === "ADD") { 
      sendRequest("/staff/add-staff/","POST",form as any,TriggeredFunc,true,true);
      return ;
    }
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
        if (viewMode === "EDIT") {
          sendRequest(`/staff/update-staff/${selectedStaffId}/`,"PUT",form as any,TriggeredFunc,true,true)
        }
        return 
    }
    setShowPinModal(true) ;
  }
  // Actions
  const handlePinSuccess = (pins:any) => {
    try {
      serverForm.append("pin", pins );
    }catch{

    }

        setShowPinModal(false);
        // Make the api call here  when user  need no pin to talk to server 
        if (viewMode === "ADD") { 
          sendRequest("/staff/add-staff/","POST",serverForm as any ,TriggeredFunc,true,true)
        }
        if (viewMode === "EDIT") {
          sendRequest(`/staff/update-staff/${selectedStaffId}/`,"PUT",serverForm as any ,TriggeredFunc,true,true)
        }
    if (!pendingAction) return;
    if (pendingAction.type === 'SUSPEND' || pendingAction.type === 'DELETE' && selectedStaffId) {
      let admF:any = admForm
        admF.pin = pins
      const requestAction = pendingAction.type?.toLowerCase()
      sendRequest(`/staff/manage-staff/${selectedStaffId}/${requestAction}/`,"POST",admF as any,TriggeredFunc,true,false)
      return ;
    } 
    if (pendingAction.type === "EDIT_USER_ROLE"){
      let f:any = {...serverForm,pin:pins}
      sendRequest(`/staff/manage-staff-role/${f.staffId}/`,"PUT",f as any,TriggeredFunc,true,false);
      return ;
    }

  };
  // ACTIONS
    const triggerSuspend = () => { 
      setPendingAction({ type: 'SUSPEND' }); 
      let form ={
        school : selectedSchool?.id
      }
      setAdmForm(form)

      if (!currentUser?.user?.pin_set){
        sendRequest(`/staff/manage-staff/${selectedStaffId}/${'suspend'}/`,"POST",form as any,TriggeredFunc,true,false)
        return ;
      }
      setShowPinModal(true) ;
    };

    const triggerDelete = () => { 
      setPendingAction({ type: 'DELETE' }); 
      let form ={
        school :selectedSchool?.id
      }
      setAdmForm(form)
      if (!currentUser?.user?.pin_set){
        sendRequest(`/staff/manage-staff/${selectedStaffId}/${'delete'}/`,"POST",form as any,TriggeredFunc,true,false)
        return ;
      }
      setShowPinModal(true) 
    };

    const filteredStaffs = staffs.filter(t => {
              let status = ( filterStatus  == "active") ? true :false
              const matchSearch = (t.title + t.first_name + t.last_name + t.middle_name + t.phone + t.staff_id + t.email).toLowerCase().includes(searchTerm.toLowerCase());
              const matchGender = filterGender === 'All' || t.gender?.toLowerCase() === filterGender?.toLowerCase() ;
              const matchActivity = filterDept  === 'All' || t?.activity_role?.role === filterDept || roles.find((r:any) => r.name === filterDept && r.id === t?.school_role) ;
              const matchStatus = filterStatus === 'All' || t?.is_active === status ;
              return matchSearch && matchActivity  && matchGender && matchStatus ;
          });
        
      const allowSearch = useRef(true);
      useEffect(() => {
            if (searchTerm.length && !filteredStaffs.length && allowSearch.current) {
              sendRequest(`/staff/search/staff/${selectedSchool?.id}/${searchTerm}/`, "GET", null as any, TriggeredFunc, true, false)
              allowSearch.current = false;
              setTimeout(() => {
                allowSearch.current = true;
              }, 500);
            }
      }, [searchTerm]);
  // Render Views
  if (viewMode === 'ADD') {
      return (
        <>
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
                <StaffForm 
                    onCancel={() => setViewMode('LIST')} 
                    onSubmit={(data:any) => {handleApiCall(data)}}
                /> 
        </>
      ); 
  }

  if (viewMode === 'EDIT' && selectedStaffId && selectedStaff) { 
      return (
        <>
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
                <StaffForm 
                    initialData={selectedStaff} 
                    onCancel={() => setViewMode('DETAIL')} 
                    onSubmit={(data:any) => {handleApiCall(data)}}
                /> 
            
        </>
      ); 
  }

  if (viewMode === 'DETAIL' && selectedStaffId && selectedStaff) {
      return (
        <>
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
            <StaffDetail 
                id={selectedStaffId}
                staff={selectedStaff} 
                setStaff={setselectedStaff} 
                onBack={() => setViewMode('LIST')}
                onEdit={() => setViewMode('EDIT')}
                onTriggerSalary={(data) => { setPayrollData(data); setShowPayrollModal(true); }}
                onViewReceipt={(record) => { setReceiptData({ staff: selectedStaff, record }); setShowReceipt(true); }}
                onTriggerSuspend={triggerSuspend}
                onTriggerDelete={triggerDelete}
                onOpenBankModal={() => { setBankForm(selectedStaff?.bank_details || { bankName:'',accountNumber:'',accountName:'' }); setShowBankModal(true); }}
                onServerSave={onServerSave}
                onViewDoc={(doc) => setViewDoc(doc)}
                onVerifyDoc={(doc) => { setPendingAction({ type: 'VERIFY_DOC', payload: { docName: doc.name } }); setShowPinModal(true); }}
            />
            
            <PayrollCalculator isOpen={showPayrollModal} onClose={() => setShowPayrollModal(false)} data={payrollData} setData={setPayrollData} onAuthorize={() => { setShowPayrollModal(false); setPendingAction({ type: 'PAY_SALARY', payload: { month: payrollData.month, breakdown: { ...payrollData, netSalary: (safeParseFloat(payrollData.baseSalary)+safeParseFloat(payrollData.bonus)-safeParseFloat(payrollData.tax)-safeParseFloat(payrollData.deductions)).toString() } } }); setShowPinModal(true); }} />
            <BankDetailsModal isOpen={showBankModal} onClose={() => setShowBankModal(false)} data={bankForm} setData={setBankForm} onSave={() => { setStaffs(staffs.map(s => s.id === selectedStaffId ? { ...s, bankDetails: bankForm } : s)); setShowBankModal(false); setToast({ message: "Bank details saved", type: "success" }); }} />
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
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
    <>
      {selectedSchool?.total_staffs?.count && <Paginator

          currentLength={selectedSchool?.total_staffs?.count}
          setData={setStaffs}
          filteredData={filteredStaffs}
          schoolId = {selectedSchool?.id}
          url={`/staff/all-staffs/${selectedSchool?.id}/`} 
          sendRequest={sendRequest}
      /> }
      <div className="animate-fadeIn space-y-6">
        {/* {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />} */}
        
        {/* Header & Filters */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
              <div><h2 className="text-xl font-bold text-navy-900">Staff Management</h2><p className="text-sm text-gray-500">Overview, Attendance & Payroll</p></div>
              <div className="flex flex-wrap gap-3">
                  <div className="flex items-center border border-gray-300 rounded-md bg-gray-50">
                      <button onClick={() => handleDateChange(-1)} className="px-3 py-2 text-gray-500 hover:text-navy-900 border-r"><i className="fa-solid fa-chevron-left"></i></button>
                      <div className="px-3 py-2 text-sm font-semibold text-navy-900 min-w-[180px] text-center">{formattedDateDisplay}</div>
                      <button onClick={() => handleDateChange(1)} className="px-3 py-2 text-gray-500 hover:text-navy-900 border-l"><i className="fa-solid fa-chevron-right"></i></button>
                  </div>
                  <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                      <span className="text-xs font-bold text-gray-500 mr-2 uppercase">Month:</span>
                      <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent text-sm font-semibold text-navy-900 outline-none">{['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}</select>
                  </div>
              </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><p className="text-xs font-bold text-gray-400 uppercase">Total Staff</p><h3 className="text-2xl font-bold text-navy-900">{staffs?.length}</h3></div>
          <div onClick={() => setDrillDownType('LATE')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-orange-500"><div className="flex justify-between"><div><p className="text-xs font-bold text-gray-400 uppercase">Late Today</p><h3 className="text-2xl font-bold text-orange-600">{dashboardStats.lateList.length}</h3></div><i className="fa-solid fa-clock text-orange-100 text-3xl"></i></div></div>
          <div onClick={() => setDrillDownType('PAID')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-green-500"><div className="flex justify-between"><div><p className="text-xs font-bold text-gray-400 uppercase">Paid ({filterMonth.slice(0,3)})</p><h3 className="text-2xl font-bold text-green-600">{dashboardStats.paidList.length}</h3></div><i className="fa-solid fa-money-bill text-green-100 text-3xl"></i></div></div>
          <div onClick={() => setDrillDownType('UNPAID')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-red-500"><div className="flex justify-between"><div><p className="text-xs font-bold text-gray-400 uppercase">Unpaid</p><h3 className="text-2xl font-bold text-red-600">{dashboardStats.unpaidList.length}</h3></div><i className="fa-solid fa-triangle-exclamation text-red-100 text-3xl"></i></div></div>
        </div>

        {/* List Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
          <div className="flex gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-64"><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i><input type="text" placeholder="Search staff..." className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:border-navy-900" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/></div>
              <select className="border rounded-md px-3 py-2 bg-white" value={filterDept} onChange={e => {setFilterDept(e.target.value)}}>{
              departments.map(
                (d: any,index) => 
                <option key={`dep${index}`} value={d}>{d === 'All' ? 'All Roles' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
                )}</select>
              <select value={filterGender} onChange={(e) => setFilterGender(e.target.value as any)} className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm font-semibold"><option value="All">All Genders</option><option value="Male">Male</option><option value="Female">Female</option></select>
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)} className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-sm font-semibold"><option value="All">All Statuses</option><option value={'active'}>Active</option><option value={'inactive'}>Inactive</option></select>

          </div>
          <Button className="w-auto px-6" onClick={() => setViewMode('ADD')}><i className="fa-solid fa-plus mr-2"></i> Add Staff</Button>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(filteredStaffs.length === 0) && 
          <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="w-100 px-6 py-8 text-center text-md text-gray-500">No staff found matching filters.</div>
          </div>
          }
          {(filteredStaffs.length !== 0) && filteredStaffs?.map(s => {
            let schoolRole = roles?.filter(r => r.id === s?.school_role) || [] ;
            return (
            <div key={s.id} onClick={() => { setSelectedStaffId(s.id);setselectedStaff(s); setViewMode('DETAIL'); }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group cursor-pointer hover:-translate-y-1">
              <div className="p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-lg border border-white shadow-sm overflow-hidden">{s.picture ? <img src={urls.BASE_URL + s.picture} alt="" className="w-full h-full object-cover"/> : `${s.first_name[0]}${s.last_name[0]}`}</div>
                <div className="flex-1">
                    <div className="flex justify-between items-start"><h3 className="font-bold text-navy-900 group-hover:text-gold-600 transition-colors">{s.title} {s.first_name} {s.last_name}</h3><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.is_active ? 'Active' : 'Inactive'}</span></div>
                    <p className="text-xs text-navy-500 font-bold uppercase mb-1">{s.role}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 capitalize"><i className="fa-solid fa-layer-group"></i> {s.activity_role?.role || 'Staff'}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-2 mt-1"><i className="fa-solid fa-phone"></i> {s.phone}</p>
                    <div  className="flex gap-2 mt-2 flex-wrap ">
                      {schoolRole.map(r => {return (
                          <span key={r.id} className="bg-navy-100 text-navy-800 text-xs font-bold px-1 py-1  rounded-md border border-navy-200 ">
                              <i className="fa-solid fa-shield-cat mr-1 opacity-50"></i> {r.name}
                          </span>
                      )})}
                    </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs"><span className="font-mono text-gray-400">{s.staff_id}</span><span className="text-navy-600 font-bold hover:underline">View Profile <i className="fa-solid fa-arrow-right ml-1"></i></span></div>
            </div>
          )})}
          
        </div>

        {/* Drill Down Modal */}
        <Modal isOpen={drillDownType !== null} onClose={() => setDrillDownType(null)} title="Detailed List" icon="fa-solid fa-list">
              <div className="max-h-[60vh] overflow-y-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left text-xs font-bold">Staff</th><th className="px-4 py-2 text-right text-xs font-bold">{drillDownType === 'LATE' ? 'Time In' : 'Status'}</th></tr></thead><tbody className="divide-y divide-gray-200">{getDrillDownList().map((s: any) => (<tr key={s.id} onClick={() => { setDrillDownType(null); setSelectedStaffId(s.id);setselectedStaff(s); setViewMode('DETAIL'); }} className="cursor-pointer hover:bg-navy-50"><td className="px-4 py-3"><p className="font-bold text-sm text-navy-900">{s.first_name} {s.last_name}</p><p className="text-xs text-gray-500 capitalize">{s.activityRole?.role}</p></td><td className="px-4 py-3 text-right">{drillDownType === 'LATE' ? <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">{s.arrivalTime}</span> : <span className="text-xs font-bold px-2 py-1 rounded uppercase bg-green-100 text-green-700">Paid</span>}</td></tr>))}</tbody></table></div>
          </Modal>
      </div>
    </>

  );
};
