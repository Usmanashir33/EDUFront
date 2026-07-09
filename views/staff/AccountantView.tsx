import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Button, FadeIn, ImageUpload, ImageViewer, Modal, PinModal } from '../../components/UI';
import urls from '@/customHooks/ServerUrls';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import SearchPayment from '@/components/finance/SearchPayments';
import PaymentPage from '@/components/finance/PaymentSection';
import StudentLedger from '@/components/finance/StudentLedger';
import PaymentDetails from '@/components/finance/PaymentDetails';
import AllPaymentStudents from '@/components/finance/AllPaymentStudents';

type FinanceTab = 'OVERVIEW' | 'PAYROLL' | 'TRANSACTIONS' | 'PAYMENT' | 'PAYMENT_VALIDATION' | "SEARCH";
type FeeStatusDrillDown = 'PAID' | 'PARTIAL' | 'UNPAID' | null;
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};
interface AccountViewProps{
    activeTab :FinanceTab | any ,
    setActiveTab: (tab:FinanceTab) => void
}

export const AccountantView: React.FC<AccountViewProps> = ({activeTab, setActiveTab}) => { 
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
        const [validCurrent,setValidCurrent] = useState(false);
    
        const [] = useState<FinanceTab>('OVERVIEW')
        
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
        const [showAllStudents ,setShowAllStudents] = useState(false)
    
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
    
        const [currentTermRecords,setCurrentTermRecords] = useState<any>([])
    
        const pendingPaymentStats = useMemo(() => {
                // Return zeros immediately if data is missing or empty
                if (!pendingPayments?.length) return { totalAmount: 0, pendingCount: 0 };
        
                // Filter for items that actually have a PENDING status
                const pendingItems = pendingPayments.filter(p => p.status === "PENDING");
        
                // Sum up the total_amount of the filtered pending items
                const totalAmount = pendingItems.reduce((sum, p) => sum + (Number(p.total_amount) || 0), 0);
        
                return {
                    totalAmount,
                    pendingCount: pendingItems.length
                };
        }, [pendingPayments]);
    
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
            // console.log('resp: ', resp);
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
                setCurrentTermRecords(resp?.dashbordData);
                setValidCurrent(true);
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
            
            if (((currentUser?.role?.toLowerCase() === "director") && !directorValidation)) return (
                    setToast({type:"error",message:"Please fill amount fields"})
                )
            if ((!parsonalValidation)) return (
                    setToast({type:"error",message:"Please fill all fields"})
                )
    
            const amount = parseFloat(paymentAmount);
            if (isNaN(amount) || amount <= 0) return (
                setToast({type:"error",message:"invalid amount"})
            );
            
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
    
            if (!currentUser?.user?.pin_set){
                let url = `/school_finance/payments/create/` ;
                sendRequest(url,"POST",form as any ,TriggeredFunc,true,true) ;
                return ;
            }
            setPinModalOpen(true);
        }
    
        const handleUpdatePayments = (action:"APPROVE"| "REJECT",ids:String[]) => {
            let form = {
                school:selectedSchool?.id ,
                paymentIds :ids ,
                action : action,
                reason :rejectionNote
            }
            setServerForm(form);
            // Trigger PIN modal for authorization
            if (!currentUser?.user?.pin_set){
                let url = `/school_finance/payments/create/` ;
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
                    let url = `/school_finance/payments/create/`
                    sendRequest(url,"POST",serverForm as any ,TriggeredFunc,true,true)
                    return 
                }
    
                if (['REJECT',"REJECT_BULK","APPROVE","APPROVE_BULK"].includes(actionToValidate.type)) {
                    let url = `/school_finance/payments/create/`
                    sendRequest(url,"PUT",{...serverForm,pin:pins} as any ,TriggeredFunc,true,false)
                    return 
                }
            }
        }
        
        // Generate Fee Records
        useEffect(() => {
            let termId = selectedSchool.terms.find( t => t.name === selectedTerm)?.id ;
            let sessionId = selectedSchool.sessions.find(t => t.name === selectedSession)?.id ;
            let url = `/school_finance/dashbord/${selectedSchool.id}/${sessionId}/${termId}/${drillDownStatus}/` ;
    
            if (termId && sessionId){
                sendRequest(url,"GET",null as any,TriggeredFunc,true,false);
            }
    
        }, [drillDownStatus,selectedSession,selectedTerm]);
        
        // fetch payments 
        useEffect(() => {
            let url = `/school_finance/payment-records/${selectedSchool.id}/`;
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
    
    
        // --- STATS ---
        
    
        const TabButton = ({ id, label, icon }: { id: FinanceTab, label: string, icon: string }) => (
            <button
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition-all whitespace-nowrap ${
                    activeTab !== id ? 'bg-navy-800 text-white shadow-md border border-md border border-gold-400 b-2' : 'bg-white/90 text-gray-800 hover:bg-navy-50 hover:text-navy-700'
                }`}
            >
                <i className={`${icon} mr-2`}></i> {label}
            </button>
        );
        const getPaymentPercent = useMemo(() => {
            if (!currentTermRecords) return "0.00";
            
            const { paid_count = 0, unpaid_count = 0, partial_count = 0 } = currentTermRecords;
            const total = paid_count + unpaid_count + partial_count;
            
            // Prevent division by zero if all counts are 0
            if (total === 0) return "0.00"; 
            
            const collecteds = partial_count + paid_count;
            const percentage = (collecteds / total) * 100;
            
            // Returns a string with exactly 2 decimal places (e.g., "72.22")
            return percentage.toFixed(2); 
        }, [currentTermRecords]);

    
       
        useEffect(() => {
            // Whenever session or term changes, reset to dashboard view
            if (selectedSchool){
                setSelectedSession(selectedSchool.sessions?.find(s => s.is_current)?.name || 'Unknown Session');
                setSelectedTerm(selectedSchool.terms?.find(t => t.is_current)?.name || 'Unknown Term');
            }
        }, [selectedSchool]);

    {/* --- PAYMENT (Make Payment) --- */}
    if (activeTab === 'PAYMENT'){
        return (
            <PaymentPage
                userRole = {currentUser?.role || 'Staff'}
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
        )
    }
    // searching payments made        
    if (activeTab === 'SEARCH'){
        return (
            <SearchPayment
                setReceiptImageToView = { setReceiptImageToView }
            />
        )
    }
     {/* --- PAYMENT VALIDATION (Staff) --- */}
    if (activeTab === 'PAYMENT_VALIDATION'){
        return (
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
                                        Pending ({pendingPaymentStats.pendingCount})
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
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Payer</th>
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
                                                            <p className="text-xs text-gray-500">{p?.payment_method}</p>
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
        )
    }

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Finance Overview</h2>
                    <p className="text-slate-500 mt-1">Tracking of revenue, outstanding balances, and recent transactions.</p>
                </div>
                <div className="flex flex-cols items-center gap-2 px-2 rounded-lg max-w-fit  ">
                                <div className=" flex gap-2">
                                 <label className="text-sm font-bold text-navy-700 px-2  ">Session:</label>
                                 <select 
                                    className="bg-navy-200 text-gray-800 border border-navy-600 rounded px-2 py-1 text-sm font-bold focus:outline-none focus:border-gold-500"
                                    value={selectedSession || ""} onChange={(e) => setSelectedSession(e.target.value)}
                                  >
                                     {sessions.map((s)  => (
                                        <option key={s.id} value={s.name}>{s.name}</option>
                                    ))}
                                 </select>
                                </div>
                                <div className="flex gap-2">
                                    <label className="text-sm font-bold text-navy-700 px-2">Term:</label>
                                    <select value={selectedTerm || ""} onChange={(e) => setSelectedTerm(e.target.value)} 
                                    className="bg-navy-200 text-gray-800 border border-navy-600 rounded px-2 py-1 text-sm font-bold focus:outline-none focus:border-gold-500"
                                    >
                                        {terms.map((t) => (
                                            <option key={t.id} value={t.name}>{t.name}</option>
                                        ))} 

                                    </select>
                                </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"><i className="fa-solid fa-file-export mr-2"></i> Export Report</Button>
                    <Button 
                    onClick={() => setActiveTab("PAYMENT")} 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"><i className="fa-solid fa-plus mr-2"></i> New Invoice</Button>
                </div>
            </div>

            {/* KPI Cards */}
            
            <div className="grid grid-cols-3 md :grid-cols-4 lg:grid-cols-5 gap-4 mb-2">
                            <div onClick={() => setDrillDownStatus('PAID')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden ${drillDownStatus === 'PAID' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-100'}`}>
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-circle-check text-6xl text-green-600"></i></div>
                                <div className="relative z-10"><p className="text-xs font-bold uppercase text-gray-500 mb-2">Fully {`${selectedSession} » ${selectedTerm}`}</p>
                                <h3 className="text-sm font-bold text-navy-900 mb-1">{currentTermRecords?.paid_count }
                                     <span className="text-sm font-medium text-gray-400">Student(s)</span>
                                     </h3>
                                     <p className="text-2xl  font-bold text-green-600">{formatCurrency(currentTermRecords?.total_paid) || "N/A"}</p></div>
                            </div>
                            <div onClick={() => setDrillDownStatus('PARTIAL')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden ${drillDownStatus === 'PARTIAL' ? 'border-gold-500 ring-2 ring-gold-200' : 'border-gray-100'}`}>
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-circle-half-stroke text-6xl text-gold-600"></i></div>
                                <div className="relative z-10"><p className="text-xs font-bold uppercase text-gray-500 mb-2">Partially  {`${selectedSession} » ${selectedTerm}`} </p><h3 className="text-sm font-bold text-navy-900 mb-1">{currentTermRecords?.partial_count} <span className="text-sm font-medium text-gray-400">Student(s)</span></h3><p className="text-2xl font-bold text-gold-600">{formatCurrency(currentTermRecords?.total_partial) || "N/A"}</p></div>
                            </div>
                            <div onClick={() => setDrillDownStatus('UNPAID')} className={`bg-white p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden ${drillDownStatus === 'UNPAID' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-100'}`}>
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-circle-xmark text-6xl text-red-600"></i></div>
                                <div className="relative z-10"><p className="text-xs font-bold uppercase text-gray-500 mb-2">Unpaid/Owing  {`${selectedSession} » ${selectedTerm}`} </p><h3 className="text-sm font-bold text-navy-900 mb-1">{currentTermRecords?.unpaid_count} <span className="text-sm font-medium text-gray-400">Student(s)</span></h3><p className="text-2xl font-bold text-red-600">{formatCurrency(currentTermRecords?.total_unpaid) || "N/A"}</p></div>
                            </div>
                            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <i className="fa-solid fa-file-invoice-dollar text-6xl text-rose-900"></i>
                                </div>
                                <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Pendings</h3>
                                <div className="text-2xl font-black text-slate-900">{pendingPaymentStats.totalAmount?.toLocaleString()}</div>
                                <div className="mt-3 flex items-center text-xs font-bold text-rose-500">
                                    <i className="fa-solid fa-circle-exclamation mr-1.5"></i> {pendingPaymentStats.pendingCount} payments pending
                                </div>
                            </div>
                            <div className="bg-emerald-900 p-6 rounded-2xl border border-emerald-800 shadow-lg relative overflow-hidden text-white">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <i className="fa-solid fa-scale-balanced text-6xl text-white"></i>
                                </div>
                                <h3 className="text-emerald-300 text-xs font-black uppercase tracking-widest mb-2">Collection Rate</h3>
                                <div className="text-3xl font-black text-white">{getPaymentPercent}%</div>
                                <div className="w-full bg-emerald-950 rounded-full h-1.5 mt-4 overflow-hidden">
                                    <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: `${getPaymentPercent}%` }}></div>
                                </div>
                            </div>
                </div>

            {/* <div className="grid grid-cols-1 lg:grid-cols-3 gap-8"> */}
            <div className="">
                {/* Recent Transactions */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            {/* <h3 className="font-bold text-slate-900">Recent Transactions</h3> */}
                            {currentTermRecords?.data?.length >= 14 && 
                                <button 
                                     onClick={() => {
                                        setShowAllStudents(true);
                                    }}
                                className="text-sm font-bold text-emerald-600 hover:text-emerald-700">View All</button>
                            }
                        <div className="divide-y divide-slate-50">
{(
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-2 animate-fadeIn">
                                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                                    {(!isLoading && validCurrent) && <h3 className="font-bold text-navy-900 text-lg">
                                        {drillDownStatus === 'PAID' ? 'Fully Paid Students' : drillDownStatus === 'PARTIAL' ? 'Partially Paid Students' : 'Unpaid Students'} - {selectedSession} ({selectedTerm})
                                    </h3>}
                                    {isLoading && <div className="font-bold text-gray-500 text-lg">
                                        🔃Loading....
                                    </div>}
                                </div>
                                <div className="max-h-[400px] overflow-y-auto custom-scrollbar relative">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-white sticky top-0 shadow-sm">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Admission No</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student Name</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Class</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Due</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount Paid</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Trx Type</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Net Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {currentTermRecords?.data?.filter(r => r.status === drillDownStatus)
                                                .map(r => {
                                                    // const balance = r.net_balance;
                                                    const balance = r.current_net_balance ;
                                                    const clss = classRooms.filter(cls =>  r.active_classes.includes(cls.id))
                                                    return (
                                                        <tr key={r.id} className="hover:bg-gray-50 cursor-pointer" 
                                                        onClick={() => {
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
                                                                {r?.transaction_type || '-'}
                                                            </td>
                                                            <td className={`px-6 py-4 text-right text-sm font-bold ${balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                                {formatCurrency(balance)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    </table>
                                    {!currentTermRecords?.data?.filter(r => r.status === drillDownStatus).length && <div className="px-6 py-3 text-center p-10 my-10 tex font-bold text-gray-400 ">
                                        {`No ${drillDownStatus} Payment found For ${selectedSession} » ${selectedTerm} `}
                                    </div>}
                                    {currentTermRecords?.data?.length >= 14 && <div className=" text-center text-blue-600 font-xl  hover:pointer-cursor"
                                        onClick={() => {
                                            setShowAllStudents(true);
                                        }}
                                    > »» see all</div>}
                                </div>
                            </div>
                        )}
                        </div>
                    </div>

                {/* Quick Actions & Pending Invoices
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Pending Invoices</h3>
                        <div className="space-y-4">
                            {[
                                { class: 'JSS 1 A', count: 12, amount: 1800000 },
                                { class: 'JSS 1 B', count: 8, amount: 1200000 },
                                { class: 'SSS 3', count: 5, amount: 750000 },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">{item.class}</div>
                                        <div className="text-xs text-rose-500 font-bold mt-0.5">{item.count} Unpaid</div>
                                    </div>
                                    <div className="font-black text-slate-900">
                                        ₦{item.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white shadow-md">Send Reminders</Button>
                    </div>
                </div> */}
            </div>
            {/* PARENT,DIRECTOR PAYMENT FORM MODAL */}
                <Modal isOpen={isPaymentFormModalOpen} onClose={() => setIsPaymentFormModalOpen(false)} title="Complete Payment Details" size="lg">
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-bold text-gray-500 uppercase">Total Amount </p>
                                    <h3 className="text-2xl font-bold text-navy-900">{formatCurrency(studentsPaymentAmount || 0)}</h3>
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
                                    <p className="font-bold text-navy-900">Wallet Balance (Coupon): {formatCurrency(walletBalance || 0)}</p>
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
                
                {showAllStudents && drillDownStatus && 
                <AllPaymentStudents
                    schoolId={selectedSchool?.id}
                    sessionId={selectedSchool.sessions?.find(t => t.is_current)?.id}
                    termId={selectedSchool.terms?.find(t => t.is_current)?.id}
                    type={drillDownStatus}
                    requestSender={sendRequest}
                    setLedgerStudentId={setLedgerStudentId}
                    showAllStudents={showAllStudents}
                    setShowAllStudents={setShowAllStudents}
                />}

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

            {!!receiptImageToView && <div className="z-[999]">
                <ImageViewer 
                    isOpen={!!receiptImageToView} 
                    imageUrl={ prepareImageUrl(receiptImageToView, urls.BASE_URL) || undefined} 
                    onClose={() => setReceiptImageToView(null)} 
                    altText="Payment Receipt"
                />
            </div>}

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
