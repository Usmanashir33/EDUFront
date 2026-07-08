import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button, Paginator, PinModal } from '../../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import urls from '@/customHooks/ServerUrls';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import { StudentForm } from '@/components/students/StudentForm';
import { StudentDetail } from '@/components/students/StudentDetail';
import { TeacherAcademicManager } from '@/components/teachers/TeacherAcademics';
import { AcademicManager } from '../AcademicManager';
import { TeacherManager } from '../TeacherManager';
type ViewMode = 'LIST' | 'DETAIL' | 'ADD' | 'EDIT';
interface RegistererProps {
    activePage :any ;
}

export const RegistrarView: React.FC<RegistererProps> = ({activePage}) => {
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [student,setStudent] = useState<any | null>(null);
    let [serverForm,setServerForm]= useState(new FormData()) // form to handle server data 
    let [admForm,setAdmForm] = useState({school:'',pin:''})
    const {sendRequest} = useRequest()
    const {
              students,setStudents, // students data
              classRooms,// classRooms data
          } = useContext(uiContext) ;
      const {currentUser,userPermissions} = useContext(authContext) ;
    //   console.log('userPermissions: ', userPermissions);
      
      // List Filters
      const [search, setSearch] = useState('');
      const [filterClassIds, setFilterClassIds] = useState<string[]>([]);
      const [filterStatus, setFilterStatus] = useState<'All' | 'Active' | 'Inactive'>('All');
    
      // Security & Notification State
      const [showPinModal, setShowPinModal] = useState(false);
      const [pendingAction, setPendingAction] = useState<{ type: 'SUSPEND' | 'DELETE', payload?: any } | null>(null);
      const {setToast,selectedSchool,setSelectedSchool} = useContext(uiContext);
    //   this is react function
    
      const TriggeredFunc = (data:any) => {
          if (data?.success === "searchResults"){
            // only students not already in the list of the students 
            let searched = data?.results.filter((res) => students.find(s => s.id !== res.id))
            setStudents((prev) => [...searched,...prev])
            return;
          }
          setToast({ message: data?.success, type: 'success' });
          if (data?.new_student){
            let n = data?.new_student
            let status = n?.is_active
            setShowPinModal(false);
            setStudents ([n,...students]);
            setViewMode('LIST');
            setSelectedSchool(prev => {
                  return {...prev,
                  total_students :{
                    count : prev?.total_students?.count + 1 ,
                    active :status ? prev?.total_students?.active + 1 : prev?.total_students?.active  ,
                    inactive : !status ? prev?.total_students?.inactive + 1 : prev?.total_students?.inactive ,
                  }}
          })
    
          }else if (data?.updated_student){
            let u = data?.updated_student
    
            setStudents(students.map(x => x.id === u?.id ? {...x,...u} : x));
            if (student) setStudent(prev => ({...prev,...u}))
            setViewMode('DETAIL');
          
          
          }else if (data?.sus_student) {
                let u = data?.sus_student
                let status = u?.is_active
                const updated = students.map(st => st.id ===  u?.id ? {...st,is_active:u?.is_active} : st);
                setStudents(updated);
                if (student) setStudent(s => ({...s,is_active:u?.is_active}))
                setSelectedSchool(prev => {
                  return {...prev,
                  total_students :{
                    ...prev?.total_students ,
                    active :status ? prev?.total_students?.active + 1 : prev?.total_students?.active - 1 ,
                    inactive : !status ? prev?.total_students?.inactive + 1 : prev?.total_students?.inactive - 1 ,
                  }}
                  
                })
          }else if (data?.del_student) {
                let d = data?.del_student
                const updated = students.filter(st => st.id !== d?.id);
                setStudents(updated);
                setViewMode('LIST');
                setSelectedStudentId(null);
                setStudent(null);
                setSelectedSchool(s => ({...s,total_students: {...s?.total_students,count:s?.total_students?.count - 1}}))
    
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
        form.append("date_of_birth", data.dateOfBirth || "");
    
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
        
        if (viewMode === "ADD") { 
          sendRequest("/student/add-student/","POST",form as any ,TriggeredFunc,true,true)
          return ;
        }
        if (!currentUser?.user?.pin_set){
          // Make the api call here  when user  need no pin to talk to server 
            if (viewMode === "EDIT") {
              sendRequest(`/student/update-student/${selectedStudentId}/`,"PUT",form as any ,TriggeredFunc,true,true)
            }
            return 
        } 
        setShowPinModal(true)
        
      }
    
      // --- HANDLE PIN SUCCESS ---
      const handlePinSuccess = (pins:string) => {
        serverForm.append("pin", pins );
        setShowPinModal(false); 
        let susOrDel = admForm
        susOrDel.pin = pins
    
        // Make the api call here  when pin is not needed by the user 
        if (viewMode === "ADD") { 
          sendRequest("/student/add-student/","POST",serverForm as any,TriggeredFunc,true,true)
        }
        if (viewMode === "EDIT") {
          sendRequest(`/student/update-student/${selectedStudentId}/`,"PUT",serverForm as any,TriggeredFunc,true,true)
        }
    
        if (!pendingAction) return;
        if (selectedStudentId) {
          const requestAction = pendingAction.type?.toLowerCase()
          sendRequest(`/student/manage-student/${selectedStudentId}/${requestAction}/`,"POST",susOrDel as any,TriggeredFunc,true,false)
        }
        setPendingAction(null);
      };
    
      // ACTIONS
        const triggerSuspend = () => { 
          setPendingAction({ type:'SUSPEND'}); 
          let form:any = {
            school : selectedSchool?.id
          }
          setAdmForm(form)
    
          if (!currentUser?.user?.pin_set){
            // const requestAction = pendingAction.type?.toLowerCase()
            sendRequest(`/student/manage-student/${selectedStudentId}/${'suspend'}/`,"POST",form as any ,TriggeredFunc,true,!true)
            return ;
          }
          setShowPinModal(true) ;
        };
    
        const triggerDelete = () => { 
          setPendingAction({ type: 'DELETE' }); 
          setAdmForm({
            school :selectedSchool?.id ,
            pin:''
          })
          if (!currentUser?.user?.pin_set){
            // const requestAction = pendingAction.type?.toLowerCase()
            sendRequest(`/student/manage-student/${selectedStudentId}/${'delete'}/`,"POST",{school :selectedSchool?.id} as any ,TriggeredFunc,true,false)
            return ;
          }
          setShowPinModal(true) 
        };
        
    
      // --- MAIN LIST RENDER ---
      
      const filteredStudents = students.filter(s => {
          let status = (filterStatus == "Active") ? true :false
          const matchSearch = (s.first_name + s.last_name + s?.middle_name + s.admission_number + s.email ).toLowerCase().includes(search.toLowerCase());
          const matchStatus = filterStatus === 'All' || s?.is_active === status ;
          const matchClass = filterClassIds.length === 0 || s?.active_class_rooms?.some(id => filterClassIds?.includes(id) );
          return matchSearch && matchStatus && matchClass;
      });
     
      const allowSearch = useRef(true);
      useEffect(() => {
        if (search.length && !filteredStudents.length && allowSearch.current) { 
    
          sendRequest(`/student/search/${selectedSchool?.id}/${search}/`, "GET", null as any , TriggeredFunc, true, false)
          allowSearch.current = false;
          setTimeout(() => {
            allowSearch.current = true;
          }, 500);
        }
      }, [search]);
    // ---------------------------------------------randing pages starts here ----------------------------------------------
    if (activePage === 'TEACHERS'){
        return <>
            <TeacherManager/>
        </>
    }
    if (activePage === 'ACADEMICS'){
        return <div>
            <AcademicManager/>
        </div>
    }
    
      if (viewMode === 'ADD') {
        return <>
                 <PinModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPendingAction(null); }} onSuccess={handlePinSuccess} title={'Confirm Action'} />
                 <StudentForm onSubmit={(data) => {handleApiCall(data)}} onCancel={() => setViewMode('LIST')} />
                </>
        }
    
      if (viewMode === 'EDIT' && selectedStudentId && student) { 
        const s = student;
        return<> 
                <PinModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPendingAction(null); }} onSuccess={handlePinSuccess} title={'Confirm Action'} />
                <StudentForm initialData={s} onSubmit={(data)  => {handleApiCall(data)}} onCancel={() => setViewMode('DETAIL')} />
              </> 
      }
    
    return (
        <div className="w-full h-full overflow-y-auto max-h-100  relative  ">
                {/* Pagination - Floating UI */}
                {(selectedSchool?.total_students?.count && viewMode !== 'DETAIL') && <Paginator
                    currentLength={selectedSchool?.total_students?.count }
                    setData={setStudents}
                    filteredData={filteredStudents}
                    schoolId = {selectedSchool?.id}
                    url={`/student/all-students/${selectedSchool?.id}/`}
                    sendRequest={sendRequest}
                />}
            <div className="animate-fadeIn space-y-6 h-full relative ">
                 {(viewMode === 'DETAIL' || viewMode === 'EDIT') && selectedStudentId && student ? (
                <>
                  <PinModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPendingAction(null); }} onSuccess={handlePinSuccess} title={'Confirm/Authorise Action'} />
                  <StudentDetail 
                      id={selectedStudentId} 
                      student={student}
                      setStudent = {setStudent}
                      setViewMode ={setViewMode} 
                      triggerSuspend = {triggerSuspend}
                      triggerDelete ={triggerDelete} 
                  />
                </>
                ) : (
                <>
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 sticky top-1">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Registrar Dashboard</h2>
                            <p className="text-slate-500 mt-1">Manage student records, admissions, and academic activities.</p>
                        </div>
                        <div className="flex items-center gap-3 ">
                            <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"><i className="fa-solid fa-file-csv mr-2"></i> Import Students</Button>
                            <Button onClick={() => setViewMode('ADD')} className="bg-sky-600 hover:bg-sky-700 text-white shadow-lg shadow-sky-600/20 w-fit no-work-break"><i className="fa-solid fa-user-plus mr-2"></i> New Admission</Button>
                        </div>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-sky-200 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <i className="fa-solid fa-users text-6xl text-sky-900"></i>
                            </div>
                            <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total Students</h3>
                            <div className="text-3xl font-black text-slate-900">{selectedSchool.total_students.count || 0}</div>
                            <div className="mt-3 flex items-center text-xs font-bold text-sky-600">
                                <i className="fa-solid fa-arrow-trend-up mr-1.5"></i> not set 
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <i className="fa-solid fa-hourglass-half text-6xl text-amber-900"></i>
                            </div>
                            <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Active Students</h3>
                            <div className="text-3xl font-black text-slate-900">{selectedSchool.total_students?.active}</div>
                            <div className="mt-3 flex items-center text-xs font-bold text-amber-500">
                                <i className="fa-solid fa-circle-exclamation mr-1.5"></i> Awaiting approval
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <i className="fa-solid fa-chalkboard-user text-6xl text-emerald-900"></i>
                            </div>
                            <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Active Classes </h3>
                            <div className="text-3xl font-black text-slate-900">{selectedSchool.total_classrooms}</div>
                            <div className="mt-3 flex items-center text-xs font-bold text-emerald-600">
                                <i className="fa-solid fa-check mr-1.5"></i> All classes assigned
                            </div>
                        </div>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg relative overflow-hidden text-white">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <i className="fa-solid fa-venus-mars text-6xl text-white"></i>
                            </div>
                            <h3 className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2">Gender Ratio</h3>
                            <div className="text-3xl font-black text-white">{selectedSchool.total_students?.males || 0}<span className="text-xl text-slate-400">/</span>{selectedSchool.total_students?.females || 0}</div>
                            <div className="text-xs font-bold text-slate-400 mt-2 tracking-wider">BOYS /GIRLS %</div>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                          <div className="flex flex-1 gap-4 w-full">
                              <div className="relative flex-1 max-w-sm"><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i><input type="text" placeholder="Search by name, ID..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-navy-500" /></div>
                              <select className="border border-gray-300 rounded-md px-3 py-2 bg-white" value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}><option value="All">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
                          </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 w-full"><h4 className="text-xs font-bold text-navy-900 uppercase mb-3">Filter by Classes</h4><div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">{classRooms?.map(c => (<div key={c.id} onClick={() => { if (filterClassIds.includes(c.id)) setFilterClassIds(filterClassIds.filter(id => id !== c.id)); else setFilterClassIds([...filterClassIds, c.id]); }} className={`cursor-pointer px-3 py-2 rounded border text-xs font-semibold text-center transition-all ${filterClassIds.includes(c.id) ? 'bg-navy-800 text-white border-navy-900' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-white hover:border-navy-300'}`}>{c.name}</div>))}</div></div>
                        </div>
                        <div className="overflow-x-auto  max-h-[60vh]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50">
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Student Name</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Admission No.</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Class</th>
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-100">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredStudents.map((student, i) => (
                                        <tr key={i} className="hover:bg-slate-50 transition-colors"
                                            onClick={() => { setSelectedStudentId(student?.id);setStudent(student); setViewMode('DETAIL'); }} 

                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-xs mr-3 overflow-hidden">
                                                    {student?.picture ? <img src={urls.BASE_URL + student?.picture} alt="" className="w-full h-full object-cover"/>
                                                    : student?.first_name[0]}
                                                    </div> 
                                                    <div>
                                                    <div className="text-sm font-bold text-navy-900">{student?.first_name} {student?.last_name}</div>
                                                    <div className="text-xs text-gray-500">{student?.email}
                                                    </div>
                                                    </div> 
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-600">{student.admission_number}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                                                {student?.active_class_rooms?.length > 0 &&
                                                        classRooms?.filter(c => student?.active_class_rooms.includes(c.id)).map(cls => (
                                                        <span key={cls.id} className="text-navy-800 font-medium mr-4">{cls.name}</span>
                                                    ))}
                                                    {!(student?.active_class_rooms?.length > 0) && <span className="text-gray-400">-</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${student.status !== 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {(student.is_active === true) ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
            </div>
        </div>
    );
};
