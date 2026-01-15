
import React, { useState, useEffect } from 'react';
import { Button, Input, Toggle, FadeIn, Toast, ImageUpload, Modal } from '../components/UI';
import { Teacher, SchoolSection, Subject } from '../types';

type SettingsTab = 'BOARD' | 'ACADEMIC' | 'TIMETABLE' | 'FINANCE' | 'SECURITY' | 'APPEARANCE' | 'TEMPLATES';

// Types for Templates
interface DocTemplate {
    id: string;
    name: string;
    type: 'Form' | 'Report' | 'Transcript' | 'Certificate';
    fileType: 'DOCX' | 'XLSX' | 'PDF';
    lastUpdated: string;
    isConfigured: boolean;
}

// Default Values
const defaults = {
    board: {
        name: 'Springfield High Academy',
        tag: 'SCH-2024-001',
        address: '123 Education Lane, Knowledge City',
        email: 'admin@springfield.edu',
        phone: '+1 (555) 000-0000',
        website: 'www.springfield.edu'
    },
    academic: {
        session: '2023/2024',
        term: '1st Term',
        autoPromotion: false,
        lockPastRecords: true,
        gradingSystem: 'Standard (A-F)'
    },
    finance: {
        currency: 'NGN',
        onlinePayment: true,
        paymentDueDate: 14,
        bankName: 'First Bank',
        accountNumber: '1234567890',
        accountName: 'Springfield School Account'
    },
    security: {
        requirePin: true,
        sessionTimeout: '30 Minutes',
        twoFactor: false
    },
    appearance: {
        theme: 'Light',
        accentColor: 'Navy',
        compactMode: false
    },
    templates: {
        headerImage: '', // Base64 or URL
        useCustomHeader: true,
        documents: [
            { id: 'doc1', name: 'Student Admission Form', type: 'Form', fileType: 'DOCX', lastUpdated: '2023-09-01', isConfigured: true },
            { id: 'doc2', name: 'End of Term Report Card', type: 'Report', fileType: 'XLSX', lastUpdated: '2023-12-15', isConfigured: true },
            { id: 'doc3', name: 'Official Transcript', type: 'Transcript', fileType: 'DOCX', lastUpdated: '2023-10-20', isConfigured: false }
        ] as DocTemplate[]
    }
};

interface SettingsManagerProps {
    onLogActivity?: (action: any, module: any, description: string) => void;
    teachers?: Teacher[];
    sections?: SchoolSection[];
    subjects?: Subject[];
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ 
    onLogActivity,
    teachers = [],
    sections = [],
    subjects = []
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('BOARD');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Configuration & Preview States
  const [configuringDoc, setConfiguringDoc] = useState<DocTemplate | null>(null);
  const [previewingDoc, setPreviewingDoc] = useState<DocTemplate | null>(null);
  const [editProviderMode, setEditProviderMode] = useState(false);

  // Helper to load state lazily
  const loadState = <T,>(key: string, defaultVal: T): T => {
      const saved = localStorage.getItem('eduPortal_settings');
      if (saved) {
          try {
              const parsed = JSON.parse(saved);
              return parsed[key] !== undefined ? parsed[key] : defaultVal;
          } catch (e) {
              return defaultVal;
          }
      }
      return defaultVal;
  };

  // Lazy Initialization of State (Reads from Storage BEFORE render)
  const [board, setBoard] = useState(() => loadState('board', defaults.board));
  const [academic, setAcademic] = useState(() => loadState('academic', defaults.academic));
  const [finance, setFinance] = useState(() => loadState('finance', defaults.finance));
  const [security, setSecurity] = useState(() => loadState('security', defaults.security));
  const [appearance, setAppearance] = useState(() => loadState('appearance', defaults.appearance));
  const [templates, setTemplates] = useState(() => loadState('templates', defaults.templates));

