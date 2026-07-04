
import React ,{useContext,useEffect,useState} from 'react';
import { getCompletenessStats,getCompleteSkillStats } from './ResultUtils';
import { uiContext } from '@/customContexts/UiContext';
import { ClassRoom, Subject, Teacher, ResultBatch, Student, ApprovalRecord } from '../../types';
import { ResultsViewer } from './ResultsViewer';
import { Modal } from '../UI';
import { CheckCircle2, Loader2 } from "lucide-react";

import { ResultGenerationModal } from './ResultGenerationModal';

interface ResultDashboardProps {
    activeTab: 'CLASS' | 'TEACHER' | 'SUBJECT' | 'FORM_TEACHER' | 'DIRECTOR_APPROVAL'| 'APPROVAL_HISTORY'| 'RESULTS_VIEWER';
    searchTerm: string;
    teachers: Teacher[] | any ;
    subjects: Subject[] | any ;
    results: any[] ;
    skills : any[];
    students: Student[];
    selectedSession: string;
    selectedTerm: string;
    approvalHistory?: ApprovalRecord[];
    onOpenEditor: (batch: ResultBatch) => void; 
    onOpenFormTeacherEditor?: (classRoom: ClassRoom) => void;
    onApproveResult?: (batchIds: string[] ,target: "RESULT" | "CHAR") => void;
    onTabChange: (tab: 'CLASS' | 'TEACHER' | 'SUBJECT' | 'FORM_TEACHER' | 'DIRECTOR_APPROVAL'| 'APPROVAL_HISTORY'| 'RESULTS_VIEWER') => void;
    onSearchChange: (term: string) => void;
    onSessionChange: (s: string) => void;
    onTermChange: (t: string) => void;
    onGenerateReportSheet?: (t: string) => void;
    accessData?:any ;
}

