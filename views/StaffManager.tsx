

import React, { useState, useMemo } from 'react';
import { Staff, PaymentRecord, KYCDocument, KYCInfo, ActivityLog } from '../types';
import { Input, Button, Toast, Modal, PinModal, FadeIn, ImageUpload, ImageViewer } from '../components/UI';

interface StaffManagerProps {
  staff: Staff[];
  onUpdateStaff: (staff: Staff[]) => void;
  onLogActivity: (action: ActivityLog['action'], module: ActivityLog['module'], description: string) => void;
}

type ViewMode = 'LIST' | 'ADD' | 'EDIT' | 'DETAIL';
type Tab = 'OVERVIEW' | 'FINANCE' | 'ADMIN';
type StaffStatusTab = 'ALL' | 'ACTIVE' | 'INACTIVE';
type DrillDownType = 'LATE' | 'PAID' | 'UNPAID' | null;

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

// Mock Helper to generate attendance time based on date
const getMockAttendance = (staffId: string, dateStr: string) => {
    const hash = (staffId.charCodeAt(0) + new Date(dateStr).getDate()) % 10;
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

// --- STAFF FORM COMPONENT ---
const StaffForm = ({ initialData, onSubmit, onCancel }: { initialData?: Staff | null, onSubmit: (data: Partial<Staff>) => void, onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<Staff>>(initialData || {
      firstName: '', lastName: '', email: '', phone: '',
      role: '', department: '', gender: 'Male',
      status: 'Active', salary: '50000', address: '',
      picture: '', nin: '',
      kyc: { isVerified: false, documents: [{ type: 'nationalID', name: 'National ID / NIN', status: 'Pending' }, { type: 'passport', name: 'Passport Photograph', status: 'Pending' }, { type: 'guarantor', name: 'Guarantor Form', status: 'Pending' }] }
    });
    const commonRoles = ["Administrator", "Bursar", "Secretary", "Receptionist", "Security Guard", "Driver", "Cleaner", "Gardener", "Nurse", "Librarian", "IT Support", "Cook/Chef"];
    
    return (
      <div className="animate-fadeIn max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden mb-8">
        <div className="bg-navy-900 px-6 py-4 flex justify-between items-center text-white"><h2 className="text-lg font-bold flex items-center"><i className="fa-solid fa-user-plus mr-2 text-gold-500"></i> {initialData ? 'Edit Staff Profile' : 'Add New Staff'}</h2><button onClick={onCancel} className="hover:text-gold-500"><i className="fa-solid fa-xmark"></i></button></div>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="shrink-0 flex justify-center md:justify-start"><ImageUpload label="Profile Photo" currentImage={formData.picture} onImageSelected={(url) => setFormData({...formData, picture: url})} /></div>
            <div className="flex-1 space-y-4"><h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-1">Personal Info</h3><div className="grid grid-cols-2 gap-4"><Input label="First Name" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} iconClass="fa-solid fa-user" /><Input label="Last Name" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} iconClass="fa-solid fa-user" /></div><Input label="Email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} iconClass="fa-solid fa-envelope" /><Input label="Phone" type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} iconClass="fa-solid fa-phone" /><div><label className="block text-sm font-semibold text-navy-800 mb-1.5">Gender</label><select className="w-full p-3 border rounded-md" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value as any})}><option>Male</option><option>Female</option></select></div><Input label="NIN" value={formData.nin} onChange={e => setFormData({...formData, nin: e.target.value})} iconClass="fa-solid fa-fingerprint" /><Input label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} iconClass="fa-solid fa-map-pin" /></div>
          </div>
          <div className="space-y-4"><h3 className="text-sm font-bold text-gray-500 uppercase border-b pb-1">Employment Info</h3><div><Input label="Job Role / Title" required list="roles-list" placeholder="Select or type..." value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} iconClass="fa-solid fa-briefcase" /><datalist id="roles-list">{commonRoles.map(r => <option key={r} value={r} />)}</datalist></div><Input label="Department" required placeholder="e.g. Operations" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} iconClass="fa-solid fa-building" /><Input label="Base Salary" type="text" value={formatInputCurrency(formData.salary || '')} onChange={e => setFormData({...formData, salary: cleanCurrencyInput(e.target.value)})} iconClass="fa-solid fa-money-bill" placeholder="₦0"/><div><label className="block text-sm font-semibold text-navy-800 mb-1.5">Employment Status</label><div className="flex gap-4">{['Active', 'Inactive', 'Suspended'].map(s => (<label key={s} className="flex items-center cursor-pointer"><input type="radio" checked={formData.status === s} onChange={() => setFormData({...formData, status: s as any})} className="mr-2" /><span className="text-sm">{s}</span></label>))}</div></div></div>
          <div className="flex justify-end gap-3 pt-4 border-t"><Button type="button" variant="outline" className="w-auto px-6" onClick={onCancel}>Cancel</Button><Button type="submit" className="w-auto px-6">{initialData ? 'Update Staff' : 'Save Staff'}</Button></div>
        </form>
      </div>
    );
};

