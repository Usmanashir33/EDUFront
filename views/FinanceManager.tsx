import React, { useState, useMemo } from 'react';
import { Student, Teacher, Staff, Transaction, FeeRecord } from '../types';
import { Button, FadeIn, Modal } from '../components/UI';

interface FinanceManagerProps {
    students: Student[];
    teachers: Teacher[];
    staff: Staff[];
    personalMode?: boolean; // New Prop
    currentUserId?: string; // New Prop
    currentUserRole?: string; // New Prop
}

type FinanceTab = 'OVERVIEW' | 'FEES' | 'PAYROLL' | 'TRANSACTIONS';
type FeeStatusDrillDown = 'PAID' | 'PARTIAL' | 'UNPAID' | null;

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
};

export const FinanceManager: React.FC<FinanceManagerProps> = ({ 
    students, teachers, staff, 
    personalMode = false, 
    currentUserId, 
    currentUserRole 
}) => {
    const [activeTab, setActiveTab] = useState<FinanceTab>(personalMode ? 'OVERVIEW' : 'OVERVIEW');
    const [selectedTerm, setSelectedTerm] = useState<string>('1st Term');
    const [drillDownStatus, setDrillDownStatus] = useState<FeeStatusDrillDown>(null);

    // --- DATA GENERATION ---
    const termFee = 150000;
    
    // Generate Fee Records
    const feeRecords: FeeRecord[] = useMemo(() => {
        const terms = ['1st Term', '2nd Term', '3rd Term'];
        let targetStudents = students;
        
        // If personal student mode, only show current user
        if (personalMode && currentUserRole === 'student') {
            targetStudents = students.filter(s => s.id === currentUserId);
        }

        return targetStudents.flatMap((s, idx) => {
            return terms.map((term, tIdx) => {
                const hash = (idx + tIdx) % 4; 
                let status: FeeRecord['status'] = 'UNPAID';
                let paid = 0;

                if (hash === 0 || hash === 3) { status = 'PAID'; paid = termFee; }
                else if (hash === 1) { status = 'PARTIAL'; paid = 75000; }
                else { status = 'UNPAID'; paid = 0; }

                if (term === '3rd Term' && hash !== 0) { status = 'UNPAID'; paid = 0; }

                return {
                    id: `fee-${s.id}-${tIdx}`,
                    studentId: s.id,
                    session: '2023/2024',
                    term: term,
                    amountPaid: paid,
                    totalDue: termFee,
                    status: status,
                    lastPaymentDate: status !== 'UNPAID' ? '2023-10-15' : undefined
                };
            });
        });
    }, [students, personalMode, currentUserId, currentUserRole]);

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
    }, [feeRecords, teachers, students, staff, personalMode, currentUserId, currentUserRole]);


    // --- STATS ---
    const currentTermRecords = feeRecords.filter(r => r.term === selectedTerm);
    
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
                activeTab === id ? 'bg-navy-900 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-navy-50 hover:text-navy-700'
            }`}
        >
            <i className={`${icon} mr-2`}></i> {label}
        </button>
    );

    return (
        <div className="h-full flex flex-col space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                <div>
                    <h2 className="text-xl font-bold text-navy-900">{personalMode ? 'My Finances' : 'Financial Overview'}</h2>
                    <p className="text-sm text-gray-500">
                        {personalMode 
                            ? (currentUserRole === 'student' ? 'Fee History & Invoices' : 'Salary & Payslips')
                            : 'Track income, expenses, and fee collection.'}
                    </p>
                </div>
                {!personalMode && (
                    <div className="flex gap-2 justify-start md:justify-center bg-gray-100 p-1 rounded-lg overflow-x-auto w-full md:w-auto no-scrollbar">
                        <TabButton id="OVERVIEW" label="Dashboard" icon="fa-solid fa-chart-pie" />
                        <TabButton id="FEES" label="Fee Management" icon="fa-solid fa-money-bill-wave" />
                        <TabButton id="PAYROLL" label="Payroll" icon="fa-solid fa-file-invoice-dollar" />
                        <TabButton id="TRANSACTIONS" label="Ledger" icon="fa-solid fa-list" />
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1">
                
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

                {/* --- DIRECTOR VIEW (Existing) --- */}
                {!personalMode && activeTab === 'OVERVIEW' && (
                    <FadeIn>
                        {/* Term Filter */}
                        <div className="bg-navy-900 text-white p-6 rounded-xl shadow-lg mb-8 relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                             <div className="relative z-10 flex justify-between items-center">
                                 <div><h3 className="text-2xl font-bold mb-1">Fee Collection Analysis</h3><p className="text-navy-200 text-sm">Select a term to view specific fee performance.</p></div>
                                 <div className="flex items-center gap-3 bg-navy-800 p-2 rounded-lg border border-navy-700">
                                     <label className="text-sm font-bold text-navy-300 px-2">Academic Term:</label>
                                     <select value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value)} className="bg-navy-900 text-white border border-navy-600 rounded px-4 py-2 text-sm font-bold focus:outline-none focus:border-gold-500">
                                         <option>1st Term</option><option>2nd Term</option><option>3rd Term</option>
                                     </select>
                                 </div>
                             </div>
                        </div>
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div onClick={() => setDrillDownStatus('PAID')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-circle-check text-6xl text-green-600"></i></div>
                                <div className="relative z-10"><p className="text-xs font-bold uppercase text-gray-500 mb-2">Fully Paid</p><h3 className="text-3xl font-bold text-navy-900 mb-1">{currentTermRecords.filter(r => r.status === 'PAID').length} <span className="text-sm font-medium text-gray-400">Students</span></h3><p className="text-sm font-bold text-green-600">{formatCurrency(currentTermRecords.filter(r => r.status === 'PAID').reduce((acc,r) => acc + r.amountPaid, 0))}</p></div>
                            </div>
                            <div onClick={() => setDrillDownStatus('UNPAID')} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><i className="fa-solid fa-circle-xmark text-6xl text-red-600"></i></div>
                                <div className="relative z-10"><p className="text-xs font-bold uppercase text-gray-500 mb-2">Unpaid / Owing</p><h3 className="text-3xl font-bold text-navy-900 mb-1">{currentTermRecords.filter(r => r.status === 'UNPAID').length} <span className="text-sm font-medium text-gray-400">Students</span></h3><p className="text-sm font-bold text-red-600">{formatCurrency(currentTermRecords.filter(r => r.status === 'UNPAID').reduce((acc,r) => acc + r.totalDue, 0))}</p></div>
                            </div>
                             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Net Balance (All Time)</p>
                                <h3 className="text-3xl font-bold text-navy-900 mb-1">{formatCurrency(netBalance)}</h3>
                                <p className="text-xs text-gray-400">Income - Expenses</p>
                            </div>
                        </div>
                    </FadeIn>
                )}
                
                {!personalMode && activeTab === 'TRANSACTIONS' && (
                    <FadeIn>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-200"><h3 className="font-bold text-navy-900 text-lg">Transaction Ledger</h3></div>
                            <div className="overflow-x-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Ref</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Desc</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Cat</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{transactions.map(t => (<tr key={t.id} className="hover:bg-gray-50"><td className="px-6 py-4 text-xs font-mono text-gray-500">{t.reference}</td><td className="px-6 py-4 text-sm font-medium text-navy-900 truncate max-w-xs">{t.description}</td><td className="px-6 py-4 text-xs text-gray-600"><span className="bg-gray-100 rounded px-2 py-1 border border-gray-200">{t.category}</span></td><td className="px-6 py-4 text-sm text-gray-500">{new Date(t.date).toLocaleDateString()}</td><td className={`px-6 py-4 text-sm font-bold text-right ${t.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>{t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}</td></tr>))}</tbody></table></div>
                        </div>
                    </FadeIn>
                )}
            </div>

            {/* Drill Down Modal (Director) */}
            <Modal isOpen={drillDownStatus !== null} onClose={() => setDrillDownStatus(null)} title={`${drillDownStatus} Students - ${selectedTerm}`} icon="fa-solid fa-list">
                <div className="max-h-[60vh] overflow-y-auto"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50 sticky top-0"><tr><th className="px-4 py-2 text-left text-xs font-bold">Student</th><th className="px-4 py-2 text-right text-xs font-bold">Amount</th></tr></thead><tbody className="divide-y divide-gray-200">{currentTermRecords.filter(r => r.status === drillDownStatus).map(r => (<tr key={r.id}><td className="px-4 py-3 text-sm text-navy-900">{students.find(s=>s.id===r.studentId)?.firstName} {students.find(s=>s.id===r.studentId)?.lastName}</td><td className="px-4 py-3 text-right text-sm font-bold">{formatCurrency(r.amountPaid)}</td></tr>))}</tbody></table></div>
            </Modal>
        </div>
    );
};