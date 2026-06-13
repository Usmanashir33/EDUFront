
import React, { useState,useEffect, useContext, useMemo } from 'react';
import { Toggle, Button, Input ,Modal} from '../UI';

import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import { stringify } from 'querystring';

interface AcademicSettingsProps {
    data: any;
    setData: (d: any) => void;
    saveData: (operation : "SETFEE"|"ACADEMIC"|"SETPROMOTION"|'CONFIGURATIONS'|"CORRENTCONFIGURATIONS" | any ,fdata?: any) => void;
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
    const {setToast,classRooms,schoolFees,students,isLoading,promotionLogs} = useContext(uiContext);

     // Manual Promotion State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [promoFromSearch, setPromoFromSearch] = useState('');
    const [promoToSearch, setPromoToSearch] = useState('');
    const [promoFromClassId, setPromoFromClassId] = useState('');
    const [promoToClassId, setPromoToClassId] = useState('');
    const [showAddingSessionorTerm,setShowAddingSessionorTerm] = useState(false);
    const [termOrSession,setTermOrSession] = useState<"TERM"|"SESSION">('SESSION');
    
    // Initialize lists if they don't exist in data
    const sessions = data.availableSessions || ['2000/2001'];
    const terms = data.availableTerms || ['null'];

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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };

    const handleAddSession = () => {
        if (newSession ) {
            let form ={
                school : selectedSchool.id ,
                name : newSession,
                configType : "SESSION"
            }
            saveData("CONFIGURATIONS",form)
            setNewSession('');
        }
    };

    const handleAddTerm = () => {
        if (newTerm ) {
            let form ={
                school : selectedSchool.id ,
                name : newTerm,
                configType : "TERM"
            }
            saveData("CONFIGURATIONS",form)
            setNewTerm('');
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
        let sessionId = getSession?.id;

        const executedRecord = {
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
            
            <div className="bg-navy-50 p-6 rounded-lg border border-navy-100 flex flex-col md:flex-row md:gap-3 gap-6 overflow-x-auto ">
               
                {/* Session Management */}
                <div className="flex-1 w-fit ">
                    <label className="block text-sm font-bold text-navy-900 mb-2">Manage Current Session</label>
                    <div className="flex gap-2 mb-3">
                        <select 
                            className={`w-full p-3 rounded-md border focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm transition-colors ${isChanged('session') ? 'border-orange-400 ring-2 ring-orange-100' : 'border-navy-200'}`}
                            value={data.session}
                            onChange={e => setData({...data, session: e.target.value})}
                        >
                            {sessions.map((s: string,idx) => <option key={`${idx}${s}`} value={s}>{s}</option>)}
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
                                        <b>Click save changes below to proceed.</b>
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
                            <button onClick={() =>  {if (!newSession)return ;setTermOrSession("SESSION"),setShowAddingSessionorTerm(true)}} className="bg-navy-900 text-white px-3 py-1 rounded text-xs font-bold hover:bg-navy-800">
                                <i className="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Term Management */}
                <div className="flex-1 w-fit">
                    <label className="block text-sm font-bold text-navy-900 mb-2">Manage Current Term</label>
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
                                        <b>Click save changes below to proceed</b>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Manage Terms Control */}
                    <div className="bg-white p-3 rounded border border-navy-200">
                        {/* List Existing
                        <div className="flex flex-wrap gap-2 mb-3">
                            {terms.map((t: string) => (
                                <span key={t} className="inline-flex items-center bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border border-gray-200">
                                    {t}
                                    {terms.length > 1 && (
                                        <i onClick={() => handleDeleteTerm(t)} className="fa-solid fa-xmark ml-2 cursor-pointer text-red-400 hover:text-red-600"></i>
                                    )}
                                </span>
                            ))}
                        </div> */}

                        {/* Add New */}
                        <p className="text-xs font-bold text-gray-500 uppercase mb-2">Add New Term</p>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="e.g. Summer Term" 
                                className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-navy-500"
                                value={newTerm}
                                onChange={(e) => setNewTerm(e.target.value)}
                            />
                            <button onClick={() => {if (!newTerm)return ;setTermOrSession("TERM"),setShowAddingSessionorTerm(true)}} className="bg-navy-900 text-white px-3 py-1 rounded text-xs font-bold hover:bg-navy-800">
                                <i className="fa-solid fa-plus"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            <div className="border-t border-gray-400 "></div>

            <div className={`transition-all duration-300 ${isChanged('lockPastRecords') ? 'bg-red-50 p-2 rounded-lg border border-red-200' : ''}`}>
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
                    {/* promosion tab  */}
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

                <div className="px-6 pt-6 mt- border-t border-gray-100">
                    <Button onClick={() => {
                        saveData("ACADEMIC")
                    }} disabled={checkUpdate()} className="w-fit">
                     <i className="fa-solid fa-save mr-2"></i> Save Changes
                    </Button>
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

            {/* Fee Settings Configuration Warning Modal */}
            <Modal isOpen={showAddingSessionorTerm} onClose={() => setShowAddingSessionorTerm(false)} title="School Configuration Alert" size="md">
                <div className="space-y-4 flex flex-col items-center text-center pt-2 pb-4">
                    <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center shadow-sm border border-gold-200">
                        <i className="fa-solid fa-triangle-exclamation text-4xl text-gold-500 animate-pulse"></i>
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-navy-900 mb-3">Action Required.</h3>
                        <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                            New {termOrSession} Precausions!
                            <br/><br/>
                                Make sure the name written is perfect on its role.
                            <br/><br/>
                            If the new {`${termOrSession?.toLocaleLowerCase() } `} 
                             is added all the school configurations,records,etc associated with it will use it as its reference, so you cannot <b>update</b> it's name or <b>delete</b> it completely.
                             <strong className="text-navy-900"> Click Configure ⇓ </strong> below to proceed.
                        </p>
                    </div>
                    
                    <div className="flex w-full gap-4 mt-6 border-t border-gray-100 pt-6">
                        <Button variant="secondary" onClick={() => setShowAddingSessionorTerm(false)} className="flex-1 py-3 text-sm font-bold justify-center">
                            Cancel
                        </Button>
                        <Button onClick={() => {
                            setShowAddingSessionorTerm(false);
                            if (termOrSession === "SESSION") handleAddSession()
                            if (termOrSession === "TERM") handleAddTerm()
                        }} className="bg-navy-900 text-white flex-[2] flex items-center justify-center py-3 text-sm font-bold shadow-md hover:bg-navy-800 transition-colors">
                            <i className="fa-solid fa-cogs mr-2"></i> Configure
                        </Button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};
