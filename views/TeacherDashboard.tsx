import React, { useContext, useEffect, useState } from 'react';
import { School, UserRole, Teacher, ClassRoom, Subject, ResultBatch, ActivityLog } from '@/types';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

//  Updated to use root path aliases
import { Button, Modal, Paginator } from '@/components/UI';
import { TeacherAcademicManager } from '@/components/teachers/TeacherAcademics';
import { TeacherSettingsManager } from '@/components/teachers/TeacherSettings';
import { TeacherResultManager } from '@/components/teachers/TeacherResults';
import useRequest from '@/customHooks/RequestHook';


interface TeacherDashboardProps {
    onLogout: () => void;
}

type Module = 'OVERVIEW' | 'ACADEMICS' | 'RESULTS' | 'SETTINGS' | 'PROFILE';

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({onLogout }) => {
    const [activeModule, setActiveModule] = useState<Module>('OVERVIEW');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [sidebarExpanded, setSidebarExpanded] = useState(true);
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
    const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
    const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
    
    const navigate = useNavigate()
    
    const {selectedSchool,classRooms,subjects,activities,setActivities} = useContext(uiContext);
    const {currentUser} = useContext(authContext);
    const {sendRequest} = useRequest();

    const teacherName = `${currentUser?.first_name}  ${currentUser?.last_name} ${currentUser?.middle_name || ''}`

    const myClasses = classRooms

    // --- Navigation ---
    const navigation = [
        { id: 'OVERVIEW', icon: 'fa-solid fa-house', label: 'Dashboard' },
        { id: 'ACADEMICS', icon: 'fa-solid fa-book', label: 'Academics' },
        { id: 'RESULTS', icon: 'fa-solid fa-file-signature', label: 'Results' },
        { id: 'SETTINGS', icon: 'fa-solid fa-gear', label: 'Settings' },
        { id: 'PROFILE', icon: 'fa-solid fa-user', label: 'Profile' }
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
    return (
        <div className="flex h-screen bg-navy-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`fixed md:static inset-y-0 left-0 z-40 bg-indigo-900 text-white transition-all duration-300 ease-in-out ${sidebarExpanded ? 'w-64' : 'w-20'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col shadow-2xl md:shadow-none`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center shrink-0">
                            <i className="fa-solid fa-graduation-cap text-indigo-300"></i>
                        </div>
                        {sidebarExpanded && <span className="font-bold tracking-wider truncate">{currentUser?.role} Site</span>}
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
                                to={`/teacher/${item?.label?.toLowerCase()}/`}
                                key={item.id}
                                onClick={() => { setActiveModule(item.id as Module); setMobileMenuOpen(false); }}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden
                                    ${activeModule === item.id 
                                        ? 'bg-white/20 text-white shadow-inner' 
                                        : 'text-indigo-200 hover:bg-white/10 hover:text-white'}`}
                            >
                                {activeModule === item.id && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-400 rounded-r"></div>
                                )}
                                <div className="w-6 flex justify-center">
                                    <i className={`${item.icon} ${activeModule === item.id ? 'text-indigo-300' : ''}`}></i>
                                </div>
                                {sidebarExpanded && <span className="font-medium truncate text-sm">{item.label}</span>}
                                {!sidebarExpanded && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-indigo-950 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                                        {item.label}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="p-4 border-t border-white/10 shrink-0">
                    <div className="flex items-center gap-3 mb-4 overflow-hidden">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 text-indigo-300 font-bold uppercase border border-white/10">
                            {teacherName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        {sidebarExpanded && (
                            <div className="truncate">
                                <p className="text-sm font-bold text-white truncate">{teacherName}</p>
                                <p className="text-xs text-indigo-300">Teacher</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setIsLogoutConfirmOpen(true)} className={`w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500/20 text-red-200 rounded-lg hover:bg-red-500/30 transition-colors ${!sidebarExpanded && 'px-0'}`}>
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
                        <h1 className="font-bold text-navy-900">{selectedSchool.name}</h1>
                    </div>
                </header>

                {/* Desktop Header */}
                <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-8 shrink-0 z-10 shadow-sm">
                    <h1 className="text-xl font-black text-navy-900 uppercase tracking-wider">{navigation.find(n => n.id === activeModule)?.label}</h1>
                    <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsActivityLogOpen(true)}
                        className="p-2 text-gray-400 hover:text-navy-600 hover:bg-gray-50 rounded-full transition-colors relative"
                        title="System Activity Logs"
                        >
                            <i className="fa-solid fa-list-check text-xl"></i>
                    {activities?.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
                        <div className="px-4 py-1.5 bg-gray-100 rounded-full text-xs font-bold text-gray-600 flex items-center gap-2">
                            <i className="fa-solid fa-school text-navy-900"></i>
                            {selectedSchool.name}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative ">

                    <Routes> 
                        <Route path="/" element={<Navigate to="/teacher/overview/" replace />} />
                        <Route path='overview/' element =
                            {
                            <div className="space-y-6 animate-fadeIn">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <div>
                                        <h1 className="text-2xl font-black text-navy-900">Welcome, {teacherName}</h1>
                                        <p className="text-gray-500">Have a great day teaching at {selectedSchool.name}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-4">
                                            <i className="fa-solid fa-chalkboard-user"></i>
                                        </div>
                                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">My Classes</h3>
                                        <div className="text-3xl font-black text-navy-900 mt-1">{myClasses.length}</div>
                                    </div>

                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-xl mb-4">
                                            <i className="fa-solid fa-book-open"></i>
                                        </div>
                                        <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wider">My Subjects</h3>
                                        <div className="text-3xl font-black text-navy-900 mt-1">{subjects.length}</div>
                                    </div>
                                </div>
                            </div>
                            }
                        />
                        
                        
                        <Route path='academics/' element =
                            {<TeacherAcademicManager onNavigateToStudent={(id) => { setTargetStudentId(id); navigate('teacher/students/'); }} />}
                        />
                        <Route path='settings/' element =
                            {<TeacherSettingsManager />}
                        />
                       
                        <Route path='results/' element =
                            {<TeacherResultManager/>}
                        />
                        <Route path="*" element={<Navigate to="/teacher/overview/" replace />} />

                        {/*  Profile */} 
                        {/* <Route path='profile/' element =
                            {<DirectorProfile  />}
                        /> */}
                        {/* <Route path='finance/' element =
                            {<TeacherFinanceManager  />} 
                        /> */}

                    </Routes>

                </div>
            </main>
             {/* Activity Logs Slide-Over Drawer */}
                  <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isActivityLogOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={() => setIsActivityLogOpen(false)}></div>
                    <div className={`absolute inset-y-0 right-0 w-full max-w-md bg-gray-50 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col ${isActivityLogOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                      <div className="p-5 border-b border-gray-200 bg-white shadow-sm flex items-center justify-between">
                        <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                           <i className="fa-solid fa-list-check text-navy-500"></i> System Activity Logs
                        </h2>
                        <button onClick={() => setIsActivityLogOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                          <i className="fa-solid fa-xmark text-lg"></i>
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin scrollbar-thumb-gray-300 ">
                       
                          {activities.length === 0 ? (
                              <div className="text-center py-10 mt-10">
                                  <i className="fa-solid fa-clipboard-list text-5xl text-gray-200 mb-4 block"></i>
                                  <p className="text-navy-900 font-bold">No Recent Activity</p>
                                  <p className="text-gray-500 text-sm mt-1">Actions performed in the system will appear here.</p>
                              </div>
                          ) : (
                              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gray-200">
                                {/* Pagination - Floating UI */}
                                <Paginator 
                                  currentLength={activities?.length}
                                  setData={setActivities}
                                  filteredData={activities}
                                  schoolId = {selectedSchool?.id}
                                  url={`/school/userlogs/${selectedSchool?.id}/`}
                                  sendRequest={sendRequest}
                                /> 
                                {activities.map((log: ActivityLog, index: number) => {
                                    const getActionColor = (action: string) => {
                                        switch(action) {
                                            case 'CREATE': return 'bg-green-100 text-green-600 border-green-200';
                                            case 'UPDATE': return 'bg-blue-100 text-blue-600 border-blue-200';
                                            case 'DELETE': return 'bg-red-100 text-red-600 border-red-200';
                                            case 'SUSPEND': return 'bg-orange-100 text-orange-600 border-orange-200';
                                            case 'LOGIN': return 'bg-purple-100 text-purple-600 border-purple-200';
                                            case 'PAYMENT': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
                                            default: return 'bg-gray-100 text-gray-600 border-gray-200';
                                        }
                                    };
                                    const getActionIcon = (action: string) => {
                                        switch(action) {
                                            case 'CREATE': return 'fa-plus';
                                            case 'UPDATE': return 'fa-pen';
                                            case 'DELETE': return 'fa-trash';
                                            case 'SUSPEND': return 'fa-ban';
                                            case 'LOGIN': return 'fa-sign-in-alt';
                                            case 'PAYMENT': return 'fa-money-bill-wave';
                                            default: return 'fa-bolt';
                                        }
                                    };
                                    
                                    return (
                                       <div key={log.id} className="relative flex items-start gap-4">
                                            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-gray-50 z-10 shrink-0 ${getActionColor(log.action).replace(' border-', ' ')}`}>
                                                <i className={`fa-solid ${getActionIcon(log.action)} text-sm`}></i>
                                            </div>
                                            <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                               <div className="flex justify-between items-start mb-2">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getActionColor(log.action)}`}>
                                                            {log.action}
                                                        </span>
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{log.module}</span>
                                                    </div>
                                                    <div className="text-right whitespace-nowrap">
                                                        <span className="text-[10px] text-gray-400 font-medium block">
                                                            {new Date(log?.created_at).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 font-medium block">
                                                            {new Date(log?.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                               </div>
                                               <p className="text-sm text-gray-600 mt-1 leading-snug">{log.description}</p>
                                               {log.user && (
                                                   <div className="mt-3 flex items-center justify-between border-t border-gray-50 pt-2">
                                                       <div className="flex items-center gap-1.5 text-[11px] text-navy-400 font-medium">
                                                           <i className="fa-solid fa-user-circle"></i> {log.userName}
                                                       </div>
                                                   </div>
                                               )}
                                            </div>
                                       </div>
                                    );
                                })}
                              </div>
                          )}
                      </div>
                    </div>
                  </div>
            

            {/* Logout Modal */}
            <Modal isOpen={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} title="Confirm Logout" size="sm">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center text-3xl mx-auto mb-4">
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </div>
                    <h3 className="text-xl font-bold text-navy-900 mb-2">Ready to Leave?</h3>
                    <p className="text-gray-500 mb-8">Are you sure you want to log out?</p>
                    <div className="flex gap-4">
                        <Button variant="outline" className="flex-1" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button>
                        <Button className="flex-1 bg-red-500 hover:bg-red-600" onClick={onLogout}>Logout</Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};
