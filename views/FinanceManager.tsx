import React, { useState, useMemo, useRef, useContext,useEffect  } from 'react';
import { Student, Teacher, Staff, Transaction, FeeRecord, ClassFeeSetting, ParentPaymentInitiation } from '../types';
import { FadeIn, Modal, Button, PinModal, ImageUpload, ImageViewer } from '../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import { Star } from 'lucide-react';
import FeeManager from '@/components/settings/FeeManager';
import PaymentPage from '@/components/finance/PaymentSection';
import StudentLedger from '@/components/finance/StudentLedger';
import PaymentDetails from '@/components/finance/PaymentDetails';
import SearchPayment from '@/components/finance/SearchPayments';
import urls from '@/customHooks/ServerUrls';

interface FinanceManagerProps {
    personalMode?: boolean; // New Prop
   
}

type FinanceTab = 'OVERVIEW' | 'PAYROLL' | 'TRANSACTIONS' | 'PAYMENT' | 'PAYMENT_VALIDATION' | "SEARCH";
type FeeStatusDrillDown = 'PAID' | 'PARTIAL' | 'UNPAID' | null;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export const FinanceManager: React.FC<FinanceManagerProps> = ({ 
    personalMode = false, 
     
}) => {
    const [serverForm,setServerForm] = useState<{}|any>({});
    const {sendRequest} = useRequest();
    const {
        setToast,
        students,
        setStudents ,
        teachers,
        parents,
        selectedSchool,
        finances,   
        setSchoolFees,
        schoolFees,
        isLoading,
        classRooms,
        pendingPayments,
        setPendingPayments

    } = useContext(uiContext);

    const defaultBank = finances?.bank_accounts?.find(acc => acc.is_default && acc.is_active ) || null;
    const {currentUser} = useContext(authContext);
    const sessions = selectedSchool?.sessions || [];
    const terms = selectedSchool?.terms || [];
    const currentUserRole = currentUser?.role || 'director';
    const currentUserId = currentUser?.user?.id || '';

    const [activeTab, setActiveTab] = useState<FinanceTab>(   //for both parent and personal modes, default to overview/dashboard
        currentUserRole === 'parent' ? 'PAYMENT' : (personalMode ? 'OVERVIEW' : 'OVERVIEW')
    );
    
    const prepareImageUrl = (image, backendUrl = "") => {

    if (!image) return null

    // Uploaded file instance
    if (image instanceof File) {
        return URL.createObjectURL(image)
    }

    // Already full URL
    if (
        typeof image === "string" &&
        (image.startsWith("http://") ||
         image.startsWith("https://") ||
         image.startsWith("blob:"))
    ) {
        return urls.BASE_URL + image
    }

    // Backend relative path
    if (typeof image === "string") {
        return `${backendUrl}${image}`
    }

    // DRF image object
    if (image?.url) {
        return `${backendUrl}${image.url}`
    }

    return null
}
    const [selectedTerm, setSelectedTerm] = useState<string>('');
    const [selectedSession, setSelectedSession] = useState<string>('');

    const [drillDownStatus, setDrillDownStatus] = useState<FeeStatusDrillDown>("PAID");

    // Fee Management State

    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [editingFeeId, setEditingFeeId] = useState<string | null>(null);

    // Director Payment State
    // const [isDirectorPaymentModalOpen, setIsDirectorPaymentModalOpen] = useState(false);
    const [isStudentSelectionModalOpen,setIsStudentSelectionModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Parent Payment State
    const [paymentStudents, setPaymentStudents] = useState<string[]>([]);
    const [paymentNote, setPaymentNote] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<"TRANSFER"|"CASH"|"WALLET">('CASH');
    const [paymentPhone, setPaymentPhone] = useState('');
    const [paymentAccount, setPaymentAccount] = useState('');
    const [paymentBankName, setPaymentBankName] = useState('');
    const [paymentReceipt, setPaymentReceipt] = useState('');
    const [useWallet, setUseWallet] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCouponDiscount, setAppliedCouponDiscount] = useState(0);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [isPaymentFormModalOpen, setIsPaymentFormModalOpen] = useState(false);
    const [historyPayment,setHistoryPayment] = useState()

    const currentParent = parents?.find(p => p.id === currentUserId) || parents?.[0] || { walletBalance: 0 };
    const walletBalance = currentParent.walletBalance || 0;

    // Validation State
    const [pinModalOpen, setPinModalOpen] = useState(false);
    const [actionToValidate, setActionToValidate] = useState<{type: 'APPROVE' | 'REJECT' | 'SUBMIT_PAYMENT' | 'SAVE_FEE_SETTING'| 'UPDATE_FEE_SETTING'|'DELETE_FEE_SETTING' | 'APPROVE_BULK' | 'REJECT_BULK', id: string} | null>(null);
    const [selectedPendingPayments, setSelectedPendingPayments] = useState<string[]>([]);

    const [ledgerStudentId, setLedgerStudentId] = useState<string | null>(null);
    const [ledgerDateFilter, setLedgerDateFilter] = useState('');
    const [receiptImageToView, setReceiptImageToView] = useState<string | null>(null);

    // Validation Tabs State
    const [validationTab, setValidationTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
    const [rejectionNote, setRejectionNote] = useState('');
    const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

    const [currentTermRecords,setCurrentTermRecords] = useState()

    const totalPendingPayments = useMemo(() => {
        if (!pendingPayments?.length) return ;
        let count = pendingPayments.filter(p => p.status === "PENDING")
        return count.length || 0 
    },[pendingPayments])

    const studentsPaymentAmount = useMemo(() => {
    if (!paymentStudents?.length) return 0;

    let totalSum =  students
        .filter(s => paymentStudents.includes(s.id))
        .reduce((total, student) => {

            const activeClasses = student.active_class_rooms || [];
            const studentFee = schoolFees
                .filter(fee =>
                    fee.class_rooms.some(classId => activeClasses.includes(classId))
                )
                .reduce((sum, fee) => sum + Number(fee.amount || 0), 0);
            return total + studentFee;

        }, 0);
        return totalSum ;

    }, [paymentStudents, students, schoolFees]);
    
    const TriggeredFunc = (resp) => {
        console.log('resp: ', resp);
        setActionToValidate(null);
        if (resp?.new_school_fees){
            setIsFeeModalOpen(false);
            setEditingFeeId(null);
            setSelectedClasses([]);
            setSchoolFees(prev => [...prev, resp.new_school_fees]);
            setToast({ type: 'success', message: resp?.success });
            return
        }
        if (resp?.dashbordData){
            setCurrentTermRecords(resp?.dashbordData)
            return
        }
        if (resp?.updated_school_fees){
            setIsFeeModalOpen(false);
            setEditingFeeId(null);
            setSelectedClasses([]);
            setSchoolFees(prev => prev.map(fs => fs.id === resp.updated_school_fees.id ? resp.updated_school_fees : fs));
            setToast({ type: 'success', message: resp?.success });
            return
        }
        if (resp?.deleted_school_fees){
            setIsDeleteModalOpen(false);
            setEditingFeeId(null);
            setSchoolFees(prev => prev.filter(fs => fs.id !== resp.deleted_school_fees.id));
            setToast({ type: 'success', message: resp?.success });
            return
        }
        if (resp?.allPayments){
            setPendingPayments(resp?.allPayments)
            return
        }
        if (resp?.approvedPayments){
            setActionToValidate(null);
            setPendingPayments((prev) => prev.map(p => resp?.approvedPayments?.includes(p.id)? {...p ,status : "APPROVED"} : p ))
            return
        }
        if (resp?.rejectedPayments){
            setIsRejectionModalOpen(false);
            setRejectionNote('');
            setActionToValidate(null);
            setPendingPayments((prev) => prev.map(p => resp?.rejectedPayments?.includes(p.id)? {...p ,status : "REJECTED"} : p ))
            return
        }
        if (resp?.newPendingPayment){
            setPendingPayments(prev => [resp?.newPendingPayment,...prev])
            setIsPaymentFormModalOpen(false);
            setIsStudentSelectionModalOpen(false);
            setEditingFeeId(null);
            setPaymentStudents([]);
            setPaymentPhone('');
            setPaymentAccount('');
            setPaymentReceipt('');
            setPaymentAmount('');
            setUseWallet(false);
            setCouponCode('');
            setAppliedCouponDiscount(0);
            setPaymentStudents([]);
            setToast({ type: 'success', message: resp?.success });
            return
        }
        
    }

    const handlePayment = () => {
        let termId = selectedSchool.terms.find(t => t.is_current)?.id
        let sessionId = selectedSchool.sessions.find(t => t.is_current)?.id
        
        let directorValidation =  paymentAmount ;
        let parsonalValidation = (!paymentPhone || !paymentAccount || !paymentBankName  || !paymentAmount) ;
        
        // console.log('currentUser?.role?.toLowerCase(): ', currentUser?.role?.toLowerCase());
        if (((currentUser?.role?.toLowerCase() === "director") && !directorValidation)) return (
                setToast({type:"error",message:"Please fill amount fields"})
            )
        if (((currentUser?.role?.toLowerCase() !== "director") && !parsonalValidation)) return (
                setToast({type:"error",message:"Please fill all fields"})
            )

        const amount = parseFloat(paymentAmount);
        if (isNaN(amount) || amount <= 0) return (
            setToast({type:"error",message:"invalid amount"})
        );
        if ((currentUser?.role?.toLowerCase() !== "director")){
            // return 
        }
        // director actions  process form 
        let form = new FormData()
        form.append("school",selectedSchool?.id)
        form.append("students",JSON.stringify(paymentStudents))
        form.append("total_amount",`${amount}`)
        form.append("session",sessionId)
        form.append("term",termId)
        form.append("payer",`${currentUser?.role}_${currentUser?.first_name} ${currentUser?.last_name}`)
        form.append("payment_method",paymentMethod)
        form.append("note",paymentNote)
        form.append("phone_number",paymentPhone)
        form.append("account_number",paymentAccount)
        form.append("bank_name",paymentBankName)
        // form.append("wallet_used",'0')
        if (paymentReceipt as any instanceof File) {
            form.append("receipt_image", paymentReceipt);
        }
        setActionToValidate({ type: 'SUBMIT_PAYMENT', id: 'NEW_PAYMENT' });
        setServerForm(form) ;

        // Trigger PIN modal for authorization
        if (!currentUser?.user?.pin_set){
            let url = `/school_finance/director-payments/create/` ;
            sendRequest(url,"POST",form as any ,TriggeredFunc,true,true) ;
            return ;
        }
        setPinModalOpen(true);
    }

    const handleUpdatePayments = (action:"APPROVE"| "REJECT",ids:String[]) => {
        console.log('actionToValidate: ', actionToValidate);
        let form = {
            school:selectedSchool?.id ,
            paymentIds :ids ,
            action : action,
            reason :rejectionNote
        }
        setServerForm(form);
        // Trigger PIN modal for authorization
        if (!currentUser?.user?.pin_set){
            let url = `/school_finance/director-payments/create/` ;
            sendRequest(url,"PUT",form as any ,TriggeredFunc,true,!true) ;
            return ;
        }
        setPinModalOpen(true);
    }


    const handlePinsuccess = (pins: string) => {
        setPinModalOpen(false);
        if (actionToValidate) {

            if (actionToValidate.type === 'SAVE_FEE_SETTING') {
                let form = { ...serverForm, pin: pins }
                setServerForm(form);
                // make the api call here to save the fee setting using the serverForm data, then on success:
                sendRequest("/school_finance/school-fee-settings/create/","POST",form as any,TriggeredFunc,true,false)
                return 
            }
            if (actionToValidate.type === 'UPDATE_FEE_SETTING') {
                let form = { ...serverForm, pin: pins }
                setServerForm(form);
                // make the api call here to save the fee setting using the serverForm data, then on success:
                sendRequest(`/school_finance/school-fee-settings/update/${editingFeeId}/`,"PUT",form as any,TriggeredFunc,true,false) 
                return 
            }

            if (actionToValidate.type === 'DELETE_FEE_SETTING') {
                // Handle fee setting deletion
                sendRequest(`/school_finance/school-fee-settings/delete/${selectedSchool?.id}/${actionToValidate.id}/${pins}/`,"DELETE",null as any ,TriggeredFunc,true,false)
                return 
            }

            if (actionToValidate.type === 'SUBMIT_PAYMENT') {
                serverForm.append('pin',pins)
                let url = `/school_finance/director-payments/create/`
                sendRequest(url,"POST",serverForm as any ,TriggeredFunc,true,true)
                return 
            }

            if (['REJECT',"REJECT_BULK","APPROVE","APPROVE_BULK"].includes(actionToValidate.type)) {
                let url = `/school_finance/director-payments/create/`
                sendRequest(url,"PUT",{...serverForm,pin:pins} as any ,TriggeredFunc,true,false)
                return 
            }
        }
    }
    
    // Generate Fee Records
    useEffect(() => {
        let termId = selectedSchool.terms.find( t => t.name === selectedTerm)?.id ;
        let sessionId = selectedSchool.sessions.find(t => t.name === selectedSession)?.id ;
        let url = `/school_finance/director-dashbord/${selectedSchool.id}/${sessionId}/${termId}/${drillDownStatus}/` ;

        if (termId && sessionId){
            sendRequest(url,"GET",null as any,TriggeredFunc,true,false);
        }

    }, [drillDownStatus,selectedSession,selectedTerm]);
    
    // fetch payments 
    useEffect(() => {
        let url = `/school_finance/director-payment-records/${selectedSchool.id}/`;
        if (selectedSchool.id){
            sendRequest(url,"GET",null as any,TriggeredFunc,true,false);
        }
    }, [selectedSchool]);
    useEffect(() => {
        return () => {
            if (paymentReceipt?.startsWith("blob:")) {
                URL.revokeObjectURL(paymentReceipt)
            }
        }
    }, [paymentReceipt])
    const [feeRecords, setFeeRecords] = useState([]);


    // Generate Transactions
    const transactions: Transaction[] = useMemo(() => {
        let txns: Transaction[] = [];

        // 1. Fee Incomes (Only relevant for Directors or the specific Student)
        if (!personalMode || currentUserRole === 'student') {
            const feeTxns = feeRecords
                .filter(r => r.amountPaid > 0)
                .map(r => {
                    const s = students.find(st => st.id === r.studentId);
                    return {
                        id: `txn-fee-${r.id}`,
                        type: 'INCOME' as const,
                        category: 'FEES' as const,
                        amount: r.amountPaid,
                        description: `School Fees (${r.term}) - ${s?.firstName} ${s?.lastName}`,
                        date: r.lastPaymentDate || new Date().toISOString(),
                        status: 'COMPLETED' as const,
                        reference: `REF-${r.id.slice(-6)}`
                    };
                });
            txns = [...txns, ...feeTxns];
        }

        // 2. Salary Expenses (Only relevant for Directors or the specific Teacher/Staff)
        if (!personalMode || currentUserRole === 'teacher' || currentUserRole === 'staff') {
            const relevantTeachers = personalMode && currentUserRole === 'teacher' 
                ? teachers.filter(t => t.id === currentUserId) 
                : teachers;
                
            const teacherTxns = relevantTeachers
                .flatMap(t => t.paymentHistory || [])
                .map(p => {
                    const teacher = teachers.find(t => t.paymentHistory?.includes(p));
                    return {
                        id: `txn-sal-t-${p.id}`,
                        type: 'EXPENSE' as const,
                        category: 'SALARY' as const,
                        amount: parseFloat(p.amount.toString().replace(/,/g, '')),
                        description: `Salary - ${teacher?.title} ${teacher?.lastName}`,
                        date: p.date,
                        status: 'COMPLETED' as const,
                        reference: p.transactionRef
                    };
                });
            txns = [...txns, ...teacherTxns];
        }

        // 3. Other Expenses (Director Only)
        if (!personalMode) {
             const otherTxns = [
                { id: 't-exp-1', type: 'EXPENSE' as const, category: 'MAINTENANCE' as const, amount: 45000, description: 'Generator Repair', date: '2023-10-28', status: 'COMPLETED' as const, reference: 'EXP-001' },
                { id: 't-exp-2', type: 'EXPENSE' as const, category: 'OTHER' as const, amount: 12500, description: 'Office Stationery', date: '2023-11-02', status: 'COMPLETED' as const, reference: 'EXP-002' }
            ];
            txns = [...txns, ...otherTxns];
        }

        return txns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [feeRecords, teachers, students, personalMode, currentUserId, currentUserRole]);


    // --- STATS ---
    
    // Director Stats
    const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((acc, curr) => acc + curr.amount, 0);
    const totalExpenses = transactions.filter(t => t.type === 'EXPENSE').reduce((acc, curr) => acc + curr.amount, 0);
    const netBalance = totalIncome - totalExpenses;

    // Student Personal Stats
    const myTotalPaid = feeRecords.reduce((acc, r) => acc + r.amountPaid, 0);
    const myTotalDue = feeRecords.reduce((acc, r) => acc + r.totalDue, 0);
    const myOutstanding = myTotalDue - myTotalPaid;

    // Teacher Personal Stats
    const myTotalEarned = transactions.filter(t => t.type === 'EXPENSE' && t.category === 'SALARY').reduce((acc, curr) => acc + curr.amount, 0);

    const TabButton = ({ id, label, icon }: { id: FinanceTab, label: string, icon: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition-all whitespace-nowrap ${
                activeTab === id ? 'bg-navy-800 text-white shadow-md border border-gold-400 b-2' : 'bg-white/90 text-gray-800 hover:bg-navy-50 hover:text-navy-700'
            }`}
        >
            <i className={`${icon} mr-2`}></i> {label}
        </button>
    );

   
    useEffect(() => {
        // Whenever session or term changes, reset to dashboard view
        if (selectedSchool){
            setSelectedSession(selectedSchool.sessions?.find(s => s.is_current)?.name || 'Unknown Session');
            setSelectedTerm(selectedSchool.terms?.find(t => t.is_current)?.name || 'Unknown Term');
        }
    }, [selectedSchool]);

    return (
        <div className="h-full flex flex-col space-y-6 animate-fadeIn max-h-screen">
            {/* Merged Header: Fee Collection Analysis + Tabs */}
            
            {!personalMode && (
                <div className="bg-navy-900 text-white p-3 rounded-xl shadow-lg relative overflow-hidden flex-shrink-0 ">
                     <div className="absolute top-0 right-0 w-64 h-54 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                     <div className="relative z-10 space-y-6">
                         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                             <div>
                                 <h3 className="text-2xl font-bold mb-1">Fee Collection Analysis</h3>
                                 <p className="text-navy-200 text-sm">Select a session and term to view specific fee performance.</p>
                             </div>
                             <div className="flex flex-wrap items-center gap-2 bg-navy-800 p-2 rounded-lg border border-navy-700">
                                 <label className="text-sm font-bold text-navy-300 px-2  ">Session:</label>
                                 <select 
                                    className="bg-navy-200 text-gray-800 border border-navy-600 rounded p-2 text-sm font-bold focus:outline-none focus:border-gold-500"
                                    value={selectedSession || ""} onChange={(e) => setSelectedSession(e.target.value)}
                                  >
                                     {sessions.map((s)  => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                 </select>

                                 <label className="text-sm font-bold text-navy-300 px-2">Term:</label>
                                 <select value={selectedTerm || ""} onChange={(e) => setSelectedTerm(e.target.value)} 
                                 className="bg-navy-200 text-gray-800 border border-navy-600 rounded px-4 py-2 text-sm font-bold focus:outline-none focus:border-gold-500"
                                 >
                                     {terms.map((t) => (
                                         <option key={t.id} value={t.name}>{t.name}</option>
                                     ))} 

                                 </select>
                             </div>
                         </div>

                         {/* Navigation Tabs Merged Here */}
                         <div className="flex gap-2 justify-start bg-navy-800/50 p-1.5 rounded-xl overflow-x-auto no-scrollbar border border-white/10">
                            {currentUserRole !== 'parent' && (
                                <>
                                    <TabButton id="OVERVIEW" label="Dashboard" icon="fa-solid fa-chart-pie" />
                                    {/* <TabButton id="PAYROLL" label="Payroll" icon="fa-solid fa-file-invoice-dollar" /> */}
                                    {/* <TabButton id="TRANSACTIONS" label="Ledger" icon="fa-solid fa-list" /> */}
                                    <div className='relative'>
                                       {(totalPendingPayments > 0) &&  <span className='absolute top-2 right-1 animate-bounce z-10'>

                                            <span className='relative flex items-center justify-center'>

                                                <i className="fa-solid fa-bell text-xl text-gold-600 "></i>

                                                <span className=" absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white
                                                ">
                                                    {totalPendingPayments}
                                                </span>

                                            </span>

                                        </span>}
                                    <TabButton  id="PAYMENT_VALIDATION"  label="Validations"  icon="fa-solid fa-check-double"/> 
                                    </div>
                                </>
                            )}
                            <TabButton id="PAYMENT" label="Payment" icon="fa-solid fa-credit-card" />
                            <TabButton id="SEARCH" label="Search Payment" icon="fa-solid fa-search" />

                         </div>
                     </div>
                </div>
            )}

            {/* Personal Mode Header */}
            {personalMode && (
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">My Finances</h2>
                        <p className="text-sm text-gray-500">
                            {currentUserRole === 'student' ? 'Fee History & Invoices' : 'Salary & Payslips'}
                        </p>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                
                {/* --- STUDENT PERSONAL VIEW --- */}
                {personalMode && currentUserRole === 'student' && (
                    <FadeIn>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-navy-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                                <p className="text-xs font-bold text-navy-300 uppercase">Outstanding Balance</p>
                                <h3 className="text-3xl font-bold mt-1 text-gold-500">{formatCurrency(myOutstanding)}</h3>
                                <p className="text-xs text-navy-200 mt-2">{myOutstanding > 0 ? 'Payment Due Immediately' : 'All fees cleared'}</p>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Paid (YTD)</p>
                                <h3 className="text-3xl font-bold mt-1 text-green-600">{formatCurrency(myTotalPaid)}</h3>
                            </div> 

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-500 uppercase">Session Total</p>
                                <h3 className="text-3xl font-bold mt-1 text-navy-900">{formatCurrency(myTotalDue)}</h3>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200"><h3 className="font-bold text-navy-900">Fee Records</h3></div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Term</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Total Due</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Paid</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Balance</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {feeRecords.map(r => (
                                        <tr key={r.id}>
                                            <td className="px-6 py-4 text-sm font-bold text-navy-900">{r.term}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{formatCurrency(r.totalDue)}</td>
                                            <td className="px-6 py-4 text-sm text-green-600 font-medium">{formatCurrency(r.amountPaid)}</td>
                                            <td className="px-6 py-4 text-sm text-red-600 font-medium">{formatCurrency(r.totalDue - r.amountPaid)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${r.status === 'PAID' ? 'bg-green-100 text-green-700' : r.status === 'PARTIAL' ? 'bg-gold-100 text-gold-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FadeIn>
                )}

                {/* --- TEACHER PERSONAL VIEW --- */}
                {personalMode && currentUserRole === 'teacher' && (
                    <FadeIn>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-navy-900">
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Earnings (YTD)</p>
                                <h3 className="text-3xl font-bold mt-1 text-navy-900">{formatCurrency(myTotalEarned)}</h3>
                            </div>
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-500 uppercase">Last Payment Date</p>
                                <h3 className="text-3xl font-bold mt-1 text-navy-900">{transactions[0] ? new Date(transactions[0].date).toLocaleDateString() : 'N/A'}</h3>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200"><h3 className="font-bold text-navy-900">Salary History</h3></div>
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map(t => (
                                        <tr key={t.id}>
                                            <td className="px-6 py-4 text-sm text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-sm font-medium text-navy-900">{t.description}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-right text-green-600">{formatCurrency(t.amount)}</td>
                                            <td className="px-6 py-4 text-center"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">{t.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </FadeIn>
                )}

                {/* --- DIRECTOR OVERVIEW VIEW (Existing) --- */}
                {!personalMode && activeTab === 'OVERVIEW' && (
                    <FadeIn>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div onClick={() => setDrillDownStatus('PAID')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden ${drillDownStatus === 'PAID' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'}`}>
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-circle-check text-6xl text-green-600"></i></div>
                                <div className="relative z-10"><p className="text-xs font-bold uppercase text-gray-500 mb-2">Fully Paid</p><h3 className="text-3xl font-bold text-navy-900 mb-1">{currentTermRecords?.paid_count } <span className="text-sm font-medium text-gray-400">Students</span></h3><p className="text-sm font-bold text-green-600">{formatCurrency(currentTermRecords?.total_paid)}</p></div>
                            </div>
                            <div onClick={() => setDrillDownStatus('PARTIAL')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden ${drillDownStatus === 'PARTIAL' ? 'border-gold-500 ring-2 ring-gold-200' : 'border-gray-100'}`}>
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-circle-half-stroke text-6xl text-gold-600"></i></div>
                                <div className="relative z-10"><p className="text-xs font-bold uppercase text-gray-500 mb-2">Partially Paid</p><h3 className="text-3xl font-bold text-navy-900 mb-1">{currentTermRecords?.partial_count} <span className="text-sm font-medium text-gray-400">Students</span></h3><p className="text-sm font-bold text-gold-600">{formatCurrency(currentTermRecords?.total_partial)}</p></div>
                            </div>
                            <div onClick={() => setDrillDownStatus('UNPAID')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden ${drillDownStatus === 'UNPAID' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-100'}`}>
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-circle-xmark text-6xl text-red-600"></i></div>
                                <div className="relative z-10"><p className="text-xs font-bold uppercase text-gray-500 mb-2">Unpaid / Owing </p><h3 className="text-3xl font-bold text-navy-900 mb-1">{currentTermRecords?.unpaid_count} <span className="text-sm font-medium text-gray-400">Students</span></h3><p className="text-sm font-bold text-red-600">{formatCurrency(currentTermRecords?.total_unpaid)}</p></div>
                            </div>
                             <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Net Balance (All Time)</p>
                                <h3 className="text-3xl font-bold text-navy-900 mb-1">{formatCurrency(currentTermRecords?.total_net_balance)}</h3>
                                <p className="text-xs text-gray-400">Total Outstanding</p>
                            </div>
                        </div>

                        {/* In-Page Drill Down List */}
                        {(
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 animate-fadeIn">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                    <h3 className="font-bold text-navy-900 text-lg">
                                        {drillDownStatus === 'PAID' ? 'Fully Paid Students' : drillDownStatus === 'PARTIAL' ? 'Partially Paid Students' : 'Unpaid Students'} - {selectedSession} ({selectedTerm})
                                    </h3>
                                    <button onClick={() => setDrillDownStatus(null)} className="text-gray-400 hover:text-gray-600">
                                        <i className="fa-solid fa-times text-xl"></i>
                                    </button>
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-white sticky top-0 shadow-sm">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Admission No</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Class</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Due</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount Paid</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Payer</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Net Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {currentTermRecords?.data?.filter(r => r.status === drillDownStatus)
                                                .map(r => {
                                                    const student = students.find(s => s.id === r.student);
                                                    const balance = r.net_balance;
                                                    const clss = classRooms.filter(cls =>  r.active_classes.includes(cls.id))
                                                    return (
                                                        <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => {
                                                            // Set active student for ledger view
                                                            setLedgerStudentId(r?.student || null);
                                                        }}>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {r?.admission_number || 'N/A'}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm font-bold text-navy-900">
                                                                {r?.name}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {clss.map(cls => <span key={cls.id}>
                                                                    {cls.name  || "N/A" }
                                                                </span> )}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm text-gray-600">
                                                                {formatCurrency(r?.total_amount)}
                                                            </td>
                                                            <td className="px-6 py-4 text-right text-sm font-medium text-green-600">
                                                                {formatCurrency(r?.amount_paid)}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                                {r?.payment_details?.payer || '-'}
                                                            </td>
                                                            <td className={`px-6 py-4 text-right text-sm font-bold ${balance < 0 ? 'text-red-600' : 'text-gray-400'}`}>
                                                                {formatCurrency(balance)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </FadeIn>
                )}
                
                {/* --- PAYMENT (Make Payment) --- */}
                {activeTab === 'PAYMENT' && (
                    <PaymentPage
                        userRole = {currentUser?.role || 'PARENT'}
                        defaultBank={defaultBank} 
                        walletBalance={walletBalance}
                        setStudents={setStudents}
                        students={students}
                        studentsPaymentAmount={studentsPaymentAmount}
                        paymentStudents={paymentStudents}
                        setPaymentStudents={setPaymentStudents}
                        setIsPaymentFormModalOpen={setIsPaymentFormModalOpen}
                        isStudentSelectionModalOpen ={isStudentSelectionModalOpen}
                        setIsStudentSelectionModalOpen={setIsStudentSelectionModalOpen}
                        pendingPayments={pendingPayments}
                        setReceiptImageToView = { setReceiptImageToView }
                    />
                )}
                
                {/* Director searching for payments here  */}
                {activeTab === 'SEARCH' && (
                    <SearchPayment
                        setReceiptImageToView = { setReceiptImageToView }
                    />
                )}

                {/* PARENT,DIRECTOR PAYMENT FORM MODAL */}
                <Modal isOpen={isPaymentFormModalOpen} onClose={() => setIsPaymentFormModalOpen(false)} title="Complete Payment Details" size="lg">
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Total Amount </p>
                                    <h3 className="text-2xl font-bold text-navy-900">{formatCurrency(studentsPaymentAmount)}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-500 uppercase">Selected</p>
                                    <h3 className="text-lg font-bold text-navy-900">{paymentStudents.length} Students</h3>
                                </div>
                            </div>
                        </div>

                        {currentUser?.user?.role === "parent" &&  <>
                            <div className="bg-navy-50 p-4 rounded-lg border border-navy-100 flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-navy-900">Wallet Balance (Coupon): {formatCurrency(walletBalance)}</p>
                                    <p className="text-xs text-gray-500">
                                        {walletBalance > 0 
                                            ? "Apply your available coupon balance to reduce the total payment." 
                                            : "No coupon balance available to apply."}
                                    </p>
                                </div>
                                <label className={`flex items-center ${walletBalance > 0 ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                                    <div className="relative">
                                        <input type="checkbox" className="sr-only" checked={useWallet} onChange={() => walletBalance > 0 && setUseWallet(!useWallet)} disabled={walletBalance === 0} />
                                        <div className={`block w-10 h-6 rounded-full transition-colors ${useWallet ? 'bg-navy-600' : 'bg-gray-300'}`}></div>
                                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${useWallet ? 'transform translate-x-4' : ''}`}></div>
                                    </div>
                                    <span className="ml-3 text-sm font-bold text-gray-700">Apply Coupon</span>
                                </label>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Have a Discount Coupon Code?</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="Enter code (e.g. FAMILY10)" 
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-navy-500"
                                    />
                                    <Button 
                                        disabled={isLoading}
                                        onClick={() => {
                                            if (couponCode.trim().length > 0) {
                                                setAppliedCouponDiscount(50000); // Simulate a 50,000 discount
                                                alert('Coupon applied successfully! ₦50,000 discount added.');
                                            }
                                        }}
                                        className="bg-navy-900 text-white px-6"
                                    >
                                        Apply
                                    </Button>
                                </div>
                                {appliedCouponDiscount > 0 && (
                                    <p className="text-sm text-green-600 font-bold mt-2">
                                        <i className="fa-solid fa-check-circle mr-1"></i> 
                                        Discount Applied: {formatCurrency(appliedCouponDiscount)}
                                    </p>
                                )}
                            </div>
                        </>}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Amount to Pay Now</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">₦</span>
                                <input 
                                    type="text" 
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                    placeholder={`e.g. ${studentsPaymentAmount}`}
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500 text-lg font-bold"
                                />
                            </div>
                            
                            {!paymentAmount && ( 
                                <button onClick={() => {
                                    let total = studentsPaymentAmount;
                                    if (useWallet) total = Math.max(0, total - walletBalance);
                                    if (appliedCouponDiscount > 0) total = Math.max(0, total - appliedCouponDiscount);
                                    setPaymentAmount(total.toString());
                                }} className="text-sm text-navy-600 hover:underline mt-1 font-bold mb-2">
                                    Pay full amount  {(useWallet || appliedCouponDiscount > 0) ? '(after discounts)' : ''}
                                </button>
                            )}

                            <div className=" ">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Payment Method</label>
                                <select className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500 "
                                 value={paymentMethod} onChange={(e:any) => setPaymentMethod(e.target.value)}>
                                    <option value="CASH">Cash</option>
                                    <option value="TRANSFER">Transfer</option>
                                    <option value="WALLET">Wallet</option>
                                </select>
                                
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Note</label>
                            <input type="tel" value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)} placeholder="e.g. write note" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500" />
                        </div>

                        {paymentMethod === "TRANSFER" && <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <input type="tel" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} placeholder="e.g. 08012345678" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Bank Name (Sending From)</label>
                                <input type="text" value={paymentBankName} onChange={(e) => setPaymentBankName(e.target.value)} placeholder="e.g. GTBank" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-2">Account Number (Sending From)</label>
                                <input type="text" value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)} placeholder="e.g. 0123456789" className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-navy-500" />
                            </div>
                           
                        </div>}

                        {paymentMethod === "TRANSFER" &&  <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Upload Payment Receipt</label>
                            <div className="space-y-4">
                                <ImageUpload label ='preview' onImageSelected={(url) => {setPaymentReceipt(url)}} />
                                {paymentReceipt && (
                                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 group">
                                        <img src={prepareImageUrl(paymentReceipt) || ''} alt="Receipt Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        <button 
                                            onClick={() => setReceiptImageToView(paymentReceipt)}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                                        >
                                            Preview
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>}

                        <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
                            <Button isLoading={isLoading} variant="secondary" onClick={() => setIsPaymentFormModalOpen(false)}>Cancel</Button>
                            <Button isLoading={isLoading} onClick={() => {handlePayment()}} className="bg-navy-900 text-white px-8">Authorize & Submit Payment</Button>
                        </div>
                    </div>
                </Modal>

                {/* --- PAYMENT VALIDATION (Director) --- */}
                {!personalMode && activeTab === 'PAYMENT_VALIDATION' && (
                    <FadeIn>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div>
                                    <h3 className="font-bold text-navy-900 text-lg">Payment Validations</h3>
                                    <p className="text-sm text-gray-500">Review and approve parent fee payments.</p>
                                </div>
                                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                                    <button 
                                        onClick={() => setValidationTab('PENDING')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${validationTab === 'PENDING' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}
                                    >
                                        Pending ({totalPendingPayments})
                                    </button>
                                    <button 
                                        onClick={() => setValidationTab('APPROVED')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${validationTab === 'APPROVED' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}
                                    >
                                        Accepted ({pendingPayments.filter(p => p.status === 'APPROVED').length})
                                    </button>
                                    <button 
                                        onClick={() => setValidationTab('REJECTED')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${validationTab === 'REJECTED' ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}
                                    >
                                        Rejected ({pendingPayments.filter(p => p.status === 'REJECTED').length})
                                    </button>
                                </div>
                            </div>
                            
                            {validationTab === 'PENDING' && pendingPayments.filter(p => p.status === 'PENDING').length > 0 && (
                                <div className="bg-navy-50 px-6 py-3 border-b border-navy-100 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                                                checked={selectedPendingPayments.length > 0 && selectedPendingPayments.length === pendingPayments.filter(p => p.status === 'PENDING').length}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedPendingPayments(pendingPayments.filter(p => p.status === 'PENDING').map(p => p.id));
                                                    } else {
                                                        setSelectedPendingPayments([]);
                                                    }
                                                }}
                                            />
                                            <span className="text-sm font-bold text-navy-900">Select All</span>
                                        </label>
                                        {selectedPendingPayments.length > 0 && (
                                            <span className="text-sm text-navy-600">({selectedPendingPayments.length} selected)</span>
                                        )}
                                    </div>
                                    {selectedPendingPayments.length > 0 && (
                                        <div className="flex gap-2">
                                            <Button onClick={() => {setActionToValidate({type: 'APPROVE_BULK', id: ''}); handleUpdatePayments("APPROVE",selectedPendingPayments)}} className="bg-green-600 text-white hover:bg-green-700 text-sm py-1 px-4">
                                                <i className="fa-solid fa-check mr-2"></i> Approve Selected
                                            </Button>
                                            <Button onClick={() => { setActionToValidate({type: 'REJECT_BULK', id: ''}); setIsRejectionModalOpen(true); }} className="bg-red-600 text-white hover:bg-red-700 text-sm py-1 px-4">
                                                <i className="fa-solid fa-times mr-2"></i> Reject Selected
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {validationTab === 'PENDING' && (
                                                <th className="px-6 py-3 text-left w-10">
                                                    {/* Checkbox moved to bulk actions bar */}
                                                </th>
                                            )}
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Receipt</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Payer</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {pendingPayments.filter(p => p.status === validationTab).length === 0 ? (
                                            <tr><td colSpan={validationTab === 'PENDING' ? 6 : 5} className="px-6 py-8 text-center text-gray-500">No {validationTab.toLowerCase()} payments found.</td></tr>
                                        ) : (
                                            pendingPayments.filter(p => p.status === validationTab).map(p => {

                                                return (
                                                <tr key={p.id} className={`hover:cursor-pointer transition-all hover:bg-gray-100 transition-colors ${p.status !== 'PENDING' ? 'bg-gray-50' : ''}`} onClick={() => setHistoryPayment(p)}>
                                                    {validationTab === 'PENDING' && (
                                                        <td className="px-6 py-4">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                                                                checked={selectedPendingPayments.includes(p.id)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) {
                                                                        setSelectedPendingPayments([...selectedPendingPayments, p.id]) ; 
                                                                    } else {
                                                                        setSelectedPendingPayments(selectedPendingPayments.filter(id => id !== p.id));
                                                                    }
                                                                }}
                                                            />
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(p.date_initiated).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-xs text-gray-600 font-medium">{p.students?.length} Student(s)</p>
                                                        {(p?.payment_method !== "CASH") && <div className="mt-1 space-y-0.5">
                                                            <p className="text-xs text-gray-500">Phone: <span className="font-medium text-gray-700">{p.phone_number}</span></p>
                                                            <p className="text-xs text-gray-500">Bank: <span className="font-medium text-gray-700">{p.bank_name || 'N/A'}</span></p>
                                                            <p className="text-xs text-gray-500">Acct: <span className="font-medium text-gray-700">{p.account_number}</span></p>
                                                        </div>}
                                                        {(p?.payment_method === "CASH") && <div className="mt-1 space-y-0.5">
                                                            <p className="text-xs text-gray-500">{p?.payment_method}</p>
                                                        </div>}
                                                        {p?.note && <p className="text-xs text-red-600 italic mt-2 bg-gold-50 p-1.5 rounded border border-gold-100">Reason: {p?.note}</p>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {p?.receipt_image ? (
                                                            <button onClick={(e) => {e.stopPropagation();setReceiptImageToView(p?.receipt_image || null)}} className="text-navy-600 hover:text-navy-800 text-sm font-bold flex items-center gap-2">
                                                                <i className="fa-solid fa-image"></i> View Receipt
                                                            </button>
                                                        ) : <span className="text-gray-400 text-sm">No Receipt</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm font-bold text-right text-navy-900">{p?.payer}</td>

                                                    <td className="px-6 py-4 text-sm font-bold text-right text-navy-900">{ formatCurrency(p?.total_amount) }</td>
                                                    <td className="px-6 py-4 text-center">
                                                        {p?.status === 'PENDING' ? (
                                                            <div className="flex justify-center gap-2">
                                                                <button onClick={(e) => {e.stopPropagation(), setActionToValidate({type: 'APPROVE', id:p.id}); handleUpdatePayments("APPROVE",[p.id,]); }} className="px-3 py-1.5 rounded bg-green-100 text-green-700 hover:bg-green-200 transition-colors flex items-center gap-1 text-xs font-bold" title="Approve">
                                                                    <i className="fa-solid fa-check"></i> Approve
                                                                </button>
                                                                <button onClick={(e) => {e.stopPropagation(), setActionToValidate({type: 'REJECT', id:p.id}); setIsRejectionModalOpen(true); }} className="px-3 py-1.5 rounded bg-red-100 text-red-700 hover:bg-red-200 transition-colors flex items-center gap-1 text-xs font-bold" title="Reject">
                                                                    <i className="fa-solid fa-times"></i> Reject
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col items-center">
                                                                {p.status === 'APPROVED' ? (
                                                                    <div className="flex items-center gap-1 text-green-600 font-bold">
                                                                        <i className="fa-solid fa-check-circle"></i>
                                                                        <span className="text-sm">Approved</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1 text-red-600 font-bold">
                                                                        <i className="fa-solid fa-times-circle"></i>
                                                                        <span className="text-sm">Rejected</span>
                                                                    </div>
                                                                )}
                                                                {p?.date_resolved && <span className="text-[10px] text-gray-500 mt-1">{new Date(p.date_resolved).toLocaleDateString()}</span>}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )})
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </FadeIn>
                )}

            </div>

            
            <PaymentDetails
                historyPayment={historyPayment}
                setHistoryPayment={setHistoryPayment}
                setReceiptImageToView ={setReceiptImageToView}
            />
            
            {/* Rejection Note Modal */}
            <Modal isOpen={isRejectionModalOpen} onClose={() => { setIsRejectionModalOpen(false); setRejectionNote(''); }} title="Reject Payment" size="md">
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">Please provide a reason for rejecting this payment. This will be visible to the parent.</p>
                    <textarea 
                        value={rejectionNote}
                        onChange={(e) => setRejectionNote(e.target.value)}
                        autoFocus 
                        placeholder="e.g. Receipt is blurry, Amount doesn't match..."
                        className="w-full border border-gray-300 rounded-lg p-4 h-32 focus:outline-none focus:ring-2 focus:ring-navy-500"
                    ></textarea>
                    <div className="flex justify-end gap-3">
                        <Button isLoading={isLoading}  variant="secondary" onClick={() => setIsRejectionModalOpen(false)}>Cancel</Button>
                        <Button 
                            isLoading={isLoading}
                            onClick={() => {
                                if (!rejectionNote) return setToast({type:'error',message:'provide reason'});
                                if (actionToValidate?.type === "REJECT_BULK") return handleUpdatePayments("REJECT",selectedPendingPayments);
                                if (actionToValidate?.type === "REJECT") return handleUpdatePayments("REJECT",[actionToValidate?.id]);

                            }}
                            className="bg-red-600 text-white"
                        >
                            Confirm Rejection
                        </Button>
                    </div>
                </div>
            </Modal>

            <div className="z-[999]">
                <ImageViewer 
                    isOpen={!!receiptImageToView} 
                    imageUrl={ prepareImageUrl(receiptImageToView, urls.BASE_URL) || undefined} 
                    onClose={() => setReceiptImageToView(null)} 
                    altText="Payment Receipt"
                />
            </div>

            {/* Student Ledger Modal for All Roles  */}
            {ledgerStudentId && 
            <StudentLedger
                ledgerStudentId = {ledgerStudentId}
                setLedgerStudentId = {setLedgerStudentId}
                ledgerDateFilter = {ledgerDateFilter}
                setLedgerDateFilter = {setLedgerDateFilter}
                setReceiptImageToView = {setReceiptImageToView}
            />}


            {/* Pin Modal for Validation & Submission */}
            <PinModal 
                isOpen={pinModalOpen} 
                onClose={() => { setPinModalOpen(false); setActionToValidate(null); }}
                onSuccess={(pins) => handlePinsuccess(pins)}
                title={actionToValidate?.id === 'NEW_PAYMENT' ? 'Enter your PIN to authorize this fee payment submission.' : `Enter your PIN to ${actionToValidate?.type.toLowerCase()} this payment.`}
            />
        </div>
    );
};