import React, {useState} from "react";
import {ClassRoom, Student, Subject, Teacher, SubjectAssignment} from "../../types";
import {Button} from "../UI";
import {generateMockTimetable, getCurrentPeriodInfo} from "./AcademicUtils";
import urls from "@/customHooks/ServerUrls";

interface ClassViewProps {
  classRooms: ClassRoom[];
  students: Student[];
  subjects: Subject[];
  teachers: Teacher[];
  searchQuery: string;
  viewMode: "LIST" | "DETAIL";
  selectedId: string | null;
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
  classRooms,
  students,
  subjects,
  teachers,
  searchQuery,
  viewMode,
  selectedId,
  currentSession,
  currentTerm,
  currentTime,
  onSelectItem,
  onEditClass,
  onSetTimetableTarget,
  onShowReportModal,
  onShowAddStudent,
  onAddSubject,
  onNavigateToStudent,
  onManageMaster,
  onInitiateSubstitute,
  onTransferStudents,
  onNavigateToSubject,
  onDeleteAcademics
}) => {
  const [sessionFilter, setSessionFilter] = useState(currentSession);

  // --- LIST VIEW ---
  if (viewMode === "LIST") {
    const filteredClasses = classRooms.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredClasses.map((cls) => (
          <div
            key={cls.id}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all group bg-white relative"
            onClick={() => onSelectItem(cls.id, "DETAIL")}
          >
            <h4 className="font-bold text-navy-900 text-lg group-hover:text-gold-600 transition-colors mb-2 cursor-pointer">
              {cls.name}
            </h4>
            <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 cursor-pointer">
              <span>{students.filter((s) => s?.class_rooms.filter(cls => cls.status === 'active' || cls.status === 'enrolled').map(c => c.class_room).includes(cls.id)).length} Students</span>
              <span>{subjects.filter((s) => s?.class_rooms?.includes(cls.id)).length} Subjects</span>
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
  const cls = classRooms.find((c) => c.id === selectedId);
  if (!cls) return null ;

  const classStudents = students.filter((s) => s.class_rooms?.filter(
    (cls) => ( cls.status === 'active' ||  cls.status === 'enrolled') 
  ).map(cls => cls.class_room).includes(cls.id));
  const classSubjects = subjects.filter((s) => s.class_rooms?.includes(cls.id)) ;

  // Get Teachers
  const classTeachers = teachers.filter((teacher) => teacher.class_room.includes(cls.id))
  const classMaster = teachers.find((t) => t.id === cls?.form_teacher);
  const schedule = generateMockTimetable(cls.name);
  const currentPeriod = getCurrentPeriodInfo(schedule, subjects, teachers, currentTime);

  const getSubjectTeacher = (sub) => {
    const assignment = sub.assignments?.find((a) => a.classId === cls.id);
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
    <div className="space-y-6 animate-fadeIn">
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
            <h2 className="text-4xl font-bold mb-1">{cls.name}</h2>
            <p className="text-navy-200 text-lg">{classStudents.length} Students Enrolled</p>
            <div
              className="mt-4 flex items-center gap-2 cursor-pointer hover:bg-white/10 p-2 rounded w-fit transition-colors"
              onClick={() => onManageMaster(cls)}
            >
              <div className="w-8 h-8 rounded-full bg-white text-navy-900 flex items-center justify-center font-bold">
                {classMaster ? (
                    <img className="w-8 h-8 bg-navy-100 border border-navy-200 rounded-full" src={urls.BASE_URL + classMaster?.picture} alt="pic" />
                ) : (
                  <i className="fa-solid fa-plus"></i>
                )}
              </div>
              <div>
                <p className="text-xs uppercase font-bold text-navy-300">Form Teacher</p>
                <p className="text-sm font-bold">
                  {classMaster
                    ? `${classMaster.title} ${classMaster.first_name} ${classMaster.last_name}`
                    : "Assign Master"}
                </p>
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
          onClick={() => onSetTimetableTarget({name: cls.name, type: "CLASS"})}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-lg text-navy-900">Students ({classStudents.length})</h3>
            <div className="flex gap-2">
              <button
                onClick={() => onTransferStudents(cls.id)}
                className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center"
                title="Transfer"
              >
                <i className="fa-solid fa-arrow-right-arrow-left mr-1"></i> Transfer
              </button>
              <button
                onClick={() =>
                  onShowReportModal(classStudents, "STUDENT", `${cls.name} Student List`)
                }
                className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-2 py-1 rounded"
              >
                <i className="fa-solid fa-file-export mr-1"></i> Export
              </button>
            </div>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
            {classStudents.map((s) => ( 
              <div
                key={s.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-navy-50 group transition-colors cursor-pointer"
                // onClick={() => onNavigateToStudent && onNavigateToStudent(s.id)}
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
                  className={`text-[10px] font-bold px-2 py-1 rounded ${s.user?.is_active? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {s.user?.is_active? "Active" : "Inactive"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Teachers */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-lg text-navy-900">Teachers ({classTeachers.length})</h3>
            <button
              onClick={() =>
                onShowReportModal(classTeachers, "TEACHER", `${cls.name} Teachers List`)
              }
              className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-2 py-1 rounded"
            >
              <i className="fa-solid fa-file-export mr-1"></i> Export
            </button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
            {classTeachers.map((t) => (
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
                {t.id === cls.classTeacherId && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded bg-gold-100 text-gold-800">
                    Master
                  </span>
                )}
              </div>
            ))}
            {classTeachers.length === 0 && (
              <p className="text-sm text-gray-500 italic p-2">No teachers assigned.</p>
            )}
          </div>
        </div>

        {/* Subjects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
          <h3 className="font-bold text-lg text-navy-900 mb-4 border-b pb-2">
            Subjects ({classSubjects.length})
          </h3>
          <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {classSubjects.map((sub) => {
              const teacher = getSubjectTeacher(sub);
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
                          onInitiateSubstitute(sub, cls.id);
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
                        {teacher.title} {teacher.last_name}
                      </span>
                    ) : (
                      <span className="text-orange-500 italic">No teacher assigned</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
