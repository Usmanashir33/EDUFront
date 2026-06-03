import {useContext, useEffect, useMemo, useRef, useState} from "react";
import {ClassRoom, Student, Subject, Teacher, SubjectAssignment} from "../../types";
import {Button, Modal} from "../UI";
import {generateMockTimetable, getCurrentPeriodInfo} from "./AcademicUtils";
import urls from "@/customHooks/ServerUrls";
import { uiContext } from "@/customContexts/UiContext";
import useRequest from "@/customHooks/RequestHook";
import AllClassTeachers from "./AllClassTeachers";
import AllClassStudents from "./AllClassStudents";

interface ClassViewProps {
  showAddStudentModal:any ,
  setShowAddStudentModal:any ,
  selectedStudentIds:any ,
  setSelectedStudentIds:any ,
  showTransferModal:any ,
  setShowTransferModal:any ,
  transferTargetClassId :any ,
  setTransferTargetClassId :any ,
  handleAddStudentsToClass :any  ,
  handleTransferStudents :any  ,

  searchQuery: string;
  viewMode: "LIST" | "DETAIL";
  selectedId: string | null;
  selectedCls :any ,setSelectedCls :any ,
  currentSession: string;
  currentTerm: string;
  currentTime: Date;
  onSelectItem: (id: string, view: "LIST" | "DETAIL") => void;
  onEditClass: (c: ClassRoom) => void;
  onSetTimetableTarget: (t: any) => void;
  onShowReportModal: (d: any, type: any, title: string) => void;
  onShowAddStudent: (show: boolean) => void;
  onAddSubject: () => void;
  onNavigateToStudent?: (id: string) => void;
  onManageMaster: (c: ClassRoom) => void;
  onInitiateSubstitute: (sub: Subject, classId: string) => void;
  onTransferStudents: (classId: string) => void;
  onNavigateToSubject: (id: string) => void;
  onDeleteAcademics: (a:"CLASSROOMS" ,s:Subject) => void;

}

