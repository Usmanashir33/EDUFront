import React, { useContext, useState } from 'react';
import { School, UserRole } from '../../types';
import { StaffSidebar, StaffRole } from './StaffSidebar';
import { RegistrarView } from './RegistrarView';
import { AccountantView } from './AccountantView';
import { ExamOfficerView } from './ExamOfficerView';
import { Modal, Button } from '../../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import urls from '@/customHooks/ServerUrls';

interface StaffDashboardProps {
    onLogout: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({ onLogout }) => {
    // For demo purposes, we will allow toggling the staff role from the header
    const [activeRole, setActiveRole] = useState<StaffRole>('REGISTRAR');
    const [activeModule, setActiveModule] = useState('OVERVIEW');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const {selectedSchool:school,userPermissions} = useContext(uiContext);
    const {currentUser} = useContext(authContext);
    const  currentTerm = school.terms.find(t => t.is_current)
    const  currentSession = school.sessions.find(t => t.is_current)

    // Mock Name based on role
    const getStaffName = () => {
        return (
            currentUser? `${currentUser.title} ${currentUser.first_name} ${currentUser?.last_name} ${currentUser?.middle_name}` : 'Anonymous'
        )
    } ;

    const handleRoleChange = (role: StaffRole) => {
        setActiveRole(role);
        setActiveModule('OVERVIEW');
    };

    const renderModule = () => {
        if (activeModule === 'PROFILE') {
            return (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-2xl mx-auto mt-8 animate-fadeIn">
                    <h2 className="text-xl font-bold text-slate-900 mb-6">Staff Profile</h2>
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center text-3xl font-black shadow-inner">
                            {currentUser?.picture ? <img src={urls.BASE_URL + currentUser?.picture} alt="" className="w-full h-full object-cover"/>
                            : currentUser?.first_name[0]}
                        </div>
                        <div>
                            <Button variant="outline" size="sm" className="bg-white"><i className="fa-solid fa-camera mr-2"></i> Update Photo</Button>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                            <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900" disabled value={getStaffName()} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Assigned Role</label>
                            <input type="text" className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-900" disabled value={activeRole.replace('_', ' ')} />
                        </div>
                    </div>
                </div>
            );
        }

        switch (activeRole) {
            case 'REGISTRAR':
                return <RegistrarView activePage={activeModule} />;
            case 'ACCOUNTANT':
                return <AccountantView  activeTab={activeModule} setActiveTab={setActiveModule} />;
            case 'EXAM_OFFICER':
                return <ExamOfficerView />;
            default:
                return <div>Module Under Construction</div>;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            <StaffSidebar 
                activeRole={activeRole}
                activeModule={activeModule}
                onModuleChange={setActiveModule}
                onLogout={() => setIsLogoutConfirmOpen(true)}
                sidebarExpanded={sidebarExpanded}
                setSidebarExpanded={setSidebarExpanded}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
                staffName={getStaffName()}
            />

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setMobileMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
                            <i className="fa-solid fa-bars text-xl"></i>
                        </button>
                        <h1 className="font-black text-slate-900 tracking-tight">{school.name}</h1>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden md:flex h-20 bg-white border-b border-slate-100 items-center justify-between px-8 shrink-0 z-10 shadow-sm sticky top-0">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-black text-slate-900 tracking-tight">{school.name}</h1>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <div className="text-sm font-bold text-slate-500 uppercase tracking-widest">{activeModule.replace('_', ' ')}</div>
                        <div className="h-6 w-px bg-slate-200"></div>
                        <p className="text-sm text-gray-500 flex items-center gap-3 mt-1">
                            <span>
                                <i className="fa-solid fa-calendar mr-1"></i> {currentSession?.name}
                            </span>
                            <span>
                                <i className="fa-solid fa-flag mr-1"></i> {currentTerm?.name}
                            </span>
                        </p>
                    </div>

                    {/* Role Switcher for Demo Purposes */}
                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-inner">
                        <button 
                            onClick={() => handleRoleChange('REGISTRAR')} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeRole === 'REGISTRAR' ? 'bg-white text-sky-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Registrar
                        </button>
                        <button 
                            onClick={() => handleRoleChange('ACCOUNTANT')} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeRole === 'ACCOUNTANT' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Accountant
                        </button>
                        <button 
                            onClick={() => handleRoleChange('EXAM_OFFICER')} 
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${activeRole === 'EXAM_OFFICER' ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Exam Officer
                        </button>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto pb-20 md:pb-0">
                        {renderModule()}
                    </div>
                </div>
            </main>

            {/* Logout Modal */}
            <Modal isOpen={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} title="Sign Out" size="sm">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-3xl mx-auto mb-4 border border-red-100 shadow-sm">
                        <i className="fa-solid fa-power-off"></i>
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Sign Out</h3>
                    <p className="text-slate-500 mb-8 font-medium">Are you sure you want to end your current session?</p>
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button>
                        <Button className="flex-1 bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20" onClick={onLogout}>Sign Out</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
