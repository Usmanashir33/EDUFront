
import React, { useState, useEffect,useMemo,useContext } from 'react';

import { ClassRoom, Subject, Teacher, Student, ResultBatch, StudentScore, ActivityLog, ApprovalRecord } from '../types';

import { Modal, PinModal, Toast } from '@/components/UI';
import { ResultDashboard } from '@/components/results/ResultDashboard';
import { ResultEditor } from '@/components/results/ResultEditor';
import { FormTeacherEditor } from '@/components/results/FormTeacherEditor';
import { calculateGrade } from '@/components/results/ResultUtils';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import { authContext } from '@/customContexts/AuthContext';

interface ResultManagerProps {
    
}
type Tab =  'CLASS' | 'TEACHER' | 'SUBJECT' | 'FORM_TEACHER' | 'DIRECTOR_APPROVAL'| 'APPROVAL_HISTORY'|'RESULTS_VIEWER';

type ViewState = 'DASHBOARD' | 'EDITOR' | 'FORM_TEACHER_EDITOR';

// --- MOCK UTILS ---
// Generate data for multiple sessions and terms to demonstrate filtering
const generateMockResults = (subjects,session_id,term_id ): ResultBatch[] => {
    const allBatches: ResultBatch[] = [];
            subjects.forEach((sub,index) => {
                sub.class_rooms?.forEach(classId => {
                    const teacherId =  sub.teachers?.find(d => d.classroom === classId)?.teacher || 'unassigned';
                    // Deterministic random to simulate different statuses per term

                    allBatches.push({
                        id: `res-${session_id}-${term_id}-${sub.id}-${classId}`.replace(/\s/g, ''),
                        subjectId: sub.id,
                        classId: classId,
                        teacherId: teacherId,
                        session: session_id,
                        term: term_id,
                        isUploaded: false,
                        isLocked: false,
                        lastUpdated: false ? new Date().toISOString() : undefined,
                        totalStudents : 10, 
                        markedStudents : 0, 
                        scores: [] ,
                        status :  ""
                    });
                });
            });
    return allBatches;
};
// Generate data for multiple sessions and terms to demonstrate filtering
const generateMockSkills = (class_rooms,session_id,term_id ): ResultBatch[] => {
    const allBatches :any = [];
        class_rooms.forEach(classroom => {
            // Deterministic random to simulate different statuses per term
            allBatches.push({
                id: `res-${session_id}-${term_id}-${classroom.id}`.replace(/\s/g, ''),
                classId: classroom.id,
                session: session_id,
                term: term_id,
                isUploaded: false,
                isLocked: false,
                on_submit: false,
                lastUpdated: false ? new Date().toISOString() : undefined,
                charAndSkills: [] 
            });
        });
    return allBatches; 
};

