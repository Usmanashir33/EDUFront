import React, { useState, useEffect, useRef } from 'react';
import { Student, TermAssessment, ClassRoom } from '../../types';
import { Button, Toast } from '../UI';

interface ClassAssessmentEditorProps {
    classRoom: ClassRoom;
    students: Student[];
    session: string;
    term: string;
    existingAssessments: TermAssessment[];
    onSave: (assessments: TermAssessment[]) => void;
    onClose: () => void;
}

const AFFECTIVE_TRAITS = ['Punctuality', 'Neatness', 'Politeness', 'Honesty', 'Cooperation'];
const PSYCHOMOTOR_SKILLS = ['Handwriting', 'Sports', 'Fluency', 'Craft', 'Musical Skills'];

const TEACHER_REMARKS = [
    "An excellent result. Keep it up.",
    "A very good performance.",
    "Good result but can do better.",
    "Fair performance. Needs to work harder.",
    "Poor result. Must sit up."
];

const PRINCIPAL_REMARKS = [
    "An outstanding performance. Keep the flag flying.",
    "A very good result. Keep it up.",
    "A good result. There is room for improvement.",
    "A fair result. You need to be more serious.",
    "A poor result. You must work harder next term."
];

export const ClassAssessmentEditor: React.FC<ClassAssessmentEditorProps> = ({
    classRoom, students, session, term, existingAssessments, onSave, onClose
}) => {
    const [assessments, setAssessments] = useState<TermAssessment[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const inputRefs = useRef<{ [key: string]: HTMLInputElement | HTMLSelectElement }>({});

    // Initialize assessments
    useEffect(() => {
        const classStudents = students.filter(s => s.classRoomIds.includes(classRoom.id));
        const initialData = classStudents.map(student => {
            const existing = existingAssessments.find(a => a.studentId === student.id);
            if (existing) return existing;

            return {
                studentId: student.id,
                classId: classRoom.id,
                session,
                term,
                affective: AFFECTIVE_TRAITS.reduce((acc, trait) => ({ ...acc, [trait]: 0 }), {}),
                psychomotor: PSYCHOMOTOR_SKILLS.reduce((acc, skill) => ({ ...acc, [skill]: 0 }), {}),
                teacherRemark: '',
                principalRemark: ''
            };
        });
        setAssessments(initialData);
    }, [students, existingAssessments, classRoom.id, session, term]);

    const handleRatingChange = (studentId: string, type: 'affective' | 'psychomotor', key: string, value: string) => {
        const numVal = Math.min(Math.max(Number(value) || 0, 0), 5); // Clamp 0-5
        setAssessments(prev => prev.map(a => {
            if (a.studentId === studentId) {
                return {
                    ...a,
                    [type]: {
                        ...a[type],
                        [key]: numVal
                    }
                };
            }
            return a;
        }));
        setIsDirty(true);
    };

    const handleRemarkChange = (studentId: string, type: 'teacherRemark' | 'principalRemark', value: string) => {
        setAssessments(prev => prev.map(a => {
            if (a.studentId === studentId) {
                return { ...a, [type]: value };
            }
            return a;
        }));
        setIsDirty(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent, studentId: string, currentField: string, studentIndex: number) => {
        if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            
            let nextIndex = studentIndex;
            if (e.key === 'ArrowDown' || e.key === 'Enter') nextIndex++;
            if (e.key === 'ArrowUp') nextIndex--;

            if (nextIndex >= 0 && nextIndex < assessments.length) {
                const nextStudentId = assessments[nextIndex].studentId;
                const nextRefKey = `${nextStudentId}-${currentField}`;
                inputRefs.current[nextRefKey]?.focus();
            }
        }
    };

    const handleSave = () => {
        onSave(assessments);
        setToast({ message: "Class assessments saved successfully", type: 'success' });
        setIsDirty(false);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-full animate-fadeIn">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Header */}
            <div className="bg-navy-900 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center">
                        <i className="fa-solid fa-clipboard-user text-gold-500 mr-3"></i>
                        Class Assessment & Remarks
                    </h2>
                    <p className="text-navy-100 text-sm mt-1">
                        {classRoom.name} • {term} ({session})
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="text-white border-white/20 hover:bg-white/10" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-gold-500 hover:bg-gold-600 text-navy-900">
                        <i className="fa-solid fa-save mr-2"></i> Save Assessments
                    </Button>
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-gray-50">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-navy-50 text-navy-900 uppercase font-bold text-xs sticky top-0 z-10">
                            <tr>
                                <th className="p-3 border-b border-r border-gray-200 sticky left-0 bg-navy-50 z-20 w-48">Student</th>
                                
                                {/* Affective Traits */}
                                <th colSpan={AFFECTIVE_TRAITS.length} className="p-3 border-b border-r border-gray-200 text-center bg-blue-50/50 text-blue-900">
                                    Affective Traits (1-5)
                                </th>
                                
                                {/* Psychomotor Skills */}
                                <th colSpan={PSYCHOMOTOR_SKILLS.length} className="p-3 border-b border-r border-gray-200 text-center bg-green-50/50 text-green-900">
                                    Psychomotor Skills (1-5)
                                </th>

                                {/* Remarks */}
                                <th colSpan={2} className="p-3 border-b border-gray-200 text-center bg-purple-50/50 text-purple-900">
                                    Official Remarks
                                </th>
                            </tr>
                            <tr>
                                <th className="p-2 border-b border-r border-gray-200 sticky left-0 bg-navy-50 z-20"></th>
                                
                                {AFFECTIVE_TRAITS.map(t => (
                                    <th key={`h-aff-${t}`} className="p-2 border-b border-r border-gray-200 text-center text-[10px] w-16 bg-blue-50/30" title={t}>
                                        {t.substring(0, 4)}.
                                    </th>
                                ))}
                                
                                {PSYCHOMOTOR_SKILLS.map(s => (
                                    <th key={`h-psy-${s}`} className="p-2 border-b border-r border-gray-200 text-center text-[10px] w-16 bg-green-50/30" title={s}>
                                        {s.substring(0, 4)}.
                                    </th>
                                ))}

                                <th className="p-2 border-b border-r border-gray-200 text-center bg-purple-50/30 w-64">Form Teacher</th>
                                <th className="p-2 border-b border-gray-200 text-center bg-purple-50/30 w-64">Principal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {assessments.map((assessment, idx) => {
                                const student = students.find(s => s.id === assessment.studentId);
                                if (!student) return null;

                                return (
                                    <tr key={assessment.studentId} className="hover:bg-gray-50 transition-colors group">
                                        <td className="p-3 border-r border-gray-200 sticky left-0 bg-white group-hover:bg-gray-50 z-10 font-bold text-navy-800">
                                            <div className="truncate w-48" title={`${student.lastName} ${student.firstName}`}>
                                                {student.lastName}, {student.firstName}
                                            </div>
                                            <div className="text-[10px] text-gray-400 font-normal">{student.admissionNumber}</div>
                                        </td>

                                        {/* Affective Inputs */}
                                        {AFFECTIVE_TRAITS.map(trait => (
                                            <td key={`aff-${trait}`} className="p-2 border-r border-gray-100 text-center">
                                                <input 
                                                    type="number" 
                                                    min="0" max="5"
                                                    value={assessment.affective[trait] || ''}
                                                    onChange={(e) => handleRatingChange(assessment.studentId, 'affective', trait, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, assessment.studentId, `aff-${trait}`, idx)}
                                                    ref={el => { if (el) inputRefs.current[`${assessment.studentId}-aff-${trait}`] = el; }}
                                                    className="w-12 text-center p-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-bold text-navy-900"
                                                />
                                            </td>
                                        ))}

                                        {/* Psychomotor Inputs */}
                                        {PSYCHOMOTOR_SKILLS.map(skill => (
                                            <td key={`psy-${skill}`} className="p-2 border-r border-gray-100 text-center">
                                                <input 
                                                    type="number" 
                                                    min="0" max="5"
                                                    value={assessment.psychomotor[skill] || ''}
                                                    onChange={(e) => handleRatingChange(assessment.studentId, 'psychomotor', skill, e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, assessment.studentId, `psy-${skill}`, idx)}
                                                    ref={el => { if (el) inputRefs.current[`${assessment.studentId}-psy-${skill}`] = el; }}
                                                    className="w-12 text-center p-1 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-bold text-navy-900"
                                                />
                                            </td>
                                        ))}

                                        {/* Remarks Inputs */}
                                        <td className="p-2 border-r border-gray-100">
                                            <div className="flex flex-col gap-1">
                                                <input 
                                                    type="text"
                                                    value={assessment.teacherRemark}
                                                    onChange={(e) => handleRemarkChange(assessment.studentId, 'teacherRemark', e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, assessment.studentId, 'teacherRemark', idx)}
                                                    ref={el => { if (el) inputRefs.current[`${assessment.studentId}-teacherRemark`] = el; }}
                                                    placeholder="Custom remark..."
                                                    className="w-full p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                                                />
                                                <select 
                                                    onChange={(e) => {
                                                        if (e.target.value) handleRemarkChange(assessment.studentId, 'teacherRemark', e.target.value);
                                                        e.target.value = ""; // Reset select
                                                    }}
                                                    className="w-full p-1 border border-gray-200 rounded text-[10px] text-gray-500 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                                >
                                                    <option value="">-- Quick Select --</option>
                                                    {TEACHER_REMARKS.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                        </td>
                                        <td className="p-2">
                                            <div className="flex flex-col gap-1">
                                                <input 
                                                    type="text"
                                                    value={assessment.principalRemark}
                                                    onChange={(e) => handleRemarkChange(assessment.studentId, 'principalRemark', e.target.value)}
                                                    onKeyDown={(e) => handleKeyDown(e, assessment.studentId, 'principalRemark', idx)}
                                                    ref={el => { if (el) inputRefs.current[`${assessment.studentId}-principalRemark`] = el; }}
                                                    placeholder="Custom remark..."
                                                    className="w-full p-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent text-xs"
                                                />
                                                <select 
                                                    onChange={(e) => {
                                                        if (e.target.value) handleRemarkChange(assessment.studentId, 'principalRemark', e.target.value);
                                                        e.target.value = ""; // Reset select
                                                    }}
                                                    className="w-full p-1 border border-gray-200 rounded text-[10px] text-gray-500 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                                                >
                                                    <option value="">-- Quick Select --</option>
                                                    {PRINCIPAL_REMARKS.map((r, i) => <option key={i} value={r}>{r}</option>)}
                                                </select>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {assessments.length === 0 && (
                                <tr>
                                    <td colSpan={13} className="p-8 text-center text-gray-500 italic">
                                        No students found in this class.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* Footer */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500 shrink-0">
                <div className="flex items-center gap-4">
                    <span><i className="fa-solid fa-keyboard mr-1"></i> Use <kbd className="bg-white border border-gray-300 px-1 rounded shadow-sm">Enter</kbd> or <kbd className="bg-white border border-gray-300 px-1 rounded shadow-sm">↓</kbd> to move down</span>
                    <span><i className="fa-solid fa-info-circle mr-1"></i> Ratings are from 1 to 5</span>
                </div>
                <div>
                    {isDirty && <span className="text-orange-500 font-bold mr-4"><i className="fa-solid fa-circle-exclamation mr-1"></i> Unsaved changes</span>}
                    {assessments.length} Students
                </div>
            </div>
        </div>
    );
};
