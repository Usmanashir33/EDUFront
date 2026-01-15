
import React, { useState, useEffect } from 'react';
import { SchoolSection, ClassRoom, Subject, Student, Teacher, ActivityLog, SubjectAssignment } from '../types';
import { Button, Input, Modal, MultiSelectGrid, PinModal, Toast, MultiSelectDropdown } from '../components/UI';

interface AcademicManagerProps {
    sections: SchoolSection[];
    classRooms: ClassRoom[];
    subjects: Subject[];
    students: Student[];
    teachers: Teacher[];
    onUpdateSections: (sections: SchoolSection[]) => void;
    onUpdateClassRooms: (classes: ClassRoom[]) => void;
    onUpdateSubjects: (subjects: Subject[]) => void;
    onUpdateStudents: (students: Student[]) => void;
    onLogActivity: (action: ActivityLog['action'], module: ActivityLog['module'], description: string) => void;
    onNavigateToStudent?: (studentId: string) => void;
}

type Tab = 'SECTIONS' | 'CLASSROOMS' | 'SUBJECTS';
type ViewMode = 'LIST' | 'DETAIL';

// --- UTILS ---
const downloadFile = (content: string, mimeType: string, filename: string) => {
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

const generateCSV = (data: any[], fields: { key: string, label: string }[]) => {
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

const generateHTMLReport = (data: any[], title: string, fields: { key: string, label: string }[]) => {
    const date = new Date().toLocaleDateString();
    const rows = data.map((item, idx) => `
        <tr>
            <td>${idx + 1}</td>
            ${fields.map(f => {
                const val = f.key.split('.').reduce((acc, part) => acc && acc[part], item) || '';
                return `<td>${val}</td>`;
            }).join('')}
        </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #102a43; padding-bottom: 20px; }
        .header h1 { margin: 0; color: #102a43; font-size: 24px; text-transform: uppercase; }
        .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th { background-color: #f0f4f8; text-align: left; padding: 10px; border-bottom: 2px solid #ddd; font-weight: bold; color: #102a43; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; }
        tr:nth-child(even) { background-color: #fafafa; }
        .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #999; border-top: 1px solid #eee; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>${title}</h1>
        <p>Generated on ${date} • EduPortal School Management System</p>
    </div>
    <table>
        <thead>
            <tr>
                <th style="width: 50px;">#</th>
                ${fields.map(f => `<th>${f.label}</th>`).join('')}
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    <div class="footer">
        Confidential Document. For internal use only.
    </div>
</body>
</html>
    `;
};

// --- MOCK TIMETABLE GENERATOR & LOGIC ---
const generateMockTimetable = (className: string) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    // Time slots in 24h format for logic
    const periods = [
        { time: '08:00 - 08:45', start: 8 * 60, end: 8 * 60 + 45 },
        { time: '08:45 - 09:30', start: 8 * 60 + 45, end: 9 * 60 + 30 },
        { time: '09:30 - 10:15', start: 9 * 60 + 30, end: 10 * 60 + 15 },
        { time: '10:45 - 11:30', start: 10 * 60 + 45, end: 11 * 60 + 30 }, // Break before this
        { time: '11:30 - 12:15', start: 11 * 60 + 30, end: 12 * 60 + 15 }
    ];
    const subjectsList = ['Math', 'English', 'Physics', 'Chemistry', 'Biology', 'Civic', 'Geography', 'Economics'];
    
    // Deterministic generation based on class name char code
    const seed = className.charCodeAt(0) || 0;

    return days.map((day, dIdx) => ({
        day,
        periods: periods.map((p, pIdx) => {
            const subjIndex = (seed + dIdx + pIdx) % subjectsList.length;
            // Introduce some free periods
            const isFree = (seed + dIdx + pIdx) % 7 === 0;
            return {
                ...p,
                subject: isFree ? 'Free Period' : subjectsList[subjIndex]
            };
        })
    }));
};

const getSubjectSchedule = (subjectName: string, timetable: any[]) => {
    const times: string[] = [];
    timetable.forEach(day => {
        day.periods.forEach((p: any) => {
            // Simple match
            if (p.subject !== 'Free Period' && (p.subject.includes(subjectName) || subjectName.includes(p.subject))) {
                const start = p.time.split('-')[0].trim();
                times.push(`${day.day.substring(0,3)} ${start}`);
            }
        });
    });
    return times.join(', ');
};

const getCurrentPeriodInfo = (timetable: any[], subjects: Subject[], teachers: Teacher[], currentTime: Date) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = days[currentTime.getDay()];
    
    // Find today's schedule
    const todaySchedule = timetable.find(d => d.day === currentDayName);
    
    if (!todaySchedule) {
        return { subject: 'Weekend', time: '--:--', teacher: '', status: 'Free' };
    }

    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Find active period
    const activePeriod = todaySchedule.periods.find((p: any) => currentMinutes >= p.start && currentMinutes < p.end);

    if (!activePeriod) {
        // Check if it's break time or after hours
        if (currentMinutes > todaySchedule.periods[0].start && currentMinutes < todaySchedule.periods[todaySchedule.periods.length - 1].end) {
             return { subject: 'Break / Transition', time: '--:--', teacher: '', status: 'Break' };
        }
        return { subject: 'Closed', time: '--:--', teacher: '', status: 'Closed' };
    }

    let teacherName = 'No Teacher';
    let subjectName = activePeriod.subject;

    if (subjectName !== 'Free Period') {
        // Try to find the actual subject object to get the teacher
        const sub = subjects.find(s => s.name.toLowerCase().includes(subjectName.toLowerCase()) || subjectName.toLowerCase().includes(s.name.toLowerCase()));
        if (sub) {
            subjectName = sub.name; // Use official name
            if (sub.teacherIds.length > 0) {
                const t = teachers.find(tr => tr.id === sub.teacherIds[0]);
                if (t) teacherName = `${t.title} ${t.lastName}`;
            }
        }
    }

    return {
        subject: subjectName,
        time: activePeriod.time,
        teacher: teacherName,
        status: subjectName === 'Free Period' ? 'Free' : 'Ongoing'
    };
};

// --- SUB-COMPONENTS ---

const TimetableModal = ({ isOpen, onClose, target, currentSession, currentTerm }: any) => {
    const [downloadFormat, setDownloadFormat] = useState<'PDF' | 'IMAGE' | ''>('');
    const [isDownloading, setIsDownloading] = useState(false);

    if (!target || !isOpen) return null;
    const schedule = generateMockTimetable(target.name);

    const handleDownload = () => {
        if (!downloadFormat) return;
        setIsDownloading(true);
        // Simulate download delay
        setTimeout(() => {
            setIsDownloading(false);
            if (downloadFormat === 'PDF') {
                // Since we can't generate binary PDF easily without libs, trigger print to PDF
                window.print();
            } else {
                alert(`Image download simulated. (Requires html2canvas in production)`);
            }
            setDownloadFormat('');
        }, 1000);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${target.name} Timetable`} icon="fa-solid fa-calendar-days">
            {/* Print Styles */}
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

            {/* Export Controls */}
            <div className="bg-gray-50 p-4 border-t border-gray-200 mt-4 rounded-b-lg no-print">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-bold text-navy-900">Download As:</label>
                        <select 
                            className="text-xs border border-gray-300 rounded p-2"
                            value={downloadFormat}
                            onChange={(e) => setDownloadFormat(e.target.value as 'PDF' | 'IMAGE')}
                        >
                            <option value="">Select Format</option>
                            <option value="PDF">PDF (Print)</option>
                            <option value="IMAGE">Image (PNG)</option>
                        </select>
                        <Button 
                            className="w-auto px-4 py-1.5 text-xs" 
                            disabled={!downloadFormat || isDownloading}
                            onClick={handleDownload}
                        >
                            {isDownloading ? 'Processing...' : <><i className="fa-solid fa-download mr-1"></i> Download</>}
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose} className="w-auto">Close</Button>
                        <Button onClick={() => window.print()} className="w-auto bg-navy-700"><i className="fa-solid fa-print mr-2"></i> Print</Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const UnifiedExportModal = ({ isOpen, onClose, data, type, title }: { isOpen: boolean, onClose: () => void, data: any[], type: 'STUDENT' | 'TEACHER' | 'CLASS', title: string }) => {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [exportFormat, setExportFormat] = useState<'HTML' | 'EXCEL' | 'JSON'>('HTML');
    const [isExporting, setIsExporting] = useState(false);

    const studentFields = [
        { key: 'admissionNumber', label: 'Admission No.' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'gender', label: 'Gender' },
        { key: 'guardian.fullName', label: 'Guardian Name' },
        { key: 'guardian.phone', label: 'Guardian Phone' }
    ];

    const teacherFields = [
        { key: 'staffId', label: 'Staff ID' },
        { key: 'title', label: 'Title' },
        { key: 'firstName', label: 'First Name' },
        { key: 'lastName', label: 'Last Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' }
    ];

    const classFields = [
        { key: 'name', label: 'Class Name' },
        { key: 'studentCount', label: 'Student Count' },
        { key: 'teacherName', label: 'Form Teacher' }
    ];

    useEffect(() => {
        if(isOpen) {
            if (type === 'STUDENT') setSelectedFields(studentFields.map(f => f.key));
            else if (type === 'TEACHER') setSelectedFields(teacherFields.map(f => f.key));
            else setSelectedFields(classFields.map(f => f.key));
            setExportFormat('HTML');
            setIsExporting(false);
        }
    }, [isOpen, type]);

    if (!isOpen) return null;

    const availableFields = type === 'STUDENT' ? studentFields : type === 'TEACHER' ? teacherFields : classFields;

    const getVal = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj) || '';
    };

    const handleExport = () => {
        setIsExporting(true);
        const fieldsToExport = availableFields.filter(f => selectedFields.includes(f.key));
        const filename = title.replace(/\s+/g, '_');

        setTimeout(() => {
            if (exportFormat === 'EXCEL') {
                const csvContent = generateCSV(data, fieldsToExport);
                downloadFile(csvContent, 'text/csv;charset=utf-8;', `${filename}.csv`);
            } else if (exportFormat === 'HTML') {
                const htmlContent = generateHTMLReport(data, title, fieldsToExport);
                downloadFile(htmlContent, 'text/html;charset=utf-8;', `${filename}.html`);
            } else if (exportFormat === 'JSON') {
                const jsonContent = JSON.stringify(data, null, 2);
                downloadFile(jsonContent, 'application/json', `${filename}.json`);
            }
            setIsExporting(false);
            onClose();
        }, 800);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Export & Print Options" icon="fa-solid fa-file-export">
            <div id="printable-list-container">
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        #printable-list-container, #printable-list-container * { visibility: visible; }
                        #printable-list-container { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
                        .no-print { display: none !important; }
                    }
                `}</style>

                {/* Configuration Section (No Print) */}
                <div className="mb-6 bg-navy-50 p-4 rounded-lg border border-navy-100 no-print">
                    <h4 className="text-sm font-bold text-navy-900 mb-3">1. Select Columns to Include</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                        {availableFields.map(f => (
                            <label key={f.key} className="flex items-center space-x-2 cursor-pointer p-2 bg-white rounded border border-gray-200 hover:border-navy-300">
                                <input 
                                    type="checkbox" 
                                    checked={selectedFields.includes(f.key)}
                                    onChange={() => {
                                        if (selectedFields.includes(f.key)) setSelectedFields(selectedFields.filter(k => k !== f.key));
                                        else setSelectedFields([...selectedFields, f.key]);
                                    }}
                                    className="rounded text-navy-900 focus:ring-navy-900" 
                                /> 
                                <span className="text-xs font-bold text-navy-700">{f.label}</span>
                            </label>
                        ))}
                    </div>

                    <h4 className="text-sm font-bold text-navy-900 mb-3">2. Select Download Format</h4>
                    <div className="flex gap-4">
                        {[
                            { id: 'HTML', label: 'HTML Report', icon: 'fa-file-code', color: 'text-orange-600', border: 'peer-checked:border-orange-600 peer-checked:bg-orange-50' },
                            { id: 'EXCEL', label: 'Excel (CSV)', icon: 'fa-file-excel', color: 'text-green-600', border: 'peer-checked:border-green-600 peer-checked:bg-green-50' },
                            { id: 'JSON', label: 'JSON Data', icon: 'fa-file-code', color: 'text-gray-600', border: 'peer-checked:border-gray-600 peer-checked:bg-gray-50' }
                        ].map(fmt => (
                            <label key={fmt.id} className="cursor-pointer relative">
                                <input 
                                    type="radio" 
                                    name="format" 
                                    className="peer sr-only" 
                                    checked={exportFormat === fmt.id} 
                                    onChange={() => setExportFormat(fmt.id as any)}
                                />
                                <div className={`p-3 rounded-lg border border-gray-200 bg-white hover:shadow-md transition-all flex flex-col items-center gap-2 w-24 ${fmt.border}`}>
                                    <i className={`fa-solid ${fmt.icon} text-2xl ${fmt.color}`}></i>
                                    <span className="text-[10px] font-bold text-gray-600">{fmt.label}</span>
                                </div>
                                <div className="absolute top-1 right-1 opacity-0 peer-checked:opacity-100">
                                    <i className="fa-solid fa-circle-check text-navy-900 bg-white rounded-full"></i>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Preview Table (Printable) */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-navy-900 text-white p-3 text-center print:bg-white print:text-black print:border-b-2 print:border-black">
                        <h2 className="text-lg font-bold uppercase">{title}</h2>
                        <p className="text-xs opacity-80 print:opacity-100">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="overflow-x-auto max-h-60 overflow-y-auto print:max-h-none print:overflow-visible">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-gray-50 print:bg-gray-100">
                                <tr>
                                    <th className="p-2 border border-gray-300 font-bold w-10 text-center">#</th>
                                    {selectedFields.map(key => (
                                        <th key={key} className="p-2 border border-gray-300 font-bold">
                                            {availableFields.find(f => f.key === key)?.label}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((item, idx) => (
                                    <tr key={idx} className="even:bg-gray-50 print:even:bg-gray-100">
                                        <td className="p-2 border border-gray-300 text-center font-bold">{idx + 1}</td>
                                        {selectedFields.map(key => (
                                            <td key={key} className="p-2 border border-gray-300">
                                                {getVal(item, key)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Action Footer (No Print) */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 no-print">
                    <Button variant="outline" onClick={onClose} disabled={isExporting}>Cancel</Button>
                    <Button variant="secondary" onClick={() => window.print()} disabled={isExporting}>
                        <i className="fa-solid fa-print mr-2"></i> Print List
                    </Button>
                    <Button onClick={handleExport} isLoading={isExporting}>
                        <i className="fa-solid fa-download mr-2"></i> Download {exportFormat}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

// --- SECTION DETAIL ---
const SectionDetail = ({ id, sections, classRooms, students, teachers, subjects, onSetTimetableTarget, onShowTimetable, onSelectItem, onEditSection, onShowReportModal }: any) => {
    const section = sections.find((s: SchoolSection) => s.id === id);
    if (!section) return null;
    const linkedClasses = classRooms.filter((c: ClassRoom) => c.sectionId === id);
    const totalStudents = students.filter((s: Student) => linkedClasses.some((c: ClassRoom) => s.classRoomIds.includes(c.id))).length;
    
    const sectionTeachers = teachers.filter((t: Teacher) => {
        if (linkedClasses.some((c: ClassRoom) => c.classTeacherId === t.id)) return true;
        return subjects.some((sub: Subject) => 
            sub.teacherIds.includes(t.id) && 
            sub.classRoomIds.some((cid: string) => linkedClasses.some((lc: ClassRoom) => lc.id === cid))
        );
    });

    const linkedClassesForReport = linkedClasses.map((c: ClassRoom) => ({
        ...c,
        studentCount: students.filter((s: Student) => s.classRoomIds.includes(c.id)).length,
        teacherName: teachers.find((t: Teacher) => t.id === c.classTeacherId)?.lastName || 'Unassigned'
    }));

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* ... Header ... */}
            <div className="bg-gradient-to-r from-navy-900 to-navy-700 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-layer-group text-9xl"></i></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start">
                    <div>
                         <h2 className="text-4xl font-bold mb-1">{section.name}</h2>
                         <p className="text-navy-200 text-sm font-mono tracking-widest uppercase">Section ID: {section.id.toUpperCase()}</p>
                         <div className="flex gap-6 mt-6">
                             <div><p className="text-2xl font-bold">{linkedClasses.length}</p><p className="text-xs uppercase text-gold-500 font-bold">Classes</p></div>
                             <div><p className="text-2xl font-bold">{totalStudents}</p><p className="text-xs uppercase text-gold-500 font-bold">Students</p></div>
                             <div><p className="text-2xl font-bold">{sectionTeachers.length}</p><p className="text-xs uppercase text-gold-500 font-bold">Teachers</p></div>
                         </div>
                    </div>
                    <div className="mt-6 md:mt-0 flex flex-col gap-2">
                        <Button variant="outline" className="w-auto px-4 bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => onEditSection(section)}><i className="fa-solid fa-pen-to-square mr-2"></i> Edit Section</Button>
                        <Button variant="outline" className="w-auto px-4 bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => { onSetTimetableTarget({name: section.name, type: 'SECTION'}); onShowTimetable(true); }}><i className="fa-solid fa-calendar-days mr-2"></i> View Timetable</Button>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-navy-900">Classes ({linkedClasses.length})</h3>
                        <button onClick={() => onShowReportModal(linkedClassesForReport, 'CLASS', `${section.name} Classes`)} className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-3 py-1 rounded"><i className="fa-solid fa-file-export mr-1"></i> Print/Export</button>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        {linkedClasses.map((cls: ClassRoom) => {
                            const sCount = students.filter((s: Student) => s.classRoomIds.includes(cls.id)).length;
                            const tName = teachers.find((t: Teacher) => t.id === cls.classTeacherId)?.lastName;
                            return (
                                <div key={cls.id} onClick={() => onSelectItem(cls.id, 'CLASSROOMS')} className="p-4 border border-gray-200 rounded-lg hover:shadow-md cursor-pointer group bg-gray-50 hover:bg-white transition-all">
                                     <div className="flex justify-between items-center"><h4 className="font-bold text-navy-900 group-hover:text-gold-600">{cls.name}</h4><i className="fa-solid fa-chevron-right text-gray-300 text-xs"></i></div>
                                     <div className="flex justify-between mt-2 text-xs text-gray-500"><span><i className="fa-solid fa-users mr-1"></i> {sCount} Students</span><span><i className="fa-solid fa-chalkboard-user mr-1"></i> {tName ? `Tr. ${tName}` : 'No Master'}</span></div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                {/* Teachers List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-navy-900">Teachers ({sectionTeachers.length})</h3>
                        <button onClick={() => onShowReportModal(sectionTeachers, 'TEACHER', `${section.name} Teachers`)} className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-3 py-1 rounded"><i className="fa-solid fa-file-export mr-1"></i> Print/Export</button>
                    </div>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {sectionTeachers.map((t: Teacher) => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-navy-50 group transition-colors">
                                <div className="flex items-center gap-3"><div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-navy-700">{t.firstName[0]}{t.lastName[0]}</div><div><p className="text-sm font-bold text-navy-900">{t.title} {t.firstName} {t.lastName}</p><p className="text-xs text-gray-500">{t.email}</p></div></div>
                                <span className="text-[10px] bg-navy-100 text-navy-700 px-2 py-1 rounded">{t.staffId}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- CLASS DETAIL ---
const ClassDetail = ({ id, classRooms, students, subjects, teachers, currentSession: propSession, currentTerm, currentTime, onSetTimetableTarget, onShowTimetable, onShowReportModal, onShowAddStudent, onCopyToClipboard, onInitiateSubstitute, onManageMaster, onSubjectClick, onTransferStudents, onAddSubject, onNavigateToStudent }: any) => {
    const cls = classRooms.find((c: ClassRoom) => c.id === id);
    const [selectedSession, setSelectedSession] = useState(propSession);

    if (!cls) return null;
    const classStudents = students.filter((s: Student) => s.classRoomIds.includes(id));
    const classSubjects = subjects.filter((s: Subject) => s.classRoomIds.includes(id));
    
    // Get Teachers teaching in this class
    const classTeachers = teachers.filter((t: Teacher) => {
        if (t.id === cls.classTeacherId) return true;
        return classSubjects.some((sub: Subject) => {
            if (sub.assignments) return sub.assignments.some((a: SubjectAssignment) => a.classId === cls.id && a.teacherId === t.id);
            return sub.teacherIds.includes(t.id);
        });
    });

    const classMaster = teachers.find((t: Teacher) => t.id === cls.classTeacherId);
    const schedule = generateMockTimetable(cls.name);
    const currentPeriod = getCurrentPeriodInfo(schedule, subjects, teachers, currentTime);

    const getSubjectTeacher = (sub: Subject) => {
         const assignment = sub.assignments?.find((a: SubjectAssignment) => a.classId === cls.id);
         if (assignment) return teachers.find((t: Teacher) => t.id === assignment.teacherId);
         const tId = sub.teacherIds[0]; 
         return teachers.find((t: Teacher) => t.id === tId);
    };
    
    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white p-8 rounded-xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-clock text-9xl"></i></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start">
                    <div>
                         <div className="flex items-center gap-3 mb-2">
                             <select value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)} className="bg-gold-500 text-navy-900 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider border-none focus:ring-0 cursor-pointer"><option>2023/2024</option><option>2024/2025</option></select>
                             <span className="bg-navy-700 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">{currentTerm}</span>
                         </div>
                         <h2 className="text-4xl font-bold mb-1">{cls.name}</h2>
                         <p className="text-navy-200 text-lg">{classStudents.length} Scholars Enrolled</p>
                         <div className="mt-4 flex items-center gap-2 cursor-pointer hover:bg-white/10 p-2 rounded w-fit transition-colors" onClick={() => onManageMaster(cls)}>
                             <div className="w-8 h-8 rounded-full bg-white text-navy-900 flex items-center justify-center font-bold">{classMaster ? `${classMaster.firstName[0]}${classMaster.lastName[0]}` : <i className="fa-solid fa-plus"></i>}</div>
                             <div><p className="text-xs uppercase font-bold text-navy-300">Form Teacher</p><p className="text-sm font-bold">{classMaster ? `${classMaster.title} ${classMaster.firstName} ${classMaster.lastName}` : 'Assign Master'}</p></div>
                         </div>
                    </div>
                    <div className="text-right mt-6 md:mt-0">
                         <div className="bg-white/10 p-4 rounded-lg backdrop-blur-sm border border-white/10 w-64">
                             <p className="text-xs text-gold-400 font-bold uppercase mb-1">Current Period</p>
                             <div className="text-xl font-bold text-white leading-tight">{currentPeriod.subject}</div>
                             <div className="flex items-center justify-end gap-2 mt-1"><span className="text-xs font-medium text-white/80">{currentPeriod.teacher}</span></div>
                             <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-end"><span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${currentPeriod.status === 'Ongoing' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-gray-300'}`}>{currentPeriod.status}</span><div className="text-right"><p className="text-xs text-navy-200">{currentPeriod.time}</p><p className="text-xs font-mono opacity-75">{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p></div></div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 overflow-x-auto pb-2">
                <Button variant="secondary" className="w-auto whitespace-nowrap px-4" onClick={() => { onSetTimetableTarget({name: cls.name, type: 'CLASS'}); onShowTimetable(true); }}><i className="fa-solid fa-calendar-days mr-2"></i> Class Timetable</Button>
                <Button className="w-auto whitespace-nowrap px-4" onClick={() => onShowAddStudent(true)}><i className="fa-solid fa-user-plus mr-2"></i> Add Students</Button>
                <Button className="w-auto whitespace-nowrap px-4" onClick={() => onAddSubject()}><i className="fa-solid fa-book-medical mr-2"></i> Add Subject</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Students */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-navy-900">Students ({classStudents.length})</h3>
                        <div className="flex gap-2">
                            <button onClick={() => onTransferStudents(cls.id)} className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center" title="Transfer"><i className="fa-solid fa-arrow-right-arrow-left mr-1"></i> Transfer</button>
                            <button onClick={() => onShowReportModal(classStudents, 'STUDENT', `${cls.name} Student List`)} className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-2 py-1 rounded"><i className="fa-solid fa-file-export mr-1"></i> Print/Export</button>
                        </div>
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                        {classStudents.map((s: Student) => (
                            <div 
                                key={s.id} 
                                className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-navy-50 group transition-colors cursor-pointer"
                                onClick={() => onNavigateToStudent && onNavigateToStudent(s.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-navy-700">{s.firstName[0]}{s.lastName[0]}</div>
                                    <div><p className="text-sm font-bold text-navy-900">{s.firstName} {s.lastName}</p><p className="text-xs text-gray-500 font-mono" onClick={(e) => { e.stopPropagation(); onCopyToClipboard(s.admissionNumber); }}>{s.admissionNumber}</p></div>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-1 rounded ${s.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{s.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Teachers */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                        <h3 className="font-bold text-lg text-navy-900">Teachers ({classTeachers.length})</h3>
                        <button onClick={() => onShowReportModal(classTeachers, 'TEACHER', `${cls.name} Teachers List`)} className="text-xs font-bold text-navy-600 hover:text-gold-600 flex items-center bg-navy-50 px-2 py-1 rounded"><i className="fa-solid fa-file-export mr-1"></i> Print/Export</button>
                    </div>
                    <div className="space-y-1 max-h-80 overflow-y-auto custom-scrollbar">
                        {classTeachers.map((t: Teacher) => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-navy-50 group transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-navy-100 border border-navy-200 rounded-full flex items-center justify-center text-xs font-bold text-navy-700">{t.firstName[0]}{t.lastName[0]}</div>
                                    <div><p className="text-sm font-bold text-navy-900">{t.title} {t.firstName} {t.lastName}</p><p className="text-xs text-gray-500">{t.staffId}</p></div>
                                </div>
                                {t.id === cls.classTeacherId && <span className="text-[10px] font-bold px-2 py-1 rounded bg-gold-100 text-gold-800">Master</span>}
                            </div>
                        ))}
                        {classTeachers.length === 0 && <p className="text-sm text-gray-500 italic p-2">No teachers assigned.</p>}
                    </div>
                </div>

                {/* Subjects */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-1">
                    <h3 className="font-bold text-lg text-navy-900 mb-4 border-b pb-2">Subjects ({classSubjects.length})</h3>
                    <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {classSubjects.map((sub: Subject) => {
                            const teacher = getSubjectTeacher(sub);
                            const scheduleStr = getSubjectSchedule(sub.name, schedule);
                            return (
                                <div key={sub.id} onClick={() => onSubjectClick(sub.id)} className="p-3 border border-gray-100 rounded hover:shadow-md transition-shadow bg-white cursor-pointer group">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-bold text-navy-900 group-hover:text-gold-600 transition-colors">{sub.name}</p>
                                            <p className="text-xs text-gray-500 font-mono">{sub.code}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); onInitiateSubstitute(sub, cls.id); }} className="text-[10px] bg-navy-50 text-navy-700 px-2 py-1 rounded hover:bg-navy-100 border border-navy-100 whitespace-nowrap">Substitute / Assign</button>
                                        </div>
                                    </div>
                                    {scheduleStr && (
                                        <div className="mt-1 flex items-center text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded w-fit">
                                            <i className="fa-regular fa-clock mr-1.5"></i> {scheduleStr}
                                        </div>
                                    )}
                                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                        <i className="fa-solid fa-chalkboard-user"></i>
                                        {teacher ? <span className="font-medium text-navy-800">{teacher.title} {teacher.lastName}</span> : <span className="text-orange-500 italic">No teacher assigned</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- SUBJECT DETAIL ---
const SubjectDetail = ({ id, subjects, classRooms, teachers, students, onEdit, onAssignClass, onAssignTeacher }: any) => {
    const subject = subjects.find((s: Subject) => s.id === id);
    if (!subject) return null;
    
    const takingClasses = classRooms.filter((c: ClassRoom) => subject.classRoomIds.includes(c.id));
    const assignedTeachers = teachers.filter((t: Teacher) => subject.teacherIds.includes(t.id));

    return (
        <div className="space-y-6 animate-fadeIn">
             <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white p-8 rounded-xl shadow-lg relative overflow-hidden flex justify-between items-center">
                 <div className="relative z-10">
                     <h2 className="text-3xl font-bold mb-1">{subject.name}</h2>
                     <p className="text-lg text-navy-200 font-mono">{subject.code}</p>
                     <div className="flex gap-4 mt-4">
                         <span className="bg-white/10 px-3 py-1 rounded text-sm font-bold border border-white/20">{takingClasses.length} Enrolled Classes</span>
                         <span className="bg-white/10 px-3 py-1 rounded text-sm font-bold border border-white/20">{assignedTeachers.length} Assigned Teachers</span>
                     </div>
                 </div>
                 <div className="relative z-10 flex gap-2"><Button variant="outline" className="w-auto px-4 bg-white/10 text-white border-white/20 hover:bg-white/20" onClick={() => onEdit(subject)}>Edit Subject</Button></div>
                 <div className="absolute top-0 right-0 p-4 opacity-10"><i className="fa-solid fa-book text-9xl"></i></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-navy-900 flex items-center"><i className="fa-solid fa-chalkboard mr-2"></i> Enrolled Classes</h3>
                        <Button className="w-auto px-3 py-1 text-xs" onClick={() => onAssignClass(subject)}>+ Manage</Button>
                    </div>
                    <div className="space-y-2">
                        {takingClasses.map((c: ClassRoom) => {
                            const assignment = subject.assignments?.find((a: SubjectAssignment) => a.classId === c.id);
                            const tName = assignment ? teachers.find((t: Teacher) => t.id === assignment.teacherId)?.lastName : null;
                            return (
                                <div key={c.id} className="p-3 bg-gray-50 rounded flex justify-between items-center">
                                    <div><span className="font-bold text-navy-700 block">{c.name}</span><span className="text-xs text-gray-500">{tName ? `Taught by: ${tName}` : 'No teacher assigned'}</span></div>
                                    <span className="text-xs text-gray-500">{students.filter((s: Student) => s.classRoomIds.includes(c.id)).length} Students</span>
                                </div>
                            );
                        })}
                        {takingClasses.length === 0 && <p className="text-gray-400 italic text-sm">No classes assigned.</p>}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-navy-900 flex items-center"><i className="fa-solid fa-chalkboard-user mr-2"></i> Teachers</h3>
                        <Button className="w-auto px-3 py-1 text-xs" onClick={() => onAssignTeacher(subject)}>+ Manage</Button>
                    </div>
                    <div className="space-y-2">
                        {assignedTeachers.map((t: Teacher) => (
                            <div key={t.id} className="p-3 bg-navy-50 rounded flex justify-between items-center border border-navy-100">
                                <div><span className="font-bold text-navy-800 block">{t.title} {t.firstName} {t.lastName}</span><span className="text-xs text-navy-500">{t.email}</span></div>
                                <i className="fa-solid fa-check text-green-500"></i>
                            </div>
                        ))}
                        {assignedTeachers.length === 0 && <p className="text-gray-400 italic text-sm">No teachers assigned.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const AcademicManager: React.FC<AcademicManagerProps> = ({
    sections, classRooms, subjects, students, teachers,
    onUpdateSections, onUpdateClassRooms, onUpdateSubjects, onUpdateStudents, onLogActivity, onNavigateToStudent
}) => {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState<Tab>('SECTIONS');
    const [viewMode, setViewMode] = useState<ViewMode>('LIST');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [currentSession] = useState('2023/2024');
    const [currentTerm] = useState('2nd Term');
    const [currentTime, setCurrentTime] = useState(new Date());

    const [showAddModal, setShowAddModal] = useState(false);
    
    // Add/Edit Forms
    const [sectionForm, setSectionForm] = useState({ name: '' });
    const [classForm, setClassForm] = useState({ name: '', sectionId: '' });
    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', classRoomIds: [] as string[] });
    
    // Edit Targets
    const [editSectionTarget, setEditSectionTarget] = useState<SchoolSection | null>(null);
    const [editClassTarget, setEditClassTarget] = useState<ClassRoom | null>(null);
    const [editClassForm, setEditClassForm] = useState({ name: '', sectionId: '', classTeacherId: '' });
    const [editSubjectTarget, setEditSubjectTarget] = useState<Subject | null>(null);
    const [editSubjectForm, setEditSubjectForm] = useState({ name: '', code: '' });

    // Modals
    const [showTimetableModal, setShowTimetableModal] = useState(false);
    const [timetableTarget, setTimetableTarget] = useState<{name: string, type: 'CLASS' | 'SECTION'} | null>(null);
    const [generateTimetableTarget, setGenerateTimetableTarget] = useState<SchoolSection | null>(null);
    
    const [reportModalData, setReportModalData] = useState<{ isOpen: boolean, data: any[], type: 'STUDENT' | 'TEACHER' | 'CLASS', title: string }>({ isOpen: false, data: [], type: 'STUDENT', title: '' });
    
    const [showAddStudentModal, setShowAddStudentModal] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTargetClassId, setTransferTargetClassId] = useState('');

    // Teacher & Subject Assignment Modals
    const [showTeacherSelectModal, setShowTeacherSelectModal] = useState(false);
    const [teacherSearch, setTeacherSearch] = useState('');
    const [teacherSelectMode, setTeacherSelectMode] = useState<'SUBSTITUTE' | 'CLASS_MASTER' | 'ADD_TO_SUBJECT'>('SUBSTITUTE');
    const [currentContextData, setCurrentContextData] = useState<any>(null);

    const [showClassSelectModal, setShowClassSelectModal] = useState(false);
    const [selectedSubjectForClass, setSelectedSubjectForClass] = useState<Subject | null>(null);
    const [classSelectState, setClassSelectState] = useState<{classId: string, teacherId: string, isSelected: boolean}[]>([]);

    const [showAddSubjectToClassModal, setShowAddSubjectToClassModal] = useState(false);
    const [selectedSubjectToAdd, setSelectedSubjectToAdd] = useState<Subject | null>(null);
    const [selectedTeacherForSubject, setSelectedTeacherForSubject] = useState<string>('');

    const [showPinModal, setShowPinModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // --- EFFECTS ---
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (showClassSelectModal && selectedSubjectForClass) {
            const initial = classRooms.map(c => {
                const isSelected = selectedSubjectForClass.classRoomIds.includes(c.id);
                const assignment = selectedSubjectForClass.assignments?.find(a => a.classId === c.id);
                return {
                    classId: c.id,
                    teacherId: assignment ? assignment.teacherId : '',
                    isSelected: isSelected
                };
            });
            setClassSelectState(initial);
        }
    }, [showClassSelectModal, selectedSubjectForClass, classRooms]);

    // --- HANDLERS ---
    const resetForms = () => {
        setSectionForm({ name: '' });
        setClassForm({ name: '', sectionId: '' });
        setSubjectForm({ name: '', code: '', classRoomIds: [] });
    };

    const handleAddSection = () => {
        if (!sectionForm.name) return;
        onUpdateSections([...sections, { id: Date.now().toString(), name: sectionForm.name }]);
        onLogActivity('CREATE', 'ACADEMICS', `Created section: ${sectionForm.name}`);
        resetForms(); setShowAddModal(false);
    };

    const handleUpdateSectionName = () => {
        if (!editSectionTarget || !sectionForm.name) return;
        onUpdateSections(sections.map(s => s.id === editSectionTarget.id ? { ...s, name: sectionForm.name } : s));
        onLogActivity('UPDATE', 'ACADEMICS', `Renamed section to: ${sectionForm.name}`);
        setEditSectionTarget(null); resetForms(); setToast({ message: "Section renamed", type: 'success' });
    };

    const handleAddClass = () => {
        if (!classForm.name || !classForm.sectionId) return;
        onUpdateClassRooms([...classRooms, { id: Date.now().toString(), name: classForm.name, sectionId: classForm.sectionId }]);
        onLogActivity('CREATE', 'ACADEMICS', `Created class: ${classForm.name}`);
        resetForms(); setShowAddModal(false);
    };

    const handleUpdateClass = () => {
        if (!editClassTarget || !editClassForm.name) return;
        onUpdateClassRooms(classRooms.map(c => c.id === editClassTarget.id ? { ...c, name: editClassForm.name, sectionId: editClassForm.sectionId, classTeacherId: editClassForm.classTeacherId || undefined } : c));
        onLogActivity('UPDATE', 'ACADEMICS', `Updated class: ${editClassForm.name}`);
        setEditClassTarget(null); setToast({ message: "Class updated", type: 'success' });
    };

    const handleAddSubject = () => {
        if (!subjectForm.name || !subjectForm.code) return;
        onUpdateSubjects([...subjects, { id: Date.now().toString(), name: subjectForm.name, code: subjectForm.code, classRoomIds: subjectForm.classRoomIds, teacherIds: [] }]);
        onLogActivity('CREATE', 'ACADEMICS', `Created subject: ${subjectForm.name}`);
        resetForms(); setShowAddModal(false);
    };

    const handleUpdateSubject = () => {
        if (!editSubjectTarget || !editSubjectForm.name) return;
        onUpdateSubjects(subjects.map(s => s.id === editSubjectTarget.id ? { ...s, name: editSubjectForm.name, code: editSubjectForm.code } : s));
        onLogActivity('UPDATE', 'ACADEMICS', `Updated subject: ${editSubjectForm.name}`);
        setEditSubjectTarget(null); setToast({ message: "Subject updated", type: 'success' });
    };

    const handleAddStudentsToClass = () => {
        if (!selectedItemId || selectedStudentIds.length === 0) return;
        onUpdateStudents(students.map(s => selectedStudentIds.includes(s.id) && !s.classRoomIds.includes(selectedItemId) ? { ...s, classRoomIds: [...s.classRoomIds, selectedItemId] } : s));
        onLogActivity('UPDATE', 'ACADEMICS', `Enrolled students to class ${selectedItemId}`);
        setShowAddStudentModal(false); setSelectedStudentIds([]); setStudentSearch('');
    };

    const handleTransferStudents = () => {
        if (!selectedItemId || !transferTargetClassId || selectedStudentIds.length === 0) return;
        onUpdateStudents(students.map(s => selectedStudentIds.includes(s.id) ? { ...s, classRoomIds: [...s.classRoomIds.filter(id => id !== selectedItemId), transferTargetClassId] } : s));
        onLogActivity('UPDATE', 'ACADEMICS', `Transferred students`);
        setShowTransferModal(false); setTransferTargetClassId(''); setSelectedStudentIds([]); setToast({ message: "Transferred successfully", type: 'success' });
    };

    // New: Handle Substitute Subject (Swap subject and assign teacher)
    // This is essentially adding a new subject to the class (and maybe removing the old one if it was a true swap, but here we just manage assignment)
    const handleSubstituteSubject = () => {
        if (!selectedItemId || !selectedSubjectToAdd) return;
        
        // If we are "substituting", we might be removing the OLD subject from this class?
        // The prompt says "Select from list... make it a substitute".
        // If the user selected a DIFFERENT subject than the one they clicked 'Substitute' on, we should swap.
        // `currentContextData` holds the `subjectId` of the subject being substituted (from handleInitiateSubstitute).
        
        let updatedSubjects = [...subjects];
        const oldSubjectId = currentContextData?.subjectId;
        const newSubjectId = selectedSubjectToAdd.id;
        const classId = selectedItemId;

        // 1. If switching subjects, remove class from old subject
        if (oldSubjectId && oldSubjectId !== newSubjectId) {
             updatedSubjects = updatedSubjects.map(s => s.id === oldSubjectId ? { ...s, classRoomIds: s.classRoomIds.filter(id => id !== classId) } : s);
        }

        // 2. Add class to new subject (or update existing assignment)
        updatedSubjects = updatedSubjects.map(s => {
            if (s.id === newSubjectId) {
                const newClassIds = s.classRoomIds.includes(classId) ? s.classRoomIds : [...s.classRoomIds, classId];
                // Update assignment for this class
                const newAssignments = s.assignments ? [...s.assignments].filter(a => a.classId !== classId) : [];
                if (selectedTeacherForSubject) {
                    newAssignments.push({ classId, teacherId: selectedTeacherForSubject });
                }
                // Ensure teacher is in global list if assigned
                const newTeacherIds = selectedTeacherForSubject && !s.teacherIds.includes(selectedTeacherForSubject) ? [...s.teacherIds, selectedTeacherForSubject] : s.teacherIds;
                
                return { ...s, classRoomIds: newClassIds, teacherIds: newTeacherIds, assignments: newAssignments };
            }
            return s;
        });

        onUpdateSubjects(updatedSubjects);
        onLogActivity('UPDATE', 'ACADEMICS', `Updated subject assignment for class ${classId}`);
        setShowAddSubjectToClassModal(false);
        setSelectedSubjectToAdd(null);
        setSelectedTeacherForSubject('');
        setToast({ message: "Subject assignment updated successfully.", type: 'success' });
    };

    const confirmTeacherSelection = (teacherId: string) => {
        // Teacher Selection for General Management
        if (teacherSelectMode === 'ADD_TO_SUBJECT') {
             // Just adding to global list
             onUpdateSubjects(subjects.map(s => s.id === currentContextData.subjectId ? { ...s, teacherIds: [...(s.teacherIds || []), teacherId] } : s));
             setToast({message: "Teacher added to subject.", type: 'success'});
        } else if (teacherSelectMode === 'CLASS_MASTER') {
             onUpdateClassRooms(classRooms.map(c => c.id === currentContextData.classId ? { ...c, classTeacherId: teacherId } : c));
             setToast({message: "Class Master assigned.", type: 'success'});
        }
        setShowTeacherSelectModal(false);
        setCurrentContextData(null);
        setTeacherSearch('');
    };

    const handleManageSubjectTeachers = (ids: string[]) => {
        if (!currentContextData?.subjectId) return;
        onUpdateSubjects(subjects.map(s => s.id === currentContextData.subjectId ? { ...s, teacherIds: ids } : s));
        setShowTeacherSelectModal(false);
        setToast({message: "Teacher list updated.", type: 'success'});
    };

    const handleSaveClassAssignments = () => {
        if (!selectedSubjectForClass) return;
        const newClassIds = classSelectState.filter(s => s.isSelected).map(s => s.classId);
        const newAssignments = classSelectState.filter(s => s.isSelected && s.teacherId).map(s => ({ classId: s.classId, teacherId: s.teacherId }));
        
        onUpdateSubjects(subjects.map(s => s.id === selectedSubjectForClass.id ? { ...s, classRoomIds: newClassIds, assignments: newAssignments } : s));
        onLogActivity('UPDATE', 'ACADEMICS', `Updated enrolled classes/teachers for ${selectedSubjectForClass.name}`);
        setShowClassSelectModal(false); setSelectedSubjectForClass(null); setToast({ message: "Assignments saved.", type: 'success' });
    };

    const handlePinSuccess = () => {
        setShowPinModal(false);
    };

    // Filtered Lists
    const filteredSections = sections.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredClasses = classRooms.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredSubjects = subjects.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="animate-fadeIn space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            
            {/* Header */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 border-b border-gray-100 pb-4">
                    <div>
                         <h2 className="text-2xl font-bold text-navy-900">Academic Management</h2>
                         <p className="text-sm text-gray-500 flex items-center gap-3 mt-1"><span><i className="fa-solid fa-calendar mr-1"></i> {currentSession}</span><span><i className="fa-solid fa-flag mr-1"></i> {currentTerm}</span></p>
                    </div>
                </div>
                {viewMode === 'LIST' && (
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex p-1 bg-gray-100 rounded-lg w-full md:w-auto">
                            {[ { id: 'SECTIONS', label: 'Sections', count: sections.length }, { id: 'CLASSROOMS', label: 'Classes', count: classRooms.length }, { id: 'SUBJECTS', label: 'Subjects', count: subjects.length } ].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as Tab)} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold rounded-md transition-all ${activeTab === tab.id ? 'bg-navy-900 text-white shadow-md' : 'text-gray-500 hover:text-navy-700 hover:bg-gray-200'}`}>
                                    {tab.label} <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>{tab.count}</span>
                                </button>
                            ))}
                        </div>
                        <div className="relative w-full md:w-80">
                             <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                             <input type="text" placeholder={`Search ${activeTab.toLowerCase()}...`} className="w-full pl-9 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-navy-900 shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        </div>
                        <Button className="w-auto px-6 py-3" onClick={() => setShowAddModal(true)}><i className="fa-solid fa-plus mr-2"></i> Add New</Button>
                    </div>
                )}
            </div>

            {/* List View */}
            {viewMode === 'LIST' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
                    {activeTab === 'SECTIONS' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSections.map(sec => (
                                <div key={sec.id} onClick={() => { setSelectedItemId(sec.id); setViewMode('DETAIL'); }} className="p-5 border border-gray-200 rounded-lg bg-navy-50/30 hover:border-navy-200 transition-colors cursor-pointer group hover:shadow-md">
                                    <div className="flex items-center justify-between mb-2"><div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-navy-600 shadow-sm"><i className="fa-solid fa-layer-group"></i></div><span className="text-xs font-bold bg-navy-100 text-navy-700 px-2 py-1 rounded">ID: {sec.id.slice(-4)}</span></div>
                                    <h4 className="font-bold text-lg text-navy-900 group-hover:text-gold-600 transition-colors">{sec.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">{classRooms.filter(c => c.sectionId === sec.id).length} Linked Classes</p>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'CLASSROOMS' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {filteredClasses.map(cls => (
                                <div key={cls.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all group bg-white relative" onClick={() => { setSelectedItemId(cls.id); setViewMode('DETAIL'); }}>
                                    <h4 className="font-bold text-navy-900 text-lg group-hover:text-gold-600 transition-colors mb-2 cursor-pointer">{cls.name}</h4>
                                    <div className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2 cursor-pointer"><span>{students.filter(s => s.classRoomIds.includes(cls.id)).length} Students</span><span>{subjects.filter(s => s.classRoomIds.includes(cls.id)).length} Subjects</span></div>
                                    <button className="absolute top-2 right-2 text-gray-400 hover:text-navy-900 p-1" onClick={(e) => { e.stopPropagation(); setEditClassTarget(cls); setEditClassForm({ name: cls.name, sectionId: cls.sectionId, classTeacherId: cls.classTeacherId || '' }); }}><i className="fa-solid fa-pen-to-square"></i></button>
                                </div>
                            ))}
                        </div>
                    )}
                    {activeTab === 'SUBJECTS' && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Code</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Subject Name</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Assigned Teachers</th><th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Classes</th></tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">{filteredSubjects.map(sub => (<tr key={sub.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedItemId(sub.id); setViewMode('DETAIL'); }}><td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{sub.code}</td><td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-navy-900">{sub.name}</td><td className="px-6 py-4 text-sm text-gray-600">{sub.teacherIds.length > 0 ? (<div className="flex flex-wrap gap-1">{sub.teacherIds.map(tid => { const t = teachers.find(tea => tea.id === tid); return t ? <span key={tid} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs border border-green-100">{t.firstName} {t.lastName}</span> : null })}</div>) : <span className="text-gray-400 italic text-xs">Unassigned</span>}</td><td className="px-6 py-4 text-sm text-gray-600">{sub.classRoomIds.length} Classes</td></tr>))}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Detail Views */}
            {viewMode === 'DETAIL' && selectedItemId && (
                <>
                    <button onClick={() => { setViewMode('LIST'); setSelectedItemId(null); }} className="mb-4 text-sm text-gray-500 hover:text-navy-900 flex items-center"><i className="fa-solid fa-arrow-left mr-2"></i> Back to {activeTab.toLowerCase()}</button>
                    {activeTab === 'SECTIONS' && <SectionDetail id={selectedItemId} sections={sections} classRooms={classRooms} students={students} teachers={teachers} subjects={subjects} onSetTimetableTarget={setTimetableTarget} onShowTimetable={setShowTimetableModal} onSelectItem={(id: string, tab: Tab) => { setSelectedItemId(id); setActiveTab(tab); }} onEditSection={(section: SchoolSection) => { setEditSectionTarget(section); setSectionForm({ name: section.name }); }} onGenerateTimetable={(section: SchoolSection) => setGenerateTimetableTarget(section)} onShowReportModal={(data: any[], type: 'CLASS' | 'TEACHER', title: string) => setReportModalData({ isOpen: true, data, type, title })} />}
                    {activeTab === 'CLASSROOMS' && <ClassDetail id={selectedItemId} classRooms={classRooms} students={students} subjects={subjects} teachers={teachers} currentSession={currentSession} currentTerm={currentTerm} currentTime={currentTime} onSetTimetableTarget={setTimetableTarget} onShowTimetable={setShowTimetableModal} onShowReportModal={(data: any[], type: 'STUDENT' | 'TEACHER', title: string) => setReportModalData({ isOpen: true, data, type, title })} onShowAddStudent={setShowAddStudentModal} onAddSubject={() => { setCurrentContextData(null); setShowAddSubjectToClassModal(true); }} onCopyToClipboard={(t: string) => { navigator.clipboard.writeText(t); setToast({ message: 'Copied', type: 'success'}); }} onInitiateSubstitute={(sub: Subject, classId: string) => { setCurrentContextData({ subjectId: sub.id, classId }); setSelectedSubjectToAdd(sub); setShowAddSubjectToClassModal(true); }} onManageMaster={(cls: ClassRoom) => { setTeacherSelectMode('CLASS_MASTER'); setCurrentContextData({ classId: cls.id }); setShowTeacherSelectModal(true); }} onSubjectClick={(id: string) => { setActiveTab('SUBJECTS'); setSelectedItemId(id); }} onTransferStudents={(classId: string) => { setSelectedStudentIds([]); setShowTransferModal(true); }} onNavigateToStudent={onNavigateToStudent} />}
                    {activeTab === 'SUBJECTS' && <SubjectDetail id={selectedItemId} subjects={subjects} classRooms={classRooms} teachers={teachers} students={students} onEdit={(s: Subject) => { setEditSubjectTarget(s); setEditSubjectForm({ name: s.name, code: s.code }); }} onAssignClass={(sub: Subject) => { setSelectedSubjectForClass(sub); setShowClassSelectModal(true); }} onAssignTeacher={(sub: Subject) => { setTeacherSelectMode('ADD_TO_SUBJECT'); setCurrentContextData({ subjectId: sub.id, selectedIds: sub.teacherIds }); setShowTeacherSelectModal(true); }} />}
                </>
            )}

            {/* --- MODALS --- */}
            
            {/* Add New Modal */}
            <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title={`Add New ${activeTab.slice(0, -1).toLowerCase()}`} icon="fa-solid fa-plus">
                {activeTab === 'SECTIONS' && (<div className="space-y-4"><Input label="Section Name" value={sectionForm.name} onChange={e => setSectionForm({name: e.target.value})} iconClass="fa-solid fa-layer-group" /><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setShowAddModal(false)} className="w-auto">Cancel</Button><Button onClick={handleAddSection} className="w-auto">Add</Button></div></div>)}
                {activeTab === 'CLASSROOMS' && (<div className="space-y-4"><Input label="Class Name" value={classForm.name} onChange={e => setClassForm({...classForm, name: e.target.value})} iconClass="fa-solid fa-chalkboard" /><div><label className="block text-sm font-semibold text-navy-800 mb-1.5">Section</label><select className="w-full p-3 border border-gray-300 rounded-md" value={classForm.sectionId} onChange={e => setClassForm({...classForm, sectionId: e.target.value})}><option value="">Select Section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setShowAddModal(false)} className="w-auto">Cancel</Button><Button onClick={handleAddClass} className="w-auto">Add</Button></div></div>)}
                {activeTab === 'SUBJECTS' && (<div className="space-y-6"><div className="grid grid-cols-2 gap-4"><Input label="Name" value={subjectForm.name} onChange={e => setSubjectForm({...subjectForm, name: e.target.value})} iconClass="fa-solid fa-book" /><Input label="Code" value={subjectForm.code} onChange={e => setSubjectForm({...subjectForm, code: e.target.value})} iconClass="fa-solid fa-barcode" /></div><MultiSelectGrid label="Classes" items={classRooms} selectedIds={subjectForm.classRoomIds} onChange={(ids) => setSubjectForm({...subjectForm, classRoomIds: ids})} /><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setShowAddModal(false)} className="w-auto">Cancel</Button><Button onClick={handleAddSubject} className="w-auto">Add</Button></div></div>)}
            </Modal>

            {/* Edit Modals */}
            {editSectionTarget && (<Modal isOpen={!!editSectionTarget} onClose={() => setEditSectionTarget(null)} title="Edit Section" icon="fa-solid fa-pen-to-square"><div className="space-y-4"><Input label="Section Name" value={sectionForm.name} onChange={e => setSectionForm({name: e.target.value})} iconClass="fa-solid fa-layer-group" /><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setEditSectionTarget(null)} className="w-auto">Cancel</Button><Button onClick={handleUpdateSectionName} className="w-auto">Update</Button></div></div></Modal>)}
            {editSubjectTarget && (<Modal isOpen={!!editSubjectTarget} onClose={() => setEditSubjectTarget(null)} title="Edit Subject Details" icon="fa-solid fa-pen-to-square"><div className="space-y-4"><div className="grid grid-cols-2 gap-4"><Input label="Subject Name" value={editSubjectForm.name} onChange={e => setEditSubjectForm({...editSubjectForm, name: e.target.value})} iconClass="fa-solid fa-book" /><Input label="Subject Code" value={editSubjectForm.code} onChange={e => setEditSubjectForm({...editSubjectForm, code: e.target.value})} iconClass="fa-solid fa-barcode" /></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setEditSubjectTarget(null)} className="w-auto">Cancel</Button><Button onClick={handleUpdateSubject} className="w-auto">Update Subject</Button></div></div></Modal>)}
            {editClassTarget && (<Modal isOpen={!!editClassTarget} onClose={() => setEditClassTarget(null)} title="Edit Class Details" icon="fa-solid fa-pen-to-square"><div className="space-y-4"><Input label="Class Name" value={editClassForm.name} onChange={e => setEditClassForm({...editClassForm, name: e.target.value})} iconClass="fa-solid fa-chalkboard" /><div><label className="block text-sm font-semibold text-navy-800 mb-1.5">Section</label><select className="w-full p-3 border border-gray-300 rounded-md" value={editClassForm.sectionId} onChange={e => setEditClassForm({...editClassForm, sectionId: e.target.value})}><option value="">Select Section</option>{sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="block text-sm font-semibold text-navy-800 mb-1.5">Form Teacher</label><select className="w-full p-3 border border-gray-300 rounded-md" value={editClassForm.classTeacherId} onChange={e => setEditClassForm({...editClassForm, classTeacherId: e.target.value})}><option value="">Select Teacher</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.title} {t.firstName} {t.lastName}</option>)}</select></div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setEditClassTarget(null)} className="w-auto">Cancel</Button><Button onClick={handleUpdateClass} className="w-auto">Update Class</Button></div></div></Modal>)}

            {/* SUBSTITUTE / ASSIGN TEACHER MODAL (Combined Flow) */}
            <Modal isOpen={showAddSubjectToClassModal} onClose={() => { setShowAddSubjectToClassModal(false); setSelectedSubjectToAdd(null); setSelectedTeacherForSubject(''); }} title="Substitute or Assign Subject" icon="fa-solid fa-book-medical">
                <div className="space-y-6">
                    {/* Step 1: Subject Selection */}
                    {!selectedSubjectToAdd ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">Select a subject. You can choose the current subject to just assign a teacher, or a different one to substitute.</p>
                            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                                {subjects.map(sub => (
                                    <div key={sub.id} onClick={() => setSelectedSubjectToAdd(sub)} className={`p-3 border rounded cursor-pointer flex justify-between items-center transition-all ${currentContextData?.subjectId === sub.id ? 'border-navy-900 bg-navy-50 ring-1 ring-navy-900' : 'border-gray-200 hover:bg-gray-50'}`}>
                                        <div><p className="font-bold text-navy-900 text-sm">{sub.name}</p><p className="text-xs text-gray-500 font-mono">{sub.code}</p></div>
                                        {currentContextData?.subjectId === sub.id && <span className="text-[10px] bg-navy-900 text-white px-2 py-0.5 rounded">Current</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Step 2: Teacher Selection
                        <div className="space-y-4 animate-fadeIn">
                            <button onClick={() => { setSelectedSubjectToAdd(null); setSelectedTeacherForSubject(''); }} className="text-xs text-navy-600 hover:underline mb-2"><i className="fa-solid fa-arrow-left mr-1"></i> Back to Subjects</button>
                            <div className="p-3 bg-navy-50 rounded border border-navy-100 mb-4"><p className="text-xs font-bold text-navy-500 uppercase">Selected Subject</p><p className="text-lg font-bold text-navy-900">{selectedSubjectToAdd.name} <span className="text-sm font-normal text-gray-600">({selectedSubjectToAdd.code})</span></p></div>
                            <div>
                                <label className="block text-sm font-semibold text-navy-800 mb-1.5">Assign Teacher</label>
                                <select className="w-full p-3 border border-gray-300 rounded-md" value={selectedTeacherForSubject} onChange={(e) => setSelectedTeacherForSubject(e.target.value)}>
                                    <option value="">Select Teacher (Optional)</option>
                                    {teachers.map(t => <option key={t.id} value={t.id}>{t.title} {t.firstName} {t.lastName}</option>)}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">If left blank, the subject will be assigned without a specific teacher.</p>
                            </div>
                            <div className="flex justify-end pt-4"><Button onClick={handleSubstituteSubject}>Confirm Assignment</Button></div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Other Modals */}
            {generateTimetableTarget && (<Modal isOpen={!!generateTimetableTarget} onClose={() => setGenerateTimetableTarget(null)} title="Generate Timetable" icon="fa-solid fa-wand-magic-sparkles"><div className="space-y-4"><p className="text-sm text-gray-600">Configure parameters to auto-generate schedule for <span className="font-bold">{generateTimetableTarget.name}</span>.</p><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold mb-1">Periods Per Day</label><input type="number" defaultValue={8} className="w-full border p-2 rounded" /></div><div><label className="block text-sm font-semibold mb-1">Break Duration (min)</label><input type="number" defaultValue={30} className="w-full border p-2 rounded" /></div></div><div className="bg-yellow-50 p-3 rounded border border-yellow-200 text-xs text-yellow-800"><i className="fa-solid fa-triangle-exclamation mr-1"></i> Warning: This will overwrite existing schedules.</div><div className="flex justify-end gap-2 mt-4"><Button variant="outline" onClick={() => setGenerateTimetableTarget(null)} className="w-auto">Cancel</Button><Button onClick={() => { setGenerateTimetableTarget(null); setToast({message: "Timetable generated successfully!", type: 'success'}); }} className="w-auto">Generate</Button></div></div></Modal>)}
            
            {/* Teacher Select Modal (General) */}
            <Modal isOpen={showTeacherSelectModal} onClose={() => setShowTeacherSelectModal(false)} title={teacherSelectMode === 'SUBSTITUTE' ? "Assign Teacher" : teacherSelectMode === 'CLASS_MASTER' ? "Assign Form Teacher" : "Manage Subject Teachers"} icon="fa-solid fa-user-check">
                {teacherSelectMode === 'ADD_TO_SUBJECT' ? (
                    <div className="space-y-4">
                        <MultiSelectGrid label="Select Teachers (Add/Remove)" items={teachers.map(t => ({ id: t.id, name: `${t.title} ${t.firstName} ${t.lastName}` }))} selectedIds={currentContextData?.selectedIds || []} onChange={(ids) => handleManageSubjectTeachers(ids)} />
                        <div className="flex justify-end"><Button onClick={() => handleManageSubjectTeachers(currentContextData?.selectedIds || [])}>Save Teachers</Button></div>
                    </div>
                ) : (
                    <div className="space-y-4"><div className="relative"><i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i><input type="text" placeholder="Search teacher..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-navy-500" value={teacherSearch} onChange={(e) => setTeacherSearch(e.target.value)} /></div><div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto custom-scrollbar">{teachers.filter(t => (t.firstName + ' ' + t.lastName).toLowerCase().includes(teacherSearch.toLowerCase()) && t.status === 'Active').map(t => (<div key={t.id} onClick={() => confirmTeacherSelection(t.id)} className="flex items-center justify-between p-3 border-b border-gray-50 cursor-pointer hover:bg-navy-50 transition-colors"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-xs font-bold text-navy-700">{t.firstName[0]}{t.lastName[0]}</div><div><p className="text-sm font-bold text-navy-900">{t.title} {t.firstName} {t.lastName}</p></div></div><i className="fa-solid fa-check text-gray-300"></i></div>))}</div></div>
                )}
            </Modal>

            {/* Custom Manage Class Modal (Manual Save) */}
            <Modal isOpen={showClassSelectModal} onClose={() => setShowClassSelectModal(false)} title="Manage Class Assignments" icon="fa-solid fa-chalkboard">
                {selectedSubjectForClass && (
                    <div className="space-y-4">
                        <div className="bg-navy-50 p-2 rounded text-xs text-navy-700 border border-navy-100 mb-2">Select classes to enroll in <b>{selectedSubjectForClass.name}</b> and assign a specific teacher if needed.</div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg divide-y divide-gray-100">
                            {classSelectState.map((item, idx) => {
                                const cls = classRooms.find(c => c.id === item.classId);
                                if (!cls) return null;
                                return (
                                    <div key={item.classId} className={`p-3 transition-colors ${item.isSelected ? 'bg-white' : 'bg-gray-50 opacity-70 hover:opacity-100'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="flex items-center cursor-pointer"><input type="checkbox" checked={item.isSelected} onChange={() => setClassSelectState(prev => prev.map(i => i.classId === item.classId ? { ...i, isSelected: !i.isSelected } : i))} className="w-4 h-4 text-navy-900 rounded border-gray-300 focus:ring-navy-900" /><span className={`ml-2 text-sm font-bold ${item.isSelected ? 'text-navy-900' : 'text-gray-500'}`}>{cls.name}</span></label>
                                        </div>
                                        {item.isSelected && (
                                            <div className="pl-6 animate-fadeIn">
                                                <select value={item.teacherId} onChange={(e) => setClassSelectState(prev => prev.map(i => i.classId === item.classId ? { ...i, teacherId: e.target.value } : i))} className="w-full text-xs p-2 border border-gray-300 rounded bg-white"><option value="">Select Teacher (Default)</option>{teachers.map(t => (<option key={t.id} value={t.id}>{t.title} {t.firstName} {t.lastName}</option>))}</select>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-end pt-4 gap-2 border-t border-gray-100"><Button variant="outline" onClick={() => setShowClassSelectModal(false)}>Cancel</Button><Button onClick={handleSaveClassAssignments}>Save Assignments</Button></div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={showAddStudentModal} onClose={() => { setShowAddStudentModal(false); setSelectedStudentIds([]); setStudentSearch(''); }} title="Enroll Students" icon="fa-solid fa-user-plus">
                <div className="space-y-4"><input type="text" placeholder="Search student..." className="w-full p-2 border border-gray-300 rounded-md" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} /><div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto custom-scrollbar p-2">{students.filter(s => !s.classRoomIds.includes(selectedItemId || '') && (s.firstName + ' ' + s.lastName).toLowerCase().includes(studentSearch.toLowerCase())).map(student => (<div key={student.id} onClick={() => { if (selectedStudentIds.includes(student.id)) setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id)); else setSelectedStudentIds([...selectedStudentIds, student.id]); }} className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedStudentIds.includes(student.id) ? 'bg-navy-50' : 'hover:bg-gray-50'}`}><span>{student.firstName} {student.lastName}</span>{selectedStudentIds.includes(student.id) && <i className="fa-solid fa-check text-navy-900"></i>}</div>))}</div><Button onClick={handleAddStudentsToClass} disabled={selectedStudentIds.length === 0}>Enroll Selected</Button></div>
            </Modal>

            <Modal isOpen={showTransferModal} onClose={() => { setShowTransferModal(false); setSelectedStudentIds([]); setTransferTargetClassId(''); }} title="Transfer Students" icon="fa-solid fa-arrow-right-arrow-left">
                <div className="space-y-4"><div className="flex justify-between items-center"><p className="text-sm text-gray-600">Select students to move.</p>{students.filter(s => s.classRoomIds.includes(selectedItemId || '')).length > 0 && (<button onClick={() => { const candidates = students.filter(s => s.classRoomIds.includes(selectedItemId || '')); if (selectedStudentIds.length === candidates.length) { setSelectedStudentIds([]); } else { setSelectedStudentIds(candidates.map(s => s.id)); } }} className="text-xs font-bold text-navy-600 hover:text-gold-600 transition-colors">{selectedStudentIds.length === students.filter(s => s.classRoomIds.includes(selectedItemId || '')).length ? 'Deselect All' : 'Select All'}</button>)}</div><div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto custom-scrollbar p-2">{students.filter(s => s.classRoomIds.includes(selectedItemId || '')).map(student => (<div key={student.id} onClick={() => { if (selectedStudentIds.includes(student.id)) setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id)); else setSelectedStudentIds([...selectedStudentIds, student.id]); }} className={`flex items-center justify-between p-2 rounded cursor-pointer ${selectedStudentIds.includes(student.id) ? 'bg-navy-50' : 'hover:bg-gray-50'}`}><span>{student.firstName} {student.lastName}</span>{selectedStudentIds.includes(student.id) && <i className="fa-solid fa-check text-navy-900"></i>}</div>))}{students.filter(s => s.classRoomIds.includes(selectedItemId || '')).length === 0 && <p className="text-center text-sm text-gray-500 italic p-2">No students in this class.</p>}</div><div><label className="block text-sm font-semibold text-navy-800 mb-1.5">Target Class</label><select className="w-full p-3 border border-gray-300 rounded-md" value={transferTargetClassId} onChange={(e) => setTransferTargetClassId(e.target.value)}><option value="">Select Target Class</option>{classRooms.filter(c => c.id !== selectedItemId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><Button onClick={handleTransferStudents} disabled={selectedStudentIds.length === 0 || !transferTargetClassId}>Transfer Selected</Button></div>
            </Modal>

            {/* Timetable & Report */}
            <TimetableModal isOpen={showTimetableModal} onClose={() => setShowTimetableModal(false)} target={timetableTarget} currentSession={currentSession} currentTerm={currentTerm} />
            <UnifiedExportModal isOpen={reportModalData.isOpen} onClose={() => setReportModalData({...reportModalData, isOpen: false})} data={reportModalData.data} type={reportModalData.type as 'STUDENT' | 'TEACHER' | 'CLASS'} title={reportModalData.title} />
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
        </div>
    );
};
