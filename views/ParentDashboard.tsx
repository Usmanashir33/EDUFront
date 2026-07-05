import React, { useState, useMemo, useContext, useEffect } from 'react';
import {  FeeRecord, Transaction } from '../types';
import { Button, Modal } from '../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { TeacherSettingsManager } from '@/components/teachers/TeacherSettings';
import { ParentFinanceManager } from '@/components/parents/ParentFinanceManager';
import StudentLedger from '@/components/finance/StudentLedger';
import urls from '@/customHooks/ServerUrls';
import { ParentStudentDetail } from '@/components/parents/ParentStudentDetails';

interface ParentDashboardProps {
    onLogout: () => void;
}

type Module = 'OVERVIEW' | 'CHILDREN' | 'FINANCE' | 'PROFILE' |"PAYMENTS" | 'SETTINGS';

export const ParentDashboard: React.FC<ParentDashboardProps> = ({onLogout }) => {
    const [activeModule, setActiveModule] = useState<Module>('OVERVIEW');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [ledgerStudentId, setLedgerStudentId] = useState<string | null>(null);
    const [ledgerDateFilter, setLedgerDateFilter] = useState('');
    const [receiptImageToView, setReceiptImageToView] = useState<string | null>(null);
    const {selectedSchool:school,students,classRooms} = useContext(uiContext);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const {currentUser} = useContext(authContext);

    const currentSession = school?.sessions?.find(s => s.is_current)?.name || 'Unknown Session';
    const currentTerm = school?.terms?.find(t => t.is_current)?.name || 'Unknown Term';
    
    const parentName = currentUser ? `${currentUser.full_name} ` : 'Parent User';

    const transactions = school?.dashboardData?.studentTrxs || []
    const dashBord = useMemo(() => {
        if (!school?.dashboardData) {
            return {
                totalPaid: 0,
                totalOwed: 0,
                netBalance: 0,
                girlsCount: 0,
                boysCount: 0
            };
        }
        return {
            totalPaid : school?.dashboardData.totalPaid ,
            totalOwed : school?.dashboardData.totalNetBalance ,
            netBalance : school?.dashboardData.totalPaid + school?.dashboardData?.totalNetBalance ,
            girlsCount : school?.dashboardData.totalGirls ,
            boysCount : school?.dashboardData.totalBoys 
        };
    }, [school]);
    const {totalPaid, totalOwed, netBalance, girlsCount, boysCount} = dashBord;

    // --- Navigation ---
    const navigation = [
        { id: 'OVERVIEW', icon: 'fa-solid fa-house', label: 'Dashboard' },
        { id: 'PAYMENTS', icon: 'fa-solid fa-money-bill', label: 'Payments' },
        { id: 'CHILDREN', icon: 'fa-solid fa-children', label: 'My Children' },
        { id: 'SETTINGS', icon: 'fa-solid fa-gear', label: 'Settings' },
        { id: 'PROFILE', icon: 'fa-solid fa-user', label: 'Parent Profile' }
    ];
    const handleStudentClick = (student: any) => {
        setSelectedStudent(student);
    }
    
    useEffect(() => {
        // set active tab based on the current URL path
        setSelectedStudent(null); // Reset selected student when the path changes
        const path = window.location.pathname.split('/').filter(Boolean);
        if (path.length > 1) {
            const moduleId = path[1].toUpperCase() as Module;
            if (navigation.some(item => item.id === moduleId)) {
                setActiveModule(moduleId);
            }
        }
    }, [activeModule]);

    return (
        <div className="flex h-screen bg-navy-50 overflow-hidden font-sans relative">
            {/* Sidebar */}
            <aside className={`fixed md:static inset-y-0 left-0 z-40 bg-emerald-900 text-white transition-all duration-300 ease-in-out ${sidebarExpanded ? 'w-64' : 'w-20'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col shadow-2xl md:shadow-none`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-graduation-cap text-gold-400"></i>
                        </div>
                        {sidebarExpanded && <span className="font-bold tracking-wider truncate">Parent Site</span>}
                    </div>
                    <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="hidden md:flex items-center justify-center w-8 h-8 rounded hover:bg-white/10 shrink-0">
                        <i className={`fa-solid fa-chevron-${sidebarExpanded ? 'left' : 'right'} text-sm`}></i>
                    </button>
                    <button onClick={() => setMobileMenuOpen(false)} className="md:hidden w-8 h-8 rounded flex items-center justify-center hover:bg-white/10">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
                    <nav className="space-y-1 px-2">
                        {navigation.map(item => (
                            <Link
                                to={`/parent/${item?.id?.toLowerCase()}/`}
                                key={item.id}
                                onClick={() => { setActiveModule(item.id as Module); setMobileMenuOpen(false);}}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden
                                    ${activeModule === item.id 
                                        ? 'bg-white/20 text-white shadow-inner' 
                                        : 'text-emerald-100 hover:bg-white/10 hover:text-white'}`}
                            >
                                {activeModule === item.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-400 rounded-r"></div>
                                )}
                                <div className="w-6 flex justify-center">
                                    <i className={`${item.icon} ${activeModule === item.id ? 'text-gold-400' : ''}`}></i>
                                </div>
                                {sidebarExpanded && <span className="font-medium truncate text-sm">{item.label}</span>}
                                {!sidebarExpanded && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-emerald-950 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-white/10 shrink-0">
                    <div className="flex items-center gap-3 mb-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-gold-400 font-bold uppercase border border-white/10">
                            {parentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        {sidebarExpanded && (
                            <div className="truncate">
                                <p className="text-sm font-bold text-white truncate">{parentName}</p>
                                <p className="text-xs text-emerald-200">Parent Profile</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsLogoutConfirmOpen(true)} className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-rose-500/20 text-rose-200 rounded-lg hover:bg-rose-500/30 transition-colors ${!sidebarExpanded && 'px-0'}`}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i>
                        {sidebarExpanded && <span className="font-bold text-sm">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 bg-gray-50 h-screen overflow-hidden relative">
                {/* Mobile Header */}
                {selectedStudent && <ParentStudentDetail id={selectedStudent.id} student={selectedStudent} setStudent={setSelectedStudent} />}

                <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100">
                            <i className="fa-solid fa-bars text-xl text-navy-900"></i>
                        </button>
                        <h1 className="font-bold text-navy-900">{school.name}</h1>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 shrink-0 z-10 shadow-sm">
                    <h1 className="text-xl font-black text-navy-900 uppercase tracking-wider">{navigation.find(n => n.id === activeModule)?.label}</h1>
                    <div className="flex items-center gap-4">
                        <p className="text-md text-gray-500 flex items-center gap-3 mt-1">
                            <span>
                                <i className="fa-solid fa-calendar mr-1"></i> {currentSession}
                            </span>
                            <span>
                                <i className="fa-solid fa-flag mr-1"></i> {currentTerm}
                            </span>
                        </p>
                        <div className="px-4 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600 flex items-center gap-2">
                            <i className="fa-solid fa-school text-navy-900"></i>
                            {school.name}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-20 md:pb-0">
                        <Routes> 
                            <Route path="/" element={<Navigate to="/parent/overview/" replace />} />
                            <Route path='overview/' element =
                                {
                                <div className="space-y-6 animate-fadeIn">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div>
                                            <h1 className="text-2xl font-black text-navy-900">Welcome, {parentName}</h1>
                                            <p className="text-gray-500"> Hi <b>{currentUser?.relation_ship}!</b> Here is your family's summary at {school.name}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-4">
                                                <i className="fa-solid fa-children"></i>
                                            </div>
                                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Children</h3>
                                            <div className="text-3xl font-black text-navy-900 mt-1">{students?.length || 0}</div>
                                            <div className="text-xs font-medium text-gray-400 mt-2">
                                                <span className="text-pink-500"><i className="fa-solid fa-venus"></i> {girlsCount} Girls</span> • <span className="text-blue-500"><i className="fa-solid fa-mars"></i> {boysCount} Boys</span>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl mb-4">
                                                <i className="fa-solid fa-money-bill-trend-up"></i>
                                            </div>
                                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Paid</h3>
                                            <div className="text-3xl font-black text-navy-900 mt-1">₦{totalPaid.toLocaleString()}</div>
                                            <div className="text-xs font-medium text-gray-400 mt-2">All terms</div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center text-xl mb-4">
                                                <i className="fa-solid fa-file-invoice-dollar"></i>
                                            </div>
                                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Total Owed</h3>
                                            <div className="text-3xl font-black text-red-600 mt-1">₦{totalOwed?.toLocaleString()}</div>
                                            <div className="text-xs font-medium text-red-400 mt-2">Pending balances</div>
                                        </div>
                                    </div>

                                    {/* Recent Activity or Quick Children List */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="p-6 border-b border-gray-100">
                                            <h2 className="text-lg font-bold text-navy-900">Your Children Ledger</h2>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {transactions.map(trx => (
                                                <div key={trx.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" 
                                                    onClick={() => {
                                                            // Set active student for ledger view
                                                            setLedgerStudentId(trx?.student || null);
                                                        }}
                                                >
                                                    <div className="flex items-center gap-4" >
                                                        <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center font-bold text-lg">
                                                            {trx.name[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-navy-900">{trx.name} </h4>
                                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                                <span><i className="fa-solid fa-id-card"></i> {trx.admission_number}</span>
                                                                <span>•</span>
                                                                {classRooms.filter(c => trx.active_classes.includes(c.id)).map(c => (
                                                                    <span key={c.id}><i className="fa-solid fa-school"></i> {c.name}</span>
                                                                ))}
                                                                <span className={`px-2 py-0.5 rounded-full ${trx.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>{trx.gender}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-cols gap-1">
                                                        <span className="text-sm text-gray-500">Net Balance</span>
                                                        <div className='flex items-center gap-4'>
                                                            <div className="">
                                                                <span className={`font-bold ${trx.current_net_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>₦{trx?.current_net_balance?.toLocaleString()}</span>
                                                            </div>
                                                            <i className="fa-solid fa-chevron-right text-gray-300"></i>

                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                }
                            />
                            <Route path='children/' element =
                                { <div className="space-y-6 animate-fadeIn">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h2 className="text-xl font-bold text-navy-900">My Children</h2>
                                        <p className="text-gray-500 text-sm mt-1">View details and academic progress.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {students.map(student => (
                                            <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                                <div className="h-20 bg-gradient-to-r from-navy-900 to-navy-700"></div>
                                                <div className="px-2 pb-6 relative ">
                                                    <div className="w-20 h-20 rounded-xl bg-white p-1 absolute -top-20 shadow-lg">
                                                        <div className="w-full h-full bg-navy-100 rounded-lg flex items-center justify-center text-navy-600 font-bold text-2xl">
                                                            <img src={urls.BASE_URL + student.picture} alt={`${student.first_name} ${student.last_name}`} className="w-full h-full object-cover rounded-lg" />
                                                        </div>
                                                    </div>
                                                    <div className="mt-12">
                                                        <h3 className="text-xl font-black text-navy-900">{student.first_name} {student.middle_name} {student.last_name}</h3>
                                                        <p className="text-gray-500 text-sm">{student.admission_number}</p>
                                                        
                                                        <div className="mt-6 space-y-3">
                                                            <div className="flex justify-between text-sm border-b pb-2 border-gray-50">
                                                                <span className="text-gray-500">Gender</span>
                                                                <span className="font-bold text-navy-900">{student.gender}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm border-b pb-2 border-gray-50">
                                                                <span className="text-gray-500">Status</span>
                                                                <span className="font-bold text-green-600">{student.is_active ? 'Active' : 'Inactive'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-gray-500">Joined</span>
                                                                <span className="font-bold text-navy-900">{new Date(student.joined_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="mt-6 flex gap-2">
                                                            <Button onClick = {() => {
                                                                handleStudentClick(student);
                                                            }}
                                                            variant="outline" className="flex-1 text-xs">View Child Details</Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>}
                            />
                            <Route path='payments/' element =
                                {<ParentFinanceManager/>}
                            />
                            <Route path='settings/' element =
                                {<TeacherSettingsManager/>}
                            />
                            <Route path="*" element={<Navigate to="/parent/overview/" replace />} />
                        </Routes>
                    </div>
                    
                </div>
            </main>
            
            {/* Student Ledger Modal for All Roles  */}
            {ledgerStudentId && 
                <StudentLedger
                    ledgerStudentId = {ledgerStudentId}
                    setLedgerStudentId = {setLedgerStudentId}
                    ledgerDateFilter = {ledgerDateFilter}
                    setLedgerDateFilter = {setLedgerDateFilter}
                    setReceiptImageToView = {setReceiptImageToView}
            />}
            {/* Logout Modal */}
            <Modal isOpen={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} title="Confirm Logout" size="sm">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-3xl mx-auto mb-4">
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </div>
                    <h3 className="text-xl font-bold text-navy-900 mb-2">Ready to Leave?</h3>
                    <p className="text-gray-500 mb-8">Are you sure you want to log out of the parent portal?</p>
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button>
                        <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={onLogout}>Logout</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
