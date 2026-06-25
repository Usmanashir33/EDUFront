import React, { useState, useMemo, useContext, useEffect } from 'react';
import { ClassRoom, Subject, Student, ResultBatch } from '../../types';
import { Modal } from '../UI';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import StudentReport from '../students/StudentReport';
import { generateStudentReportData } from '@/utils';
import { createPortal } from 'react-dom';

interface ResultsViewerProps {
    // results: ResultBatch[];
    selectedSession: string;
    selectedTerm: string;
    searchTerm: string;
}

export const ResultsViewer: React.FC<ResultsViewerProps> = ({
    selectedSession,
    selectedTerm,
    searchTerm
}) => {
    const {classRooms:classes,selectedSchool,templates,findSessionById,findTermById} = useContext(uiContext);
    const [selectedResult, setSelectedResult] = useState<any | null >(null);
    const [studentResults,setStudentResults] = useState([]);
    const [showResult,setShowResult] = useState<boolean>(false);
    const [selectedClassId, setSelectedClassId] = useState<string|null>(classes[0]?.id || null );
    const {sendRequest} = useRequest() ;
    let sessionId = findSessionById(selectedSession)?.id
    let termId = findTermById(selectedTerm)?.id ;

    const TriggeredFunc = (resp) => {
        console.log('resp: ', resp);
        if (resp?.reportSheets){
            setStudentResults(resp?.reportSheets);
        }else if (resp?.reportSheet){
            setSelectedResult(resp.reportSheet);
        }
    }

    useEffect(() => {
        // fetch the remaining class students pls // this actually find it by id or name
        if (selectedClassId && sessionId && termId){
            let url = `/result/fetchreportsheets/${selectedSchool?.id}/${sessionId}/${termId}/${selectedClassId}/`
            sendRequest(url,"GET",null as any ,TriggeredFunc,true,false)
        }
    
    },[selectedSession,selectedClassId, selectedTerm]);

    useEffect(() => {
        if (!showResult) return ;
        if (selectedResult){
            let studentId = selectedResult.student.id
            let url = `/result/fetchreportsheet/${selectedSchool?.id}/${sessionId}/${termId}/${selectedClassId}/${studentId}/`
            sendRequest(url,"GET",null as any ,TriggeredFunc,true,false)
        }
    },[showResult]);

    const genReportData = useMemo(()=> {
        if (!selectedResult) return null ;
        let data = generateStudentReportData(selectedResult);
        let school = selectedResult?.school || selectedSchool ;
        let template = selectedResult?.template || templates?.find( t => t.type === "Report" && t.isActive)
        return {data,school,template}
    },[selectedResult])

    const classRoomName = useMemo(() => {
        return classes.find(c => c.id === selectedClassId)?.name || 'unknown'
    },[selectedClassId])

    const filteredResults = useMemo(() => {
        let filtered :any  = studentResults;
        let sessionId = findSessionById(selectedSession)?.id
        let termId = findTermById(selectedTerm)?.id ;
        if (selectedClassId !== 'ALL') {
            filtered = filtered.filter(r => {
                let classMatch = r?.class_room === selectedClassId
                let sMatch = r?.session === sessionId
                let tMatch = r?.term === termId
                return classMatch && sMatch && tMatch
            });
        }
        if (searchTerm) {
            const lowerSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(s => 
                s.student.first_name.toLowerCase().includes(lowerSearch) || 
                s.student.last_name.toLowerCase().includes(lowerSearch) || 
                s.student.admission_number.toLowerCase().includes(lowerSearch)
            );
        }
        return filtered;
    }, [selectedClassId, searchTerm,studentResults,selectedSession, selectedTerm]);
    
    const resultShow = () => {
        let doc = (
            <div className="fixed inset-0 z-[100] bg-gray-900 bg-opacity-80 flex flex-col px-5 w-screen h-screen overflow-hidden ">
                <StudentReport 
                    reportData={genReportData?.data}
                    selectedSchool={genReportData?.school}
                    activeTemplate={genReportData?.template}
                    onCancel={setShowResult} />
            </div>
        )
        return createPortal(doc, document.body);
    }

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between  sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-navy-900">Student Results Viewer</h3>
                        <p className="text-sm text-gray-500">View and print generated student report cards.</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <select 
                            value={selectedClassId || ''}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            className="p-2 border border-gray-300 rounded-md focus:border-navy-900 focus:ring-1 focus:ring-navy-900 text-sm font-bold text-navy-800"
                        >
                            {/* <option value="ALL">All Classes</option> */}
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-navy-50 text-navy-900 text-xs uppercase font-bold border-y border-gray-200">
                            <tr>
                                <th className="p-4">Student</th>
                                <th className="p-4">Adm No</th>
                                <th className="p-4">Position</th>
                                <th className="p-4">Total</th>
                                <th className="p-4 text-center">Average</th>
                                <th className="p-4 text-center">Grade</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredResults.length > 0 ? filteredResults?.map(r => {
                                const student = r.student
                                // const { studentSubjects, percentage } = getStudentResultDetails(student.id);
                                // const cls = classes.find(c => c.id === r?.class_room);

                                return (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-navy-100 text-navy-600 flex items-center justify-center font-bold text-xs uppercase">
                                                    {student.first_name[0]}{student.last_name[0]}
                                                </div>
                                                <span className="font-bold text-navy-900 text-sm">{student.first_name} {student.last_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{student.admission_number}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <b>{r?.position}</b>{`${r?.position === 1 ? 'st' : r?.position === 2 ? "nd" :r?.position === 3 ? "rd" : 'th'}`}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-block px-2 py-1 bg-green-50 text-green-700 font-bold text-xs rounded">
                                                {r?.total_marks}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-sm font-bold text-navy-900">
                                            {Number(r?.average_marks || 0)}%
                                        </td>
                                        <td className="p-4 text-center text-sm font-bold text-navy-900">
                                            {r?.overall_grade}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button 
                                                onClick={() => {setSelectedResult(r),setShowResult(true)}}
                                                className="text-navy-600 hover:text-gold-600 font-bold text-xs underline px-3 py-1 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                                            >
                                                View Report Card
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No report Sheet found matching <b className='text-navy-400'>{selectedSession} • {selectedTerm} »» {classRoomName}</b>.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
            
            {/* View Student Report Card Modal */}
           {(showResult && selectedResult && genReportData) && <div>
            {resultShow()}
           </div>
            }
        </div>
    );
};
