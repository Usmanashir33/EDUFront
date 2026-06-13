
import React from 'react';
import { Button, Input } from '../UI';
import { Teacher, SchoolSection, Subject } from '../../types';

interface TimetableSettingsProps {
    config: any;
    setConfig: (c: any) => void;
    teachers: Teacher[] |any ;
    sections: SchoolSection[] |any ;
    subjects: Subject[] |any ;
    onToast: (msg: any) => void;
}

export const TimetableSettings: React.FC<TimetableSettingsProps> = ({ config, setConfig, teachers, sections, subjects, onToast }) => {
    const weekDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

    const updateTeacherTime = (tId: string, field: 'startTime' | 'endTime' | 'maxHours', value: any) => {
        const current = config.teacherAvailability[tId] || { days: [], startTime: '08:00', endTime: '14:00', maxHours: 5 };
        setConfig({
            ...config,
            teacherAvailability: {
                ...config.teacherAvailability,
                [tId]: { ...current, [field]: value }
            }
        });
    };
  
    const toggleTeacherAvailabilityDay = (tId: string, day: string) => {
        const current = config.teacherAvailability[tId] || { days: [], startTime: '08:00', endTime: '14:00', maxHours: 5 };
        const newDays = current.days.includes(day) 
            ? current.days.filter((d: string) => d !== day)
            : [...current.days, day];
        
        setConfig({
            ...config,
            teacherAvailability: {
                ...config.teacherAvailability,
                [tId]: { ...current, days: newDays }
            }
        });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-gray-100 pb-4 flex justify-between items-end">
                <div>
                    <h2 className="text-xl font-bold text-navy-900">Advanced Timetable Generator</h2>
                    <p className="text-sm text-gray-500">Configure parameters, select sections, and map teacher availability (Sat-Wed).</p>
                </div>
                {/* <Button className="w-auto px-4" onClick={() => onToast({message: "Timetable generation started...", type: 'success'})}> */}
                <Button className="w-auto px-4" onClick={() => onToast({message: "This feature is not ready yet", type: 'info'})}>
                    <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> Generate
                </Button>
            </div>
            <p className="text-lg text-center text-gray-500">This feature is not ready yet.</p>

            {/* 1. General Config */}
            {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input 
                    type="number" 
                    label="Periods per Day" 
                    value={config.periodsPerDay} 
                    onChange={e => setConfig({...config, periodsPerDay: Number(e.target.value)})} 
                    iconClass="fa-solid fa-list-ol" 
                />
                <Input 
                    type="number" 
                    label="Duration (Mins)" 
                    value={config.durationPerPeriod} 
                    onChange={e => setConfig({...config, durationPerPeriod: Number(e.target.value)})} 
                    iconClass="fa-regular fa-clock" 
                />
                <Input 
                    type="number" 
                    label="Break Time (Mins)" 
                    value={config.breakDuration} 
                    onChange={e => setConfig({...config, breakDuration: Number(e.target.value)})} 
                    iconClass="fa-solid fa-mug-hot" 
                />
            </div> */}

            {/* 2. Section Scoping */}
            {/* <div className="bg-navy-50 p-6 rounded-lg border border-navy-100">
                <h4 className="font-bold text-navy-900 mb-4 flex items-center">
                    <i className="fa-solid fa-layer-group mr-2 text-navy-600"></i> Select Sections for Generation
                </h4>
                <p className="text-xs text-gray-500 mb-4">The generator will only create schedules for the selected sections and their associated courses.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {sections.map(sec => (
                        <label key={sec.id} className={`flex items-center p-3 rounded border cursor-pointer transition-all ${config.selectedSections.includes(sec.id) ? 'bg-white border-navy-900 shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}>
                            <input 
                                type="checkbox" 
                                checked={config.selectedSections.includes(sec.id)}
                                onChange={() => {
                                    const newSecs = config.selectedSections.includes(sec.id) 
                                        ? config.selectedSections.filter((id: string) => id !== sec.id) 
                                        : [...config.selectedSections, sec.id];
                                    setConfig({...config, selectedSections: newSecs});
                                }}
                                className="w-4 h-4 text-navy-900 rounded focus:ring-navy-900"
                            />
                            <span className="ml-2 text-sm font-semibold text-navy-800">{sec.name}</span>
                        </label>
                    ))}
                </div>
            </div> */}

            {/* 3. Teacher Availability & Constraints */}
            {/* <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-100 p-4 border-b border-gray-200">
                    <h4 className="font-bold text-navy-900">Teacher Availability & Assignments</h4>
                    <p className="text-xs text-gray-500">Define available days (Sat-Wed) and time slots for each teacher.</p>
                </div>
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                    {teachers.map(t => {
                        const assignedSubs = subjects;
                        const tConfig = config.teacherAvailability[t.id] || { days: [], startTime: '08:00', endTime: '14:00', maxHours: 5 };

                        return (
                            <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-3">
                                    <div>
                                        <p className="font-bold text-navy-900 text-sm">{t.title} {t.first_name} {t.last_name}</p>
                                        <p className="text-xs text-gray-500">{assignedSubs.length} Subjects: {assignedSubs.map(s => s.name).join(', ')}</p>
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        <div className="flex flex-col">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Available Time</label>
                                            <div className="flex items-center gap-2">
                                                <input type="time" value={tConfig.startTime} onChange={e => updateTeacherTime(t.id, 'startTime', e.target.value)} className="border p-1 rounded text-xs" />
                                                <span className="text-gray-400">-</span>
                                                <input type="time" value={tConfig.endTime} onChange={e => updateTeacherTime(t.id, 'endTime', e.target.value)} className="border p-1 rounded text-xs" />
                                            </div>
                                        </div>
                                            <div className="flex flex-col">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase">Max Hrs/Day</label>
                                            <input type="number" value={tConfig.maxHours} onChange={e => updateTeacherTime(t.id, 'maxHours', e.target.value)} className="border p-1 rounded text-xs w-16" />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {weekDays.map(day => (
                                        <button
                                            key={day}
                                            onClick={() => toggleTeacherAvailabilityDay(t.id, day)}
                                            className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                                                tConfig.days.includes(day) 
                                                ? 'bg-navy-900 text-white border-navy-900' 
                                                : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {day.substring(0,3)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div> */}
        </div>
    );
};
