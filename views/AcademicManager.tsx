import React, {useState, useEffect, useContext, useRef, useMemo} from "react";
import {SchoolSection, ClassRoom, Subject, Student, Teacher, ActivityLog} from "../types";
import {Button, Input, Modal, MultiSelectGrid, PinModal, Toast} from "../components/UI";
import {TimetableModal, UnifiedExportModal} from "../components/academics/AcademicUtils";
import {SectionView} from "../components/academics/SectionView";
import {ClassView} from "../components/academics/ClassView";
import {SubjectView} from "../components/academics/SubjectView";
import {uiContext} from "@/customContexts/UiContext";
import { authContext } from "@/customContexts/AuthContext";
import useRequest from "@/customHooks/RequestHook";
import urls from "@/customHooks/ServerUrls";

interface AcademicManagerProps {
  onNavigateToStudent?: (studentId: string) => void;
}

type Tab = "SECTIONS" | "CLASSROOMS" | "SUBJECTS";
type ViewMode = "LIST" | "DETAIL";
type OperationMode = "POST" | "DELETE" | "PUT" | "GET" | "TRANSFER" | "FORM_TEACHER" | 'ENROLLMENT';

export const AcademicManager: React.FC<AcademicManagerProps> = ({
  onNavigateToStudent,
}) => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<Tab>("SECTIONS");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [methode, setMethode] = useState<OperationMode>("POST");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentSession] = useState("2023/2024");
  const [currentTerm] = useState("2nd Term");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClass, setEditingClass] = useState(false);
  const [showClassMasterConfirmModal,setShowClassMasterConfirmModal] = useState(false);
  const [classMasterPendingId,setClassMasterPendingId] = useState<string|null>(null)

  const {
    students,
    setStudents, // students data
    teachers,setTeachers,
    sections,
    setSections, // sections data
    classRooms,
    setClassRooms, // classRooms data
    subjects,
    setSubjects, // subjects data
    selectedSchool,
    isLoading, setToast
  } = useContext(uiContext);
  const {currentUser} = useContext(authContext);

  // Add/Edit Forms
  const [sectionForm, setSectionForm] = useState({name: ""});
  const [classForm, setClassForm] = useState({name: "", sectionId: ""});
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    credits : "",
    teachersIds: [] as string[],
  });
  // delete target 
  const [academicTarget, setacademicTarget] = useState<SchoolSection | null | any>(null);

  // Edit Targets
  const [editSectionTarget, setEditSectionTarget] = useState<ClassRoom | null>(null);
  const [editClassTarget, setEditClassTarget] = useState<ClassRoom | null>(null);
  const [editClassForm, setEditClassForm] = useState({
    name: "",
    sectionId: '',
  });
  const [editSubjectTarget, setEditSubjectTarget] = useState<Subject | null>(null);
  const [editSubjectForm, setEditSubjectForm] = useState({
    name: "",
    code: "",
    credits:''
  });

  // Modals
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [timetableTarget, setTimetableTarget] = useState<{
    name: string;
    type: "CLASS" | "SECTION";
  } | null>(null);

  const [reportModalData, setReportModalData] = useState<{
    isOpen: boolean;
    data: any[];
    type: "STUDENT" | "TEACHER" | "CLASS";
    title: string;
  }>({isOpen: false, data: [], type: "STUDENT", title: ""});

  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTargetClassId, setTransferTargetClassId] = useState("");

  // Teacher & Subject Assignment Modals
  const [showTeacherSelectModal, setShowTeacherSelectModal] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const [teacherSelectMode, setTeacherSelectMode] = useState<
    "SUBSTITUTE" | "CLASS_MASTER" | "ADD_TO_SUBJECT"
  >("SUBSTITUTE");
  const [currentContextData, setCurrentContextData] = useState<any>(null);

  const [showClassSelectModal, setShowClassSelectModal] = useState(false);
  const [selectedSubjectForClass, setSelectedSubjectForClass] = useState<any | null>(null);
  const [classSelectState, setClassSelectState] = useState<
    {classId: string; teacherId: string; isSelected: boolean}[]
  >([]);

  const [showAddSubjectToClassModal, setShowAddSubjectToClassModal] = useState(false);
  const [selectedSubjectToAdd, setSelectedSubjectToAdd] = useState<Subject | null>(null);
  const [selectedTeacherForSubject, setSelectedTeacherForSubject] = useState<string>("");
  const [isDeletingModalOpen,setIsDeletingModalOpen] = useState(false);
  const [serverForm,setServerform] = useState({})
  const {sendRequest} = useRequest()
  const [showPinModal, setShowPinModal] = useState(false);
  const [ selectedCls ,setSelectedCls ]=useState<any>(null);


  // --- EFFECTS ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showClassSelectModal && selectedSubjectForClass) {
      const initial = classRooms.map((c) => {
        const isSelected = selectedSubjectForClass.class_rooms?.includes(c.id);
        const assignment = selectedSubjectForClass.assignments?.find((a) => a.classId === c.id);
        return {
          classId: c.id,
          teacherId: assignment ? assignment.teacherId : "",
          isSelected: isSelected,
        };
      });
      setClassSelectState(initial);
    }
  }, [showClassSelectModal, selectedSubjectForClass, classRooms]);

  // --- HANDLERS ---
  const resetForms = () => {
    setSectionForm({name: ""});
    setClassForm({name: "", sectionId: ""});
    setSubjectForm({
    name: "",
    code: "",
    credits : "",
    teachersIds: [] as string[],
  });
    setServerform({});
  };

  const  TriggerClassFunc2 = (data) => {
    
    if (data?.success){setToast({message:data?.success, type: "success"})}

    if (data?.enrolled_classroom){ // enrolled_classroom
      let u = data?.enrolled_classroom
      setSelectedCls(u);
      setShowAddStudentModal(false);
      setSelectedStudentIds([]);
      setClassRooms((prev) => prev.map((c) => c.id === u?.id   ? {...c,studentsCount : u?.studentsCount}   : c ) );
    }else if (data?.from_class){ // students Transferred 
      let fromClass = data?.from_class;
      let toClass = data?.to_class ;
      if (selectedCls){ // instant update 
        setSelectedCls(
          prev => prev.id === fromClass.id ? {...prev,studentsCount : fromClass.studentsCount,students: fromClass.students}:prev
        )
      }
   
      setClassRooms(prev => prev.map( // global update here 
          c => c.id === fromClass.id ? {...c, studentsCount: fromClass.studentsCount}
            : c.id === toClass.id ? {...c, studentsCount: toClass.studentsCount}
            : c
        )
      );
      setShowTransferModal(false); // ffor transfering students between classes
      setShowAddStudentModal(false); // for add students to class
      setTransferTargetClassId("");
      setSelectedStudentIds([]);
  }
    
  }

  const  TriggerClassFunc = (data) => {
    console.log('data: ', data);
    if (data?.success){setToast({message:data?.success, type: "success"})}

    if (data?.new_classroom){ // process new classroom
      setShowAddModal(false) ;
      setClassRooms([data?.new_classroom, ...classRooms]) ;
      setShowAddModal(false) ;
      resetForms() ;

    } else if (data?.updated_classroom){ // update classroom 
      if (selectedCls){
        setSelectedCls(prev => ({...prev,...data?.updated_classroom}));
      }
      setClassRooms((prev) => prev.map((c) => c.id === editClassTarget?.id   ? data?.updated_classroom   : c ) );
      setShowAddModal(false);
      setEditClassTarget(null);

    }else if (data?.deleted_classroom){ // update new section 
      setClassRooms(
      classRooms.filter((s) => (s.id !== data?.deleted_classroom?.id)),
      );
      setacademicTarget(null);

    }else if (data?.form_classroom){
      console.log('data: ', data);
      let u = data?.form_classroom
      setShowAddModal(false) ;
      setShowTeacherSelectModal(false);
      if (selectedCls){
        setSelectedCls(prev => ({...prev,form_teacher:u?.form_teacher}));
      }
      let updated = classRooms.map((c) => c.id === data?.form_classroom.id ? {...c,form_teacher:u?.form_teacher} : c );
      setClassRooms(updated);
      setEditClassTarget(null);
      setClassMasterPendingId(null);
    }
  }

  const TriggeredSearchTeacherFunc = (data) => {
    if (data?.success === "searchResults"){
        // only teachers not already in the list of the teachers state will be added to the top of the list 
        let searched = data?.results.filter((res) => !teachers.find(s => s.id == res.id))
         setTeachers((prev) => [...searched,...prev])
        return;
        }
    
  }
  

  const TriggeredFunc = (data) => { // 
    console.log('data: ', data);
    if (data?.success){
      setToast({message:data?.success, type: "success"});

    }
    if (data?.new_section){ // process new section 
      setShowAddModal(false) ;
      setSections([data?.new_section , ...sections ]);
      resetForms();

    } else if (data?.new_subject){ // process new subject 
      setShowAddModal(false) ;
      setSubjects([data?.new_subject,...subjects]);
      resetForms();
      setShowAddModal(false);

    }else if (data?.updated_section){ // update new section 
      setShowAddModal(false) ;
      setSections(
      sections.map((s) => (s.id === editSectionTarget?.id ? data?.updated_section : s)),
      );
      setEditSectionTarget(null);
      resetForms();

    }else if (data?.deleted_section){ // update new section 
      setSections(
      sections.filter((s) => (s.id !== data?.deleted_section?.id)),
      );
      setacademicTarget(null);

    } else if (data?.deleted_subject){ // update new section 
      setSubjects(
      subjects.filter((s) => (s.id !== data?.deleted_subject?.id)),
      );
      setacademicTarget(null);

    }else if (data?.updated_subject){ // update subject
      setShowAddModal(false)
      setSubjects( subjects.map((s) => s.id === editSubjectTarget?.id ? data?.updated_subject  : s));
      setEditSubjectTarget(null);
      setShowClassSelectModal(false);   // for managing subjects data 
      setSelectedSubjectForClass(null); 
      setShowTeacherSelectModal(false); 
    
  }
  }


