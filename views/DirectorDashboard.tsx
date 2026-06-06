
import React, { useState, useEffect,useContext, useMemo } from 'react';
import { School, Student, Teacher, Staff, ClassRoom, SchoolSection, Subject, Director, UserRole, ActivityLog, AttendanceRecord ,BiometricIdentity} from '../types';

import { Button, Modal, Input, ImageUpload, Toast, ImageViewer, Paginator } from '../components/UI';
import { StudentManager } from './StudentManager';
import { AcademicManager } from './AcademicManager';
import { TeacherManager } from './TeacherManager';
import { SettingsManager } from './SettingsManager';
import { FinanceManager } from './FinanceManager';
import { StaffManager } from './StaffManager';
import { ResultManager } from './ResultManager';
import { AttendanceManager } from './AttendanceManager';
import { DeviceManager } from './DeviceManager';
import { IdentityManager } from './IdentityManager';


import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import urls from '@/customHooks/ServerUrls';
import { DirectorProfile } from '../components/director/DirectorProfile';
import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import useRequest from '@/customHooks/RequestHook';


interface DashboardProps {
//   school: School;
  userRole: UserRole;
  onLogout: () => void;
}

type Module = 'OVERVIEW' | 'STUDENTS' | 'TEACHERS' | 'STAFFS' | 'ACADEMICS' | 'RESULTS' | 'FINANCE' | 'SETTINGS' | 'PROFILE' | 'MY_CLASSES' | 'MY_SUBJECTS' | 'ATTENDANCE' | 'DEVICES' | 'IDENTITY';

