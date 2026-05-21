import { useContext, useEffect, useRef, useState } from 'react';
import { FadeIn } from '../../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import PaymentDetails from './PaymentDetails';

const SearchPayment = ({
    setReceiptImageToView ,
}) => {

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    }
    const [search, setSearch] = useState('');
    const {setToast,isLoading,pendingPayments,setPendingPayments,selectedSchool}= useContext(uiContext) ;
    const {sendRequest} = useRequest() ;
    const [selectedHistoryPayment,setSelectedHistoryPayment] = useState(null)
    
    const TriggeredFunc = (data:any) => {
        if (data?.searchResults){
            // only students not already in the list of the students 
            let searched = data?.searchResults.filter((res) => pendingPayments.find(s => s.id !== res.id))
            setPendingPayments((prev) => [...searched,...prev])
            return;
        }
    }
    const filteredPayments = pendingPayments.filter(payment => {
          const matchSearch = (payment.ref_number).toLowerCase().includes(search.toLowerCase());
          return matchSearch 
      });
   
      const allowSearch = useRef(true);
      useEffect(() => {
        if (search.length && !filteredPayments.length && allowSearch.current) {
          sendRequest(`/school_finance/search/payments/${selectedSchool?.id}/${search}/`, "GET", null as any , TriggeredFunc, true, false)
          allowSearch.current = false;
          setTimeout(() => {
            allowSearch.current = true;
          }, 500);
        }
      }, [search]);

    return ( <div>
         <FadeIn>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-8 ">
                        <div className="relative  flex justify-between gap-3 items-center shadow-md bg-gray-100 max-w-full m-2">
                            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="search" placeholder="Search Payment by REFERENCE NUMBER  only ..." value={search} onChange={e => setSearch(e.target.value)}
                                autoFocus
                                className="w-fit flex-1 pl-9 pr-3 py-2 border   border-gray-300 rounded-md focus:outline-none focus:border-navy-500" 
                            />
                        </div>
                    </div>

                        {/* Payment Records */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="px-6  py-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-bold text-navy-900">My Payment Records </h3>
                                <p className="text-xs text-gray-500">Includes both self-initiated and accountant-recorded payments.</p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Details</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Payer</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ref No</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {/* Combine pendingPayments and accountant payments from feeRecords */}

                                        {filteredPayments?.map(p => {
                                            return (
                                            <tr key={p?.id} className="hover:bg-gray-50" onClick={() => {setSelectedHistoryPayment(p)}}>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(p?.date_initiated).toLocaleDateString()}</td>
                                                
                                                <td className="px-6 py-4">
                                                        <p className="text-xs text-gray-600 font-medium">{p.students?.length} Student(s)</p>
                                                        
                                                        {(p?.payment_method !== "CASH") && <div className="mt-1 space-y-0.5">
                                                            <p className="text-xs text-gray-500">Phone: <span className="font-medium text-gray-700">{p.phone_number}</span></p>
                                                            <p className="text-xs text-gray-500">Bank: <span className="font-medium text-gray-700">{p.bank_name || 'N/A'}</span></p>
                                                            <p className="text-xs text-gray-500">Acct: <span className="font-medium text-gray-700">{p.account_number}</span></p>
                                                        </div>}

                                                        {(p?.payment_method === "CASH") && <div className="mt-1 space-y-0.5">
                                                            <p className="text-xs text-gray-500">{p?.payment_method} </p>
                                                        </div>}
                                                        {p?.note && <p className="text-xs text-red-600 italic mt-2 bg-gold-50 p-1.5 rounded border border-gold-100">Reason: {p?.note}</p>}
                                                    </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{p?.payer}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{p?.ref_number}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-right text-navy-900">{formatCurrency(p?.total_amount)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${p?.status === 'PENDING' ? 'bg-gold-100 text-gold-700' : p.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {p?.status}
                                                    </span>
                                                </td>
                                            </tr>)
                                            })}
                                        {filteredPayments?.length === 0 &&  (
                                            <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No payment history found.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                    </div>
                    </FadeIn>

                    <PaymentDetails
                        historyPayment = {selectedHistoryPayment}
                        setHistoryPayment = {setSelectedHistoryPayment}
                        setReceiptImageToView = { setReceiptImageToView }
                    />
    </div> );
}
 
export default SearchPayment;