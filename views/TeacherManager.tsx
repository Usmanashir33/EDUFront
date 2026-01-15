

import React, { useState, useMemo } from 'react';
import { Teacher, SchoolSection, Subject, ClassRoom, PaymentRecord, DisciplinaryRecord, KYCInfo, KYCDocument, ActivityLog } from '../types';
import { Input, Button, MultiSelectDropdown, PinModal, Toast, Modal, ImageUpload, ImageViewer } from '../components/UI';

interface TeacherManagerProps {
    teachers: Teacher[];
    sections: SchoolSection[];
    subjects: Subject[];
    classRooms: ClassRoom[];
    onUpdateTeachers: (teachers: Teacher[]) => void;
    onLogActivity: (action: ActivityLog['action'], module: ActivityLog['module'], description: string) => void;
}

type ViewMode = 'LIST' | 'DETAIL' | 'ADD' | 'EDIT';
type Tab = 'OVERVIEW' | 'ACADEMIC' | 'FINANCE' | 'ADMIN';
type DrillDownType = 'PRESENT' | 'LATE' | 'PAID' | 'UNPAID' | null;

// Helper to safely parse currency strings
const safeParseFloat = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const clean = val.toString().replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
};

// Helper for Input Display
const formatInputCurrency = (value: string) => {
    if (!value) return '';
    const number = value.replace(/[^0-9]/g, '');
    return number ? '₦' + parseInt(number).toLocaleString() : '';
};

const cleanCurrencyInput = (value: string) => {
    return value.replace(/[^0-9]/g, '');
};

