import { useEffect, useState } from "react";
import { FadeIn, Modal, Paginator } from "../UI";

const AllPaymentStudents = ({schoolId,
    sessionId,
    termId,
    type,
    requestSender,
    setLedgerStudentId,
    showAllStudents,
    setShowAllStudents

}) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };
    let url = `/school_finance/all-student-trx/${schoolId}/${sessionId}/${termId}/${type}/`
    const [allStudents, setAllStudents] = useState<any[] | any>(null);
    const [totalStudents, setTotalStudents] = useState<number|any>(0);

    let TriggeredFunc = (resp) => {
        let searchField = `${type?.toLowerCase()}_count`;
        console.log('resp: ', resp);
        setAllStudents(resp.results?.paginated_data?.data || []);
        setTotalStudents(resp.results?.paginated_data[searchField] || totalStudents);
    }
    useEffect(() => {
        requestSender(url, "GET", null, TriggeredFunc,!true,false);
        return () => {setAllStudents(null);
        }
    },[])
    return ( 
        <FadeIn>
            <Modal
                isOpen={showAllStudents}
                onClose={() => setShowAllStudents(false)}
                title={`All ${type} Students `}
                icon="fa-solid fa-users"
                >
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar relative">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-white sticky top-0 shadow-sm">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Admission No</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Student Name</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Total Due</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount Paid</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Payer</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Net Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {allStudents?.map(r => {
                                                    const balance = r.net_balance;
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
                {allStudents?.length===0 && <div className="text-center text-gray-400 py-4">No students Transection fount for {type} payments.</div>}
                {allStudents === null && <div className="text-center text-gray-400 py-8">Loading students...</div>}
                {totalStudents  > 15 && <Paginator 
                    currentLength={totalStudents}
                    setData={setAllStudents}
                    filteredData={allStudents}
                    schoolId = {schoolId}
                    url={url}
                    sendRequest={requestSender}
                />}
            </Modal>
        </FadeIn>

    );
}
 
export default AllPaymentStudents;