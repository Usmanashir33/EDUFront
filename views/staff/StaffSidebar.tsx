import { authContext } from '@/customContexts/AuthContext';
import urls from '@/customHooks/ServerUrls';
import React, { useContext } from 'react';

export type StaffRole = 'REGISTRAR' | 'ACCOUNTANT' | 'EXAM_OFFICER';

export interface StaffSidebarProps {
    activeRole: StaffRole;
    activeModule: string;
    onModuleChange: (module: string) => void;
    onLogout: () => void;
    sidebarExpanded: boolean;
    setSidebarExpanded: (expanded: boolean) => void;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
    staffName: string;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
    activeRole,
    activeModule,
    onModuleChange,
    onLogout,
    sidebarExpanded,
    setSidebarExpanded,
    mobileMenuOpen,
    setMobileMenuOpen,
    staffName
}) => {
    const { currentUser, userPermissions } = useContext(authContext);
const getNavItems = () => {
    switch (activeRole) {
        case 'REGISTRAR': {
            const baseNavs = [
                { id: 'OVERVIEW', icon: 'fa-solid fa-chart-pie', label: 'Overview' },
            ];

            const potentialTabs = [
                { 
                    id: 'TEACHERS', 
                    icon: 'fa-solid fa-users', 
                    label: 'Teachers Directory',
                    requiredPermissions: ['can_view_teachers', 'can_manage_teachers'] 
                },
                { 
                    id: 'ACADEMICS', 
                    icon: 'fa-solid fa-book-open', 
                    label: 'Academic Activities',
                    requiredPermissions: ['can_manage_academics', 'can_view_academics']
                },
                { 
                    id: 'PROFILE', 
                    icon: 'fa-solid fa-id-badge', 
                    label: 'My Profile',
                    requiredPermissions: [] 
                }
            ];

            const allowedTabs = potentialTabs.filter(tab => {
                if (!tab.requiredPermissions || tab.requiredPermissions.length === 0) return true;
                return tab.requiredPermissions.some(perm => userPermissions.includes(perm));
            });

            return [...baseNavs, ...allowedTabs];
        }

        case 'ACCOUNTANT': {
            const baseNavs = [
                { id: 'OVERVIEW', icon: 'fa-solid fa-chart-pie', label: 'Finance Overview' ,
                    // requiredPermissions: ['can_manage_finance']
                },

            ];

            const potentialTabs = [
                { 
                    id:"PAYMENT_VALIDATION",  label:"Validations" , icon:"fa-solid fa-check-double",
                    requiredPermissions: ['can_manage_payments']
                },
                
                { 
                    id:"PAYMENT", label:"Payment", icon:"fa-solid fa-credit-card",
                    requiredPermissions: ['can_manage_payments']
                },
                { 
                    id:"SEARCH", label:"Search Payment", icon:"fa-solid fa-search" ,
                    requiredPermissions: ['can_manage_finance']
                },
                
                { 
                    id: 'PROFILE', 
                    icon: 'fa-solid fa-id-badge', 
                    label: 'My Profile',
                    requiredPermissions: [] 
                }
            ];

            const allowedTabs = potentialTabs.filter(tab => {
                if (!tab.requiredPermissions || tab.requiredPermissions.length === 0) return true;
                return tab.requiredPermissions.some(perm => userPermissions.includes(perm));
            });

            return [...baseNavs, ...allowedTabs];
        }

        default: { // Exam Officer / Academic Coordinator defaults
            const baseNavs = [
                { id: 'OVERVIEW', icon: 'fa-solid fa-chart-pie', label: 'Exams Overview' },
            ];

            const potentialTabs = [
                { 
                    id: 'RESULTS', 
                    icon: 'fa-solid fa-file-signature', 
                    label: 'Results Processing',
                    requiredPermissions: ['can_process_results', 'can_manage_results']
                },
                { 
                    id: 'TRANSCRIPTS', 
                    icon: 'fa-solid fa-scroll', 
                    label: 'Transcripts',
                    requiredPermissions: ['can_view_transcripts', 'can_manage_results']
                },
                { 
                    id: 'PROFILE', 
                    icon: 'fa-solid fa-id-badge', 
                    label: 'My Profile',
                    requiredPermissions: [] 
                }
            ];

            const allowedTabs = potentialTabs.filter(tab => {
                if (!tab.requiredPermissions || tab.requiredPermissions.length === 0) return true;
                return tab.requiredPermissions.some(perm => userPermissions.includes(perm));
            });

            return [...baseNavs, ...allowedTabs];
        }
    }
};

    const navigation = getNavItems();

    // Visual theme mapping based on role
    const getRoleTheme = () => {
        switch (activeRole) {
            case 'REGISTRAR': return 'from-slate-900 to-slate-800 text-slate-100';
            case 'ACCOUNTANT': return 'from-emerald-950 to-emerald-900 text-emerald-100';
            default: return 'from-indigo-950 to-indigo-900 text-indigo-100';
        }
    };

    const getRoleAccent = () => {
        switch (activeRole) {
            case 'REGISTRAR': return 'bg-sky-500 text-sky-500';
            case 'ACCOUNTANT': return 'bg-emerald-500 text-emerald-500';
            default : return 'bg-indigo-500 text-indigo-500';
        }
    };

    const getRoleTitle = () => {
        switch (activeRole) {
            case 'REGISTRAR': return 'Registrar';
            case 'ACCOUNTANT': return 'Accountant';
            default : return 'Exam Officer';
        }
    };

    return (
        <aside className={`fixed md:static inset-y-0 left-0 z-40 bg-gradient-to-b ${getRoleTheme()} transition-all duration-300 ease-in-out ${sidebarExpanded ? 'w-72' : 'w-20'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col shadow-2xl md:shadow-none border-r border-white/10`}>
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-5 border-b border-white/10 shrink-0">
                <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
                        <i className="fa-solid fa-building-columns text-white/90"></i>
                    </div>
                    {sidebarExpanded && (
                        <div className="flex flex-col">
                            <span className="font-black tracking-widest uppercase text-sm text-white/90">Staff Portal</span>
                            <span className="text-[10px] font-medium text-white/50 uppercase tracking-widest">{getRoleTitle()}</span>
                        </div>
                    )}
                </div>
                <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-white/10 shrink-0 transition-colors">
                    <i className={`fa-solid fa-align-${sidebarExpanded ? 'left' : 'right'} text-sm opacity-70`}></i>
                </button>
                <button onClick={() => setMobileMenuOpen(false)} className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors">
                    <i className="fa-solid fa-xmark text-xl opacity-70"></i>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-6 px-3 custom-scrollbar">
                {sidebarExpanded && (
                    <div className="px-3 mb-4 text-xs font-bold text-white/40 uppercase tracking-wider">
                        Menu
                    </div>
                )}
                <nav className="space-y-2">
                    {navigation.map(item => {
                        const isActive = activeModule === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => { onModuleChange(item.id); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all group relative overflow-hidden
                                    ${isActive 
                                        ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20' 
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
                            >
                                {isActive && (
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-full ${getRoleAccent().split(' ')[0]}`}></div>
                                )}
                                <div className="w-6 flex justify-center shrink-0">
                                    <i className={`${item.icon} text-lg ${isActive ? getRoleAccent().split(' ')[1] : 'opacity-80'}`}></i>
                                </div>
                                {sidebarExpanded && <span className={`font-semibold truncate text-sm ${isActive ? 'tracking-wide' : ''}`}>{item.label}</span>}
                                {!sidebarExpanded && (
                                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Footer Profile */}
            <div className="p-5 border-t border-white/10 shrink-0 bg-black/10">
                <div className="flex items-center gap-4 mb-5 overflow-hidden">
                    <div className="w-12 h-12 rounded-xl  bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center shrink-0 text-white font-black text-lg border border-white/20 shadow-inner">
                              {currentUser?.picture ? <img src={urls.BASE_URL + currentUser?.picture} alt="" className="w-full h-full object-cover rounded-xl"/>
                            : currentUser?.first_name[0]}
                    </div>
                    {sidebarExpanded && (
                        <div className="truncate">
                            <p className="text-sm font-bold text-white truncate">{staffName}</p>
                            <p className="text-xs text-white/60 mt-0.5">{getRoleTitle()}</p>
                        </div>
                    )}
                </div>
                <button onClick={onLogout} className={`w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-all border border-red-500/20 ${!sidebarExpanded && 'px-0'}`}>
                    <i className="fa-solid fa-power-off"></i>
                    {sidebarExpanded && <span className="font-bold text-sm">Sign Out</span>}
                </button>
            </div>
        </aside>
    );
};