export const Dashboard: React.FC<DashboardProps> = ({userRole, onLogout }) => {
const {selectedSchool:school} = useContext(uiContext)
  const [activeModule, setActiveModule] = useState<Module>('OVERVIEW');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isActivityLogOpen, setIsActivityLogOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const {selectedSchool} = useContext(uiContext) 
  const {currentUser,currentUserFullname} = useContext(authContext) ;
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [identities, setIdentities] = useState<BiometricIdentity[]>([]);
const {sendRequest} = useRequest() ;


  // --- DATA INITIALIZATION ---
    const {
        students,setStudents, // students data
        teachers, setTeachers ,// teachers data
        staffs:staff, setStaff, // staff data
        sections, setSections, // sections data
        classRooms, setClassRooms, // classRooms data
        subjects, setSubjects, // subjects data
        activities, setActivities// activity logs 
    } = useContext(uiContext)
    const navigate = useNavigate()

    const isActiveTabDispaly = () => {
        const lastParam = location.pathname.split("/").filter(Boolean).pop()?.toUpperCase()
        return lastParam
    }
    const isActiveTab = useMemo(() => {
        const lastParam = location.pathname.split("/").filter(Boolean).pop()?.toUpperCase()
        return lastParam
    },[activeModule])

  
  // --- NAVIGATION ---
  const navigation = React.useMemo(() => {
      const items:any = [];
      
      // Dashboard (All)
      items.push({ id: 'OVERVIEW', icon: 'fa-solid fa-house', label: 'Dashboard' });

      if (userRole === 'director') {
          items.push(
              { id: 'STUDENTS', icon: 'fa-solid fa-user-graduate', label: 'Students' },
              { id: 'TEACHERS', icon: 'fa-solid fa-chalkboard-user', label: 'Teachers' },
              { id: 'STAFFS', icon: 'fa-solid fa-id-card', label: 'Staff' },
              { id: 'ACADEMICS', icon: 'fa-solid fa-book-open', label: 'Academics' },
              { id: 'FINANCE', icon: 'fa-solid fa-wallet', label: 'Finance' },
              { id: 'RESULTS', icon: 'fa-solid fa-file-signature', label: 'Results' }, // NEW TAB
            
              { id: 'ATTENDANCE', icon: 'fa-solid fa-calendar-check', label: 'Attendance' },
              { id: 'DEVICES', icon: 'fa-solid fa-microchip', label: 'Devices' },
              { id: 'IDENTITY', icon: 'fa-solid fa-fingerprint', label: 'Identity Hub' },
              
              { id: 'SETTINGS', icon: 'fa-solid fa-sliders', label: 'Settings' }
          );
      } else if (userRole === 'teacher') { 
          items.push(
              { id: 'MY_CLASSES', icon: 'fa-solid fa-chalkboard-user', label: 'My Classes' },
              { id: 'ACADEMICS', icon: 'fa-solid fa-calendar-days', label: 'Timetable' },
              { id: 'FINANCE', icon: 'fa-solid fa-money-bill-wave', label: 'My Salary' }
          );
      } else if (userRole === 'student') {
          items.push(
              { id: 'ACADEMICS', icon: 'fa-solid fa-book-open', label: 'Academics' },
              { id: 'FINANCE', icon: 'fa-solid fa-file-invoice', label: 'My Fees' }
          );
      }
      return items;
  }, [userRole]);

  // --- RENDERERS ---

  const RenderOverview = () => {

      if (userRole === 'director') {
          return (
            <div className="space-y-8 animate-fadeIn">
                {/* Director Dashbord  */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { label: 'Students', val: selectedSchool?.total_students?.count, icon: 'fa-user-graduate', color: 'text-blue-600', bg: 'bg-blue-100', mod: 'STUDENTS' },
                        { label: 'Teachers', val: selectedSchool?.total_teachers?.count, icon: 'fa-chalkboard-user', color: 'text-purple-600', bg: 'bg-purple-100', mod: 'TEACHERS' },
                        { label: 'Staffs', val: selectedSchool?.total_staffs?.count, icon: 'fa-id-card', color: 'text-pink-600', bg: 'bg-pink-100', mod: 'STAFFS' },
                        { label: 'Classes', val: selectedSchool?.total_classrooms, icon: 'fa-chalkboard', color: 'text-orange-600', bg: 'bg-orange-100', mod: 'ACADEMICS' },
                        // { label: 'Parents', val: selectedSchool?.total_parents, icon: 'fa-chalkboard', color: 'text-orange-600', bg: 'bg-orange-100', mod: 'PARENTS' },
                    ].map((s, i) => (
                        <Link  to={`/director/${s?.mod?.toLowerCase()}/`} key={i} onClick={() => {setActiveModule(s.mod as Module)}} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group">
                            <div><p className="text-sm font-medium text-gray-500">{s.label}</p><h3 className="text-2xl font-bold text-navy-900 mt-1">{s.val}</h3></div>
                            <div className={`w-12 h-12 rounded-lg ${s.bg} ${s.color} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}><i className={`fa-solid ${s.icon}`}></i></div>
                        </Link>
                    ))}
                    
                </div>
                <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-xl shadow-lg p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Welcome, Director</h3>
                        <p className="text-navy-100">School operations are running smoothly. You have {selectedSchool?.total_students?.count} active students and {selectedSchool?.total_teachers?.count} teachers.</p>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                </div>
            </div>
          );
      } 
      
      if (userRole === 'student') {
          return (
              <div className="space-y-6 animate-fadeIn">
                  <div className="bg-gradient-to-br from-blue-600 to-navy-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div>
                              <h2 className="text-3xl font-bold mb-2">Hello, {currentUserFullname()}! 👋</h2>
                              <p className="text-blue-100">"Education is the passport to the future."</p>
                              <div className="mt-6 flex gap-3">
                                  <Button variant="secondary" className="w-auto px-6 text-sm" onClick={() => setActiveModule('ACADEMICS')}>View Timetable</Button>
                                  <Button className="w-auto px-6 text-sm bg-white/20 hover:bg-white/30 border-none" onClick={() => setActiveModule('FINANCE')}>Check Fees</Button>
                              </div>
                          </div>
                          {/* Next Class Widget */}
                          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl w-full md:w-64 text-center">
                              <p className="text-xs text-blue-200 uppercase font-bold mb-1">Next Class Starts In</p>
                              <div className="text-4xl font-bold font-mono my-2">00:45</div>
                              <p className="text-sm font-semibold">Mathematics <span className="text-xs opacity-75">• Room 301</span></p>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                          <h3 className="font-bold text-navy-900 mb-4 flex items-center"><i className="fa-solid fa-chart-pie mr-2 text-gold-500"></i> Attendance</h3>
                          <div className="flex items-center justify-center py-4">
                              <div className="relative w-32 h-32">
                                  <svg className="w-full h-full" viewBox="0 0 36 36">
                                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#eee" strokeWidth="3" />
                                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4ade80" strokeWidth="3" strokeDasharray="92, 100" />
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <span className="text-2xl font-bold text-navy-900">92%</span>
                                      <span className="text-[10px] text-gray-500 uppercase">Present</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm md:col-span-2">
                          <div className="flex justify-between items-center mb-4">
                              <h3 className="font-bold text-navy-900"><i className="fa-solid fa-list-check mr-2 text-blue-500"></i> Pending Assignments</h3>
                              <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">2 Due Soon</span>
                          </div>
                          <div className="space-y-3">
                              {[{ sub: 'Physics', title: 'Lab Report: Motion', due: 'Tomorrow, 9 AM' }, { sub: 'English', title: 'Essay on Macbeth', due: 'Fri, 23 Oct' }].map((a, i) => (
                                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100">
                                      <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded bg-white flex items-center justify-center text-navy-600 font-bold text-xs border border-gray-200">{a.sub.slice(0,3)}</div>
                                          <div><p className="text-sm font-bold text-navy-900">{a.title}</p><p className="text-xs text-gray-500">{a.sub}</p></div>
                                      </div>
                                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">{a.due}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          );
      }

      if (userRole === 'teacher') {
          return (
              <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col md:flex-row gap-6">
                      {/* Teacher Profile Card */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex-1 flex items-center gap-6">
                          <div className="w-20 h-20 bg-navy-100 rounded-full flex items-center justify-center text-3xl text-navy-600">
                              {currentUser?.picture ? <img src={currentUser.picture} alt='Profile' className="w-full h-full rounded-full object-cover"/> : <i className="fa-solid fa-chalkboard-user"></i>}
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-navy-900">{currentUserFullname()}</h2>
                              <p className="text-sm text-gray-500">Senior Lecturer • Mathematics Dept</p>
                              <div className="flex gap-2 mt-3">
                                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">On Duty</span>
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">ID: TEA-001</span>
                              </div>
                          </div>
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="flex-1 grid grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                              <p className="text-xs text-blue-500 font-bold uppercase">Classes Today</p>
                              <h3 className="text-2xl font-bold text-navy-900 mt-1">4</h3>
                          </div>
                          <div className="bg-gold-50 p-4 rounded-xl border border-gold-100">
                              <p className="text-xs text-gold-600 font-bold uppercase">Pending Grading</p>
                              <h3 className="text-2xl font-bold text-navy-900 mt-1">12</h3>
                          </div>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Today's Schedule */}
                      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bold text-navy-900">Today's Schedule</h3>
                              <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
                          </div>
                          <div className="space-y-4">
                              {[{ time: '08:00 - 08:45', class: 'JSS 1 A', sub: 'Mathematics', status: 'Done' }, { time: '09:30 - 10:15', class: 'SSS 1 Science', sub: 'Physics', status: 'Ongoing' }, { time: '12:30 - 13:15', class: 'JSS 2 B', sub: 'Mathematics', status: 'Upcoming' }].map((s, i) => (
                                  <div key={i} className={`flex items-center p-4 rounded-lg border-l-4 ${s.status === 'Ongoing' ? 'bg-navy-50 border-navy-900' : 'bg-white border-gray-200 shadow-sm'}`}>
                                      <div className="w-24 shrink-0 font-mono text-xs font-bold text-gray-500">{s.time}</div>
                                      <div className="flex-1 px-4">
                                          <h4 className="font-bold text-navy-900">{s.sub}</h4>
                                          <p className="text-xs text-gray-500">{s.class}</p>
                                      </div>
                                      <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${s.status === 'Ongoing' ? 'bg-green-100 text-green-700' : s.status === 'Done' ? 'bg-gray-100 text-gray-500' : 'bg-gold-100 text-gold-700'}`}>{s.status}</span>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Notifications */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                          <h3 className="font-bold text-navy-900 mb-4">Notice Board</h3>
                          <ul className="space-y-3">
                              <li className="text-sm text-gray-600 border-b border-gray-50 pb-2"><span className="text-xs text-red-500 font-bold block mb-1">Important</span>Staff meeting scheduled for Friday at 2 PM.</li>
                              <li className="text-sm text-gray-600 border-b border-gray-50 pb-2"><span className="text-xs text-blue-500 font-bold block mb-1">Academic</span>Submit mid-term questions by Wednesday.</li>
                          </ul>
                      </div>
                  </div>
              </div>
          );
      }

      return null;
  };

  return (
    <div className={`flex h-screen overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-navy-50'}`}>
      
      {/* MOBILE BACKDROP */}
      {mobileMenuOpen && <div className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* SIDEBAR */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 bg-navy-900 text-white shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} ${sidebarExpanded ? 'lg:w-64' : 'lg:w-20'} w-64 flex flex-col border-r border-navy-800`}>
        <div className={`h-20 flex items-center justify-center border-b border-navy-800 shrink-0 transition-all duration-300 ${sidebarExpanded ? 'px-4' : 'px-2'}`}>
            {sidebarExpanded || mobileMenuOpen ? (
                <div className="flex items-center gap-3 animate-fadeIn w-full overflow-hidden">
                    {school.image ? <img src={school.image} alt={school.name} className="w-10 h-10 object-cover rounded-lg border-2 border-white/20" /> : <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center text-navy-900 shrink-0"><i className="fa-solid fa-graduation-cap text-lg"></i></div>}
                    <span className="font-bold text-sm tracking-wide leading-tight line-clamp-2 text-left">{school.name}</span>
                </div>
            ) : (
                <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center text-navy-900 text-xl font-bold cursor-pointer" title={school.name}><i className="fa-solid fa-graduation-cap"></i></div>
            )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navigation.map((item : any ) => (
            <Link to={`director/${item?.id.toLowerCase()}/`} key={item.id} onClick={() => {setActiveModule(item.id as Module); setMobileMenuOpen(false); }} className={`w-full flex items-center rounded-lg transition-all duration-200 group relative mb-1 ${sidebarExpanded ? 'px-4 py-3' : 'justify-center py-3 px-2'} ${isActiveTab === item.id ? 'bg-navy-800 text-white shadow-lg' : 'text-navy-300 hover:bg-white/10 hover:text-white'}`} title={!sidebarExpanded ? item.label : ''}>
                    {isActiveTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold-500 rounded-r-md"></div>}
                    <i className={`${item.icon} text-lg transition-colors ${sidebarExpanded ? 'mr-3' : ''} ${isActiveTab === item?.id ? 'text-gold-500' : 'text-navy-400 group-hover:text-white'}`}></i>
                    {(sidebarExpanded || mobileMenuOpen) && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                </Link>
            ))}
            {userRole === 'director' && (
                <button onClick={() => { setActiveModule('PROFILE'); setMobileMenuOpen(false); }} className={`w-full flex items-center rounded-lg transition-all duration-200 group relative mb-1 ${sidebarExpanded ? 'px-4 py-3' : 'justify-center py-3 px-2'} ${activeModule === 'PROFILE' ? 'bg-navy-800 text-white shadow-lg' : 'text-navy-300 hover:bg-white/10 hover:text-white'}`} title={!sidebarExpanded ? 'My Profile' : ''}>
                    {activeModule === 'PROFILE' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold-500 rounded-r-md"></div>}
                    <i className={`fa-solid fa-user-circle text-lg transition-colors ${sidebarExpanded ? 'mr-3' : ''} ${activeModule === 'PROFILE' ? 'text-gold-500' : 'text-navy-400 group-hover:text-white'}`}></i>
                    {(sidebarExpanded || mobileMenuOpen) && <span className="font-medium text-sm whitespace-nowrap">My Profile</span>}
                </button>
            )}
        </nav>

        <div className="p-4 border-t border-navy-800 flex flex-col gap-2">
             <button onClick={() => setSidebarExpanded(!sidebarExpanded)} title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'} className="hidden lg:flex items-center justify-center p-2 rounded-md hover:bg-navy-800 text-navy-300 hover:text-white transition-colors">
                <i className={`fa-solid ${sidebarExpanded ? 'fa-angles-left' : 'fa-angles-right'} text-lg`}></i>
             </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-navy-50">
        <header className="h-20 shadow-sm border-b bg-white border-gray-200 flex items-center justify-between px-4 md:px-8 z-10">
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100" title="Open menu" onClick={() => setMobileMenuOpen(true)}><i className="fa-solid fa-bars text-xl"></i></button>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-navy-900">{isActiveTabDispaly() === 'OVERVIEW' ? school.name : isActiveTabDispaly()?.replace('_', ' ')}</h2>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
                <button 
                  onClick={() => setIsActivityLogOpen(true)}
                  className="p-2 text-gray-400 hover:text-navy-600 hover:bg-gray-50 rounded-full transition-colors relative"
                  title="System Activity Logs"
                >
                    <i className="fa-solid fa-list-check text-xl"></i>
                    {activities.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
                </button>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-navy-900">{currentUserFullname()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center font-bold bg-navy-100 text-navy-600">
                        {currentUser.picture ? <img src={urls.BASE_URL+currentUser.picture} alt="Profile" className="w-full h-full object-cover" /> : <span>{currentUser.name.charAt(0)}</span>}
                    </div>
                </div>
                <div className="h-8 w-px hidden md:block bg-gray-200"></div>
                <button onClick={() => setIsLogoutConfirmOpen(true)} className="text-gray-400 hover:text-red-600 transition-colors" title="Logout">
                    <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
                </button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative ">
            
            {/* Director Modules */}
            {/* {userRole === 'director' && activeModule === 'STUDENTS' && <StudentManager students={students} onUpdateStudents={setStudents} classRooms={classRooms} subjects={subjects} initialStudentId={targetStudentId} onClearInitial={() => setTargetStudentId(null)} />} */}

            <Routes>
                <Route path="/" element={<Navigate to="/director/overview/" replace />} />
                <Route path='director/overview/' element =
                    {<RenderOverview />}
                />
                <Route path='director/students/' element =
                    {<StudentManager initialStudentId={targetStudentId} onClearInitial={() => setTargetStudentId(null)} />}
                />
                <Route path='director/identity/' element =
                    { <IdentityManager students={students} teachers={teachers} staff={staff} identities={identities} onUpdateIdentities={setIdentities}/>}
                />
                <Route path='director/devices/' element =
                    {<DeviceManager devices={devices} onUpdateDevices={setDevices}/>}
                />
                <Route path='director/teachers/' element =
                    {<TeacherManager onUpdateTeachers={setTeachers}/>}
                />
                <Route path='director/staffs/' element =
                    {<StaffManager staff={staff}/>}
                />
                <Route path='director/academics/' element =
                    {<AcademicManager onNavigateToStudent={(id) => { setTargetStudentId(id); navigate('director/students/'); }} />}
                />
                <Route path='director/settings/' element =
                    {<SettingsManager />}
                />
                <Route path='director/finance/' element =
                    {<FinanceManager  />}
                />
                <Route path='director/attendance/' element =
                    {<AttendanceManager students={students} teachers={teachers} staff={staff} attendanceRecords={attendanceRecords} onUpdateAttendance={setAttendanceRecords} />}
                />
                <Route path='director/results/' element =
                    {<ResultManager classes={classRooms} subjects={subjects} teachers={teachers} students={students} />}
                />
                {/* Director Profile */}
                <Route path='director/profile/' element =
                    {<DirectorProfile  />}
                />
                <Route path="*" element={<Navigate to="/director/overview/" replace />} />

            </Routes>

            {/* Teacher Modules */}
            {/* {userRole === 'teacher' && activeModule === 'MY_CLASSES' && <TeacherClassesView />} */}
            {userRole === 'teacher' && activeModule === 'ACADEMICS' && <AcademicManager sections={sections} classRooms={classRooms} subjects={subjects} students={students} teachers={teachers} onUpdateSections={()=>{}} onUpdateClassRooms={()=>{}} onUpdateSubjects={()=>{}} onUpdateStudents={()=>{}} />}
            {userRole === 'teacher' && activeModule === 'FINANCE'   && <FinanceManager students={students} teachers={teachers} staff={staff} personalMode={true} currentUserId={currentUser.id} currentUserRole="teacher" />}

            {/* Student Modules */}
            {userRole === 'student' && activeModule === 'ACADEMICS' && <AcademicManager  onUpdateSections={()=>{}} onUpdateClassRooms={()=>{}} onUpdateSubjects={()=>{}} onUpdateStudents={()=>{}}  />}
            {userRole === 'student' && activeModule === 'FINANCE'   && <FinanceManager  personalMode={true} currentUserId={currentUser.id} currentUserRole="student" />}

            {/* {activeModule === 'PROFILE' && <div className="p-8 bg-white rounded-xl border border-gray-200 text-center"><h2 className="text-xl font-bold mb-2">My Profile</h2><p className="text-gray-500">Profile management is currently active in the modal view.</p></div>} */}
        </main>
      </div>

      <Modal isOpen={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} title="Confirm Logout" icon="fa-solid fa-arrow-right-from-bracket">
        <div className="text-center"><p className="text-gray-600 mb-6">Are you sure you want to end your current session?</p><div className="flex gap-4 justify-center"><Button variant="outline" className="w-auto px-6" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button><Button variant="danger" className="w-auto px-6" onClick={onLogout}>Yes, Logout</Button></div></div>
      </Modal>

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
                                  data={activities}
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


      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