//----------------------------------- Search teachers ---------------------------------------------  
const filteredTeachers = useMemo(() => {
  return( teachers.filter(t => {
      const matchSearch = (t.title + " " +t.first_name + " "+ t.last_name + " " + t?.middle_name ).toLowerCase().includes(teacherSearch.toLowerCase()) ;
      const matchdetails =  (t?.staff_id + t?.phone + t.email).toLowerCase().includes(teacherSearch.toLowerCase());
      return matchSearch || matchdetails ;
  })
  )
},[teacherSearch,teachers]);
  
  const allowSearch = useRef(true) ;
  useEffect(() => {
    if (teacherSearch.length && !filteredTeachers.length && allowSearch.current) {
      sendRequest(`/teacher/search/teacher/${selectedSchool?.id}/${teacherSearch}/`, "GET", null as any , TriggeredSearchTeacherFunc, true, false)
      allowSearch.current = false ;
      setTimeout(() => {
        allowSearch.current = true;
      }, 500);
    }
  }, [teacherSearch,]);



  const handlePinSuccess = (pins:string) => {
    let form = {...serverForm,pin : pins}
    setShowAddModal(false);
    setShowPinModal(false); 
    // ....................................................................................
    if (activeTab === 'SECTIONS'){
      if (methode === 'POST'){
        sendRequest(`/academics/create/sections/`,"POST",form as any ,TriggeredFunc,true,false);
      }else if (methode === 'PUT'){
        sendRequest(`/academics/update/sections/${editSectionTarget?.id}/`,"PUT",form as any ,TriggeredFunc,true,false);

      }else if (methode === 'DELETE'){
        sendRequest(`/academics/delete/${selectedSchool?.id}/sections/${academicTarget?.id}/${pins}/`,"DELETE",null as any ,TriggeredFunc,true,false);
      }
      return;

    }else if (activeTab === 'CLASSROOMS'){
      if (methode === 'POST'){
        sendRequest(`/academics/create/classrooms/`,"POST",form as any ,TriggerClassFunc,true,false);
      }else if (methode === 'PUT'){
        sendRequest(`/academics/update/classrooms/${editClassTarget?.id}/`,"PUT",form as any ,TriggerClassFunc,true,false);
      }else if (methode === 'DELETE'){
        sendRequest(`/academics/delete/${selectedSchool?.id}/classrooms/${academicTarget?.id}/${pins}/`,"DELETE",null as any ,TriggerClassFunc,true,false);
      }else if (methode === "TRANSFER"){ // transfering students between classes
        sendRequest(`/academics/class/transfer/`,"PUT",form as any ,TriggerClassFunc2,true,false);
      }else if (methode === "ENROLLMENT"){ // ENROLLMENT students to the class
        sendRequest(`/academics/class/enrollment/`,"POST",form as any ,TriggerClassFunc2,true,false);
      }else if (methode === "FORM_TEACHER"){ // changing form teacher
        sendRequest(`/academics/update/form_teacher/${academicTarget?.id}/`,"PUT",serverForm as any ,TriggerClassFunc,true,false);
      }
      return ;

    }else if (activeTab === "SUBJECTS"){
      if (methode === 'POST'){
        sendRequest(`/academics/create/subjects/`,"POST",form as any ,TriggeredFunc,true,false);

      }else if (methode === 'PUT'){
        sendRequest(`/academics/update/subjects/${editSubjectTarget?.id}/`,"PUT",form as any ,TriggeredFunc,true,false);

      }else if (methode === 'DELETE'){
        sendRequest(`/academics/delete/${selectedSchool?.id}/subjects/${academicTarget?.id}/${pins}/`,"DELETE",null as any ,TriggeredFunc,true,false);
      }
      return ;
    }
  }

  const deleteAcademics = (Tab:"SECTIONS"|"CLASSROOMS"|"SUBJECTS",item:any)=> {
    setIsDeletingModalOpen(true);
    setacademicTarget(item);
    return ;

  }
  const onTriggerDeleteAcademics = () => {
      if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      switch (activeTab?.toLocaleLowerCase()) {
        case 'sections':
          sendRequest(`/academics/delete/${selectedSchool?.id}/sections/${academicTarget?.id}/${'null'}/`,"DELETE",null as any ,TriggeredFunc,true,false);
          break;
        case 'subjects':
          sendRequest(`/academics/delete/${selectedSchool?.id}/subjects/${academicTarget?.id}/${'null'}/`,"DELETE",null as any ,TriggeredFunc,true,false);
          break;
        case 'classrooms' :
          sendRequest(`/academics/delete/${selectedSchool?.id}/classrooms/${academicTarget?.id}/${'null'}/`,"DELETE",null as any ,TriggerClassFunc,true,false);
          break;
      
        default:
          break;
      }
      return ;
    }
    setMethode("DELETE"),
    setShowPinModal(true);
  }

  const handleAddSection = () => {
    if (!sectionForm.name) return;
    let f = {school : selectedSchool.id ,name : sectionForm.name,pin : ''}
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      // setShowAddModal(false);
      sendRequest(`/academics/create/${activeTab?.toLowerCase()}/`,"POST",f as any ,TriggeredFunc,true,false);
      return ;
    }
    setServerform(f);
    setMethode("POST"),
    setShowPinModal(true)
  }

  const handleUpdateSectionName = () => {
    if (!editSectionTarget || !sectionForm.name) return;
    let f = {school : selectedSchool.id ,name   : sectionForm.name,pin : ''}
    
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/update/${activeTab?.toLowerCase()}/${editSectionTarget.id}/`,"PUT",f as any ,TriggeredFunc,true,false);
      return ;
    }
    setServerform(f)
    setMethode("PUT"),
    setShowPinModal(true)
  };

  const handleAddClass = () => {
    if (!classForm.name || !classForm.sectionId) return;
    let f = {
      school : selectedSchool.id ,
      name   : classForm.name,
      section : classForm?.sectionId,
      pin : ''}
    
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/create/classrooms/`,"POST",f as any ,TriggerClassFunc,true,false);
      return ;
    }

    setMethode("POST");
    setServerform(f);
    setShowPinModal(true)
  };

  const handleUpdateClass = () => {
    if (!editClassTarget || !editClassForm.name) return ;

    let f = {
      school : selectedSchool.id  ,
      name   : editClassForm.name ,
      pin : '' ,
    }
    
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/update/classrooms/${editClassTarget.id}/`,"PUT",f as any ,TriggerClassFunc,true,false);
      return ;
    }
    setServerform(f);
    setMethode("PUT");
    setShowPinModal(true)
  };

  const handleAddSubject = () => {
    if (!subjectForm.name || !subjectForm.code) return;
    let f ={
      school : selectedSchool.id ,
      name   : subjectForm.name,
      code   : subjectForm.code,
      credits : Number(subjectForm.credits),
      teachersIds : subjectForm.teachersIds,
      pin : ''
    };
    if (!currentUser?.user?.pin_set){ 
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/create/subjects/`,"POST",f as any ,TriggeredFunc,true,false);
      return ;
    }
    setServerform(f);
    setMethode("POST");
    setShowPinModal(true);
  };

  const handleUpdateSubject = () => {
    if (!editSubjectTarget || !editSubjectForm.name) return;
    let f = {
      school : selectedSchool.id ,
      name   : editSubjectForm.name,
      code   : editSubjectForm.code,
      credits : Number(editSubjectForm.credits),
      pin : ''
    }
    
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/update/${activeTab?.toLowerCase()}/${editSubjectTarget?.id}/`,"PUT",f as any ,TriggeredFunc,true,false);
      return ;
    }
    setServerform(f);
    setMethode("PUT");
    setShowPinModal(true);
  };

  const handleAddStudentsToClass = () => {
    if (!selectedItemId || selectedStudentIds.length === 0) return;
    let f= {
      school : selectedSchool.id ,
      targetClassId   : selectedItemId,
      studentIds : selectedStudentIds , 
      pin : ''
    }

    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/class/enrollment/`,"POST",f as any,TriggerClassFunc2,true,false);
      return ;
    }
    setMethode("ENROLLMENT");
    setServerform(f);
    setShowPinModal(true);
    return   ;
  };

  const handleTransferStudents = () => {
    if (!selectedItemId || !transferTargetClassId || selectedStudentIds.length === 0) return;
    let f={
      school : selectedSchool.id                  ,
      target_class_id   : transferTargetClassId   ,
      current_class_id   : selectedItemId         ,
      transfer_students_ids : selectedStudentIds  , 
      pin : ''
    }

    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/class/transfer/`,"PUT",f as any ,TriggerClassFunc2,true,false);
      return ;
    }
    setServerform(f);
    setMethode("TRANSFER");
    setShowPinModal(true);
    return     
  };

  const handleSubstituteSubject = () => {
    if (!selectedItemId || !selectedSubjectToAdd) return;

    let updatedSubjects = [...subjects];
    const oldSubjectId = currentContextData?.subjectId;
    const newSubjectId = selectedSubjectToAdd.id;
    const classId = selectedItemId;

    if (oldSubjectId && oldSubjectId !== newSubjectId) {
      updatedSubjects = updatedSubjects.map((s) =>
        s.id === oldSubjectId
          ? {
              ...s,
              classRoomIds: s.class_rooms.map((cls) => cls.class_room)?.filter((id) => id !== classId),
            }
          : s,
      );
    }

    updatedSubjects = updatedSubjects.map((s) => {
      if (s.id === newSubjectId) {
        const newClassIds = s.class_rooms.map((cls) => cls.class_room)?.includes(classId)
          ? s.class_rooms.map((cls) => cls.class_room)
          : [...s.class_rooms.map((cls) => cls.class_room), classId];
        const newAssignments = s.assignments
          ? [...s.assignments].filter((a) => a.classId !== classId)
          : [];
        if (selectedTeacherForSubject) {
          newAssignments.push({
            classId,
            teacherId: selectedTeacherForSubject,
          });
        }
        const newTeacherIds =
          selectedTeacherForSubject && !s.teacherIds.includes(selectedTeacherForSubject)
            ? [...s.teacherIds, selectedTeacherForSubject]
            : s.teacherIds;
        return {
          ...s,
          classRoomIds: newClassIds,
          teacherIds: newTeacherIds,
          assignments: newAssignments,
        };
      }
      return s;
    });

    setSubjects(updatedSubjects);
    setShowAddSubjectToClassModal(false);
    setSelectedSubjectToAdd(null);
    setSelectedTeacherForSubject("");
    setToast({
      message: "Subject assignment updated successfully.",
      type: "success",
    });
  };

  const confirmTeacherSelection = (teacherId: string) => {
    let classId =currentContextData.classId;
    let f = {
      school : selectedSchool.id  ,
      teacherId   : teacherId,
      pin : '' ,
    }
    
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/update/form_teacher/${classId}/`,"PUT",f as any ,TriggerClassFunc,true,false);
      return ;
    }
    setacademicTarget( {id:classId} ); 
    setServerform(f);
    setMethode("FORM_TEACHER");
    setShowPinModal(true)
  };

  const handleManageSubjectTeachers = (ids: string[]) => {
    console.log('ids: ', ids);
    if (!currentContextData?.subjectId) return;
    setCurrentContextData({
    ...currentContextData,
    selectedIds: ids
      });
  };
  
  const saveManageSubjectTeachers = (ids: string[]) => {
    if (!currentContextData?.subjectId) return;
    let f= {
      school : selectedSchool.id ,
      teachers   : ids ,
      pin : ''
    }
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/academics/update/${activeTab?.toLowerCase()}/${editSectionTarget?.id}/`,"PUT",f as any,TriggeredFunc,true,false);
      return ;
    }
    setServerform(f) ;
    setMethode("PUT");
    setShowPinModal(true) ;
  };

  const handleSaveClassAssignments = () => {
    if (!selectedSubjectForClass) return;
    const newClassIds = classSelectState.filter((s) => s.isSelected).map((s) => s.classId);
    let f= {
      school : selectedSchool.id ,
      class_room_ids   : newClassIds,
      pin : ''
    }
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`academics/update/${activeTab?.toLowerCase()}/${editSectionTarget?.id}/`,"PUT",f as any,TriggeredFunc,true,false);
      return ;
    }
    setServerform(f);
    setMethode("PUT");
    setShowPinModal(true) ;
  }

  return (
    <div className="animate-fadeIn space-y-6">

      {/* Header */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Academic Management</h2>
            <p className="text-sm text-gray-500 flex items-center gap-3 mt-1">
              <span>
                <i className="fa-solid fa-calendar mr-1"></i> {currentSession}
              </span>
              <span>
                <i className="fa-solid fa-flag mr-1"></i> {currentTerm}
              </span>
            </p>
          </div>
        </div>
        {viewMode === "LIST" && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex p-1 bg-gray-100 rounded-lg w-full md:w-auto">
              {[
                {id: "SECTIONS", label: "Sections", count: sections.length},
                {id: "CLASSROOMS",label: "Classes",count: classRooms.length},
                {id: "SUBJECTS", label: "Subjects", count: subjects.length},
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-md transition-all ${activeTab === tab.id ? "bg-navy-900 text-white shadow-md" : "text-gray-500 hover:text-navy-700 hover:bg-gray-200"}`}
                >
                  {tab.label}{" "}
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-80">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder={`Search ${activeTab.toLowerCase()}...`}
                className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-navy-900 shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button className="w-auto max-w-fit px-6 py-3" disabled={isLoading}  onClick={() => setShowAddModal(true)}>
              <i className="fa-solid fa-plus mr-2"></i> Add New
            </Button>
          </div>
        )}
      </div>

      {/* List/Detail Views */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
        {viewMode === "DETAIL" && (
          <button
            onClick={() => {
              setViewMode("LIST");
              setSelectedItemId(null);
            }}
            className="mb-4 text-sm text-gray-500 hover:text-navy-900 flex items-center"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> Back to {activeTab.toLowerCase()}
          </button>
        )}

        {activeTab === "SECTIONS" && (
          <SectionView
            sections={sections}
            classRooms={classRooms}
            students={students}
            teachers={teachers}
            subjects={subjects}
            searchQuery={searchQuery}
            viewMode={viewMode}
            selectedId={selectedItemId}
            onSelectItem={(id, view) => {
              setSelectedItemId(id);
              setViewMode(view);
            }}
            onEditSection={(s: any ) => {
              setEditSectionTarget(s);
              setSectionForm({name: s.name});
            }}
            onSetTimetableTarget={(t) => {
              setTimetableTarget(t);
              setShowTimetableModal(true);
            }}
            onShowReportModal={(d, t, title) =>
              setReportModalData({isOpen: true, data: d, type: t, title})
            }
            onNavigateToClass={(id) => {
              setActiveTab("CLASSROOMS");
              setSelectedItemId(id);
              setViewMode("DETAIL");
            }}
            onDeleteAcademics={deleteAcademics}
          />
        )}

        {activeTab === "CLASSROOMS" && (
          <ClassView
            showAddStudentModal={showAddStudentModal} 
            setShowAddStudentModal={ setShowAddStudentModal}
            selectedStudentIds={selectedStudentIds} 
            setSelectedStudentIds={setSelectedStudentIds}
            showTransferModal={showTransferModal} 
            setShowTransferModal={setShowTransferModal}
            transferTargetClassId={transferTargetClassId}
            setTransferTargetClassId={setTransferTargetClassId}
            handleAddStudentsToClass={handleAddStudentsToClass}
            handleTransferStudents={handleTransferStudents}


            searchQuery={searchQuery}
            viewMode={viewMode}
            selectedId={selectedItemId}
            currentSession={currentSession}
            currentTerm={currentTerm}
            currentTime={currentTime}
            selectedCls={selectedCls}
            setSelectedCls={setSelectedCls}
            onSelectItem={(id, view) => { 
              setSelectedItemId(id) ;
              setViewMode(view);
             }}
            onEditClass={(c) => {
              setEditClassTarget(c);
              setEditClassForm({name: c.name, sectionId:c.sectionId});
            }}
            onSetTimetableTarget={(t) => {
              setTimetableTarget(t);
              setShowTimetableModal(true);
            }}
            onShowReportModal={(d, t, title) =>
              setReportModalData({isOpen: true, data: d, type: t, title})
            }
            onShowAddStudent={setShowAddStudentModal}
            onAddSubject={() => {
              setCurrentContextData(null);
              setShowAddSubjectToClassModal(true);
            }}
            onNavigateToStudent={onNavigateToStudent}
            onManageMaster={(c:any) => {
              setTeacherSelectMode("CLASS_MASTER");
              setCurrentContextData({classId: c.id});
              setShowTeacherSelectModal(true);
              let tcr = c?.form_teacher ;
              setTeacherSearch(tcr? `${tcr.title} ${tcr.first_name} ${tcr.last_name}` : "")
            }}
            onInitiateSubstitute={(sub, cId) => {
              setCurrentContextData({subjectId: sub.id, classId: cId});
              setSelectedSubjectToAdd(sub);
              setShowAddSubjectToClassModal(true);
            }}
            onTransferStudents={() => {
              setSelectedStudentIds([]);
              setShowTransferModal(true);
            }}
            onNavigateToSubject={(id) => {
              setActiveTab("SUBJECTS");
              setSelectedItemId(id);
              setViewMode("DETAIL");
            }}
            onDeleteAcademics={deleteAcademics}
          />
        )}

        {activeTab === "SUBJECTS" && (
          <SubjectView
            subjects={subjects}
            classRooms={classRooms}
            teachers={teachers}
            students={students}
            searchQuery={searchQuery}
            viewMode={viewMode}
            selectedId={selectedItemId}
            onSelectItem={(id, view) => {
              setSelectedItemId(id);
              setViewMode(view);
            }}
            onEditSubject={(s : any ) => {
              setEditingClass(true);
              setEditSubjectTarget(s);
              setEditSubjectForm({name: s.name, code: s.code,credits:s?.credits});
            }}
            onAssignClass={(s) => {
              setSelectedSubjectForClass(s);
              setEditingClass(false);
              setEditSubjectTarget(s);
              setShowClassSelectModal(true);
            }}
            onAssignTeacher={(s  : any) => {
              setTeacherSelectMode("ADD_TO_SUBJECT");
              setEditSubjectTarget(s);
              setEditingClass(false);
              setCurrentContextData({
                subjectId: s.id,
                selectedIds: s?.teachers,
              });
              setShowTeacherSelectModal(true);
            }}
            onDeleteAcademics={deleteAcademics}
          />
        )}
      </div>

      {/* Adding New Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={`Add New ${activeTab.slice(0, -1).toLowerCase()}`}
        icon="fa-solid fa-plus"
      >
        {activeTab === "SECTIONS" && (
          <div className="space-y-4">
            <Input
              label="Section Name"
              placeholder="section name (e.g Primary)"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({name: e.target.value})}
              iconClass="fa-solid fa-layer-group"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" disabled={isLoading} onClick={() => setShowAddModal(false)} className="w-auto">
                Cancel
              </Button>
              {<Button disabled={isLoading} onClick={handleAddSection} className="w-auto">
                Add
              </Button>}
            </div>
          </div>
        )}
        {activeTab === "CLASSROOMS" && (
          <div className="space-y-4">
            <Input
              label="Class Name"
              placeholder="e.g Primary 1"
              value={classForm.name}
              onChange={(e) => setClassForm({...classForm, name: e.target.value})}
              iconClass="fa-solid fa-chalkboard"
            />
            <div>
              <label className="block text-sm font-semibold text-navy-800 mb-1.5">Section</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md"
                value={classForm.sectionId}
                onChange={(e) => setClassForm({...classForm, sectionId: e.target.value})}
              >
                <option value="">Select Section</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-auto">
                Cancel
              </Button>
              { <Button disabled={isLoading} onClick={handleAddClass} className="w-auto">
                Add
              </Button>}
            </div>
          </div>
        )}
        {activeTab === "SUBJECTS" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Name"
                placeholder="subject name (e.g English)"
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                iconClass="fa-solid fa-book"
              />
              <Input
                label="Code"
                placeholder="subject code (e.g ENG1)"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})}
                iconClass="fa-solid fa-barcode"
              />
              <Input
                label="Credits (e.g 3hours/Week)"
                placeholder="subject teaching duration in a week (e.g periods per week)"
                value={subjectForm.credits}
                onChange={(e) => setSubjectForm({...subjectForm, credits: e.target.value})}
                iconClass="fa-solid fa-barcode"
              />
            </div>
            <MultiSelectGrid
              label="Teachers if available you can assign after saveing"
              items={teachers}
              selectedIds={subjectForm.teachersIds}
              onChange={(ids) => setSubjectForm({...subjectForm, teachersIds: ids})}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-auto">
                Cancel
              </Button>
              { <Button disabled={isLoading}  onClick={handleAddSubject} className="w-auto">
                Add
              </Button>}
            </div>
          </div>
        )}
      </Modal>

      {/* Editing Modals */}
      {editSectionTarget && (
        <Modal
          isOpen={!!editSectionTarget}
          onClose={() => setEditSectionTarget(null)}
          title="Edit Section"
          icon="fa-solid fa-pen-to-square"
        >
          <div className="space-y-4">
            <Input
              label="Section Name"
              placeholder="section name (e.g primary)"
              value={sectionForm.name}
              onChange={(e) => setSectionForm({name: e.target.value})}
              iconClass="fa-solid fa-layer-group"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setEditSectionTarget(null)}
                className="w-auto"
              >
                Cancel
              </Button>
              { <Button disabled={isLoading} onClick={handleUpdateSectionName} className="w-auto">
                Update
              </Button>}
            </div> 
          </div>
        </Modal>
      )}

      {(editSubjectTarget && editingClass) && (
        <Modal
          isOpen={!!editSubjectTarget}
          onClose={() => setEditSubjectTarget(null)}
          title="Edit Subject Details"
          icon="fa-solid fa-pen-to-square"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Subject Name"
                placeholder="(e.g English))"
                value={editSubjectForm.name}
                onChange={(e) =>
                  setEditSubjectForm({
                    ...editSubjectForm,
                    name: e.target.value,
                  })
                }
                iconClass="fa-solid fa-book"
              />
              <Input
                label="Subject Code"
                placeholder="e.g ENG1"
                value={editSubjectForm.code}
                onChange={(e) =>
                  setEditSubjectForm({
                    ...editSubjectForm,
                    code: e.target.value,
                  })
                }
                iconClass="fa-solid fa-barcode"
              />
              <Input
                label="Credits (e.g 3hours/Week)"
                placeholder="subject teaching duration in a week (e.g periods per week)"
                onChange={(e) => setEditSubjectForm({...subjectForm, credits: e.target.value})}
                iconClass="fa-solid fa-barcode"
                value={editSubjectForm?.credits}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setEditSubjectTarget(null)}
                className="w-auto"
              >
                Cancel
              </Button>
              {<Button disabled={isLoading} onClick={handleUpdateSubject} className="w-auto">
                Update Subject
              </Button>}
            </div>
          </div>
        </Modal>
      )}

      {editClassTarget && (
        <Modal
          isOpen={!!editClassTarget}
          onClose={() => setEditClassTarget(null)}
          title="Edit Class Details"
          icon="fa-solid fa-pen-to-square"
        >
          <div className="space-y-4">
            <Input
              label="Class Name"
              placeholder="e.g Primary 1"
              value={editClassForm.name}
              onChange={(e) => setEditClassForm({...editClassForm, name: e.target.value})}
              iconClass="fa-solid fa-chalkboard"
            />
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditClassTarget(null)} className="w-auto">
                Cancel
              </Button>
              {<Button disabled={isLoading} onClick={handleUpdateClass} className="w-auto">
                Update Class
              </Button>}
            </div>
          </div>
        </Modal>
      )}

      {/* SUBSTITUTE / ASSIGN TEACHER MODAL (Combined Flow) */}
      <Modal
        isOpen={showAddSubjectToClassModal}
        onClose={() => {
          setShowAddSubjectToClassModal(false);
          setSelectedSubjectToAdd(null);
          setSelectedTeacherForSubject("");
        }}
        title="Substitute or Assign Subject"
        icon="fa-solid fa-book-medical"
      >
        <div className="space-y-6">
          {/* Step 1: Subject Selection */}
          {!selectedSubjectToAdd ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Select a subject. You can choose the current subject to just assign a teacher, or a
                different one to substitute.
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                {(subjects.length !== 0) && subjects.map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubjectToAdd(sub)}
                    className={`p-3 border rounded cursor-pointer flex justify-between items-center transition-all ${currentContextData?.subjectId === sub.id ? "border-navy-900 bg-navy-50 ring-1 ring-navy-900" : "border-gray-200 hover:bg-gray-50"}`}
                  >
                    <div>
                      <p className="font-bold text-navy-900 text-sm">{sub.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{sub.code}</p>
                    </div>
                    {currentContextData?.subjectId === sub.id && (
                      <span className="text-[10px] bg-navy-900 text-white px-2 py-0.5 rounded">
                        Current
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Step 2: Teacher Selection
            <div className="space-y-4 animate-fadeIn">
              <button
                onClick={() => {
                  setSelectedSubjectToAdd(null);
                  setSelectedTeacherForSubject("");
                }}
                className="text-xs text-navy-600 hover:underline mb-2"
              >
                <i className="fa-solid fa-arrow-left mr-1"></i> Back to Subjects
              </button>
              <div className="p-3 bg-navy-50 rounded border border-navy-100 mb-4">
                <p className="text-xs font-bold text-navy-500 uppercase">Selected Subject</p>
                <p className="text-lg font-bold text-navy-900">
                  {selectedSubjectToAdd.name}{" "}
                  <span className="text-sm font-normal text-gray-600">
                    ({selectedSubjectToAdd.code})
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                  Assign Teacher
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-md"
                  value={selectedTeacherForSubject}
                  onChange={(e) => setSelectedTeacherForSubject(e.target.value)}
                >
                  <option value="">Select Teacher (Optional)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.first_name} {t.last_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  If left blank, the subject will be assigned without a specific teacher.
                </p>
              </div>
              <div className="flex justify-end pt-4">
                <Button disabled={isLoading}  onClick={handleSubstituteSubject}>Confirm Assignment</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Teachers  Select Modal (General) */}
      <Modal
        isOpen={showTeacherSelectModal}
        onClose={() => setShowTeacherSelectModal(false)}
        title={
          teacherSelectMode === "SUBSTITUTE"
            ? "Assign Teacher"
            : teacherSelectMode === "CLASS_MASTER"
              ? "Assign Form Teacher"
              : "Manage Subject Teachers"
        }
        icon="fa-solid fa-user-check"
      >
        {teacherSelectMode === "ADD_TO_SUBJECT" ? (
          <div className="space-y-4">
            <MultiSelectGrid
              label="Select Teachers (Add/Remove)"
              items={teachers.map((t) => ({
                id: t.id,
                name: `${t.title} ${t.first_name} ${t.last_name}`,
              }))}
              selectedIds={currentContextData?.selectedIds || []}
              onChange={(ids) => handleManageSubjectTeachers(ids)}
            />
            <div className="flex justify-end">
              <Button
                disabled={isLoading}
                onClick={() => saveManageSubjectTeachers(currentContextData?.selectedIds || [])}>
                Save Teachers
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Search teacher..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-navy-500"
                value={teacherSearch}
                onChange={(e) => setTeacherSearch(e.target.value)}
              />
            </div>
            <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">
              {
                filteredTeachers?.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setShowClassMasterConfirmModal(true);
                      setClassMasterPendingId(t.id) ;
                    }}
                    className="flex items-center justify-between p-3 border-b border-gray-50 cursor-pointer hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700">
                        {t?.first_name[0]}
                        {t?.last_name[0]}
                      </div>
                      <div>
                        <div className="">
                          <p className="text-sm font-bold text-navy-900">
                            {t.title} {t.first_name} {t.last_name} 
                          </p>
                          <p className="text-xs text-gray-500">
                            {t.staff_id}
                          </p>
                        </div>
                      </div>
                    </div>
                    <i className="fa-solid fa-check text-green-300"></i>
                  </div>
                ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Custom Manage Class Modal (Manual Save) */}
      <Modal
        isOpen={showClassSelectModal}
        onClose={() => setShowClassSelectModal(false)}
        title="Manage Class Assignments"
        icon="fa-solid fa-chalkboard"
      >
        {selectedSubjectForClass && (
          <div className="space-y-4">
            <div className="bg-navy-50 p-2 rounded text-xs text-navy-700 border border-navy-100 mb-2">
              Select classes to enroll in <b>{selectedSubjectForClass.name}</b> and assign a
              specific teacher if needed.
            </div>
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg divide-y divide-gray-100">
              {classSelectState.map((item, idx) => {
                const cls = classRooms.find((c) => c.id === item.classId);
                if (!cls) return null;
                return (
                  <div
                    key={item.classId}
                    className={`p-3 transition-colors ${item.isSelected ? "bg-white" : "bg-gray-50 opacity-70 hover:opacity-100"}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isSelected}
                          onChange={() =>
                            setClassSelectState((prev) =>
                              prev.map((i) =>
                                i.classId === item.classId ? {...i, isSelected: !i.isSelected} : i,
                              ),
                            )
                          }
                          className="w-4 h-4 text-navy-900 rounded border-gray-300 focus:ring-navy-900"
                        />
                        <span
                          className={`ml-2 text-sm font-bold ${item.isSelected ? "text-navy-900" : "text-gray-500"}`}
                        >
                          {cls.name}
                        </span>
                      </label>
                    </div>
                    {item.isSelected && (
                      <div className="pl-6 animate-fadeIn">
                        <select
                          value={item.teacherId}
                          onChange={(e) =>
                            setClassSelectState((prev) =>
                              prev.map((i) =>
                                i.classId === item.classId ? {...i, teacherId: e.target.value} : i,
                              ),
                            )
                          }
                          className="w-full text-xs p-2 border border-gray-300 rounded bg-white"
                        >
                          <option value="">Select Teacher (Default)</option>
                          {teachers.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title} {t.first_name} {t.last_name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end pt-4 gap-2 border-t border-gray-100">
              <Button variant="outline" onClick={() => setShowClassSelectModal(false)}>
                Cancel
              </Button>
              {<Button disabled={isLoading}  onClick={handleSaveClassAssignments}>Save Assignments</Button>}
            </div>
          </div>
        )}
      </Modal>

      {/* Deleting Academics Modal  */}
      <Modal isOpen={isDeletingModalOpen} onClose={() => {setIsDeletingModalOpen(false);  }} title={`${activeTab} Deletion`} size="md">
            <div className="space-y-4">
                <p className=" bg-red-50 p-2 text-sm text-red-600 rounded-md ">{
                  `Please confirm ${activeTab?.toLocaleLowerCase()} delete action.This action is irreversible and will disconnect all the connection from the deleted item.`
              } </p>
                <div className="flex justify-end gap-3">
                    <Button isLoading={isLoading}  variant="secondary" onClick={() => setIsDeletingModalOpen(false)}>Cancel</Button>
                    <Button 
                        isLoading={isLoading}
                        onClick={() => {
                          onTriggerDeleteAcademics() ;
                          setIsDeletingModalOpen(false);

                        }}
                        className="bg-red-600 text-white"
                      >
                        Confirm Deleting
                    </Button>
                 </div>
            </div>
      </Modal>
              {/* Class master Assignment confirmation modal  Modal  */}
      <Modal isOpen={showClassMasterConfirmModal} onClose={() => {setShowClassMasterConfirmModal(false);  }} title={`Confirm ClassMaster Assignment`} size="md">
            <div className="space-y-4">
                <p className=" bg-green-100 p-4 text-sm text-green-600 rounded-md ">{
                  `Please confirm Assigning Class Form Master.`
              } </p>
                <div className="flex justify-end gap-3">
                    <Button isLoading={isLoading}  variant="secondary" onClick={() => setShowClassMasterConfirmModal(false)}>Cancel</Button>
                    <Button 
                        isLoading={isLoading}
                        
                        onClick={() => {
                          if (!classMasterPendingId ){ return setToast({message:'invalid selection ', type: "error"})}
                          confirmTeacherSelection(classMasterPendingId as string) ;
                          setShowClassMasterConfirmModal(false);
                        }}
                        className="bg-red-600 text-white"
                      >
                        Confirm 
                    </Button>
                 </div>
            </div>
      </Modal>

      {/* Timetable & Report */}
      <TimetableModal
        isOpen={showTimetableModal}
        onClose={() => setShowTimetableModal(false)}
        target={timetableTarget}
        currentSession={currentSession}
        currentTerm={currentTerm}
      />

      <UnifiedExportModal
        isOpen={reportModalData.isOpen}
        onClose={() => setReportModalData({...reportModalData, isOpen: false})}
        data={reportModalData.data}
        type={reportModalData.type as "STUDENT" | "TEACHER" | "CLASS"}
        title={reportModalData.title}
      />
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={(pins) => handlePinSuccess(pins)}
        title="Authorize Action"
      />
    </div>
  );
};