export const ClassView: React.FC<ClassViewProps> = ({
  showAddStudentModal,
  setShowAddStudentModal,
  selectedStudentIds,
  setSelectedStudentIds,
  showTransferModal,
  setShowTransferModal,
  transferTargetClassId,
  setTransferTargetClassId,
  handleAddStudentsToClass ,
  handleTransferStudents ,

  searchQuery,
  viewMode,
  selectedId,
  currentSession,
  currentTerm,
  currentTime,
  selectedCls ,setSelectedCls,
  onSelectItem,
  onEditClass,
  onSetTimetableTarget,
  onShowReportModal,
  onShowAddStudent,
  onAddSubject,
  onManageMaster,
  onInitiateSubstitute,
  onTransferStudents,
  onNavigateToStudent,
  onNavigateToSubject,
  onDeleteAcademics
}) => {
  const [sessionFilter, setSessionFilter] = useState(currentSession);
  const [showAllTeachers,setShowAllTeachers] = useState(false);
  const [showAllStudents,setShowAllStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentTransSearch, setStudentTransSearch] = useState("");
  const [searchedClassStudents,setSearchedClassStudent] = useState<any>([])

  const {
    classRooms,
    subjects,
    teachers,
    setStudents,
    students,
    selectedSchool,
    isLoading,
  } = useContext(uiContext);
  const {sendRequest} = useRequest();

  const TriggeredFunc = (resp) => {
    if (resp?.classroom_details){
      setSelectedCls(resp?.classroom_details)
    }
  }
  
  const TriggeredSearchStudentFunc = (data) => {
    if (data?.success === "searchResults"){
        // only students not already in the list of the students 
        let searched = data?.results.filter((res) => !students.find(s => s.id == res.id))
        setStudents((prev) => [...searched,...prev])
        return;
      }
  }
  const TriggeredSearchStudentFunc2 = (data) => { // only the class Students
    if (data?.success === "searchResults"){
        // only students not already in the list of the students 
        let searched = data?.results.filter((res) => !searchedClassStudents?.find((s:any) => s?.id == res?.id))
        setSearchedClassStudent((prev) => [...searched,...prev])
        return;
      }
  }

  useEffect(() => {
    if (viewMode === "DETAIL" && selectedId){ 
      setSelectedCls(classRooms.find((c) => c.id === selectedId)) ;
      // send request here for class details fetch from the server 
      let classUrl = `/academics/details/${selectedSchool?.id}/classrooms/${selectedId}/`
      sendRequest(classUrl,"GET",null as any ,TriggeredFunc,!true,false);
    }
    return (() => {setSelectedCls(null);setSearchedClassStudent([])});
  },[selectedId])

  // ------------------------------------ search from genenral students that are not in the class --------------------------------------------  
  const filteredGenStudents = useMemo(() => {
      return (
      students.filter(s => {
        const clsStudentsIds = selectedCls?.students?.map(s => s?.id) || [];
        const matchSearch = (s.first_name +" " + s.last_name +" "+ s?.middle_name  ).toLowerCase().includes(studentSearch.toLowerCase());
        const matchDetails = (s.admission_number + s.email ).toLowerCase().includes(studentSearch.toLowerCase()) ;
        const matchClass = !(clsStudentsIds?.find(id => id===s.id)) ;
        return (matchSearch ||  matchDetails)  && matchClass ;
    })
  )
  // },[studentSearch,students,showAddStudentModal])
  },[studentSearch,selectedCls])
  
    const allowSearch2 = useRef(true);
    useEffect(() => {
      if (studentSearch.length && !filteredGenStudents.length && allowSearch2.current) { 
  
        sendRequest(`/student/search/${selectedSchool?.id}/${studentSearch}/`, "GET", null as any , TriggeredSearchStudentFunc, true, false)
        allowSearch2.current = false ;
        setTimeout(() => {
          allowSearch2.current = true ;
        }, 500) ;
      }
    }, [studentSearch]);
  
  // ------------------------------------ search Transfer students--------------------------------------------  
    const filteredTransStudents = useMemo(() => {
      const clsStudents= selectedCls?.students || []
      return ([...clsStudents,...searchedClassStudents].filter(s => {

          const matchSearch = (s.first_name +" " + s.last_name +" "+ s?.middle_name  ).toLowerCase().includes(studentTransSearch.toLowerCase());
          const matchDetails = (s.admission_number + s.email ).toLowerCase().includes(studentTransSearch.toLowerCase());
          // const matchClass = (s.active_class_rooms.find((id) => id == selectedItemId));
          return (matchSearch ||  matchDetails) ;
      }))
    },[studentTransSearch,searchedClassStudents,selectedCls])
  
    const allowSearch3 = useRef(true);
    useEffect(() => {
      if (studentTransSearch.length && !filteredTransStudents.length && allowSearch3.current) { 
  
        sendRequest(`/student/search/${selectedSchool?.id}/${studentTransSearch}/`, "GET", null as any , TriggeredSearchStudentFunc2, true, false)
        allowSearch3.current = false;
        setTimeout(() => {
          allowSearch3.current = true;
        }, 500);
      }
    }, [studentTransSearch]);
  
 
  // --- LIST VIEW ---
  if (viewMode === "LIST") {
    const filteredClasses = classRooms.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredClasses.map((cls : any ) => (
          <div
            key={cls.id}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all group bg-white relative"
            onClick={() =>{setSelectedCls(cls),onSelectItem(cls.id, "DETAIL")}}
          >
            <h4 className="font-bold text-navy-900 text-lg group-hover:text-gold-600 transition-colors mb-2 cursor-pointer">
              {cls.name}
            </h4>
            <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 cursor-pointer">
              <span>{cls?.studentsCount} Students</span>
              <span>{cls?.subjects.length} Subjects</span>
            </div>
            <button
              className="absolute top-2 right-2 text-red-50 rounded-lg bg-red-400 hover:bg-red-500 p-1 px-2"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteAcademics("CLASSROOMS",cls as any );
              }}
            >
              <i className="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>
        ))}
        {filteredClasses.length === 0 && (
          <div className="col-span-3 text-center p-8 text-gray-400">No classes found.</div>
        )}
      </div>
    );
  }

  // --- DETAIL VIEW ---