export const TeacherResultManager: React.FC<ResultManagerProps> = ({ }) => {
    const [activeTab, setActiveTab] = useState<Tab>('CLASS');
    const [viewState, setViewState] = useState<ViewState>('DASHBOARD');
    const [searchTerm, setSearchTerm] = useState('');
    const {selectedSchool, setToast,marks,setReportsRecord,findSessionById,findTermById,subjects,classRooms:classes,teachers,students} = useContext(uiContext) ;
    const {currentUser} = useContext(authContext) ;
    const {sendRequest,sendFileRequest} = useRequest() ;
    const [serverForm,setServerForm] =useState<any|null>({})
    const [fileUploadTarget,setFileUploadTarget] = useState<"RESULT"|"CHAR"|null>('RESULT')
     // Context State
    const [selectedSession, setSelectedSession] = useState<string|null>(null);
    const [selectedTerm, setSelectedTerm] = useState<string|null>(null);

    const [results, setResults] = useState<ResultBatch[]>([]);
    const [approvalHistory, setApprovalHistory] = useState<ApprovalRecord[]>([]);
    
    
    // Editor State
    const [currentBatch, setCurrentBatch] = useState<ResultBatch | null>(null);
    const [currentSkillBatch, setCurrentSkillBatch] = useState<null | any >(null);
    const [isSkillDirty, setIsSkillDirty] = useState(false);
    const [editorSkills, setEditorSkills] = useState<any[]>([]);

    const [editorScores, setEditorScores] = useState<StudentScore[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [formTeacherClass, setFormTeacherClass] = useState<ClassRoom | null |any >(null);
    
    
    // Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTargetBatch, setUploadTargetBatch] = useState<ResultBatch | null>(null);
    const [skillBatches,setSkillBatches] = useState<any>([]);
    // Add this state near your other useState hooks
const [selectedFile, setSelectedFile] = useState(null);


// Helper function
const handleFileSelection = (e) => {
    const file = e.target.files?.[0];
    if (file) {
        setSelectedFile(file);
    }
};

const handleProceedUpload = () => {
    if (!selectedFile) return;

    const fakeEvent:any = {
        target: {
            files: [selectedFile]
        }
        
    };

    if (fileUploadTarget === "RESULT") {
        handleFileUpload(fakeEvent);
    } else if (fileUploadTarget === "CHAR") {
        handleSkillFileUpload(fakeEvent);
    }

    setSelectedFile(null);
};

const handleCancelUpload = () => {
    setSelectedFile(null);
};

    // Derived Data
    const filteredResults = useMemo(() => {
        return results.filter(
            r => r.session === selectedSchool?.sessions.find(s => s.name === selectedSession)?.id
            &&
            r.term === selectedSchool?.terms.find(t => t.name === selectedTerm)?.id

        );
    }, [results, selectedSession, selectedTerm]);

    // Security & Notification State
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingAction,setPendingAction] = useState<'SAVE' | "UPLOAD"| "CHARUPLOAD"|"REPORTGENERATION" | "BATCHMANAGE"| "BATCHAPPROVAL" |"CHAR_UPLOAD" | "SAVECHAR" |null >(null)
    
    const serverDownloader = async (resp, fileName) => {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}_template.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }
    const triggeredFuncFetch = (res) => {
        // console.log('res: ', res);
        setPendingAction(null)
        setServerForm({})
 
        if (res?.filteredBatches) { // we fetch current batch only on save, but we fetch all batches on session/term change, so we can use the same triggeredFunc for both actions
            setResults((prev) => { 
                return prev.map(r => { 
                    const fetchBatch = res.filteredBatches.find(b => b.subjectId === r.subjectId && b.classId === r.classId);
                    return fetchBatch ||  r ;
                });
            });
            return ;
        }
        if (res?.filteredCharAndSkills) { // we fetch current batch only on save, but we fetch all batches on session/term change, so we can use the same triggeredFunc for both actions
            setSkillBatches((prev) => { 
                return prev.map(r => { 
                    const fetchBatch = res?.filteredCharAndSkills.find(b => b.class_room === r.classId && b.classId === r.classId);
                    return fetchBatch ||  r ;
                });
            });
            return ;
        }
        
        if (res?.reportRecords) { // update approval histories
            setReportsRecord(res.reportRecords);
            return ;
        }
    }
    const triggeredFunc = (res) => {
        setPendingAction(null)
        setServerForm({})
        if (res?.success)setToast({message:res?.success, type:'success'})
        if (res?.manageResults) { // update the approved  Results data  list
            let ar = res?.manageResults
            setCurrentBatch(r => (ar.id === r?.id)? {...r,...ar} : r );
            setResults(prev => prev.map(r => {
                let updated = ar.id === r?.id
                return updated? {...r,...ar} : r;
            }));
        }
        if (res?.manageSkills) { 
            let ar = res?.manageSkills ;
            setCurrentSkillBatch(prev => (ar.id === prev?.id)? {...prev,...ar} : prev );
            setSkillBatches(prev => prev.map(r => {
                let updated = (ar.id === r?.id)? {...r,...ar} : r ;
                return updated
            }));
        
        }
        if (res?.currentSkills) { // update response from save action
            let updated = res?.currentSkills ;
            setSkillBatches((prev) => prev.map((batch) => {
                let classMatch =updated?.classId === batch.classId ;
                let termMatch =updated?.term === batch.term ;
                let sessionMatch =updated?.session === batch.session ;
                return (classMatch && termMatch && sessionMatch) ? updated : batch;
            }))
            setEditorSkills(updated?.charAndSkills) ;
            setCurrentSkillBatch(updated);
            setIsSkillDirty(false);
            return ;
        }
        if (res?.currentBatch) { // update response from save action
            setCurrentBatch(res.currentBatch);
            const classStudents = students.filter(s => s?.active_class_rooms?.includes(res.currentBatch.classId));
            // make sure all students are included 
            const existed_scores = classStudents.map(student => {
                const existingScore = res.currentBatch.scores.find(s => s.studentId === student.id);
                return existingScore || {
                    studentId: student.id,
                    ca1: 0, ca2: 0, exam: 0, total: 0, grade: 'N/A', remark: 'No Score',
                    ca1Abs:false,ca2Abs:false,examAbs:false,
                };
            });
            setEditorScores(existed_scores)  ;
            setResults(prev => prev.map(r => r.id === currentBatch?.id ? res.currentBatch : r));
            setIsDirty(false) ;
            return ;
        }
        
    }
    useEffect(() => {
        // Whenever session or term changes, reset to dashboard view
        if (selectedSchool){
            setSelectedSession(selectedSchool.sessions?.find(s => s.is_current)?.name || 'Unknown Session');
            setSelectedTerm(selectedSchool.terms?.find(t => t.is_current)?.name || 'Unknown Term');
        }
    }, [selectedSchool]);

    useEffect(() => {
        // Whenever session or term changes, reset to dashboard view
        if (subjects && selectedSession && selectedTerm && selectedSchool) {
            let session_id = selectedSchool?.sessions?.find(s => s.name === selectedSession)?.id || 'unknown_session';
            let term_id = selectedSchool?.terms?.find(t => t.name === selectedTerm)?.id || 'unknown_term';
            let freshData = generateMockResults(subjects,session_id, term_id)
            setResults(freshData);
            // we call api here to fetch results for the selected session and term, but for now we generate mock data
            // API CALL HERE to fetch results for selectedSession and selectedTerm
            let url =`/result/result-batch/fetch-by-teacher/${selectedSchool.id}/${session_id}/${term_id}/`
            sendRequest(url,"GET",null as any,triggeredFuncFetch,true,false);
    }
    }, [selectedSession,selectedTerm,subjects]);

    useEffect(() => {
        // Whenever session or term changes, reset to dashboard view
        if (selectedSession && selectedTerm && selectedSchool) {
            let session_id = findSessionById(selectedSession)?.id;
            let term_id = findTermById(selectedTerm)?.id;
            let url =`/result/reportrecords-by-teacher/${selectedSchool.id}/${session_id}/${term_id}/`
            sendRequest(url,"GET",null as any,triggeredFuncFetch,true,false);
    }
    }, [selectedSession,selectedTerm]);
    
    useEffect(() => {
        // Whenever session or term changes, reset to dashboard view
        if (selectedSession && selectedTerm ) {
            let session_id = selectedSchool?.sessions?.find(s => s.name === selectedSession)?.id || 'unknown_session';
            let term_id = selectedSchool?.terms?.find(t => t.name === selectedTerm)?.id || 'unknown_term';
            let s = generateMockSkills(classes,session_id, term_id)
            setSkillBatches(s) ;
            // API CALL HERE to fetch results for selectedSession and selectedTerm
            let url =`/result/result-skill/fetch-by-teacher/${selectedSchool.id}/${session_id}/${term_id}/`;    
            sendRequest(url,"GET",null as any,triggeredFuncFetch,true,false)
        }
       
    }, [selectedSession,selectedTerm,selectedSchool]);

    const handleOpenFormTeacherEditor = (classRoom: ClassRoom) => {
        let  batch = skillBatches.find(b => b.classId  === classRoom.id)
        setFormTeacherClass(classRoom);
        setCurrentSkillBatch(batch);
        setIsSkillDirty(false);
        setViewState('FORM_TEACHER_EDITOR');
    };

    const handleOpenEditor = (batch: ResultBatch) => { 
        setCurrentBatch(batch) ;
        setViewState('EDITOR');
    };
    
     // --- HANDLE PIN SUCCESS ---
    const handlePinSuccess = (pins:string) => {
        setShowPinModal(false); 
        // let form = serverForm
        
        // Make the api call here  when pin is not needed by the user 
        if (pendingAction === 'SAVE') {
            sendRequest(`/result/result-batch/upsert-by-teacher/`,"POST",{...serverForm,pin:pins} as any ,triggeredFunc,true,false)
            return ;
        }
        if (pendingAction === 'UPLOAD') {
            serverForm.append('pin', pins) ;
            let url = `/result/result-batch/upload-by-teacher/`
            sendRequest(url ,"POST",serverForm as any ,triggeredFunc,true,true) // is formdata, is secure
            return ;
        }
        if (pendingAction === 'CHARUPLOAD') {
            serverForm.append('pin', pins) ;
            let url = `/result/result-skill/upload-by-teacher/`
            sendRequest(url ,"POST",serverForm as any ,triggeredFunc,true,true) // is formdata, is secure
            return ;
        }
        
        if (pendingAction === 'SAVECHAR') {
            let url = `/result/result-skill/save-by-teacher/`
            sendRequest(url ,"POST",{...serverForm,pin:pins} as any,triggeredFunc,true,false) // is not  formdata, is secure
            return ;
        }
        if (pendingAction === 'BATCHMANAGE') {
            let url = `/result/result-editing/managing-by-teacher/`
            sendRequest(url ,"POST",{...serverForm,pin:pins} as any ,triggeredFunc,true,!true)
            return ;
        }
        
    };

    const handleSaveScores = () => { 
        if (!currentBatch) return;
        // Check if any score is actually entered to mark as uploaded
        const hasData = editorScores.some(s => s.total > 0);
        const updatedBatch = { 
            ...currentBatch,  
            scores: editorScores, 
            isUploaded: hasData, 
            teacher : currentBatch.teacherId ,
            class_room : currentBatch.classId ,
            subject : currentBatch.subjectId ,
            school : selectedSchool.id ,
            pin : ''
        };
        setServerForm(updatedBatch) ; 

        setPendingAction('SAVE') ;  
        if (!currentUser?.user?.pin_set){
            sendRequest(`/result/result-batch/upsert-by-teacher/`,"POST",serverForm as any ,triggeredFunc,true,false)
            return ;
        }
        setShowPinModal(true) 
        return ;
    };

    const handleManageEdit = (pendingAction :"RESULT" | "CHAR",action:"LOCKING"|"SUBMISSION") => {
        const target = pendingAction
        let targetBatchId = target === 'RESULT'? currentBatch?.id : currentSkillBatch?.id 
        setServerForm({
            target,
            action,
            school : selectedSchool?.id ,
            batch : targetBatchId ,
            pin : ""
        })
        setPendingAction("BATCHMANAGE");
        if (!currentUser?.user?.pin_set) {
            // process file immediately if no pin is set
            let url = `/result/result-editing/managing-by-teacher/`
            sendRequest(url ,"POST",serverForm as any ,triggeredFunc,true,!true)
            return ;
        }
        setShowPinModal(true) ;
    }
 
    
    const handleScoreChange = (studentId: string,field: 'ca1' | 'ca2' | 'exam',value: string) => {
        const absentField = `${field}Abs` as 'ca1Abs' | 'ca2Abs' | 'examAbs';

        setEditorScores(prev =>
            prev.map(score => {

                if (score.studentId !== studentId) {
                    return score;
                }

                const updated = { ...score };

                // Handle ABS
                if (value.trim().toUpperCase() === "0A" || value.trim().toUpperCase() === "0B") {
                    updated[field] = 0;
                    updated[absentField] = true;
                } else {
                    const maxScore = field === "exam" ? marks.exam :field === "ca1" ? marks.ca1 : marks.ca2;
                    const numVal = Math.min(   Math.max(Number(value) || 0, 0),   maxScore);
                    updated[field] = numVal;
                    updated[absentField] = false;
                }
                // Recalculate totals
                updated.total =
                    (updated.ca1 || 0) +
                    (updated.ca2 || 0) +
                    (updated.exam || 0);

                const { grade, remark } = calculateGrade(updated.total);

                updated.grade = grade;
                updated.remark = remark;
                return updated;
            })
        );

        setIsDirty(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPendingAction('UPLOAD') ;
            let sessionId = selectedSchool?.sessions.find(s => s.name === selectedSession)?.id;
            let termId = selectedSchool?.terms.find(t => t.name === selectedTerm)?.id ;
            let form = new FormData() ;
            form.append('file', e.target.files[0]);
            form.append('school', selectedSchool.id);
            form.append('session', sessionId);
            form.append('term', termId);
            form.append('subject', currentBatch?.subjectId || '') ;
            form.append('class_room', currentBatch?.classId || '') ;
            form.append('teacher', currentBatch?.teacherId || '') ;
            setServerForm(form) ;
            setShowUploadModal(false) ;
            if (!currentUser?.user?.pin_set) {
                // process file immediately if no pin is set
                let url = `/result/result-batch/upload-by-teacher/`
                sendRequest(url ,"POST",serverForm as any,triggeredFunc,true,true)
                return ;
            }
            setShowPinModal(true) ;
        }
    };

    const handleSkillFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPendingAction('CHARUPLOAD') ;
            let sessionId = selectedSchool?.sessions.find(s => s.name === selectedSession)?.id;
            let termId = selectedSchool?.terms.find(t => t.name === selectedTerm)?.id ;
            let form = new FormData() ;
            form.append('file', e.target.files[0]);
            form.append('school', selectedSchool.id);
            form.append('session', sessionId);
            form.append('term', termId);
            form.append('class_room', formTeacherClass?.id);
            form.append('teacher', formTeacherClass?.form_teacher.id) ;
            setServerForm(form) ;
            setShowUploadModal(false) ;
            if (!currentUser?.user?.pin_set) {
                // process file immediately if no pin is set
                let url = `/result/result-skill/upload-by-teacher/`
                sendRequest(url ,"POST",serverForm,triggeredFunc,true,true)
                return ;
            }
            setShowPinModal(true) ;
        }
    };

    const handleApproveResult = (batchIds: string[] ,target: "RESULT" | "CHAR") => {
        
    };
   
    const downloadCharSheet = (class_id:any ) => {
        setPendingAction("CHAR_UPLOAD")  
        let cls = classes.find((c) => c.id === class_id)
        let sessionId = selectedSchool?.sessions.find(s => s.name === selectedSession)?.id;
        let termId = selectedSchool?.terms.find(t => t.name === selectedTerm)?.id ;
        let url = `/result/result-skill/download/${selectedSchool?.id}/${sessionId}/${termId}/${class_id}/`
        let fileName = `${cls?.name}_Psychomotor&skills`;
        sendFileRequest(url, 'GET', null as any, serverDownloader,fileName, true, !true);
        
        return ;
    }
    const handleSaveChar = (scores) => {
        setPendingAction("SAVECHAR") ;
        let sessionId = selectedSchool?.sessions.find(s => s.name === selectedSession)?.id;
        let termId = selectedSchool?.terms.find(t => t.name === selectedTerm)?.id ;
        const SaveForm : any = {
            school : selectedSchool?.id,
            class_room : formTeacherClass?.id ,
            session : sessionId, 
            term : termId, 
            teacher : formTeacherClass?.form_teacher,
            charAndSkills : scores ,
        }
        setServerForm(SaveForm)
        if (!currentUser?.user?.pin_set) {
            let url = `/result/result-skill/save-by-teacher/` ;
            sendRequest(url ,"POST",SaveForm,triggeredFunc,true,false); // is not  formdata, is secure
            return ;
        }
        setShowPinModal(true) ;
    }

    return (
        <>
        <PinModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPendingAction(null as any); }} onSuccess={handlePinSuccess} title={'Confirm Action'} />
        <div className="animate-fadeIn h-full flex flex-col reletive ">
            
            {viewState === 'DASHBOARD' ? (
                    <ResultDashboard 
                        activeTab={activeTab}
                        searchTerm={searchTerm}
                        teachers={teachers}
                        subjects={subjects}
                        results={filteredResults}
                        skills = {skillBatches}
                        students={students}
                        selectedSession={selectedSession || ''}
                        approvalHistory={approvalHistory}
                        onOpenFormTeacherEditor={handleOpenFormTeacherEditor}
                        onApproveResult={handleApproveResult}
                        onTabChange={setActiveTab}
                        selectedTerm={selectedTerm || ''}
                        onOpenEditor={handleOpenEditor}
                        onSearchChange={setSearchTerm}
                        onSessionChange={setSelectedSession}
                        onTermChange={setSelectedTerm}
                        accessData={
                        {
                            role : currentUser?.role.toLowerCase() || 'teacher',
                            canApprove :false ,
                            canGenerateReports : false ,
                            masterClassIds : classes.filter(c => c.form_teacher?.id === currentUser?.id).map(c => c.id) || [],
                        }
                        }
                    />

             ) : viewState === 'EDITOR' ? (
                currentBatch && (
                    // some props are passed to ResultEditor, including batch, setBatch, setEditorScores, setIsDirty, editorScores, isDirty, selectedSession, selectedTerm, onClose, onSave, onScoreChange, onImportClick, onManageEdit, and accessData
                    // are useless  ijust leave it because i want to keep the code structure consistent with the other components
                    <ResultEditor 
                        batch={currentBatch}
                        setBatch ={setCurrentBatch}
                        setEditorScores={setEditorScores}
                        setIsDirty ={setIsDirty}    
                        editorScores={editorScores}
                        isDirty={isDirty}
                        selectedSession={selectedSession || ''}
                        selectedTerm={selectedTerm || ''}
                        onClose={() => setViewState('DASHBOARD')}
                        onSave={handleSaveScores}
                        onScoreChange={handleScoreChange}
                        onImportClick = { () => { 
                            setUploadTargetBatch(currentBatch); 
                            setShowUploadModal(true); 
                        }}
                        onManageEdit ={handleManageEdit}
                        accessData={
                            {role : currentUser?.role.toLowerCase() || 'teacher',
                                canApprove :false ,
                                canGenerateReports : false ,
                                masterClassIds : classes.filter(c => c.form_teacher?.id === currentUser?.id).map(c => c.id) || [],
                            }
                        }
                    />
                )
            ) : viewState === 'FORM_TEACHER_EDITOR' ? (
                (formTeacherClass && currentSkillBatch) && (
                    <FormTeacherEditor 
                        batch={currentSkillBatch}
                        setBatch ={setCurrentSkillBatch}
                        classRoom={formTeacherClass} 

                        initialSkills = {editorSkills}
                        setEditorSkills={setEditorSkills}
                        isDirty = {isSkillDirty}
                        setIsDirty = {setIsSkillDirty}

                        onClose={() => setViewState('DASHBOARD')}
                        onHandleSave = {handleSaveChar}
                        onDownloadCharSheet ={downloadCharSheet}
                        onImportClick = { () => { 
                            setFileUploadTarget("CHAR") 
                            setShowUploadModal(true); 
                        }}
                        onManageEdit = {handleManageEdit}
                        accessData={
                        {
                            role : currentUser?.role.toLowerCase() || 'teacher',
                            canApprove :false ,
                            canGenerateReports : false ,
                            masterClassIds : classes.filter(c => c.form_teacher?.id === currentUser?.id).map(c => c.id) || [],
                        }
                        }
                       
                    />
                )
            ) : null as any}

            {/* CSV UPLOAD MODAL */}
            <Modal
                    isOpen={showUploadModal}
                    onClose={() => {
                        setShowUploadModal(false);
                        setSelectedFile(null);
                    }}
                    title={`Upload ${fileUploadTarget} Batch`}
                    icon="fa-solid fa-cloud-arrow-up"
                >
                    <div className="space-y-3 text-center p-2">

                        <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto text-navy-600 text-2xl">
                            <i className="fa-solid fa-file-csv"></i>
                        </div>

                        <div>
                            <h4 className="font-bold text-navy-900">
                                Select CSV / Excel File
                            </h4>

                            {fileUploadTarget === "RESULT" && (
                                <p className="text-sm text-gray-500">
                                    Ensure the file matches the template format
                                    (S/N, Name, AdmNo, CA1, CA2, Exam).
                                </p>
                            )}

                            {fileUploadTarget === "CHAR" && (
                                <p className="text-sm text-gray-500">
                                    Ensure the file matches the students list with ratings (1-5).
                                </p>
                            )}
                        </div>

                        <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50 hover:bg-white transition-colors relative">

                            <input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                onChange={handleFileSelection}
                            />

                            <div className="pointer-events-none">
                                <span className="bg-navy-900 text-white px-4 py-2 rounded text-sm font-bold shadow-md">
                                    Browse Files
                                </span>

                                <p className="text-xs text-gray-400 mt-3">
                                    or drag and drop here
                                </p>
                            </div>
                        </div>

                        {selectedFile && (
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-left">

                                <div className="flex items-center gap-2 text-green-700">
                                    <i className="fa-solid fa-file-circle-check"></i>

                                    <div className="flex-1">
                                        <p className="font-semibold break-all">
                                            {selectedFile?.name}
                                        </p>

                                        <p className="text-xs text-green-600">
                                            {(selectedFile?.size / 1024).toFixed(2)} KB
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-4">

                                    <button
                                        onClick={handleProceedUpload}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
                                    >
                                        <i className="fa-solid fa-check mr-2"></i>
                                        Proceed
                                    </button>

                                    <button
                                        onClick={handleCancelUpload}
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition-colors"
                                    >
                                        <i className="fa-solid fa-xmark mr-2"></i>
                                        Cancel
                                    </button>

                                </div>
                            </div>
                        )}

                        <div className="text-left bg-blue-50 p-3 rounded border border-blue-100 text-xs text-blue-800">
                            <i className="fa-solid fa-circle-info mr-2"></i>
                            Uploading will <b>overwrite</b> any existing data for this entry.
                        </div>

                    </div>
            </Modal>
        </div>
        </>
    );
};
