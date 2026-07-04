import {useContext, useEffect, useMemo, useRef, useState} from "react";
import {Button, Modal} from "../UI";
import urls from "@/customHooks/ServerUrls";
import { uiContext } from "@/customContexts/UiContext";
import useRequest from "@/customHooks/RequestHook";
import { generateMockTimetable, getCurrentPeriodInfo } from "../academics/AcademicUtils";
import AllClassStudents from "../academics/AllClassStudents";

interface ClassViewProps {
 


  searchQuery: string;
  viewMode: "LIST" | "DETAIL";
  selectedId: string | null;
  selectedCls :any ,setSelectedCls :any ,
  currentSession: string;
  currentTerm: string;
  currentTime: Date;
  onSelectItem: (id: string, view: "LIST" | "DETAIL") => void;
  onShowReportModal: (d: any, type: any, title: string) => void;
}

export const TeacherClassView: React.FC<ClassViewProps> = ({
 
  searchQuery,
  viewMode,
  selectedId,
  currentSession,
  currentTerm,
  currentTime,
  selectedCls ,
  setSelectedCls,
  onSelectItem,
  onShowReportModal,
}) => {
  const [showAllStudents,setShowAllStudents] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");
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

  
  
  const TriggeredSearchStudentFunc = (data) => {
    if (data?.success === "searchResults"){
        // only students not already in the list of the students 
        let searched = data?.results.filter((res) => !students.find(s => s.id == res.id))
        setStudents((prev) => [...searched,...prev])
        return;
      }
  }
  
const TriggeredFunc = (resp) => {
    if (resp?.classroom_details){
      setSelectedCls(resp?.classroom_details)
    } 
  }
  useEffect(() => {
    if (viewMode === "DETAIL" && selectedId){ 
      setSelectedCls(classRooms.find((c) => c.id === selectedId)) ;
      // send request here for class details fetch from the server 
      let classUrl = `/academics/details-by-teacher/${selectedSchool?.id}/classrooms/${selectedId}/`
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
              <span>{cls?.studentsCount || "N/A"} Students</span>
              <span>{cls?.subjectsCount || "N/A"} Subjects</span>
            </div>
           
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
  
 
  const schedule = generateMockTimetable(selectedCls?.name);
  const currentPeriod = getCurrentPeriodInfo(schedule, subjects, teachers, currentTime);

  const getSubjectScheduleStr = (subjectName: string, timetable: any[]) => {
    const times: string[] = [];
    timetable.forEach((day) => {
      day.periods.forEach((p: any) => {
        if (
          p.subject !== "Free Period" &&
          (p.subject?.includes(subjectName) || subjectName?.includes(p.subject))
        ) {
          const start = p.time?.split("-")[0].trim();
          times?.push(`${day.day.substring(0, 3)} ${start}`);
        }
      });
    });
    return times.join(", ");
  };
  
  
  return (
    <>
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
              </div>
              <h2 className="text-4xl font-bold mb-1">{selectedCls?.name}</h2>
              <p className="text-navy-200 text-lg">{selectedCls?.studentsCount} Students Enrolled</p>
              <div
                        className="mt-4 flex items-center gap-2 cursor-pointer p-2 rounded w-fit transition-colors"
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
                                      : "Not Assigned"}
                                  </p>
                                </div>
                                
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
            // onClick={() => onSetTimetableTarget({name: selectedCls.name, type: "CLASS"})}
          >
            <i className="fa-solid fa-calendar-days mr-2"></i> Class Timetable
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1 relative ">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <h3 className="font-bold text-lg text-navy-900">Students ({selectedCls?.studentsCount || "N/A"})</h3>
              <div className="flex gap-2">
               
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
                  onClick={() => {}}
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


        </div>
      </div>}
    </>
  );
}
};