  // --- TIMETABLE CONFIG STATE ---
  const [timetableConfig, setTimetableConfig] = useState({
      periodsPerDay: 8,
      durationPerPeriod: 40, // mins
      breakDuration: 30, // mins
      selectedSections: [] as string[],
      selectedTeacherIds: [] as string[],
      teacherAvailability: {} as Record<string, { days: string[], startTime: string, endTime: string, maxHours: number }>
  });

  const weekDays = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

  const handleSave = () => {
    const allSettings = { board, academic, finance, security, appearance, templates };
    localStorage.setItem('eduPortal_settings', JSON.stringify(allSettings));
    const themeVal = appearance.theme === 'Dark' ? 'dark' : 'light';
    localStorage.setItem('eduPortal_theme', themeVal);
    window.dispatchEvent(new Event('eduPortal_theme_change'));
    if(onLogActivity) onLogActivity('UPDATE', 'SETTINGS', 'System settings updated');
    setToast({ message: "Settings saved successfully", type: 'success' });
  };

  // --- TEMPLATE CONFIGURATION MODAL ---
  const TemplateConfigModal = () => {
      if (!configuringDoc) return null;

      const systemVariables = [
          { key: '{{StudentName}}', desc: 'Full Name of Student' },
          { key: '{{AdmissionNo}}', desc: 'Unique Admission Number' },
          { key: '{{Class}}', desc: 'Current Class Name' },
          { key: '{{Session}}', desc: 'Current Academic Session' },
          { key: '{{Term}}', desc: 'Current Term' },
          { key: '{{GuardianName}}', desc: 'Parent/Guardian Name' },
          { key: '{{TodayDate}}', desc: 'Date of Generation' },
      ];

      if (configuringDoc.type === 'Report') {
          systemVariables.push(
              { key: '{{GradeTable}}', desc: 'Full Grades Grid (Subject, Score, Grade)' },
              { key: '{{AverageScore}}', desc: 'Calculated Average' },
              { key: '{{ClassPosition}}', desc: 'Position in Class' },
              { key: '{{TeacherRemark}}', desc: 'Form Teacher\'s Comment' }
          );
      }

      return (
          <Modal isOpen={!!configuringDoc} onClose={() => setConfiguringDoc(null)} title={`Configure ${configuringDoc.name}`} icon="fa-solid fa-file-pen">
              <div className="space-y-6">
                  {/* File Upload Section */}
                  <div className="bg-navy-50 border border-dashed border-navy-200 rounded-lg p-6 text-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm text-navy-600">
                          <i className={`fa-solid ${configuringDoc.fileType === 'XLSX' ? 'fa-file-excel' : 'fa-file-word'} text-2xl`}></i>
                      </div>
                      <h4 className="font-bold text-navy-900">Upload Base Template</h4>
                      <p className="text-xs text-gray-500 mb-4">
                          Upload your custom {configuringDoc.fileType} file. Use the variables below to map system data.
                      </p>
                      <button className="bg-white border border-gray-300 text-navy-700 px-4 py-2 rounded text-sm font-semibold hover:bg-gray-50">
                          <i className="fa-solid fa-upload mr-2"></i> Select File
                      </button>
                  </div>

                  {/* Header Settings */}
                  <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gold-100 text-gold-600 rounded-lg flex items-center justify-center">
                              <i className="fa-solid fa-image"></i>
                          </div>
                          <div>
                              <p className="font-bold text-navy-900 text-sm">Apply System Header</p>
                              <p className="text-xs text-gray-500">Automatically insert school letterhead at the top.</p>
                          </div>
                      </div>
                      <Toggle label="" checked={true} onChange={() => {}} />
                  </div>

                  {/* Variable Mapping Guide */}
                  <div>
                      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex justify-between items-center">
                          <span>Available Variables</span>
                          <span className="text-[10px] bg-gray-100 px-2 py-1 rounded">Click to Copy</span>
                      </h4>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar border border-gray-200 rounded-lg bg-gray-50 p-2">
                          {systemVariables.map(v => (
                              <div key={v.key} 
                                   onClick={() => { navigator.clipboard.writeText(v.key); setToast({message: "Variable copied!", type: 'success'}); }}
                                   className="flex justify-between items-center p-2 bg-white rounded border border-gray-100 hover:border-navy-300 cursor-pointer group transition-colors">
                                  <code className="text-xs font-bold text-navy-700 font-mono bg-navy-50 px-1 rounded">{v.key}</code>
                                  <span className="text-xs text-gray-500">{v.desc}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100">
                      <Button onClick={() => {
                          // Mock save
                          const updated = templates.documents.map(d => d.id === configuringDoc.id ? { ...d, isConfigured: true } : d);
                          setTemplates({ ...templates, documents: updated });
                          setConfiguringDoc(null);
                          setToast({ message: "Template configuration saved", type: 'success' });
                      }}>
                          Save Configuration
                      </Button>
                  </div>
              </div>
          </Modal>
      );
  };

  // --- DOCUMENT PREVIEW MODAL ---
  const TemplatePreviewModal = () => {
      if (!previewingDoc) return null;

      return (
          <Modal isOpen={!!previewingDoc} onClose={() => setPreviewingDoc(null)} title={`Preview: ${previewingDoc.name}`} icon="fa-solid fa-eye">
              <div className="bg-gray-100 p-4 rounded-lg overflow-hidden flex flex-col items-center min-h-[500px]">
                  {/* Simulated Paper Document */}
                  <div className="bg-white shadow-xl w-full max-w-[210mm] min-h-[297mm] p-8 md:p-12 text-sm text-gray-800 relative origin-top transform scale-90 md:scale-100 transition-transform">
                      
                      {/* 1. Header Integration */}
                      {templates.headerImage ? (
                          <div className="mb-8 flex justify-center border-b-2 border-navy-900 pb-4">
                              <img src={templates.headerImage} alt="Header" className="max-h-24 object-contain" />
                          </div>
                      ) : (
                          <div className="mb-8 flex flex-col items-center justify-center border-b-2 border-navy-900 pb-4">
                              <h1 className="text-2xl font-bold text-navy-900 uppercase tracking-widest">{board.name}</h1>
                              <p className="text-xs text-gray-500">{board.address}</p>
                              <p className="text-xs text-gray-500">{board.email} | {board.phone}</p>
                          </div>
                      )}

                      {/* 2. Document Content Simulation */}
                      <h2 className="text-center font-bold text-xl uppercase underline mb-8">{previewingDoc.name}</h2>

                      <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-8">
                          <div><span className="font-bold">Name:</span> Emily Clarke</div>
                          <div><span className="font-bold">Admission No:</span> ADM-2023-001</div>
                          <div><span className="font-bold">Class:</span> JSS 1 A</div>
                          <div><span className="font-bold">Session:</span> {academic.session}</div>
                      </div>

                      {previewingDoc.type === 'Report' ? (
                          // Excel / Grid Preview
                          <div className="border border-gray-900 mt-4">
                              <div className="grid grid-cols-4 bg-gray-200 font-bold border-b border-gray-900 p-2 text-center">
                                  <div className="text-left">Subject</div>
                                  <div>Test (40)</div>
                                  <div>Exam (60)</div>
                                  <div>Total</div>
                              </div>
                              {[
                                  { sub: 'Mathematics', t: 35, e: 55, tot: 90, gd: 'A' },
                                  { sub: 'English', t: 30, e: 45, tot: 75, gd: 'B' },
                                  { sub: 'Physics', t: 25, e: 50, tot: 75, gd: 'B' },
                                  { sub: 'Biology', t: 38, e: 58, tot: 96, gd: 'A+' },
                              ].map((row, idx) => (
                                  <div key={idx} className="grid grid-cols-4 border-b border-gray-300 p-2 text-center last:border-0">
                                      <div className="text-left">{row.sub}</div>
                                      <div>{row.t}</div>
                                      <div>{row.e}</div>
                                      <div className="font-bold">{row.tot} ({row.gd})</div>
                                  </div>
                              ))}
                              <div className="p-2 border-t border-gray-900 font-bold bg-gray-100 flex justify-between">
                                  <span>Average Score: 84.0</span>
                                  <span>Position: 5th / 45</span>
                              </div>
                          </div>
                      ) : (
                          // Text Doc Preview
                          <div className="space-y-4 text-justify leading-relaxed">
                              <p>This is to certify that the student mentioned above has successfully completed the requirements for the academic session.</p>
                              <p>The student has maintained a good conduct record and has participated in various extracurricular activities.</p>
                              <p className="mt-8 pt-8">
                                  This document is issued by the authority of <b>{board.name}</b> and is valid without a signature if generated from the official portal.
                              </p>
                          </div>
                      )}

                      {/* Footer */}
                      <div className="absolute bottom-12 left-12 right-12 flex justify-between items-end">
                          <div className="text-center">
                              <div className="border-b border-gray-400 w-32 mb-1"></div>
                              <span className="text-xs text-gray-500">Principal's Signature</span>
                          </div>
                          <div className="text-center">
                              <div className="w-20 h-20 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300 rounded-full mb-1">
                                  <span className="text-[8px] uppercase font-bold">Stamp</span>
                              </div>
                              <span className="text-xs text-gray-500">Official Stamp</span>
                          </div>
                      </div>
                  </div>
              </div>
              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-gray-100">
                  <Button variant="outline" onClick={() => setPreviewingDoc(null)}>Close Preview</Button>
                  <Button onClick={() => window.print()}><i className="fa-solid fa-print mr-2"></i> Print Test</Button>
              </div>
          </Modal>
      );
  };

  const updateTeacherTime = (tId: string, field: 'startTime' | 'endTime' | 'maxHours', value: any) => {
      const current = timetableConfig.teacherAvailability[tId] || { days: [], startTime: '08:00', endTime: '14:00', maxHours: 5 };
      setTimetableConfig({
          ...timetableConfig,
          teacherAvailability: {
              ...timetableConfig.teacherAvailability,
              [tId]: { ...current, [field]: value }
          }
      });
  };

  const toggleTeacherAvailabilityDay = (tId: string, day: string) => {
      const current = timetableConfig.teacherAvailability[tId] || { days: [], startTime: '08:00', endTime: '14:00', maxHours: 5 };
      const newDays = current.days.includes(day) 
          ? current.days.filter(d => d !== day)
          : [...current.days, day];
      
      setTimetableConfig({
          ...timetableConfig,
          teacherAvailability: {
              ...timetableConfig.teacherAvailability,
              [tId]: { ...current, days: newDays }
          }
      });
  };

  const TabButton = ({ id, label, icon }: { id: SettingsTab, label: string, icon: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-colors border-l-4 whitespace-nowrap md:whitespace-normal ${
        activeTab === id
          ? 'bg-navy-50 border-navy-900 text-navy-900'
          : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-navy-700'
      }`}
    >
      <i className={`${icon} w-6 text-center mr-2 ${activeTab === id ? 'text-navy-900' : 'text-gray-400'}`}></i>
      {label}
    </button>
  );

  return (
    <div className="animate-fadeIn flex flex-col md:flex-row gap-6 items-start h-full">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Sidebar */}
      <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-200 py-4 shrink-0 md:sticky md:top-0 z-10">
        <h3 className="px-6 pb-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
          Configuration
        </h3>
        <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
          <TabButton id="BOARD" label="Board Settings" icon="fa-solid fa-building-columns" />
          <TabButton id="ACADEMIC" label="Academic" icon="fa-solid fa-book-open" />
          <TabButton id="TIMETABLE" label="Timetable Gen" icon="fa-solid fa-calendar-days" />
          <TabButton id="FINANCE" label="Financial" icon="fa-solid fa-wallet" />
          <TabButton id="SECURITY" label="Security" icon="fa-solid fa-shield-halved" />
          <TabButton id="APPEARANCE" label="Appearance" icon="fa-solid fa-palette" />
          <TabButton id="TEMPLATES" label="Documents & Files" icon="fa-solid fa-file-contract" />
        </nav>
        
        <div className="px-6 pt-6 mt-4 border-t border-gray-100 hidden md:block">
             <Button onClick={handleSave} className="w-full">
                 <i className="fa-solid fa-save mr-2"></i> Save Changes
             </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-10">
        <FadeIn key={activeTab}>
          {activeTab === 'BOARD' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Institution Board</h2>
                <p className="text-sm text-gray-500">Manage school identity and contact information.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <Input label="School Name" value={board.name} onChange={e => setBoard({ ...board, name: e.target.value })} iconClass="fa-solid fa-school" />
                <Input label="Institution ID / Tag" value={board.tag} disabled iconClass="fa-solid fa-tag" className="bg-gray-50" />
                <div className="md:col-span-2">
                  <Input label="Physical Address" value={board.address} onChange={e => setBoard({ ...board, address: e.target.value })} iconClass="fa-solid fa-location-dot" />
                </div>
                <Input label="Official Email" value={board.email} onChange={e => setBoard({ ...board, email: e.target.value })} iconClass="fa-regular fa-envelope" />
                <Input label="Contact Phone" value={board.phone} onChange={e => setBoard({ ...board, phone: e.target.value })} iconClass="fa-solid fa-phone" />
                <Input label="Website URL" value={board.website} onChange={e => setBoard({ ...board, website: e.target.value })} iconClass="fa-solid fa-globe" />
              </div>
            </div>
          )}

          {activeTab === 'ACADEMIC' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Academic Configuration</h2>
                <p className="text-sm text-gray-500">Set current sessions, terms, and grading rules.</p>
              </div>
              
              <div className="bg-navy-50 p-6 rounded-lg border border-navy-100 flex flex-col md:flex-row gap-6 items-center">
                 <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-navy-900 mb-2">Current Session</label>
                    <select 
                      className="w-full p-3 rounded-md border border-navy-200 focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm"
                      value={academic.session}
                      onChange={e => setAcademic({...academic, session: e.target.value})}
                    >
                      <option>2023/2024</option>
                      <option>2024/2025</option>
                    </select>
                 </div>
                 <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-navy-900 mb-2">Current Term</label>
                    <select 
                      className="w-full p-3 rounded-md border border-navy-200 focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm"
                      value={academic.term}
                      onChange={e => setAcademic({...academic, term: e.target.value})}
                    >
                      <option>1st Term</option>
                      <option>2nd Term</option>
                      <option>3rd Term</option>
                    </select>
                 </div>
              </div>

              <div className="space-y-4 pt-2">
                <Toggle 
                  label="Auto-Promotion System" 
                  description="Automatically promote students based on final grades." 
                  checked={academic.autoPromotion} 
                  onChange={v => setAcademic({...academic, autoPromotion: v})} 
                />
                <div className="border-t border-gray-100 my-2"></div>
                <Toggle 
                  label="Lock Past Academic Records" 
                  description="Prevent editing of grades from previous sessions." 
                  checked={academic.lockPastRecords} 
                  onChange={v => setAcademic({...academic, lockPastRecords: v})} 
                />
              </div>
            </div>
          )}

          {activeTab === 'TIMETABLE' && (
              <div className="space-y-8">
                  <div className="border-b border-gray-100 pb-4 flex justify-between items-end">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">Advanced Timetable Generator</h2>
                        <p className="text-sm text-gray-500">Configure parameters, select sections, and map teacher availability (Sat-Wed).</p>
                    </div>
                    <Button className="w-auto px-4" onClick={() => setToast({message: "Timetable generation started...", type: 'success'})}>
                        <i className="fa-solid fa-wand-magic-sparkles mr-2"></i> Generate
                    </Button>
                  </div>

                  {/* 1. General Config */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Input 
                        type="number" 
                        label="Periods per Day" 
                        value={timetableConfig.periodsPerDay} 
                        onChange={e => setTimetableConfig({...timetableConfig, periodsPerDay: Number(e.target.value)})} 
                        iconClass="fa-solid fa-list-ol" 
                      />
                      <Input 
                        type="number" 
                        label="Duration (Mins)" 
                        value={timetableConfig.durationPerPeriod} 
                        onChange={e => setTimetableConfig({...timetableConfig, durationPerPeriod: Number(e.target.value)})} 
                        iconClass="fa-regular fa-clock" 
                      />
                      <Input 
                        type="number" 
                        label="Break Time (Mins)" 
                        value={timetableConfig.breakDuration} 
                        onChange={e => setTimetableConfig({...timetableConfig, breakDuration: Number(e.target.value)})} 
                        iconClass="fa-solid fa-mug-hot" 
                      />
                  </div>

                  {/* 2. Section Scoping */}
                  <div className="bg-navy-50 p-6 rounded-lg border border-navy-100">
                      <h4 className="font-bold text-navy-900 mb-4 flex items-center">
                          <i className="fa-solid fa-layer-group mr-2 text-navy-600"></i> Select Sections for Generation
                      </h4>
                      <p className="text-xs text-gray-500 mb-4">The generator will only create schedules for the selected sections and their associated courses.</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {sections.map(sec => (
                              <label key={sec.id} className={`flex items-center p-3 rounded border cursor-pointer transition-all ${timetableConfig.selectedSections.includes(sec.id) ? 'bg-white border-navy-900 shadow-sm' : 'border-gray-200 bg-gray-50/50'}`}>
                                  <input 
                                    type="checkbox" 
                                    checked={timetableConfig.selectedSections.includes(sec.id)}
                                    onChange={() => {
                                        const newSecs = timetableConfig.selectedSections.includes(sec.id) 
                                            ? timetableConfig.selectedSections.filter(id => id !== sec.id) 
                                            : [...timetableConfig.selectedSections, sec.id];
                                        setTimetableConfig({...timetableConfig, selectedSections: newSecs});
                                    }}
                                    className="w-4 h-4 text-navy-900 rounded focus:ring-navy-900"
                                  />
                                  <span className="ml-2 text-sm font-semibold text-navy-800">{sec.name}</span>
                              </label>
                          ))}
                      </div>
                  </div>

                  {/* 3. Teacher Availability & Constraints */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="bg-gray-100 p-4 border-b border-gray-200">
                          <h4 className="font-bold text-navy-900">Teacher Availability & Assignments</h4>
                          <p className="text-xs text-gray-500">Define available days (Sat-Wed) and time slots for each teacher.</p>
                      </div>
                      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                          {teachers.map(t => {
                              const assignedSubs = subjects.filter(s => s.teacherIds.includes(t.id));
                              const config = timetableConfig.teacherAvailability[t.id] || { days: [], startTime: '08:00', endTime: '14:00', maxHours: 5 };

                              return (
                                  <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors">
                                      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-3">
                                          <div>
                                              <p className="font-bold text-navy-900 text-sm">{t.title} {t.firstName} {t.lastName}</p>
                                              <p className="text-xs text-gray-500">{assignedSubs.length} Subjects: {assignedSubs.map(s => s.name).join(', ')}</p>
                                          </div>
                                          <div className="flex gap-4 items-center">
                                              <div className="flex flex-col">
                                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Available Time</label>
                                                  <div className="flex items-center gap-2">
                                                      <input type="time" value={config.startTime} onChange={e => updateTeacherTime(t.id, 'startTime', e.target.value)} className="border p-1 rounded text-xs" />
                                                      <span className="text-gray-400">-</span>
                                                      <input type="time" value={config.endTime} onChange={e => updateTeacherTime(t.id, 'endTime', e.target.value)} className="border p-1 rounded text-xs" />
                                                  </div>
                                              </div>
                                               <div className="flex flex-col">
                                                  <label className="text-[10px] font-bold text-gray-400 uppercase">Max Hrs/Day</label>
                                                  <input type="number" value={config.maxHours} onChange={e => updateTeacherTime(t.id, 'maxHours', e.target.value)} className="border p-1 rounded text-xs w-16" />
                                              </div>
                                          </div>
                                      </div>
                                      <div className="flex gap-2 flex-wrap">
                                          {weekDays.map(day => (
                                              <button
                                                key={day}
                                                onClick={() => toggleTeacherAvailabilityDay(t.id, day)}
                                                className={`px-3 py-1 rounded text-xs font-bold border transition-colors ${
                                                    config.days.includes(day) 
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
                  </div>
              </div>
          )}

          {activeTab === 'FINANCE' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Financial Settings</h2>
                <p className="text-sm text-gray-500">Configure currency, payments, and banking details.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Input label="Currency Symbol" value={finance.currency} onChange={e => setFinance({...finance, currency: e.target.value})} iconClass="fa-solid fa-coins" />
                 <Input type="number" label="Default Payment Due (Days)" value={finance.paymentDueDate} onChange={e => setFinance({...finance, paymentDueDate: Number(e.target.value)})} iconClass="fa-regular fa-calendar" />
              </div>
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 space-y-4">
                 <h4 className="font-bold text-navy-900 border-b border-gray-200 pb-2 mb-4">School Bank Details</h4>
                 <Input label="Bank Name" value={finance.bankName} onChange={e => setFinance({...finance, bankName: e.target.value})} iconClass="fa-solid fa-building-columns" />
                 <Input label="Account Number" value={finance.accountNumber} onChange={e => setFinance({...finance, accountNumber: e.target.value})} iconClass="fa-solid fa-hashtag" />
                 <Input label="Account Name" value={finance.accountName} onChange={e => setFinance({...finance, accountName: e.target.value})} iconClass="fa-solid fa-signature" />
              </div>
              <Toggle label="Enable Online Payments" description="Allow students/parents to pay fees directly via portal." checked={finance.onlinePayment} onChange={v => setFinance({...finance, onlinePayment: v})} />
            </div>
          )}

          {activeTab === 'SECURITY' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Security & Access</h2>
                <p className="text-sm text-gray-500">Manage authentication rules and director access.</p>
              </div>
              <div className="space-y-4">
                <Toggle label="Require PIN for Sensitive Actions" description="Director PIN required for deletions, suspensions, and salary payments." checked={security.requirePin} onChange={v => setSecurity({...security, requirePin: v})} />
                <div className="border-t border-gray-100 my-2"></div>
                <Toggle label="Two-Factor Authentication (2FA)" description="Require email OTP for new logins." checked={security.twoFactor} onChange={v => setSecurity({...security, twoFactor: v})} />
              </div>
              <div className="pt-6 border-t border-gray-100">
                 <label className="block text-sm font-bold text-navy-900 mb-2">Session Timeout</label>
                 <select className="w-full md:w-1/2 p-3 rounded-md border border-gray-300 focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm" value={security.sessionTimeout} onChange={e => setSecurity({...security, sessionTimeout: e.target.value})}>
                    <option>15 Minutes</option>
                    <option>30 Minutes</option>
                    <option>1 Hour</option>
                 </select>
              </div>
            </div>
          )}

          {activeTab === 'TEMPLATES' && (
              <div className="space-y-8">
                  <div className="border-b border-gray-100 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900">Documents & Templates</h2>
                        <p className="text-sm text-gray-500">Manage official templates (Doc, Excel), headers, and layouts.</p>
                    </div>
                    {/* Toggle Edit Mode for Provider */}
                    <div className="flex items-center gap-2 bg-navy-50 p-2 rounded-lg border border-navy-100">
                        <span className="text-xs font-bold text-navy-900">Edit Mode</span>
                        <Toggle 
                            label="" 
                            checked={editProviderMode}
                            onChange={(v) => setEditProviderMode(v)}
                        />
                    </div>
                  </div>

                  {/* Header Configuration */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                      <h3 className="font-bold text-navy-900 mb-4 flex items-center">
                          <i className="fa-solid fa-image mr-2 text-gold-500"></i> Official Document Header
                      </h3>
                      <p className="text-xs text-gray-500 mb-4">Upload the image to be used as the letterhead for generated PDFs and Previews.</p>
                      
                      <div className="flex flex-col md:flex-row items-center gap-6">
                          <div className="w-full md:w-1/2">
                              <ImageUpload 
                                  label="Header Image (Letterhead)"
                                  currentImage={templates.headerImage}
                                  onImageSelected={(url) => setTemplates({...templates, headerImage: url})}
                                  className="w-full"
                              />
                          </div>
                          <div className="w-full md:w-1/2 bg-gray-50 p-4 rounded border border-dashed border-gray-300 h-40 flex items-center justify-center text-gray-400">
                              {templates.headerImage ? (
                                  <img src={templates.headerImage} alt="Header Preview" className="max-h-full object-contain" />
                              ) : (
                                  <span>Header Preview Area</span>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Recommended Templates Grid */}
                  <div>
                      <h3 className="font-bold text-navy-900 mb-4 flex items-center">
                          <i className="fa-solid fa-file-contract mr-2 text-navy-600"></i> System Templates
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {templates.documents.map(doc => (
                              <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative group">
                                  <div className="h-24 bg-gray-100 rounded mb-3 flex items-center justify-center text-4xl text-gray-300 relative overflow-hidden">
                                      <i className={`fa-solid ${doc.fileType === 'XLSX' ? 'fa-file-excel text-green-500' : 'fa-file-word text-blue-500'}`}></i>
                                      {doc.isConfigured && <div className="absolute top-2 right-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">Configured</div>}
                                  </div>
                                  <h4 className="font-bold text-navy-900 text-sm truncate" title={doc.name}>{doc.name}</h4>
                                  <p className="text-xs text-gray-500">{doc.type} • {doc.fileType}</p>
                                  
                                  {/* Action Overlay */}
                                  <div className={`absolute inset-0 bg-navy-900/90 rounded-lg transition-opacity flex flex-col items-center justify-center gap-2 ${editProviderMode ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                      <button 
                                        onClick={() => setPreviewingDoc(doc)}
                                        className="text-white text-xs font-bold border border-white/50 px-3 py-1 rounded hover:bg-white hover:text-navy-900 w-24 flex items-center justify-center"
                                      >
                                          <i className="fa-solid fa-eye mr-2"></i> Preview
                                      </button>
                                      <button 
                                        onClick={() => setConfiguringDoc(doc)}
                                        className="text-gold-500 text-xs font-bold border border-gold-500/50 px-3 py-1 rounded hover:bg-gold-500 hover:text-navy-900 w-24 flex items-center justify-center"
                                      >
                                          <i className="fa-solid fa-gear mr-2"></i> Configure
                                      </button>
                                  </div>
                              </div>
                          ))}
                          
                          {/* Add New Template Placeholder */}
                          {editProviderMode && (
                              <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 hover:text-navy-600 transition-colors h-full min-h-[180px]">
                                  <i className="fa-solid fa-plus text-3xl mb-2"></i>
                                  <span className="text-sm font-bold">Add Template</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'APPEARANCE' && (
            <div className="space-y-6">
              <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Visual Preferences</h2>
                <p className="text-sm text-gray-500">Customize the look and feel of the portal.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {['Light', 'Dark', 'System'].map(mode => (
                    <div key={mode} onClick={() => setAppearance({...appearance, theme: mode})} className={`cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center gap-3 transition-all ${appearance.theme === mode ? 'border-navy-900 bg-navy-50' : 'border-gray-200 hover:border-navy-300'}`}>
                        <div className={`w-full h-24 rounded-lg shadow-sm ${mode === 'Dark' ? 'bg-gray-800' : 'bg-white'}`}></div>
                        <span className={`font-bold ${appearance.theme === mode ? 'text-navy-900' : 'text-gray-500'}`}>{mode} Mode</span>
                    </div>
                 ))}
              </div>
            </div>
          )}
        </FadeIn>
      </div>
      
      {/* Mobile Save Button */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-20">
          <Button onClick={handleSave}>Save Changes</Button>
      </div>

      {/* Modals */}
      <TemplateConfigModal />
      <TemplatePreviewModal />
    </div>
  );
};
