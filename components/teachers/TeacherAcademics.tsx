import React, { useState, useEffect, useContext, useRef, useMemo } from "react";

//  Updated to use the absolute path aliases
import { SchoolSection, ClassRoom, Subject, Student, Teacher, ActivityLog } from "@/types";
import { Button, Input, Modal, MultiSelectGrid, PinModal, Toast } from "@/components/UI";
import { TimetableModal, UnifiedExportModal } from "@/components/academics/AcademicUtils";
import { SectionView } from "@/components/academics/SectionView";
import { ClassView } from "@/components/academics/ClassView";
import { SubjectView } from "@/components/academics/SubjectView";

// These were already perfect:
import { uiContext } from "@/customContexts/UiContext";
import { authContext } from "@/customContexts/AuthContext";
import useRequest from "@/customHooks/RequestHook";
import urls from "@/customHooks/ServerUrls";
import { TeacherClassView } from "./TeacherClassView";
import { TeacherSubjectView } from "./TeacherSubjectView";


interface AcademicManagerProps {
  onNavigateToStudent?: (studentId: string) => void;
}

type Tab = "SECTIONS" | "CLASSROOMS" | "SUBJECTS";
type ViewMode = "LIST" | "DETAIL";
type OperationMode = "POST" | "DELETE" | "PUT" | "GET" ;

export const TeacherAcademicManager: React.FC<AcademicManagerProps> = ({
  onNavigateToStudent,
}) => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<Tab>("CLASSROOMS");
  const [viewMode, setViewMode] = useState<ViewMode>("LIST");
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [ selectedSub ,setSelectedSub ]=useState<any>(null);
  const {
    classRooms,
    subjects,
    selectedSchool,
    isLoading, setToast
  } = useContext(uiContext);
  const {currentUser} = useContext(authContext);
  const [currentSession,setCurrentSession] = useState<any>(
    selectedSchool?.sessions.find(s => s.is_current)?.name
  );
  const [currentTerm,setCurrentTerm] = useState<any>(
    selectedSchool?.terms.find(s => s.is_current)?.name
  );


  

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


  // Teacher & Subject Assignment Modals

  const [showClassSelectModal, setShowClassSelectModal] = useState(false);
  const [selectedSubjectForClass, setSelectedSubjectForClass] = useState<any | null>(null);
  const [classSelectState, setClassSelectState] = useState<
    {classId: string; teacherId: string; isSelected: boolean}[]
  >([]);


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


  const TriggeredFunc = (data) => { // 
    // console.log('data: ', data);
    if (data?.success){
      setToast({message:data?.success, type: "success"});

    }
    }


  const handlePinSuccess = (pins:string) => {
    let form:any = {...serverForm,pin : pins}
    setShowAddModal(false);
    setShowPinModal(false); 
    // ....................................................................................
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


        {activeTab === "CLASSROOMS" && (
          <TeacherClassView
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
            onShowReportModal={(d, t, title) =>
              setReportModalData({isOpen: true, data: d, type: t, title})
            }
          />
        )}
        {activeTab === "SUBJECTS" && (
                  <TeacherSubjectView
                    subject={selectedSub}
                    setSubject={setSelectedSub}
                    searchQuery={searchQuery}
                    viewMode={viewMode}
                    selectedId={selectedItemId}
                    onSelectItem={(id, view) => {
                      setSelectedItemId(id);
                      setViewMode(view);
                    }}
                    
                  />
        )}

      </div>
    



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
