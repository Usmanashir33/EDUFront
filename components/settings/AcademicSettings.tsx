
import React, { useState,useEffect, useContext, useMemo } from 'react';
import { Toggle, Button, Input ,Modal} from '../UI';

import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';

interface AcademicSettingsProps {
    data: any;
    setData: (d: any) => void;
    saveData: (operation : "SETFEE"|"ACADEMIC"|"SETPROMOTION" ,fdata?: any) => void;
    originalData: any;
    promotionMappings,
    setPromotionMappings
}
 
export const AcademicSettings : React.FC<AcademicSettingsProps> = ({
    data, setData, saveData, originalData ,
    promotionMappings, setPromotionMappings
}) => {
    // Local state for management UI
    const {selectedSchool,findSessionById,findTermById,} = useContext(uiContext);
    const [newSession, setNewSession] = useState('');
    const [newTerm, setNewTerm] = useState('');
    const [showModal,setShowModal] = useState(false)
    const [currentTermFees,setCurrentTermFees] = useState([])
    const {setToast,classRooms,schoolFees,students,isLoading,promotionLogs} = useContext(uiContext);
    const {sendRequest} = useRequest() ;

     // Manual Promotion State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [promoFromSearch, setPromoFromSearch] = useState('');
    const [promoToSearch, setPromoToSearch] = useState('');
    const [promoFromClassId, setPromoFromClassId] = useState('');
    const [promoToClassId, setPromoToClassId] = useState('');
    
    
    // Initialize lists if they don't exist in data
    const sessions = data.availableSessions || ['2023/2024', '2024/2025'];
    const terms = data.availableTerms || ['1st Term', '2nd Term', '3rd Term'];

    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  // Fee Configuration Logic
    const currentSession = data.session ;
    const currentTerm = data.term ;

    const getSession = useMemo(() => {
        let s = selectedSchool?.sessions.find((t) => t.name === currentSession);
        return s 
    },[data.session])

    const getTerm = useMemo(() => {
        let t = selectedSchool?.terms.find((t) => t.name === currentTerm);
        return t 
    },[data.term])

    const TriggeredFunc = ( resp : any ) => {
        console.log('resp: ', resp);
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

    const handleAddSession = () => {
        if (newSession && !sessions.includes(newSession)) {
            const updatedSessions = [...sessions, newSession];
            setData({ ...data, availableSessions: updatedSessions });
            setNewSession('');
        }
    };

    const handleAddTerm = () => {
        if (newTerm && !terms.includes(newTerm)) {
            const updatedTerms = [...terms, newTerm];
            setData({ ...data, availableTerms: updatedTerms });
            setNewTerm('');
        }
    };

    const handleDeleteTerm = (term: string) => {
        const updatedTerms = terms.filter((t: string) => t !== term);
        setData({ ...data, availableTerms: updatedTerms });
        // If current term is deleted, reset to first available
        if (data.term === term && updatedTerms.length > 0) {
            setData({ ...data, availableTerms: updatedTerms, term: updatedTerms[0] });
        }
    };

    const isChanged = (field: string) => data[field] !== originalData[field];
    const checkUpdate = () => {
        let disabled = false;
        Object.entries(originalData).forEach(([key,value]) => {
            if (data[key]?.length !== originalData[key]?.length) {
                disabled = true
            };
        })
        return disabled;
    }

    useEffect(() => {
        return () => setData({ ...originalData}); // Reset to original on unmount or when logo changes
    }, []);
    
    useEffect(() => {
        let termId = selectedSchool?.terms.find((t) => t.name === currentTerm)?.id;
        let sessionId = selectedSchool?.sessions.find((t) => t.name === currentSession)?.id;

        let url = `/school_finance/school-fee-settings/set-fee-for-classes/${selectedSchool?.id}/${sessionId}/${termId}/` ;
        sendRequest(url,"GET",null as any,TriggeredFunc,true,false)
    }, [currentTerm,currentSession]);

    
    // Manual Promotion Logic
    const handleAddPromotionMapping = () => {
        if (!promoFromClassId || !promoToClassId) {
            if (setToast) setToast({ message: 'Select both origin and destination classes.', type: 'error' });
            return ;
        }
        if (promoFromClassId === promoToClassId) {
            if (setToast) setToast({ message: 'A class cannot be promoted to itself.', type: 'error' });
            return ;
        }
        if (promotionMappings.some(m => m.fromClassId === promoFromClassId)) {
            if (setToast) setToast({ message: 'This class already has a promotion mapping.', type: 'error' });
            return;
        }

        // Check if fee is configured for destination class
        const hasFee = schoolFees.find((f: any) => f.class_rooms?.includes(promoToClassId));
        if (!hasFee && setToast) {
            setToast({ message: 'Warning: School fees not yet configured for the destination class.', type: 'info' });
        }

        const newMappings = [...promotionMappings, { fromClassId: promoFromClassId, toClassId: promoToClassId }];
        setPromotionMappings(newMappings);
        setData({ ...data, promotionMappings: newMappings });
        setPromoFromClassId('');
        setPromoToClassId('');
        setPromoFromSearch('');
        setPromoToSearch('');
    };

    const handleRemovePromotionMapping = (fromId: string) => {
        const newMappings = promotionMappings.filter(m => m.fromClassId !== fromId);
        setPromotionMappings(newMappings);
        setData({ ...data, promotionMappings: newMappings });
    };

    const handleExecutePromotions = () => {
        if (promotionMappings.length === 0) {
            if (setToast) setToast({ message: 'Add at least one class promotion mapping.', type: 'error' });
            return;
        }
        // let sessionId = selectedSchool?.sessions.find((t) => t.name === currentSession)?.id;
        let sessionId = getSession?.id;

        const executedRecord = {
            // id: `promo-exec-${Date.now()}`,
            // date: new Date().toISOString(),
            school: selectedSchool?.id ,
            session: currentSession ,
            sessionId:  sessionId ,
            mappings: [...promotionMappings]
        };
        saveData("SETPROMOTION",executedRecord) ;
        return ;
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Academic Configuration</h2>
                <p className="text-sm text-gray-500">Set current sessions, terms, and grading rules.</p>
            </div>
            
            <div className="bg-navy-50 p-6 rounded-lg border border-navy-100 flex flex-col md:flex-row gap-8">
               
                {/* Session Management */}
                <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-navy-900 mb-2">Current Session</label>
                    <div className="flex gap-2 mb-3">
                        <select 
                            className={`w-full p-3 rounded-md border focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm transition-colors ${isChanged('session') ? 'border-orange-400 ring-2 ring-orange-100' : 'border-navy-200'}`}
                            value={data.session}
                            onChange={e => setData({...data, session: e.target.value})}
                        >
                            {sessions.map((s: string) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {isChanged('session') && (
                        <div className="mb-4 bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r animate-fadeIn">
                            <div className="flex items-start">
                                <i className="fa-solid fa-triangle-exclamation text-orange-600 mt-0.5 mr-2"></i>
                                <div>
                                    <p className="text-xs font-bold text-orange-800 uppercase">Critical System Change</p>
                                    <p className="text-xs text-orange-700 mt-1 leading-relaxed">
                                        Advancing the academic session will <b>archive all active class registers</b>, attendance, and gradebooks. New records will be initialized for {data.session}.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Add Session Control */}
                    <div className="bg-white p-3 rounded border border-navy-200">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Add New Session</p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="e.g. 2025/2026" 
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy-500"
                                value={newSession}
                                onChange={(e) => setNewSession(e.target.value)}
                            />
                            <button onClick={handleAddSession} className="bg-navy-900 text-white px-3 py-1 rounded text-xs font-bold hover:bg-navy-800">
                                <i className="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Term Management */}
                <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-navy-900 mb-2">Current Term</label>
                    <div className="flex gap-2 mb-3">
                        <select 
                            className={`w-full p-3 rounded-md border focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm transition-colors ${isChanged('term') ? 'border-gold-400 ring-2 ring-gold-100' : 'border-navy-200'}`}
                            value={data.term}
                            onChange={e => setData({...data, term: e.target.value})}
                        >
                            {terms.map((t: string) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    {isChanged('term') && (
                        <div className="mb-4 bg-gold-50 border-l-4 border-gold-500 p-3 rounded-r animate-fadeIn">
                            <div className="flex items-start">
                                <i className="fa-solid fa-clock-rotate-left text-gold-600 mt-0.5 mr-2"></i>
                                <div>
                                    <p className="text-xs font-bold text-gold-800 uppercase">Term Migration</p>
                                    <p className="text-xs text-gold-700 mt-1 leading-relaxed">
                                        Switching to <b>{data.term}</b> will update the active context for all teachers. Ensure grading for {originalData.term} is concluded.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manage Terms Control */}
                    <div className="bg-white p-3 rounded border border-navy-200">
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Manage Terms</p>
                        
                        {/* List Existing */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {terms.map((t: string) => (
                                <span key={t} className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border border-gray-200">
                                    {t}
                                    {terms.length > 1 && (
                                        <i onClick={() => handleDeleteTerm(t)} className="fa-solid fa-xmark ml-2 cursor-pointer text-red-400 hover:text-red-600"></i>
                                    )}
                                </span>
                            ))}
                        </div>

                        {/* Add New */}
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="e.g. Summer Term" 
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy-500"
                                value={newTerm}
                                onChange={(e) => setNewTerm(e.target.value)}
                            />
                            <button onClick={handleAddTerm} className="bg-navy-900 text-white px-3 py-1 rounded text-xs font-bold hover:bg-navy-800">
                                <i className="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
             {/* School Fees Configuration */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fadeIn">
                <div className="mb-4 ">
                    <div className="flex justify-between ">
                        <h3 className="text-lg font-bold text-navy-900 flex items-center">
                            <i className="fa-solid fa-money-bill-wave text-navy-500 mr-2"></i>
                            School Fees Configuration
                        </h3>
                        <Button className='w-fit'
                        onClick={() => {
                            setShowModal(true)
                            }}>
                            New Configuration
                        </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Select multiple classes to lock their official school fees for <b>{currentSession}</b> - <b>{currentTerm}</b>.</p>
                </div>
                 <Modal isOpen={showModal} onClose={() => {setShowModal(false);setSelectedClassIds([])}} title="Non Configured Classes List" icon="fa-solid fa-list">
                    <div className="bg-navy-50 p-6 rounded-xl border border-navy-100 mb-6 space-y-6">
                        <div>
                            <div className="flex justify-between items-end mb-3">
                                <label className="block text-sm font-bold text-navy-900 uppercase">1. Select Target Classes</label>
                                <button onClick={handleSelectAllUnassigned} className="text-xs text-navy-600 hover:text-navy-900 font-bold bg-white px-3 py-1 rounded border border-navy-200 hover:bg-navy-50 transition-colors">
                                    Select All Unassigned
                                </button>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                {classRooms.filter((cls :any ) => !(currentTermFees?.map((fe:any )=> fe?.id).includes(cls.id))).map((c: any) => {
                                    const isSelected = selectedClassIds.includes(c.id);
                                    const existingFee = schoolFees.find((f: any) => f.classIds.includes(c?.id));
                                    
                                    return (
                                        <div 
                                            key={c.id}
                                            onClick={() => toggleClassSelection(c.id)}
                                            className={`cursor-pointer border rounded-lg p-3 flex flex-col items-start transition-all ${
                                                isSelected 
                                                    ? 'bg-navy-900 border-navy-900 text-white shadow-md' 
                                                    : existingFee 
                                                        ? 'bg-white border-gray-200 hover:border-navy-300' 
                                                        : 'bg-white border-gray-300 hover:border-navy-400'
                                            }`}
                                        >
                                            <div className="flex justify-between w-full items-center mb-1">
                                                <span className={`font-bold ${isSelected ? 'text-white' : 'text-navy-900'}`}>{c.name}</span>
                                                {isSelected && <i className="fa-solid fa-check-circle text-white"></i>}
                                            </div>
                                            {existingFee && !isSelected && (
                                                <span className="text-xs font-bold text-green-600">Assigned: {formatCurrency(existingFee.amount)}</span>
                                            )}
                                            {!existingFee && !isSelected && (
                                                <span className="text-xs text-gray-500 italic">Unassigned</span>
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
                                        <h4 className="font-bold text-sm uppercase">Confirmation Warning</h4>
                                        <p className="text-sm mt-1">
                                            Saving will <b>permanently lock and log</b> a specific  <b> Assigned </b> fee for each and every student in the selected {selectedClassIds.length} class(es).Dependant on the fee for that class .
                                        </p>
                                    </div>
                                </div>
                                            
                            </div>
                        }

                        <div className="flex justify-end pt-2">
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
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Class</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Students configured</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Inactive Students</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Fee Amount</th>
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
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-bold text-navy-900">{classNameStr}</div>
                                                <div className="text-xs text-gray-500">ID: {fee.id}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {studentConfigCount}/{studentCount} Student(s)
                                                </span>
                                            </td>
                                            
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {inActiveCount}/{studentCount} Student(s)
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-navy-900">
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

            <div className="space-y-4 pt-2">
                <div className={`transition-all duration-300 ${isChanged('autoPromotion') ? 'bg-orange-50 p-4 rounded-lg border border-orange-200' : ''}`}>
                    <Toggle 
                        label="Auto-Promotion System" 
                        description="Automatically promote students based on final grades." 
                        checked={data.autoPromotion} 
                        onChange={v => setData({...data, autoPromotion: v})} 
                    />
                    {isChanged('autoPromotion') && (
                        <p className="text-xs text-orange-700 mt-2 flex items-center animate-fadeIn">
                            <i className="fa-solid fa-info-circle mr-2"></i>
                            <b>Logic Change:</b> {data.autoPromotion ? "Students passing the threshold will now be moved automatically at session end." : "All promotions will require manual approval by the director or form teacher."}
                        </p>
                    )}
                </div>
                
                {!data.autoPromotion && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm animate-fadeIn mt-6">
                        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                            <h3 className="text-lg font-bold text-navy-900 flex items-center">
                                <i className="fa-solid fa-graduation-cap text-navy-500 mr-2"></i>
                                Manual Class Promotion Mapping 
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Configure exactly which class students should be promoted to at the end of the session.</p>
                            </div>
                            <Button variant="secondary" onClick={() => setIsHistoryModalOpen(true)} className="whitespace-nowrap max-w-fit">
                                <i className="fa-solid fa-history mr-2"></i> Promotions Records
                            </Button>
                        </div>

                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mb-6 text-sm text-navy-800">
                            <strong><i className="fa-solid fa-circle-exclamation mr-1"></i> Promotion Logic Checklist:</strong>
                            <ul className="list-disc pl-5 mt-2 space-y-1 text-xs">
                                <li>Ensure the origin class has not already been promoted in the <strong>{getSession?.name}</strong> session.</li>
                                <li>Ensure the destination (promoted) class has its <strong>School Fees configured</strong> for the upcoming academic period.If not, scroll up to <strong>School Fees configuration.</strong></li>
                                <li>Once mapped, click "Execute Class Promotions" to log the batch payload for the backend.</li>
                            </ul>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 items-end mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex-1 w-full relative">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Origin Class (Promote From)</label>
                                <input 
                                    list="from-class-list"
                                    type="text" 
                                    placeholder="Type or select class..." 
                                    className="w-full p-2.5 rounded border border-gray-300 focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500"
                                    value={promoFromSearch}
                                    onChange={(e) => {
                                        setPromoFromSearch(e.target.value);
                                        const cls = classRooms.find(c => c.name === e.target.value);
                                        setPromoFromClassId(cls ? cls.id : '');
                                    }}
                                />
                                <datalist id="from-class-list">
                                    {classRooms.filter(c => {
                                        let inMap = !promotionMappings.some(m => m.fromClassId === c.id) 
                                        let inExec = !promotionLogs?.some(m => m.mappings.find(mc => mc.fromClassId === c.id ))
                                        return inMap && inExec
                                    }).map((c: any) => (
                                        <option key={c.id} value={c.name} />
                                    ))}
                                </datalist>
                                {promoFromClassId && <i className="fa-solid fa-check-circle text-green-500 absolute right-3 tops-9 mt-[2.1rem]"></i>}
                            </div>
                            
                            <div className="flex items-center justify-center -mx-2 bg-white rounded-full w-10 h-10 border border-gray-200 shadow-sm z-10 shrink-0 self-center mt-6">
                                <i className="fa-solid fa-arrow-right text-navy-500"></i>
                            </div>

                            <div className="flex-1 w-full relative">
                                <label className="block text-xs font-bold text-navy-900 uppercase mb-2">Destination Class (Promoted To)</label>
                                <input 
                                    list="to-class-list"
                                    type="text" 
                                    placeholder="Type or select class..." 
                                    className={`w-full p-2.5 rounded border ${promoToClassId ? 'border-navy-300 bg-navy-50' : 'border-gray-300'} focus:outline-none focus:border-navy-500 focus:ring-1 focus:ring-navy-500`}
                                    value={promoToSearch}
                                    onChange={(e) => {
                                        setPromoToSearch(e.target.value);
                                        const cls = classRooms.find(c => c.name === e.target.value);
                                        setPromoToClassId(cls ? cls.id : '');
                                    }}
                                />
                                <datalist id="to-class-list">
                                    {classRooms.map((c: any) => (
                                        <option key={c.id} value={c.name} />
                                    ))}
                                </datalist>
                                {promoToClassId && <i className="fa-solid fa-check-circle text-green-500 absolute right-3 tops-9 mt-[2.1rem]"></i>}
                            </div>
                            
                            <div className="w-full md:w-auto">
                                <Button onClick={handleAddPromotionMapping} variant="secondary" className="w-full h-[46px] whitespace-nowrap">
                                    <i className="fa-solid fa-plus-circle mr-2"></i> Add To Mapping Batch
                                </Button>
                            </div>
                        </div>

                        {promotionMappings.length > 0 && (
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-navy-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Origin Class</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-navy-900 uppercase tracking-wider">Transfer To</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-navy-900 uppercase tracking-wider">Destination Class</th>
                                            <th className="px-6 py-3 text-center text-xs font-bold text-navy-900 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {promotionMappings.map((m, idx) => {
                                            const fromClass = classRooms.find(c => c.id === m.fromClassId);
                                            const toClass = classRooms.find(c => c.id === m.toClassId);
                                            const fromName = fromClass ? fromClass.name : m.fromClassId;
                                            const toName = toClass ? toClass.name : m.toClassId;
                                            const feeConfigured = schoolFees.find((f: any) => f.class_rooms?.includes(m.toClassId))?.amount ;

                                            return (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-700">
                                                        {fromName}
                                                        <div className="text-[10px] text-gray-400">ID: {m.fromClassId}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-navy-300">
                                                        <i className="fa-solid fa-long-arrow-alt-right text-lg"></i>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="font-bold text-navy-900">{toName}</div>
                                                        {!(feeConfigured > 0) ? (
                                                            <div className="text-[10px] font-bold text-red-500 mt-1">
                                                                <i className="fa-solid fa-exclamation-triangle mr-1"></i> Fee not set
                                                            </div>
                                                        ) :(
                                                            <div className="text-[10px] font-bold text-navy-500 mt-1">
                                                                <i className="fa-solid fa-check mr-1"></i>{formatCurrency(feeConfigured)}
                                                            </div>
                                                        )
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                                        <button 
                                                            onClick={() => handleRemovePromotionMapping(m.fromClassId)}
                                                            className="text-red-400 hover:text-red-600 transition-colors"
                                                            title="Remove mapping"
                                                        >
                                                            <i className="fa-solid fa-trash-alt"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-between items-center">
                                    <div className="text-xs text-gray-500">
                                        <b>{promotionMappings.length}</b> mapping(s) prepared for batch transfer.
                                    </div>
                                    <Button onClick={handleExecutePromotions} className="bg-navy-900 text-white hover:bg-navy-800">
                                        <i className="fa-solid fa-bolt mr-2"></i> Execute Class Promotions
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="border-t border-gray-100 my-2"></div>

                <div className={`transition-all duration-300 ${isChanged('lockPastRecords') ? 'bg-red-50 p-4 rounded-lg border border-red-200' : ''}`}>
                    <Toggle 
                        label="Lock Past Academic Records" 
                        description="Prevent editing of grades from previous sessions." 
                        checked={data.lockPastRecords} 
                        onChange={v => setData({...data, lockPastRecords: v})} 
                    />
                    {isChanged('lockPastRecords') && (
                        <p className="text-xs text-red-700 mt-2 flex items-center animate-fadeIn">
                            <i className="fa-solid fa-lock mr-2"></i>
                            <b>Security Alert:</b> {data.lockPastRecords ? "Historical grades are now READ-ONLY." : "WARNING: Historical grades are now EDITABLE. This opens the system to potential record tampering."}
                        </p>
                    )}
                </div>
                <div className="px-6 pt-6 mt- border-t border-gray-100 hidden md:block">
                    <Button onClick={() => {
                        saveData("ACADEMIC")
                    }} disabled={checkUpdate()} className="w-full">
                     <i className="fa-solid fa-save mr-2"></i> Save Changes
                    </Button>
                </div>
            </div>
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
