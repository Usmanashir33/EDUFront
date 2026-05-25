import React from "react";
import {Subject, ClassRoom, Teacher, Student, SubjectAssignment} from "../../types";
import {Button} from "../UI";

interface SubjectViewProps {
  subjects: Subject[];
  classRooms: ClassRoom[];
  teachers: Teacher[];
  students: Student[];
  searchQuery: string;
  viewMode: "LIST" | "DETAIL";
  selectedId: string | null;
  onSelectItem: (id: string, view: "LIST" | "DETAIL") => void;
  onEditSubject: (s: Subject) => void;
  onAssignClass: (s: Subject) => void;
  onAssignTeacher: (s: Subject) => void;
  onDeleteAcademics: (a:"SUBJECTS" ,s:Subject) => void;
}

export const SubjectView: React.FC<SubjectViewProps> = ({
  subjects,
  classRooms,
  teachers,
  students,
  searchQuery,
  viewMode,
  selectedId,
  onSelectItem,
  onEditSubject,
  onAssignClass,
  onAssignTeacher,
  onDeleteAcademics,
}) => {
  // --- LIST VIEW ---
  if (viewMode === "LIST") {
    const filteredSubjects = subjects.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase()),
    );
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Subject Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Assigned Teachers
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">
                Classes
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 bg-red-50 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredSubjects.map((sub :any ) => (
              <tr
                key={sub.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => onSelectItem(sub.id, "DETAIL")}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                  {sub.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                  {sub?.credits ?? "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-navy-900">
                  {sub.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 max-cols-2">
                  {sub.teachers?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {sub.teachers?.map((t : any) => {
                        return t ? (
                          <span
                            key={t.id}
                            className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs border border-green-100"
                          >
                            {t.title} {t.first_name} {t.last_name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <span className="text-gray-400 italic text-xs">Unassigned</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {sub.classes?.length || 0 } Classes
                </td>
                <td  className="px-6 py-4 text-sm text-gray-600 flex ">
                  <button
                      className="flex justify-center rounded-lg text-red-500 hover:bg-red-500 hover:text-white p-1 px-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteAcademics("SUBJECTS",sub as any );
                      }}
                    >
                      <i className="fa-solid fa-trash-can text-sm"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          {filteredSubjects.length === 0 &&(
             <div className="  w-full flex justify-center  p-8 text-gray-400">
                  No Subject found.
              </div>
              )
            }
      </div>
    );
  }

  // --- DETAIL VIEW ---
  const subject:any = subjects.find((s) => s.id === selectedId);
  if (!subject) return null;

  const takingClasses = classRooms.filter((c) => subject?.classes?.includes(c.id));
  const assignedTeachers = subject?.teachers;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white p-8 rounded-xl shadow-lg relative overflow-hidden flex justify-between items-center">
        <div className="relative z-10">
          <h2 className="text-3xl font-bold mb-1">{subject.name}</h2>
          <p className="text-lg text-navy-200 font-mono">{subject.code}</p>
          <div className="flex gap-4 mt-4">
            <span className="bg-white/10 px-3 py-1 rounded text-sm font-bold border border-white/20">
              {takingClasses.length} Enrolled Classes
            </span>
            <span className="bg-white/10 px-3 py-1 rounded text-sm font-bold border border-white/20">
              {assignedTeachers.length} Assigned Teachers
            </span>
          </div>
        </div>
        <div className="relative z-10 flex gap-2">
          <Button
            variant="outline"
            className="w-auto px-4 bg-white/50 text-white border-white/20 hover:bg-white/20" 
            onClick={() => onEditSubject(subject)}
          >
            Edit Subject
          </Button>
        </div>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <i className="fa-solid fa-book text-9xl"></i>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-navy-900 flex items-center">
              <i className="fa-solid fa-chalkboard mr-2"></i> Enrolled Classes
            </h3>
            <Button className="w-auto px-3 max-w-fit py-1 text-xs" onClick={() => onAssignClass(subject)}>
              + Manage
            </Button>
          </div>
          <div className="space-y-2">
            {takingClasses.map((c : any) => {
              const assignment = subject.assignments?.find(
                (a: SubjectAssignment) => a.classId === c.id,
              );
              const tName :any =  null;
              return (
                <div
                  key={c.id}
                  className="p-3 bg-gray-50 rounded flex justify-between items-center"
                >
                  <div>
                    <span className="font-bold text-navy-700 block">{c.name}</span>
                    <span className="text-xs text-gray-500">
                      {tName ? `Taught by: ${tName}` : "No teacher assigned"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {c.studentsCount || 0} Students
                  </span>
                </div>
              );
            })}
            {takingClasses.length === 0 && (
              <p className="text-gray-400 italic text-sm">No classes assigned.</p>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-navy-900 flex items-center">
              <i className="fa-solid fa-chalkboard-user mr-2"></i> Teachers
            </h3>
            <Button className="w-auto max-w-fit px-3 py-1 text-xs" onClick={() => onAssignTeacher(subject)}>
              + Manage
            </Button>
          </div>
          <div className="space-y-2">
            {assignedTeachers.map((t : any) => (
              <div
                key={t.id}
                className="p-3 bg-navy-50 rounded flex justify-between items-center border border-navy-100"
              >
                <div>
                  <span className="font-bold text-navy-800 block">
                    {t.title} {t.first_name} {t.last_name}
                  </span>
                  <span className="text-xs text-navy-500">{t.staff_id}</span>
                </div>
                <i className="fa-solid fa-check text-green-500"></i>
              </div>
            ))}
            {assignedTeachers.length === 0 && (
              <p className="text-gray-400 italic text-sm">No teachers assigned.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
