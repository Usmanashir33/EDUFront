import React, {useState, useEffect, useContext} from "react";
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
  onLogActivity: (
    action: ActivityLog["action"],
    module: ActivityLog["module"],
    description: string,
  ) => void;
  onNavigateToStudent?: (studentId: string) => void;
}

type Tab = "SECTIONS" | "CLASSROOMS" | "SUBJECTS";
type ViewMode = "LIST" | "DETAIL";
type OperationMode = "POST" | "DELETE" | "PUT" | "GET" | "TRANSFER";

export const AcademicManager: React.FC<AcademicManagerProps> = ({
  onLogActivity,
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

  const {
    students,
    setStudents, // students data
    teachers,
    setTeachers, // teachers data
    staff,
    setStaff, // staff data
    sections,
    setSections, // sections data
    classRooms,
    setClassRooms, // classRooms data
    subjects,
    setSubjects, // subjects data
    selectedSchool,isLoading, setToast
  } = useContext(uiContext);
  const {currentUser} = useContext(authContext);

  // Add/Edit Forms
  const [sectionForm, setSectionForm] = useState({name: ""});
  const [classForm, setClassForm] = useState({name: "", sectionId: ""});
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    credits : "",
    classRoomIds: [] as string[],
  });

  // Edit Targets
  const [editSectionTarget, setEditSectionTarget] = useState<SchoolSection | null>(null);
  const [editClassTarget, setEditClassTarget] = useState<ClassRoom | null>(null);
  const [editClassForm, setEditClassForm] = useState({
    name: "",
    classTeacherId: "",
  });
  const [editSubjectTarget, setEditSubjectTarget] = useState<Subject | null>(null);
  const [editSubjectForm, setEditSubjectForm] = useState({
    name: "",
    code: "",
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
  const [studentSearch, setStudentSearch] = useState("");
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
  const [selectedSubjectForClass, setSelectedSubjectForClass] = useState<Subject | null>(null);
  const [classSelectState, setClassSelectState] = useState<
    {classId: string; teacherId: string; isSelected: boolean}[]
  >([]);

  const [showAddSubjectToClassModal, setShowAddSubjectToClassModal] = useState(false);
  const [selectedSubjectToAdd, setSelectedSubjectToAdd] = useState<Subject | null>(null);
  const [selectedTeacherForSubject, setSelectedTeacherForSubject] = useState<string>("");
  const [subjectTeacherIds,setSubjectTeacherIds] = useState([])
  const [serverForm,setServerform] = useState({})
  const {sendRequest} = useRequest()

  const [showPinModal, setShowPinModal] = useState(false);
  
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
    setSubjectForm({name: "", code: "", classRoomIds: []});
    setServerform({});
  };

  const TriggeredFunc = (data) => { // 
    console.log('data: ', data);
    if (data?.new_section){ // process new section 
      setSections([data?.new_section , ...sections ]);
      onLogActivity("CREATE", "ACADEMICS", `Created section: ${sectionForm.name}`);
      resetForms();
      setToast({message: "Section Added", type: "success"});
    }else if (data?.new_classroom){ // process new classroom 
      setClassRooms([data?.new_classroom, ...classRooms]);
      onLogActivity("CREATE", "ACADEMICS", `Created class: ${classForm.name}`);
      resetForms();
      setShowAddModal(false);
      resetForms();
      setToast({message: "New Classroom dded", type: "success"});
    }else if (data?.new_subject){ // process new subject 
      setSubjects([data?.new_subject,...subjects]);
      onLogActivity("CREATE", "ACADEMICS", `Created subject: ${subjectForm.name}`);
      resetForms();
      setShowAddModal(false);
      setToast({message: "New Subject added", type: "success"});
    }else if (data?.updated_section){ // update new section 
      setSections(
      sections.map((s) => (s.id === editSectionTarget.id ? data?.updated_section : s)),
      );
      onLogActivity("UPDATE", "ACADEMICS", `Renamed section to: ${sectionForm.name}`);
      setEditSectionTarget(null);
      resetForms();
      setToast({message: "Section renamed", type: "success"});
    }else if (data?.updated_classroom){ // update classroom 
      setClassRooms(
      classRooms.map((c) =>
        c.id === editClassTarget.id
          ? data?.updated_classroom
          : c,
      ),
    );
    onLogActivity("UPDATE", "ACADEMICS", `Updated class: ${editClassForm.name}`);
    setEditClassTarget(null);
    setToast({message: "Class updated", type: "success"});
    }else if (data?.updated_subject){ // update subject
      setSubjects(
      subjects.map((s) =>
        s.id === editSubjectTarget.id
          ? data?.updated_subject          : s,
      ),
    );
    onLogActivity("UPDATE", "ACADEMICS", `Updated subject: ${editSubjectForm.name}`);
    setEditSubjectTarget(null);
    setShowClassSelectModal(false);   // for managing subjects data 
    setSelectedSubjectForClass(null); // for managing subjects data 
    setShowTeacherSelectModal(false); // for managing subjects data 
    setToast({message: "Subject updated", type: "success"});
  }else if (data?.trans_students){ // students Transferred 
    setStudents(
      students.map((s) =>
        data?.trans_students?.map(stu => stu.id).includes(s.id)? data?.trans_students.find(id=> id = s.id) : s,
      ),
    );
    onLogActivity("UPDATE", "ACADEMICS", `Transferred students`);
    setShowTransferModal(false); // ffor transfering students between classes
    setShowAddStudentModal(false); // for add students to class
    setTransferTargetClassId("");
    setSelectedStudentIds([]);
    setStudentSearch("");
    setToast({message: "Transferred/Enrolled successfully", type: "success"});
  }
  }

  const handlePinSuccess = (pins:string) => {
    let form = serverForm
    console.log('form: ', form);
    form.pin = pins
    setShowAddModal(false);
    setShowPinModal(false); 
    // call the api here 
    if (methode === "POST"){
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/`,"POST",form,TriggeredFunc,true,false)
    } else if (methode === 'PUT'){
      console.log('activeTab: ', activeTab);
      let item_id = activeTab === "SECTIONS" ? editSectionTarget.id :
                    activeTab === "CLASSROOMS"? editClassTarget?.id :
                    activeTab === "SUBJECTS"? editSubjectTarget?.id : null 
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/${item_id}/`,"PUT",form,TriggeredFunc,true,false)
    }else if (methode === "TRANSFER"){ // transfering students between classes
        sendRequest(`/director/class/transfer/`,"PUT",form,TriggeredFunc,true,false)
    }
    return 
  }
  const handleAddSection = () => {
    if (!sectionForm.name) return;
    setMethode("POST"),
    setServerform({school : selectedSchool.id ,name   : sectionForm.name,pin : ''})
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      setShowAddModal(false);
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/`,"POST",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
  }
  const handleUpdateSectionName = () => {
    if (!editSectionTarget || !sectionForm.name) return;
    setMethode("PUT"),
    setServerform({school : selectedSchool.id ,name   : sectionForm.name,pin : ''})
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/${editSectionTarget.id}/`,"PUT",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
  };

  const handleAddClass = () => {
    if (!classForm.name || !classForm.sectionId) return;
    setMethode("POST"),
    setServerform({
      school : selectedSchool.id ,
      name   : classForm.name,
      section : classForm?.sectionId,
      pin : ''})
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      setShowAddModal(false);
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/`,"POST",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
  };

  const handleUpdateClass = () => {
    if (!editClassTarget || !editClassForm.name) return;
    setMethode("PUT"),
    setServerform({
      school : selectedSchool.id ,
      name   : editClassForm.name,
      form_teacher : editClassForm?.classTeacherId,
      pin : ''}) 
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/${editClassTarget.id}/`,"PUT",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
  };

  const handleAddSubject = () => {
    if (!subjectForm.name || !subjectForm.code) return;
    setMethode("POST"),
    setServerform({
      school : selectedSchool.id ,
      name   : subjectForm.name,
      code   : subjectForm.code,
      credits : subjectForm.credits,
      class_room_ids : subjectForm.classRoomIds,
      pin : ''})
    if (!currentUser?.user?.pin_set){ 
      // Make the api call here  when user  need no pin to talk to server 
      setShowAddModal(false);
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/`,"POST",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
  };

  const handleUpdateSubject = () => {
    if (!editSubjectTarget || !editSubjectForm.name) return;
    setMethode("PUT"),
    setServerform({
      school : selectedSchool.id ,
      name   : editSubjectForm.name,
      code   : editSubjectForm.code,
      pin : ''}) 
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/${editSubjectTarget?.id}/`,"PUT",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
  };

  const handleAddStudentsToClass = () => {
    if (!selectedItemId || selectedStudentIds.length === 0) return;
    setMethode("TRANSFER"),
    setServerform({
      school : selectedSchool.id,
      target_class_id   : selectedItemId,
      // current_class_id   : selectedItemId,
      transfer_students_ids : selectedStudentIds , 
      pin : ''})

    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/director/class/transfer/`,"PUT",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
    return     
  };

  const handleTransferStudents = () => {
    if (!selectedItemId || !transferTargetClassId || selectedStudentIds.length === 0) return;
    setMethode("TRANSFER"),
    setServerform({
      school : selectedSchool.id                  ,
      target_class_id   : transferTargetClassId   ,
      current_class_id   : selectedItemId         ,
      transfer_students_ids : selectedStudentIds  , 
      pin : ''})

    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/director/class/transfer/`,"PUT",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
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
    onLogActivity("UPDATE", "ACADEMICS", `Updated subject assignment for class ${classId}`);
    setShowAddSubjectToClassModal(false);
    setSelectedSubjectToAdd(null);
    setSelectedTeacherForSubject("");
    setToast({
      message: "Subject assignment updated successfully.",
      type: "success",
    });
  };

  const confirmTeacherSelection = (teacherId: string) => {
    if (teacherSelectMode === "ADD_TO_SUBJECT") {
      setSubjects(
        subjects.map((s) =>
          s.id === currentContextData.subjectId
            ? {...s, teacherIds: [...(s.teacherIds || []), teacherId]}
            : s,
        ),
      );
      setToast({message: "Teacher added to subject.", type: "success"});
    } else if (teacherSelectMode === "CLASS_MASTER") {
      setClassRooms(
        classRooms.map((c) =>
          c.id === currentContextData.classId ? {...c, classTeacherId: teacherId} : c,
        ),
      );
      setToast({message: "Class Master assigned.", type: "success"});
    }
    setShowTeacherSelectModal(false);
    setCurrentContextData(null);
    setTeacherSearch("");
  };

  const handleManageSubjectTeachers = (ids: string[]) => {
    if (!currentContextData?.subjectId) return;
    setCurrentContextData({
    ...currentContextData,
    selectedIds: ids
      });
    // setSubjects(
    //   subjects.map((s) => (s.id === currentContextData.subjectId ? {...s, teacherIds: ids} : s)),
    // );
    // setShowTeacherSelectModal(false);
    // setToast({message: "Teacher list updated.", type: "success"});
  };
  
  const saveManageSubjectTeachers = (ids: string[]) => {
    if (!currentContextData?.subjectId) return;
    setMethode("PUT");
    const newClassIds = classSelectState.filter((s) => s.isSelected).map((s) => s.classId);
    console.log('newClassIds: ', newClassIds);
    setServerform({
      school : selectedSchool.id ,
      teachers   : ids ,
      pin : ''}) 
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/${editSectionTarget?.id}/`,"PUT",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
  
  };

  const handleSaveClassAssignments = () => {
    if (!selectedSubjectForClass) return;
    setMethode("PUT");
    const newClassIds = classSelectState.filter((s) => s.isSelected).map((s) => s.classId);
    setServerform({
      school : selectedSchool.id ,
      class_room_ids   : newClassIds,
      pin : ''}) 
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server 
      sendRequest(`/director/academics/${activeTab?.toLowerCase()}/${editSectionTarget?.id}/`,"PUT",serverForm,TriggeredFunc,true,false)
    }
    setShowPinModal(true)
    // const newAssignments = classSelectState
    //   .filter((s) => s.isSelected && s.teacherId)
    //   .map((s) => ({classId: s.classId, teacherId: s.teacherId}));

    // setSubjects(
    //   subjects.map((s) =>
    //     s.id  ===  selectedSubjectForClass.id
    //       ? {...s, classRoomIds: newClassIds, assignments: newAssignments}
    //       : s,
    //   ),
    // );
    // onLogActivity(
    //   "UPDATE",
    //   "ACADEMICS",
    //   `Updated enrolled classes/teachers for ${selectedSubjectForClass.name}`,
    // );
    // setShowClassSelectModal(false);
    // setSelectedSubjectForClass(null);
    // setToast({message: "Assignments saved.", type: "success"});
  };

  return (
    <div className="animate-fadeIn space-y-6">
      {/* {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />} */}

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
                {
                  id: "CLASSROOMS",
                  label: "Classes",
                  count: classRooms.length, 
                },
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
            <Button className="w-auto px-6 py-3" onClick={() => setShowAddModal(true)}>
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
            onEditSection={(s) => {
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
          />
        )}

        {activeTab === "CLASSROOMS" && (
          <ClassView
            classRooms={classRooms}
            students={students}
            subjects={subjects}
            teachers={teachers}
            searchQuery={searchQuery}
            viewMode={viewMode}
            selectedId={selectedItemId}
            currentSession={currentSession}
            currentTerm={currentTerm}
            currentTime={currentTime}
            onSelectItem={(id, view) => {
              setSelectedItemId(id);
              setViewMode(view);
            }}
            onEditClass={(c) => {
              setEditClassTarget(c);
              setEditClassForm({
                name: c.name,
                sectionId: c.sectionId,
                classTeacherId: c.classTeacherId || "",
              });
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
            onManageMaster={(c) => {
              setTeacherSelectMode("CLASS_MASTER");
              setCurrentContextData({classId: c.id});
              setShowTeacherSelectModal(true);
              let tcr = teachers.find(teacher => teacher.id == c.form_teacher)
              setTeacherSearch(tcr? `${tcr.first_name} ${tcr.last_name}` : "")
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
            onEditSubject={(s) => {
              setEditingClass(true);
              setEditSubjectTarget(s);
              setEditSubjectForm({name: s.name, code: s.code});
            }}
            onAssignClass={(s) => {
              setSelectedSubjectForClass(s);
              setEditingClass(false);
              setEditSubjectTarget(s);
              setShowClassSelectModal(true);
            }}
            onAssignTeacher={(s) => {
              setTeacherSelectMode("ADD_TO_SUBJECT");
              setEditSubjectTarget(s);
              setEditingClass(false);
              setCurrentContextData({
                subjectId: s.id,
                selectedIds: s.teacher,
              });
              setShowTeacherSelectModal(true);
            }}
          />
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Add New Modal */}
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
              value={sectionForm.name}
              onChange={(e) => setSectionForm({name: e.target.value})}
              iconClass="fa-solid fa-layer-group"
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-auto">
                Cancel
              </Button>
              {!isLoading && <Button onClick={handleAddSection} className="w-auto">
                Add
              </Button>}
            </div>
          </div>
        )}
        {activeTab === "CLASSROOMS" && (
          <div className="space-y-4">
            <Input
              label="Class Name"
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
              {!isLoading && <Button onClick={handleAddClass} className="w-auto">
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
                value={subjectForm.name}
                onChange={(e) => setSubjectForm({...subjectForm, name: e.target.value})}
                iconClass="fa-solid fa-book"
              />
              <Input
                label="Code"
                value={subjectForm.code}
                onChange={(e) => setSubjectForm({...subjectForm, code: e.target.value})}
                iconClass="fa-solid fa-barcode"
              />
              <Input
                label="Credits (e.g 3/W)"
                value={subjectForm.credits}
                onChange={(e) => setSubjectForm({...subjectForm, credits: e.target.value})}
                iconClass="fa-solid fa-barcode"
              />
            </div>
            <MultiSelectGrid
              label="Classes"
              items={classRooms}
              selectedIds={subjectForm.classRoomIds}
              onChange={(ids) => setSubjectForm({...subjectForm, classRoomIds: ids})}
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setShowAddModal(false)} className="w-auto">
                Cancel
              </Button>
              {!isLoading && <Button onClick={handleAddSubject} className="w-auto">
                Add
              </Button>}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modals */}
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
              {!isLoading && <Button onClick={handleUpdateSectionName} className="w-auto">
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
                value={editSubjectForm.code}
                onChange={(e) =>
                  setEditSubjectForm({
                    ...editSubjectForm,
                    code: e.target.value,
                  })
                }
                iconClass="fa-solid fa-barcode"
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
              {!isLoading && <Button onClick={handleUpdateSubject} className="w-auto">
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
              value={editClassForm.name}
              onChange={(e) => setEditClassForm({...editClassForm, name: e.target.value})}
              iconClass="fa-solid fa-chalkboard"
            />
            <div>
              <label className="block text-sm font-semibold text-navy-800 mb-1.5">
                Form Teacher
              </label>
              <select
                className="w-full p-3 border border-gray-300 rounded-md"
                value={editClassForm.classTeacherId}
                onChange={(e) =>
                  setEditClassForm({
                    ...editClassForm,
                    classTeacherId: e.target.value,
                  })
                }
              >
                <option value="">Select Teacher</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} {t.first_name} {t.last_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditClassTarget(null)} className="w-auto">
                Cancel
              </Button>
              {!isLoading && <Button onClick={handleUpdateClass} className="w-auto">
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
                {subjects.map((sub) => (
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
                <Button onClick={handleSubstituteSubject}>Confirm Assignment</Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Teacher Select Modal (General) */}
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
              {teachers
                .filter(
                  (t) =>
                    (t.first_name + " " + t.last_name)
                      .toLowerCase()
                      .includes(teacherSearch.toLowerCase()) && t.user?.is_active,
                )
                .map((t) => (
                  <div
                    key={t.id}
                    onClick={() => confirmTeacherSelection(t.id)}
                    className="flex items-center justify-between p-3 border-b border-gray-50 cursor-pointer hover:bg-navy-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700">
                        {t?.first_name[0]}
                        {t?.last_name[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-navy-900">
                          {t.title} {t.first_name} {t.last_name}
                        </p>
                      </div>
                    </div>
                    <i className="fa-solid fa-check text-gray-300"></i>
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
              {!isLoading && <Button onClick={handleSaveClassAssignments}>Save Assignments</Button>}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={showAddStudentModal}
        onClose={() => {
          setShowAddStudentModal(false);
          setSelectedStudentIds([]);
          setStudentSearch("");
        }}
        title="Enroll Students"
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
            {students
              .filter(
                (s) =>
                  !s.class_rooms.map((cls) => cls.class_room)?.includes(selectedItemId || "") &&
                  (s.first_name + " " + s.last_name + "" + s.admission_number)
                    .toLowerCase()
                    .includes(studentSearch.toLowerCase()),
              )
              .map((student) => (
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
          </div>
          <Button onClick={handleAddStudentsToClass} disabled={selectedStudentIds.length === 0}>
            Enroll Selected
          </Button>
        </div>
      </Modal>

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
            {students.filter((s) => s.class_rooms.filter(cls => cls.status === 'active' || cls.status === 'enrolled').map((cls) => cls.class_room).includes(selectedItemId || "")).length > 0 && (
              <button
                onClick={() => {
                  const candidates = students.filter((s) =>
                    s.class_rooms.filter(cls => cls.status === 'active' || cls.status === 'enrolled').map((cls) => cls.class_room)?.includes(selectedItemId || ""),
                  );
                  if (selectedStudentIds.length === candidates.length) {
                    setSelectedStudentIds([]);
                  } else {
                    setSelectedStudentIds(candidates.map((s) => s.id));
                  }
                }}
                className="text-xs font-bold text-navy-600 hover:text-gold-600 transition-colors"
              >
                {selectedStudentIds.length ===
                students.filter((s) => s.class_rooms.filter(cls => cls.status === 'active' || cls.status === 'enrolled').map((cls) => cls.class_room)?.includes(selectedItemId || "")).length
                  ? "Deselect All"
                  : ` Select All`}
              </button>
            )}
          </div>
          <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto custom-scrollbar p-2">
            {students
              .filter((s) => s.class_rooms.filter(cls => cls.status === 'active' || cls.status === 'enrolled').map((cls) => cls.class_room)?.includes(selectedItemId || ""))
              .map((student) => (
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
            {students.filter((s) => s.class_rooms.map((cls) => cls.class_room)?.includes(selectedItemId || "")).length === 0 && (
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
                .filter((c) => c.id !== selectedItemId)
                .map((c) => (
                  <option key={c.id} value={c.id}> 
                    {c.name}
                  </option>
                ))}
            </select>
          </div>
          <Button
            onClick={handleTransferStudents}
            disabled={selectedStudentIds.length === 0 || !transferTargetClassId}
          >
            Transfer Selected
          </Button>
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
