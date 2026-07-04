import React, { useState, useEffect, useMemo, useContext } from 'react';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import { createPortal } from 'react-dom';
import StudentReport from '@/components/students/StudentReport';
import { generateStudentReportData } from '@/utils';


interface ResultVerificationProps {
    onNavigate: (view: string) => void;
}

export const ResultVerification: React.FC<ResultVerificationProps> = ({ onNavigate }) => {
    const [studentResult, setStudentResult] = useState<any | null>(null);
    const [studentDetails, setStudentDetails] = useState<any | null>(null);
    const [error, setError] = useState('');
    const {isLoading,setIsLoading} = useContext(uiContext);
    const {sendAuthRequest} = useRequest();    
    const [admissionInput, setAdmissionInput] = useState('');
    const [isVerified, setIsVerified] = useState(true);
    const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
    // Simulate DB search based on URL params
        const urlParams = new URLSearchParams(window.location.search);
        let params = urlParams.getAll('c') || []
        let c1 = params[0]
        let c2 = params[1]
        let c3 = params[2]
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    const serverResp = (r) => {
        if (r?.wrongeAdm){
            showToast('Invalid Admission Number!','error');
            return ;
        }else if (r.notVerified){
            setIsVerified(false);
        }else if(r.verificationRequired){
            setIsVerified(true);
            setStudentDetails(r?.reportInfo)
        }else if (r?.reportSheet){
            setIsVerified(true);
            setStudentResult(r?.reportSheet);
        }
    }

    useEffect(() => {
        let url = `/result/verification/${c1}/${c2}/${c3}/0/' '/`;
        sendAuthRequest(url,"GET",null as any,serverResp,true,false);
    }, []);

    const handleVerify = () => {
        if (!admissionInput.trim()) {
            showToast('Please enter the admission number', 'error');
            return;
        }
        let url = `/result/verification/${c1}/${c2}/${c3}/1/${admissionInput}/`;
        sendAuthRequest(url,"GET",null as any,serverResp,true,false);
    };

    const handleCancel = () => {
        // Just reload to clear the state
        window.location.reload();
    };
    const genReportData = useMemo(()=> {
            if (!studentResult) return null ;
            let data = generateStudentReportData(studentResult);
            let school = studentResult?.school || {} ;
            let template = studentResult?.template || {};
            return {data,school,template}
        },[studentResult])

    const resultShow = () => {
        let doc = (
            <div className="fixed inset-0 z-[100] bg-gray-900 bg-opacity-80 flex flex-col px-5 w-screen h-screen overflow-hidden ">
                <StudentReport 
                    reportData={genReportData?.data}
                    selectedSchool={genReportData?.school}
                    activeTemplate={genReportData?.template} 
                    onCancel={setStudentResult}
                 />
            </div>
        )
        return createPortal(doc, document.body);
    }


    if (isLoading) {
        return (
            <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full">
                    <div className="w-16 h-16 border-4 border-navy-200 border-t-gold-500 rounded-full animate-spin mb-4"></div>
                    <h2 className="text-xl font-bold text-navy-900">Searching Records</h2>
                    <p className="text-sm text-gray-500 mt-2 text-center">Please wait while we locate the student's result...</p>
                </div>
            </div>
        );
    }

    if (!isVerified) {
        return (
            <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 flex flex-col items-center max-w-sm w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center text-3xl mb-4">
                        <i className="fa-solid fa-triangle-exclamation"></i>
                    </div>
                    <h2 className="text-xl font-bold text-navy-900">Record Not Found!</h2>
                    <p className="text-sm text-gray-500 mt-2">{error}</p>
                    {/* () => onNavigate(ViewState.LOGIN) */}
                    {/* <button  className="mt-6 px-6 py-2 bg-navy-900 text-white rounded-lg font-bold hover:bg-navy-800 transition-colors"> */}
                    <button onClick={handleCancel} className="mt-6 px-6 py-2 bg-navy-900 text-white rounded-lg font-bold hover:bg-navy-800 transition-colors">
                        Refresh the page 
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy-50 p-4 md:p-8 font-sans">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-6 py-4 rounded-lg shadow-2xl animate-fadeIn ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    <i className={`fa-solid ${toast.type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'} text-xl`}></i>
                    <span className="font-bold">{toast.message}</span>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                {/* Header section */}
                <div className="text-center mb-8">
                    <div className="h-16 w-16 bg-navy-900 rounded-lg flex items-center justify-center text-gold-500 text-3xl mx-auto mb-4 shadow-lg">
                        <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <h1 className="text-3xl font-black text-navy-900 uppercase tracking-tight">Result Verification Portal</h1>
                    <p className="text-gray-600 mt-2">Secure access to student academic records</p>
                </div>

                {(isVerified && studentDetails && !studentResult) && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 max-w-lg mx-auto">
                        <div className="h-2 bg-gradient-to-r from-navy-900 via-navy-700 to-gold-500"></div>
                        <div className="p-8">
                            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                                <div className="w-16 h-16 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center font-bold text-2xl uppercase">
                                    {studentDetails?.first_name[0]}{studentDetails?.last_name[0]}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-navy-900">{studentDetails?.first_name} {studentDetails?.last_name}</h2>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                        <span className="flex items-center gap-1"><i className="fa-solid fa-mars-and-venus"></i> {studentDetails?.gender}</span>
                                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                        <span className="flex items-center gap-1"><i className="fa-solid fa-chalkboard-user"></i> {studentDetails?.cls || 'Unassigned'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                                <div className="flex gap-3">
                                    <i className="fa-solid fa-circle-info text-blue-500 mt-0.5"></i>
                                    <div>
                                        <h4 className="font-bold text-blue-900 text-sm">Authentication Required</h4>
                                        <p className="text-xs text-blue-700 mt-1">To view this result, please provide the student's admission number to verify your authorization.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-navy-900 mb-1">Admission Number</label>
                                    <div className="relative">
                                        <i className="fa-solid fa-id-card absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. ADM-001"
                                            value={admissionInput}
                                            onChange={e => setAdmissionInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleVerify()}
                                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-900 focus:border-navy-900 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={handleCancel}
                                        className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={handleVerify}
                                        disabled={isLoading}
                                        className="flex-1 py-3 px-4 bg-navy-900 text-white rounded-lg font-bold hover:bg-navy-800 transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-md shadow-navy-900/20"
                                    >
                                        {isLoading ? (
                                            <><i className="fa-solid fa-spinner fa-spin"></i> Verifying...</>
                                        ) : (
                                            <>Proceed <i className="fa-solid fa-arrow-right"></i></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) }
                {(isVerified && studentResult && genReportData) && (resultShow())}
            </div>
        </div>
    );
};

