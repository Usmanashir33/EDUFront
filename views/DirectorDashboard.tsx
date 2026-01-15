
import React, { useState, useEffect } from 'react';
import { School, Student, Teacher, Staff, ClassRoom, SchoolSection, Subject, Director, UserRole, ActivityLog } from '../types';
import { Button, Modal, Input, ImageUpload, Toast, ImageViewer } from '../components/UI';
import { StudentManager } from './StudentManager';
import { AcademicManager } from './AcademicManager';
import { TeacherManager } from './TeacherManager';
import { SettingsManager } from './SettingsManager';
import { FinanceManager } from './FinanceManager';
import { StaffManager } from './StaffManager';

interface DashboardProps {
  school: School;
  userRole: UserRole;
  onLogout: () => void;
}

type Module = 'OVERVIEW' | 'STUDENTS' | 'TEACHERS' | 'STAFF' | 'ACADEMICS' | 'FINANCE' | 'SETTINGS' | 'PROFILE' | 'MY_CLASSES' | 'MY_SUBJECTS';

export const Dashboard: React.FC<DashboardProps> = ({ school, userRole, onLogout }) => {
  const [activeModule, setActiveModule] = useState<Module>('OVERVIEW');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // --- DATA INITIALIZATION ---
  // Using Mock Data directly inside Dashboard to simulate "DB" state across modules
  const [sections, setSections] = useState<SchoolSection[]>([{ id: 'sec1', name: 'Junior Secondary' }, { id: 'sec2', name: 'Senior Secondary' }]);
  const [classRooms, setClassRooms] = useState<ClassRoom[]>([{ id: 'c1', name: 'JSS 1 A', sectionId: 'sec1' }, { id: 'c2', name: 'JSS 1 B', sectionId: 'sec1' }, { id: 'c3', name: 'SSS 1 Science', sectionId: 'sec2' }]);
  const [subjects, setSubjects] = useState<Subject[]>([{ id: 'sub1', name: 'General Math', code: 'MTH101', classRoomIds: ['c1', 'c2'], teacherIds: ['t1'] }, { id: 'sub2', name: 'Physics', code: 'PHY101', classRoomIds: ['c3'], teacherIds: [] }, { id: 'sub3', name: 'English Lang', code: 'ENG101', classRoomIds: ['c1', 'c2', 'c3'], teacherIds: ['t1'] }]);
  
  const [students, setStudents] = useState<Student[]>([
    { id: '1', firstName: 'Emily', lastName: 'Clarke', middleName: 'Rose', email: 'emily@edu.com', gender: 'Female', status: 'Active', admissionNumber: 'ADM-001', joinedAt: '2024-01-15T10:00:00Z', classRoomIds: ['c1'], picture: '', nin: '', guardian: { fullName: 'Mrs. Sarah Clarke', relationship: 'Mother', phone: '08012345678', email: 'sarah.c@gmail.com', address: '42 Pine Avenue, Springfield', altPhone: '08099991111' }, academicHistory: [] },
    { id: '2', firstName: 'Michael', lastName: 'Ojo', middleName: 'D', email: 'mike@edu.com', gender: 'Male', status: 'Active', admissionNumber: 'ADM-002', joinedAt: '2024-01-20T10:00:00Z', classRoomIds: ['c3'], picture: '', nin: '', guardian: { fullName: 'Mr. David Ojo', relationship: 'Father', phone: '08098765432', address: '10 Riverside Drive, Lagos' }, academicHistory: [] }
  ]);

  const [teachers, setTeachers] = useState<Teacher[]>([
      { id: 't1', firstName: 'Robert', lastName: 'Langdon', email: 'rob@edu.com', phone: '000-111', gender: 'Male', title: 'Prof.', staffId: 'STAFF-001', sectionIds: ['sec2'], joinedAt: '2023-09-01', picture: '', nin: '', salary: '120000', status: 'Active', paymentHistory: [{ id: 'p1', date: '2023-10-25', amount: '120000', status: 'Paid', month: 'October', transactionRef: 'TXN-001' }] }
  ]);

  const [staff, setStaff] = useState<Staff[]>([
    { id: 's1', firstName: 'John', lastName: 'Smith', email: 'john.smith@school.edu', phone: '08011122233', role: 'Security Head', department: 'Security', gender: 'Male', staffId: 'STF-001', status: 'Active', joinedAt: '2023-01-15', salary: '85000', address: '12 Guard Post', picture: '', nin: '' }
  ]);

  // Activity Logs
  const [activities, setActivities] = useState<ActivityLog[]>([
      { id: '1', action: 'LOGIN', module: 'SETTINGS', description: 'User logged in.', timestamp: Date.now() - 10000, user: 'System' }
  ]);

  // --- CURRENT USER CONTEXT ---
  // Simulate finding the current user based on role
  const currentUser = React.useMemo(() => {
      if (userRole === 'director') return { id: 'd1', name: 'Dr. John Doe', title: 'Director', picture: '' };
      if (userRole === 'student') {
          const s = students.find(s => s.id === '1'); // Mock: Logged in as Emily
          return s ? { id: s.id, name: `${s.firstName} ${s.lastName}`, title: 'Student', picture: s.picture } : { id: '0', name: 'Unknown', title: 'Student' };
      }
      if (userRole === 'teacher') {
          const t = teachers.find(t => t.id === 't1'); // Mock: Logged in as Robert
          return t ? { id: t.id, name: `${t.title} ${t.firstName} ${t.lastName}`, title: 'Teacher', picture: t.picture } : { id: '0', name: 'Unknown', title: 'Teacher' };
      }
      return { id: '0', name: 'User', title: 'Guest' };
  }, [userRole, students, teachers]);

  const logActivity = (action: ActivityLog['action'], module: ActivityLog['module'], description: string) => {
      setActivities([{ id: Date.now().toString(), action, module, description, timestamp: Date.now(), user: currentUser.name }, ...activities]);
  };

  // --- NAVIGATION ---
  const navigation = React.useMemo(() => {
      const items = [];
      
      // Dashboard (All)
      items.push({ id: 'OVERVIEW', icon: 'fa-solid fa-house', label: 'Dashboard' });

      if (userRole === 'director') {
          items.push(
              { id: 'STUDENTS', icon: 'fa-solid fa-user-graduate', label: 'Students' },
              { id: 'TEACHERS', icon: 'fa-solid fa-chalkboard-user', label: 'Teachers' },
              { id: 'STAFF', icon: 'fa-solid fa-id-card', label: 'Staff' },
              { id: 'ACADEMICS', icon: 'fa-solid fa-book-open', label: 'Academics' },
              { id: 'FINANCE', icon: 'fa-solid fa-wallet', label: 'Finance' },
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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {[
                        { label: 'Students', val: students.length, icon: 'fa-user-graduate', color: 'text-blue-600', bg: 'bg-blue-100', mod: 'STUDENTS' },
                        { label: 'Teachers', val: teachers.length, icon: 'fa-chalkboard-user', color: 'text-purple-600', bg: 'bg-purple-100', mod: 'TEACHERS' },
                        { label: 'Staff', val: staff.length, icon: 'fa-id-card', color: 'text-pink-600', bg: 'bg-pink-100', mod: 'STAFF' },
                        { label: 'Classes', val: classRooms.length, icon: 'fa-chalkboard', color: 'text-orange-600', bg: 'bg-orange-100', mod: 'ACADEMICS' },
                    ].map((s, i) => (
                        <div key={i} onClick={() => setActiveModule(s.mod as Module)} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-all group">
                            <div><p className="text-sm font-medium text-gray-500">{s.label}</p><h3 className="text-2xl font-bold text-navy-900 mt-1">{s.val}</h3></div>
                            <div className={`w-12 h-12 rounded-lg ${s.bg} ${s.color} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}><i className={`fa-solid ${s.icon}`}></i></div>
                        </div>
                    ))}
                </div>
                <div className="bg-gradient-to-r from-navy-900 to-navy-800 text-white rounded-xl shadow-lg p-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-2xl font-bold mb-2">Welcome, Director</h3>
                        <p className="text-navy-100">School operations are running smoothly. You have {students.length} active students and {teachers.length} teachers.</p>
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
                              <h2 className="text-3xl font-bold mb-2">Hello, {currentUser.name.split(' ')[0]}! 👋</h2>
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
                              {currentUser.picture ? <img src={currentUser.picture} className="w-full h-full rounded-full object-cover"/> : <i className="fa-solid fa-chalkboard-user"></i>}
                          </div>
                          <div>
                              <h2 className="text-xl font-bold text-navy-900">Prof. {currentUser.name.split(' ')[2]}</h2>
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

  // --- TEACHER: MY CLASSES ---
  const TeacherClassesView = () => {
      // Filter classes where this teacher is assigned (Mocked for ID 't1')
      const teacherId = 't1';
      const myClasses = classRooms.filter(c => 
          subjects.some(s => s.teacherIds.includes(teacherId) && s.classRoomIds.includes(c.id))
      );

      return (
          <div className="space-y-6 animate-fadeIn">
              <div className="flex justify-between items-center mb-4">
                  <div>
                      <h2 className="text-2xl font-bold text-navy-900">My Classes</h2>
                      <p className="text-sm text-gray-500">Manage students and grading for your subjects.</p>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myClasses.map(c => (
                      <div key={c.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all group">
                          <div className="bg-navy-900 p-4 flex justify-between items-center">
                              <h3 className="text-white font-bold text-lg">{c.name}</h3>
                              <span className="text-xs bg-white/20 text-white px-2 py-1 rounded">2 Subjects</span>
                          </div>
                          <div className="p-6">
                              <div className="flex justify-between text-sm text-gray-600 mb-4">
                                  <span><i className="fa-solid fa-users mr-2"></i> {students.filter(s => s.classRoomIds.includes(c.id)).length} Students</span>
                              </div>
                              <div className="space-y-2">
                                  {subjects.filter(s => s.teacherIds.includes(teacherId) && s.classRoomIds.includes(c.id)).map(sub => (
                                      <div key={sub.id} className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100">
                                          <span className="text-sm font-bold text-navy-800">{sub.name}</span>
                                          <button onClick={() => setToast({message: `Opened grading for ${sub.name}`, type: 'info'})} className="text-xs text-blue-600 hover:underline">Grade</button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                          <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                              <button className="w-full text-center text-sm font-bold text-navy-700 hover:text-navy-900">View Student List</button>
                          </div>
                      </div>
                  ))}
                  {myClasses.length === 0 && <div className="col-span-3 text-center py-12 text-gray-400">No classes assigned yet.</div>}
              </div>
          </div>
      );
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
                    {school.image ? <img src={school.image} className="w-10 h-10 object-cover rounded-lg border-2 border-white/20" /> : <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center text-navy-900 shrink-0"><i className="fa-solid fa-graduation-cap text-lg"></i></div>}
                    <span className="font-bold text-sm tracking-wide leading-tight line-clamp-2 text-left">{school.name}</span>
                </div>
            ) : (
                <div className="w-10 h-10 rounded-lg bg-gold-500 flex items-center justify-center text-navy-900 text-xl font-bold cursor-pointer" title={school.name}><i className="fa-solid fa-graduation-cap"></i></div>
            )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {navigation.map((item) => (
                 <button key={item.id} onClick={() => { setActiveModule(item.id as Module); setMobileMenuOpen(false); }} className={`w-full flex items-center rounded-lg transition-all duration-200 group relative mb-1 ${sidebarExpanded ? 'px-4 py-3' : 'justify-center py-3 px-2'} ${activeModule === item.id ? 'bg-navy-800 text-white shadow-lg' : 'text-navy-300 hover:bg-white/10 hover:text-white'}`} title={!sidebarExpanded ? item.label : ''}>
                    {activeModule === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gold-500 rounded-r-md"></div>}
                    <i className={`${item.icon} text-lg transition-colors ${sidebarExpanded ? 'mr-3' : ''} ${activeModule === item.id ? 'text-gold-500' : 'text-navy-400 group-hover:text-white'}`}></i>
                    {(sidebarExpanded || mobileMenuOpen) && <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>}
                </button>
            ))}
        </nav>

        <div className="p-4 border-t border-navy-800 flex flex-col gap-2">
             <button onClick={() => setSidebarExpanded(!sidebarExpanded)} className="hidden lg:flex items-center justify-center p-2 rounded-md hover:bg-navy-800 text-navy-300 hover:text-white transition-colors">
                <i className={`fa-solid ${sidebarExpanded ? 'fa-angles-left' : 'fa-angles-right'} text-lg`}></i>
             </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-navy-50">
        <header className="h-20 shadow-sm border-b bg-white border-gray-200 flex items-center justify-between px-4 md:px-8 z-10">
            <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 -ml-2 rounded-md text-gray-500 hover:bg-gray-100" onClick={() => setMobileMenuOpen(true)}><i className="fa-solid fa-bars text-xl"></i></button>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-navy-900">{activeModule === 'OVERVIEW' ? school.name : activeModule.replace('_', ' ')}</h2>
            </div>
            <div className="flex items-center gap-3 md:gap-6">
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-bold text-navy-900">{currentUser.name}</p>
                        <p className="text-xs text-gray-500">{currentUser.title}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center font-bold bg-navy-100 text-navy-600">{currentUser.picture ? <img src={currentUser.picture} className="w-full h-full object-cover" /> : <span>{currentUser.name.charAt(0)}</span>}</div>
                </div>
                <div className="h-8 w-px hidden md:block bg-gray-200"></div>
                <button onClick={() => setIsLogoutConfirmOpen(true)} className="text-gray-400 hover:text-red-600 transition-colors"><i className="fa-solid fa-arrow-right-from-bracket text-lg"></i></button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
            {activeModule === 'OVERVIEW' && <RenderOverview />}
            
            {/* Director Modules */}
            {userRole === 'director' && activeModule === 'STUDENTS' && <StudentManager students={students} onUpdateStudents={setStudents} classRooms={classRooms} subjects={subjects} initialStudentId={targetStudentId} onClearInitial={() => setTargetStudentId(null)} />}
            {userRole === 'director' && activeModule === 'TEACHERS' && <TeacherManager teachers={teachers} sections={sections} classRooms={classRooms} subjects={subjects} onUpdateTeachers={setTeachers} onLogActivity={logActivity} />}
            {userRole === 'director' && activeModule === 'STAFF' && <StaffManager staff={staff} onUpdateStaff={setStaff} onLogActivity={logActivity} />}
            {userRole === 'director' && activeModule === 'ACADEMICS' && <AcademicManager sections={sections} classRooms={classRooms} subjects={subjects} students={students} teachers={teachers} onUpdateSections={setSections} onUpdateClassRooms={setClassRooms} onUpdateSubjects={setSubjects} onUpdateStudents={setStudents} onLogActivity={logActivity} onNavigateToStudent={(id) => { setTargetStudentId(id); setActiveModule('STUDENTS'); }} />}
            {userRole === 'director' && activeModule === 'SETTINGS' && <SettingsManager onLogActivity={logActivity} teachers={teachers} sections={sections} subjects={subjects} />}
            {userRole === 'director' && activeModule === 'FINANCE' && <FinanceManager students={students} teachers={teachers} staff={staff} />}

            {/* Teacher Modules */}
            {userRole === 'teacher' && activeModule === 'MY_CLASSES' && <TeacherClassesView />}
            {userRole === 'teacher' && activeModule === 'ACADEMICS' && <AcademicManager sections={sections} classRooms={classRooms} subjects={subjects} students={students} teachers={teachers} onUpdateSections={()=>{}} onUpdateClassRooms={()=>{}} onUpdateSubjects={()=>{}} onUpdateStudents={()=>{}} onLogActivity={logActivity} />}
            {userRole === 'teacher' && activeModule === 'FINANCE' && <FinanceManager students={students} teachers={teachers} staff={staff} personalMode={true} currentUserId={currentUser.id} currentUserRole="teacher" />}

            {/* Student Modules */}
            {userRole === 'student' && activeModule === 'ACADEMICS' && <AcademicManager sections={sections} classRooms={classRooms} subjects={subjects} students={students} teachers={teachers} onUpdateSections={()=>{}} onUpdateClassRooms={()=>{}} onUpdateSubjects={()=>{}} onUpdateStudents={()=>{}} onLogActivity={logActivity} />}
            {userRole === 'student' && activeModule === 'FINANCE' && <FinanceManager students={students} teachers={teachers} staff={staff} personalMode={true} currentUserId={currentUser.id} currentUserRole="student" />}

            {activeModule === 'PROFILE' && <div className="p-8 bg-white rounded-xl border border-gray-200 text-center"><h2 className="text-xl font-bold mb-2">My Profile</h2><p className="text-gray-500">Profile management is currently active in the modal view.</p></div>}
        </main>
      </div>

      <Modal isOpen={isLogoutConfirmOpen} onClose={() => setIsLogoutConfirmOpen(false)} title="Confirm Logout" icon="fa-solid fa-arrow-right-from-bracket">
        <div className="text-center"><p className="text-gray-600 mb-6">Are you sure you want to end your current session?</p><div className="flex gap-4 justify-center"><Button variant="outline" className="w-auto px-6" onClick={() => setIsLogoutConfirmOpen(false)}>Cancel</Button><Button variant="danger" className="w-auto px-6" onClick={onLogout}>Yes, Logout</Button></div></div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