// --- STAFF DETAIL COMPONENT ---
const StaffDetail = ({ 
    staffMember, 
    onBack, 
    onEdit, 
    onPaySalary, 
    onViewReceipt,
    onSuspend,
    onDelete,
    onVerifyDoc
}: { 
    staffMember: Staff, 
    onBack: () => void, 
    onEdit: () => void,
    onPaySalary: () => void,
    onViewReceipt: (record: PaymentRecord) => void,
    onSuspend: () => void,
    onDelete: () => void,
    onVerifyDoc: (doc: KYCDocument) => void
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
    const [showImage, setShowImage] = useState(false);
    
    if (!staffMember) return null;
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const isPaidThisMonth = staffMember.paymentHistory?.some(p => p.month === currentMonth && p.status === 'Paid');
    
    return (
        <FadeIn>
            <div className="space-y-6">
                <button onClick={onBack} className="flex items-center text-gray-500 hover:text-navy-900 transition-colors"><i className="fa-solid fa-arrow-left mr-2"></i> Back to Directory</button>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-navy-800 to-navy-600 relative"><div className="absolute inset-0 bg-pattern opacity-10"></div></div>
                    <div className="px-8 pb-8 relative">
                        <div className="flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
                            <div className="flex items-end">
                                <div className={`w-28 h-28 rounded-xl bg-white p-1.5 shadow-lg relative shrink-0 ${staffMember.picture ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`} onClick={() => staffMember.picture && setShowImage(true)} title={staffMember.picture ? "Click to view full image" : ""}><div className="w-full h-full bg-navy-50 rounded-lg flex items-center justify-center text-4xl text-navy-300 font-bold border border-gray-100 overflow-hidden">{staffMember.picture ? <img src={staffMember.picture} alt="" className="w-full h-full object-cover"/> : `${staffMember.firstName[0]}${staffMember.lastName[0]}`}</div><span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${staffMember.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}><i className={`fa-solid ${staffMember.status === 'Active' ? 'fa-check' : 'fa-ban'}`}></i></span></div>
                                <div className="ml-5 mb-1"><h1 className="text-3xl font-bold text-navy-900 leading-tight">{staffMember.firstName} {staffMember.lastName}</h1><div className="flex flex-wrap items-center gap-2 mt-1"><p className="text-gray-500 font-medium text-sm flex items-center gap-2"><span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{staffMember.staffId}</span><span>• {staffMember.role} ({staffMember.department})</span></p>{staffMember.kyc?.isVerified ? (<span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center"><i className="fa-solid fa-shield-halved mr-1"></i> Verified</span>) : (<span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded flex items-center"><i className="fa-solid fa-circle-exclamation mr-1"></i> Pending KYC</span>)}</div></div>
                            </div>
                            <div className="flex gap-3 mt-4 md:mt-0"><Button variant="outline" className="w-auto px-4" onClick={onEdit}><i className="fa-solid fa-pen-to-square mr-2"></i> Edit Profile</Button></div>
                        </div>
                        <div className="flex space-x-8 border-b border-gray-200 mt-8">{[{id:'OVERVIEW', icon:'fa-chart-pie', label:'Overview'}, {id:'FINANCE', icon:'fa-wallet', label:'Finance'}, {id:'ADMIN', icon:'fa-shield-halved', label:'Admin'}].map(t => (<button key={t.id} onClick={() => setActiveTab(t.id as Tab)} className={`pb-4 text-sm font-bold flex items-center transition-all ${activeTab === t.id ? 'text-navy-900 border-b-2 border-navy-900' : 'text-gray-400 hover:text-navy-600'}`}><i className={`fa-solid ${t.icon} mr-2`}></i> {t.label}</button>))}</div>
                        <div className="pt-8 min-h-[300px]">
                            {activeTab === 'OVERVIEW' && (<div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"><h3 className="font-bold text-navy-900 border-b border-gray-100 pb-3 mb-4 flex items-center"><i className="fa-solid fa-user mr-2 text-navy-600"></i> Personal Information</h3><div className="space-y-4 text-sm"><div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Full Name</span><span className="font-semibold text-navy-900">{staffMember.firstName} {staffMember.lastName}</span></div><div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Gender</span><span className="font-semibold text-navy-900">{staffMember.gender}</span></div><div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Email</span><span className="font-semibold text-navy-900">{staffMember.email}</span></div><div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Phone</span><span className="font-semibold text-navy-900">{staffMember.phone}</span></div><div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">NIN</span><span className="font-semibold text-navy-900">{staffMember.nin || 'Not Provided'}</span></div><div className="flex justify-between"><span className="text-gray-500 uppercase text-xs font-bold">Address</span><span className="font-semibold text-navy-900 text-right">{staffMember.address || 'N/A'}</span></div></div></div><div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"><h3 className="font-bold text-navy-900 border-b border-gray-100 pb-3 mb-4 flex items-center"><i className="fa-solid fa-briefcase mr-2 text-navy-600"></i> Employment Details</h3><div className="space-y-4 text-sm"><div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Role</span><span className="font-semibold text-navy-900">{staffMember.role}</span></div><div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Department</span><span className="font-semibold text-navy-900">{staffMember.department}</span></div><div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Joined Date</span><span className="font-semibold text-navy-900">{new Date(staffMember.joinedAt).toLocaleDateString()}</span></div><div className="flex justify-between"><span className="text-gray-500 uppercase text-xs font-bold">Status</span><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${staffMember.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{staffMember.status}</span></div></div></div></div>)}
                            {activeTab === 'FINANCE' && (<div className="grid grid-cols-1 md:grid-cols-3 gap-8"><div className="md:col-span-2 space-y-6"><div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm"><div className="flex justify-between items-start mb-6"><div><h3 className="text-lg font-bold text-navy-900">Payroll Action</h3><p className="text-sm text-gray-500">Processing for: <span className="font-bold text-navy-900">{currentMonth}</span></p></div><span className={`px-3 py-1 rounded text-xs font-bold border ${isPaidThisMonth ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{isPaidThisMonth ? 'PAID' : 'PENDING'}</span></div><div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-100"><div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Salary</label><span className="text-xl font-bold text-navy-900">₦{safeParseFloat(staffMember.salary).toLocaleString()}</span></div><Button onClick={onPaySalary} disabled={isPaidThisMonth} variant={isPaidThisMonth ? 'secondary' : 'primary'} className="w-auto px-6">{isPaidThisMonth ? 'Salary Paid' : 'Calculate & Pay'}</Button></div></div><div><h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Payment History</h4><div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"><table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Month</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Net Pay</th><th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th></tr></thead><tbody className="bg-white divide-y divide-gray-200">{staffMember.paymentHistory?.map(p => (<tr key={p.id}><td className="px-6 py-4 text-sm text-navy-900 font-medium">{p.month}</td><td className="px-6 py-4 text-sm text-navy-900 font-bold">{new Date(p.date).toLocaleDateString()}</td><td className="px-6 py-4 text-sm text-navy-900 font-bold">₦{safeParseFloat(p.amount).toLocaleString()}</td><td className="px-6 py-4 text-right"><button onClick={() => onViewReceipt(p)} className="text-xs text-navy-600 hover:text-navy-900 font-medium hover:underline bg-navy-50 px-3 py-1 rounded-full border border-navy-100"><i className="fa-solid fa-receipt mr-1"></i> Slip</button></td></tr>))}{(!staffMember.paymentHistory || staffMember.paymentHistory.length === 0) && (<tr><td colSpan={4} className="p-4 text-center text-gray-500 text-sm">No payment history found.</td></tr>)}</tbody></table></div></div></div><div className="space-y-6"><div className="bg-gradient-to-br from-navy-900 to-navy-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden"><div className="absolute -top-6 -right-6 w-24 h-24 bg-white opacity-10 rounded-full"></div><h4 className="text-sm font-bold text-gold-500 uppercase mb-4 tracking-wider flex items-center"><i className="fa-solid fa-building-columns mr-2"></i> Bank Details</h4><div className="space-y-4"><div><p className="text-navy-300 text-xs uppercase">Bank Name</p><p className="font-bold text-lg">{staffMember.bankDetails?.bankName || 'Not Provided'}</p></div><div><p className="text-navy-300 text-xs uppercase">Account Number</p><p className="font-mono text-xl tracking-widest">{staffMember.bankDetails?.accountNumber || '**** ****'}</p></div><div><p className="text-navy-300 text-xs uppercase">Account Name</p><p className="font-medium text-sm">{staffMember.bankDetails?.accountName || 'Not Provided'}</p></div></div></div></div></div>)}
                            {activeTab === 'ADMIN' && (<div className="space-y-8"><div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"><div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100"><h3 className="font-bold text-navy-900 flex items-center"><i className="fa-solid fa-file-contract mr-2 text-navy-600"></i> KYC & Verification</h3>{staffMember.kyc?.isVerified && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Verified</span>}</div><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-3"><p className="text-sm text-gray-600 mb-2">Submitted Documents</p>{staffMember.kyc?.documents.map((doc, idx) => (<div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${doc.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}><i className={`fa-solid ${doc.status === 'Verified' ? 'fa-check' : 'fa-hourglass'}`}></i></div><div><p className="text-sm font-medium text-navy-900">{doc.name}</p><p className="text-[10px] text-gray-500 uppercase">{doc.status}</p></div></div><button onClick={() => onVerifyDoc(doc)} className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-navy-50 text-navy-700">View</button></div>))}{(!staffMember.kyc?.documents || staffMember.kyc.documents.length === 0) && <p className="text-sm text-gray-500 italic">No documents submitted.</p>}</div><div className="border-l border-gray-100 pl-6 flex flex-col justify-center"><div className="text-center p-6 bg-navy-50 rounded-lg border border-dashed border-navy-200"><i className="fa-solid fa-upload text-3xl text-navy-300 mb-2"></i><p className="text-sm font-bold text-navy-700">Request Update</p><p className="text-xs text-gray-500 mb-4">Notify staff to upload missing KYC docs (NIN, Guarantor Form, etc).</p><Button variant="outline" className="text-xs w-auto px-4">Send Request</Button></div></div></div></div><div className="bg-red-50 border border-red-100 rounded-lg p-6 max-w-2xl"><h3 className="text-lg font-bold text-red-800 mb-4">Account Control</h3><p className="text-sm text-red-600 mb-6">Sensitive actions require Director PIN verification.</p><div className="flex gap-4"><Button variant="secondary" className="w-auto px-4" onClick={onSuspend}>{staffMember.status === 'Suspended' ? 'Activate Account' : 'Suspend Account'}</Button><Button variant="danger" className="w-auto px-4" onClick={onDelete}>Delete Record</Button></div></div></div>)}
                        </div>
                    </div>
                </div>
            </div>
            <ImageViewer isOpen={showImage} imageUrl={staffMember.picture} onClose={() => setShowImage(false)} />
        </FadeIn>
    );
};

export const StaffManager: React.FC<StaffManagerProps> = ({ staff, onUpdateStaff, onLogActivity }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('All');
  const [statusTab, setStatusTab] = useState<StaffStatusTab>('ALL');

  // Filters
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));

  // Dashboard Stats & DrillDown
  const [drillDownType, setDrillDownType] = useState<DrillDownType>(null);
  
  // Security & Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'SUSPEND' | 'DELETE' | 'PAY_SALARY' | 'VERIFY_DOC', payload?: any } | null>(null);

  // Finance State
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
  const [receiptData, setReceiptData] = useState<{ staff: Staff, record: PaymentRecord } | null>(null);

  // KYC State
  const [viewDoc, setViewDoc] = useState<KYCDocument | null>(null);

  const departments = ['All', ...Array.from(new Set(staff.map(s => s.department)))];

  // Date Navigation
  const handleDateChange = (offset: number) => {
    const date = new Date(filterDate);
    date.setDate(date.getDate() + offset);
    setFilterDate(date.toISOString().split('T')[0]);
  };
  
  const formattedDateDisplay = new Date(filterDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // --- STATS CALCULATION ---
  const dashboardStats = useMemo(() => {
     const attendanceList = staff.map(s => ({
         ...s,
         arrivalTime: getMockAttendance(s.id, filterDate)
     })).filter(s => s.arrivalTime !== null);
     
     const lateList = attendanceList.filter(s => {
         const [hour] = s.arrivalTime!.split(':');
         return parseInt(hour) >= 8;
     });

     const paidList = staff.filter(s => 
        s.paymentHistory?.some(p => p.month === filterMonth && p.status === 'Paid')
     );

     const unpaidList = staff.filter(s => 
        !s.paymentHistory?.some(p => p.month === filterMonth && p.status === 'Paid')
     );

     return { lateList, paidList, unpaidList };
  }, [staff, filterMonth, filterDate]);

  const getDrillDownList = () => {
    switch(drillDownType) {
        case 'LATE': return dashboardStats.lateList;
        case 'PAID': return dashboardStats.paidList;
        case 'UNPAID': return dashboardStats.unpaidList;
        default: return [];
    }
  };

  // --- ACTION HANDLERS ---
  const handlePinSuccess = () => {
    setShowPinModal(false);
    if (!pendingAction) return;

    if (pendingAction.type === 'SUSPEND' && selectedStaffId) {
        const updated = staff.map(s => s.id === selectedStaffId ? { ...s, status: s.status === 'Suspended' ? 'Active' : 'Suspended' } as Staff : s);
        onUpdateStaff(updated);
        onLogActivity('SUSPEND', 'STAFF', `Status changed for staff ID: ${selectedStaffId}`);
        setToast({ message: "Staff status updated successfully", type: 'success' });
    } 
    else if (pendingAction.type === 'DELETE' && selectedStaffId) {
        const updated = staff.filter(s => s.id !== selectedStaffId);
        onUpdateStaff(updated);
        onLogActivity('DELETE', 'STAFF', `Deleted staff record ID: ${selectedStaffId}`);
        setViewMode('LIST');
        setSelectedStaffId(null);
        setToast({ message: "Staff record deleted successfully", type: 'success' });
    }
    else if (pendingAction.type === 'PAY_SALARY' && selectedStaffId) {
        const { month, breakdown } = pendingAction.payload;
        const updated = staff.map(s => {
            if (s.id === selectedStaffId) {
                const newPayment: PaymentRecord = {
                    id: Date.now().toString(),
                    date: new Date().toISOString(),
                    amount: breakdown.netSalary,
                    status: 'Paid',
                    month: month,
                    transactionRef: `TXN-${Date.now().toString().slice(-8)}`,
                    breakdown: breakdown
                };
                // Trigger receipt view
                setReceiptData({ staff: { ...s, paymentHistory: [newPayment, ...(s.paymentHistory || [])] }, record: newPayment });
                setShowReceipt(true);
                return { ...s, paymentHistory: [newPayment, ...(s.paymentHistory || [])] };
            }
            return s;
        });
        onUpdateStaff(updated);
        onLogActivity('PAYMENT', 'FINANCE', `Paid salary to staff ID: ${selectedStaffId}`);
        setToast({ message: "Salary payment recorded successfully", type: 'success' });
    }
    else if (pendingAction.type === 'VERIFY_DOC' && selectedStaffId) {
        const { docName } = pendingAction.payload;
        const updated = staff.map(s => {
            if (s.id !== selectedStaffId) return s;
            const newDocs = s.kyc?.documents.map(d => d.name === docName ? { ...d, status: 'Verified' as const } : d) || [];
            const allVerified = newDocs.every(d => d.status === 'Verified');
            return { ...s, kyc: { ...s.kyc, isVerified: allVerified, documents: newDocs } as KYCInfo };
        });
        onUpdateStaff(updated);
        onLogActivity('UPDATE', 'STAFF', `Verified doc ${docName} for staff ID: ${selectedStaffId}`);
        setToast({ message: `Document verified. KYC Status updated.`, type: 'success' });
    }
    setPendingAction(null);
  };

  const triggerSuspend = () => { setPendingAction({ type: 'SUSPEND' }); setShowPinModal(true); };
  const triggerDelete = () => { setPendingAction({ type: 'DELETE' }); setShowPinModal(true); };
  const triggerVerifyDoc = (doc: KYCDocument) => {
      setPendingAction({ type: 'VERIFY_DOC', payload: { docName: doc.name } });
      setShowPinModal(true);
  };

  // --- RECEIPT COMPONENT ---
  const PaymentReceipt = ({ data, onClose }: { data: { staff: Staff, record: PaymentRecord }, onClose: () => void }) => {
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
                  
                  <div className="p-6 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-4 mb-4">
                          <div>
                              <span className="text-gray-500 text-[10px] uppercase font-bold block">Employee</span>
                              <span className="text-navy-900 font-bold text-sm">{data.staff.firstName} {data.staff.lastName}</span>
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
                              <span className="text-navy-900 font-medium">{data.staff.staffId}</span>
                          </div>
                          <div className="flex justify-between">
                              <span className="text-gray-500 text-sm">Payment Date</span>
                              <span className="text-navy-900 font-medium">{new Date(data.record.date).toLocaleDateString()}</span>
                          </div>
                      </div>

                      <div className="mb-6 bg-navy-50 p-4 rounded border border-navy-100">
                          <h4 className="text-xs font-bold text-navy-400 uppercase mb-2 flex items-center">
                              <i className="fa-solid fa-money-bill-transfer mr-2"></i> Payment Destination
                          </h4>
                          <div className="flex justify-between items-end">
                              <div>
                                  <p className="text-sm font-bold text-navy-900">{data.staff.bankDetails?.bankName || 'Unknown Bank'}</p>
                                  <p className="text-xs text-navy-600">{data.staff.bankDetails?.accountName || data.staff.firstName}</p>
                              </div>
                              <p className="font-mono text-sm font-medium text-navy-800 tracking-wider">
                                  {data.staff.bankDetails?.accountNumber || '****'}
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

  // LIST VIEW
  const filteredStaff = staff.filter(s => {
    const matchesSearch = (s.firstName + ' ' + s.lastName + s.role).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = filterDept === 'All' || s.department === filterDept;
    const matchesStatus = statusTab === 'ALL' || (statusTab === 'ACTIVE' && s.status === 'Active') || (statusTab === 'INACTIVE' && s.status !== 'Active');
    return matchesSearch && matchesDept && matchesStatus;
  });

  if (viewMode === 'ADD') { 
      return (
        <StaffForm 
            onCancel={() => setViewMode('LIST')} 
            onSubmit={(data) => {
                const newStaff: Staff = {
                    ...data as Staff,
                    id: Date.now().toString(),
                    staffId: `STF-${Date.now().toString().slice(-4)}`,
                    joinedAt: new Date().toISOString(),
                    paymentHistory: [],
                    kyc: data.kyc
                };
                onUpdateStaff([...staff, newStaff]);
                onLogActivity('CREATE', 'STAFF', `Added new staff: ${newStaff.firstName} ${newStaff.lastName}`);
                setToast({ message: "New staff member added", type: "success" });
                setViewMode('LIST');
            }}
        /> 
      ); 
  }

  if (viewMode === 'EDIT' && selectedStaffId) { 
      const staffMember = staff.find(s => s.id === selectedStaffId);
      return (
        <StaffForm 
            initialData={staffMember} 
            onCancel={() => setViewMode('DETAIL')} 
            onSubmit={(data) => {
                const updated = staff.map(s => s.id === selectedStaffId ? { ...s, ...data as Staff } : s);
                onUpdateStaff(updated);
                onLogActivity('UPDATE', 'STAFF', `Updated staff info: ${data.firstName} ${data.lastName}`);
                setToast({ message: "Staff record updated", type: "success" });
                setViewMode('DETAIL');
            }} 
        /> 
      ); 
  }

  if (viewMode === 'DETAIL' && selectedStaffId) { 
      const selectedStaff = staff.find(s => s.id === selectedStaffId);
      if (!selectedStaff) return null; // Should ideally go back to LIST

      return (
        <>
            <StaffDetail 
                staffMember={selectedStaff} 
                onBack={() => setViewMode('LIST')}
                onEdit={() => setViewMode('EDIT')}
                onPaySalary={() => {
                    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
                    setPayrollData({ baseSalary: selectedStaff.salary || '0', bonus: '0', bonusRemark: '', deductions: '0', deductionRemark: '', tax: '0', month: currentMonth }); 
                    setShowPayrollModal(true);
                }}
                onViewReceipt={(record) => {
                    setReceiptData({ staff: selectedStaff, record });
                    setShowReceipt(true);
                }}
                onSuspend={triggerSuspend}
                onDelete={triggerDelete}
                onVerifyDoc={(doc) => {
                    setViewDoc(doc);
                }}
            />
            <PayrollCalculator />
            <KYCViewer />
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} />
            {showReceipt && receiptData && <PaymentReceipt data={receiptData} onClose={() => setShowReceipt(false)} />}
        </>
      ); 
  }

  return (
    <div className="animate-fadeIn space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      {/* Date Filters Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
            <div>
                <h2 className="text-xl font-bold text-navy-900">Staff Management</h2>
                <p className="text-sm text-gray-500">Overview, Attendance & Payroll</p>
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
            </div>
      </div>

      {/* Header Stats & Drill Down */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
             <p className="text-xs font-bold text-gray-500 uppercase">Total Staff</p>
             <h3 className="text-2xl font-bold text-navy-900">{staff.length}</h3>
         </div>
         
         <div 
             onClick={() => setDrillDownType('LATE')}
             className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-orange-500"
         >
             <div className="flex justify-between">
                 <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Late Today</p>
                    <h3 className="text-2xl font-bold text-orange-600">{dashboardStats.lateList.length}</h3>
                 </div>
                 <i className="fa-solid fa-clock text-orange-100 text-3xl"></i>
             </div>
         </div>
         
         <div 
            onClick={() => setDrillDownType('PAID')}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-green-500"
         >
             <div className="flex justify-between">
                 <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Paid ({filterMonth.slice(0,3)})</p>
                    <h3 className="text-2xl font-bold text-green-600">{dashboardStats.paidList.length}</h3>
                 </div>
                 <i className="fa-solid fa-money-bill text-green-100 text-3xl"></i>
             </div>
         </div>
         
         <div 
            onClick={() => setDrillDownType('UNPAID')}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-red-500"
         >
             <div className="flex justify-between">
                 <div>
                    <p className="text-xs font-bold text-gray-500 uppercase">Unpaid</p>
                    <h3 className="text-2xl font-bold text-red-600">{dashboardStats.unpaidList.length}</h3>
                 </div>
                 <i className="fa-solid fa-triangle-exclamation text-red-100 text-3xl"></i>
             </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
          {(['ALL', 'ACTIVE', 'INACTIVE'] as StaffStatusTab[]).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${statusTab === tab ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-navy-700'}`}
              >
                  {tab}
              </button>
          ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200 gap-4">
         <div className="flex gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text" 
                  placeholder="Search staff..." 
                  className="w-full pl-9 pr-3 py-2 border rounded-md focus:outline-none focus:border-navy-900"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
              className="border rounded-md px-3 py-2 bg-white"
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
            >
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
         </div>
         <Button className="w-auto px-6" onClick={() => setViewMode('ADD')}>
            <i className="fa-solid fa-plus mr-2"></i> Add Staff
         </Button>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map(s => (
          <div key={s.id} onClick={() => { setSelectedStaffId(s.id); setViewMode('DETAIL'); }} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group cursor-pointer hover:-translate-y-1">
            <div className="p-6 flex items-start gap-4">
               <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-lg border border-white shadow-sm overflow-hidden">
                  {s.picture ? <img src={s.picture} alt="" className="w-full h-full object-cover"/> : `${s.firstName[0]}${s.lastName[0]}`}
               </div>
               <div className="flex-1">
                  <div className="flex justify-between items-start">
                     <h3 className="font-bold text-navy-900 group-hover:text-gold-600 transition-colors">{s.firstName} {s.lastName}</h3>
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                  </div>
                  <p className="text-xs text-navy-500 font-bold uppercase mb-1">{s.role}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2"><i className="fa-solid fa-building"></i> {s.department}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-1"><i className="fa-solid fa-phone"></i> {s.phone}</p>
               </div>
            </div>
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-between items-center text-xs">
               <span className="font-mono text-gray-400">{s.staffId}</span>
               <span className="text-navy-600 font-bold hover:underline">View Profile <i className="fa-solid fa-arrow-right ml-1"></i></span>
            </div>
          </div>
        ))}
        {filteredStaff.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-400">
            <i className="fa-solid fa-users-slash text-4xl mb-3 opacity-50"></i>
            <p>No staff members found.</p>
          </div>
        )}
      </div>

       {/* --- DRILL DOWN MODAL --- */}
       <Modal
            isOpen={drillDownType !== null}
            onClose={() => setDrillDownType(null)}
            title={
                drillDownType === 'LATE' ? `Late Comers Today` :
                drillDownType === 'PAID' ? `Paid Staff for ${filterMonth}` :
                `Unpaid Staff for ${filterMonth}`
            }
            icon={drillDownType === 'PAID' ? 'fa-solid fa-check-circle' : drillDownType === 'UNPAID' ? 'fa-solid fa-triangle-exclamation' : 'fa-solid fa-clock'}
        >
            <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
                <table className="min-w-full divide-y divide-gray-200 mb-4">
                    <thead className="bg-gray-50 sticky top-0">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">Staff</th>
                            <th className="px-4 py-2 text-right text-xs font-bold text-gray-500 uppercase">
                                {drillDownType === 'LATE' ? 'Time In' : 'Status'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {getDrillDownList().map((s: Staff & { arrivalTime?: string | null }) => (
                            <tr 
                                key={s.id} 
                                onClick={() => { setDrillDownType(null); setSelectedStaffId(s.id); setViewMode('DETAIL'); }}
                                className="cursor-pointer hover:bg-navy-50"
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600 mr-3">
                                            {s.firstName[0]}{s.lastName[0]}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-navy-900">{s.firstName} {s.lastName}</p>
                                            <p className="text-xs text-gray-500">{s.role}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    {drillDownType === 'LATE' ? (
                                        <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-red-100 text-red-700">
                                            {s.arrivalTime}
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
