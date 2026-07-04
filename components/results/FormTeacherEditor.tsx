import React, { useState, useRef, useEffect ,useContext } from 'react';
import { ClassRoom, Student } from '../../types';
import { Button, Modal } from '../UI';
import { getCompletenessStats } from './ResultUtils';
import { uiContext } from '@/customContexts/UiContext';
import { AnyAaaaRecord } from 'dns';
import useRequest from '@/customHooks/RequestHook';


interface FormTeacherEditorProps {
    batch : any ;
    setBatch :any ;
    classRoom: ClassRoom;

    initialSkills: any ;
    setEditorSkills : any,
    isDirty :boolean ;
    setIsDirty : any,

    onClose: () => void;
    onHandleSave: (data:AnyAaaaRecord) => void;
    onImportClick: () => void;
    onDownloadCharSheet: (t: string) => void;
    onManageEdit : (a:any,b:any) => void ;
    accessData:any
    
}

// type SkillScores = Record<string, number>;

const StarRating = ({ 
    value, 
    onChange, 
    max = 5,
    id,
    onNavigate
}: { 
    value: number, 
    onChange: (val: number) => void, 
    max?: number,
    id?: string,
    onNavigate?: (direction: 'next' | 'prev' | 'down' | 'up') => void
}) => {
    const [hover, setHover] = useState<number | null>(null);
    const labels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];
    const containerRef = useRef<HTMLDivElement>(null);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === 'ArrowRight') {
            e.preventDefault();
            onNavigate?.('next');
        } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onNavigate?.('prev');
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            onNavigate?.('down');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            onNavigate?.('up');
        } else if (e.key >= '1' && e.key <= '5') {
            onChange(parseInt(e.key));
            // Optional: Auto-advance on selection?
            onNavigate?.('next');
        }
    };

    return (
        <div 
            ref={containerRef}
            id={id}
            tabIndex={0}
            className="flex items-center justify-center gap-1 outline-none focus:ring-2 focus:ring-navy-200 rounded px-1" 
            onMouseLeave={() => setHover(null)}
            onKeyDown={handleKeyDown}
        >
            {[...Array(max)].map((_, i) => {
                const ratingValue = i + 1;
                const isSelected = ratingValue <= (hover || value);
                return (
                    <button
                        key={i}
                        type="button"
                        title={labels[i]}
                        tabIndex={-1} // Prevent individual stars from being tabbed
                        className={`relative w-6 h-6 flex items-center justify-center text-xs focus:outline-none transition-all transform hover:scale-110 ${
                            isSelected ? 'text-gold-500' : 'text-gray-300'
                        }`}
                        onClick={() => {
                            onChange(ratingValue);
                            // Keep focus on container
                            containerRef.current?.focus();
                        }}
                        onMouseEnter={() => setHover(ratingValue)}
                    >
                        <i className={`fa-star ${isSelected ? 'fa-solid' : 'fa-regular'} text-lg`}></i>
                        <span className={`absolute inset-0 flex items-center justify-center text-[8px] font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`} style={{ paddingTop: '1px' }}>
                            {ratingValue}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};
const renderProgressBar = (stats: { scored: number, total: number, percentage: number, status: string }) => {
        let color = 'bg-gray-200';
        if (stats.status === 'COMPLETE') color = 'bg-green-500';
        else if (stats.status === 'PARTIAL') color = 'bg-orange-400';

        return (
            <div className="w-full mt-2">
                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1">
                    <span>{stats.status}</span>
                    <span> {stats.scored}/{stats.total} Recorded</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${stats.percentage}%` }}></div>
                </div>
            </div>
        );
    };

export const FormTeacherEditor: React.FC<FormTeacherEditorProps> = ({
    batch ,
    setBatch,
    classRoom,
    initialSkills:scores ,
    isDirty,
    setEditorSkills,
    setIsDirty,
    onClose,
    onHandleSave,
    onImportClick,
    onDownloadCharSheet,
    onManageEdit,
    accessData
}) => {
    // Skills list for navigation order
    const psychomotorSkills = ['punctuality', 'honesty','neatness', 'leadership'] ;
    const otherSkills = ['handwriting', 'verbal_fluency', 'creativity'] ;
    const allSkills = [...psychomotorSkills, ...otherSkills] ;
    const [showSubmitModal,setShowSubmitModal] = useState(false) ;
    const {getFormattedDate,setToast,students,selectedSchool} = useContext(uiContext) ;
    const [classStudents,setClassStudents] = useState(students.filter(s => s.active_class_rooms.includes(batch.classId)) );
    const {sendRequest} = useRequest() ;
    const disabled = batch.on_submit || batch.isLocked 
    const stat = getCompletenessStats(batch) ; 
    const handleSkillsChange = (studentId: string, skill: string, value: number) => {
        const numVal = Math.min(Math.max(Number(value) || 0, 0), 5); // Clamp values
        setEditorSkills(prev => prev.map((rec) => {
            if (rec.studentId === studentId){
                let updated = {...rec,[skill]:numVal}
                return updated
            }
            return rec
        }));
        
        return setIsDirty(true)
    };
    
    const TriggeredFunc = (resp) => {
        // console.log('resp: ', resp);
        if (resp?.batch){
            let sts = resp?.batchAllstudents ;
            setBatch(prev => prev.id === resp.batch?.id ? {...resp.batch} : prev) ;
            setClassStudents(prev => {
                return sts ;
            });
        }
    }
    const handleNavigate = (studentIndex: number, skillIndex: number, direction: 'next' | 'prev' | 'down' | 'up') => {
    let nextStudentIndex = studentIndex;
    let nextSkillIndex = skillIndex;

    const allSkills = [...psychomotorSkills, ...otherSkills]; // Ensure allSkills matches your full array structure

    if (direction === 'next') {
        nextSkillIndex++;
        if (nextSkillIndex >= allSkills.length) {
            nextSkillIndex = 0;
            nextStudentIndex++;
        }
    } else if (direction === 'prev') {
        nextSkillIndex--;
        if (nextSkillIndex < 0) {
            nextSkillIndex = allSkills.length - 1;
            nextStudentIndex--;
        }
    } else if (direction === 'down') {
        nextStudentIndex++;
    } else if (direction === 'up') {
        nextStudentIndex--;
    }

    // ✅ FIX 1: Check against scores length because that is what's rendering your rows
    if (nextStudentIndex >= 0 && nextStudentIndex < (scores?.length || 0)) {
        const nextSkill = allSkills[nextSkillIndex];
        
        // ✅ FIX 2: Generate the exact element ID structure used in your JSX (index-based)
        const elementId = `rating-${nextStudentIndex}-${nextSkill}`;
        
        const targetElement = document.getElementById(elementId);
        if (targetElement) {
            targetElement.focus();
        }
    }
};


    const handleSave = () => {
        // we neet thi data i he back 
        const formatted  = Object.entries(scores).map(([studentId, value]) => ({
            studentId ,
            ...(value as object || {})
        })) as any ;
        onHandleSave(formatted)
    };
    useEffect(() => {
            if (batch) {
                // make sure all students are included 
                    // make sure all students are included 
            // 1. Get a fast-lookup set of all student IDs already present in this batch
                const existingStudentIds = new Set(batch?.charAndSkills?.map(s => s.studentId)) || [];
                // 2. Filter out classStudents missing from the batch, and create empty templates for them
                const missingStudentsMocked = classStudents
                    .filter(student => !existingStudentIds.has(student.id))
                    .map(student => ({
                        studentId: student.id,
                        student_name : student.first_name + " " + student.last_name,
                        student_admission_number : student.admission_number,

                        punctuality : 0 ,
                        honesty : 0 ,
                        neatness : 0 ,
                        leadership : 0 ,
                        handwriting : 0 ,
                        verbal_fluency : 0 ,
                        creativity : 0 ,
                    }));

                // 3. Create the final combined scores list (Existing Batch Students + Missing Mocked Students)
                const finalScoresList = [...batch?.charAndSkills || [], ...missingStudentsMocked];
                setEditorSkills(finalScoresList) ;
        
                }
            setIsDirty(false);
           
        },[classStudents,batch]);
    useEffect(() => {
        // fetch the remaining class students pls 
        let url = `/result/result-skill/detail/${selectedSchool?.id}/${batch.session}/${batch.term}/${batch.classId}/`;
        sendRequest(url,"GET",null as any ,TriggeredFunc,true,true)
    
    },[])

    return (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h2 className="text-lg font-bold text-navy-900">Form Teacher Assessment</h2>
                    <p className="text-xs text-gray-500">{classRoom.name} - Psychomotor & Other Skills</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={onClose} className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-bold text-xs transition-colors">
                        Cancel
                    </button>
                    {(batch?.isLocked && !batch.on_submit && !batch.approved) && <button 
                        onClick={() => {onManageEdit("CHAR","LOCKING")}} // SUBMISSION for Submit 
                        className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-2 rounded flex items-center">
                        <i className="fa-solid fa-lock-close mr-2"></i> Unlock Edit
                    </button>}
                    {(!batch?.isLocked && !batch.on_submit && !batch.approved) && <button 
                        onClick={() => {onManageEdit("CHAR","LOCKING")}}
                        className="bg-red-500 hover:bg-red-400 text-white text-xs font-bold px-3 py-2 rounded flex items-center">
                        <i className="fa-solid fa-lock-close "></i> Lock Edit
                    </button>}
                    <button 
                        disabled={disabled} 
                        onClick={onImportClick}
                        className="bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-3 py-2 rounded flex items-center"
                    >
                        <i className="fa-solid fa-file-csv mr-2"></i> Upload CSV
                    </button>
                    <button 
                        onClick={() => {onDownloadCharSheet(classRoom.id)}}
                        className="bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold px-3 py-2 rounded flex items-center"
                    >
                        <i className="fa-solid fa-download mr-2"></i> Template
                    </button>
                    {(!disabled && !batch.approved) && <button
                        onClick={() => {
                            if (isDirty) return setToast({message:"Save the changes first!",type:'info'})
                            setShowSubmitModal(true)
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center transition-colors"
                    >
                        <i className="fa-solid fa-paper-plane mr-2"></i>
                        Submit
                    </button>}
                    {((batch?.on_submit || batch.approved) && accessData.canApprove) && <button
                        onClick={() => {
                            // if (isDirty) return setToast({message:"Save the changes first!",type:'info'})
                            setShowSubmitModal(true)
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-2 rounded flex items-center transition-colors"
                    >
                        <i className="fa-solid fa-paper-plane mr-2"></i>
                        Reject
                    </button>}
                    <Button 
                        className={`w-auto px-6 py-2 text-xs ${isDirty ? 'bg-gold-500 text-navy-900 hover:bg-gold-400' : 'bg-green-600 hover:bg-green-500'}`}
                        onClick={handleSave}
                        disabled={batch?.isLocked || !isDirty }
                    >
                        <i className={`fa-solid ${isDirty ? 'fa-save' : 'fa-check'} mr-2`}></i> {isDirty ? 'Save Changes' : 'Saved'}
                    </Button>
                    
                </div>
            </div>
            
            {renderProgressBar(stat)}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-navy-50 text-navy-900 uppercase font-bold sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="p-2 border-b border-gray-200 border-r bg-navy-50 sticky left-0 z-20 w-64">Student</th>
                            <th className="p-2 border-b border-gray-200 text-center border-r" colSpan={5}>Psychomotor Skills (1-5)</th>
                            <th className="p-2 border-b border-gray-200 text-center" colSpan={3}>Affective Domain (1-5)</th>
                        </tr>
                        <tr className="bg-gray-100 text-[9px] tracking-wider">
                            <th className="p-1.5 border-b border-gray-200 border-r bg-gray-100 sticky left-0 z-20">Name & Admission No.</th>
                            {allSkills?.map((skill,i) => (
                                <th key ={i} className="p-1.5 border-b border-gray-200 text-center min-w-[100px]">{skill}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {scores?.map((sc, sIdx) => (
                            <tr key={`st-${sc.studentId}`} className={`${sIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} hover:bg-blue-50/50 transition-colors`}>
                                <td className="p-2 border-r border-gray-100 font-medium text-navy-800 whitespace-nowrap sticky left-0 z-10 bg-inherit shadow-[1px_0_0_0_#f3f4f6]">
                                    <div className="flex flex-col bg-gray-100 rounded-sm -ml-1 p-1">
                                        <span className="text-sm b">{sc.student_name}  </span>
                                        <span className="text-[10px] text-gray-500 font-mono">{sc.student_admission_number}</span>
                                    </div>
                                </td>
                                {/* Psychomotor */}
                                {psychomotorSkills.map((skill, kIdx) => (
                                    <td key={skill} className="p-1 text-center">
                                        <StarRating 
                                            id={`rating-${sIdx}-${skill}`}
                                            value={scores.find(s => s.studentId === sc.studentId)?.[skill] || 0} 
                                            onChange={(val) => {
                                                if (!batch.isLocked){
                                                    handleSkillsChange(sc.studentId, skill, val)
                                                }
                                            }}
                                            onNavigate={(dir) => handleNavigate(sIdx, kIdx, dir)}
                                        />
                                    </td>
                                ))}
                                {/* Other Skills */}
                                {otherSkills.map((skill, kIdx) => (
                                    <td key={skill} className={`p-1 text-center ${kIdx === 0 ? 'border-l border-gray-100' : ''}`}>
                                        <StarRating 
                                            id={`rating-${sIdx}-${skill}`}
                                            value={scores.find(s => s.studentId === sc.studentId)?.[skill] || 0} 
                                            onChange={(val) => {
                                                if (!batch.isLocked){
                                                    handleSkillsChange(sc.studentId, skill, val)
                                                }
                                            }}
                                            onNavigate={(dir) => handleNavigate(sIdx, psychomotorSkills.length + kIdx, dir)}
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {scores.length === 0 && (
                            <tr>
                                <td colSpan={9} className="p-4 text-center text-gray-500 italic">
                                    No students found in this class.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-gray-500">
                <p><i className="fa-solid fa-circle-info mr-1"></i> Use Arrow Keys or Enter to navigate. Type 1-5 to rate.</p>
                <p>Total Students: {batch.totalStudents || 0}</p>
            </div>
            <div className="p-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-500 flex justify-between">
                    {!batch.isUploaded && <span className="text-yellow-500 text-md" ><b className="fa-solid fa-circle-info mr-1"></b> No Record Found</span>}
                    {batch.isUploaded && <span>Last Updated : {getFormattedDate(batch.last_updated)}</span>}
                    {!batch?.isLocked && <span className="text-green-500 text-md"><b className="fa-solid fa-check mr-1"></b> EDIT MODE ACTIVATED .</span>}
                    {batch?.isLocked && <span className="text-yellow-500 text-md"><b className="fa-solid fa-circle-info mr-1"></b> The Batch is locked and cannot be edited.</span>}
                    <span><i className="fa-solid fa-circle-info mr-1"></i> Changes are saved locally until you click "Save".</span>
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
                                                        Are you sure  you want submit the traits for compilation ?
                                                    </h4>
                        
                                                </div>
                                               
                                                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-left">
                                                        <div className="flex gap-3 mt-4">
                        
                                                            <button
                                                                // disabled={isLoading}
                                                                onClick={() => {
                                                                    onManageEdit("CHAR","SUBMISSION");
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
                                                    submition will <b>{!batch.on_submit? 'Lock':"Unlock"} EditMode</b> for this scores.
                                                </div>
                        
                                            </div>
                        </Modal>
        </div>
    );
}
