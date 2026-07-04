import React, { useState } from 'react';
import { createPortal } from 'react-dom';

import ReactDOMServer from 'react-dom/server';
import { TemplateConfig, SectionStyle, TemplateData } from './types';
import { TemplatePreview } from './TemplatePreview';
import { Button, Input, ImageUpload, MultiSelectDropdown, PinModal} from '../../UI';
import { SectionStyleEditor } from './SectionStyleEditor';
import {StudentInfoFieldsAvailable} from "../../../utils" ;
import { uiContext } from '@/customContexts/UiContext';
import {generateStudentReportData,studentMockReportData} from "../../../utils";

interface TemplateEditorProps {
    initialConfig?: Partial<TemplateConfig>;
    onSave: (config: TemplateConfig, htmlContent: string) => void;
    onCancel: () => void;
    templateData: TemplateData;
}

const defaultSectionStyle: SectionStyle = {
    fontFamily: 'inherit',
    fontSize: 'inherit',
    color: 'inherit',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    padding: '',
    margin: '',
    border: '',
    borderRadius: '',
    backgroundColor: '',
    boxShadow: ''
};

const defaultConfig: TemplateConfig = {
    templateType: 'Report',
    orientation: 'portrait',
    visibleSections: {
        header: true,
        title: true,
        studentInfo: true,
        table: true,
        remarks: true,
        signatures: true,
        footer: true,
        stamp: true
    },
    primaryColor: '#003366',
    borderColor: '#cccccc',
    globalFontFamily: 'Arial',
    containerStyle: { ...defaultSectionStyle, fontSize: '14px', color: '#333333', padding: '40px', margin: '0 auto', border: '1px solid #e5e7eb', borderRadius: '8px', backgroundColor: '#ffffff' },
    
    watermarkType: 'text',
    watermarkText: 'CONFIDENTIAL',
    watermarkImage: '',
    watermarkOpacity: 3,
    watermarkRotation: -45,
    watermarkSize: 400,
    
    logoPosition: 'left',
    headerStyle: 'standard',
    
    headerStyleObj: { ...defaultSectionStyle, textAlign: 'center', padding: '0 0 16px 0', margin: '0 0 24px 0', border: '0 0 2px 0 solid #003366'},
    schoolNameStyle: { ...defaultSectionStyle, fontSize: '1.5em', fontWeight: 'bold', color: '#003366', textAlign: 'center' },
    schoolNameSecondaryStyle: { ...defaultSectionStyle, fontSize: '1.2em', fontWeight: 'bold', color: '#003366', textAlign: 'center' },
    logoStyle: { opacity: 100, borderRadius: '50%', width: '64px', height: '64px' },
    
    documentTitle: 'Student Report Card',
    titleStyle: { ...defaultSectionStyle, fontSize: '1.2em', fontWeight: 'bold', textAlign: 'center', padding: '4px 24px', margin: '16px auto', backgroundColor: '#003366', color: '#ffffff', borderRadius: '9999px' },
    showStudentPhoto: false,
    studentPhotoStyle: { opacity: 100, borderRadius: '8px', width: '100px', height: '100px' },
    showBarcode: false,
    
    studentInfoFields: StudentInfoFieldsAvailable.slice(0, 4), // Default to first 4 fields
    studentInfoStyle: { ...defaultSectionStyle, fontSize: '1em', padding: '16px', margin: '0 0 24px 0', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#f9fafb' },
    
    tableStyle: 'striped',
    tableHeaderStyle: { ...defaultSectionStyle, fontWeight: 'bold', color: '#003366' },
    tableBodyStyle: { ...defaultSectionStyle },
    tableCellPadding: '8px',
    
    showTextArea: false,
    textAreaContent: 'Enter your custom text here...',
    textAreaStyle: { ...defaultSectionStyle, padding: '16px', margin: '0 0 24px 0', minHeight: '200px' },
    
    showRemarks: true,
    remarksStyle: { ...defaultSectionStyle, padding: '16px', margin: '0 0 16px 0', border: '1px solid #d1d5db', borderRadius: '4px', backgroundColor: '#f9fafb' },
    
    signatures: [{name:'Form Teacher',showLine:true}, {name:'Principal',showLine:true}],

    signatureStyle: { ...defaultSectionStyle, textAlign: 'center', margin: '48px 0 0 0' },
    footerStyleObj: { ...defaultSectionStyle, padding: '16px 0 0 0', margin: 'auto 0 0 0' },
    
    showStamp: true,
    stampStyle: { opacity: 100, borderRadius: '50%', width: '100px', height: '100px' }
};

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
    initialConfig,
    onSave,
    onCancel,
    pinModal ,
    setPinModal,
    handlePinSuccess
}) => {
    const {selectedSchool,classRooms} = React.useContext(uiContext);
    const [config, setConfig] = useState<TemplateConfig>(() => {
        const type = initialConfig?.templateType || 'Report';
        
        let defaultStudFields = StudentInfoFieldsAvailable.slice(0, 4); // Default to first 4 fields
        let defaultSignatures = ['Form Teacher', 'Principal'];
        let showTable = true;
        let showTextArea = false;
        
        if (type === 'Transcript') {
            defaultStudFields = StudentInfoFieldsAvailable.slice(0, 6); // Show more fields for transcripts
            defaultSignatures = ['Registrar', 'Principal'];

        }else if (type === 'Report') {
            defaultStudFields = StudentInfoFieldsAvailable.slice(0, 5); // Default to first 5 fields
            defaultSignatures = ['Registrar', 'Principal'];

        } else if (type === 'Certificate') {
            defaultStudFields = StudentInfoFieldsAvailable.slice(0, 3); // Show first 3 fields for certificates
            defaultSignatures = ['Instructor', 'Director'];
 
        } else if (type === 'Admission Letter') {
            defaultStudFields = StudentInfoFieldsAvailable.slice(0, 3); // Show first 3 fields for admission letters
            defaultSignatures = ['Principal'];
            showTable = false;
            showTextArea = true;
        } else if (type !== 'Other') {
            // This covers 'Form', 'Other', and any custom types
            defaultStudFields = ['Name', 'Date', 'Reference No', 'Status'];
            defaultSignatures = ['Prepared By', 'Approved By'];
        }

        return {
            ...defaultConfig,
            studentInfoFields: defaultStudFields,
            signatures: defaultSignatures,
            visibleSections: { ...defaultConfig.visibleSections, table: showTable },
            showTextArea,
            ...initialConfig
        };
    });

    const [activeTab, setActiveTab] = useState<'general' | 'sections' | 'header' | 'title' | 'student' | 'table' | 'content' | 'footer' | 'watermark'>('general');
    const previewContainerRef = React.useRef<HTMLDivElement>(null);
    const [scaleFactor, setScaleFactor] = useState(0.8);
    const [zoomMode, setZoomMode] = useState < 'fit' | 'manual' > ('fit');

    const mockData = config.templateType === "Report" ? 
        generateStudentReportData(studentMockReportData,selectedSchool,classRooms) : {}
    
    React.useEffect(() => {
        const container = previewContainerRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(entries => {
            if (zoomMode !== 'fit') return;
            for (let entry of entries) {
                const availableWidth = entry.contentRect.width;
                const availableHeight = entry.contentRect.height;
                // A4 width in px (approx 210mm = 794px, 297mm = 1123px)
                const targetWidth = config.orientation === 'landscape' ? 1123 : 794;
                const targetHeight = config.orientation === 'landscape' ? 794 : 1123;
                // Add some padding (e.g. 80px)
                const scaleX = (availableWidth - 80) / targetWidth;
                const scaleY = (availableHeight - 80) / targetHeight;
                const newScale = Math.min(scaleX, scaleY, 1.5);
                setScaleFactor(newScale > 0.1 ? newScale : 0.1);
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [config.orientation, zoomMode]);

    const handleZoomIn = () => {
        setZoomMode('manual');
        setScaleFactor(s => Math.min(3, s + 0.1));
    };

    const handleZoomOut = () => {
        setZoomMode('manual');
        setScaleFactor(s => Math.max(0.1, s - 0.1));
    };

    const handleSave = React.useCallback(() => {
        const htmlString = ReactDOMServer.renderToStaticMarkup(
            <TemplatePreview config={config} tempData={mockData} selectedSchool={selectedSchool} exportMode={true} />

        );
        onSave(config, htmlString);
        // console.log('config: ', config);
    }, [config, onSave]);
    

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                handleSave();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel, handleSave]);

    const handleZoomFit = () => {
        setZoomMode('fit');
        // The ResizeObserver will trigger and set the correct scale
        // But we can also force a resize event or just let the observer handle it
        // To be safe, we can manually calculate it here too
        const container = previewContainerRef.current;
        if (container) {
            const availableWidth = container.clientWidth;
            const availableHeight = container.clientHeight;
            const targetWidth = config.orientation === 'landscape' ? 1123 : 794;
            const targetHeight = config.orientation === 'landscape' ? 794 : 1123;
            const scaleX = (availableWidth - 80) / targetWidth;
            const scaleY = (availableHeight - 80) / targetHeight;
            const newScale = Math.min(scaleX, scaleY, 1.5);
            setScaleFactor(newScale > 0.1 ? newScale : 0.1);
        }
    };

    const handleChange = (key: keyof TemplateConfig, value: any) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const tabs = [
        { id: 'general', label: 'General', icon: 'fa-sliders' },
        { id: 'sections', label: 'Sections', icon: 'fa-layer-group' },
        { id: 'header', label: 'Header', icon: 'fa-heading' },
        { id: 'title', label: 'Title', icon: 'fa-text-width' },
        { id: 'student', label: 'Student Info', icon: 'fa-user-graduate' },
        { id: 'table', label: 'Table', icon: 'fa-table' },
        { id: 'content', label: 'Custom Content', icon: 'fa-align-left' },
        { id: 'footer', label: 'Footer', icon: 'fa-signature' },
        { id: 'watermark', label: 'Watermark', icon: 'fa-stamp' }
    ] as const;
     const editorContent = (
        <div className="fixed inset-0 z-[100] bg-gray-900 flex flex-col w-screen h-screen overflow-hidden">
            <PinModal isOpen={pinModal} onClose={() => setPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Saving Changes" />

            {/* Top Header */}
            <div className="h-14 bg-white border-b border-gray-200 px-6 flex items-center justify-between  shrink-0">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-navy-900">Template Editor</h2>
                    {/* Zoom Controls */}
                    <div className="hidden lg:flex items-center gap-2 ml-8 bg-gray-100 rounded-lg p-1">
                        <button onClick={handleZoomOut} className="p-1.5 hover:bg-white rounded text-gray-600 transition-colors"><i className="fa-solid fa-minus"></i></button>
                        <span className="text-sm font-medium w-12 text-center">{Math.round(scaleFactor * 100)}%</span>
                        <button onClick={handleZoomIn} className="p-1.5 hover:bg-white rounded text-gray-600 transition-colors"><i className="fa-solid fa-plus"></i></button>
                        <button onClick={handleZoomFit} className={`p-1.5 rounded text-xs font-bold transition-colors ml-2 ${zoomMode === 'fit' ? 'bg-white text-navy-600 shadow-sm' : 'hover:bg-white text-gray-600'}`}>FIT</button>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-1/3">
                    <Button variant="outline" onClick={onCancel}>Cancel</Button>
                    <Button onClick={handleSave}>Save Template</Button>
                </div>
            </div>

            {/* Screen Size Warning */}
            <div className="lg:hidden bg-yellow-100 text-yellow-800 p-3 text-sm text-center font-medium shrink-0">
                <i className="fa-solid fa-triangle-exclamation mr-2"></i>
                For the best editing experience, please use a larger screen (1024px or wider).
            </div>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                 {/* Left Pane: Controls */}
                <div className="w-full lg:w-1/3 xl:w-1/4 bg-white border-r border-gray-200 flex flex-col h-[50vh] lg:h-full shrink-0">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
                        <h3 className="text-lg font-bold text-navy-900">Template Editors(Tools)</h3>
                    </div>
                    
                    {/* Tabs */}
                    <div className="flex overflow-x-auto border-b border-gray-200 shrink-0 custom-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab.id ? 'border-navy-600 text-navy-600 bg-navy-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                            >
                                <i className={`fa-solid ${tab.icon}`}></i> {tab.label}
                            </button>
                        ))}
                    </div>
                    {/* tabs sections  */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Orientation</label>
                                    <select value={config.orientation || 'portrait'} onChange={(e) => handleChange('orientation', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-navy-500">
                                        <option value="portrait">Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Primary Color</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={config.primaryColor} onChange={(e) => handleChange('primaryColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                                            <span className="text-xs text-gray-500 uppercase">{config.primaryColor}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Border Color</label>
                                        <div className="flex items-center gap-2">
                                            <input type="color" value={config.borderColor} onChange={(e) => handleChange('borderColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                                            <span className="text-xs text-gray-500 uppercase">{config.borderColor}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Global Font Family</label>
                                    <select value={config.globalFontFamily} onChange={(e) => handleChange('globalFontFamily', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-navy-500">
                                        <option value="Arial">Arial</option>
                                        <option value="'Times New Roman'">Times New Roman</option>
                                        <option value="'Courier New'">Courier New</option>
                                        <option value="Georgia">Georgia</option>
                                        <option value="Verdana">Verdana</option>
                                    </select>
                                </div>
                                <SectionStyleEditor 
                                    label="Document Container" 
                                    value={config.containerStyle} 
                                    onChange={(val) => handleChange('containerStyle', val)} 
                                />
                            </div>
                        )}

                        {activeTab === 'sections' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Visible Sections</h3>
                                <div className="space-y-4">
                                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={config.visibleSections.header} onChange={(e) => handleChange('visibleSections', { ...config.visibleSections, header: e.target.checked })} className="w-5 h-5 text-navy-600 rounded" />
                                        <span className="font-medium text-gray-700">Show Header</span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={config.visibleSections.title} onChange={(e) => handleChange('visibleSections', { ...config.visibleSections, title: e.target.checked })} className="w-5 h-5 text-navy-600 rounded" />
                                        <span className="font-medium text-gray-700">Show Title</span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={config.visibleSections.studentInfo} onChange={(e) => handleChange('visibleSections', { ...config.visibleSections, studentInfo: e.target.checked })} className="w-5 h-5 text-navy-600 rounded" />
                                        <span className="font-medium text-gray-700">Show Student Info</span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={config.visibleSections.table} onChange={(e) => handleChange('visibleSections', { ...config.visibleSections, table: e.target.checked })} className="w-5 h-5 text-navy-600 rounded" />
                                        <span className="font-medium text-gray-700">Show Academic Table</span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={config.showTextArea} onChange={(e) => handleChange('showTextArea', e.target.checked)} className="w-5 h-5 text-navy-600 rounded" />
                                        <span className="font-medium text-gray-700">Show Custom Content Area</span>
                                    </label>
                                    <label className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" checked={config.visibleSections.footer} onChange={(e) => handleChange('visibleSections', { ...config.visibleSections, footer: e.target.checked })} className="w-5 h-5 text-navy-600 rounded" />
                                        <span className="font-medium text-gray-700">Show Footer</span>
                                    </label>
                                </div>
                            </div>
                        )}

                        {activeTab === 'header' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Header Layout</label>
                                    <select value={config.logoPosition} onChange={(e) => handleChange('logoPosition', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-navy-500">
                                        <option value="left">Logo Left</option>
                                        <option value="right">Logo Right</option>
                                        <option value="center">Logo Center</option>
                                        <option value="double">Double Logo (Left & Right)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Header Style</label>
                                    <select value={config.headerStyle} onChange={(e) => handleChange('headerStyle', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-navy-500">
                                        <option value="standard">Standard (Single Line)</option>
                                        <option value="classic">Classic (Double Line)</option>
                                        <option value="modern">Modern (Tinted Background)</option>
                                    </select>
                                </div>
                                
                                <SectionStyleEditor label="Primary Name" value={config.schoolNameStyle} onChange={(val) => handleChange('schoolNameStyle', val)} />

                                <SectionStyleEditor label="Secondary Name" value={config.schoolNameSecondaryStyle} onChange={(val) => handleChange('schoolNameSecondaryStyle', val)} />

                                <SectionStyleEditor label="Header Text" value={config.headerStyleObj} onChange={(val) => handleChange('headerStyleObj', val)} />
                                
                                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                                    <h4 className="font-bold text-sm text-gray-700">Logo Styles</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Opacity (%)</label>
                                            <input type="range" min="10" max="100" value={config.logoStyle.opacity} onChange={(e) => handleChange('logoStyle', { ...config.logoStyle, opacity: parseInt(e.target.value) })} className="w-full" />
                                            <div className="text-xs text-center mt-1">{config.logoStyle.opacity}%</div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Border Radius</label>
                                            <Input value={config.logoStyle.borderRadius} onChange={(e) => handleChange('logoStyle', { ...config.logoStyle, borderRadius: e.target.value })} placeholder="e.g. 50% or 8px" className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Width</label>
                                            <Input value={config.logoStyle.width} onChange={(e) => handleChange('logoStyle', { ...config.logoStyle, width: e.target.value })} placeholder="e.g. 64px" className="text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Height</label>
                                            <Input value={config.logoStyle.height} onChange={(e) => handleChange('logoStyle', { ...config.logoStyle, height: e.target.value })} placeholder="e.g. 64px" className="text-sm" />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-600 mb-1">Border</label>
                                            <Input value={config.logoStyle.border || ''} onChange={(e) => handleChange('logoStyle', { ...config.logoStyle, border: e.target.value })} placeholder="e.g. 2px solid #000" className="text-sm" />
                                        </div>
                                    </div>
                                </div>

                                <hr className="border-gray-200" />
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={config.showSeparator ?? false} onChange={(e) => handleChange('showSeparator', e.target.checked)} className="rounded text-navy-600" />
                                    <span className="text-sm font-bold text-gray-700">Show Separator Line Below Header</span>
                                </label>
                                {config.showSeparator && (
                                    <SectionStyleEditor label="Separator Style" value={config.separatorStyle || {
                                        fontFamily: 'inherit',
                                        fontSize: '14px',
                                        color: '#000000',
                                        fontWeight: 'normal',
                                        fontStyle: 'normal',
                                        textAlign: 'left',
                                        border: '1px solid #000000',
                                        margin: '10px 0'
                                    }} onChange={(val) => handleChange('separatorStyle', val)} />
                                )}
                            </div>
                        )}

                        {activeTab === 'title' && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Document Title</label>
                                    <Input value={config.documentTitle} onChange={(e) => handleChange('documentTitle', e.target.value)} />
                                </div>
                                
                                <SectionStyleEditor label="Title" value={config.titleStyle} onChange={(val) => handleChange('titleStyle', val)} />
                                
                                <hr className="border-gray-200" />
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={config.showTitleSeparator ?? false} onChange={(e) => handleChange('showTitleSeparator', e.target.checked)} className="rounded text-navy-600" />
                                    <span className="text-sm font-bold text-gray-700">Show Separator Line Below Title</span>
                                </label>
                                {config.showTitleSeparator && (
                                    <SectionStyleEditor label="Title Separator Style" value={config.titleSeparatorStyle || {
                                        fontFamily: 'inherit',
                                        fontSize: '14px',
                                        color: '#000000',
                                        fontWeight: 'normal',
                                        fontStyle: 'normal',
                                        textAlign: 'left',
                                        border: '1px solid #000000',
                                        margin: '10px 0'
                                    }} onChange={(val) => handleChange('titleSeparatorStyle', val)} />
                                )}
                            </div>
                        )}

                        {activeTab === 'student' && (
                            <div className="space-y-6">
                                <div>
                                    <MultiSelectDropdown 
                                        label="Student Info Fields (Select Multiple)"
                                        items={StudentInfoFieldsAvailable.map(field => ({id: field, name: field})) || []}
                                        selectedIds={config.studentInfoFields || []}
                                        onChange={(ids) => handleChange('studentInfoFields', ids)}
                                        placeholder="Selected Fields..."
                                    />
                                </div>
                                <SectionStyleEditor label="Student Info" value={config.studentInfoStyle} onChange={(val) => handleChange('studentInfoStyle', val)} />
                                
                                
                                <hr className="border-gray-200" />
                                <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={config.showStudentPhoto} onChange={(e) => handleChange('showStudentPhoto', e.target.checked)} className="rounded text-navy-600" />
                                        <span className="text-sm font-bold text-gray-700">Show Student Photo Placeholder (Right)</span>
                                </label>
                                {config.showStudentPhoto && (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                                        <h4 className="font-bold text-sm text-gray-700">Student Photo Style</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Opacity (%)</label>
                                                <input type="range" min="10" max="100" value={config.studentPhotoStyle?.opacity || 100} onChange={(e) => handleChange('studentPhotoStyle', { ...(config.studentPhotoStyle || {}), opacity: parseInt(e.target.value) })} className="w-full" />
                                                <div className="text-xs text-center mt-1">{config.studentPhotoStyle?.opacity || 100}%</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Border Radius</label>
                                                <Input value={config.studentPhotoStyle?.borderRadius || ''} onChange={(e) => handleChange('studentPhotoStyle', { ...(config.studentPhotoStyle || {}), borderRadius: e.target.value })} placeholder="e.g. 50% or 8px" className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Width</label>
                                                <Input value={config.studentPhotoStyle?.width || ''} onChange={(e) => handleChange('studentPhotoStyle', { ...(config.studentPhotoStyle || {}), width: e.target.value })} placeholder="e.g. 100px" className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Height</label>
                                                <Input value={config.studentPhotoStyle?.height || ''} onChange={(e) => handleChange('studentPhotoStyle', { ...(config.studentPhotoStyle || {}), height: e.target.value })} placeholder="e.g. 100px" className="text-sm" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Border</label>
                                                <Input value={config.studentPhotoStyle?.border || ''} onChange={(e) => handleChange('studentPhotoStyle', { ...(config.studentPhotoStyle || {}), border: e.target.value })} placeholder="e.g. 2px dashed #000" className="text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'table' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Table Style</label>
                                    <select value={config.tableStyle} onChange={(e) => handleChange('tableStyle', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-navy-500">
                                        <option value="striped">Striped Rows</option>
                                        <option value="bordered">Fully Bordered</option>
                                        <option value="minimal">Minimal (Bottom Borders Only)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Cell Padding</label>
                                    <Input value={config.tableCellPadding} onChange={(e) => handleChange('tableCellPadding', e.target.value)} placeholder="e.g. 8px 12px" />
                                </div>
                                <SectionStyleEditor label="Table Header" value={config.tableHeaderStyle} onChange={(val) => handleChange('tableHeaderStyle', val)} />
                                <SectionStyleEditor label="Table Body" value={config.tableBodyStyle} onChange={(val) => handleChange('tableBodyStyle', val)} />
                                
                                <hr className="border-gray-200" />
                                <h4 className="font-bold text-sm text-gray-700">Affective Domain & Skills</h4>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Star Color</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={config.starColor || '#fbbf24'} onChange={(e) => handleChange('starColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer border-0 p-0" />
                                        <span className="text-xs text-gray-500 uppercase">{config.starColor || '#fbbf24'}</span>
                                    </div>
                                </div>
                                <SectionStyleEditor label="Skills Section" value={config.skillsStyle || {
                                    fontFamily: 'inherit',
                                    fontSize: '12px',
                                    color: '#333333',
                                    fontWeight: 'normal',
                                    fontStyle: 'normal',
                                    textAlign: 'left'
                                }} onChange={(val) => handleChange('skillsStyle', val)} />
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="space-y-6">
                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                                    <p className="text-sm text-yellow-700">
                                        This content area replaces or supplements the academic table. It's useful for letters, certificates, or custom forms.
                                        <br/>
                                        <strong>Note:</strong> Make sure "Show Custom Content Area" is enabled in the Sections tab.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Section Title (Optional)</label>
                                    <Input 
                                        value={config.textAreaTitle || ''} 
                                        onChange={(e) => handleChange('textAreaTitle', e.target.value)} 
                                        placeholder="e.g. Admission Details, Academic Performance" 
                                    />
                                    <p className="text-xs text-gray-500 mt-1">A title displayed above the custom content area.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Content (HTML allowed)</label>
                                    <textarea 
                                        value={config.textAreaContent || ''} 
                                        onChange={(e) => handleChange('textAreaContent', e.target.value)}
                                        className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 font-mono text-sm"
                                        placeholder="<p>Dear Parent/Guardian,</p><p>We are pleased to inform you...</p>"
                                    />
                                </div>
                                <SectionStyleEditor label="Content Style" value={config.textAreaStyle || {}} onChange={(val) => handleChange('textAreaStyle', val)} />
                            </div>
                        )}

                        {activeTab === 'footer' && (
                            <div className="space-y-6">
                                <SectionStyleEditor label="Footer Container" value={config.footerStyleObj} onChange={(val) => handleChange('footerStyleObj', val)} />
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={config.showRemarks} onChange={(e) => handleChange('showRemarks', e.target.checked)} className="rounded text-navy-600" />
                                    <span className="text-sm font-bold text-gray-700">Show Remarks Section</span>
                                </label>
                                {config.showRemarks && (
                                    <SectionStyleEditor label="Remarks" value={config.remarksStyle} onChange={(val) => handleChange('remarksStyle', val)} />
                                )}
                                <hr className="border-gray-200" />
                                <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="checkbox" checked={config.showBarcode} onChange={(e) => handleChange('showBarcode', e.target.checked)} className="rounded text-navy-600" />
                                        <span className="text-sm font-bold text-gray-700">Show Barcode Placeholder (Left)</span>
                                </label>
                                {config.showBarcode && (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                                        <h4 className="font-bold text-sm text-gray-700">Barcode Style</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Opacity (%)</label>
                                                <input type="range" min="10" max="100" value={config.barcodeStyle?.opacity || 100} onChange={(e) => handleChange('barcodeStyle', { ...(config.barcodeStyle || {}), opacity: parseInt(e.target.value) })} className="w-full" />
                                                <div className="text-xs text-center mt-1">{config.barcodeStyle?.opacity || 100}%</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Border Radius</label>
                                                <Input value={config.barcodeStyle?.borderRadius || ''} onChange={(e) => handleChange('barcodeStyle', { ...(config.barcodeStyle || {}), borderRadius: e.target.value })} placeholder="e.g. 4px" className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Width</label>
                                                <Input value={config.barcodeStyle?.width || ''} onChange={(e) => handleChange('barcodeStyle', { ...(config.barcodeStyle || {}), width: e.target.value })} placeholder="e.g. 120px" className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Height</label>
                                                <Input value={config.barcodeStyle?.height || ''} onChange={(e) => handleChange('barcodeStyle', { ...(config.barcodeStyle || {}), height: e.target.value })} placeholder="e.g. 40px" className="text-sm" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Border</label>
                                                <Input value={config.barcodeStyle?.border || ''} onChange={(e) => handleChange('barcodeStyle', { ...(config.barcodeStyle || {}), border: e.target.value })} placeholder="e.g. 1px solid #000" className="text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <hr className="border-gray-200" />
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Signatures (Comma separated)</label>
                                    <Input value={config.signatures.join(', ')} onChange={(e) => handleChange('signatures', e.target.value.split(',').map(s => s.trim()))} />
                                </div>
                                <SectionStyleEditor label="Signatures" value={config.signatureStyle} onChange={(val) => handleChange('signatureStyle', val)} />

                                <hr className="border-gray-200" />
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={config.showStamp ?? true} onChange={(e) => handleChange('showStamp', e.target.checked)} className="rounded text-navy-600" />
                                    <span className="text-sm font-bold text-gray-700">Show Official Stamp Placeholder</span>
                                </label>
                                
                                {(config.showStamp ?? true) && (
                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-4">
                                        <h4 className="font-bold text-sm text-gray-700">Stamp Positioning & Style</h4>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Horizontal Position (Left to Right)</label>
                                                <input type="range" min="0" max="100" value={config.stampX ?? 50} onChange={(e) => handleChange('stampX', parseInt(e.target.value))} className="w-full" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Vertical Position (Top to Bottom)</label>
                                                <input type="range" min="0" max="100" value={config.stampY ?? 85} onChange={(e) => handleChange('stampY', parseInt(e.target.value))} className="w-full" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Rotation (Degrees)</label>
                                                <input type="range" min="0" max="360" value={config.stampRotation ?? 345} onChange={(e) => handleChange('stampRotation', parseInt(e.target.value))} className="w-full" />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Opacity (%)</label>
                                                <input type="range" min="10" max="100" value={config.stampStyle?.opacity || 100} onChange={(e) => handleChange('stampStyle', { ...(config.stampStyle || {}), opacity: parseInt(e.target.value) })} className="w-full" />
                                                <div className="text-xs text-center mt-1">{config.stampStyle?.opacity || 100}%</div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Border Radius</label>
                                                <Input value={config.stampStyle?.borderRadius || ''} onChange={(e) => handleChange('stampStyle', { ...(config.stampStyle || {}), borderRadius: e.target.value })} placeholder="e.g. 50% or 8px" className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Width</label>
                                                <Input value={config.stampStyle?.width || ''} onChange={(e) => handleChange('stampStyle', { ...(config.stampStyle || {}), width: e.target.value })} placeholder="e.g. 100px" className="text-sm" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Height</label>
                                                <Input value={config.stampStyle?.height || ''} onChange={(e) => handleChange('stampStyle', { ...(config.stampStyle || {}), height: e.target.value })} placeholder="e.g. 100px" className="text-sm" />
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-xs font-bold text-gray-600 mb-1">Border</label>
                                                <Input value={config.stampStyle?.border || ''} onChange={(e) => handleChange('stampStyle', { ...(config.stampStyle || {}), border: e.target.value })} placeholder="e.g. 2px dashed #000" className="text-sm" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'watermark' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Watermark Type</label>
                                    <select value={config.watermarkType} onChange={(e) => handleChange('watermarkType', e.target.value)} className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-navy-500">
                                        <option value="none">None</option>
                                        <option value="text">Text</option>
                                        <option value="icon">Graduation Icon </option>
                                        <option value="image">Image</option>
                                    </select>
                                </div>

                                {config.watermarkType === 'text' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Watermark Text</label>
                                        <Input value={config.watermarkText} onChange={(e) => handleChange('watermarkText', e.target.value)} />
                                    </div>
                                )}

                                {config.watermarkType === 'image' && (
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Watermark Image</label>
                                        <ImageUpload label="" currentImage={config.watermarkImage} onImageSelected={(url) => handleChange('watermarkImage', url)} />
                                    </div>
                                )}

                                {config.watermarkType !== 'none' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Opacity ({config.watermarkOpacity}%)</label>
                                            <input type="range" min="0" max="100" value={config.watermarkOpacity} onChange={(e) => handleChange('watermarkOpacity', parseInt(e.target.value))} className="w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Rotation ({config.watermarkRotation}°)</label>
                                            <input type="range" min="-180" max="180" value={config.watermarkRotation} onChange={(e) => handleChange('watermarkRotation', parseInt(e.target.value))} className="w-full" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Size ({config.watermarkSize}%)</label>
                                            <input type="range" min="10" max="200" value={config.watermarkSize} onChange={(e) => handleChange('watermarkSize', parseInt(e.target.value))} className="w-full" />
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-2 shrink-0">
                        <Button variant="outline" onClick={onCancel}>Cancel</Button>
                        <Button onClick={handleSave}>Save Template</Button>
                    </div>
                </div>

                {/* Right Pane: Preview */}
                <div ref={previewContainerRef} className="flex-1 bg-gray-200 overflow-auto custom-scrollbar flex justify-center items-start p-8 shadow-inner">
                    <div 
                        // className=""
                        className="bg-white shadow-2xl origin-top "
                        style={{
                            transform: `scale(${scaleFactor})`,
                            // transform: `scale(0.4)`,
                            width: config.orientation === 'landscape' ? '297mm' : '210mm',
                            minHeight: config.orientation === 'landscape' ? '210mm' : '297mm',
                            // marginBottom: `${(1 - scaleFactor) * (config.orientation === 'landscape' ? -794 : -123)}px` // Adjust margin to prevent extra scroll space
                        }}
                    >
                        <TemplatePreview config={config} tempData={mockData} selectedSchool={selectedSchool} />
                    </div>
                </div>
            <div/>
            </div>

        </div>
    );

    return createPortal(editorContent, document.body);
};
