import useRequest from "@/customHooks/RequestHook";
import { Button, Modal } from "../UI";
import { useContext, useEffect, useState } from "react";
import { uiContext } from "@/customContexts/UiContext";

const PaymentDetails = ({
        historyPayment,
        setHistoryPayment,
        setReceiptImageToView
    }) => {
    const {selectedSchool} = useContext(uiContext);
    const {sendRequest} = useRequest();
    const [selectedHistoryPayment,setSelectedHistoryPayment] = useState<any>()

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };
    const triggeredFunc = (resp) => {
        console.log('resp: ', resp);
        if (resp?.fetchedPayment){
            setSelectedHistoryPayment(resp?.fetchedPayment)
        }
    }
    useEffect(() => {
        setSelectedHistoryPayment(historyPayment)
        if (historyPayment){
            let url = `/school_finance/director-get-payment-records/${selectedSchool?.id}/${historyPayment?.id}/` ;
            sendRequest(url,"GET",null as any,triggeredFunc,true,false)
        }
    },[historyPayment,]);
    
    return (
        <div>
             <Modal isOpen={!!historyPayment} onClose={() => setHistoryPayment(null)} title="Payment Transaction Details" size="sm" >
                {selectedHistoryPayment && (
                    <div className="space-y-6">
                        <div className="bg-navy-50 p-6 rounded-xl border border-navy-100 relative">
                            <i className="fa-solid fa-file-invoice-dollar absolute top-6 right-6 text-4xl text-navy-200"></i>
                            <h3 className="font-black text-2xl text-navy-900 mb-1">{formatCurrency(selectedHistoryPayment?.total_amount)}</h3>
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider">{selectedHistoryPayment.payer}</p>
                            
                            <div className="mt-4 flex items-center gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedHistoryPayment.status === 'PENDING' ? 'bg-gold-100 text-gold-700' : selectedHistoryPayment.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    <i className={`mr-1 fa-solid ${selectedHistoryPayment.status === 'PENDING' ? 'fa-hourglass-half' : selectedHistoryPayment.status === 'APPROVED' ? 'fa-check-double' : 'fa-times-circle'}`}></i>
                                    {selectedHistoryPayment.status}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Date Initiated</p>
                                    <p className="font-medium text-navy-900">{new Date(selectedHistoryPayment?.date_initiated).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Date Resolved</p>
                                    <p className="font-medium text-navy-900">{selectedHistoryPayment.date_resolved ? new Date(selectedHistoryPayment.date_resolved).toLocaleString() : 'not set '}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-xs text-gray-500 font-bold uppercase">Approver / Resolved By</p>
                                    <p className="font-medium text-navy-900 flex items-center gap-2">
                                        {selectedHistoryPayment.resolved_by ? (
                                            <><i className="fa-solid fa-user-shield text-green-600"></i> {selectedHistoryPayment.resolved_by}</>
                                        ) : (
                                            <><span className="text-gray-400 italic">None</span></>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase ">Ref No</p>
                                    <code className="font-medium text-navy-900 bg-navy-50 px-2 py-0.5 rounded border border-gray-200 ">{selectedHistoryPayment.ref_number|| 'NULL'}</code>
                                </div>
                            </div>
                            
                            <div className="border-t border-gray-100 pt-4">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-3">Transaction Details</p>
                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                    <div className="flex justify-between items-center mb-3 pb-3 border-b border-gray-200">
                                        <span className="font-bold text-navy-900">Eligible Students</span>
                                        <span className="bg-navy-100 text-navy-800 text-xs font-bold px-2 py-1 rounded-full">{selectedHistoryPayment.students?.length || 0}</span>
                                    </div>

                                    {(selectedHistoryPayment?.payment_method !== "CASH") && <div className="mt-1 space-y-0.5 bg-gray-50 rounded-lg p-2 border border-gray-200 flex gap-4 items-center justify-between m-2">
                                        <p className="text-xs text-gray-500">Phone: <span className="font-medium text-gray-700">{selectedHistoryPayment?.phone_number}</span></p>
                                        <p className="text-xs text-gray-500">Bank: <span className="font-medium text-gray-700">{selectedHistoryPayment?.bank_name || 'N/A'}</span></p>
                                        <p className="text-xs text-gray-500">Acct: <span className="font-medium text-gray-700">{selectedHistoryPayment?.account_number}</span></p>
                                    </div>}
                                    <ul className="space-y-2">
                                        {(selectedHistoryPayment.students || []).map((s,idx) => {
                                            const studentInfo = s ;
                                            return (
                                                <li key={idx} className="flex justify-between items-center text-sm">
                                                    <span className="flex items-center bg-white px-2 py-0.5 rounded border border-gray-200 ">
                                                        <span className="text-gray-700 pr-1">{studentInfo ? `${studentInfo.first_name} ${studentInfo.last_name}` : `Student ID: ${studentInfo?.admission_number}`}</span>
                                                        • <span className="text-xs text-gray-700 pl-1">{studentInfo?.admission_number}</span>
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200">
                                                        {selectedHistoryPayment?.payment_method}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                            
                            {selectedHistoryPayment?.note && (
                                <div className="border-t border-gray-100 pt-4">
                                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Manager Note / Rejection Reason</p>
                                    <div className="bg-red-50 p-3 rounded border border-red-100 text-sm text-red-800 italic">
                                        "{selectedHistoryPayment.note}"
                                    </div>
                                </div>
                            )}

                            {selectedHistoryPayment?.payment_method === 'TRANSFER' && selectedHistoryPayment?.receipt_image && (
                                <div className="border-t border-gray-100 pt-4 text-center">
                                    <Button 
                                        variant="secondary" 
                                        onClick={() => {
                                            setReceiptImageToView(selectedHistoryPayment.receipt_image);
                                        }}
                                        className="w-full justify-center"
                                    >
                                        <i className="fa-solid fa-search-plus mr-2"></i> View Attached Receipt
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
 
export default PaymentDetails;