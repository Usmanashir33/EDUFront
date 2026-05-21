
import React, { useState, useEffect,useMemo,useContext } from 'react';

import { ClassRoom, Subject, Teacher, Student, ResultBatch, StudentScore, ActivityLog, ApprovalRecord } from '../types';

import { Modal, PinModal, Toast } from '../components/UI';
import { ResultDashboard } from '../components/results/ResultDashboard';
import { ResultEditor } from '../components/results/ResultEditor';
import { FormTeacherEditor } from '../components/results/FormTeacherEditor';
import { calculateGrade } from '../components/results/ResultUtils';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import { authContext } from '@/customContexts/AuthContext';

interface ResultManagerProps {
    classes: ClassRoom[];
    subjects: Subject[];
    teachers: Teacher[];
    students: Student[];
    onLogActivity: (action: ActivityLog['action'], module: ActivityLog['module'], description: string) => void;
}
type Tab = 'CLASS' | 'TEACHER' | 'SUBJECT' | 'FORM_TEACHER';
type ViewState = 'DASHBOARD' | 'EDITOR' | 'FORM_TEACHER_EDITOR';

// --- MOCK UTILS ---
// Generate data for multiple sessions and terms to demonstrate filtering
const generateMockResults = (subjects,session_id,term_id ): ResultBatch[] => {
    const allBatches: ResultBatch[] = [];
            subjects.forEach((sub,index) => {
                sub.class_rooms.forEach(classId => {
                    const teacherId =  sub.teacher[0] || 'unassigned';
                    // Deterministic random to simulate different statuses per term
                    let isUploaded = false;
                    
                    isUploaded = false; // 3rd term mostly empty
                    allBatches.push({
                        id: `res-${session_id}-${term_id}-${sub.id}-${classId}`.replace(/\s/g, ''),
                        subjectId: sub.id,
                        classId: classId,
                        teacherId: teacherId,
                        session: session_id,
                        term: term_id,
                        isUploaded: isUploaded,
                        isLocked: false,
                        lastUpdated: isUploaded ? new Date().toISOString() : undefined,
                        scores: [] ,
                        status : index > 4 ? "APPROVED" : ""
                    });
                });
            });
    return allBatches;
};
// Generate data for multiple sessions and terms to demonstrate filtering
const generateMockSkills = (class_rooms,session_id,term_id ): ResultBatch[] => {
    const allBatches = [];
                class_rooms.forEach(classroom => {
                    // Deterministic random to simulate different statuses per term
                    let isUploaded = false;
                    isUploaded = false; // 
                    allBatches.push({
                        id: `res-${session_id}-${term_id}-${classroom}`.replace(/\s/g, ''),
                        classId: classroom.id,
                        session: session_id,
                        term: term_id,
                        isUploaded: isUploaded,
                        isLocked: false,
                        lastUpdated: isUploaded ? new Date().toISOString() : undefined,
                        charAndSkills: [] 
                    });
                });
    return allBatches;
};

