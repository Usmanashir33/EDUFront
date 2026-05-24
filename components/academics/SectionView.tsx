import React from "react";
import {SchoolSection, ClassRoom, Teacher, Subject, Student} from "../../types";
import {Button} from "../UI";
import urls from "@/customHooks/ServerUrls";

interface SectionViewProps {
  sections: SchoolSection[];
  classRooms: ClassRoom[];
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  searchQuery: string;
  onSelectItem: (id: string, view: "LIST" | "DETAIL") => void;
  viewMode: "LIST" | "DETAIL";
  selectedId: string | null;
  onEditSection: (s: SchoolSection) => void;
  onSetTimetableTarget: (t: any) => void;
  onShowReportModal: (d: any, type: any, title: string) => void;
  onNavigateToClass: (classId: string) => void;
  onDeleteAcademics: (a:"SECTIONS" ,s:Subject) => void;
  
}

export const SectionView: React.FC<SectionViewProps> = ({
  sections, classRooms, students, teachers, subjects, searchQuery,
  onSelectItem, viewMode, selectedId, onEditSection, onSetTimetableTarget,
   onShowReportModal, onNavigateToClass,onDeleteAcademics
  }) => {
  // --- LIST VIEW ---
  if (viewMode === "LIST") {
    const filteredSections = sections.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSections?.map((sec) => (
          <div key={sec.id} onClick={() => onSelectItem(sec.id, "DETAIL")} className="p-5 border border-gray-200 rounded-lg bg-navy-50/30 hover:border-navy-200 transition-colors cursor-pointer group hover:shadow-md">
            <div className="flex items-center justify-between mb-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-navy-600 shadow-sm">
                <i className="fa-solid fa-layer-group"></i>
              </div>
              <span className="text-xs font-bold bg-navy-100 text-navy-700 px-2 py-1 rounded">ID: {sec.id.slice(-4)}</span>
            </div>
            <h4 className="font-bold text-lg text-navy-900 group-hover:text-gold-600 transition-colors">{sec.name}</h4>
            <p className="text-xs text-gray-500 mt-1">{classRooms.filter((c) => c.section === sec.id).length} Linked Classes</p>
            <div className="relative ">
              <button
                  onClick={(e) => {
                      e.stopPropagation();
                      onDeleteAcademics("SECTIONS",sec as any)
                  }}
                  className="absolute right-1 bottom-1 flex items-center  gap-2 bg-red-500 hover:bg-red-600 active:scale-95 text-white px-2 py-1 rounded-xl shadow-md transition-all duration-200"
                >
                  <i className="fa-solid fa-trash-can text-sm"></i>
              </button>

            </div>
          </div>
        ))}
        {filteredSections.length === 0 && <div className="col-span-3 text-center p-8 text-gray-400">No sections found.</div>}
      </div>
    );
  }

  // --- DETAIL VIEW ---
  const section = sections.find((s) => s.id === selectedId);
  if (!section) return null;

  const linkedClasses = classRooms.filter((c) => c.section === section.id);
  const totalStudents = students.filter((s) => linkedClasses.some((c) => s.class_rooms.map(c => c.class_room)?.includes(c.id))).length;
  //countteachers from theclassesthe teach
  const linkedClassIds = new Set(linkedClasses?.map(lc => lc.id));

  const sectionTeachers = teachers?.filter(teacher =>
    teacher.class_room?.some(tc_id => linkedClassIds.has(tc_id))
    );

  const linkedClassesForReport = linkedClasses.map((c) => ({
    ...c,
    studentCount: students.filter((s) => s.class_room?.includes(c.id)).length,
    teacherName: teachers.find((t) => t.id === c.classTeacherId)?.last_name || "Unassigned",
  }));

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-navy-900 to-navy-700 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fa-solid fa-layer-group text-9xl"></i>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start">
          <div>
            <h2 className="text-4xl font-bold mb-1">{section.name}</h2>
            <p className="text-navy-200 text-sm font-mono tracking-widest uppercase">Section ID: {section.id.toUpperCase().slice(0, 10)}</p>
            <div className="flex gap-6 mt-6">
              <div>
                <p className="text-2xl font-bold">{linkedClasses.length}</p>
                <p className="text-xs uppercase text-gold-500 font-bold">Classes</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs uppercase text-gold-500 font-bold">Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{sectionTeachers.length}</p>
                <p className="text-xs uppercase text-gold-500 font-bold">Teachers</p>
              </div>
            </div>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col gap-2">
            <Button variant="outline" className="w-auto px-4 bg-navy-300 text-white border-white/20 hover:bg-white/50" onClick={() => onEditSection(section)}>
              <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Section
            </Button>
            <Button variant="outline" className="w-auto px-4  bg-navy-300 text-white border-white/20 hover:bg-white/50" onClick={() => onSetTimetableTarget({name: section.name, type: "SECTION"})}>
              <i className="fa-solid fa-calendar-days mr-2"></i> View Timetable
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Classes Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-lg text-navy-900">Classes ({linkedClasses.length})</h3>
            <button onClick={() => onShowReportModal(linkedClassesForReport, "CLASS", `${section.name} Classes`)} className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-3 py-1 rounded">
              <i className="fa-solid fa-file-export mr-1"></i> Export
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {linkedClasses.map((cls) => {
              const sCount = students.filter((s) => s.class_rooms.map(c => c.class_room)?.includes(cls.id)).length;
              const tName = teachers.find((t) => t.id === cls?.form_teacher);
              return (
                <div key={cls.id} onClick={() => onNavigateToClass(cls.id)} className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer group bg-gray-50 hover:bg-white transition-all">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-navy-900 group-hover:text-gold-600">{cls.name}</h4>
                    <i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>
                      <i className="fa-solid fa-users mr-1"></i> {sCount} Students
                    </span>
                    <span>
                      <i className="fa-solid fa-chalkboard-user mr-1"></i> {tName ? ` ${tName?.title} ${tName?.first_name} ${tName?.last_name}` : "No Master"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        {/* Teachers Column */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
            <h3 className="font-bold text-lg text-navy-900">Teachers ({sectionTeachers.length})</h3>
            <button onClick={() => onShowReportModal(sectionTeachers, "TEACHER", `${section.name} Teachers`)} className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-3 py-1 rounded">
              <i className="fa-solid fa-file-export mr-1"></i> Export
            </button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
            {sectionTeachers.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-navy-50 group transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-navy-700">
                    <img className="w-8 h-8 bg-navy-100 border border-navy-200 rounded-full" src={urls.BASE_URL + t.picture} alt="pic"/>

                  </div>
                  <div>
                    <p className="text-sm font-bold text-navy-900">
                      {t.title} {t.first_name} {t.last_name}
                    </p>
                    <p className="text-xs text-gray-500">{t.email}</p>
                  </div>
                </div>
                <span className="text-[10px] bg-navy-100 text-navy-700 px-2 py-1 rounded">{t.staff_id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
