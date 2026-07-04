import React, { useState, useEffect, useContext } from 'react';
import { ClassRoom, ResultBatch, Subject, Student } from '../../types';
import { Modal } from '../UI';
import { getCompletenessStats } from './ResultUtils';
import { uiContext } from '@/customContexts/UiContext';

interface ResultGenerationModalProps {
    classRoom: ClassRoom | null;
    onClose: () => void;
    results: ResultBatch[];
    skills: any[];
    subjects: Subject[];
    session: string;
    term: string;
    onGenerate: () => void;
}

export const ResultGenerationModal: React.FC<ResultGenerationModalProps> = ({
    classRoom,
    onClose,
    results,
    subjects,
    skills,
    session,
    term,
    onGenerate
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [generating, setGenerating] = useState(false);
    const {findTermById,findSessionById} = useContext(uiContext);
    const termId = findTermById(term)?.id
    const sessionId = findSessionById(session)?.id
    const classId = classRoom?.id || '';

    // Checks
    // const studentsInClass = students.filter(s => s.classRoomIds?.includes(classId));
    // const studentsInClass = classRoom?.studentsCount || 0;
    const expectedSubjects = classRoom?.subjectsCount || 0;
    const classBatches :any  = results.filter(r => r.classId === classId && r.session === sessionId && r.term === termId);
    const classSkills :any  = skills?.find(r => r.classId === classId && r.session === sessionId && r.term === termId);
    
    // Step 1: Uploaded subjects match expected
    const fullyUploadedBatches = classBatches.filter(r => getCompletenessStats(r).status === 'COMPLETE');
    const isStep1Passed = expectedSubjects > 0 && fullyUploadedBatches.length === expectedSubjects;

    // Step 2: Director Approval
    const isStep2Passed = classBatches.length > 0 && classBatches.every(r => r.approved === true);

    // Step 3: Character & Skills 
    const isStep3Passed = classSkills?.approved || false; 
    
    const canGenerate = isStep1Passed && isStep2Passed && isStep3Passed;

    // Auto-advance steps for UI effect
    useEffect(() => {
        if (classRoom) {
            setCurrentStep(0);
            
            const timer1 = setTimeout(() => setCurrentStep(1), 800);
            const timer2 = setTimeout(() => setCurrentStep(2), 1600);
            const timer3 = setTimeout(() => setCurrentStep(3), 2400);
            const timer4 = setTimeout(() => setCurrentStep(4), 3200);

            return () => {
                clearTimeout(timer1);
                clearTimeout(timer2);
                clearTimeout(timer3);
                clearTimeout(timer4);
            };
        }
    }, [classRoom]);

    if (!classRoom) return null;

    const handleGenerate = () => {
        setGenerating(true);
        setTimeout(() => {
            setGenerating(false);
            onGenerate();
        }, 2000);
    };

    return (
        <Modal isOpen={!!classRoom} onClose={onClose} title="Generate Term Results" size="2xl">
            <div className="px-6 py-2 max-h-[75vh] overflow-y-auto w-full  ">
                <div className="text-center mb-8 ">
                    <div className="w-16 h-16 bg-navy-50 text-navy-600 rounded-full flex items-center justify-center mx-auto text-3xl mb-4">
                        <i className="fa-solid fa-file-signature"></i>
                    </div>
                    <h2 className="text-xl font-black text-navy-900 uppercase">Pre-Generation Checks</h2>
                    <p className="text-gray-500 text-sm mt-1">Verifying data completeness for <strong>{classRoom.name}</strong> ({term} - {session})</p>
                </div>

                <div className="space-y-4 mb-8 max-w-lg mx-auto relative before:absolute before:inset-0 before:ml-[1.4rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                    
                    {/* STEP 1 */}
                    <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${currentStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ${currentStep >= 1 ? (isStep1Passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-200 text-gray-400'}`}>
                            <i className={`fa-solid ${isStep1Passed ? 'fa-check' : 'fa-xmark'}`}></i>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-navy-900 text-sm">Subject Scores Upload</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                {fullyUploadedBatches.length} of {expectedSubjects} subjects completed.
                            </p>
                        </div>
                    </div>

                    {/* STEP 2 */}
                    <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${currentStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ${currentStep >= 2 ? (isStep2Passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-200 text-gray-400'}`}>
                            <i className={`fa-solid ${isStep2Passed ? 'fa-check' : 'fa-xmark'}`}></i>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-navy-900 text-sm">Director Approval</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                All {classBatches.length} subject batches approved.
                            </p>
                        </div>
                    </div>

                    {/* STEP 3 */}
                    <div className={`relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group transition-all duration-500 ${currentStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                        <div className={`flex items-center justify-center w-12 h-12 rounded-full border-4 border-white shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors ${currentStep >= 3 ? (isStep3Passed ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-gray-200 text-gray-400'}`}>
                            <i className={`fa-solid ${isStep3Passed ? 'fa-check' : 'fa-xmark'}`}></i>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-3rem)] bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h4 className="font-bold text-navy-900 text-sm">Character & Skills</h4>
                            <p className="text-xs text-gray-500 mt-1">
                                Form teacher assessments verified.
                            </p>
                        </div>
                    </div>

                </div>

                <div className={`transition-all duration-700 ${currentStep >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                    {canGenerate ? (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                            <div className="text-green-500 text-2xl mb-2"><i className="fa-solid fa-clipboard-check"></i></div>
                            <h3 className="font-bold text-green-800 text-lg">All Checks Passed</h3>
                            <p className="text-sm text-green-700 mt-1 mb-4">You can now proceed with generating the official term results for {classRoom.studentsCount} students in {classRoom.name}.</p>
                            
                            <div className="flex gap-3 justify-center">
                                <button onClick={onClose} className="px-5 py-2.5 rounded-lg font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 transition-colors">Cancel</button>
                                <button 
                                    onClick={handleGenerate}
                                    disabled={generating}
                                    className="px-6 py-2.5 rounded-lg font-bold text-white bg-green-600 hover:bg-green-700 shadow-md shadow-green-600/20 transition-all flex items-center justify-center gap-2"
                                >
                                    {generating ? <><i className="fa-solid fa-spinner fa-spin"></i> Compiling...</> : <><i className="fa-solid fa-wand-magic-sparkles"></i> Generate Results</>}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
                            <div className="text-red-500 text-2xl mb-2"><i className="fa-solid fa-circle-exclamation"></i></div>
                            <h3 className="font-bold text-red-800 text-lg">Prerequisites Not Met</h3>
                            <p className="text-sm text-red-700 mt-1 mb-4">Please ensure all subjects are fully uploaded, graded, and approved by the Director/Examination officer before generating results.</p>
                            <button onClick={onClose} className="px-6 py-2.5 rounded-lg font-bold text-white bg-navy-900 hover:bg-navy-800 transition-colors">Close and Review</button>
                        </div>
                    )}
                </div>

            </div>
        </Modal>
    );
};
