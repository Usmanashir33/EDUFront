import { TemplateConfig } from './types';

export const getDefaultTemplate = (type: string): TemplateConfig => {

    // const baseConfigs: Partial<TemplateConfig> = {
    //     orientation: 'portrait',
    //     primaryColor: '#1e3a8a', // navy-900
    //     borderColor: '#e5e7eb', // gray-200
    //     globalFontFamily: "'Inter', sans-serif",
    //     containerStyle: {
    //         padding: '2em',
    //         backgroundColor: '#ffffff',
    //         fontSize: '14px',
    //         lineHeight: '1.5',
    //         borderRadius: '0px',
    //         borderWidth: '0px',
    //         borderColor: '#e5e7eb',
    //         borderStyle: 'solid',
    //     },
    //     watermarkType: 'none',
    //     watermarkText: 'CONFIDENTIAL',
    //     watermarkImage: '',
    //     watermarkOpacity: 0.1,
    //     watermarkRotation: -45,
    //     watermarkSize: 100,
    //     logoPosition: 'center',
    //     headerStyle: 'standard',
    //     headerStyleObj: {
    //         padding: '1em',
    //         backgroundColor: 'transparent',
    //         fontSize: '1em',
    //         lineHeight: '1.2',
    //         borderRadius: '0px',
    //         borderWidth: '0px',
    //         borderColor: '#e5e7eb',
    //         borderStyle: 'solid',
    //     },
    //     documentTitle: 'Document',
    //     showStudentInfo: true,
    //     studentInfoFields: ['Name', 'Admission No', 'Class', 'Term', 'Session'],
    //     studentInfoStyle: {
    //         padding: '1em',
    //         backgroundColor: '#f9fafb',
    //         fontSize: '0.9em',
    //         lineHeight: '1.5',
    //         borderRadius: '8px',
    //         borderWidth: '1px',
    //         borderColor: '#e5e7eb',
    //         borderStyle: 'solid',
    //     },
    //     showAcademicTable: true,
    //     academicTableStyle: {
    //         padding: '0',
    //         backgroundColor: 'transparent',
    //         fontSize: '0.9em',
    //         lineHeight: '1.5',
    //         borderRadius: '0px',
    //         borderWidth: '0px',
    //         borderColor: '#e5e7eb',
    //         borderStyle: 'solid',
    //     },
    //     showAttendance: true,
    //     showRemarks: true,
    //     signatures: [
    //         { id: '1', role: 'Class Teacher', name: '', showLine: true },
    //         { id: '2', role: 'Principal', name: '', showLine: true }
    //     ],
    //     footerStyleObj: {
    //         padding: '1em',
    //         backgroundColor: 'transparent',
    //         fontSize: '0.8em',
    //         lineHeight: '1.5',
    //         borderRadius: '0px',
    //         borderWidth: '0px',
    //         borderColor: '#e5e7eb',
    //         borderStyle: 'solid',
    //         fontFamily: "'Inter', sans-serif",
    //         color: '#000000',
    //         fontWeight: 'normal',
    //         fontStyle: 'normal',
    //         textAlign: 'center'
    //     },
    //     showStudentPhoto: false,
    //     studentPhotoStyle: { opacity: 1, borderRadius: '0px', width: '100px', height: '100px' },
    //     showBarcode: false,
    //     barcodeStyle: { opacity: 1, borderRadius: '0px', width: '100px', height: '50px' },
    //     showTitleSeparator: false,
    //     titleSeparatorStyle: { fontFamily: "'Inter', sans-serif", fontSize: '1em', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left' },
    //     showSeparator: false,
    //     separatorStyle: { fontFamily: "'Inter', sans-serif", fontSize: '1em', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' },
    //     tableStyle: 'minimal',
    //     tableHeaderStyle: { fontFamily: "'Inter', sans-serif", fontSize: '0.9em', color: '#000000', fontWeight: 'bold', fontStyle: 'normal', textAlign: 'left' },
    //     tableBodyStyle: { fontFamily: "'Inter', sans-serif", fontSize: '0.9em', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'left' },
    //     tableCellPadding: '8px',
    //     signatureStyle: { fontFamily: "'Inter', sans-serif", fontSize: '0.9em', color: '#000000', fontWeight: 'normal', fontStyle: 'normal', textAlign: 'center' },
    //     footerStyleObj: {
    //         padding: '1em',
    //         backgroundColor: 'transparent',
    //         fontSize: '0.8em',
    //         lineHeight: '1.5',
    //         borderRadius: '0px',
    //         borderWidth: '0px',
    //         borderColor: '#e5e7eb',
    //         borderStyle: 'solid',
    //         fontFamily: "'Inter', sans-serif",
    //         color: '#000000',
    //         fontWeight: 'normal',
    //         fontStyle: 'normal',
    //         textAlign: 'center'
    //     },
    //     showStamp: false,
    //     stampStyle: { opacity: 1, borderRadius: '0px', width: '100px', height: '100px' },
    //     stampX: 0,
    //     stampY: 0,
    //     stampRotation: 0,
    //     showTextArea: false,
    //     textAreaTitle: '',
    //     textAreaContent: '<p>Enter your content here...</p>',
    //     textAreaStyle: {
    //         padding: '1em',
    //         backgroundColor: 'transparent',
    //         fontSize: '1em',
    //         lineHeight: '1.6',
    //         borderRadius: '0px',
    //         borderWidth: '0px',
    //         borderColor: '#e5e7eb',
    //         borderStyle: 'solid',
    //         fontFamily: "'Inter', sans-serif",
    //         color: '#000000',
    //         fontWeight: 'normal',
    //         fontStyle: 'normal',
    //         textAlign: 'left'
    //     },
    //     visibleSections: {
    //         header: true,
    //         studentInfo: true,
    //         academicTable: true,
    //         attendance: true,
    //         remarks: true,
    //         footer: true,
    //         textArea: false
    //     }
    // };

    const baseConfig: Partial<TemplateConfig> = {
        // ── Core Identity ──────────────────────────────────────────
        templateType: "Report",
        documentTitle: "Report Sheet",
        orientation: "portrait",
        primaryColor: "#0a1628",
        borderColor: "#c9a84c",
        globalFontFamily: "Georgia",

        // ── Watermark ──────────────────────────────────────────────
        watermarkType: "icon",
        watermarkText: "AUA",
        watermarkImage: "",
        watermarkOpacity: 5,
        watermarkRotation: 0,
        watermarkSize: 120,

        // ── Logo ───────────────────────────────────────────────────
        logoPosition: "left",
        logoStyle: {
            borderRadius: "5%",
            height: "100px",
            opacity: 100,
            width: "100px",
        },

        // ── Header ─────────────────────────────────────────────────
        headerStyle: "classic",
        headerStyleObj: {
            backgroundColor: "#0a1628",
            border: "0 0 3px 0 solid #c9a84c",
            borderRadius: "",
            boxShadow: "0 4px 16px rgba(10,22,40,0.18)",
            color: "#f5f0e8",
            fontFamily: "inherit",
            fontSize: "1em",
            fontStyle: "normal",
            fontWeight: "normal",
            margin: "0 0 24px 0",
            padding: "20px 24px",
            textAlign: "center",
        },

        // ── School Name ────────────────────────────────────────────
        schoolNameStyle: {
            backgroundColor: "",
            border: "",
            borderRadius: "",
            boxShadow: "",
            color: "#f5f0e8",
            fontFamily: "Georgia",
            fontSize: "1.6em",
            fontStyle: "normal",
            fontWeight: "bold",
            margin: "",
            padding: "",
            textAlign: "center",
        },
        schoolNameSecondaryStyle: {
            backgroundColor: "",
            border: "",
            borderRadius: "",
            boxShadow: "",
            color: "#c9a84c",
            fontFamily: "Georgia",
            fontSize: "14px",
            fontStyle: "italic",
            fontWeight: "normal",
            margin: "",
            padding: "",
            textAlign: "center",
        },

        // ── Title Pill ─────────────────────────────────────────────
        titleStyle: {
            backgroundColor: "#c9a84c",
            border: "",
            borderRadius: "9999px",
            boxShadow: "0 2px 12px rgba(201,168,76,0.30)",
            color: "#0a1628",
            fontFamily: "Georgia",
            fontSize: "1.1em",
            fontStyle: "normal",
            fontWeight: "bold",
            margin: "-10px 10vw",
            padding: "6px 32px",
            textAlign: "center",
        },

        // ── Student Info Block ─────────────────────────────────────
        showStudentPhoto: false,
        studentPhotoStyle: {
            borderRadius: "8px",
            height: "120px",
            opacity: 100,
            width: "120px",
        },
        studentInfoFields: [
            "name",
            "admissionNo",
            "gender",
            "positionInClass",
            "term",
            "classRoom",
        ],
        studentInfoStyle: {
            backgroundColor: "#f5f0e8",
            border: "1px solid #c9a84c",
            borderRadius: "6px",
            boxShadow: "0 1px 6px rgba(201,168,76,0.10)",
            color: "#0a1628",
            fontFamily: "Georgia",
            fontSize: "1em",
            fontStyle: "normal",
            fontWeight: "normal",
            margin: "0 0 24px 0",
            padding: "16px",
            textAlign: "left",
        },

        // ── Table ──────────────────────────────────────────────────
        tableStyle: "bordered",
        tableCellPadding: "9px",
        tableHeaderStyle: {
            backgroundColor: "",
            border: "",
            borderRadius: "",
            boxShadow: "",
            color: "#0a1628",
            fontFamily: "Georgia",
            fontSize: "1em",
            fontStyle: "normal",
            fontWeight: "bold",
            margin: "",
            padding: "",
            textAlign: "left",
        },
        tableBodyStyle: {
            backgroundColor: "",
            border: "",
            borderRadius: "",
            boxShadow: "",
            color: "#1a1a2e",
            fontFamily: "Georgia",
            fontSize: "0.97em",
            fontStyle: "normal",
            fontWeight: "normal",
            margin: "",
            padding: "",
            textAlign: "left",
        },

        // ── Separator ──────────────────────────────────────────────
        showSeparator: false,
        separatorStyle: {
            border: "1px solid #c9a84c",
            color: "#c9a84c",
            fontFamily: "inherit",
            fontSize: "14px",
            fontStyle: "normal",
            fontWeight: "normal",
            margin: "10px 0",
            textAlign: "left",
        },

        // ── Remarks ────────────────────────────────────────────────
        showRemarks: true,
        remarksStyle: {
            backgroundColor: "#f5f0e8",
            border: "1px solid #c9a84c",
            borderRadius: "6px",
            boxShadow: "",
            color: "#0a1628",
            fontFamily: "Georgia",
            fontSize: "inherit",
            fontStyle: "italic",
            fontWeight: "normal",
            margin: "0 0 16px 0",
            padding: "16px",
            textAlign: "left",
        },

        // ── Skills ─────────────────────────────────────────────────
        skillsStyle: {
            color: "#0a1628",
            fontFamily: "Georgia",
            fontSize: "1em",
            fontStyle: "normal",
            fontWeight: "normal",
            textAlign: "center",
        },

        // ── Signatures ─────────────────────────────────────────────
        signatures: ["Registrar", "Principal"],
        signatureStyle: {
            backgroundColor: "",
            border: "",
            borderRadius: "",
            boxShadow: "",
            color: "#0a1628",
            fontFamily: "Georgia",
            fontSize: "inherit",
            fontStyle: "normal",
            fontWeight: "normal",
            margin: "48px 0 0 0",
            padding: "",
            textAlign: "center",
        },

        // ── Stamp ──────────────────────────────────────────────────
        showStamp: true,
        stampRotation: 360,
        stampX: 52,
        stampY: 62,
        stampStyle: {
            borderRadius: "50%",
            height: "100px",
            opacity: 22,
            width: "100px",
        },

        // ── Barcode ────────────────────────────────────────────────
        showBarcode: true,
        barcodeStyle: {
            height: "120px",
            width: "120px",
        },

        // ── Footer ─────────────────────────────────────────────────
        footerStyleObj: {
            backgroundColor: "transparent",
            border: "",
            borderRadius: "",
            boxShadow: "",
            color: "#0a1628",
            fontFamily: "Georgia",
            fontSize: "inherit",
            fontStyle: "normal",
            fontWeight: "normal",
            margin: "auto 0 0 0",
            padding: "16px 0 0 0",
            textAlign: "left",
        },

        // ── Container ──────────────────────────────────────────────
        containerStyle: {
            backgroundColor: "#fffdf7",
            border: "1px solid #c9a84c",
            borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(10,22,40,0.10)",
            color: "#0a1628",
            fontFamily: "Georgia",
            fontSize: "1em",
            fontStyle: "normal",
            fontWeight: "normal",
            margin: "0 auto",
            padding: "40px",
            textAlign: "left",
        },

        // ── Text Area (preserved, unused in Report) ────────────────
        showTextArea: false,
        textAreaContent: "Enter your custom text here...",
        textAreaStyle: {
            backgroundColor: "",
            border: "",
            borderRadius: "",
            boxShadow: "",
            color: "inherit",
            fontFamily: "inherit",
            fontSize: "inherit",
            fontStyle: "normal",
            fontWeight: "normal",
            margin: "0 0 24px 0",
            minHeight: "200px",
            padding: "16px",
            textAlign: "left",
        },

        // ── Visible Sections ───────────────────────────────────────
        visibleSections: {
            footer: true,
            header: true,
            remarks: true,
            signatures: true,
            stamp: true,
            studentInfo: true,
            table: true,
            title: true,
        },
    }




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
