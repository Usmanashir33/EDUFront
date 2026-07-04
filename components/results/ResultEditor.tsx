
import React, { useEffect, useState } from 'react';
import { ResultBatch, StudentScore, ClassRoom, Subject, Student } from '../../types';
import { Button, Modal } from '../UI';
import { calculateGrade, generateResultCSV } from './ResultUtils';
import { getCompletenessStats } from './ResultUtils';

import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';

interface ResultEditorProps { 
    batch: ResultBatch | any ;
    setBatch:any ;
    editorScores: StudentScore[];
    setEditorScores:any;
    setIsDirty: (data:boolean) => void;
    isDirty: boolean;
    onClose: () => void;
    onSave: () => void;
    onScoreChange: (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: string) => void;
    onImportClick: () => void;
    onManageEdit: (a:any,b:any) => void;
    selectedSession: string ;
    selectedTerm: string;
    accessData:any
}
const renderProgressBar = (stats: { scored: number, total: number, percentage: number, status: string }) => {
        let color = 'bg-gray-200';
        if (stats.status === 'COMPLETE') color = 'bg-green-500';
        else if (stats.status === 'PARTIAL') color = 'bg-orange-400';

        return (
            <div className="w-full mt-2">
                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1">
                    <span>{stats.status}</span>
                    <span>{stats.scored}/{stats.total} Recorded</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${stats.percentage}%` }}></div>
                </div>
            </div>
        );
    };
export const ResultEditor: React.FC<ResultEditorProps> = ({
    batch, 
    setBatch, 
    editorScores,
    setEditorScores,
    isDirty,
    setIsDirty,
    accessData,
    onClose, onSave, onScoreChange, onImportClick,onManageEdit ,selectedSession, selectedTerm
}) => {
    const {teachers,classRooms, subjects, students,setToast} = React.useContext(uiContext);
    const cls = classRooms.find(c => c.id === batch.classId);
    const sub = subjects.find(s => s.id === batch.subjectId);

    const teacherId = sub?.teachers.find(d => d.classroom === cls.id)?.teacher
    const teacher = teachers.find(d => d.id === teacherId)
    const teacher_name = teacher ? `${teacher?.title} ${teacher?.first_name} ${teacher?.last_name} ${teacher?.middle_name}`: 'unassigned'
    const { sendFileRequest,sendRequest } = useRequest();
    const {selectedSchool,getFormattedDate} = React.useContext(uiContext);
    const stats = getCompletenessStats(batch);

    const [classStudents,setClassStudents] = useState(students.filter(s => s.active_class_rooms.includes(batch.classId)))
    const [showSubmitModal,setShowSubmitModal] = useState(false)
    const disabled = batch.on_submit || batch.isLocked  
    const TriggeredFunc = (resp) => {
        // console.log('resp: ', resp) ;
        if (resp?.batch){
            let sts = resp?.batchAllstudents ;
            setBatch(prev => prev.id === resp.batch?.id ? {...resp.batch} : prev) ;
            setClassStudents(prev => {
                return sts ;
            });
        }
    }
    useEffect(() => {
        if (! batch?.scores || batch?.scores?.length === 0) {
            const initialScores = classStudents.map(s => ({
                studentId: s.id,
                student_name : s.first_name + " " + s.last_name,
                student_admission_number : s.admission_number,
                ca1: 0, ca2: 0, exam: 0, total: 0, grade: 'N/A', remark: 'No Score',
                ca1Abs:false,ca2Abs:false,examAbs:false
            }));
            setEditorScores(initialScores) ;

        } else {
            // make sure all students are included 
           // 1. Get a fast-lookup set of all student IDs already present in this batch
            const existingStudentIds = new Set(batch.scores.map(s => s.studentId));
            // 2. Filter out classStudents missing from the batch, and create empty templates for them
            const missingStudentsMocked = classStudents
                .filter(student => !existingStudentIds.has(student.id))
                .map(student => ({
                    studentId: student.id,
                    student_name : student.first_name + " " + student.last_name,
                    student_admission_number : student.admission_number,
                    ca1: 0, 
                    ca2: 0, 
                    exam: 0, 
                    total: 0, 
                    grade: 'N/A', 
                    remark: 'No Score',
                    ca1Abs: false,
                    ca2Abs: false,
                    examAbs: false
                }));

            // 3. Create the final combined scores list (Existing Batch Students + Missing Mocked Students)
            const finalScoresList = [...batch.scores, ...missingStudentsMocked];
            setEditorScores(finalScoresList);

        }
        setIsDirty(false);
       
    },[classStudents,batch]);
    useEffect(() => {
         // fetch the remaining class students pls 
        // let url = `/student/all-students/${selectedSchool?.id}/${batch?.classId}/`
        let url = `/result/result-batch/detail/${selectedSchool?.id}/${batch.session}/${batch.term}/${batch.classId}/${batch?.subjectId}/`
        sendRequest(url,"GET",null as any ,TriggeredFunc,true,true)

    },[])
    const serverDownloader = async (resp, fileName) => {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}_score_template.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove(); 
    }

    const handleDownloadTemplate = () => {
        let sessionId = selectedSchool?.sessions.find(s => s.name === selectedSession)?.id;
        let termId = selectedSchool?.terms.find(t => t.name === selectedTerm)?.id ;
        let url = `/result/result-batch/download/${selectedSchool?.id}/${sessionId}/${termId}/${batch.classId}/${batch.subjectId}/`
        let fileName = `${cls?.name}_${sub?.name}`;
        sendFileRequest(url, 'GET', null as any , serverDownloader,fileName, true, !true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            let nextRow = rowIndex;
            let nextCol = colIndex + 1;
            
            // 0: CA1, 1: CA2, 2: Exam
            if (nextCol > 2) {
                nextRow = rowIndex + 1;
                nextCol = 0;
            }

            if (nextRow < editorScores.length) {
                const nextInput = document.getElementById(`input-${nextRow}-${nextCol}`);
                if (nextInput) {
                    nextInput.focus();
                    (nextInput as HTMLInputElement).select();
                }
            }
        }
    };

    return (
        <div className="animate-slideInRight h-full flex flex-col">
            {/* Editor Header */}
            <div className="bg-navy-900 text-white p-4 rounded-t-xl flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
                        <i className="fa-solid fa-arrow-left text-xl"></i>
                    </button>
                    <div>
                        <h2 className="text-lg font-bold">{sub?.name} - {cls?.name} -
                             <b className=''> {teacher_name}</b>
                        </h2>
                        <p className="text-xs text-navy-200">{selectedSession} Session • {selectedTerm}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <Button 
                        onClick={onImportClick}
                        disabled={disabled} 
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded flex items-center"
                    >
                        <i className="fa-solid fa-file-csv mr-2"></i> Upload CSV
                    </Button>
                    <button 
                        onClick={handleDownloadTemplate}
                        className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded flex items-center"
                    >
                        <i className="fa-solid fa-download mr-2"></i> Template
                    </button>
                    {(!disabled) && <button
                        onClick={() => {
                            if (isDirty) return setToast({message:"Save the changes first!",type:'info'})
                            setShowSubmitModal(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center transition-colors"
                    >
                        <i className="fa-solid fa-paper-plane mr-2"></i>
                        Submit
                    </button>}
                    
                    {/* make the staff able to resubmit even if its locked here by rejecting it  */}
                    {(batch.on_submit && accessData.canApprove) && <button
                        onClick={() => {
                            if (isDirty) return setToast({message:"Save the changes first!",type:'info'})
                            setShowSubmitModal(true)
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center transition-colors"
                    >
                        <i className="fa-solid fa-paper-plane mr-2"></i>
                        Reject
                    </button>}

                    {(batch?.isLocked && !batch.on_submit && !batch.approved) && (
                        <button
                            onClick={() => onManageEdit("RESULT","LOCKING")}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center transition-colors"
                        >
                            <i className="fa-solid fa-lock-open mr-2"></i>
                            Unlock Edit
                        </button>
                    )}

                    {(!batch?.isLocked && !batch.on_submit && !batch.approved) &&  (
                        <button
                            onClick={() => onManageEdit("RESULT","LOCKING")}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center transition-colors"
                        >
                            <i className="fa-solid fa-lock mr-2"></i>
                            Lock Edit
                        </button>
                    )}

                    <Button
                        className={`w-auto px-6 py-2 text-xs font-bold ${
                            isDirty
                                ? 'bg-amber-600 text-white hover:bg-amber-700'
                                : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                        onClick={onSave}
                        disabled={disabled}
                    >
                        <i
                            className={`fa-solid ${
                                isDirty ? 'fa-floppy-disk' : 'fa-circle-check'
                            } mr-2`}
                        ></i>

                        {isDirty ? 'Save Changes' : 'Saved'}
                    </Button>
                                        
                </div>
            </div>

            {/* Gradebook Table */}
            <div className="flex-1 bg-white border-x border-b border-gray-200 shadow-sm overflow-hidden flex flex-col">
                <span className="px-2">
                    {renderProgressBar(stats)}
                </span>
                <div className="overflow-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-100 text-gray-600 text-xs uppercase font-bold sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-3 border-b w-12 text-center">S/N</th>
                                <th className="p-3 border-b">Student Name</th>
                                <th className="p-3 border-b">Admission No</th>
                                <th className="p-3 border-b w-24 text-center bg-blue-50/50">CA 1 (20)</th>
                                <th className="p-3 border-b w-24 text-center bg-blue-50/50">CA 2 (20)</th>
                                <th className="p-3 border-b w-24 text-center bg-purple-50/50">Exam (60)</th>
                                <th className="p-3 border-b w-20 text-center font-black text-navy-900">Total</th>
                                <th className="p-3 border-b w-20 text-center">Grade</th>
                                <th className="p-3 border-b w-32">Remark</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {editorScores.map((score, idx) => {
                                // const student = classStudents.find(s => s.id === score.studentId);
                                return (
                                    <tr key={score.studentId} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-3 text-center text-gray-400">{idx + 1}</td>
                                        <td className="p-3 font-bold text-navy-800">{score.student_name}</td>
                                        <td className="p-3 font-mono text-xs text-gray-500">{score?.student_admission_number}</td>
                                        <td className="p-1 text-center bg-blue-50/10">
                                            <input 
                                                id={`input-${idx}-0`}
                                                onKeyDown={(e) => handleKeyDown(e, idx, 0)}
                                                type="text" 
                                                className={`w-16 p-1 text-center border rounded focus:ring-2 focus:ring-navy-900 outline-none ${score.ca1 > 20 ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300'}`}
                                                // value={score.ca1}
                                                value={
                                                    score[`${'ca1'}Abs`]
                                                        ? "ABS"
                                                        : score['ca1']
                                                }
                                                disabled={disabled}
                                                onChange={(e) => onScoreChange(score.studentId, 'ca1', e.target.value)}
                                                max={20}
                                            />
                                        </td>
                                        <td className="p-1 text-center bg-blue-50/10">
                                            <input 
                                                id={`input-${idx}-1`}
                                                onKeyDown={(e) => handleKeyDown(e, idx, 1)}
                                                type="text" 
                                                className={`w-16 p-1 text-center border rounded focus:ring-2 focus:ring-navy-900 outline-none ${score.ca2 > 20 ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300'}`}
                                                // value={score.ca2}
                                                value={
                                                    score[`${'ca2'}Abs`]
                                                        ? "ABS"
                                                        : score['ca2']
                                                }
                                                disabled={disabled}
                                                onChange={(e) => onScoreChange(score.studentId, 'ca2', e.target.value)}
                                                max={20}
                                            />
                                        </td>
                                        <td className="p-1 text-center bg-purple-50/10">
                                            <input 
                                                id={`input-${idx}-2`}
                                                onKeyDown={(e) => handleKeyDown(e, idx, 2)}
                                                type="text" 
                                                className={`w-16 p-1 text-center border rounded focus:ring-2 focus:ring-navy-900 outline-none ${score.exam > 60 ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300'}`}
                                                // value={score.exam}
                                                value={
                                                    score[`${'exam'}Abs`]
                                                        ? "ABS"
                                                        : score['exam']
                                                }
                                                disabled={disabled}
                                                onChange={(e) => onScoreChange(score.studentId, 'exam', e.target.value)}
                                                max={60}
                                            />
                                        </td>
                                        <td className="p-3 text-center font-bold text-navy-900 bg-gray-50">{score.total}</td>
                                        <td className={`p-3 text-center font-bold ${score.grade === 'F' ? 'text-red-600' : 'text-green-600'}`}>{score.grade}</td>
                                        <td className="p-3 text-xs italic text-gray-500">{score.remark}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                    <span>Total Students: {editorScores.length}</span>
                    {!batch.isUploaded && <span className="text-yellow-500 text-md" ><b className="fa-solid fa-circle-info mr-1"></b> No Record Found</span>}
                    {batch.isUploaded && <span>Last Updated : {getFormattedDate(batch.last_updated)}</span>}
                    {!batch?.isLocked && <span className="text-green-500 text-md"><b className="fa-solid fa-check mr-1"></b> EDIT MODE ACTIVATED .</span>}
                    {batch?.isLocked && <span className="text-yellow-500 text-md"><b className="fa-solid fa-circle-info mr-1"></b> The Batch is locked and cannot be edited.</span>}
                    <span><i className="fa-solid fa-circle-info mr-1"></i> Changes are saved locally until you click "Save".</span>
                </div>
            </div>
            <Modal
                                isOpen={showSubmitModal}
                                onClose={() => {
                                    setShowSubmitModal(false);
                                }}
                                title={`Confirm Submission`}
                                icon="fa-solid fa-cloud-arrow-up"
                            >
                                <div className="space-y-3 text-center p-2">
                                    <div>
                                        <h4 className="font-bold text-blue-900">
                                            Are you sure  you want submit the scores for compilation ?
                                        </h4>
            
                                    </div>
                                   
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-left">
                                            <div className="flex gap-3 mt-4">
            
                                                <button
                                                    // disabled={isLoading}
                                                    onClick={() => {
                                                        onManageEdit("RESULT","SUBMISSION");
                                                        setShowSubmitModal(false)
                                                    }}
                                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
                                                >
                                                    <i className="fa-solid fa-check mr-2"></i>
                                                    Proceed
                                                </button>
                                                <button
                                                    // disabled={isLoading}
                                                    onClick={()=> setShowSubmitModal(false)}
                                                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors"
                                                >
                                                    <i className="fa-solid fa-xmark mr-2"></i>
                                                    Cancel
                                                </button>
            
                                            </div>
                                        </div>
            
                                    <div className="text-left bg-red-50 p-3 rounded border text-red-600 border-blue-100 text-xs text-blue-800">
                                        <i className="fa-solid fa-circle-info mr-2"></i>
                                        submition will <b>{!batch.on_submit? 'LOCK':"UNLOCK"} EditMode</b> for this scores.
                                    </div>
            
                                </div>
            </Modal>
        </div>
    );
};