export const ResultManager: React.FC<ResultManagerProps> = ({ classes, subjects, teachers, students, onLogActivity }) => {
    const [activeTab, setActiveTab] = useState<Tab>('CLASS');
    const [viewState, setViewState] = useState<ViewState>('DASHBOARD');
    const [searchTerm, setSearchTerm] = useState('');
    const {selectedSchool} = useContext(uiContext) ;
    const {currentUser} = useContext(authContext) ;
    const {sendRequest,sendFileRequest} = useRequest() ;
    const [serverForm,setServerForm] =useState({})
    const [fileUploadTarget,setFileUploadTarget] = useState<"RESULT"|"CHAR"|null>('RESULT')
     // Context State
    const [selectedSession, setSelectedSession] = useState(null);
    const [selectedTerm, setSelectedTerm] = useState(null);
    const [editorSkills, setEditorSkills] = useState<any[]>([]);

    const [results, setResults] = useState<ResultBatch[]>([]);
    const [approvalHistory, setApprovalHistory] = useState<ApprovalRecord[]>([]);
    
    
    // Editor State
    const [currentBatch, setCurrentBatch] = useState<ResultBatch | null>(null);
    const [currentSkillBatch, setCurrentSkillBatch] = useState<null>(null);
    const [editorScores, setEditorScores] = useState<StudentScore[]>([]);
    const [isDirty, setIsDirty] = useState(false);
    const [isSkillDirty, setIsSkillDirty] = useState(false);
    const [formTeacherClass, setFormTeacherClass] = useState<ClassRoom | null>(null);
    
    
    // Modal State
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadTargetBatch, setUploadTargetBatch] = useState<ResultBatch | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [skillBatches,setSkillBatches] = useState([])

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
    // const [selectedClass,setSelectedClass] = useState(null)
    const [pendingAction,setPendingAction] = useState<'SAVE' | "UPLOAD"| "CHARUPLOAD"|"REPORTGENERATION" | "BATCHLOCK"| "BATCHAPPROVAL" |"CHAR_UPLOAD" | "SAVECHAR" |null >(null)
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
    const triggeredFunc = (res) => {
        console.log('res: ', res);
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
        if (res?.approvedResults) { // update the approved  Results data  list
            setToast({message:res?.success, type:'success'})
            let ar = res?.approvedResults
            setResults(prev => prev.map(r => {
                let updated = ar.find(res => res.id === r?.id)
                return updated || r;
            }));
            let record = res?.history ;
            setApprovalHistory(prev => [record, ...prev]);
            setToast({ message: `Result batch(es) approved successfully`, type: 'success' });
            onLogActivity('UPDATE', 'RESULTS', `Director approved  result batches`);
            return ;
        }
        if (res?.approvedSkills) { // update the approved  Skills data  list
            setToast({message:res?.success, type:'success'});
            let ar = res?.approvedSkills ;
            setSkillBatches(prev => prev.map(r => {
                let updated = ar.find(res => res.id === r?.id)
                return updated || r;
            }));
            let record = res?.history ;
            setApprovalHistory(prev => [record, ...prev]);
            setToast({ message: `Result batch(es) approved successfully`, type: 'success' });
            onLogActivity('UPDATE', 'RESULTS', `Director approved  result batches`);
            return ;
        }
        if (res?.currentSkills) { // update response from save action
            let updated = res?.currentSkills ;
            setToast({message:res?.success, type:'success'})
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
            setToast({message:res?.success, type:'success'})
            setCurrentBatch(res.currentBatch);
            const classStudents = students.filter(s => s.active_class_rooms.includes(res.currentBatch.classId));
            // make sure all students are included 
            const existed_scores = classStudents.map(student => {
                const existingScore = res.currentBatch.scores.find(s => s.studentId === student.id);
                return existingScore || {
                    studentId: student.id,
                    ca1: 0, ca2: 0, exam: 0, total: 0, grade: 'N/A', remark: 'No Score'
                };
            });
            setEditorScores(existed_scores)  ;
            setResults(prev => prev.map(r => r.id === currentBatch.id ? res.currentBatch : r));
            onLogActivity('UPDATE', 'RESULTS', `Updated results for ${subjects.find(s => s.id === currentBatch.subjectId)?.name} (${selectedTerm})`);
            setIsDirty(false) ;
            return ;
        }
        if (res?.approvalHistories) { // update approval histories
            setApprovalHistory(res.approvalHistories);
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
            let url =`/result/result-batch/fetch/${selectedSchool.id}/${session_id}/${term_id}/`
            sendRequest(url,"GET",null,triggeredFunc,true,false)
    }
    }, [selectedSession,selectedTerm,subjects]);
    
    useEffect(() => {
        // Whenever session or term changes, reset to dashboard view
        if (selectedSession && selectedTerm && selectedSchool) {
            let session_id = selectedSchool?.sessions?.find(s => s.name === selectedSession)?.id || 'unknown_session';
            let term_id = selectedSchool?.terms?.find(t => t.name === selectedTerm)?.id || 'unknown_term';
            setSkillBatches(generateMockSkills(classes,session_id, term_id));
            // we call api here to fetch results for the selected session and term, but for now we generate mock data
            // API CALL HERE to fetch results for selectedSession and selectedTerm
            let url =`/result/result-skill/fetch/${selectedSchool.id}/${session_id}/${term_id}/`
            sendRequest(url,"GET",null,triggeredFunc,true,false)
        }
        // fetch approval history here 
        if (!approvalHistory.length && selectedSchool){
            let url =`/result/approval-history/fetch/${selectedSchool.id}`
            sendRequest(url,"GET",null,triggeredFunc,true,false)
        }
    }, [selectedSession,selectedTerm]);

    const handleOpenFormTeacherEditor = (classRoom: ClassRoom) => {
        let  batch = skillBatches.find(b => b.classId  === classRoom.id)
        setFormTeacherClass(classRoom);
        setCurrentSkillBatch(batch)
        const classStudents = students.filter(s => s.active_class_rooms.includes(classRoom.id));
        // make sure all students are included 
        const initialScores = classStudents.map((student) => {
            const existingScore = batch?.charAndSkills.find(sb => sb.studentId === student.id);
            return existingScore ||  {
                studentId: student.id,
                punctuality : 0 ,
                honesty : 0 ,
                neatness : 0 ,
                leadership : 0 ,
                handwriting : 0 ,
                verbal_fluency : 0 ,
                creativity : 0 ,
            }
        });
        setIsSkillDirty(false);
        setEditorSkills(initialScores) ;
        setViewState('FORM_TEACHER_EDITOR');
    };
    // --- NAVIGATION HANDLERS ---
    const handleOpenEditor = (batch: ResultBatch) => {
        setCurrentBatch(batch);
        // If batch has no scores yet, generate empty scores for current class students
        if (! batch?.scores || batch?.scores?.length === 0) {
            const classStudents = students.filter(s => s.active_class_rooms.includes(batch.classId));
            const initialScores = classStudents.map(s => ({
                studentId: s.id,
                ca1: 0, ca2: 0, exam: 0, total: 0, grade: 'N/A', remark: 'No Score'
            }));

            setEditorScores(initialScores) ;

        } else {
            const classStudents = students.filter(s => s.active_class_rooms.includes(batch.classId));
            // make sure all students are included 
            const existed_scores = classStudents.map(student => {
                const existingScore = batch.scores.find(s => s.studentId === student.id);
                return existingScore || {
                    studentId: student.id,
                    ca1: 0, ca2: 0, exam: 0, total: 0, grade: 'N/A', remark: 'No Score'
                };
            });
            setEditorScores(existed_scores)  ;

        }
        setIsDirty(false);
        setViewState('EDITOR');
    };
     // --- HANDLE PIN SUCCESS ---
    const handlePinSuccess = (pins:string) => {
        setShowPinModal(false); 
        let form = serverForm
        form.pin = pins
        // Make the api call here  when pin is not needed by the user 
        if (pendingAction === 'SAVE') {
            sendRequest(`/result/result-batch/upsert/`,"POST",form,triggeredFunc,true,false)
            return ;
        }
        if (pendingAction === 'UPLOAD') {
            serverForm.append('pin', pins) ;
            let url = `/result/result-batch/upload/`
            sendRequest(url ,"POST",serverForm,triggeredFunc,true,true) // is formdata, is secure
            return ;
        }
        if (pendingAction === 'CHARUPLOAD') {
            serverForm.append('pin', pins) ;
            let url = `/result/result-skill/upload/`
            sendRequest(url ,"POST",serverForm,triggeredFunc,true,true) // is formdata, is secure
            return ;
        }
        if (pendingAction === 'REPORTGENERATION') {
            let url = `/result/result-batch/generate-report-sheets/`
            sendRequest(url ,"POST",form,triggeredFunc,true,false) //
            return ;
        }
        if (pendingAction === 'SAVECHAR') {
            let url = `/result/result-skill/save/`
            sendRequest(url ,"POST",form,triggeredFunc,true,false) // is not  formdata, is secure
            return ;
        }
        if (pendingAction === 'BATCHLOCK') {
            let url = `/result/result-editing/locking/`
            sendRequest(url ,"POST",form,triggeredFunc,true,!true)
            return ;
        }
        if (pendingAction === 'BATCHAPPROVAL') {
            let url = `/result/result-editing/approval/`
            sendRequest(url ,"POST",form,triggeredFunc,true,!true)
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
            sendRequest(`/result/result-batch/upsert/`,"POST",serverForm,triggeredFunc,true,false)
            return ;
        }
        setShowPinModal(true) 
        return ;
    };
    const handleLockEdit = (pendingAction :"RESULT" | "CHAR") => {
        const target = pendingAction
        let targetBatchId = target === 'RESULT'? currentBatch?.id : currentSkillBatch?.id 
        setServerForm({
            target,
            school : selectedSchool?.id ,
            batch : targetBatchId ,
            pin : ""
        })
        setPendingAction("BATCHLOCK")
        if (!currentUser?.user?.pin_set) {
                // process file immediately if no pin is set
                let url = `/result/result-editing/locking/`
                sendRequest(url ,"POST",serverForm,triggeredFunc,true,!true)
                return ;
            }
            setShowPinModal(true) ;
    }
    const handleScoreChange = (studentId: string, field: 'ca1' | 'ca2' | 'exam', value: string) => {
        const numVal = Math.min(Math.max(Number(value) || 0, 0), field === 'exam' ? 60 : 20); // Clamp values
        
        setEditorScores(prev => prev.map(s => {
            if (s.studentId === studentId) {
                const updated = { ...s, [field]: numVal };
                updated.total = updated.ca1 + updated.ca2 + updated.exam;
                const { grade, remark } = calculateGrade(updated.total);
                updated.grade = grade;
                updated.remark = remark;
                return updated;
            }
            return s;
        }));
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
            form.append('subject', currentBatch.subjectId);
            form.append('class_room', currentBatch.classId);
            form.append('teacher', currentBatch.teacherId) ;
            setServerForm(form) ;
            setShowUploadModal(false) ;
            if (!currentUser?.user?.pin_set) {
                // process file immediately if no pin is set
                let url = `/result/result-batch/upload/`
                sendRequest(url ,"POST",serverForm,triggeredFunc,true,true)
                return ;
            }
            setShowPinModal(true) ;
        }
    };
    const handleSkillsChange = (studentId: string, skill: string, value: number) => {
        const numVal = Math.min(Math.max(Number(value) || 0, 0), 5); // Clamp values
        setEditorSkills(prev => prev.map((rec) => {
            if (rec.studentId === studentId){
                let updated = {...rec,[skill]:numVal}
                return updated
            }
            return rec
        }));
        
        return setIsSkillDirty(true)
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
                let url = `/result/result-skill/upload/`
                sendRequest(url ,"POST",serverForm,triggeredFunc,true,true)
                return ;
            }
            setShowPinModal(true) ;
        }
    };
    const handleApproveResult = (batchIds: string[] ,target: "RESULT" | "CHAR") => {
        setServerForm({
            target,
            school : selectedSchool?.id ,
            batchIds ,
            pin : ""
        })
        setPendingAction("BATCHAPPROVAL")
        if (!currentUser?.user?.pin_set) {
                // process file immediately if no pin is set
                let url = `/result/result-editing/approval/`
                sendRequest(url ,"POST",serverForm,triggeredFunc,true,!true)
                return ;
            }
            setShowPinModal(true) ;
    };

    const generateReportSheet = (class_id:any ) => {
        setPendingAction("REPORTGENERATION")
        let sessionId = selectedSchool?.sessions.find(s => s.name === selectedSession)?.id;
        let termId = selectedSchool?.terms.find(t => t.name === selectedTerm)?.id ;
        let form = {
            class_room : class_id ,
            school : selectedSchool?.id ,
            term : termId,
            session : sessionId
        }
        setServerForm(form)
        if (!currentUser?.user?.pin_set) {
            // process file immediately if no pin is set
            let url = `/result/result-batch/generate-report-sheets/`
            sendRequest(url ,"POST",serverForm,triggeredFunc,true,false)
            return ;
        }
        setShowPinModal(true) ;
    }
    const downloadCharSheet = (class_id:any ) => {
        setPendingAction("CHAR_UPLOAD")  
        let cls = classes.find((c) => c.id === class_id)
        let sessionId = selectedSchool?.sessions.find(s => s.name === selectedSession)?.id;
        let termId = selectedSchool?.terms.find(t => t.name === selectedTerm)?.id ;
        let url = `/result/result-skill/download/${selectedSchool?.id}/${sessionId}/${termId}/${class_id}/`
        let fileName = `${cls?.name}_Psychomotor&skills`;
        sendFileRequest(url, 'GET', null, serverDownloader,fileName, true, !true);
        
        return ;
    }
    const handleSaveChar = (scores) => {
        setPendingAction("SAVECHAR")
        let sessionId = selectedSchool?.sessions.find(s => s.name === selectedSession)?.id;
        let termId = selectedSchool?.terms.find(t => t.name === selectedTerm)?.id ;
        const SaveForm : any = {
            school : selectedSchool?.id,
            class_room : formTeacherClass?.id ,
            session : sessionId ,
            term : termId,
            teacher : formTeacherClass?.form_teacher ,
            charAndSkills : scores
        }
        setServerForm(SaveForm)
        if (!currentUser?.user?.pin_set) {
            let url = `/result/result-skill/save/`
            sendRequest(url ,"POST",SaveForm,triggeredFunc,true,false) // is not  formdata, is secure
            return ;
        }
        setShowPinModal(true) ;
    }

    return (
        <>
        <PinModal isOpen={showPinModal} onClose={() => { setShowPinModal(false); setPendingAction(null); }} onSuccess={handlePinSuccess} title={'Confirm Action'} />
        <div className="animate-fadeIn h-full flex flex-col reletive ">
            
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {viewState === 'DASHBOARD' ? (
                    <ResultDashboard 
                        activeTab={activeTab}
                        searchTerm={searchTerm}
                        classes={classes}
                        teachers={teachers}
                        subjects={subjects}
                        results={filteredResults}
                        skills = {skillBatches}
                        students={students}
                        selectedSession={selectedSession}
                        approvalHistory={approvalHistory}
                        onOpenFormTeacherEditor={handleOpenFormTeacherEditor}
                        onApproveResult={handleApproveResult}
                        onTabChange={setActiveTab}
                        selectedTerm={selectedTerm}
                        onOpenEditor={handleOpenEditor}
                        onSearchChange={setSearchTerm}
                        onSessionChange={setSelectedSession}
                        onTermChange={setSelectedTerm}
                        onGenerateReportSheet ={generateReportSheet}
                    />

             ) : viewState === 'EDITOR' ? (
                currentBatch && (
                    <ResultEditor 
                        batch={currentBatch}
                        classes={classes}
                        subjects={subjects}
                        students={students}
                        editorScores={editorScores}
                        isDirty={isDirty}
                        selectedSession={selectedSession}
                        selectedTerm={selectedTerm}
                        onClose={() => setViewState('DASHBOARD')}
                        onSave={handleSaveScores}
                        onScoreChange={handleScoreChange}
                        onImportClick = { () => { 
                            setUploadTargetBatch(currentBatch); 
                            setShowUploadModal(true); 
                        }}
                        onLockEdit ={handleLockEdit}
                    />
                )
            ) : viewState === 'FORM_TEACHER_EDITOR' ? (
                formTeacherClass && (
                    <FormTeacherEditor 
                        batch={currentSkillBatch}
                        initialSkills = {editorSkills}
                        classRoom={formTeacherClass} 
                        students={students.filter(s => s.active_class_rooms.includes(formTeacherClass.id))}
                        handleSkillsChange = {handleSkillsChange}
                        onClose={() => setViewState('DASHBOARD')}
                        onHandleSave = {handleSaveChar}
                        onDownloadCharSheet ={downloadCharSheet}
                        onImportClick = { () => { 
                            setFileUploadTarget("CHAR") 
                            setShowUploadModal(true); 
                        }}
                        onLockEdit = {handleLockEdit}
                        isDirty = {isSkillDirty}
                    />
                )
            ) : null}

            {/* CSV UPLOAD MODAL */}
            <Modal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)}
             title={`Upload ${fileUploadTarget} Batch`} 
             icon="fa-solid fa-cloud-arrow-up">
                <div className="space-y-2 text-center p-2">
                    <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto text-navy-600 text-2xl mb-2">
                        <i className="fa-solid fa-file-csv"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-navy-900">Select CSV File</h4>
                        {fileUploadTarget === "RESULT" && <p className="text-sm text-gray-500">Ensure the file matches the template format (S/N,Name, AdmNo, CA1, CA2, Exam).</p>}
                        {fileUploadTarget === "CHAR" && <p className="text-sm text-gray-500">Ensure the file matches the students list with ratings (1-5) </p>}
                    </div>
                    
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-2 bg-gray-50 hover:bg-white transition-colors relative">
                        {fileUploadTarget === "RESULT" && <input type="file" accept=".xlsx,.xls,.csv" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" onChange={handleFileUpload} />}
                        {fileUploadTarget === "CHAR" && <input type="file" accept=".xlsx,.xls,.csv" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full border" onChange={handleSkillFileUpload} />}
                        
                        <div className="pointer-events-none">
                            <span className="bg-navy-900 text-white px-4 py-2 rounded text-sm font-bold shadow-md">Browse Files</span>
                            <p className="text-xs text-gray-400 mt-3">or drag and drop here</p>
                        </div>
                    </div>
                    
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
