import { useContext, useEffect, useRef, useState } from 'react';
import { FadeIn, Modal, Button, PinModal, ImageUpload, ImageViewer } from '../../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import { Star } from 'lucide-react';
import useRequest from '@/customHooks/RequestHook';
import PaymentDetails from './PaymentDetails';

const PaymentPage = ({
    userRole, // parent or director: currently on director 
    defaultBank,
    walletBalance,
    students,
    setStudents,
    studentsPaymentAmount,
    paymentStudents,
    setPaymentStudents,
    setIsPaymentFormModalOpen,
    isStudentSelectionModalOpen,
    setIsStudentSelectionModalOpen,
    pendingPayments,
    setReceiptImageToView ,
}) => {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    }
    const [search, setSearch] = useState('');
    const {setToast,isLoading,classRooms,schoolFees,selectedSchool}= useContext(uiContext) ;
    const {sendRequest} = useRequest() ;
    const [selectedHistoryPayment,setSelectedHistoryPayment] = useState(null)
    
    const TriggeredFunc = (data:any) => {
        if (data?.success === "searchResults"){
            // only students not already in the list of the students 
            let searched = data?.results.filter((res) => students.find(s => s.id !== res.id))
            setStudents((prev) => [...searched,...prev])
            return;
        }
    }
    const filteredStudents = students.filter(s => {
        //   let status = (filterStatus == "Active") ? true :false
          const matchSearch = (s.first_name + s.last_name + s.admission_number + s.email ).toLowerCase().includes(search.toLowerCase());
        //   const matchStatus = filterStatus === 'All' || s.user.is_active === status ;
        //   const matchClass = filterClassIds.length === 0 || s.class_rooms.filter(cls => cls.status === 'active' || cls.status === 'enrolled').map((cls) => cls.class_room).some(cid => filterClassIds.includes(cid));
          return matchSearch 
        //   && matchStatus && matchClass;
      });
    const handlePaymentStudent = (e :any ,studentId:any) => {
         if (e.target.checked) {
            if (userRole !== "director"){  // single selection 
                setPaymentStudents([studentId])
            }else {
                setPaymentStudents([...paymentStudents, studentId])
            }
         } else {
            setPaymentStudents(paymentStudents.filter(id => id !== studentId))
         };
    }
    
      const allowSearch = useRef(true);
      useEffect(() => {
        if (search.length && !filteredStudents.length && allowSearch.current) {
          sendRequest(`/student/search/${selectedSchool?.id}/${search}/`, "GET", null as any , TriggeredFunc, true, false)
          allowSearch.current = false;
          setTimeout(() => {
            allowSearch.current = true;
          }, 500);
        }
        return setReceiptImageToView(null) ;
      }, [search]);
    const addButtonRef = useRef(null)
    useEffect(() => {
        addButtonRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        })
    }, [])
    return ( <div>
         <FadeIn>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                            <div className="px-6 py-4  border-b border-gray-200 "ref = {addButtonRef}>
                                <div className="flex justify-between  "  >
                                    <h3 className="font-bold text-navy-900 text-lg">Initiate Fee Payment</h3>
                                    <Button
                                        disabled={isLoading}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-navy-900 text-white rounded-lg hover:bg-navy-600 transition w-fit animate-pulse max-w-fit"
                                        onClick={() => {
                                            setIsStudentSelectionModalOpen(true);
                                            }} variant = "primary"  
                                            >
                                            <i className='fa-solid fa-plus'></i>
                                            Select Students Here 
                                    </Button>
                                </div>
                                <p className="text-sm text-gray-500">Select students and provide payment details.</p>
                            </div>

                            {/* <div className="p-6 space-y-8 bbd "> */}
                                {/* School Bank Details Card (Always Visible) */}
                                {!(userRole?.toLowerCase() === "director") &&
                                    <>
                                        <div className="bg-navy-900 text-white p-6 rounded-xl shadow-inner border border-navy-700 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                                            <div className="flex justify-between ">
                                                <h4 className="text-gold-500 font-bold text-sm uppercase mb-4 flex items-center">
                                                    <i className="fa-solid fa-university mr-2"></i> School Bank Account Details
                                                </h4>
                                                <div className="flex items-center flex-row justify-end gap-4">
                                                    {/* Default badge */}
                                                    {defaultBank?.is_default && (
                                                    <span className="text-xs py-1 bg-yellow-100 text-yellow-700 px-2  mb-2 rounded-full flex items-cente gap-1">
                                                        <Star size={12} /> Default
                                                    </span>
                                                    )}
                                                    
                                                    {/* Active / Inactive */}
                                                    <span
                                                    className={`inline-block text-xs py-1 px-2  rounded-full mb-2 ${
                                                        defaultBank?.is_active
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-600"
                                                    }`}
                                                    >
                                                    {defaultBank?.is_active ? "Active" : "Inactive"} 
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="space-y-1">
                                                    <p className="text-navy-300 text-xs font-bold uppercase">Bank Name</p>
                                                    <div className="flex items-center gap-4">
                                                        <p className="font-bold text-lg">{defaultBank?.bank_name || '-'}</p>
                                                        <button onClick={() => { 
                                                            navigator.clipboard.writeText(defaultBank?.bank_name || '');
                                                            setToast({type: 'success', message: 'Bank name copied to clipboard!'});



                                                        }} className="text-navy-400 hover:text-white transition-colors">
                                                            <i className="fa-solid fa-copy"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-navy-300 text-xs font-bold uppercase">Account Number</p>
                                                    <div className="flex items-center gap-4">
                                                        <p className="font-bold text-lg tracking-wider">{defaultBank?.account_number || '-'}</p>
                                                        <button onClick={() => { 
                                                            navigator.clipboard.writeText(defaultBank?.account_number || '');
                                                            setToast({type: 'success', message: 'Account number copied to clipboard!'});
                                                            
                                                        }} className="text-navy-400 hover:text-white transition-colors">
                                                            <i className="fa-solid fa-copy"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-navy-300 text-xs font-bold uppercase">Account Name</p>
                                                    <div className="flex items-center gap-4">
                                                        <p className="font-bold text-lg">{defaultBank?.account_name || '-'}</p>
                                                        <button onClick={() => { 
                                                            navigator.clipboard.writeText(defaultBank?.account_name || '');
                                                            setToast({type: 'success', message: 'Account name copied to clipboard!'});
                                                        }} className="text-navy-400 hover:text-white transition-colors">
                                                            <i className="fa-solid fa-copy"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="mt-4 text-xs text-navy-300 italic">Please ensure you use the student's admission number as the transfer description.</p>
                                        </div>

                                        {/* Wallet Balance (Always Visible) */}
                                        <div className="bg-navy-50 p-4 rounded-lg border border-navy-100 flex justify-between items-center">
                                            <div>
                                                <p className="font-bold text-navy-900">Wallet Balance (Coupon): {formatCurrency(walletBalance)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {walletBalance > 0 
                                                        ? "You can apply your available coupon balance during payment to reduce the total." 
                                                        : "You currently have no coupon balance available."}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                }

                            {/* </div> */}
                        </div>

                        {/* Payment History */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-navy-900">My Payment History</h3>
                                <p className="text-xs text-gray-500">Includes both self-initiated and accountant-recorded payments.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date(s)</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Payer</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ref No</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {/* Combine pendingPayments and accountant payments from feeRecords */}
                                        {pendingPayments?.map(p => {

                                            return (
                                            <tr key={p?.id} className="hover:bg-gray-50" onClick={() => {setSelectedHistoryPayment(p)}}>
                                                <td className="px-6 py-4 text-sm text-gray-500"> {new Date(p?.date_initiated).toLocaleDateString()}</td>
                                                <td className="px-6 py-4">
                                                        <p className="text-xs text-gray-600 font-medium">{p.students?.length} Student(s)</p>
                                                        
                                                        

                                                        {/* {(p?.payment_method === "CASH") && <div className="mt-1 space-y-0.5"> */}
                                                            <p className="text-xs text-gray-500">{p?.payment_method} </p>
                                                        {/* </div>} */}
                                                        {/* {p?.note && <p className="text-xs text-golden-600 italic mt-2 bg-golden-50 p-1.5 rounded border border-golden-100">Reason: {p?.note}</p>} */}
                                                    </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{p?.payer}</td> 
                                                <td className="px-6 py-4 text-sm text-gray-600">{p?.ref_number}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-right text-navy-900">{formatCurrency(p?.total_amount)}</td>
                                                <td className="px-6 py-4 text-center ">
                                                    <div className="flex flex-col gap-2 items-center">
                                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${p?.status === 'PENDING' ? 'bg-gold-100 text-gold-700' : p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {p?.status}
                                                        </div>
                                                       {p?.status !== 'PENDING' && <div className="px-6 text-xs text-gray-600">{new Date(p?.date_resolved).toLocaleDateString()}</div>}

                                                    </div>
                                                </td>
                                            </tr>)
                                            })}
                                        {pendingPayments?.length === 0 &&  (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No payment history found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </FadeIn>
                    
                    <Modal isOpen={isStudentSelectionModalOpen} onClose={() => setIsStudentSelectionModalOpen(false)} title={
                        <div className='flex justify-between items-center  '>
                            <p>Select or Search Student </p>
                            {paymentStudents?.length > 0 && 
                            <div className='flex gap-5'>
                            <div className="text-right p-1">
                                <p className="text-xs font-bold text-gray-500 uppercase">Selected</p>
                                <h3 className="text-sm font-bold text-navy-900">{paymentStudents.length} Students</h3>
                            </div>
                            <div className="text-right p-1">
                                <p className="text-xs font-bold text-gray-500 uppercase">Total Amount </p>
                                <h3 className="text-sm font-bold text-navy-900">{formatCurrency(studentsPaymentAmount)}</h3>
                            </div>
                                
                            </div>}
                        </div>
                        
                    } className={"relative"} > 
                                        <div className="sticky -top-6 -mt-5">
                                            <div className="relative  flex justify-between gap-3 items-center shadow-md bg-gray-100 max-w-full mb-2"><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                                <input type="search" placeholder="Search Student by name, admission no,email or  ID..." value={search} onChange={e => setSearch(e.target.value)}
                                                    autoFocus
                                                    className="w-fit flex-1 pl-9 pr-3 py-2 border   border-gray-300 rounded-md focus:outline-none focus:border-navy-500" 
                                                />
                                                
                                            </div>
                                        </div>
                                        <div className="grid grid-cols1 sm:grid-cols-1 lg:grid-cols-2 gap-3  overflow-y-auto max-h-[75vh] h-full">
                                            {
                                                filteredStudents?.map(student => {
                                                    let classes = classRooms.filter((cls)=> student?.active_class_rooms?.includes(cls.id))
                                                    return (
                                                        <label key={student.id} className={`flex items-center p-2 border rounded-xl cursor-pointer transition-all ${paymentStudents.includes(student.id) ? 'bg-navy-50 border-navy-500 ring-1 ring-navy-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                                            <div className=''>
                                                                <input type="checkbox" className="hidden" checked = {paymentStudents.includes(student.id)} onChange={(e) => {
                                                                   handlePaymentStudent(e,student.id)
                                                                }} />
                                                                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-4 flex-shrink-0 ${paymentStudents.includes(student.id) ? 'bg-navy-900 border-navy-900' : 'border-gray-300'}`}>
                                                                    {paymentStudents.includes(student.id) && <i className="fa-solid fa-check text-white text-xs"></i>}
                                                                </div>
                                                            </div>

                                                            <div className='flex justify-between flex-1'>
                                                                <div>
                                                                    <p className="font-bold text-navy-900">{student?.first_name} {student?.last_name}</p>
                                                                    <p className="text-xs text-gray-500">{student?.is_active ? 'Active' : 'N/A'}-{student?.admission_number}</p>
                                                                </div>
                                                                {classes?.map(cls => {
                                                                    let clsfee = schoolFees.find(sf => sf.class_rooms.includes(cls.id))?.amount || "null"
                                                                    return(
                                                                    <span key={cls.id} className="text-xs text-gray-500">{cls.name}-<span className='font-bold'>({clsfee})</span></span>
                                                                )})}
                                                            </div>
                                                        </label>
                                                    )
                                                })
                                            }
                                        </div>
                                        {
                                        paymentStudents.length > 0 && 
                                            <div className="sticky -bottom-5  flex justify-end pt-4 border-t border-gray-200">
                                                <Button 
                                                    disabled={isLoading}
                                                    onClick={() => setIsPaymentFormModalOpen(true)} className="bg-navy-900 text-white px-8">
                                                    Proceed to Payment
                                                </Button>
                                            </div>
                                        }
                    </Modal>

                    <PaymentDetails
                        historyPayment = {selectedHistoryPayment}
                        setHistoryPayment = {setSelectedHistoryPayment}
                        setReceiptImageToView = { setReceiptImageToView }
                    />
    </div> );
}
 
export default PaymentPage;