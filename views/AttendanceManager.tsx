import React, { useState, useMemo } from 'react';
import { Student, Teacher, Staff, AttendanceRecord, AttendanceStatus } from '../types';
import { Button, Input, Select, Toast, PinModal, Modal } from '../components/UI';

interface AttendanceManagerProps {
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  attendanceRecords: AttendanceRecord[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  // onLogActivity: (action: string, module: string, description: string) => void;
  onLogActivity: (action: any, module: any, desc: string) => void;
}

type TabType = 'teacher' | 'staff' | 'student';

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  students,
  teachers,
  staff,
  attendanceRecords,
  onUpdateAttendance,
  onLogActivity ,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('teacher');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | AttendanceStatus | 'Unmarked'>('All');

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
  const [timeInput, setTimeInput] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Get users based on active tab
  const activeUsers = useMemo(() => { 
    if (activeTab === 'teacher') return teachers.map(t => ({ id: t.id, name: `${t.first_name} ${t.last_name}`, type: 'teacher' as const }));
    if (activeTab === 'staff') return staff.map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}`, type: 'staff' as const }));
    return students.map(s => ({ id: s.id, name: `${s.first_name} ${s.last_name}`, type: 'student' as const }));
  }, [activeTab, teachers, staff, students]);

  // Get attendance for current date and tab
  const currentAttendance = useMemo(() => {
    return attendanceRecords.filter(r => r.date === selectedDate && r.userType === activeTab);
  }, [attendanceRecords, selectedDate, activeTab]);

  // Calculate analysis
  const analysis = useMemo(() => {
    const total = activeUsers.length;
    const present = currentAttendance.filter(r => r.status === 'Present').length;
    const absent = currentAttendance.filter(r => r.status === 'Absent').length;
    const late = currentAttendance.filter(r => r.status === 'Late').length;
    const early = currentAttendance.filter(r => r.status === 'Early').length;
    const unmarked = total - (present + absent + late + early);

    return { total, present, absent, late, early, unmarked };
  }, [activeUsers, currentAttendance]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(activeUsers.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectUser = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleSetTimeClick = (userIds: string[]) => {
    if (userIds.length === 0) {
      setToast({ message: 'Please select at least one person.', type: 'error' });
      return;
    }
    setTargetUserIds(userIds);
    
    // Set default time to current time
    const now = new Date();
    setTimeInput(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    
    setIsTimeModalOpen(true);
  };

  const handleTimeSubmit = () => {
    setIsTimeModalOpen(false);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    
    let status: AttendanceStatus = 'Present';
    if (!timeInput) {
      status = 'Absent';
    } else {
      const [hours, minutes] = timeInput.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      // Early: before 7:45 (465 mins)
      // Present: 7:45 to 8:15 (495 mins)
      // Late: after 8:15
      if (timeInMinutes < 465) {
        status = 'Early';
      } else if (timeInMinutes <= 495) {
        status = 'Present';
      } else {
        status = 'Late';
      }
    }

    const newRecords = [...attendanceRecords];
    
    targetUserIds.forEach(id => {
      const existingIndex = newRecords.findIndex(r => r.userId === id && r.date === selectedDate && r.userType === activeTab);
      
      const record: AttendanceRecord = {
        id: existingIndex >= 0 ? newRecords[existingIndex].id : Date.now().toString() + Math.random().toString(36).substr(2, 9),
        userId: id,
        userType: activeTab,
        date: selectedDate,
        status: status,
        checkInTime: status !== 'Absent' ? timeInput : undefined,
        mode: 'Manual (Director)'
      };

      if (existingIndex >= 0) {
        newRecords[existingIndex] = record;
      } else {
        newRecords.push(record);
      }
    });

    onUpdateAttendance(newRecords);
    setSelectedIds([]);
    setToast({ message: `Successfully marked ${targetUserIds.length} as ${status}.`, type: 'success' });
    onLogActivity('UPDATE', 'ATTENDANCE', `Set time in for ${targetUserIds.length} ${activeTab}s on ${selectedDate}`);
  };

  const getStatusForUser = (userId: string): AttendanceStatus | 'Unmarked' => {
    const record = currentAttendance.find(r => r.userId === userId);
    return record ? record.status : 'Unmarked';
  };

  const getStatusColor = (status: AttendanceStatus | 'Unmarked') => {
    switch (status) {
      case 'Present': return 'bg-green-100 text-green-800';
      case 'Absent': return 'bg-red-100 text-red-800';
      case 'Late': return 'bg-yellow-100 text-yellow-800';
      case 'Early': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredUsers = activeUsers.filter(user => {
    const status = getStatusForUser(user.id);
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Attendance Management</h2>
          <p className="text-gray-500 text-sm mt-1">Track and manage daily attendance</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-navy-900">{formattedDate}</p>
            <p className="text-xs text-gray-500">Attendance Date</p>
          </div>
          <Input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="w-40"
          />
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-full sm:w-fit">
          {(['teacher', 'staff', 'student'] as TabType[]).map((tab) => {
            const icons = { teacher: 'fa-chalkboard-user', staff: 'fa-id-card', student: 'fa-user-graduate' };
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelectedIds([]); setStatusFilter('All'); setSearchQuery(''); }}
                className={`px-6 py-2.5 rounded-md text-sm font-medium capitalize transition-all flex items-center gap-2 ${
                  activeTab === tab 
                    ? 'bg-white text-navy-900 shadow-sm' 
                    : 'text-gray-500 hover:text-navy-700 hover:bg-gray-200'
                }`}
              >
                <i className={`fa-solid ${icons[tab]}`}></i>
                {tab}s
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text" 
              placeholder={`Search ${activeTab}s...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
            />
          </div>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-48 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Late">Late</option>
            <option value="Early">Early</option>
            <option value="Unmarked">Unmarked</option>
          </select>
        </div>
      </div>

      {/* Analysis Section */} 
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase">Total</p>
          <p className="text-2xl font-bold text-navy-900">{analysis.total}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl shadow-sm border border-green-100 text-center">
          <p className="text-xs font-bold text-green-600 uppercase">Present</p>
          <p className="text-2xl font-bold text-green-700">{analysis.present}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl shadow-sm border border-red-100 text-center">
          <p className="text-xs font-bold text-red-600 uppercase">Absent</p>
          <p className="text-2xl font-bold text-red-700">{analysis.absent}</p>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl shadow-sm border border-yellow-100 text-center">
          <p className="text-xs font-bold text-yellow-600 uppercase">Late</p>
          <p className="text-2xl font-bold text-yellow-700">{analysis.late}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl shadow-sm border border-orange-100 text-center">
          <p className="text-xs font-bold text-orange-600 uppercase">Early</p>
          <p className="text-2xl font-bold text-orange-700">{analysis.early}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-xs font-bold text-gray-500 uppercase">Unmarked</p>
          <p className="text-2xl font-bold text-gray-700">{analysis.unmarked}</p>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-navy-50 p-4 rounded-xl border border-navy-100 flex items-center justify-between animate-fadeIn">
          <span className="text-navy-800 font-medium">{selectedIds.length} selected</span>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white text-navy-700 border-navy-200 hover:bg-navy-50 flex items-center gap-2" onClick={() => handleSetTimeClick(selectedIds)}><i className="fa-solid fa-clock"></i> Set Time In</Button>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 w-12 text-center">
                  <input 
                    title ='Select All'
                    type="checkbox" 
                    className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                    checked={selectedIds.length === activeUsers.length && activeUsers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="p-4 font-semibold text-gray-600">Name</th>
                <th className="p-4 font-semibold text-gray-600">Time In</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600">Mode</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No {activeTab}s found matching the criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const status = getStatusForUser(user.id);
                  const record = currentAttendance.find(r => r.userId === user.id);
                  const timeIn = record?.checkInTime || '--:--';
                  const isSelected = selectedIds.includes(user.id);
                  
                  return (
                    <tr key={user.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-navy-50/50' : ''}`}>
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                          checked={isSelected}
                          onChange={() => handleSelectUser(user.id)}
                        />
                      </td>
                      <td className="p-4 font-medium text-navy-900">{user.name}</td>
                      <td className="p-4 text-sm text-gray-600 font-mono">{timeIn}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusColor(status)}`}>
                          {status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {record?.mode || 'Manual (Director)'}
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => handleSetTimeClick([user.id])} className="text-xs font-bold text-navy-600 hover:text-navy-800 bg-navy-50 px-3 py-1.5 rounded inline-flex items-center gap-1"><i className="fa-solid fa-clock"></i> Set Time</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Authorize Time Entry"
      />

      <Modal isOpen={isTimeModalOpen} onClose={() => setIsTimeModalOpen(false)} title="Set Time In" icon="fa-solid fa-clock">
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-bold text-navy-900">{formattedDate}</p>
          </div>
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm flex gap-3 items-start">
            <i className="fa-solid fa-circle-info mt-0.5"></i>
            <p>
              Enter the arrival time for the selected {activeTab}(s). <br/>
              <strong>Tip:</strong> Click the absent icon or clear the time to mark them as Absent.
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center py-4">
            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Time In</label>
            <div className="flex items-center gap-3">
              <input 
                  type="time" 
                  autoFocus
                  placeholder="HH:MM"
                  value={timeInput} 
                  onChange={(e) => setTimeInput(e.target.value)} 
                  className="text-5xl font-mono text-center text-navy-900 bg-gray-50 border-2 border-gray-200 rounded-2xl p-4 w-full max-w-xs focus:border-navy-500 focus:ring-4 focus:ring-navy-500/20 transition-all outline-none shadow-inner"
                />
              <button 
                onClick={() => setTimeInput('')} 
                className="p-4 bg-red-50 text-red-600 rounded-2xl border-2 border-red-100 hover:bg-red-100 hover:border-red-200 transition-all flex flex-col items-center justify-center gap-1"
                title="Mark Absent"
              >
                <i className="fa-solid fa-user-xmark text-2xl"></i>
                <span className="text-[10px] font-bold uppercase">Absent</span>
              </button>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsTimeModalOpen(false)}>Cancel</Button>
            <Button onClick={handleTimeSubmit} className="flex items-center gap-2">
              <i className="fa-solid fa-shield-halved"></i> Save & Authorize
            </Button>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
