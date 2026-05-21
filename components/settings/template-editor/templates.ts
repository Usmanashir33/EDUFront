import { TemplateConfig } from './types';

export const getDefaultTemplate = (type: string): TemplateConfig => {
    const baseConfig: Partial<TemplateConfig> = {
        orientation: 'portrait',
        primaryColor: '#1e3a8a', // navy-900
        borderColor: '#e5e7eb', // gray-200
        globalFontFamily: "'Inter', sans-serif",
        containerStyle: {
            padding: '2em',
            backgroundColor: '#ffffff',
            fontSize: '14px',
            lineHeight: '1.5',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
        },
        watermarkType: 'none',
        watermarkText: 'CONFIDENTIAL',
        watermarkImage: '',
        watermarkOpacity: 0.1,
        watermarkRotation: -45,
        watermarkSize: 100,
        logoPosition: 'center',
        headerStyle: 'standard',
        headerStyleObj: {
            padding: '1em',
            backgroundColor: 'transparent',
            fontSize: '1em',
            lineHeight: '1.2',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
        },
        documentTitle: 'Document',
        showStudentInfo: true,
        studentInfoFields: ['Name', 'Admission No', 'Class', 'Term', 'Session'],
        studentInfoStyle: {
            padding: '1em',
            backgroundColor: '#f9fafb',
            fontSize: '0.9em',
            lineHeight: '1.5',
            borderRadius: '8px',
            borderWidth: '1px',
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
        },
        showAcademicTable: true,
        academicTableStyle: {
            padding: '0',
            backgroundColor: 'transparent',
            fontSize: '0.9em',
            lineHeight: '1.5',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
        },
        showAttendance: true,
        showRemarks: true,
        signatures: [
            { id: '1', role: 'Class Teacher', name: '', showLine: true },
            { id: '2', role: 'Principal', name: '', showLine: true }
        ],
        footerStyleObj: {
            padding: '1em',
            backgroundColor: 'transparent',
            fontSize: '0.8em',
            lineHeight: '1.5',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
            fontFamily: "'Inter', sans-serif",
            color: '#000000',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'center'
        },
        showStudentPhoto: false,
        studentPhotoStyle: { opacity: 1, borderRadius: '0px', width: '100px', height: '100px' },
        showBarcode: false,
        barcodeStyle: { opacity: 1, borderRadius: '0px', width: '100px', height: '50px' },
        showTitleSeparator: false,
        titleSeparatorStyle: { fontFamily: "'Inter', sans-serif", fontSize: '1em', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left' },
        showSeparator: false,
        separatorStyle: { fontFamily: "'Inter', sans-serif", fontSize: '1em', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' },
        tableStyle: 'minimal',
        tableHeaderStyle: { fontFamily: "'Inter', sans-serif", fontSize: '0.9em', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left' },
        tableBodyStyle: { fontFamily: "'Inter', sans-serif", fontSize: '0.9em', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' },
        tableCellPadding: '8px',
        signatureStyle: { fontFamily: "'Inter', sans-serif", fontSize: '0.9em', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center' },
        footerStyleObj: {
            padding: '1em',
            backgroundColor: 'transparent',
            fontSize: '0.8em',
            lineHeight: '1.5',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
            fontFamily: "'Inter', sans-serif",
            color: '#000000',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'center'
        },
        showStamp: false,
        stampStyle: { opacity: 1, borderRadius: '0px', width: '100px', height: '100px' },
        stampX: 0,
        stampY: 0,
        stampRotation: 0,
        showTextArea: false,
        textAreaTitle: '',
        textAreaContent: '<p>Enter your content here...</p>',
        textAreaStyle: {
            padding: '1em',
            backgroundColor: 'transparent',
            fontSize: '1em',
            lineHeight: '1.6',
            borderRadius: '0px',
            borderWidth: '0px',
            borderColor: '#e5e7eb',
            borderStyle: 'solid',
            fontFamily: "'Inter', sans-serif",
            color: '#000000',
            fontWeight: 'normal',
            fontStyle: 'normal',
            textAlign: 'left'
        },
        visibleSections: {
            header: true,
            studentInfo: true,
            academicTable: true,
            attendance: true,
            remarks: true,
            footer: true,
            textArea: false
        }
    };

    switch (type) {
        case 'Report':
            return {
                ...baseConfig,
                templateType: 'Report',
                documentTitle: 'Terminal Report Card',
                showAcademicTable: true,
                showAttendance: true,
                showRemarks: true,
                showTextArea: false,
            } as TemplateConfig;
        
        case 'Transcript':
            return {
                ...baseConfig,
                templateType: 'Transcript',
                documentTitle: 'Official Transcript',
                showAcademicTable: true,
                showAttendance: false,
                showRemarks: false,
                showTextArea: false,
                studentInfoFields: ['Name', 'Admission No', 'Date of Birth', 'Enrollment Date', 'Graduation Date'],
                signatures: [
                    { id: '1', role: 'Registrar', name: '', showLine: true },
                    { id: '2', role: 'Principal', name: '', showLine: true }
                ]
            } as TemplateConfig;

        case 'Certificate':
            return {
                ...baseConfig,
                templateType: 'Certificate',
                orientation: 'landscape',
                documentTitle: 'Certificate of Completion',
                showStudentInfo: false,
                showAcademicTable: false,
                showAttendance: false,
                showRemarks: false,
                showTextArea: false,
                containerStyle: {
                    ...baseConfig.containerStyle,
                    borderWidth: '10px',
                    borderColor: '#1e3a8a',
                    borderStyle: 'double',
                    padding: '3em'
                },
                signatures: [
                    { id: '1', role: 'Director', name: '', showLine: true },
                    { id: '2', role: 'Principal', name: '', showLine: true }
                ],
                visibleSections: {
                    header: true,
                    studentInfo: false,
                    academicTable: false,
                    attendance: false,
                    remarks: false,
                    footer: true,
                    textArea: false
                }
            } as TemplateConfig;

        case 'Admission Letter':
            return {
                ...baseConfig,
                templateType: 'Form',
                documentTitle: 'Provisional Admission Letter',
                showStudentInfo: true,
                studentInfoFields: ['Name', 'Admission No', 'Class Admitted To', 'Session'],
                showAcademicTable: false,
                showAttendance: false,
                showRemarks: false,
                showTextArea: true,
                textAreaTitle: 'Offer of Admission',
                textAreaContent: '<p>Dear Parent/Guardian,</p><p>We are pleased to offer your ward admission into our esteemed institution...</p>',
                signatures: [
                    { id: '1', role: 'Admissions Officer', name: '', showLine: true }
                ],
                visibleSections: {
                    header: true,
                    studentInfo: true,
                    academicTable: false,
                    attendance: false,
                    remarks: false,
                    footer: true,
                    textArea: true
                }
            } as TemplateConfig;

        case 'Form':
        default:
            return {
                ...baseConfig,
                templateType: type as any,
                documentTitle: 'Official Form',
                showAcademicTable: false,
                showAttendance: false,
                showRemarks: false,
                showTextArea: true,
                textAreaTitle: 'Details',
                visibleSections: {
                    header: true,
                    studentInfo: true,
                    academicTable: false,
                    attendance: false,
                    remarks: false,
                    footer: true,
                    textArea: true
                }
            } as TemplateConfig;
    }
};
