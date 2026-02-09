
import React, { useState, useEffect, useRef ,useContext } from 'react';
import { Student, ClassRoom, Subject, AcademicRecord } from '../types';
import { Input, Button, FadeIn, MultiSelectDropdown, PinModal, Toast, ImageUpload, ImageViewer } from '../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import { StudentDetail } from '../components/students/StudentDetail';
import { StudentForm } from '../components/students/StudentForm';
import urls from '@/customHooks/ServerUrls';
import { authContext } from '@/customContexts/AuthContext';

interface StudentManagerProps {
  students: Student[];
  classRooms: ClassRoom[];
  subjects: Subject[];
  initialStudentId?: string | null;
  onClearInitial?: () => void;
}

type ViewMode = 'LIST' | 'DETAIL' | 'ADD' | 'EDIT';
type DetailTab = 'OVERVIEW' | 'ACADEMIC' | 'GUARDIAN' | 'ADMIN';
type TermViewTab = 'REPORT' | 'ANALYSIS' | 'RECORDS';



export const StudentManager: React.FC<StudentManagerProps> = ({initialStudentId, onClearInitial }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  let [serverForm,setServerForm]= useState(new FormData()) // form to handle server data 
  const {sendRequest} = useRequest()
  const {
          students,setStudents, // students data
          teachers, setTeachers ,// teachers data
          staff, setStaff, // staff data
          sections, setSections, // sections data 
          classRooms, setClassRooms, // classRooms data
          subjects, setSubjects, // subjects data
      } = useContext(uiContext)
  const {currentUser} = useContext(authContext)
  const [pageStudents,setPageStudents] = useState(students)
  // Handle Deep Link / Initial Selection
  useEffect(() => {
      if (initialStudentId) {
          const exists = students.find(s => s.id === initialStudentId);
          if (exists) {
              setSelectedStudentId(initialStudentId);
              setViewMode('DETAIL');
          }
          if (onClearInitial) onClearInitial();
      }
  }, [initialStudentId, students, onClearInitial]);

  // List Filters
  const [search, setSearch] = useState('');
  const [filterClassIds, setFilterClassIds] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');

  // Security & Notification State
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'SUSPEND' | 'DELETE', payload?: any } | null>(null);
  const {toast, setToast,selectedSchool} = useContext(uiContext);