// Mock Helper to generate attendance time based on date and teacher ID (Deterministic for demo)
const getMockAttendance = (teacherId: string, dateStr: string) => {
    const hash = (teacherId.charCodeAt(0) + new Date(dateStr).getDate()) % 10;
    // 10% chance absent, 30% chance late (after 8:00), 60% chance early
    if (hash === 0) return null; // Absent
    
    let hour = 7;
    let minute = 0;
    
    if (hash <= 3) { // Late (8:05 - 8:55)
        hour = 8;
        minute = hash * 15;
    } else { // Early (7:00 - 7:55)
        hour = 7;
        minute = hash * 8;
    }
    
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} AM`;
};

export const TeacherManager: React.FC<TeacherManagerProps> = ({ teachers, sections, subjects, classRooms, onUpdateTeachers, onLogActivity }) => {
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Dashboard Filters
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterMonth, setFilterMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [filterGender, setFilterGender] = useState<'All' | 'Male' | 'Female'>('All');
    
    // Dashboard DrillDown
    const [drillDownType, setDrillDownType] = useState<DrillDownType>(null);

    // Security & Toast
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'SUSPEND' | 'DELETE' | 'PAY_SALARY' | 'VERIFY_DOC', payload?: any } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Payroll & Receipt State
    const [showPayrollModal, setShowPayrollModal] = useState(false);
    const [payrollData, setPayrollData] = useState({
        baseSalary: '',
        bonus: '0',
        bonusRemark: '',
        deductions: '0',
        deductionRemark: '',
        tax: '0',
        month: ''
    });

    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<{ teacher: Teacher, record: PaymentRecord } | null>(null);

    // Bank Edit State
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankForm, setBankForm] = useState({ bankName: '', accountNumber: '', accountName: '' });

    // KYC Viewer
    const [viewDoc, setViewDoc] = useState<KYCDocument | null>(null);

    // Date Navigation
    const handleDateChange = (offset: number) => {
        const date = new Date(filterDate);
        date.setDate(date.getDate() + offset);
        setFilterDate(date.toISOString().split('T')[0]);
    };
    
    const formattedDateDisplay = new Date(filterDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });


    // Action Handlers
    const triggerVerifyDoc = (doc: KYCDocument) => {
        setPendingAction({ type: 'VERIFY_DOC', payload: { docName: doc.name } });
        setShowPinModal(true);
    };

    // --- DASHBOARD DATA CALCULATION ---
    const dashboardStats = useMemo(() => {
        // Attendance Logic
        const attendanceList = teachers.map(t => ({
            ...t,
            arrivalTime: getMockAttendance(t.id, filterDate)
        })).filter(t => t.arrivalTime !== null);

        const lateList = attendanceList.filter(t => {
            const [hour] = t.arrivalTime!.split(':');
            return parseInt(hour) >= 8;
        });

        // Payroll Logic
        const paidList = teachers.filter(t => 
            t.paymentHistory?.some(p => p.month === filterMonth && p.status === 'Paid')
        );
        const unpaidList = teachers.filter(t => 
            !t.paymentHistory?.some(p => p.month === filterMonth && p.status === 'Paid')
        );

        return { attendanceList, lateList, paidList, unpaidList };
    }, [teachers, filterDate, filterMonth]);

    const getDrillDownList = () => {
        switch(drillDownType) {
            case 'PRESENT': return dashboardStats.attendanceList;
            case 'LATE': return dashboardStats.lateList;
            case 'PAID': return dashboardStats.paidList;
            case 'UNPAID': return dashboardStats.unpaidList;
            default: return [];
        }
    };

    // --- RECEIPT COMPONENT ---
    const PaymentReceipt = ({ data, onClose }: { data: { teacher: Teacher, record: PaymentRecord }, onClose: () => void }) => {
        const breakdown = data.record.breakdown || {
            baseSalary: data.record.amount,
            bonus: '0', bonusRemark: '',
            deductions: '0', deductionRemark: '',
            tax: '0',
            netSalary: data.record.amount
        };

        const base = safeParseFloat(breakdown.baseSalary);
        const bonus = safeParseFloat(breakdown.bonus);
        const tax = safeParseFloat(breakdown.tax);
        const deductions = safeParseFloat(breakdown.deductions);
        const net = safeParseFloat(breakdown.netSalary);

        return (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm">
                <div className="relative bg-white w-full max-w-lg rounded-lg shadow-2xl animate-fadeIn flex flex-col max-h-[95vh]">
                    {/* Receipt Header */}
                    <div className="bg-navy-900 text-white p-6 text-center relative shrink-0 rounded-t-lg overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold-500 rounded-full opacity-20"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-navy-900 mx-auto mb-3 shadow-lg">
                                <i className="fa-solid fa-graduation-cap text-xl"></i>
                            </div>
                            <h2 className="text-xl font-bold tracking-wider uppercase">Official Payslip</h2>
                            <p className="text-navy-200 text-xs">EduPortal School Management System</p>
                        </div>
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                            <i className="fa-solid fa-xmark text-xl"></i>
                        </button>
                    </div>
                    
                    {/* Receipt Body (Scrollable) */}
                    <div className="p-6 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-4 mb-4">
                            <div>
                                <span className="text-gray-500 text-[10px] uppercase font-bold block">Employee</span>
                                <span className="text-navy-900 font-bold text-sm">{data.teacher.title} {data.teacher.lastName} {data.teacher.firstName}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-500 text-[10px] uppercase font-bold block">Ref #</span>
                                <span className="text-navy-900 font-mono text-sm">{data.record.transactionRef}</span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6 bg-white p-4 rounded border border-gray-100 shadow-sm">
                             <div className="flex justify-between">
                                <span className="text-gray-500 text-sm font-medium">Month</span>
                                <span className="text-navy-900 font-bold">{data.record.month}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Staff ID</span>
                                <span className="text-navy-900 font-medium">{data.teacher.staffId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Payment Date</span>
                                <span className="text-navy-900 font-medium">{new Date(data.record.date).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Payment Destination */}
                        <div className="mb-6 bg-navy-50 p-4 rounded border border-navy-100">
                            <h4 className="text-xs font-bold text-navy-400 uppercase mb-2 flex items-center">
                                <i className="fa-solid fa-money-bill-transfer mr-2"></i> Payment Destination
                            </h4>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-sm font-bold text-navy-900">{data.teacher.bankDetails?.bankName || 'Unknown Bank'}</p>
                                    <p className="text-xs text-navy-600">{data.teacher.bankDetails?.accountName || data.teacher.firstName}</p>
                                </div>
                                <p className="font-mono text-sm font-medium text-navy-800 tracking-wider">
                                    {data.teacher.bankDetails?.accountNumber || '****'}
                                </p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded border border-gray-100 space-y-3 mb-6">
                             <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Earnings & Deductions</h4>
                             <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Base Salary</span>
                                <span className="font-medium text-navy-900">₦{base.toLocaleString()}</span>
                            </div>
                            
                            {(bonus > 0) && (
                                <div className="flex justify-between text-sm text-green-700 bg-green-50 p-2 rounded border border-green-100">
                                    <div className="flex flex-col">
                                        <span className="font-bold flex items-center"><i className="fa-solid fa-plus mr-1"></i> Bonus</span>
                                        {breakdown.bonusRemark && <span className="text-xs text-green-600 italic">"{breakdown.bonusRemark}"</span>}
                                    </div>
                                    <span className="font-medium">₦{bonus.toLocaleString()}</span>
                                </div>
                            )}

                             {(tax > 0) && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span><i className="fa-solid fa-minus mr-1"></i> Tax</span>
                                    <span className="font-medium">- ₦{tax.toLocaleString()}</span>
                                </div>
                             )}

                             {(deductions > 0) && (
                                <div className="flex justify-between text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100">
                                    <div className="flex flex-col">
                                        <span className="font-bold flex items-center"><i className="fa-solid fa-minus mr-1"></i> Deductions</span>
                                        {breakdown.deductionRemark && <span className="text-xs text-red-600 italic">"{breakdown.deductionRemark}"</span>}
                                    </div>
                                    <span className="font-medium">- ₦{deductions.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="border-t border-gray-200 my-2 pt-2">
                                 <div className="flex justify-between items-center">
                                    <span className="text-navy-900 font-bold uppercase text-sm">Net Pay</span>
                                    <span className="text-2xl font-bold text-navy-900">₦{net.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                         <div className="text-center">
                            <span className="text-green-600 font-bold uppercase border-2 border-green-600 px-4 py-1 inline-block rounded transform -rotate-6 text-sm opacity-80">
                                PAID & VERIFIED
                            </span>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-200 shrink-0 rounded-b-lg">
                        <Button variant="outline" onClick={onClose}>Close</Button>
                        <Button onClick={() => window.print()}>
                            <i className="fa-solid fa-print mr-2"></i> Print Slip
                        </Button>
                    </div>
                </div>
            </div>
        );
    };

    // --- PAYROLL CALCULATOR MODAL ---
    const PayrollCalculator = () => {
        const base = safeParseFloat(payrollData.baseSalary);
        const bonus = safeParseFloat(payrollData.bonus);
        const tax = safeParseFloat(payrollData.tax);
        const ded = safeParseFloat(payrollData.deductions);
        const net = base + bonus - tax - ded;

        return (
            <Modal isOpen={showPayrollModal} onClose={() => setShowPayrollModal(false)} title="Payroll Calculator" icon="fa-solid fa-calculator">
                <div className="space-y-4">
                    <div className="bg-navy-50 p-3 rounded-lg text-center border border-navy-100">
                        <p className="text-sm text-navy-600">Preparing Salary for: <span className="font-bold text-navy-900">{payrollData.month}</span></p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Salary (Fixed)</label>
                            <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded font-bold text-gray-600">
                                ₦{base.toLocaleString()}
                            </div>
                        </div>
                        
                         <div className="bg-green-50 p-3 rounded border border-green-100">
                            <label className="block text-xs font-bold text-green-700 uppercase mb-1">Add Bonus</label>
                            <input 
                                type="text" 
                                value={formatInputCurrency(payrollData.bonus)} 
                                onChange={e => setPayrollData({...payrollData, bonus: cleanCurrencyInput(e.target.value)})} 
                                className="w-full p-2 border border-green-200 rounded mb-2 text-right font-medium"
                                placeholder="₦0"
                            />
                            <input 
                                type="text"
                                value={payrollData.bonusRemark}
                                onChange={e => setPayrollData({...payrollData, bonusRemark: e.target.value})}
                                className="w-full p-2 border border-green-200 rounded text-xs"
                                placeholder="Remark (e.g. Performance)"
                            />
                        </div>

                         <div className="bg-red-50 p-3 rounded border border-red-100">
                            <label className="block text-xs font-bold text-red-700 uppercase mb-1">Deductions / Fines</label>
                             <input 
                                type="text" 
                                value={formatInputCurrency(payrollData.deductions)} 
                                onChange={e => setPayrollData({...payrollData, deductions: cleanCurrencyInput(e.target.value)})} 
                                className="w-full p-2 border border-red-200 rounded mb-2 text-right font-medium"
                                placeholder="₦0"
                            />
                             <input 
                                type="text"
                                value={payrollData.deductionRemark}
                                onChange={e => setPayrollData({...payrollData, deductionRemark: e.target.value})}
                                className="w-full p-2 border border-red-200 rounded text-xs"
                                placeholder="Remark (e.g. Lateness)"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax Amount</label>
                            <input 
                                type="text" 
                                value={formatInputCurrency(payrollData.tax)} 
                                onChange={e => setPayrollData({...payrollData, tax: cleanCurrencyInput(e.target.value)})} 
                                className="w-full p-2 border border-gray-300 rounded text-right"
                                placeholder="₦0"
                            />
                        </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between items-center bg-navy-900 text-white p-4 rounded-lg shadow-md">
                            <span className="font-bold uppercase text-sm">Net Payable</span>
                            <span className="text-2xl font-bold">₦{net.toLocaleString()}</span>
                        </div>
                    </div>

                    <Button onClick={() => {
                        setShowPayrollModal(false);
                        setPendingAction({ 
                            type: 'PAY_SALARY', 
                            payload: { 
                                month: payrollData.month,
                                breakdown: {
                                    baseSalary: base.toString(),
                                    bonus: bonus.toString(), bonusRemark: payrollData.bonusRemark,
                                    deductions: ded.toString(), deductionRemark: payrollData.deductionRemark,
                                    tax: tax.toString(),
                                    netSalary: net.toString()
                                }
                            } 
                        });
                        setShowPinModal(true);
                    }}>
                        Authorize Payment
                    </Button>
                </div>
            </Modal>
        );
    };

    // --- BANK DETAILS MODAL ---
    const BankDetailsModal = () => (
        <Modal isOpen={showBankModal} onClose={() => setShowBankModal(false)} title="Update Bank Details" icon="fa-solid fa-building-columns">
             <div className="space-y-4">
                <Input label="Bank Name" value={bankForm.bankName} onChange={e => setBankForm({...bankForm, bankName: e.target.value})} iconClass="fa-solid fa-building-columns" />
                <Input label="Account Number" value={bankForm.accountNumber} onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} iconClass="fa-solid fa-hashtag" />
                <Input label="Account Name" value={bankForm.accountName} onChange={e => setBankForm({...bankForm, accountName: e.target.value})} iconClass="fa-solid fa-signature" />
                <div className="pt-2">
                    <Button onClick={() => {
                        if (selectedTeacherId) {
                            const updated = teachers.map(t => t.id === selectedTeacherId ? { ...t, bankDetails: bankForm } : t);
                            onUpdateTeachers(updated);
                            onLogActivity('UPDATE', 'TEACHERS', `Bank details updated for teacher ID: ${selectedTeacherId}`);
                            setToast({ message: "Bank details updated", type: "success" });
                            setShowBankModal(false);
                        }
                    }}>Save Changes</Button>
                </div>
            </div>
        </Modal>
    );

    // --- KYC VIEWER ---
    const KYCViewer = () => {
        if (!viewDoc) return null;
        
        return (
            <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                     <div className="p-4 bg-navy-900 text-white flex justify-between items-center shrink-0">
                         <h3 className="font-bold flex items-center gap-2">
                             <i className="fa-solid fa-file-contract"></i> {viewDoc.name}
                         </h3>
                         <button onClick={() => setViewDoc(null)} className="hover:text-gold-500">
                             <i className="fa-solid fa-xmark text-xl"></i>
                         </button>
                     </div>
                     
                     <div className="flex-1 bg-gray-100 p-8 flex items-center justify-center overflow-auto">
                         {/* Placeholder for actual image/doc since we don't have URLs in mock data often */}
                         <div className="text-center text-gray-400">
                             <i className="fa-regular fa-file-image text-6xl mb-4"></i>
                             <p>Document Preview</p>
                             <p className="text-xs mt-2 text-gray-300">({viewDoc.type})</p>
                         </div>
                     </div>
                     
                     <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
                         <div className="flex items-center gap-2">
                             <span className="text-xs font-bold uppercase text-gray-500">Status:</span>
                             <span className={`px-2 py-1 rounded text-xs font-bold ${
                                 viewDoc.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                             }`}>
                                 {viewDoc.status}
                             </span>
                         </div>
                         <div className="flex gap-2">
                             <Button variant="outline" onClick={() => setViewDoc(null)}>Close</Button>
                             {viewDoc.status !== 'Verified' && (
                                 <Button onClick={() => { setViewDoc(null); triggerVerifyDoc(viewDoc); }}>
                                     Verify Document
                                 </Button>
                             )}
                         </div>
                     </div>
                </div>
            </div>
        );
    };

    // --- TEACHER FORM COMPONENT ---
    const TeacherForm = ({ 
        initialData, 
        onSubmit, 
        onCancel 
    }: { 
        initialData?: Teacher | null, 
        onSubmit: (data: Partial<Teacher>) => void, 
        onCancel: () => void 
    }) => {
        const [formData, setFormData] = useState<Partial<Teacher>>(initialData || {
            firstName: '', lastName: '', middleName: '', title: '',
            email: '', phone: '', gender: 'Male', address: '',
            dateOfBirth: '', picture: '', nin: '',
            sectionIds: [], salary: '100000', status: 'Active',
            bankDetails: { bankName: '', accountNumber: '', accountName: '' },
            kyc: { 
                isVerified: false, 
                documents: [
                    { type: 'idCard', name: 'National ID', status: 'Pending' },
                    { type: 'passportPhoto', name: 'Passport Photo', status: 'Pending' },
                    { type: 'addressProof', name: 'Utility Bill', status: 'Pending' }
                ] 
            }
        });

        const updateBank = (field: string, value: string) => {
            setFormData({
                ...formData,
                bankDetails: { ...formData.bankDetails!, [field]: value }
            });
        };

        return (
            <div className="animate-fadeIn w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-10">
                <div className="bg-navy-900 px-8 py-6 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <i className="fa-solid fa-chalkboard-user mr-3 text-gold-500"></i>
                        {initialData ? 'Update Teacher Profile' : 'Teacher Onboarding'}
                    </h2>
                    <button onClick={onCancel} className="text-white hover:text-gold-500 transition-colors">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-8">
                    
                    <div className="flex flex-col md:flex-row gap-8">
                         {/* Photo Upload */}
                        <div className="shrink-0 flex justify-center md:justify-start">
                           <ImageUpload 
                              label="Profile Photo" 
                              currentImage={formData.picture} 
                              onImageSelected={(url) => setFormData({...formData, picture: url})} 
                           />
                        </div>
                        
                        <div className="flex-1">
                            <h3 className="font-bold text-navy-900 border-b pb-2 mb-6 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-2 text-xs"><i className="fa-solid fa-id-card"></i></span>
                                Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="md:col-span-1">
                                    <Input label="Title" placeholder="Mr/Dr" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} iconClass="fa-solid fa-heading" />
                                </div>
                                <div className="md:col-span-3 grid grid-cols-3 gap-4">
                                    <Input required label="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} iconClass="fa-solid fa-user" />
                                    <Input label="Middle Name" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} iconClass="fa-solid fa-user" />
                                    <Input required label="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} iconClass="fa-solid fa-user" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                <Input required type="email" label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} iconClass="fa-regular fa-envelope" />
                                <Input required type="tel" label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} iconClass="fa-solid fa-phone" />
                                <Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} iconClass="fa-solid fa-map-pin" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-navy-800 mb-1.5">Gender</label>
                                        <select 
                                            className="w-full p-3 border border-gray-300 rounded-md outline-none"
                                            value={formData.gender}
                                            onChange={e => setFormData({...formData, gender: e.target.value as any})}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </select>
                                    </div>
                                    <Input type="date" label="Date of Birth" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} iconClass="fa-solid fa-calendar" />
                                </div>
                                <Input label="NIN / National ID" value={formData.nin} onChange={e => setFormData({...formData, nin: e.target.value})} iconClass="fa-solid fa-fingerprint" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h3 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-2 text-xs"><i className="fa-solid fa-briefcase"></i></span>
                                Professional Assignment
                            </h3>
                            <MultiSelectDropdown 
                                label="Assigned Sections"
                                items={sections}
                                selectedIds={formData.sectionIds || []}
                                onChange={(ids) => setFormData({...formData, sectionIds: ids})}
                            />
                            <Input 
                                label="Base Salary" 
                                type="text"
                                value={formatInputCurrency(formData.salary || '')} 
                                onChange={e => setFormData({...formData, salary: cleanCurrencyInput(e.target.value)})} 
                                iconClass="fa-solid fa-money-bill" 
                                placeholder="₦0"
                            />
                        </div>
                        <div className="space-y-6">
                             <h3 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center">
                                <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-2 text-xs"><i className="fa-solid fa-building-columns"></i></span>
                                Financial
                            </h3>
                            <Input label="Bank Name" value={formData.bankDetails?.bankName} onChange={e => updateBank('bankName', e.target.value)} iconClass="fa-solid fa-building-columns" />
                            <Input label="Account Number" value={formData.bankDetails?.accountNumber} onChange={e => updateBank('accountNumber', e.target.value)} iconClass="fa-solid fa-hashtag" />
                            <Input label="Account Name" value={formData.bankDetails?.accountName} onChange={e => updateBank('accountName', e.target.value)} iconClass="fa-solid fa-signature" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <Button type="button" variant="outline" className="w-auto px-8" onClick={onCancel}>Cancel</Button>
                        <Button type="submit" className="w-auto px-8">{initialData ? 'Update Teacher' : 'Complete Onboarding'}</Button>
                    </div>
                </form>
            </div>
        );
    };

    // --- ACTION HANDLERS ---
    const handlePinSuccess = () => {
        setShowPinModal(false);
        if (!pendingAction) return;

        if (pendingAction.type === 'SUSPEND' && selectedTeacherId) {
            const updated = teachers.map(t => t.id === selectedTeacherId ? { ...t, status: t.status === 'Suspended' ? 'Active' : 'Suspended' } as Teacher : t);
            onUpdateTeachers(updated);
            onLogActivity('SUSPEND', 'TEACHERS', `Teacher status changed to ${updated.find(t=>t.id===selectedTeacherId)?.status}`);
            setToast({ message: "Teacher status updated", type: 'success' });
        } 
        else if (pendingAction.type === 'DELETE' && selectedTeacherId) {
            const teacher = teachers.find(t => t.id === selectedTeacherId);
            const updated = teachers.filter(t => t.id !== selectedTeacherId);
            onUpdateTeachers(updated);
            onLogActivity('DELETE', 'TEACHERS', `Deleted teacher: ${teacher?.firstName} ${teacher?.lastName}`);
            setViewMode('LIST');
            setSelectedTeacherId(null);
            setToast({ message: "Teacher record deleted", type: 'success' });
        }
        else if (pendingAction.type === 'PAY_SALARY' && selectedTeacherId) {
            const { month, breakdown } = pendingAction.payload;
            const teacher = teachers.find(t => t.id === selectedTeacherId);
            if (teacher) {
                const newPayment: PaymentRecord = {
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    amount: breakdown.netSalary,
                    status: 'Paid',
                    month: month,
                    transactionRef: `TXN-${Date.now().toString().slice(-8)}`,
                    breakdown: breakdown // Store the breakdown
                };
                
                const updated = teachers.map(t => t.id === selectedTeacherId ? { 
                    ...t, 
                    paymentHistory: [newPayment, ...(t.paymentHistory || [])] 
                } : t);
                onUpdateTeachers(updated);
                onLogActivity('PAYMENT', 'FINANCE', `Salary paid to ${teacher.firstName} ${teacher.lastName} for ${month}`);
                
                // Show Receipt
                const updatedTeacher = updated.find(t => t.id === selectedTeacherId)!;
                setReceiptData({ teacher: updatedTeacher, record: newPayment });
                setShowReceipt(true);
            }
        } 
        else if (pendingAction.type === 'VERIFY_DOC' && selectedTeacherId) {
             const { docName } = pendingAction.payload;
             const updated = teachers.map(t => {
                 if (t.id !== selectedTeacherId) return t;
                 // Update specific doc status
                 const newDocs = t.kyc?.documents.map(d => d.name === docName ? { ...d, status: 'Verified' as const } : d) || [];
                 // Check if all are verified
                 const allVerified = newDocs.every(d => d.status === 'Verified');
                 
                 return { ...t, kyc: { ...t.kyc, isVerified: allVerified, documents: newDocs } as KYCInfo };
             });
             onUpdateTeachers(updated);
             onLogActivity('UPDATE', 'TEACHERS', `Verified document ${docName} for teacher ${updated.find(t=>t.id===selectedTeacherId)?.firstName}`);
             setToast({ message: `Document verified. KYC Status updated.`, type: 'success' });
        }
        setPendingAction(null);
    };

    const triggerSuspend = () => { setPendingAction({ type: 'SUSPEND' }); setShowPinModal(true); };
    const triggerDelete = () => { setPendingAction({ type: 'DELETE' }); setShowPinModal(true); };
    
    // --- DETAIL VIEW ---
    const TeacherDetail = ({ id }: { id: string }) => {
        const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
        const [showImage, setShowImage] = useState(false);
        const teacher = teachers.find(t => t.id === id);
        
        // Admin Form States
        const [disciplinaryForm, setDisciplinaryForm] = useState({ title: '', description: '', severity: 'Low' as 'Low'|'Medium'|'High' });
        
        if (!teacher) return null;

        // Calculations
        const assignedSections = sections.filter(s => teacher.sectionIds.includes(s.id));
        const assignedSubjects = subjects.filter(sub => sub.teacherIds.includes(teacher.id));
        const formClasses = classRooms.filter(c => c.classTeacherId === teacher.id);
        const teachingClasses = Array.from(new Set(assignedSubjects.flatMap(s => s.classRoomIds)))
                                   .map(cid => classRooms.find(c => c.id === cid))
                                   .filter(c => c !== undefined) as ClassRoom[];

        const currentMonth = new Date().toLocaleString('default', { month: 'long' });
        const isPaidThisMonth = teacher.paymentHistory?.some(p => p.month === currentMonth && p.status === 'Paid');

        const triggerPaySalary = () => {
            setPayrollData({
                baseSalary: teacher.salary || '0',
                bonus: '0', bonusRemark: '',
                deductions: '0', deductionRemark: '',
                tax: '0',
                month: currentMonth
            });
            setShowPayrollModal(true);
        };

        const handleAddDisciplinary = () => {
             if (!disciplinaryForm.title || !disciplinaryForm.description) return;
             const newRecord: DisciplinaryRecord = {
                 id: Date.now().toString(),
                 date: new Date().toISOString(),
                 title: disciplinaryForm.title,
                 description: disciplinaryForm.description,
                 severity: disciplinaryForm.severity
             };
             const updated = teachers.map(t => t.id === teacher.id ? { ...t, disciplinaryRecords: [newRecord, ...(t.disciplinaryRecords || [])] } : t);
             onUpdateTeachers(updated);
             onLogActivity('UPDATE', 'TEACHERS', `Added disciplinary record to ${teacher.firstName} ${teacher.lastName}`);
             setDisciplinaryForm({ title: '', description: '', severity: 'Low' });
             setToast({ message: "Disciplinary record added", type: 'success' });
        };

        // Open Bank Modal
        const openBankModal = () => {
            setBankForm({
                bankName: teacher.bankDetails?.bankName || '',
                accountNumber: teacher.bankDetails?.accountNumber || '',
                accountName: teacher.bankDetails?.accountName || ''
            });
            setShowBankModal(true);
        };

        return (
            <div className="animate-fadeIn space-y-6">
                <button onClick={() => setViewMode('LIST')} className="flex items-center text-gray-500 hover:text-navy-900 transition-colors">
                    <i className="fa-solid fa-arrow-left mr-2"></i> Back to Directory
                </button>

                {/* Profile Header */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                     <div className="h-32 bg-gradient-to-r from-navy-800 to-navy-600 relative">
                        <div className="absolute inset-0 bg-pattern opacity-10"></div>
                     </div>
                     <div className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end">
                                <div 
                                    className={`w-28 h-28 rounded-xl bg-white p-1.5 shadow-lg relative shrink-0 ${teacher.picture ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                    onClick={() => teacher.picture && setShowImage(true)}
                                    title={teacher.picture ? "Click to view full image" : ""}
                                >
                                    <div className="w-full h-full bg-navy-50 rounded-lg flex items-center justify-center text-4xl text-navy-300 font-bold border border-gray-100 overflow-hidden">
                                        {teacher.picture ? <img src={teacher.picture} alt="" className="w-full h-full object-cover"/> : `${teacher.firstName[0]}${teacher.lastName[0]}`}
                                    </div>
                                    <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${teacher.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}>
                                        <i className={`fa-solid ${teacher.status === 'Active' ? 'fa-check' : 'fa-ban'}`}></i>
                                    </span>
                                </div>
                                <div className="ml-5 mb-1">
                                    <h1 className="text-3xl font-bold text-navy-900 leading-tight">{teacher.title} {teacher.firstName} {teacher.lastName}</h1>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-gray-500 font-medium text-sm">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 mr-2">{teacher.staffId}</span>
                                        </p>
                                        {teacher.kyc?.isVerified ? (
                                            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center"><i className="fa-solid fa-shield-halved mr-1"></i> KYC Verified</span>
                                        ) : (
                                            <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded flex items-center"><i className="fa-solid fa-circle-exclamation mr-1"></i> KYC Pending</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-4 md:mt-0">
                                <Button variant="outline" className="w-auto px-4" onClick={() => setViewMode('EDIT')}>
                                    <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Profile
                                </Button>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex space-x-8 border-b border-gray-200 mt-8">
                            {[
                                { id: 'OVERVIEW', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
                                { id: 'ACADEMIC', label: 'Academic', icon: 'fa-solid fa-book' },
                                { id: 'FINANCE', label: 'Finance', icon: 'fa-solid fa-file-invoice-dollar' },
                                { id: 'ADMIN', label: 'Admin', icon: 'fa-solid fa-shield-halved' }
                            ].map(t => (
                                <button key={t.id} onClick={() => setActiveTab(t.id as Tab)} className={`pb-4 text-sm font-bold flex items-center transition-all ${activeTab === t.id ? 'text-navy-900 border-b-2 border-navy-900' : 'text-gray-400 hover:text-navy-600'}`}>
                                    <i className={`${t.icon} mr-2`}></i>
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="pt-8 min-h-[300px]">
                            {/* OVERVIEW TAB */}
                            {activeTab === 'OVERVIEW' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    {/* Column 1 & 2 */}
                                    <div className="md:col-span-2 space-y-6">

                                        {/* Personal Details */}
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                            <h3 className="font-bold text-navy-900 border-b border-gray-100 pb-3 mb-4 flex items-center">
                                                <i className="fa-solid fa-user mr-2 text-navy-600"></i>
                                                Personal Information
                                            </h3>
                                            <div className="grid grid-cols-2 gap-y-4 text-sm">
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-bold">Full Name</p>
                                                    <p className="font-semibold text-navy-900">{teacher.title} {teacher.firstName} {teacher.middleName} {teacher.lastName}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-bold">Gender</p>
                                                    <p className="font-semibold text-navy-900">{teacher.gender}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-bold">Date of Birth</p>
                                                    <p className="font-semibold text-navy-900">{teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-500 text-xs uppercase font-bold">Date Joined</p>
                                                    <p className="font-semibold text-navy-900">{new Date(teacher.joinedAt).toLocaleDateString()}</p>
                                                </div>
                                                 <div>
                                                    <p className="text-gray-500 text-xs uppercase font-bold">NIN</p>
                                                    <p className="font-semibold text-navy-900">{teacher.nin || 'Not Provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Conduct & Discipline (Bad Records) */}
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                            <div className="bg-navy-50 p-4 border-b border-gray-200 flex justify-between items-center">
                                                <h3 className="font-bold text-navy-900 flex items-center">
                                                    <i className="fa-solid fa-gavel mr-2 text-navy-600"></i>
                                                    Conduct & Performance Record
                                                </h3>
                                            </div>
                                            <div className="p-4">
                                                {(!teacher.disciplinaryRecords || teacher.disciplinaryRecords.length === 0) ? (
                                                     <div className="flex flex-col items-center justify-center py-6 text-green-600 bg-green-50 rounded border border-green-100 border-dashed">
                                                         <i className="fa-solid fa-certificate text-3xl mb-2"></i>
                                                         <span className="font-bold">Clean Record</span>
                                                         <span className="text-xs text-green-700">No disciplinary actions or negative reports.</span>
                                                     </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        {teacher.disciplinaryRecords.map(rec => (
                                                            <div key={rec.id} className={`flex gap-4 p-3 border-l-4 ${rec.severity === 'High' ? 'border-red-600 bg-red-50' : 'border-orange-500 bg-orange-50'} rounded`}>
                                                                <div className="flex-1">
                                                                    <div className="flex justify-between">
                                                                        <h4 className="font-bold text-navy-900 text-sm">{rec.title} <span className="text-xs uppercase px-1 rounded bg-white border ml-2">{rec.severity}</span></h4>
                                                                        <span className="text-xs font-bold text-gray-500">{new Date(rec.date).toLocaleDateString()}</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-700 mt-1">{rec.description}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Class Schedule Overview */}
                                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                                            <div className="p-4 border-b border-gray-200">
                                                <h3 className="font-bold text-navy-900 flex items-center">
                                                    <i className="fa-solid fa-chalkboard mr-2 text-navy-600"></i>
                                                    Teaching Schedule
                                                </h3>
                                            </div>
                                            <div className="p-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {teachingClasses.map(cls => (
                                                        <div key={cls.id} className="flex items-center p-3 bg-gray-50 rounded border border-gray-200">
                                                            <div className="w-8 h-8 rounded bg-navy-100 text-navy-700 flex items-center justify-center font-bold text-xs mr-3">
                                                                {cls.name.substring(0,2)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-navy-900">{cls.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {assignedSubjects.filter(s => s.classRoomIds.includes(cls.id)).map(s => s.name).join(', ')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {teachingClasses.length === 0 && <p className="text-gray-500 text-sm italic">No classes assigned yet.</p>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Sidebar */}
                                    <div className="space-y-4">
                                         <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase">Status</h4>
                                            <div className={`text-xl font-bold my-2 ${teacher.status === 'Active' ? 'text-green-600' : 'text-red-600'}`}>
                                                {teacher.status}
                                            </div>
                                            <p className="text-xs text-gray-400">Account Standing</p>
                                        </div>
                                         <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Contact Info</h4>
                                            <div className="space-y-3">
                                                <div className="flex items-center text-sm text-navy-900">
                                                    <i className="fa-solid fa-phone w-6 text-gray-400"></i>
                                                    {teacher.phone}
                                                </div>
                                                <div className="flex items-center text-sm text-navy-900">
                                                    <i className="fa-solid fa-envelope w-6 text-gray-400"></i>
                                                    <span className="truncate">{teacher.email}</span>
                                                </div>
                                                <div className="flex items-center text-sm text-navy-900">
                                                    <i className="fa-solid fa-location-dot w-6 text-gray-400"></i>
                                                    <span className="truncate">{teacher.address || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ACADEMIC' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                     <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded bg-navy-100 flex items-center justify-center text-navy-600"><i className="fa-solid fa-layer-group"></i></div>
                                            <span className="text-2xl font-bold text-navy-900">{assignedSections.length}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-700 mb-2">Assigned Sections</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {assignedSections.map(s => <span key={s.id} className="bg-navy-900 text-white px-2 py-1 rounded text-xs">{s.name}</span>)}
                                            {assignedSections.length === 0 && <span className="text-gray-400 italic text-sm">None</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="w-10 h-10 rounded bg-gold-100 flex items-center justify-center text-gold-600"><i className="fa-solid fa-chalkboard"></i></div>
                                            <span className="text-2xl font-bold text-navy-900">{formClasses.length}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-700 mb-2">Form Classes</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {formClasses.map(c => <span key={c.id} className="bg-gold-100 text-gold-800 px-2 py-1 rounded text-xs border border-gold-200">{c.name}</span>)}
                                            {formClasses.length === 0 && <span className="text-gray-400 italic text-sm">Not a class teacher</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center justify-between mb-4">
                                             <div className="w-10 h-10 rounded bg-blue-100 flex items-center justify-center text-blue-600"><i className="fa-solid fa-book"></i></div>
                                             <span className="text-2xl font-bold text-navy-900">{assignedSubjects.length}</span>
                                        </div>
                                        <h4 className="font-bold text-gray-700 mb-2">Subjects Taught</h4>
                                        <ul className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                                            {assignedSubjects.map(sub => (
                                                <li key={sub.id} className="text-sm flex justify-between border-b border-gray-50 pb-1 last:border-0">
                                                    <span>{sub.name}</span> <span className="text-xs text-gray-400 font-mono">{sub.code}</span>
                                                </li>
                                            ))}
                                            {assignedSubjects.length === 0 && <span className="text-gray-400 italic text-sm">No subjects assigned</span>}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'FINANCE' && (
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    <div className="lg:col-span-2 space-y-8">
                                        {/* Action Card */}
                                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-lg font-bold text-navy-900">Payroll Action</h3>
                                                    <p className="text-sm text-gray-500">Processing for: <span className="font-bold text-navy-900">{currentMonth}</span></p>
                                                </div>
                                                <span className={`px-3 py-1 rounded text-xs font-bold border ${isPaidThisMonth ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                    {isPaidThisMonth ? 'PAID' : 'PENDING'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base Salary (₦)</label>
                                                    <div className="flex">
                                                        <div className="p-3 border rounded-md font-mono font-bold text-lg bg-gray-50 text-gray-600 border-gray-200 flex-1">
                                                            ₦{safeParseFloat(teacher.salary).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button 
                                                    onClick={triggerPaySalary} 
                                                    disabled={isPaidThisMonth}
                                                    variant={isPaidThisMonth ? 'secondary' : 'primary'}
                                                    type="button"
                                                >
                                                    {isPaidThisMonth ? <><i className="fa-solid fa-check mr-2"></i> Salary Paid</> : <><i className="fa-solid fa-calculator mr-2"></i> Calculate & Pay</>}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Payment History */}
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Payment History</h4>
                                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                                <table className="min-w-full divide-y divide-gray-200">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Month</th>
                                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Net Pay</th>
                                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="bg-white divide-y divide-gray-200">
                                                        {teacher.paymentHistory?.map(p => (
                                                            <tr key={p.id}>
                                                                <td className="px-6 py-4 text-sm text-navy-900 font-medium">{p.month}</td>
                                                                <td className="px-6 py-4 text-sm text-navy-900 font-bold">{new Date(p.date).toLocaleDateString()}</td>
                                                                <td className="px-6 py-4 text-sm text-navy-900 font-bold">₦{safeParseFloat(p.amount).toLocaleString()}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <button 
                                                                        onClick={() => { setReceiptData({ teacher: teacher, record: p }); setShowReceipt(true); }}
                                                                        className="text-xs text-navy-600 hover:text-navy-900 font-medium hover:underline bg-navy-50 px-3 py-1 rounded-full border border-navy-100"
                                                                    >
                                                                        <i className="fa-solid fa-receipt mr-1"></i> Slip
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                        {(!teacher.paymentHistory || teacher.paymentHistory.length === 0) && (
                                                            <tr><td colSpan={4} className="p-4 text-center text-gray-500 text-sm">No payment history found.</td></tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Bank Info */}
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-navy-900 to-navy-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
                                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                                            
                                            {/* Edit Button */}
                                            <button 
                                                onClick={openBankModal}
                                                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
                                                title="Edit Bank Details"
                                            >
                                                <i className="fa-solid fa-pen-to-square"></i>
                                            </button>

                                            <h4 className="text-sm font-bold text-gold-500 uppercase mb-4 tracking-wider flex items-center">
                                                <i className="fa-solid fa-building-columns mr-2"></i> Bank Details
                                            </h4>
                                            <div className="space-y-4">
                                                <div>
                                                    <p className="text-navy-300 text-xs uppercase">Bank Name</p>
                                                    <p className="font-bold text-lg">{teacher.bankDetails?.bankName || 'Not Provided'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-navy-300 text-xs uppercase">Account Number</p>
                                                    <p className="font-mono text-xl tracking-widest">{teacher.bankDetails?.accountNumber || '**** ****'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-navy-300 text-xs uppercase">Account Name</p>
                                                    <p className="font-medium text-sm">{teacher.bankDetails?.accountName || 'Not Provided'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'ADMIN' && (
                                <div className="space-y-8">
                                    {/* KYC Management */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                         <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                            <h3 className="font-bold text-navy-900 flex items-center">
                                                <i className="fa-solid fa-file-contract mr-2 text-navy-600"></i> KYC & Verification
                                            </h3>
                                            {teacher.kyc?.isVerified && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Verified</span>}
                                         </div>
                                         
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                             <div className="space-y-3">
                                                 <p className="text-sm text-gray-600 mb-2">Submitted Documents</p>
                                                 {teacher.kyc?.documents.map((doc, idx) => (
                                                     <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                                         <div className="flex items-center gap-3">
                                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${doc.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                                 <i className={`fa-solid ${doc.status === 'Verified' ? 'fa-check' : 'fa-hourglass'}`}></i>
                                                             </div>
                                                             <div>
                                                                 <p className="text-sm font-medium text-navy-900">{doc.name}</p>
                                                                 <p className="text-[10px] text-gray-500 uppercase">{doc.status}</p>
                                                             </div>
                                                         </div>
                                                         <button 
                                                            onClick={() => setViewDoc(doc)}
                                                            className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-navy-50 text-navy-700"
                                                         >
                                                             View
                                                         </button>
                                                     </div>
                                                 ))}
                                             </div>
                                             
                                             <div className="border-l border-gray-100 pl-6 flex flex-col justify-center">
                                                 <div className="text-center p-6 bg-navy-50 rounded-lg border border-dashed border-navy-200">
                                                     <i className="fa-solid fa-upload text-3xl text-navy-300 mb-2"></i>
                                                     <p className="text-sm font-bold text-navy-700">Request Update</p>
                                                     <p className="text-xs text-gray-500 mb-4">Send a notification to teacher to upload pending documents.</p>
                                                     <Button variant="outline" className="text-xs w-auto px-4">Send Request</Button>
                                                 </div>
                                             </div>
                                         </div>
                                    </div>

                                    {/* Disciplinary Actions Form */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                         <h3 className="font-bold text-navy-900 mb-4 border-b border-gray-100 pb-4 flex items-center">
                                            <i className="fa-solid fa-triangle-exclamation mr-2 text-orange-500"></i> Record Disciplinary Action
                                         </h3>
                                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                             <Input 
                                                label="Infraction Title" 
                                                value={disciplinaryForm.title} 
                                                onChange={e => setDisciplinaryForm({...disciplinaryForm, title: e.target.value})} 
                                                iconClass="fa-solid fa-heading"
                                             />
                                             <div>
                                                <label className="block text-sm font-semibold text-navy-800 mb-1.5">Severity Level</label>
                                                <select 
                                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 outline-none"
                                                    value={disciplinaryForm.severity}
                                                    onChange={e => setDisciplinaryForm({...disciplinaryForm, severity: e.target.value as any})}
                                                >
                                                    <option value="Low">Low - Warning/Minor</option>
                                                    <option value="Medium">Medium - Reportable Incident</option>
                                                    <option value="High">High - Suspension Risk</option>
                                                </select>
                                             </div>
                                         </div>
                                         <div className="mb-4">
                                              <label className="block text-sm font-semibold text-navy-800 mb-1.5">Description & Comments</label>
                                              <textarea 
                                                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 outline-none"
                                                rows={3}
                                                placeholder="Provide detailed context about the incident..."
                                                value={disciplinaryForm.description}
                                                onChange={e => setDisciplinaryForm({...disciplinaryForm, description: e.target.value})}
                                              ></textarea>
                                         </div>
                                         <div className="flex justify-end">
                                             <Button onClick={handleAddDisciplinary} className="w-auto px-6" variant="secondary">
                                                 <i className="fa-solid fa-save mr-2"></i> Log Record
                                             </Button>
                                         </div>

                                          {/* History List */}
                                         {teacher.disciplinaryRecords && teacher.disciplinaryRecords.length > 0 && (
                                             <div className="mt-8 pt-6 border-t border-gray-100">
                                                 <h4 className="font-bold text-gray-700 text-sm uppercase mb-4">History Log</h4>
                                                 <div className="space-y-3">
                                                     {teacher.disciplinaryRecords.map(rec => (
                                                         <div key={rec.id} className="bg-gray-50 border border-gray-200 p-4 rounded-lg flex justify-between items-start">
                                                             <div>
                                                                 <div className="flex items-center gap-2 mb-1">
                                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                                                                        rec.severity === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 
                                                                        rec.severity === 'Medium' ? 'bg-orange-100 text-orange-700 border-orange-200' : 
                                                                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                                                                    }`}>
                                                                        {rec.severity}
                                                                    </span>
                                                                    <span className="font-bold text-navy-900 text-sm">{rec.title}</span>
                                                                 </div>
                                                                 <p className="text-xs text-gray-600">{rec.description}</p>
                                                             </div>
                                                             <span className="text-xs font-mono text-gray-400">{new Date(rec.date).toLocaleDateString()}</span>
                                                         </div>
                                                     ))}
                                                 </div>
                                             </div>
                                         )}
                                    </div>

                                    {/* Danger Zone */}
                                    <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                                        <h3 className="text-lg font-bold text-red-800 mb-4">Account Control</h3>
                                        <div className="flex gap-4">
                                            <Button variant="secondary" className="w-auto px-4" onClick={triggerSuspend}>
                                                {teacher.status === 'Suspended' ? 'Activate Account' : 'Suspend Account'}
                                            </Button>
                                            <Button variant="danger" className="w-auto px-4" onClick={triggerDelete}>Delete Teacher</Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                     </div>
                </div>
                
                {/* Bank Edit Modal */}
                <BankDetailsModal />

                <PinModal 
                    isOpen={showPinModal} 
                    onClose={() => { setShowPinModal(false); setPendingAction(null); }} 
                    onSuccess={handlePinSuccess} 
                    title={pendingAction?.type === 'PAY_SALARY' ? 'Authorize Payment' : 'Authorize Action'} 
                />
                
                {showReceipt && receiptData && (
                    <PaymentReceipt data={receiptData} onClose={() => setShowReceipt(false)} />
                )}
                
                <KYCViewer />

                <ImageViewer 
                    isOpen={showImage} 
                    imageUrl={teacher.picture} 
                    onClose={() => setShowImage(false)} 
                />

                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </div>
        );
    };

    // --- MAIN LIST RENDER ---
    const filteredTeachers = teachers.filter(t => 
        (t.firstName + ' ' + t.lastName).toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterGender === 'All' || t.gender === filterGender)
    );

    if (viewMode === 'ADD') {
        return (
            <>
                <TeacherForm 
                    onSubmit={(data) => {
                         const newTeacher: Teacher = {
                            id: Date.now().toString(),
                            firstName: data.firstName || '',
                            lastName: data.lastName || '',
                            middleName: data.middleName || '',
                            title: data.title || '',
                            email: data.email || '',
                            phone: data.phone || '',
                            gender: data.gender || 'Male',
                            address: data.address || '',
                            dateOfBirth: data.dateOfBirth,
                            sectionIds: data.sectionIds || [],
                            staffId: `STAFF-${Date.now().toString().slice(-4)}`,
                            joinedAt: new Date().toISOString(),
                            status: data.status || 'Active',
                            salary: data.salary || '100000',
                            paymentHistory: [],
                            bankDetails: data.bankDetails,
                            picture: data.picture,
                            nin: data.nin,
                            kyc: { 
                                isVerified: false, 
                                documents: [
                                    { type: 'idCard', name: 'National ID', status: 'Pending' },
                                    { type: 'passportPhoto', name: 'Passport Photo', status: 'Pending' },
                                    { type: 'addressProof', name: 'Utility Bill', status: 'Pending' }
                                ] 
                            }
                        };
                        onUpdateTeachers([...teachers, newTeacher]);
                        onLogActivity('CREATE', 'TEACHERS', `Onboarded new teacher: ${newTeacher.firstName} ${newTeacher.lastName}`);
                        setViewMode('LIST');
                        setToast({ message: "Teacher onboarded successfully", type: 'success' });
                    }} 
                    onCancel={() => setViewMode('LIST')} 
                />
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </>
        );
    }

    if (viewMode === 'EDIT' && selectedTeacherId) {
        const teacherToEdit = teachers.find(t => t.id === selectedTeacherId);
        return (
             <>
                <TeacherForm 
                    initialData={teacherToEdit}
                    onSubmit={(data) => {
                         const updated = teachers.map(t => t.id === selectedTeacherId ? { ...t, ...data } : t);
                         onUpdateTeachers(updated);
                         onLogActivity('UPDATE', 'TEACHERS', `Updated profile of teacher ID: ${selectedTeacherId}`);
                         setViewMode('DETAIL');
                         setToast({ message: "Profile updated successfully", type: 'success' });
                    }} 
                    onCancel={() => setViewMode('DETAIL')} 
                />
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </>
        );
    }

    // Default to Detail or List
    if (viewMode === 'DETAIL' && selectedTeacherId) {
        return (
            <>
                <TeacherDetail id={selectedTeacherId} />
                <PayrollCalculator />
                <BankDetailsModal />
                <PinModal 
                    isOpen={showPinModal} 
                    onClose={() => { setShowPinModal(false); setPendingAction(null); }} 
                    onSuccess={handlePinSuccess} 
                    title={pendingAction?.type === 'PAY_SALARY' ? 'Authorize Payment' : 'Authorize Action'} 
                />
                {showReceipt && receiptData && (
                    <PaymentReceipt data={receiptData} onClose={() => setShowReceipt(false)} />
                )}
                <KYCViewer />
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            </>
        );
    }

    return (
        <div className="animate-fadeIn space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* --- DASHBOARD HEADER --- */}
            <div className="space-y-4">
                {/* 1. Header & Filters */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">Teacher Dashboard</h2>
                        <p className="text-sm text-gray-500">Overview, Attendance & Payroll Management</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <div className="flex items-center border border-gray-300 rounded-md bg-gray-50">
                            <button onClick={() => handleDateChange(-1)} className="px-3 py-2 text-gray-500 hover:text-navy-900 border-r border-gray-300">
                                <i className="fa-solid fa-chevron-left"></i>
                            </button>
                            <div className="px-3 py-2 text-sm font-semibold text-navy-900 min-w-[180px] text-center">
                                {formattedDateDisplay}
                            </div>
                             <button onClick={() => handleDateChange(1)} className="px-3 py-2 text-gray-500 hover:text-navy-900 border-l border-gray-300">
                                <i className="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                        <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                            <span className="text-xs font-bold text-gray-500 mr-2 uppercase">Month:</span>
                            <select 
                                value={filterMonth}
                                onChange={(e) => setFilterMonth(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-navy-900 outline-none"
                            >
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                            </select>
                        </div>
                         <div className="flex items-center border border-gray-300 rounded-md px-3 py-2 bg-gray-50">
                            <span className="text-xs font-bold text-gray-500 mr-2 uppercase">Gender:</span>
                            <select 
                                value={filterGender}
                                onChange={(e) => setFilterGender(e.target.value as any)}
                                className="bg-transparent text-sm font-semibold text-navy-900 outline-none"
                            >
                                <option value="All">All</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {/* Total Teachers */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-400 uppercase">Total Teachers</p>
                            <h3 className="text-2xl font-bold text-navy-900 mt-1">{teachers.length}</h3>
                        </div>
                        <div className="flex justify-end mt-2">
                            <i className="fa-solid fa-users text-2xl text-navy-100"></i>
                        </div>
                    </div>

                    {/* Present */}
                    <div 
                        onClick={() => setDrillDownType('PRESENT')}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-green-500"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Present Today</p>
                                <h3 className="text-2xl font-bold text-green-600 mt-1">{dashboardStats.attendanceList.length}</h3>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-check"></i>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Click to view list</p>
                    </div>

                    {/* Late */}
                    <div 
                        onClick={() => setDrillDownType('LATE')}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-orange-500"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Late Comers</p>
                                <h3 className="text-2xl font-bold text-orange-600 mt-1">{dashboardStats.lateList.length}</h3>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-clock"></i>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Arrived after 8:00 AM</p>
                    </div>

                    {/* Paid Salaries */}
                    <div 
                        onClick={() => setDrillDownType('PAID')}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-blue-500"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Paid ({filterMonth.slice(0,3)})</p>
                                <h3 className="text-2xl font-bold text-blue-600 mt-1">{dashboardStats.paidList.length}</h3>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-file-invoice-dollar"></i>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Salary Disbursed</p>
                    </div>

                    {/* Unpaid Salaries */}
                    <div 
                        onClick={() => setDrillDownType('UNPAID')}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm cursor-pointer hover:shadow-md transition-all group border-l-4 border-l-red-500"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase">Unpaid ({filterMonth.slice(0,3)})</p>
                                <h3 className="text-2xl font-bold text-red-600 mt-1">{dashboardStats.unpaidList.length}</h3>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 group-hover:scale-110 transition-transform">
                                <i className="fa-solid fa-triangle-exclamation"></i>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Action Required</p>
                    </div>
                </div>
            </div>

            {/* --- CONTROLS & LIST --- */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4 mt-6">
                <div>
                    <h2 className="text-lg font-bold text-navy-900">All Teachers Directory</h2>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                         <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                         <input 
                            type="text" 
                            placeholder="Search teachers..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-navy-500"
                         />
                    </div>
                    <Button className="w-auto px-4" onClick={() => setViewMode('ADD')}>
                        <i className="fa-solid fa-plus mr-2"></i> Onboard
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map(teacher => (
                    <div 
                        key={teacher.id} 
                        onClick={() => { setSelectedTeacherId(teacher.id); setViewMode('DETAIL'); }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer group hover:-translate-y-1"
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center font-bold text-lg border border-white shadow-sm overflow-hidden">
                                        {teacher.picture ? <img src={teacher.picture} alt="" className="w-full h-full object-cover"/> : `${teacher.firstName.charAt(0)}${teacher.lastName.charAt(0)}`}
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="font-bold text-navy-900 group-hover:text-gold-600 transition-colors">{teacher.title} {teacher.firstName} {teacher.lastName}</h3>
                                        <p className="text-xs text-gray-500">{teacher.email}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded font-bold ${teacher.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {teacher.status || 'Active'}
                                </span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600 mb-4">
                                <div className="flex items-center">
                                    <i className="fa-solid fa-phone w-5 text-center mr-2 text-gray-400"></i>
                                    {teacher.phone}
                                </div>
                                <div className="flex items-center">
                                    <i className="fa-solid fa-layer-group w-5 text-center mr-2 text-gray-400"></i>
                                    {teacher.sectionIds.length} Sections
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs font-medium">
                            <span className="text-gray-500">ID: {teacher.staffId}</span>
                            <span className="text-navy-600">View Profile <i className="fa-solid fa-arrow-right ml-1"></i></span>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- DRILL DOWN MODAL --- */}
            <Modal
                isOpen={drillDownType !== null}
                onClose={() => setDrillDownType(null)}
                title={
                    drillDownType === 'PRESENT' ? `Teachers Present on ${new Date(filterDate).toLocaleDateString()}` :
                    drillDownType === 'LATE' ? `Late Comers on ${new Date(filterDate).toLocaleDateString()}` :
                    drillDownType === 'PAID' ? `Paid Salaries for ${filterMonth}` :
                    `Unpaid Salaries for ${filterMonth}`
                }
                icon={drillDownType === 'PAID' ? 'fa-solid fa-check-circle' : drillDownType === 'UNPAID' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-list-check'}
            >
                <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
                    <table className="min-w-full divide-y divide-gray-200 mb-4">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Teacher</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">
                                    {(drillDownType === 'PRESENT' || drillDownType === 'LATE') ? 'Time In' : 'Status'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {getDrillDownList().map((t: Teacher & { arrivalTime?: string | null }) => (
                                <tr 
                                    key={t.id} 
                                    onClick={() => { setDrillDownType(null); setSelectedTeacherId(t.id); setViewMode('DETAIL'); }}
                                    className="cursor-pointer hover:bg-navy-50"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center">
                                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                                {t.firstName[0]}{t.lastName[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-navy-900">{t.title} {t.firstName} {t.lastName}</p>
                                                <p className="text-xs text-gray-500">{t.staffId}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {(drillDownType === 'PRESENT' || drillDownType === 'LATE') ? (
                                            <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${drillDownType === 'LATE' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                {t.arrivalTime}
                                            </span>
                                        ) : (
                                            <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${drillDownType === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {drillDownType === 'PAID' ? 'Paid' : 'Pending'}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {getDrillDownList().length === 0 && (
                                <tr><td colSpan={2} className="p-6 text-center text-gray-500 text-sm">No records found for this selection.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Modal>
        </div>
    );
};
