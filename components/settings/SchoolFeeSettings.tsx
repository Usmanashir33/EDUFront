
import React, { useState,useEffect, useContext, useMemo } from 'react';
import { Toggle, Button, Input ,Modal} from '../UI';

import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';

interface AcademicSettingsProps {
    data: any;
    setData: (d: any) => void;
    saveData: (operation : "SETFEE"| any  ,fdata?: any) => void;
    originalData: any;
    feeSignal :any ,
    setFeeSignal : any 
}
 
export const SchoolFeeSettings : React.FC<AcademicSettingsProps> = ({
    data, setData, saveData, originalData , feeSignal,setFeeSignal
}) => {
    // Local state for management UI
    const {selectedSchool,findSessionById,findTermById,} = useContext(uiContext);
    const [showModal,setShowModal] = useState(false)
    const [currentTermFees,setCurrentTermFees] = useState([])
    const {setToast,classRooms,schoolFees,students,isLoading,promotionLogs} = useContext(uiContext);
    const {sendRequest} = useRequest() ;

     // Manual Promotion State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    
    // Initialize lists if they don't exist in data
    const sessions = data.availableSessions || ['2000/2001'];
    const terms = data.availableTerms || ['null'];

    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  // Fee Configuration Logic
    const currentSession = data.session ;
    const currentTerm = data.term ;

    // const getSession = useMemo(() => {
    //     let s = selectedSchool?.sessions.find((t) => t.name === currentSession);
    //     return s 
    // },[data.session])

    // const getTerm = useMemo(() => {
    //     let t = selectedSchool?.terms.find((t) => t.name === currentTerm);
    //     return t 
    // },[data.term])

    const TriggeredFunc = ( resp : any ) => {
        // console.log('resp: ', resp);
        setSelectedClassIds([])

        if (resp?.configured_classes){ // set configure classes
            setCurrentTermFees(resp?.configured_classes);
            setSelectedClassIds([])
            return 
        }
    }

    const toggleClassSelection = (id: string) => {
        setSelectedClassIds(prev => 
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    const handleSelectAllUnassigned = () => {
        const unassigned = classRooms.filter(c => !currentTermFees.some((f: any) => f.classId === c.id)).map(c => c.id);
        setSelectedClassIds(Array.from(new Set([...selectedClassIds, ...unassigned])));
    };

    const handleAssignFee = () => {
        let termId = selectedSchool?.terms.find((t) => t.name === currentTerm)?.id;
        let sessionId = selectedSchool?.sessions.find((t) => t.name === currentSession)?.id;
        let feeForm = {
            school : selectedSchool.id ,
            term :termId ,
            session: sessionId ,
            classIds : selectedClassIds,
        }
        saveData("SETFEE",feeForm)
        return 
    };
   
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };

    const isChanged = (field: string) => data[field] !== originalData[field];

    useEffect(() => {
        if (feeSignal)setShowModal(false);
    }, [feeSignal]);
    
    useEffect(() => {
        return () => {setData({ ...originalData})}; // Reset to original on unmount or when logo changes
    }, []);
    
    useEffect(() => {
        let termId = selectedSchool?.terms.find((t) => t.name === currentTerm)?.id;
        let sessionId = selectedSchool?.sessions.find((t) => t.name === currentSession)?.id;

        let url = `/school_finance/school-fee-settings/set-fee-for-classes/${selectedSchool?.id}/${sessionId}/${termId}/` ;
        sendRequest(url,"GET",null as any,TriggeredFunc,true,false)
    }, [currentTerm,currentSession]);

    
    return (
        <div className="space-y-4 animate-fadeIn  h-full relative max-h-full  ">
            <div className="border-b border-gray-100 pb-2">
                <h2 className="text-xl font-bold text-navy-900">School Fees Configuration</h2>
                <p className="text-sm text-gray-500">Set current sessions, terms, for school fee configurations.</p>
            </div>
            
            <div className="bg-navy-50 p-2 rounded-lg border z-[9999] sticky -top-8 border-navy-100 flex flex-col md:flex-row md:gap-3 gap-6 overflow-x-auto ">
               
                {/* Session Filter */}
                <div className="flex-1 w-fit ">
                    <label className="block text-sm font-bold text-navy-900 mb-2">Filter By Session</label>
                    <div className="flex gap-2 mb-1">
                        <select 
                            className={`w-full p-2 rounded-md border focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm transition-colors ${isChanged('session') ? 'border-orange-400 ring-2 ring-orange-100' : 'border-navy-200'}`}
                            value={data.session}
                            onChange={e => setData({...data, session: e.target.value})}
                        >
                            {sessions.map((s: string,idx) => <option key={`${idx}${s}`} value={s}>{s}</option>)}
                        </select>
                    </div>
                    
                </div>

                {/* Term Management */}
                <div className="flex-1 w-fit">
                    <label className="block text-sm font-bold text-navy-900 mb-2">Filter By Term</label>
                    <div className="flex gap-2 mb-1">
                        <select 
                            className={`w-full p-2 rounded-md border focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm transition-colors ${isChanged('session') ? 'border-orange-400 ring-2 ring-orange-100' : 'border-navy-200'}`}
                            value={data.term}
                            onChange={e => setData({...data, term: e.target.value})}
                        >
                            {terms.map((t: string) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                   

                    {/* Manage Terms Control */}
                </div>
            </div>
            <div className="space-y-4 pt-2">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fadeIn">
                    <div className="mb-4 ">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold text-navy-900 flex items-center">
                                <i className="fa-solid fa-money-bill-wave text-navy-500 mr-2"></i>
                                School Fees Configuration
                            </h3>
                            {feeSignal && <Button className='w-fit h-4 bg-green-700'
                            onClick={() => {
                                let termId = selectedSchool?.terms.find((t) => t.name === currentTerm)?.id;
                                let sessionId = selectedSchool?.sessions.find((t) => t.name === currentSession)?.id;

                                let url = `/school_finance/school-fee-settings/set-fee-for-classes/${selectedSchool?.id}/${sessionId}/${termId}/` ;
                                sendRequest(url,"GET",null as any,TriggeredFunc,true,false);
                                setFeeSignal(false);
                                }}>
                                See details
                            </Button>}
                            <Button className='w-fit h-4'
                            onClick={() => {
                                setShowModal(true)
                                }}>
                                New Configuration
                            </Button>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">Select multiple classes to lock their official school fees for <b>{currentSession}</b> - <b>{currentTerm}</b>.</p>
                    </div>
                    <Modal isOpen={showModal} onClose={() => {setShowModal(false);setSelectedClassIds([])}} title="Non Configured Classes List" icon="fa-solid fa-list">
                        <div className="bg-navy-50 p-6 rounded-xl border border-navy-100 mb-6 space-y-4 h-full max-h-[75vh]  overflow-y-scroll relative  ">
                            <div>
                                <div className="flex justify-between items-end mb-3 overflow-y-scroll">
                                    <label className="block text-sm font-bold text-navy-900 uppercase">1. Select Target Classes</label>
                                    <button onClick={handleSelectAllUnassigned} className="text-xs text-navy-600 hover:text-navy-900 font-bold bg-white px-3 py-1 rounded border border-navy-200 hover:bg-navy-50 transition-colors">
                                        Select All Unassigned
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 gap-3">
                                    {classRooms.map((c: any) => {
                                        const isSelected = selectedClassIds.includes(c.id);
                                        const existingFee = schoolFees.find((f: any) => f.class_rooms.includes(c?.id));
                                        const isSet = (currentTermFees?.map((fe:any )=> fe?.id).includes(c.id))
                                        
                                        return (
                                            <div 
                                                key={c.id}
                                                onClick={() => toggleClassSelection(c.id)}
                                                className={` relative cursor-pointer border rounded-lg p-3 flex flex-col items-start transition-all ${
                                                    isSelected 
                                                        ? 'bg-navy-900 border-navy-900 text-white shadow-md' 
                                                        : existingFee 
                                                            ? 'bg-white border-gray-200 hover:border-navy-300' 
                                                            : 'bg-white border-gray-300 hover:border-navy-400'
                                                }`}
                                            >
                                                <div className="flex justify-between w-full items-center mb-1">
                                                    <span>
                                                        <span className={`font-bold ${isSelected ? 'text-white' : 'text-navy-900'}`}>{c.name}</span>
                                                        <span className="text-sm font-bold text-green-900">{`⟪${c?.studentsCount}⟫s`}</span>
                                                    </span>
                                                    {isSelected && <i className="fa-solid fa-check-circle text-white"></i>}
                                                </div>

                                                {existingFee && !isSelected && (
                                                    <span className="text-xs font-bold text-green-700">Fee: {formatCurrency(existingFee.amount)}</span>
                                                )}
                                                {!existingFee && !isSelected && (
                                                    <span className="text-xs text-gray-500 italic">Unassigned Fee</span>
                                                )}
                                                {isSet && (
                                                    <span className="text-xs text-green-500 italic"> <i className="fa-solid fa-check-circle text-green-500"></i>Configured</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* <div className="border-t border-navy-200"></div> */}
                                
                            {(selectedClassIds.length > 0 )  &&
                                <div className="flex-1 w-full bg-white p-4 rounded-lg border flex flex-col justify-center border-orange-200 shadow-sm">
                                    <div className="flex items-start text-orange-800">
                                        <i className="fa-solid fa-triangle-exclamation text-xl mr-3 mt-1 text-orange-500"></i>
                                        <div>
                                            <h4 className="font-bold text-sm uppercase">Confirmation Warning For </h4>
                                            <h5 className="font-bold text-sm uppercase">{data?.session} »» {data?.term} </h5>
                                            <p className="text-sm mt-1">
                                                Saving will <b>permanently record and log</b> a specific  <b> Assigned </b> fee for each and every active student in the selected <b>{selectedClassIds.length}</b> class(es).Dependant on the fee for that class.
                                                <strong>
                                                    <i>
                                                        The Log will ignore students already logged for the perticuler Term in The Session
                                                    </i>
                                                </strong>
                                            </p>
                                        </div>
                                    </div>
                                                
                                </div>
                            }

                            <div className="flex justify-end pt-2 sticky -bottom-5">
                                <Button 
                                    onClick={handleAssignFee} 
                                    disabled={selectedClassIds.length === 0 || isLoading }
                                    className={`px-8 py-3 font-bold ${selectedClassIds.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-navy-900 text-white hover:bg-navy-800'}`}
                                >
                                    <i className="fa-solid fa-lock mr-2"></i> Log Fees for Selected Classes
                                </Button>
                            </div>
                        </div>
                    </Modal>

                    {currentTermFees.length > 0 ? (
                        <div className="overflow-x-auto border border-gray-200 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Students configured</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Inactive Students</th>
                                        <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Fee Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentTermFees.map((fee: any) => {
                                        const classInfo = classRooms.find((c: any) => c.id === fee.id);
                                        const classNameStr = classInfo ? classInfo.name : 'Unknown Class';
                                        const studentCount = fee?.configInfo?.totalStudents
                                        const configuredAmount = fee?.configInfo?.configuredAmount

                                        const studentConfigCount = fee?.configInfo?.configuredStudents
                                        const studentUnConfigCount = fee?.configInfo?.UnconfiguredStudents
                                        const inActiveCount = fee?.configInfo?.inActiveStudents
                                        
                                        return (
                                            <tr key={fee.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <div className="font-bold text-navy-900">{classNameStr}</div>
                                                    <div className="text-xs text-gray-500">FeeID: {fee?.id?.slice(1,10)}...</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {studentConfigCount}/{studentCount} Student(s)
                                                    </span>
                                                </td>
                                                
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                        {inActiveCount}/{studentCount} Student(s)
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-right font-bold text-navy-900">
                                                    {formatCurrency(configuredAmount)}
                                                </td>
                                                
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <i className="fa-solid fa-folder-open text-gray-300 text-4xl mb-3"></i>
                            <p className="text-gray-500">No school fees configured yet for {currentSession} - {currentTerm}.</p>
                            <p className="text-xs text-gray-400 mt-1">Select a class and set the fee amount above to get started.</p>
                        </div>
                    )}
                </div>
            </div>
             {/* School Fees Configuration */}
             <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title="Class Promotion History" size="lg">
                <div className="space-y-6">
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-2 text-sm text-navy-800">
                        <i className="fa-solid fa-info-circle mr-2"></i> This is a log of previously executed batch promotions.
                    </div>

                    {promotionLogs?.length > 0 ? (
                        <div className="space-y-6">
                            {promotionLogs?.map((exec, index) => {
                                const statusStyles = {
                                    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
                                    processing: "bg-blue-100 text-blue-800 border-blue-200",
                                    completed: "bg-green-100 text-green-800 border-green-200",
                                    failed: "bg-red-100 text-red-800 border-red-200",
                                };
                                return (
                                    <div key={exec.id || index} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                                        <div className="bg-gray-50 border-b border-gray-200 p-3 px-4 flex justify-between items-center">
                                            <div>
                                                <span className="font-bold text-navy-900 text-sm">Executed on {new Date(exec.created_at).toLocaleString()}</span>
                                                <span className="ml-3 text-xs bg-navy-100 text-navy-800 px-2 py-0.5 rounded font-bold">{findSessionById(exec.session)?.name} Session</span>
                                                <span className={`ml-3 text-xs px-2 py-0.5 rounded font-bold ${statusStyles[exec?.status?.toLowerCase()]}`}>{exec?.status}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                                                {exec.mappings.length} Class(es)
                                            </div>
                                        </div>
                                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                                            <thead className="bg-[#f8fafc]">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">From Class</th>
                                                    <th className="px-4 py-2 text-center text-xs font-bold text-gray-400"></th>
                                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-500 uppercase">To Class</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {exec.mappings.map((m: any, mIdx: number) => {
                                                    const fromClass = classRooms.find(c => c.id === m.fromClassId);
                                                    const toClass = classRooms.find(c => c.id === m.toClassId);
                                                    return (
                                                        <tr key={mIdx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3 font-medium text-gray-700">{fromClass ? fromClass.name : m.fromClassId}</td>
                                                            <td className="px-4 py-3 text-center text-navy-300"><i className="fa-solid fa-arrow-right"></i></td>
                                                            <td className="px-4 py-3 font-medium text-navy-900">{toClass ? toClass.name : m.toClassId}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                            <i className="fa-solid fa-history text-4xl text-gray-300 mb-3 block"></i>
                            <p className="text-navy-900 font-bold">No promotion history found</p>
                            <p className="text-gray-500 text-sm mt-1">Executed promotions will appear here</p>
                        </div>
                    )}
                </div>
            </Modal>

        </div>
    );
};