export const ResultDashboard : React.FC<ResultDashboardProps> = ({
    activeTab, searchTerm, teachers,
    subjects, results, skills,
    selectedSession, selectedTerm, approvalHistory = [],
    onOpenEditor, onTabChange, onSearchChange, 
    onSessionChange, onTermChange,onOpenFormTeacherEditor,onApproveResult,onGenerateReportSheet,
    accessData
}) => {
    const {
        selectedSchool,
        classRooms:classes,
        findSessionById,findTermById,
        reportsRecord,isLoading
    } = useContext(uiContext);
    const roleNavs =( accessData?.role === 'teacher' && accessData?.masterClassIds?.length > 0 ) ? ['CLASS','FORM_TEACHER','RESULTS_VIEWER']
     :
    (accessData?.role === 'teacher' && accessData?.masterClassIds?.length === 0 ) ? ['CLASS']
     : 
    ['CLASS','FORM_TEACHER','DIRECTOR_APPROVAL','RESULTS_VIEWER','APPROVAL_HISTORY'];

    const sessions = selectedSchool?.sessions || [];
    const terms = selectedSchool?.terms || [];
    
    const [skillDisplay,setSkillsDisplay] = useState({length:0,progress:0})
    const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

    const lockedResults = results?.filter(r => r?.on_submit  && !r.approved) ;
    const lockedSkills = skills?.filter(s => s?.on_submit  && !s.approved);

    const totalApprovals = lockedResults?.length + lockedSkills?.length ;
    const [generatingClass, setGeneratingClass] = useState<any>(null);


    const handleSelectBatch = (id: string) => {
        setSelectedBatches(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    };
    const handleSelectSkill = (id: string) => {
        setSelectedSkills(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
    };

    const handleSelectAll = (type:"RESULT"|"CHAR") => {
        if (type === "RESULT"){
            if (selectedBatches.length === lockedResults.length) {
                setSelectedBatches([]);
            } else {
                setSelectedBatches(lockedResults.map(r => r.id));
            }
            return ;
        }
        if (type === "CHAR"){
            if (selectedSkills.length === lockedSkills.length) {
                setSelectedSkills([]);
            } else {
                setSelectedSkills(lockedSkills.map(r => r?.id));
            }
            return ;
        }
    };
    const renderStatusBadge = (status: 'DRAFT' | 'LOCKED' | 'APPROVED'|'SUBMITTED' | any ) => {
        if (status === 'APPROVED') {
            return (
                <div className="absolute top-1/4 right-2 bg-gradient-to-r from-gold-400 to-gold-600 text-white mt-2 text-xs font-bol px-2 py-0.1 rounded-full shadow-md flex items-center gap-1 z-10 border-2 border-white opacity-90">
                    <i className="fa-solid fa-certificate"></i> Approved 
                </div>
            );
        }
        if (status === 'SUBMITTED') {
            return (
                <div className="absolute top-1/4 right-2 bg-gradient-to-r from-green-400 to-green-600 text-white mt-2 text-xs font-bol px-2 py-0.1 rounded-full shadow-md flex items-center gap-1 z-10 border-2 border-white opacity-90">
                    <i className="fa-solid fa-certificate"></i> submitted 
                </div>
            );
        }
        if (status === 'LOCKED') {
            return (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-navy-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 z-10 border-2 border-white opacity-100">
                    <i className="fa-solid fa-lock"></i> LOCKED
                </div>
            );
        }
        return null;
    };
    const renderProgressBar = (stats: { scored: number, total: number, percentage: number, status: string }) => {
        let color = 'bg-gray-200';
        if (stats.status === 'COMPLETE') color = 'bg-green-500';
        else if (stats.status === 'PARTIAL') color = 'bg-orange-400';

        return (
            <div className="w-full mt-2">
                <div className="flex justify-between text-[10px] uppercase font-bold text-gray-500 mb-1">
                    <span>{stats.status}</span>
                    <span>{stats.scored}/{stats.total} Recorded </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${stats.percentage}%` }}></div>
                </div>
            </div>
        );
    };
    useEffect(() => {
        if (activeTab === "FORM_TEACHER" && skills.length > 0 ){
            const fullyUploadedSkillBatches = skills.filter(r => r.status === 'COMPLETE').length || 0;
            const overallSkillProgress = skills?.length > 0 ? (fullyUploadedSkillBatches / skills?.length) * 100 : 0;
            setSkillsDisplay(
                {length : fullyUploadedSkillBatches , progress:overallSkillProgress}
            )
        }
        
    },[activeTab,skills])
    let sessionId = findSessionById(selectedSession)?.id
    let termId = findTermById(selectedTerm)?.id ;

    return (
        <div className="space-y-6 relative  ">
            {/* Header Controls: Filters & Search */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-md flex flex-col gap-4 sticky -top-8 z-[999]">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    {/* View Switcher */}
                    <div className="flex gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
                        {roleNavs.map(t => (
                            
                            <button
                                key={t}
                                onClick={() => onTabChange(t)}
                                className={`px-4 py-2 text-sm font-bold rounded-md transition-all whitespace-nowrap ${activeTab === t ? 'bg-navy-900 text-white shadow' : 'text-gray-500 hover:text-navy-900'}`}
                            >
                                {t==="APPROVAL_HISTORY"? "History":t === 'RESULTS_VIEWER' ? 'Student Results':t === 'FORM_TEACHER' ? 'Char&Atti' : t === 'DIRECTOR_APPROVAL' ? `Approvals ⟪ ${totalApprovals} ⟫` : `Classes`}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-64">
                        <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input  
                            type="text" 
                            placeholder="Search...." 
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:border-navy-900 focus:ring-0"
                        />
                    </div>
                </div>

                {/* Session & Term Selectors (Context Bar) */}
                {(activeTab !== 'APPROVAL_HISTORY') && <div className="flex flex-col sm:flex-row items-center justify-between bg-navy-50 p-3 rounded-lg border border-navy-100 gap-3">
                    <div className="flex items-center gap-2 text-navy-900 font-medium text-sm">
                        <i className="fa-solid fa-filter text-gold-500"></i>
                        <span>Filter For:</span>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                        <select 
                            value={selectedSession || ''} 
                            onChange={(e) => {
                                if (accessData.role === 'teacher') return null ;
                                onSessionChange(e.target.value)

                            }}
                            className="flex-1 sm:w-40 p-2 text-sm border border-gray-300 rounded-md focus:border-navy-900 focus:ring-1 focus:ring-navy-900 bg-white font-bold text-navy-800"
                        >
                            {/* map sessions to options here */}
                            {sessions.map((s)  => (
                                <option key={s.id} value={s.name}>{s.name}</option>
                            ))}

                        </select>
                        <select 
                            value={selectedTerm || ""} 
                            onChange={(e) => {
                                if (accessData.role === 'teacher') return null ;
                                onTermChange(e.target.value)

                            }}
                            className="flex-1 sm:w-40 p-2 text-sm border border-gray-300 rounded-md focus:border-navy-900 focus:ring-1 focus:ring-navy-900 bg-white font-bold text-navy-800"
                        >
                            {/* map terms to options here */}
                            {terms.map(t => (
                                <option key={t.id} value={t.name}>{t.name}</option>
                            ))}
                        </select>
                    </div>
                </div>}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 gap-4 mb-4">

                {/* BY CLASS VIEW */}
            { activeTab === 'CLASS' && classes.filter(c => c.name.toLowerCase().includes(
                    searchTerm.toLowerCase()
                )).map(cls => {
                    // Filter results specifically for this class from the already filtered `results` prop
                    const classResults = results.filter(r => (
                        r.classId === cls.id && r.session === sessionId && r.term === termId
                    ));
                    let reportFound = reportsRecord.find(r => 
                        r.class_room === cls.id && r.session === sessionId && r.term === termId
                    )

                    // We must determine how many subjects SHOULD exist for this class to calculate true progress
                    // This is Subjects that contain this class ID
                    const expectedSubjects = subjects.filter(s => s?.class_rooms?.includes(cls.id));
                    const totalBatches     = expectedSubjects.length;
                    
                    // Count how many have 'COMPLETE' status
                    const fullyUploadedBatches = classResults.filter(r => getCompletenessStats(r).status === 'COMPLETE').length;

                    return (
                        <div key={cls.id} className="bg-white mb-2  border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="bg-navy-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="font-bold text-navy-900 flex items-center gap-2">
                                    <i className="fa-solid fa-chalkboard text-navy-500"></i> {cls.name}
                                </h3>
                               

                                {reportFound?.status === "FAILED" && (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 tracking-wide">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Report Failed!
                                </span>
                                )}
                                {reportFound?.status === "GENERATED" && (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 tracking-wide">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Report Generated
                                </span>
                                )}

                                {reportFound?.status === "GENERATING" && (
                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-yellow-600 tracking-wide">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Report Generating...
                                </span>
                                )}
                                <div className="flex items-center gap-4">
                                    <div className="text-xs font-bold text-gray-500">{fullyUploadedBatches}/{totalBatches} Subjects Complete</div>
                                    {accessData?.canGenerateReports && (
                                        <button 
                                            onClick={() => setGeneratingClass(cls)}
                                            className="px-3 py-1.5 bg-navy-900 text-white rounded-md text-xs font-bold hover:bg-navy-800 transition-colors shadow-sm flex items-center gap-1"
                                        >
                                            <i className="fa-solid fa-wand-magic-sparkles"></i> Generate
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                    {expectedSubjects.map(sub => {
                                        // Find the result batch for this subject if it exists in our filtered list
                                        const res :any  = classResults.find(r => r.subjectId === sub.id) ;
                                        let approved = res?.approved ? "APPROVED" : "DRAFT"
                                        let submitted = res?.on_submit ? "SUBMITTED" : "DRAFT"
                                        let locked = res?.isLocked ? "LOCKED" : "DRAFT"
                                        const teacherId = sub?.teachers?.find(d => d.classroom === cls.id)?.teacher;
                                        const teacher :any = teachers.find(t => t.id === teacherId);
                                        
                                        // If no result exists yet (e.g. mock data gap), show empty state logic
                                        const stats = getCompletenessStats(res);

                                        return (
                                            <div key={sub.id} className={`p-3 relative border rounded group transition-all cursor-pointer hover:shadow-sm bg-white border-gray-100 hover:border-navy-200 `}>
                                                {res && renderStatusBadge(approved )}
                                                {res && renderStatusBadge(locked )}
                                                {res && renderStatusBadge(submitted )}
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="text-sm font-bold text-navy-800">{sub.name}</p>
                                                        <p className="text-xs text-gray-500">{teacher ? `${teacher.title} ${teacher.first_name} ${teacher.last_name} ${teacher.middle_name}` : 'Unassigned'}</p>
                                                    </div>
                                                    {(
                                                        <div 
                                                        onClick={() => onOpenEditor(res)}
                                                        className="text-xs font-bold bg-gray-50 text-navy-600 px-2 py-1 rounded group-hover:bg-navy-900 group-hover:text-white transition-colors cursor-pointer">
                                                            Edit
                                                        </div>
                                                    )}
                                                </div>
                                                {renderProgressBar(stats)}
                                            </div>
                                        );
                                    })}
                                    {expectedSubjects.length === 0 && <p className="text-sm text-gray-400 italic col-span-3">No subjects assigned to this class.</p>}
                                </div>
                            </div>
                        </div>
                    );
                })}

                 {/* FORM TEACHER VIEW */}
                {(activeTab === 'FORM_TEACHER' && accessData.masterClassIds.length > 0) && (
                    <div className="relative">
                        <div className="flex justify-end my-1">
                            {/* <div className="text-md font-bold text-white bg-green-600 rounded-md p-1">{skillDisplay?.length}/{skills?.length} Skills & Character Completed</div> */}
                        </div>

                        <div className="grid grid-cols-2 mb-5 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {classes.filter(c => (
                                accessData.masterClassIds?.includes(c.id) &&
                                c.name.toLowerCase().includes(searchTerm.toLowerCase() && c.term === termId && c.session === sessionId )
                            )).map(cls => {
                                const formTeacher = cls?.form_teacher;
                                const skillBatch = skills?.find((skill) => skill.classId === cls.id );
                                let approved = skillBatch?.approved ? "APPROVED" : "DRAFT"
                                let submitted = skillBatch?.on_submit ? "SUBMITTED" : "DRAFT"
                                let locked = skillBatch?.isLocked ? "LOCKED" : "DRAFT"
                                const stats = getCompletenessStats(skillBatch);
                                return (
                                    <div key={cls.id} className="relative  bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                                        
                                            {skillBatch && renderStatusBadge(approved)}
                                            {skillBatch && renderStatusBadge(locked)}
                                            {skillBatch && renderStatusBadge(submitted)}
                                        <div className ='relative'>
                                            <div className="flex justify-between items-start mb-3">
                                                <h3 className="font-bold text-navy-900 text-lg flex items-center gap-2">
                                                    <i className="fa-solid fa-users-rectangle text-navy-500"></i> {cls.name}
                                                </h3>
                                                <span className="bg-navy-50 text-navy-600 text-xs font-bold px-2 py-1 rounded">
                                                    {cls.studentsCount || 0} Students
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mb-4">
                                                <i className="fa-solid fa-user-tie mr-2"></i>
                                                Form Teacher: <span className="font-medium text-navy-800">{formTeacher ? `${formTeacher.title} ${formTeacher.first_name} ${formTeacher.last_name} ${formTeacher.middle_name}` : 'Unassigned'}</span>
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => onOpenFormTeacherEditor && onOpenFormTeacherEditor(cls)}
                                            className="w-full py-2 bg-navy-50 text-navy-700 hover:bg-navy-900 hover:text-white rounded-lg font-bold text-sm transition-colors border border-navy-100 hover:border-navy-900"
                                        >
                                            Edit Psychomotor & Other Skills
                                        </button> 
                                        {renderProgressBar(stats)}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                 {/* DIRECTOR APPROVAL VIEW */}
                { (activeTab === 'DIRECTOR_APPROVAL' && accessData.canApprove) && (
                    <div className="space-y-8">
                        {/* Pending Approvals Section */}
                        <div className="space-y-4">
                            {/* results top  */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 border border-blue-100 p-2 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-circle-info text-blue-600 mt-1"></i>
                                    <div>
                                        <h4 className="font-bold text-blue-900 text-sm">Results Approval Queue</h4>
                                        <p className="text-xs text-blue-700">These results have been under approval. Once approved, they become official.</p>
                                    </div>
                                </div>
                                {lockedResults?.length > 0 && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-blue-900">
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-navy-900 focus:ring-navy-900 w-4 h-4"
                                                checked={selectedBatches.length === lockedResults.length && lockedResults.length > 0}
                                                onChange={() => handleSelectAll("RESULT")}
                                            />
                                            Select All
                                        </label>
                                        <button 
                                            onClick={() => onApproveResult(selectedBatches,"RESULT")}
                                            disabled={selectedBatches.length === 0}
                                            className={`py-2 px-4 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${selectedBatches.length > 0 ? 'bg-navy-900 text-white hover:bg-navy-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            <i className="fa-solid fa-check-double"></i> 
                                            Approve Selected ({selectedBatches.length})
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {lockedResults?.map(res => {
                                    const sub = subjects.find(s => s.id === res.subjectId);
                                    const cls = classes.find(c => c.id === res.classId);
                                    const teacher = teachers.find(t => t.id === res.teacherId);
                                    // const stats = getCompletenessStats(res, students);
                                    const isSelected = selectedBatches.includes(res.id);

                                    return (
                                        <div key={res.id} onClick={() => handleSelectBatch(res.id)} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer ${isSelected ? 'border-navy-500 ring-1 ring-navy-500' : 'border-gray-200'}`}>
                                            {/* {renderProgressBar(stats)} */}
                                            <div className={`absolute top-0 left-0 w-1 h-full ${isSelected ? 'bg-navy-500' : 'bg-navy-900'}`}></div>
                                            
                                            <div className="absolute top-4 right-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded text-navy-900 focus:ring-navy-900 w-5 h-5 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectBatch(res.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>

                                            <div className="flex justify-between items-start mb-4 pl-2 pr-6">
                                                <div>
                                                    <h3 className="font-bold text-navy-900 text-lg">{sub?.name}</h3>
                                                    <p className="text-sm text-gray-500 font-medium">{cls?.name}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mb-4 pl-2">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {teacher?.first_name[0]}{teacher?.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-700">{teacher?.title} {teacher?.first_name} {teacher?.last_name}</p>
                                                    <p className="text-[10px] text-gray-400">Submitted {res?.lastUpdated ? new Date(res.lastUpdated).toLocaleDateString() : 'Recently'}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pl-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onOpenEditor(res); }}
                                                    className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                                                >
                                                    Review
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onApproveResult([res.id],"RESULT"); }}
                                                    className="flex-1 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold hover:bg-navy-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    <i className="fa-solid fa-check"></i> Approve
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {lockedResults.length === 0 && (
                                    <div className="col-span-3 text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <i className="fa-solid fa-check-circle text-4xl mb-3 text-gray-300"></i>
                                        <p>All clear! No results pending approval.</p>
                                    </div>
                                )}
                            </div>

                            {/* Locked skills  */}
                             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-blue-50 border border-blue-100 p-2 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <i className="fa-solid fa-circle-info text-blue-600 mt-1"></i>
                                    <div>
                                        <h4 className="font-bold text-blue-900 text-sm">Character&Skills Approval Queue</h4>
                                        <p className="text-xs text-blue-700">These results have been under approval. Once approved, they become official.</p>
                                    </div>
                                </div>
                                {lockedSkills?.length > 0 && (
                                    <div className="flex items-center gap-2 shrink-0">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-blue-900">
                                            <input 
                                                type="checkbox" 
                                                className="rounded text-navy-900 focus:ring-navy-900 w-4 h-4"
                                                checked={selectedSkills.length === lockedSkills.length && lockedSkills.length > 0}
                                                onChange={() => handleSelectAll("CHAR")}
                                            />
                                            Select All
                                        </label>
                                        <button 
                                            onClick={() => onApproveResult(selectedSkills,"CHAR")}
                                            disabled={selectedSkills.length === 0}
                                            className={`py-2 px-4 rounded-lg text-sm font-bold transition-all shadow-sm flex items-center gap-2 ${selectedSkills.length > 0 ? 'bg-navy-900 text-white hover:bg-navy-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                        >
                                            <i className="fa-solid fa-check-double"></i> 
                                            Approve Selected ({selectedSkills.length})
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                {lockedSkills?.map(res => {
                                    const cls = classes.find(c => c.id === res.classId);
                                    const teacher = cls.form_teacher ;
                                    const isSelected = selectedSkills.includes(res.id);

                                    return (
                                        <div key={res.id} onClick={() => handleSelectSkill(res.id)} className={`bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden cursor-pointer ${isSelected ? 'border-navy-500 ring-1 ring-navy-500' : 'border-gray-200'}`}>
                                            <div className={`absolute top-0 left-0 w-1 h-full ${isSelected ? 'bg-navy-500' : 'bg-navy-900'}`}></div>
                                            {/* {renderProgressBar(stats)} */}
                                            
                                            <div className="absolute top-4 right-4">
                                                <input 
                                                    type="checkbox" 
                                                    className="rounded text-navy-900 focus:ring-navy-900 w-5 h-5 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectSkill(res.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                            </div>
                                            <div className="flex justify-between items-start mb-4 pl-2 pr-6">
                                                <div>
                                                    <p className="text-lg text-navy-800 font-medium font-bold">{cls?.name}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-3 mb-4 pl-2">
                                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                                                    {teacher?.first_name[0]}{teacher?.last_name[0]}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-700">{teacher?.title} {teacher?.first_name} {teacher?.last_name}</p>
                                                    <p className="text-[10px] text-gray-400">Submitted {res?.lastUpdated ? new Date(res.lastUpdated).toLocaleDateString() : 'Recently'}</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 pl-2">
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onOpenFormTeacherEditor(cls); }}
                                                    className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors"
                                                >
                                                    Review
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); onApproveResult([res.id],"CHAR"); }}
                                                    className="flex-1 py-2 bg-navy-900 text-white rounded-lg text-xs font-bold hover:bg-navy-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    <i className="fa-solid fa-check"></i> Approve
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {lockedSkills.length === 0 && (
                                    <div className="col-span-3 text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                        <i className="fa-solid fa-check-circle text-4xl mb-3 text-gray-300"></i>
                                        <p>All clear! No Skills pending approval.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                 {/* APPROVAL HISTORY  VIEW */}
                { (activeTab === 'APPROVAL_HISTORY' && accessData.canApprove) && (
                    <div className="relative">
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm mt-4">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex items-center gap-3">
                                <i className="fa-solid fa-clock-rotate-left text-gray-500"></i>
                                <h3 className="font-bold text-navy-900">Approval History</h3>
                            </div>
                            {approvalHistory.length > 0 ? (
                                <div className="divide-y divide-gray-100">
                                    {approvalHistory.map(record => (
                                        <div key={record.id} className="p-4  hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 mt-1">
                                                    <i className="fa-solid fa-check-double"></i>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-navy-900 mb-1">{record.description}</p>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                                        <span className="flex items-center gap-1"><i className="fa-regular fa-user"></i> {record.directorName}</span>
                                                        <span className="flex items-center gap-1"><i className="fa-regular fa-calendar"></i> {new Date(record.timestamp).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><i className="fa-regular fa-clock"></i> {new Date(record.timestamp).toLocaleTimeString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-bold text-gray-600 shrink-0">
                                                {record.batchCount} Batch{record.batchCount > 1 ? 'es' : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <i className="fa-solid fa-inbox text-3xl mb-3 text-gray-300"></i>
                                    <p className="text-sm">No approval history found for this term.</p>
                                </div>
                            )}
                        </div>
                        
                    </div>
                )}
                
                {/* RESULTS VIEWER VIEW */}
                {(activeTab === 'RESULTS_VIEWER' && accessData.masterClassIds.length > 0) && (
                    <ResultsViewer
                        selectedSession={selectedSession} 
                        selectedTerm={selectedTerm} 
                        searchTerm={searchTerm}
                        classes={classes.filter(c => accessData.masterClassIds?.includes(c.id))}
                        accessData={accessData}

                    />
                )}

                <ResultGenerationModal 
                    classRoom={generatingClass}
                    onClose={() => setGeneratingClass(null)}
                    results={results}
                    skills={skills}
                    subjects={subjects}
                    session={selectedSession}
                    term={selectedTerm}

                    onGenerate={() => {
                        setGeneratingClass(null);
                        onGenerateReportSheet(generatingClass?.id)
                    }}
                />

            </div>
        </div>
    );
};