//   this is react function
  const TriggeredFunc = (data:any) => {
    console.log('data: ', data);
    if (data?.success){
      if (viewMode === "ADD"){
        setShowPinModal(false);
        setStudents ([data?.new_student,...students]);
        setViewMode('LIST');
        setToast({ message: "New student registered.", type: 'success' });
      }else if (viewMode === "EDIT"){
        setStudents(students.map(x => x.id === selectedStudentId ? data?.updated_student : x));
        setViewMode('DETAIL');
        setToast({ message: "Student updated.", type: 'success' });
      }
    }

  }
  const handleApiCall = (data:any) => {
    
    let form = new FormData() 
    // Only include id if updating
    form.append("first_name", data.firstName);
    form.append("last_name", data.lastName);
    form.append("middle_name", data.middleName || "");
    form.append("email", data.email);
    form.append("gender", data.gender.toLowerCase() );
    form.append("school", selectedSchool?.id);
    form.append("date_of_birth", data.dateOfBirth);

    // Image file only if selected
    // form.append("picture", data.picture);
    if (data.picture instanceof File) {
      form.append("picture", data.picture);
    }
    // Parent phone from guardian
    let guardian = data.guardian
    form.append("guardian", JSON.stringify({
      full_name : guardian?.fullName,
      email : guardian?.email,
      phone  : guardian?.phone ,
      relation_ship : guardian?.relationship,
      address : guardian?.address,
    })); // making the dictionary stringify 
    
    // ManyToMany → append each classroom id
    data?.classRoomIds?.forEach((id:string) => {
      form.append("class_room", id);
    })
    setServerForm(form)  // initialize the server form 
    
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
        if (viewMode === "ADD") { 
          sendRequest("/director/add-student/","POST",serverForm,TriggeredFunc,true,true)
        }
        if (viewMode === "EDIT") {
          sendRequest(`/director/update-student/${selectedStudentId}/`,"PUT",serverForm,TriggeredFunc,true,true)
        }
        return 
    }
    setShowPinModal(true)
    
  }

  // --- HANDLE PIN SUCCESS ---
  const handlePinSuccess = (pins:string) => {
    serverForm.append("pin", pins );
    setShowPinModal(false); 

    // Make the api call here  when pin is not needed by the user 
    if (viewMode === "ADD") { 
      sendRequest("/director/add-student/","POST",serverForm,TriggeredFunc,true,true)
    }
    if (viewMode === "EDIT") {
      console.log('serverForm: ', serverForm);
      sendRequest(`/director/update-student/${selectedStudentId}/`,"PUT",serverForm,TriggeredFunc,true,true)
    }

    if (!pendingAction) return;

//     if (pendingAction.type === 'SUSPEND' && selectedStudentId) {
//             const currentStudent = students.find(s => s.id === selectedStudentId);
//             const newStatus: Student['status'] = currentStudent?.status === 'Suspended' ? 'Active' : 'Suspended';
//             const updated = students.map(st => st.id === selectedStudentId ? { ...st, status: newStatus } : st);
//             setStudents(updated);
//             setToast({ message: `Student status updated to ${newStatus}`, type: 'success' });
//     } else if (pendingAction.type === 'DELETE' && selectedStudentId) {
//             const updated = students.filter(st => st.id !== selectedStudentId);
//             setStudents(updated);
//             setViewMode('LIST');
//             setSelectedStudentId(null);
//             setToast({ message: "Student record deleted successfully.", type: 'success' });
//     }
//     setPendingAction(null);
  };

  // --- MAIN LIST RENDER ---
  const activeCount = students.filter(s => s?.user?.is_active === true).length;
  const InActiveCount = students.filter(s => s?.user.is_active === false).length;
  const filteredStudents = students.filter(s => {
      let status = (filterStatus == "Active") ? true :false
      const matchSearch = (s.first_name + s.last_name + s.admission_number).toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || s.user.is_active === status ;
      const matchClass = filterClassIds.length === 0 || s.class_room.some(cid => filterClassIds.includes(cid));
      return matchSearch && matchStatus && matchClass;
  });

  if (viewMode === 'ADD') {
    return <>
             <PinModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPendingAction(null); }} onSuccess={handlePinSuccess} title={'Confirm Action'} />
             <StudentForm onSubmit={(data) => {handleApiCall(data)}} onCancel={() => setViewMode('LIST')} />
            </>
    }

  if (viewMode === 'EDIT' && selectedStudentId) {
    const s = students.find(x => x.id === selectedStudentId);
    return <>
            <PinModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPendingAction(null); }} onSuccess={handlePinSuccess} title={'Confirm Action'} />
            <StudentForm initialData={s} onSubmit={(data) => {handleApiCall(data)}} onCancel={() => setViewMode('DETAIL')} />
        </> 
  }

  return (
    <div className="animate-fadeIn space-y-6 relative ">
         {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

         {viewMode === 'DETAIL' && selectedStudentId ? (
              <>
                 <StudentDetail id={selectedStudentId} setViewMode ={setViewMode} />
              </>
         ) : (
            <>
                 {/* List View Controls & Table (Existing Implementation) */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">Total Students</p><h3 className="text-2xl font-bold text-navy-900">{students.length}</h3></div> 
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">Active</p><h3 className="text-2xl font-bold text-green-600">{activeCount}</h3></div>
                     <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"><p className="text-xs text-gray-500 font-bold uppercase">In Active</p><h3 className="text-2xl font-bold text-red-600">{InActiveCount}</h3></div>
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-1 gap-4 w-full">
                        <div className="relative flex-1 max-w-sm"><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i><input type="text" placeholder="Search by name, ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-navy-500" /></div>
                        <select className="border border-gray-300 rounded-md px-3 py-2 bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}><option value="All">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
                    </div>
                    <Button className="w-auto px-4" onClick={() => setViewMode('ADD')}><i className="fa-solid fa-plus mr-2"></i> Register Student</Button>
                 </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"><h4 className="text-xs font-bold text-navy-900 uppercase mb-3">Filter by Classes</h4><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">{classRooms.map(c => (<div key={c.id} onClick={() => { if (filterClassIds.includes(c.id)) setFilterClassIds(filterClassIds.filter(id => id !== c.id)); else setFilterClassIds([...filterClassIds, c.id]); }} className={`cursor-pointer px-3 py-2 rounded border text-xs font-semibold text-center transition-all ${filterClassIds.includes(c.id) ? 'bg-navy-800 text-white border-navy-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-navy-300'}`}>{c.name}</div>))}</div></div>
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Profile</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Admission</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Classes</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Parent Phone</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {filteredStudents.map(student => (<tr key={student.id} onClick={() => { setSelectedStudentId(student.id); setViewMode('DETAIL'); }} className="hover:bg-blue-50 cursor-pointer transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-xs mr-3 overflow-hidden">
                            {student.picture ? <img src={urls.BASE_URL + student.picture} alt="" className="w-full h-full object-cover"/>
                           : student.first_name[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-navy-900">{student.first_name} {student.last_name}</div>
                          <div className="text-xs text-gray-500">{student.email}
                            </div>
                          </div> 
                          </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{student.admission_number}
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-navy-800 font-medium">
                            {student.class_room.length > 0 ? student.class_room.length > 1 ? `${student.class_room.length} Classes`
                           : classRooms.find(c => c.id === student.class_room[0])?.name || 'Unknown' : 
                            <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{student.guardian?.phone || 'N/A'}
                            </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${(student?.user.is_active === true) ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700' }`}>
                            {(student?.user.is_active === true) ? "Active" : "Inactive"}
                            </span>
                          </td>
                          </tr>))}{filteredStudents.length === 0 && 
                          (<tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No students found matching filters.</td>
                          </tr>)}
                          </tbody>
                          </table>
                          </div>
            </>
         )}
    </div>
  );
};
