import React, { useState, useMemo, useContext, useEffect } from 'react';
import {  FeeRecord, Transaction } from '../types';
import { Button, Modal } from '../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { TeacherSettingsManager } from '@/components/teachers/TeacherSettings';
import { ParentFinanceManager } from '@/components/parents/ParentFinanceManager';

interface ParentDashboardProps {
    onLogout: () => void;
}

type Module = 'OVERVIEW' | 'CHILDREN' | 'FINANCE' | 'PROFILE';

export const ParentDashboard: React.FC<ParentDashboardProps> = ({onLogout }) => {
    const [activeModule, setActiveModule] = useState<Module>('OVERVIEW');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const {selectedSchool:school,students} = useContext(uiContext);
    const {currentUser} = useContext(authContext);

    const currentSession = school?.sessions?.find(s => s.is_current)?.name || 'Unknown Session';
    const currentTerm = school?.terms?.find(t => t.is_current)?.name || 'Unknown Term';

    
    const parentName = currentUser ? `${currentUser.full_name} ` : 'Parent User';

    const [feeRecords] = useState<FeeRecord[]>([
        { id: 'f1', studentId: '1', classId: 'c1', term: 'First Term', session: '2023/2024', totalAmount: 150000, amountPaid: 150000, balance: 0, status: 'PAID', dueDate: '2023-09-30' },
        { id: 'f2', studentId: '3', classId: 'c3', term: 'First Term', session: '2023/2024', totalAmount: 180000, amountPaid: 80000, balance: 100000, status: 'PARTIAL', dueDate: '2023-09-30' }
    ]);

    const [transactions] = useState<Transaction[]>([
        { id: 't1', date: '2023-09-01T10:00:00Z', type: 'INCOME', category: 'Tuition', amount: 150000, description: 'Emily Term 1 Fee', reference: 'REF-001', status: 'COMPLETED', method: 'BANK_TRANSFER', createdBy: 'd1', studentIds: ['1'] },
        { id: 't2', date: '2023-09-15T14:30:00Z', type: 'INCOME', category: 'Tuition', amount: 80000, description: 'Joshua Term 1 Partial', reference: 'REF-002', status: 'COMPLETED', method: 'CARD', createdBy: 'd1', studentIds: ['3'] }
    ]);
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
        { id: 'FINANCE', icon: 'fa-solid fa-wallet', label: 'Finance' },
        { id: 'CHILDREN', icon: 'fa-solid fa-children', label: 'My Children' },
        { id: 'SETTINGS', icon: 'fa-solid fa-gear', label: 'Settings' },
        { id: 'PROFILE', icon: 'fa-solid fa-user', label: 'Parent Profile' }
    ];
    
    useEffect(() => {
        // set active tab based on the current URL path
        const path = window.location.pathname.split('/').filter(Boolean);
        if (path.length > 1) {
            const moduleId = path[1].toUpperCase() as Module;
            if (navigation.some(item => item.id === moduleId)) {
                setActiveModule(moduleId);
            }
        }
    }, []);

    const renderModule = () => {
        switch (activeModule) {
            
            case 'FINANCE':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-navy-900">Finance Dashboard</h2>
                            <p className="text-gray-500 text-sm mt-1">Manage fee payments and view transaction history for your children.</p>
                        </div> 
                        
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 space-y-6">
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                    <h3 className="font-bold text-navy-900 mb-4 border-b pb-2">Fee Balances</h3>
                                    <div className="space-y-4">
                                        {feeRecords.map(record => {
                                            const student = students.find(s => s.id === record.studentId);
                                            return (
                                                <div key={record.id} className="p-4 border border-gray-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div>
                                                        <h4 className="font-bold text-navy-900">{student?.firstName} {student?.lastName}</h4>
                                                        <p className="text-xs text-gray-500">{record.term} • {record.session}</p>
                                                    </div>
                                                    <div className="flex items-center gap-6">
                                                        <div className="text-right">
                                                            <div className="text-sm text-gray-500">Balance</div>
                                                            <div className={`font-black ${record.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>₦{record.balance.toLocaleString()}</div>
                                                        </div>
                                                        {record.balance > 0 && (
                                                            <Button>Pay Now</Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-6">
                                    <h3 className="font-bold text-navy-900 mb-4 border-b pb-2">Recent Transactions</h3>
                                    <div className="space-y-4">
                                        {transactions.map(txn => (
                                            <div key={txn.id} className="flex justify-between items-start pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                                                <div>
                                                    <div className="font-bold text-navy-900 text-sm">{txn.description}</div>
                                                    <div className="text-xs text-gray-500">{new Date(txn.date).toLocaleDateString()}</div>
                                                </div>
                                                <div className="font-bold text-green-600 text-sm">
                                                    +₦{txn.amount.toLocaleString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'CHILDREN':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h2 className="text-xl font-bold text-navy-900">My Children</h2>
                            <p className="text-gray-500 text-sm mt-1">View details and academic progress.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {students.map(student => (
                                <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="h-24 bg-gradient-to-r from-navy-900 to-navy-700"></div>
                                    <div className="px-6 pb-6 relative">
                                        <div className="w-20 h-20 rounded-xl bg-white p-1 absolute -top-10 shadow-lg">
                                            <div className="w-full h-full bg-navy-100 rounded-lg flex items-center justify-center text-navy-600 font-bold text-2xl">
                                                {student.firstName[0]}
                                            </div>
                                        </div>
                                        <div className="mt-12">
                                            <h3 className="text-xl font-black text-navy-900">{student.firstName} {student.lastName}</h3>
                                            <p className="text-gray-500 text-sm">{student.admissionNumber}</p>
                                            
                                            <div className="mt-6 space-y-3">
                                                <div className="flex justify-between text-sm border-b pb-2 border-gray-50">
                                                    <span className="text-gray-500">Gender</span>
                                                    <span className="font-bold text-navy-900">{student.gender}</span>
                                                </div>
                                                <div className="flex justify-between text-sm border-b pb-2 border-gray-50">
                                                    <span className="text-gray-500">Status</span>
                                                    <span className="font-bold text-green-600">{student.status}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Joined</span>
                                                    <span className="font-bold text-navy-900">{new Date(student.joinedAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-6 flex gap-2">
                                                <Button variant="outline" className="flex-1 text-xs">View Results</Button>
                                                <Button variant="outline" className="flex-1 text-xs">Attendance</Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'PROFILE':
                return (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                            <h2 className="text-xl font-bold text-navy-900 mb-6">Parent Profile</h2>
                            
                            <div className="flex items-center gap-6 mb-8">
                                <div className="w-24 h-24 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center text-3xl font-bold">
                                    {parentName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                    <Button variant="outline" size="sm"><i className="fa-solid fa-camera mr-2"></i> Change Photo</Button>
                                    <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Full Name</label>
                                        <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900" defaultValue={parentName} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Phone Number</label>
                                        <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900" defaultValue="08012345678" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email Address</label>
                                    <input type="email" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900" defaultValue="sarah.c@gmail.com" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Home Address</label>
                                    <input type="text" className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900" defaultValue="42 Pine Avenue, Springfield" />
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <Button className="w-full sm:w-auto">Save Changes</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div>Under Construction</div>;
        }
    };

    return (
        <div className="flex h-screen bg-navy-50 overflow-hidden font-sans">
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
                                to={`/parent/${item?.label?.toLowerCase()}/`}
                                key={item.id}
                                onClick={() => { setActiveModule(item.id as Module); setMobileMenuOpen(false); }}
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
                                        
                                        {/* <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl mb-4">
                                                <i className="fa-solid fa-scale-balanced"></i>
                                            </div>
                                            <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">Net Status</h3>
                                            <div className={`text-3xl font-black mt-1 ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {netBalance >= 0 ? '+' : '-'}₦{Math.abs(netBalance).toLocaleString()}
                                            </div>
                                            <div className="text-xs font-medium text-gray-400 mt-2">{netBalance >= 0 ? 'Account in good standing' : 'Action required'}</div>
                                        </div> */}
                                    </div>

                                    {/* Recent Activity or Quick Children List */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="p-6 border-b border-gray-100">
                                            <h2 className="text-lg font-bold text-navy-900">Your Children</h2>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {students.map(student => (
                                                <div key={student.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setActiveModule('CHILDREN')}>
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center font-bold text-lg">
                                                            {student.first_name[0]}{student.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-navy-900">{student.first_name} {student.last_name}</h4>
                                                            <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                                                <span><i className="fa-solid fa-id-card"></i> {student.admission_number}</span>
                                                                <span>•</span>
                                                                <span className={`px-2 py-0.5 rounded-full ${student.gender === 'female' ? 'bg-pink-50 text-pink-600' : 'bg-blue-50 text-blue-600'}`}>{student.gender}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <i className="fa-solid fa-chevron-right text-gray-300"></i>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                }
                            />
                                                
                            <Route path='finance/' element =
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
