
import React, { useState } from 'react';
import { Button, Modal } from '../UI';
import { Teacher, Subject } from '../../types';

// --- HELPERS ---

export const downloadFile = (content: string, mimeType: string, filename: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); 
};

export const generateCSV = (data: any[], fields: { key: string, label: string }[]) => {
    const header = fields.map(f => f.label).join(',');
    const rows = data.map(item => {
        return fields.map(f => {
            const val = f.key.split('.').reduce((acc, part) => acc && acc[part], item) || '';
            const stringVal = String(val).replace(/"/g, '""');
            return `"${stringVal}"`;
        }).join(',');
    });
    return [header, ...rows].join('\n');
};  

export const generateMockTimetable = (className: string) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periods = [
        { time: '08:00 - 08:45', start: 8 * 60, end: 8 * 60 + 45 },
        { time: '08:45 - 09:30', start: 8 * 60 + 45, end: 9 * 60 + 30 },
        { time: '09:30 - 10:15', start: 9 * 60 + 30, end: 10 * 60 + 15 },
        { time: '10:45 - 11:30', start: 10 * 60 + 45, end: 11 * 60 + 30 }, 
        { time: '11:30 - 12:15', start: 11 * 60 + 30, end: 12 * 60 + 15 }
    ];
    const subjectsList = ['Math', 'English', 'Physics', 'Chemistry', 'Biology', 'Civic', 'Geography', 'Economics'];
    const seed = className.charCodeAt(0) || 0;

    return days.map((day, dIdx) => ({
        day,
        periods: periods.map((p, pIdx) => {
            const subjIndex = (seed + dIdx + pIdx) % subjectsList.length;
            const isFree = (seed + dIdx + pIdx) % 7 === 0;
            return { ...p, subject: isFree ? 'Free Period' : subjectsList[subjIndex] };
        })
    }));
};

export const getCurrentPeriodInfo = (timetable: any[], subjects: Subject[], teachers: Teacher[], currentTime: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[currentTime.getDay()];
    const todaySchedule = timetable.find(d => d.day === currentDayName);
    
    if (!todaySchedule) return { subject: 'Weekend', time: '--:--', teacher: '', status: 'Free' };

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    const activePeriod = todaySchedule.periods.find((p: any) => currentMinutes >= p.start && currentMinutes < p.end);

    if (!activePeriod) {
        if (currentMinutes > todaySchedule.periods[0].start && currentMinutes < todaySchedule.periods[todaySchedule.periods.length - 1].end) {
             return { subject: 'Break / Transition', time: '--:--', teacher: '', status: 'Break' };
        }
        return { subject: 'Closed', time: '--:--', teacher: '', status: 'Closed' };
    }

    let teacherName = 'No Teacher';
    let subjectName = activePeriod.subject;

    if (subjectName !== 'Free Period') {
        const sub = subjects.find(s => s.name.toLowerCase().includes(subjectName.toLowerCase()) || subjectName.toLowerCase().includes(s.name.toLowerCase()));
        if (sub) {
            subjectName = sub.name; 
            if (sub.teacherIds.length > 0) {
                const t = teachers.find(tr => tr.id === sub.teacherIds[0]);
                if (t) teacherName = `${t.title} ${t.lastName}`;
            }
        }
    }

    return { subject: subjectName, time: activePeriod.time, teacher: teacherName, status: subjectName === 'Free Period' ? 'Free' : 'Ongoing' };
};

// --- COMPONENTS ---