if (viewMode === "DETAIL") {
  if(!selectedCls) return ;
  
  const classSubjects = subjects.filter((s) => selectedCls?.subjects.includes(s.id)) ;
 
  const schedule = generateMockTimetable(selectedCls?.name);
  const currentPeriod = getCurrentPeriodInfo(schedule, subjects, teachers, currentTime);

  const getSubjectTeacher = (sub) => {
    const assignment = sub.assignments?.find((a) => a.classId === selectedCls.id);
    if (assignment) return teachers.find((t) => t.id === assignment.teacherId);
    const tId = sub.teachers[0];
    return teachers.find((t) => t.id === tId);
  };

  const getSubjectScheduleStr = (subjectName: string, timetable: any[]) => {
    const times: string[] = [];
    timetable.forEach((day) => {
      day.periods.forEach((p: any) => {
        if (
          p.subject !== "Free Period" &&
          (p.subject.includes(subjectName) || subjectName.includes(p.subject))
        ) {
          const start = p.time.split("-")[0].trim();
          times.push(`${day.day.substring(0, 3)} ${start}`);
        }
      });
    });
    return times.join(", ");
  };
  
  
  return (
    <>
      {showAllTeachers && <AllClassTeachers schoolId={selectedSchool?.id} cls={selectedCls} requestSender={sendRequest} showAllTeachers={showAllTeachers} setShowAllTeachers={setShowAllTeachers}/>}
      {showAllStudents && <AllClassStudents schoolId={selectedSchool?.id} cls={selectedCls} requestSender={sendRequest} showAllStudents={showAllStudents} setShowAllStudents={setShowAllStudents}/>}
         
      {selectedCls && <div className="space-y-6 animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <i className="fa-solid fa-clock text-9xl"></i>
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <select
                  value={sessionFilter}
                  onChange={(e) => setSessionFilter(e.target.value)}
                  className="bg-gold-500 text-navy-900 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider border-none focus:ring-0 cursor-pointer"
                >
                  <option>2023/2024</option> 
                  <option>2024/2025</option> 
                </select>
                <span className="bg-navy-700 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                  {currentTerm}
                </span>
              </div>
              <h2 className="text-4xl font-bold mb-1">{selectedCls?.name}</h2>
              <p className="text-navy-200 text-lg">{selectedCls?.studentsCount} Students Enrolled</p>
              <div
                className="mt-4 flex items-center gap-2 cursor-pointer p-2 rounded w-fit transition-colors"
                onClick={() => onManageMaster(selectedCls)}
              >
                <div className="w-8 h-8 rounded-full bg-white text-navy-900 flex items-center justify-center font-bold hover:bg-white/10 ">
                  {selectedCls?.form_teacher ? (
                      <img className="w-8 h-8 bg-navy-100 border border-navy-200 rounded-full" src={urls.BASE_URL + selectedCls.form_teacher?.picture} alt="pic" />
                  ) : (
                    <i className="fa-solid fa-plus"></i> 
                  )}
                </div>
                <div className="flex gap-5 ">
                  <div>
                    <p className="text-xs uppercase font-bold text-navy-300">Form Teacher</p>
                    <p className="text-sm font-bold">
                      {selectedCls?.form_teacher
                        ? `${selectedCls?.form_teacher.title} ${selectedCls.form_teacher.first_name} ${selectedCls.form_teacher.last_name}`
                        : "Assign Master"}
                    </p>
                  </div>
                  <button
                      className="flex gap-4 items-center text-red-50 rounded-lg bg-gray-600 hover:bg-gray-500 p-1 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditClass(selectedCls as any );
                      }}
                    >
                      <i className="fa-solid fa-pen-to-square text-sm"></i>
                      Edit
                </button>
                </div>
              </div>
            </div>
            <div className="text-right mt-6 md:mt-0">
              <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10 w-64">
                <p className="text-xs text-gold-400 font-bold uppercase mb-1">Current Period</p>
                <div className="text-xl font-bold text-white leading-tight">
                  {currentPeriod.subject}
                </div>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className="text-xs font-medium text-white/80">{currentPeriod.teacher}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-end">
                  <span
                    className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${currentPeriod.status === "Ongoing" ? "bg-green-500/20 text-green-300" : "bg-white/10 text-gray-300"}`}
                  >
                    {currentPeriod.status}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-navy-200">{currentPeriod.time}</p>
                    <p className="text-xs font-mono opacity-75">
                      {currentTime.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 overflow-x-auto pb-2">
          <Button
            variant="secondary"
            className="w-auto whitespace-nowrap px-4"
            onClick={() => onSetTimetableTarget({name: selectedCls.name, type: "CLASS"})}
          >
            <i className="fa-solid fa-calendar-days mr-2"></i> Class Timetable
          </Button>
          <Button className="w-auto whitespace-nowrap px-4" onClick={() => onShowAddStudent(true)}>
            <i className="fa-solid fa-user-plus mr-2"></i> Add Students
          </Button>
          <Button className="w-auto whitespace-nowrap px-4" onClick={() => onAddSubject()}>
            <i className="fa-solid fa-book-medical mr-2"></i> Add Subject
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1 relative ">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-lg text-navy-900">Students ({selectedCls?.studentsCount || "N/A"})</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => onTransferStudents(selectedCls.id)}
                  className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center"
                  title="Transfer"
                >
                  <i className="fa-solid fa-arrow-right-arrow-left mr-1"></i> Transfer
                </button>
                <button
                  onClick={() =>
                    onShowReportModal(selectedCls?.students || [], "STUDENT", `${selectedCls.name} Student List`)
                  }
                  className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-2 py-1 rounded"
                >
                  <i className="fa-solid fa-file-export mr-1"></i> Export
                </button>
              </div>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
              {selectedCls?.students?.map((s:any) => ( 
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-navy-50 group transition-colors cursor-pointer"
                  onClick={() => onNavigateToStudent && onNavigateToStudent(s?.id as string)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-navy-700">
                    <img className="w-8 h-8 bg-navy-100 border border-navy-200 rounded-full" src={urls.BASE_URL + s.picture} alt="pic" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy-900">
                        {s.first_name} {s.last_name}
                      </p>
                      <p className="text-xs text-gray-500 font-mono">{s.admission_number}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-1 rounded ${s?.is_active? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {s?.is_active? "Active" : "Inactive"}
                  </span>
                </div>
              ))}
              {!selectedCls?.students?.length && (
                <p className="text-sm text-gray-500 text-center italic p-2">No students assigned.</p>
              )}
            </div>
            {selectedCls?.students?.length >=15 && (
              <div className="absolute bottom-2 right-4">
                <span className = 'text-sm  text-green-800 hover:text-green-900 cursor-pointer' onClick={() => setShowAllStudents(true)}>
                  show all students
                </span>
              </div>
            )}
          </div>

          {/* Teachers */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1 relative">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-lg text-navy-900">Teachers ({selectedCls?.teachersCount || "N/A"})</h3>
              <button
                onClick={() =>
                  onShowReportModal(selectedCls?.teachers || [], "TEACHER", `${selectedCls.name} Teachers List`)
                }
                className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-2 py-1 rounded"
              >
                <i className="fa-solid fa-file-export mr-1"></i> Export
              </button>
            </div>
            <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
              {selectedCls?.teachers?.map((t:any) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-navy-50 group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-navy-100 border border-navy-200 rounded-full flex items-center justify-center text-xs font-bold text-navy-700">
                      <img className="w-8 h-8 bg-navy-100 border border-navy-200 rounded-full" src={urls.BASE_URL + t.picture} alt="pic"/>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy-900">
                        {t.title} {t.first_name} {t.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{t.staff_id}</p>
                    </div>
                  </div>
                  {t.id === selectedCls.form_teacher.id && (
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-gold-100 text-gold-800">
                      Master
                    </span>
                  )}
                </div>
              ))}
              {!selectedCls?.teachers?.length && (
                <p className="text-sm text-gray-500 text-center italic p-2">No teachers assigned to any class Subject.</p>
              )}
            </div>
            {selectedCls?.teachers?.length >=15 && (
              <div className="absolute bottom-2 right-4">
                <span className = 'text-sm  text-green-800 hover:text-green-900 cursor-pointer' onClick={() => setShowAllTeachers(true)}>
                  show all teachers
                </span>
              </div>
            )}
          </div>

          {/* Subjects */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
            <h3 className="font-bold text-lg text-navy-900 mb-4 border-b pb-2">
              Subjects ({classSubjects.length})
            </h3>
            <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
              {classSubjects.map((sub : any ) => {
                const teacher :any = getSubjectTeacher(sub);
                const scheduleStr = getSubjectScheduleStr(sub.name, schedule);
                return (
                  <div
                    key={sub.id}
                    onClick={() => onNavigateToSubject(sub.id)}
                    className="p-3 border border-gray-100 rounded hover:shadow-md transition-shadow bg-white cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-bold text-navy-900 group-hover:text-gold-600 transition-colors">
                          {sub.name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{sub.code}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInitiateSubstitute(sub, selectedCls.id);
                          }}
                          className="text-[10px] bg-navy-50 text-navy-700 px-2 py-1 rounded hover:bg-navy-100 border border-navy-100 whitespace-nowrap"
                        >
                          Assign
                        </button>
                      </div>
                    </div>
                    {scheduleStr && (
                      <div className="mt-1 flex items-center text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded w-fit">
                        <i className="fa-regular fa-clock mr-1.5"></i> {scheduleStr}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      <i className="fa-solid fa-chalkboard-user"></i>
                      {teacher ? (
                        <span className="font-medium text-navy-800">
                          {teacher.title} {teacher?.last_name}
                        </span>
                      ) : (
                        <span className="text-orange-500 italic">No teacher assigned</span>
                      )}
                    </div>
                  </div>
                );
              })}
              {!selectedCls?.subjects?.length && (
                <p className="text-sm text-center text-gray-500 italic p-2">No Subject assigned.</p>
              )}
            </div>
          </div>
        </div>
      </div>}
      {/* // Enrolling student to the class  */}
      <Modal
        isOpen={showAddStudentModal}

        onClose={() => {
          setShowAddStudentModal(false);
          setSelectedStudentIds([]);
          setStudentSearch("");
        }}
        title="Enroll Students (General)"
        icon="fa-solid fa-user-plus"
      >
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Search student..."
            className="w-full p-2 border border-gray-300 rounded-md"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
          <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto custom-scrollbar p-2">
            {filteredGenStudents?.map((student) => (
                <div
                key={student.id}
                onClick={() => {
                  if (selectedStudentIds?.includes(student.id))
                    setSelectedStudentIds(
                      selectedStudentIds?.filter((id) => id !== student.id)
                    );
                  else setSelectedStudentIds([...selectedStudentIds, student.id]);
                }}
                className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200
                  ${
                    selectedStudentIds.includes(student.id)
                      ? "bg-navy-100 border border-navy-300"
                      : "hover:bg-gray-50"
                  }`}
              >
                {/* Left Section */}
                <div className="flex items-center gap-2">
                  {/* Student Image */}
                  <img
                    src={urls.BASE_URL + student?.picture}
                    alt="student"
                    className="w-8 h-8 rounded-full object-cover border"
                  />

                  {/* Name + Admission */}
                  <div className="leading-tight">
                    <p className="text-sm font-medium text-gray-800">
                      {student.first_name} {student.last_name} {student.middle_name}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {student.admission_number}
                    </p>
                  </div>
                </div>

                {/* Right Check Icon */}
                {selectedStudentIds?.includes(student.id) && (
                  <i className="fa-solid fa-check text-navy-900 text-xs"></i>
                )}
              </div>
            ))}
            {!(filteredGenStudents.length) && <div className="px-6 py-8 text-center text-gray-500">No students found matching filters.</div>}

          </div>
          <Button onClick={handleAddStudentsToClass} disabled={selectedStudentIds.length === 0 || isLoading }>
            Enroll Selected
          </Button>
        </div>
      </Modal>

      {/* Transferring Student from class Student */}
       <Modal
        isOpen={showTransferModal}
        onClose={() => {
          setShowTransferModal(false);
          setSelectedStudentIds([]);
          setTransferTargetClassId("");
        }}
        title="Transfer Students"
        icon="fa-solid fa-arrow-right-arrow-left"
      >
        <div className="space-y-4">
          
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">Select students to move. <b>( {selectedStudentIds.length} Selected )  </b></p>
              <button
                onClick={() => {
                  // const candidates = students.filter((s) =>
                  //   s.class_rooms.filter(cls => cls.status === 'active' || cls.status === 'enrolled').map((cls) => cls.class_room)?.includes(selectedItemId || ""),
                  // );
                  const candidates = filteredTransStudents
                  if (selectedStudentIds.length === candidates.length) {
                    setSelectedStudentIds([]);
                  } else {
                    setSelectedStudentIds(candidates.map((s) => s.id));
                  }
                }}
                className="text-xs font-bold text-navy-600 hover:text-gold-600 transition-colors"
              >
                {selectedStudentIds.length ===
                filteredGenStudents?.length
                  ? "Deselect All"
                  : ` Select All`}
              </button>
          </div>
          <input
            type="text"
            placeholder="Search student..."
            className="w-full p-2 border border-gray-300 rounded-md"
            value={studentTransSearch}
            onChange={(e) => setStudentTransSearch(e.target.value)}
          />
          <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto custom-scrollbar p-2">
            {filteredTransStudents?.map((student) => (
                <div
                  key={student.id}
                  onClick={() => {
                    if (selectedStudentIds?.includes(student.id))
                      setSelectedStudentIds(
                        selectedStudentIds?.filter((id) => id !== student.id)
                      );
                    else setSelectedStudentIds([...selectedStudentIds, student.id]);
                  }}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all duration-200
                    ${
                      selectedStudentIds.includes(student.id)
                        ? "bg-navy-100 border border-navy-300"
                        : "hover:bg-gray-50"
                    }`}
                >
                  {/* Left Section */}
                  <div className="flex items-center gap-2">
                    {/* Student Image */}
                    <img
                      src={student.picture ? urls.BASE_URL + student.picture : "/default-profile.png"}
                      alt="student"
                      className="w-8 h-8 rounded-full object-cover border"
                    />

                    {/* Name + Admission */}
                    <div className="leading-tight">
                      <p className="text-sm font-medium text-gray-800">
                        {student.first_name} {student.last_name} {student.middle_name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {student.admission_number}
                      </p>
                    </div>
                  </div>

                  {/* Right Check Icon */}
                  {selectedStudentIds?.includes(student.id) && (
                    <i className="fa-solid fa-check text-navy-900 text-xs"></i>
                  )}
                </div>
              ))}
            {filteredTransStudents?.length === 0 && (
              <p className="text-center text-sm text-gray-500 italic p-2">
                No students in this class.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-semibold text-navy-800 mb-1.5">Target Class</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-md"
              value={transferTargetClassId}
              onChange={(e) => setTransferTargetClassId(e.target.value)}
            >
              <option value="">Select Target Class</option>
              {classRooms
                .filter((c) => c.id !== selectedCls?.id)
                .map((c) => (
                  <option key={c.id} value={c.id}> 
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <Button
            onClick={handleTransferStudents}
            disabled={selectedStudentIds.length === 0 || !transferTargetClassId || isLoading }
          >
            Transfer Selected
          </Button>
        </div>
      </Modal>
      
    </>
  );
}
};
