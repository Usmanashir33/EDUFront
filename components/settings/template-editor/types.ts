export interface SectionStyle {
    fontFamily: string;
    fontSize: string;
    color: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    padding?: string;
    margin?: string;
    border?: string;
    borderRadius?: string;
    backgroundColor?: string;
    boxShadow?: string;
    minHeight?: string;
}

export interface LogoStyle {
    opacity: number;
    borderRadius: string;
    width: string;
    height: string;
    border?: string;
    left?: string;
    bottom?: string;
    top?: string;
    right?: string;
    transform?: string;
}

export interface TemplateData {
    schoolName: string;
    schoolNameSecondary?: string;
    schoolAddress: string;
    schoolContact: string;
    schoolLogo?: string;
    schoolLogo2?: string;
}

export interface TemplateConfig {
    templateType: 'Form' | 'Report' | 'Transcript' | 'Certificate' | 'Other';
    orientation?: 'portrait' | 'landscape';
    visibleSections?: Record<string, boolean>;

    // General
    primaryColor: string;
    borderColor: string;
    globalFontFamily: string;
    containerStyle: SectionStyle;

    // Watermark
    watermarkType: 'text' | 'image' | "icon" | 'none';
    watermarkText: string;
    watermarkImage: string;
    watermarkOpacity: number;
    watermarkRotation: number;
    watermarkSize: number;

    // Header
    logoPosition: 'left' | 'center' | 'right' | 'double';
    headerStyle: 'standard' | 'modern' | 'classic';

    // Styles
    headerStyleObj: SectionStyle;
    schoolNameStyle: SectionStyle;
    schoolNameSecondaryStyle: SectionStyle;
    logoStyle: LogoStyle;

    // Document Title
    documentTitle: string;
    titleStyle: SectionStyle;
    showStudentPhoto: boolean;
    studentPhotoStyle?: LogoStyle;
    showBarcode: boolean;
    barcodeStyle?: LogoStyle;

    // Title Separator
    showTitleSeparator?: boolean;
    titleSeparatorStyle?: SectionStyle;

    // Student Info
    studentInfoFields: string[];
    studentInfoStyle: SectionStyle;

    // Separator
    showSeparator?: boolean;
    separatorStyle?: SectionStyle;

    // Table
    tableStyle: 'minimal' | 'striped' | 'bordered';
    tableHeaderStyle: SectionStyle;
    tableBodyStyle: SectionStyle;
    tableCellPadding: string;

    // Custom Text Area
    showTextArea?: boolean;
    textAreaTitle?: string;
    textAreaContent?: string;
    textAreaStyle?: SectionStyle;

    // Skills / Domains
    skillsStyle?: SectionStyle;
    starColor?: string;

    // Remarks
    showRemarks: boolean;
    remarksStyle: SectionStyle;

    // Signatures
    signatures: { name: string; showLine: boolean }[];
    signatureStyle: SectionStyle;
    footerStyleObj: SectionStyle;

    // Stamp
    showStamp?: boolean;
    stampStyle?: LogoStyle;
    stampX?: number;
    stampY?: number;
    stampRotation?: number;
}