export const TimetableModal: React.FC<any> = ({ isOpen, onClose, target, currentSession, currentTerm }) => {
    const [downloadFormat, setDownloadFormat] = useState<'PDF' | 'IMAGE' | ''>('');
    const [isDownloading, setIsDownloading] = useState(false);

    if (!target || !isOpen) return null;
    const schedule = generateMockTimetable(target.name);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${target.name} Timetable`} icon="fa-solid fa-calendar-days">
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #printable-timetable, #printable-timetable * { visibility: visible; }
                    #printable-timetable { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
                    .no-print { display: none !important; }
                }
            `}</style>

            <div className="bg-white p-4" id="printable-timetable">
                <div className="flex items-center justify-between border-b-2 border-navy-900 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center text-navy-900 text-2xl font-bold print:border print:border-black">
                            <i className="fa-solid fa-graduation-cap"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-navy-900 uppercase tracking-wider">Springfield High Academy</h2>
                            <p className="text-sm text-gray-600">Excellence in Education • {currentSession} Session</p>
                        </div>
                    </div>
                    <div className="text-right">
                            <h3 className="text-lg font-bold text-navy-800 uppercase">{target.name}</h3>
                            <p className="text-xs font-bold bg-navy-100 text-navy-800 px-2 py-1 rounded inline-block print:border print:border-black">{currentTerm}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                            <tr className="bg-navy-900 text-white print:bg-black print:text-white">
                                <th className="border border-gray-600 p-2">Time / Day</th>
                                {schedule.map(d => <th key={d.day} className="border border-gray-600 p-2 w-1/6">{d.day}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {schedule[0].periods.map((p: any, pIdx: number) => (
                                <tr key={pIdx} className="even:bg-gray-50 print:even:bg-gray-100">
                                    <td className="border border-gray-300 p-2 font-bold text-gray-700 text-center">{p.time}</td>
                                    {schedule.map((day: any, dIdx: number) => (
                                        <td key={dIdx} className="border border-gray-300 p-2 text-center text-navy-800 font-medium">
                                            {day.periods[pIdx].subject}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-gray-50 p-4 border-t border-gray-200 mt-4 rounded-b-lg no-print">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-navy-900">Download As:</label>
                        <select className="text-xs border border-gray-300 rounded p-2" value={downloadFormat} onChange={(e) => setDownloadFormat(e.target.value as 'PDF' | 'IMAGE')}>
                            <option value="">Select Format</option>
                            <option value="PDF">PDF (Print)</option>
                            <option value="IMAGE">Image (PNG)</option>
                        </select>
                        <Button className="w-auto px-4 py-1.5 text-xs" disabled={!downloadFormat || isDownloading} onClick={() => { setIsDownloading(true); setTimeout(() => { window.print(); setIsDownloading(false); setDownloadFormat(''); }, 1000); }}>
                            {isDownloading ? 'Processing...' : <><i className="fa-solid fa-download mr-1"></i> Download</>}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="w-auto">Close</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export const UnifiedExportModal: React.FC<{ isOpen: boolean, onClose: () => void, data: any[], type: 'STUDENT' | 'TEACHER' | 'CLASS', title: string }> = ({ isOpen, onClose, data, type, title }) => {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    
    // Configs
    const configs = {
        STUDENT: [
            { key: 'admissionNumber', label: 'Admission No.' },
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'gender', label: 'Gender' },
            { key: 'guardian.phone', label: 'Parent Phone' }
        ],
        TEACHER: [
            { key: 'staffId', label: 'Staff ID' },
            { key: 'title', label: 'Title' },
            { key: 'firstName', label: 'First Name' },
            { key: 'lastName', label: 'Last Name' },
            { key: 'phone', label: 'Phone' }
        ],
        CLASS: [
            { key: 'name', label: 'Class Name' },
            { key: 'studentCount', label: 'Students' },
            { key: 'teacherName', label: 'Form Teacher' }
        ]
    };

    if (!isOpen) return null;
    const availableFields = configs[type] || [];

    const getVal = (obj: any, path: string) => path.split('.').reduce((acc, part) => acc && acc[part], obj) || '';

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export & Print" icon="fa-solid fa-file-export">
            <div id="printable-list-container">
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #printable-list-container, #printable-list-container * { visibility: visible; }
                        #printable-list-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
                        .no-print { display: none !important; }
                    }
                `}</style>
                <div className="mb-4 no-print bg-navy-50 p-3 rounded">
                    <p className="text-xs font-bold text-navy-900 mb-2">Select Columns:</p>
                    <div className="flex flex-wrap gap-2">
                        {availableFields.map(f => (
                            <label key={f.key} className="flex items-center gap-1 text-xs cursor-pointer bg-white px-2 py-1 rounded border">
                                <input type="checkbox" checked={selectedFields.includes(f.key) || selectedFields.length === 0} onChange={() => {
                                    if(selectedFields.includes(f.key)) setSelectedFields(selectedFields.filter(k => k !== f.key));
                                    else setSelectedFields([...selectedFields, f.key]);
                                }} />
                                {f.label}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-navy-900 text-white p-3 text-center print:bg-white print:text-black print:border-b">
                        <h2 className="text-lg font-bold uppercase">{title}</h2>
                        <p className="text-xs">{new Date().toLocaleDateString()}</p>
                    </div>
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="p-2 border">#</th>
                                {(selectedFields.length > 0 ? availableFields.filter(f => selectedFields.includes(f.key)) : availableFields).map(f => (
                                    <th key={f.key} className="p-2 border">{f.label}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr key={idx} className="even:bg-gray-50">
                                    <td className="p-2 border">{idx + 1}</td>
                                    {(selectedFields.length > 0 ? availableFields.filter(f => selectedFields.includes(f.key)) : availableFields).map(f => (
                                        <td key={f.key} className="p-2 border">{getVal(item, f.key)}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t no-print">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={() => window.print()}><i className="fa-solid fa-print mr-2"></i> Print</Button>
                </div>
            </div>
        </Modal>
    );
};
