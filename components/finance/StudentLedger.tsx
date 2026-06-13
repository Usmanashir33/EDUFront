import { useContext, useEffect, useState } from "react";
import { FadeIn, Modal } from "../UI";
import useRequest from "@/customHooks/RequestHook";
import { uiContext } from "@/customContexts/UiContext";
import urls from "@/customHooks/ServerUrls";

const StudentLedger = ({
    ledgerStudentId,
    setLedgerStudentId,
    ledgerDateFilter,
    setLedgerDateFilter,
    setReceiptImageToView
}) => {
    const {sendRequest} = useRequest();
    const {selectedSchool,classRooms} =  useContext(uiContext);
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };
    const [studentData,setStudentData] = useState<any>({})

    const triggeredFunc = (resp) => {
        // console.log('resp: ', resp);
        setStudentData(resp.studentLedger)
    }
    const filteredEntries = studentData?.ledgerEntries?.filter(entry => {
            if (!ledgerDateFilter) return true;
            return entry?.created_at.startsWith(ledgerDateFilter);
        });
        
    useEffect(() => {
        if (!ledgerStudentId){return };
        let url = `/school_finance/trxs/student-ledger/${selectedSchool?.id}/${ledgerStudentId}/`
        sendRequest(url,"GET",null as any,triggeredFunc,true,false)
    },[ledgerStudentId]);

    return ( 
        <FadeIn>
            <Modal 
                            isOpen={!!ledgerStudentId} 
                            onClose={() => { setLedgerStudentId(null); setLedgerDateFilter(''); }} 
                            title={
                                (ledgerStudentId && studentData?.ledgerEntries) ? (() => {
                                    const runningBalance =  studentData?.ledgerEntries[0]?.net_balance  || 0 ;
                                    const clss = classRooms.filter(cls => studentData?.student?.active_class_rooms?.includes(cls.id))
                                    
                                    return (
                                        <div className="flex items-center gap-4 w-full pr-8 ">
                                            <img className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-xl flex-shrink-0"
                                                src={urls.BASE_URL + studentData?.student.picture} alt="pic"
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-navy-900 text-lg">{studentData?.student?.first_name}{studentData?.student?.last_name}</h3>
                                                <p className="text-sm text-gray-500 font-normal">{studentData?.student?.admission_number} • {clss.map(cl => <span key={cl.id}>{cl.name || "N/A"}</span> )}</p>
                                            </div>
                                            <div className="text-right flex-shrink-0">
                                                <p className="text-xs font-bold text-gray-500 uppercase">Net Balance</p>
                                                <h3 className={`text-xl font-bold ${runningBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {formatCurrency(runningBalance)}
                                                </h3>
                                            </div>
                                        </div>
                                    ) ;
                                })() : "Student Transaction Ledger"
                            } 
                            size="lg"
                        >
            
                                
                                    <div className="space-y-4 relative overflow-y-auto max-h-[75vh]">
                                        <div className=" sticky top-0 flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                                            <span className="text-sm font-bold text-gray-700">Filter by Date:</span>
                                            <input 
                                                type="date" 
                                                value={ledgerDateFilter} 
                                                onChange={(e) => setLedgerDateFilter(e.target.value)}
                                                className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-500"
                                            />
                                            {ledgerDateFilter && (
                                                <button onClick={() => setLedgerDateFilter('')} className="text-xs text-red-500 hover:underline ml-2">Clear</button>
                                            )}
                                        </div>
            
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                                            {filteredEntries?.map(entry => (
                                                <div key={entry.id} className={`p-4 rounded-xl border ${entry?.transaction_type === 'FEE' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200/50 mb-2">
                                                        <span className="text-xs font-bold text-gray-500 uppercase">Balance After</span>
                                                        <span className="font-bold text-navy-900">{formatCurrency(entry?.net_balance)}</span>
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-navy-900">{entry.description}</p>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                <i className="fa-regular fa-calendar mr-1"></i> {new Date(entry?.created_at).toLocaleDateString()}
                                                            </p>

                                                            {entry.transaction_type === 'PAYMENT' && (
                                                                <div className="mt-2 space-y-1">
                                                                    <p className="text-xs text-gray-600"><span className="font-semibold">Payer:</span> {entry?.payment_details?.payer}</p>
                                                                    <p className="text-xs text-gray-600"><span className="font-semibold">Method:</span> {entry?.payment_details?.payment_method}</p>
                                                                    <p className="text-xs text-gray-600"><span className="font-semibold">Ref No: </span> {entry?.payment_details?.ref_number}</p>
                                                                    {entry?.accountNumber && <p className="text-xs text-gray-600"><span className="font-semibold">Account:</span> {entry?.payment_details?.account_number}</p>}
                                                                    {entry?.note && <p className="text-xs text-gray-600"><span className="font-semibold">Note:</span> {entry?.note}</p>}
                                                                    {entry?.receiptImage && (
                                                                        <button 
                                                                            onClick={() => setReceiptImageToView(entry?.receiptImage || null)}
                                                                            className="text-xs text-navy-600 hover:text-navy-800 font-bold mt-1 flex items-center"
                                                                        >
                                                                            <i className="fa-solid fa-image mr-1"></i> View Receipt
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}

                                                        </div>
                                                        <div className="text-right">
                                                            <p className={`font-bold text-lg ${entry.transaction_type === 'FEE' ? 'text-red-600' : 'text-green-600'}`}>
                                                                {['FEE'].includes(entry?.transaction_type) && `- ${formatCurrency(entry?.total_amount)}`}
                                                                {['PAYMENT',"REFUND"].includes(entry?.transaction_type) && `+ ${formatCurrency(entry?.amount_paid)}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}

                                            {filteredEntries?.length === 0 && (
                                                <div className="text-center p-8 text-gray-500">No transaction history found for the selected criteria.</div>
                                            )}
                                        </div>
                                    </div>
            </Modal>
        </FadeIn>
     );
}
 
export default StudentLedger;