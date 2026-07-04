import React, { useState, useMemo, useRef, useContext,useEffect  } from 'react';
import { FadeIn, Modal, Button, PinModal, ImageUpload, ImageViewer } from '@/components/UI';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import { Star } from 'lucide-react';
import PaymentPage from '@/components/finance/PaymentSection';
import StudentLedger from '@/components/finance/StudentLedger';
import PaymentDetails from '@/components/finance/PaymentDetails';
import urls from '@/customHooks/ServerUrls';

interface FinanceManagerProps {
    personalMode?: boolean; // New Prop
   
}


const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export const ParentFinanceManager: React.FC<FinanceManagerProps> = ({ 
    personalMode = false, 
     
}) => {
    const [serverForm,setServerForm] = useState<{}|any>({});
    const {sendRequest} = useRequest();
    const {
        setToast,
        students,
        setStudents ,
        parents,
        selectedSchool,
        finances,   
        schoolFees,
        isLoading,
        pendingPayments,
        setPendingPayments

    } = useContext(uiContext);

    const defaultBank = finances?.bank_accounts?.find(acc => acc.is_default && acc.is_active ) || null;
    const {currentUser} = useContext(authContext) ;
    const currentUserId = currentUser?.user?.id || '';
    
    
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
    const [isStudentSelectionModalOpen,setIsStudentSelectionModalOpen] = useState(false);
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

    const [ledgerStudentId, setLedgerStudentId] = useState<string | null>(null);
    const [ledgerDateFilter, setLedgerDateFilter] = useState('');
    const [receiptImageToView, setReceiptImageToView] = useState<string | null>(null);

    // Validation Tabs State


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
        setActionToValidate(null);
        
        if (resp?.allPayments){
            setPendingPayments(resp?.allPayments)
            return
        }
        if (resp?.approvedPayments){
            setActionToValidate(null);
            setPendingPayments((prev) => prev.map(p => resp?.approvedPayments?.includes(p.id)? {...p ,status : "APPROVED"} : p ))
            return
        }
        if (resp?.newPendingPayment){
            setPendingPayments(prev => [resp?.newPendingPayment,...prev])
            setIsPaymentFormModalOpen(false);
            setIsStudentSelectionModalOpen(false);
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
        const payerName = currentUser?.full_name ?`${currentUser?.role}_${currentUser?.full_name}`: `${currentUser?.role}_${currentUser?.first_name} ${currentUser?.last_name}`
        let form = new FormData()

        form.append("school",selectedSchool?.id)
        form.append("students",JSON.stringify(paymentStudents))
        form.append("total_amount",`${amount}`)
        form.append("session",sessionId)
        form.append("term",termId)
        form.append("payer",payerName)
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
            let url = `/school_finance/payments/create-by-parent/` ;
            sendRequest(url,"POST",form as any ,TriggeredFunc,true,true) ;
            return ;
        }
        setPinModalOpen(true);
    }


    const handlePinsuccess = (pins: string) => {
        setPinModalOpen(false);
        if (actionToValidate) {
            if (actionToValidate.type === 'SUBMIT_PAYMENT') {
                serverForm.append('pin',pins)
                let url = `/school_finance/payments/create-by-parent/`
                sendRequest(url,"POST",serverForm as any ,TriggeredFunc,true,true)
                return 
            }
        }
    }
    
    
    
    // fetch payments 
    useEffect(() => {
        let url = `/school_finance/payment-records-by-parent/${selectedSchool.id}/`;
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


    // const TabButton = ({ id, label, icon }: { id: FinanceTab, label: string, icon: string }) => (
    //     <button
    //         onClick={() => setActiveTab(id)}
    //         className={`px-4 py-2 rounded-md text-sm font-bold flex items-center transition-all whitespace-nowrap ${
    //             activeTab !== id ? 'bg-navy-800 text-white shadow-md border border-md border border-gold-400 b-2' : 'bg-white/90 text-gray-800 hover:bg-navy-50 hover:text-navy-700'
    //         }`}
    //     >
    //         <i className={`${icon} mr-2`}></i> {label}
    //     </button>
    // );

   

    return (
        <div className="h-full flex flex-col space-y-4 animate-fadeIn max-h-screen">
            {/* Personal Mode Header */}
            {(
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">My Finances</h2>
                        <p className="text-sm text-gray-500">
                            Manage fee payments and view transaction history for your children.
                        </p>
                    </div>
                    
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar -mb-2">
                {/* --- PAYMENT (Make Payment) --- */}
                {( 
                    <PaymentPage
                        userRole = {currentUser?.role || 'parent'}
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

                {/* PARENT, FORM MODAL */}
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
                                    setPaymentAmount(total?.toString());
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
                
                
               
            </div>
            
            <PaymentDetails
                historyPayment={historyPayment}
                setHistoryPayment={setHistoryPayment}
                setReceiptImageToView ={setReceiptImageToView}
            />
            
           
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