import React ,{useContext} from 'react';
import { TemplateConfig, SectionStyle } from './types';
import urls from '@/customHooks/ServerUrls';
import BarcodeImage from "../template-editor/sampleBarcodeImage.png";
import Barcode from 'react-barcode';
import QRCode from 'react-qr-code';


interface TemplatePreviewProps {
    config: TemplateConfig; 
    tempData? : any;
    selectedSchool? : any
}

export const TemplatePreview: React.FC<TemplatePreviewProps> = ({config,tempData,selectedSchool}) => {
    const {
        templateType,
        primaryColor,
        borderColor,
        globalFontFamily,
        containerStyle,
        watermarkType,
        watermarkText,
        watermarkImage,
        watermarkOpacity,
        watermarkRotation,
        watermarkSize,

        logoPosition,
        headerStyle,
        headerStyleObj,
        schoolNameStyle,
        schoolNameSecondaryStyle,
        logoStyle,
        documentTitle,
        titleStyle,
        showStudentPhoto,
        showBarcode,
        studentInfoFields,
        studentInfoStyle,
        tableStyle,
        tableHeaderStyle,
        tableBodyStyle,
        tableCellPadding,
        showRemarks,
        remarksStyle,
        signatures,
        signatureStyle,
        footerStyleObj
    } = config;
    const resultVerificationPage = window.location.origin + '/resultverification'
    const getStyleString = (style: SectionStyle, isGlobal: boolean = false) => {
        const fontFamily = style.fontFamily === 'inherit' && !isGlobal ? globalFontFamily : style.fontFamily;
        return `
            font-family: ${fontFamily}, sans-serif;
            font-size: ${style.fontSize};
            color: ${style.color || '#333'};
            font-weight: ${style.fontWeight};
            font-style: ${style.fontStyle};
            text-align: ${style.textAlign};
            ${style.padding ? `padding: ${style.padding};` : ''}
            ${style.margin ? `margin: ${style.margin};` : ''}
            ${style.border ? `border: ${style.border};` : ''}
            ${style.borderRadius ? `border-radius: ${style.borderRadius};` : ''}
            ${style.backgroundColor ? `background-color: ${style.backgroundColor};` : ''}
            ${style.boxShadow ? `box-shadow: ${style.boxShadow};` : ''}
        `;
    };
    // Generate pure CSS based on config
    const css = `
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          #report-card-container {
            box-shadow: none !important;
            border-width: 2px !important;
            padding: 8px !important;
            min-height: auto !important;
          }

          table {
            page-break-inside: avoid !important;
          }

          tr {
            page-break-inside: avoid !important;
          }

          .avoid-break {
            page-break-inside: avoid !important;
          }
        }
        .doc-container {
            ${getStyleString(containerStyle, true)}
            position: relative;
            overflow: hidden;
            width: ${config.orientation === 'landscape' ? '297mm' : '210mm'};
            min-height: ${config.orientation === 'landscape' ? '210mm' : '297mm'};
            margin:0 auto;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            
        }
        .doc-header {
            display: flex;
            align-items: center;
            ${getStyleString(headerStyleObj)}
        }
        .doc-header.standard {
            border-bottom: 2px solid ${primaryColor};
        }
        .doc-header.classic {
            border-bottom: 4px double ${primaryColor};
        }
        .doc-header.modern {
            border-bottom: none;
            background-color: ${primaryColor}10;
            padding: 20px;
            border-radius: 8px;
        }
        .doc-logo {
            max-height: ${logoStyle?.height || '80px'};
            max-width: ${logoStyle?.width || '80px'};
            width: ${logoStyle?.width || 'auto'};
            height: ${logoStyle?.height || 'auto'};
            object-fit: contain ; 
            opacity: ${(logoStyle?.opacity || 100) / 100};
            border-radius: ${logoStyle?.borderRadius || '0'};
            ${logoStyle?.border ? `border: ${logoStyle.border};` : ''}
        } 
        .doc-school-info {
            flex: 1 ;
            display: flex ;
            flex-direction: column ;
            justify-content: center ;
        }
        .doc-school-info .center { 
            align-items: center;
            text-align: center;
        }
        .doc-school-info.left {
            align-items: flex-start;
            text-align: left;
        }
        .doc-school-info.right {
            align-items: flex-end;
            text-align: right;
        }
        .doc-school-name {
            margin: 0 0 5px 0;
            ${getStyleString(schoolNameStyle)}
        }
        .doc-school-name-secondary {
            margin: 0 0 5px 0;
            ${getStyleString(schoolNameSecondaryStyle)}
        }
        .doc-school-address, .doc-school-contact {
            margin: 2px 0;
        }
        .doc-watermark-container {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
        }
        .doc-watermark-text {
            transform: rotate(${watermarkRotation}deg) ;
            font-size: ${watermarkSize}px ;
            font-weight: bold ;
            color: ${primaryColor} ;
            opacity: ${watermarkOpacity / 100} ;
            white-space: nowrap ;
        }
        .doc-watermark-image {
            transform: rotate(${watermarkRotation}deg);
            width: ${watermarkSize}%;
            opacity: ${watermarkOpacity / 100};
            object-fit: contain;
        }
        .doc-content {
            position: relative;
            z-index: 1;
            flex: 1;
            display: flex;
            flex-direction: column;

        }
        .doc-title-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 20px;
        }
        .doc-title {
            flex: 1;
            ${getStyleString(titleStyle)}
        }
        .doc-barcode-placeholder {
            width: 120px;
            height: 40px;
            border: 1px dashed ${borderColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            color: #aaa;
            background: #f9f9f9;
        }
        .doc-student-photo {
            width: ${config.studentPhotoStyle?.width || '100px'};
            height: ${config.studentPhotoStyle?.height || '120px'};
            border: ${config.studentPhotoStyle?.border || `1px solid ${borderColor}`};
            border-radius: ${config.studentPhotoStyle?.borderRadius || '0'};
            opacity: ${(config.studentPhotoStyle?.opacity || 100) / 100};
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f9f9f9;
            color: #aaa;
            font-size: 12px;
            overflow: hidden;
        }
        .doc-student-info-container {
            display: flex;
            margin-bottom: 20px;
            gap: 20px;
        }
        .doc-student-info {
            flex: 1;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
            align-content: start;
            ${getStyleString(studentInfoStyle)}
        }
        .doc-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .doc-table th, .doc-table td {
            padding: ${tableCellPadding || '10px'};
        }
        .doc-table th {
            ${getStyleString(tableHeaderStyle)}
            background-color: ${tableStyle === 'bordered' ? primaryColor + '20' : 'transparent'};
        }
        .doc-table td {
            ${getStyleString(tableBodyStyle)}
        }
        .doc-table.bordered th, .doc-table.bordered td {
            border: 1px solid ${borderColor};
        }
        .doc-table.striped tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .doc-table.striped th, .doc-table.striped td {
            border-bottom: 1px solid #eee;
        }
        .doc-table.minimal th {
            border-bottom: 2px solid ${primaryColor};
        }
        .doc-table.minimal td {
            border-bottom: 1px solid #eee;
        }
        .doc-remarks {
            margin-top: 30px;
            ${getStyleString(remarksStyle)}
        }
        .doc-separator {
            ${config.separatorStyle ? getStyleString(config.separatorStyle) : ''}
            width: 100%;
            border-left: none;
            border-right: none;
            border-bottom: none;
        }
        .doc-title-separator {
            ${config.titleSeparatorStyle ? getStyleString(config.titleSeparatorStyle) : ''}
            width: 100%;
            border-left: none;
            border-right: none;
            border-bottom: none;
        }
        .doc-skills {
            ${config.skillsStyle ? getStyleString(config.skillsStyle) : ''}
        }
        .doc-skills table {
            width: 100%;
            border-collapse: collapse;
        }
        .doc-skills tr {
            border-bottom: ${config.skillsStyle?.border || '1px solid #e5e7eb'};
        }
        .doc-skills td {
            padding: 4px 8px;
        }
        .doc-footer {
            display: flex;
            justify-content: space-around;
            flex-wrap: wrap;
            gap: 20px;
            ${getStyleString(footerStyleObj)}
        }
        .doc-signature {
            width: 200px;
            ${getStyleString(signatureStyle)}
        }
        .doc-signature-line {
            border-top: 1px solid ${signatureStyle.color || '#333'};
            margin-bottom: 5px;
        }
        .doc-signature-title {
            /* Inherits from .doc-signature */
        }
        .doc-stamp {
            position: absolute;
            left: ${config.stampX ?? 50}%;
            top: ${config.stampY ?? 85}%;
            transform: translate(-50%, -50%) rotate(${config.stampRotation ?? 345}deg);
            width: ${config.stampStyle?.width || '100px'};
            height: ${config.stampStyle?.height || '100px'};
            border: ${config.stampStyle?.border || `2px dashed ${primaryColor}`};
            border-radius: ${config.stampStyle?.borderRadius || '50%'};
            opacity: ${(config.stampStyle?.opacity || 100) / 100};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${primaryColor};
            z-index: 10;
            pointer-events: none;
        }
        .doc-stamp2 {
            width: ${config.stampStyle?.width || '100px'};
            height: ${config.stampStyle?.height || '100px'};
            border: ${config.stampStyle?.border || `2px dashed ${primaryColor}40`};
            border-radius: ${config.stampStyle?.borderRadius || '50%'};
            opacity: ${(config.stampStyle?.opacity || 100) / 100};
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${primaryColor}40;
            margin: 0 auto;
            position: absolute;
            left: 50%;
            transform: translateX(-50%) translateY(-60px);
            z-index: 0;
        }
    `;

    const renderHeader = () => {   
        const logo1 = <img src={urls.BASE_URL + selectedSchool?.logo    || 'https://picsum.photos/seed/logo1/100/100' }  alt="Logo 1" className="doc-logo" />;
        const logo2 = <img src={urls.BASE_URL + selectedSchool?.logo   || 'https://picsum.photos/seed/logo2/100/100' }  alt="Logo 2" className="doc-logo" />;
        
        let infoAlignmentClass = 'left';
        if (logoPosition === 'center' || logoPosition === 'double') {
            infoAlignmentClass = 'center';
        } else if (logoPosition === 'right') {
            infoAlignmentClass = 'right';
        } else if (logoPosition === 'left') {
            infoAlignmentClass = 'left';
        }

        const info = (
            <div className={`doc-school-info ${infoAlignmentClass}`}>
                <div className="doc-school-name">{selectedSchool?.name}</div>
                {selectedSchool?.name2 && <div className="doc-school-name-secondary">{selectedSchool?.name2}</div>}
                <div className="doc-school-address">{selectedSchool?.address}</div>
                <div className="doc-school-contact">{selectedSchool?.email}|{selectedSchool?.phone}</div>
            </div>
        );

        if (logoPosition === 'center') {
            return (
                <div className={`doc-header ${headerStyle}`} style={{ flexDirection: 'column', textAlign: 'center' }}>
                    <div style={{ marginBottom: '15px' }}>{logo1}</div>
                    {info}
                </div>
            );
        }

        if (logoPosition === 'right') {
            return (
                <div className={`doc-header ${headerStyle}`}>
                    {info}
                    <div style={{ marginLeft: '20px' }}>{logo1}</div>
                </div>
            );
        }

        if (logoPosition === 'double') {
            return (
                <div className={`doc-header ${headerStyle}`}>
                    <div style={{ marginRight: '20px' }}>{logo1}</div>
                    {info}
                    <div style={{ marginLeft: '20px' }}>{logo2}</div>
                </div>
            );
        }

        // Default: left
        return (
            <div className={`doc-header ${headerStyle}`}>
                <div style={{ marginRight: '20px' }}>{logo1}</div>
                {info}
            </div>
        );
    };

    const renderWatermark = () => {
        if (watermarkType === 'none') return null;

        return (
            <div className="doc-watermark-container ">
                {watermarkType === 'text' && watermarkText && (
                    <div className="doc-watermark-text">{watermarkText}</div>
                )}
                {watermarkType === 'icon' && (
                    // <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                    <div className="doc-watermark-text " >
                      <i className={`fa-solid fa-graduation-cap text-[${watermarkSize*4}px]`}></i>
                    </div>
                )}
                {watermarkType === 'image' && watermarkImage && (
                    <img src={watermarkImage} alt="Watermark" className="doc-watermark-image" />
                )}
            </div>
        );
    };

    const renderStudentInfo = () => {
        if (!studentInfoFields || studentInfoFields.length === 0) return null;

        // Mock data based on fields
        const mockData: Record<string, string> = {
            'name': ' John Doe ',
            'Class': 'Grade 10',
            'Term': 'First Term',
            'Admission No': 'STD-2023-001',
            'DOB': '15-May-2008',
            'Gender': 'Male',
            'Date': new Date().toLocaleDateString(),
            'Reference No': 'REF-99823',
            'Status': 'Approved'
        };

        return (
            <div className="doc-student-info-container">
                <div className="doc-student-info  grid grid-cols-4 md:grid-cols-3 gap-2 mb-2 text-sm border border-gray-300 p-4 rounded bg-gray-50/50">
                    {studentInfoFields.map((field, index) => (
                        <div key={index}>
                            <strong>{field}:</strong> {mockData[field] || 'Sample Data'}
                        </div>
                    ))}

                </div>
            </div>
        );
    };

    const renderTitle = (data: any) => {
        return (
            <div className="doc-title-container">
                <div className="doc-title">{documentTitle}</div>
            </div>
        );
    };

    const renderSeparator = () => {
        if (!config.showSeparator) return null;
        return <div className="doc-separator" />;
    };

    const renderTitleSeparator = () => {
        if (!config.showTitleSeparator) return null;
        return <div className="doc-title-separator" />;
    };

    const renderTable = () => {
        if (templateType !== 'Report' && templateType !== 'Transcript' && templateType !== 'Certificate') {
            return (
                <table className={`doc-table ${tableStyle}`}>
                    <thead>
                        <tr>
                            <th>Item No.</th>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>School Uniform (Set)</td>
                            <td>2</td>
                            <td>$45.00</td>
                            <td>$90.00</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Textbooks Package</td>
                            <td>1</td>
                            <td>$120.00</td>
                            <td>$120.00</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Stationery Kit</td>
                            <td>1</td>
                            <td>$25.00</td>
                            <td>$25.00</td>
                        </tr>
                    </tbody>
                </table>
            );
        }

        return (
            <table className={`doc-table ${tableStyle}`}>
                <thead>
                    <tr>
                        <th>Subject</th>
                        <th>Test Score</th>
                        <th>Exam Score</th>
                        <th>Total</th>
                        <th>Grade</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Mathematics</td>
                        <td>35</td>
                        <td>55</td>
                        <td>90</td>
                        <td>A</td>
                    </tr>
                    <tr>
                        <td>English Language</td>
                        <td>30</td>
                        <td>45</td>
                        <td>75</td>
                        <td>B</td>
                    </tr>
                    <tr>
                        <td>Physics</td>
                        <td>28</td>
                        <td>50</td>
                        <td>78</td>
                        <td>B</td>
                    </tr>
                    <tr>
                        <td>Chemistry</td>
                        <td>38</td>
                        <td>58</td>
                        <td>96</td>
                        <td>A+</td>
                    </tr>
                </tbody>
            </table>
        );
    };

    // TEMPLATES for Report Card and Transcript will be similar with slight variations, so we can use same render function with conditional sections
    const renderReportCard = () => {
        const {studentDetails} = tempData

        return (
            <div className="doc-content">
                {config.visibleSections?.header !== false &&
                 renderHeader()
                }
                {renderSeparator()}
                {config.visibleSections?.title !== false && renderTitle(studentDetails.picture)}
                {renderTitleSeparator()}
                {/* Student Info Grid */}
                {config.visibleSections?.studentInfo !== false && (
                    <div className="flex gap-2">
                    <div className="doc-student-info  grid grid-cols-4 md:grid-cols-3 gap-2 mb-2 text-sm border border-red-300 p-4 rounded bg-gray-50/50 w-full   max-h-fit  ">
                        {studentInfoFields.map((field, index) => (
                            <div key={`${index}-${field}`} style={{ display: 'flex', flexDirection: 'column' }}>
                                <span className="block text-xs font-bold text-gray-500 uppercase">{field}</span>
                                <span className="font-bold text-navy-900">{studentDetails[field] || 'Sample Data'} </span> 
                            </div>
                        ))}
                    </div>
                    {showStudentPhoto && (
                    <img  src={urls.BASE_URL + tempData?.studentDetails.picture}
                        className="doc-student-photo object-fit" style={config.studentPhotoStyle ? {
                            opacity: (config.studentPhotoStyle.opacity || 100) / 100,
                            borderRadius: config.studentPhotoStyle.borderRadius,
                            width: config.studentPhotoStyle.width || '100px',
                            height: config.studentPhotoStyle.height || '100px',
                            border: config.studentPhotoStyle.border || '1px dashed #ccc',
                        } : {}}/>  
                    ) }
                    </div>
                )}

                {/* Grades Table */}
                {config.visibleSections?.table !== false && (
                    <div style={{ marginBottom: '32px' }}>
                        <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: primaryColor, textTransform: 'uppercase', borderBottom: `1px solid ${borderColor}`, marginBottom: '8px', paddingBottom: '4px' }}>Academic Performance</h4>
                        <div style={{ borderBottom: `2px solid ${borderColor}`, marginBottom: '8px' }}></div>
                        {/* <table className=""> */}
                        <table className={`w-ful text-sm border-collapse border border-gray-300 doc-table ${tableStyle}`}>
                            <thead>
                                <tr className="bg-navy-50 text-navy-900">
                                <th className="border border-gray-300 px-2 py-1.5 text-left" styele={{textAlign : 'left'}}>Subject (Code)</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">1st CA(20)</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">2nd CA(20)</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Exam (60)</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Total</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Grade</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-left">Remark</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tempData.academics.map((sub: any, i: number) => (
                                <tr key={i} className="even:bg-gray-50/50">
                                    <td className="border border-gray-300 px-2 py-1.5 font-medium" style={{textAlign : 'left'}}>{sub.subject} ({sub.code})</td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">{sub?.ca1Abs? "ABS" : sub.ca1}</td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">{sub?.ca2Abs? "ABS" : sub.ca2}</td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">{sub?.examAbs? "ABS" : sub.exam}</td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-navy-900" style={{fontWeight: 600}}>{sub.total}</td>
                                    <td
                                        className="border border-gray-300 px-3 py-2 text-center"
                                        style={{
                                            fontWeight: 600,
                                            letterSpacing: "0.05em",
                                            color:
                                            sub.grade === "A"
                                                ? "#b91c1cda" // deeper red
                                                : "#15803d", // green
                                        }}
                                        >
                                        {sub.grade}
                                        </td>
                                    <td className="border border-gray-300 px-2 py-1.5 text-xs italic text-gray-600">{sub.remark}</td>
                                </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="w-ful flex justify-between px-4 ">
                          <span className ="text-md "> Average Marks :   <b>{tempData.data.averageMark}%</b> </span> 
                          <span className ="text-md"> Total Marks :    <b>{tempData.data.totalMarks}</b>  </span>
                        </div>
                           
                    </div>
                )}

                {/* Behavioral & Skills Grid */}
                {config.visibleSections?.table !== false && (
                    <div className="" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                        <div>
                            <h4 style={{ fontSize: '1.1em', fontWeight: 'bold', color: primaryColor, textTransform: 'uppercase', borderBottom: `1px solid ${borderColor}`, marginBottom: '8px', paddingBottom: '4px' }}>Affective Domain</h4>
                            <div style={{ borderBottom: `2px solid ${borderColor}`, marginBottom: '8px' }}></div>
                            <table className="w-full text-xs border border-gray-300">
                                <tbody>
                                    {tempData.affective?.map((trait: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-200">
                                        <td className="p-1 pl-2 font-medium">{trait.trait}</td>
                                        <td className="p-1 text-right pr-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <i key={star} className={`fa-solid fa-star mr-0.5 ${star <= trait.rating ? "text-gold-500" : "text-gray-200"}`} ></i>
                                        ))}
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                            </table>
                           
                        </div>
                        <div>
                            <h4 style={{ fontSize: '1.1em', fontWeight: 'bold', color: primaryColor, textTransform: 'uppercase', borderBottom: `1px solid ${borderColor}`, marginBottom: '8px', paddingBottom: '4px' }}>Psychomotor Skills</h4>
                            <div style={{ borderBottom: `2px solid ${borderColor}`, marginBottom: '8px' }}></div>
                            <table className="w-full text-xs border border-gray-300">
                                <tbody>
                                    {tempData.psychomotor.map((skill: any, i: number) => (
                                    <tr key={i} className="border-b border-gray-200">
                                        <td className="p-1 pl-2 font-medium">{skill.skill}</td>
                                        <td className="p-1 text-right pr-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <i key={star} className={`fa-solid fa-star mr-0.5 ${star <= skill.rating ? "text-blue-500" : "text-gray-200"}`} ></i>
                                        ))}
                                        </td>
                                    </tr>
                                    ))}
                                </tbody>
                        </table>
                        </div>
                    </div>
                )}

                {/* Remarks */}
                {showRemarks && config.visibleSections?.footer !== false && (
                    <div className="doc-remarks" >
                        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                            <div className={`font-bold text-md`}>Form Teacher:</div>
                            <div className={`${getStyleString(remarksStyle)}`}>An excellent result. Keep it up.</div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div className={`font-bold text-md`}>Principal:</div>
                            <div className={`${getStyleString(remarksStyle)}`}>Outstanding performance.</div>
                        </div>
                    </div>
                )}

                {/* Footer Signatures */}
                {config.visibleSections?.footer !== false && signatures && signatures.length > 0 && (
                    <div className="doc-footer items-center" style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', position: 'relative' }}>
                        {(showBarcode && !tempData?.data.barcode)&& <img 
                                src={BarcodeImage} 
                                alt="Sample Barcode" 
                                className="doc-barcode-placeholder" 
                                style={config.barcodeStyle && {
                                    opacity: (config.barcodeStyle.opacity || 100) / 100,
                                    borderRadius: config.barcodeStyle.borderRadius,
                                    width: config.barcodeStyle.width || '120px',
                                    height: config.barcodeStyle.height || '40px',
                                    border: config.barcodeStyle.border || '1px solid #ccc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '10px',
                                    letterSpacing: '2px'
                                }}/>
                        }
                        {(showBarcode &&  tempData?.data.barcode)&&
                         <div
                                style={{
                                    opacity: (config.barcodeStyle?.opacity || 100) / 100,
                                    borderRadius: config.barcodeStyle?.borderRadius || "0px",
                                    border: config.barcodeStyle?.border || "1px solid #ccc",
                                    width: config.barcodeStyle?.width || "120px",
                                    height: config.barcodeStyle?.height || "120px",
                                    display: "flex",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    overflow: "hidden",
                                }}
                            >
                                <QRCode
                                    value={`${resultVerificationPage}/?${tempData?.data.barcode}` || ""}
                                    size={
                                        Math.min(
                                            parseInt(config.barcodeStyle?.width || "120"),
                                            parseInt(config.barcodeStyle?.height || "120")
                                        ) - 8
                                    }
                                />
                            </div>
                         } 
                        <div className="relative flex flex-col items-center" >
                            {(config.showStamp ?? true) && (
                                <div className="doc-stamp">
                                    {/* <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', transform: 'rotate(12deg)' }}>Official Stamp</span> */}
                                    <span style={{ }}>Official Stamp</span>
                                </div>
                            )}
                            {signatures.map((sig, index) => (
                                <div key={index} className="doc-signature" style={{ textAlign: 'center', zIndex: 1 }}>
                                    <div className="doc-signature-line" style={{ width: '128px', borderBottom: '1px solid #000', marginBottom: '4px', marginLeft: 'auto', marginRight: 'auto' }}></div>
                                    <p className="doc-signature-title" style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', margin: 0 }}>{sig}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTranscript = () => {
        const mockData: Record<string, string> = {
            'Name': 'Jane Smith',
            'Admission No': 'UNI-2021-890',
            'DOB': '12-Aug-2005',
            'Gender': 'Female',
            'Graduation Year': '2025',
            'Program': 'Bachelor of Science in Computer Science',
            'Faculty': 'Faculty of Engineering',
            'Date of Issue': new Date().toLocaleDateString(),
            'Status': 'Graduated'
        };

        return (
            <div className="doc-content">
                {config.visibleSections?.header !== false && renderHeader()}
                {renderSeparator()}
                {config.visibleSections?.title !== false && renderTitle({})}
                {renderTitleSeparator()}

                {/* Student Info */}
                {config.visibleSections?.studentInfo !== false && (
                    <div className="doc-student-info">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {studentInfoFields.slice(0, Math.ceil(studentInfoFields.length / 2)).map((field, index) => (
                                <div key={index} style={{ display: 'flex' }}>
                                    <span style={{ width: '150px', fontWeight: 'bold', opacity: 0.8 }}>{field}:</span>
                                    <span>{mockData[field] || 'Sample Data'}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {studentInfoFields.slice(Math.ceil(studentInfoFields.length / 2)).map((field, index) => (
                                <div key={index} style={{ display: 'flex' }}>
                                    <span style={{ width: '150px', fontWeight: 'bold', opacity: 0.8 }}>{field}:</span>
                                    <span>{mockData[field] || 'Sample Data'}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Academic Record */}
                {config.visibleSections?.table !== false && (
                    <div style={{ marginBottom: '40px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: primaryColor, borderBottom: `1px solid ${borderColor}`, paddingBottom: '10px', marginBottom: '15px' }}>Academic Record</h3>
                        
                        <div style={{ marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: '#4b5563', marginBottom: '10px' }}>Fall Semester 2023</h4>
                            <table className={`doc-table ${tableStyle}`} style={{ width: '100%', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f3f4f6', color: '#374151' }}>
                                        <th style={{ textAlign: 'left', padding: '8px' }}>Course Code</th>
                                        <th style={{ textAlign: 'left', padding: '8px' }}>Course Title</th>
                                        <th style={{ textAlign: 'center', padding: '8px' }}>Credits</th>
                                        <th style={{ textAlign: 'center', padding: '8px' }}>Grade</th>
                                        <th style={{ textAlign: 'center', padding: '8px' }}>Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>CS101</td>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Introduction to Programming</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>4.0</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>A</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>16.0</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>MATH201</td>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Calculus I</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>3.0</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>B+</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>10.5</td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>ENG105</td>
                                        <td style={{ padding: '8px', borderBottom: '1px solid #e5e7eb' }}>Academic Writing</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>3.0</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>A-</td>
                                        <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #e5e7eb' }}>11.1</td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px', fontSize: '13px', fontWeight: 'bold', color: '#4b5563', marginTop: '10px' }}>
                                <span>Term Credits: 10.0</span>
                                <span>Term GPA: 3.76</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary */}
                {config.visibleSections?.table !== false && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', border: `2px solid ${primaryColor}`, padding: '20px', borderRadius: '8px', backgroundColor: `${primaryColor}05`, marginBottom: '40px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Total Credits Earned</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: primaryColor }}>120.0</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Cumulative GPA</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: primaryColor }}>3.85</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase' }}>Degree Awarded</div>
                            <div style={{ fontSize: '18px', fontWeight: 'bold', color: primaryColor, marginTop: '4px' }}>Bachelor of Science</div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                {config.visibleSections?.footer !== false && (
                    <div className="doc-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', position: 'relative' }}>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            <p>This transcript is unofficial unless signed and stamped.</p>
                            <p>Generated on: {new Date().toLocaleDateString()}</p>
                        </div>
                        {(config.showStamp ?? true) && (
                            <div className="doc-stamp">
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', transform: 'rotate(12deg)' }}>Official Stamp</span>
                            </div>
                        )}
                        {signatures && signatures.length > 0 && (
                            <div style={{ display: 'flex', gap: '40px', zIndex: 1 }}>
                                {signatures.map((sig, index) => (
                                    <div key={index} className="doc-signature" style={{ textAlign: 'center' }}>
                                        <div className="doc-signature-line" style={{ width: '200px', borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
                                        <p className="doc-signature-title" style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', margin: 0 }}>{sig}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderCertificate = () => {
        const mockData: Record<string, string> = {
            'Name': 'Jane Smith',
            'Course': 'Advanced Web Development',
            'Date of Issue': new Date().toLocaleDateString()
        };

        const studentNameField = studentInfoFields.find(f => f.toLowerCase().includes('name')) || studentInfoFields[0] || 'Name';
        const courseField = studentInfoFields.find(f => f.toLowerCase().includes('course') || f.toLowerCase().includes('program')) || studentInfoFields[1] || 'Course';

        return (
            <div className="doc-content" style={{ 
                border: `16px solid ${primaryColor}`, 
                padding: '40px', 
                textAlign: 'center', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: '#fffaf0' // Slight off-white/cream for certificate feel
            }}>
                {/* Inner Border */}
                <div style={{ 
                    position: 'absolute', 
                    top: '10px', left: '10px', right: '10px', bottom: '10px', 
                    border: `2px solid ${primaryColor}`, 
                    pointerEvents: 'none' 
                }}></div>

                {config.visibleSections?.header !== false && renderHeader()}
                {renderSeparator()}
                {config.visibleSections?.title !== false && renderTitle({})}
                {renderTitleSeparator()}

                {config.visibleSections?.studentInfo !== false && (
                    <>
                        <div style={{ marginBottom: '40px' }}>
                            <h3 style={{ fontSize: '42px', fontFamily: 'cursive, serif', color: '#111827', borderBottom: `2px solid ${borderColor}`, display: 'inline-block', padding: '0 40px 10px 40px', margin: '0' }}>
                                {mockData[studentNameField] || 'Student Name'}
                            </h3>
                        </div>

                        <div style={{ marginBottom: '60px', padding: '0 100px' }}>
                            <p style={{ fontSize: '18px', color: '#4b5563', lineHeight: '1.6' }}>
                                Has successfully completed the requirements for <strong>{mockData[courseField] || 'the program'}</strong> and is hereby awarded this certificate with all the rights, privileges, and honors appertaining thereto.
                            </p>
                            
                            {studentInfoFields.length > 2 && (
                                <div style={{ marginTop: '20px', fontSize: '14px', color: '#6b7280' }}>
                                    {studentInfoFields.filter(f => f !== studentNameField && f !== courseField).map((field, index) => (
                                        <span key={index} style={{ margin: '0 10px' }}>
                                            <strong>{field}:</strong> {mockData[field] || 'Sample Data'}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Footer Signatures */}
                {config.visibleSections?.footer !== false && signatures && signatures.length > 0 && (
                    <div className="doc-footer" style={{ display: 'flex', justifyContent: 'space-around', marginTop: 'auto', padding: '0 40px' }}>
                        {signatures.map((sig, index) => (
                            <div key={index} className="doc-signature" style={{ textAlign: 'center' }}>
                                <div className="doc-signature-line" style={{ width: '200px', borderBottom: '1px solid #000', marginBottom: '10px', marginLeft: 'auto', marginRight: 'auto' }}></div>
                                <p className="doc-signature-title" style={{ fontSize: '16px', fontFamily: 'serif', fontStyle: 'italic', color: '#374151', margin: 0 }}>{sig}</p>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* Seal Placeholder */}
                {(config.showStamp ?? true) && (
                    <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)' }}>
                        <div className="doc-stamp" style={{ width: '100px', height: '100px', backgroundColor: '#fbbf24', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px dashed #d97706', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            <span style={{ color: '#b45309', fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', textAlign: 'center' }}>Official<br/>Seal</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderGenericForm = () => {
        return (
            <div className="doc-content">
                {config.visibleSections?.header !== false && renderHeader()}
                {renderSeparator()}
                {config.visibleSections?.title !== false && renderTitle({})}
                {renderTitleSeparator()}
                {config.visibleSections?.studentInfo !== false && renderStudentInfo()}
                {config.visibleSections?.table !== false && renderTable()}
                {config.visibleSections?.remarks !== false && showRemarks && (
                    <div className="doc-remarks">
                        <p><strong>Remarks / Comments:</strong> Please ensure all information is accurate and up to date.</p>
                        <p><strong>Additional Notes:</strong> This document is official and should be kept securely.</p>
                    </div>
                )}
                {config.visibleSections?.footer !== false && (
                    <div className="doc-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', position: 'relative' }}>
                        {(config.showStamp ?? true) && (
                            <div className="doc-stamp">
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', transform: 'rotate(12deg)' }}>Official Stamp</span>
                            </div>
                        )}
                        {signatures && signatures.length > 0 && (
                            <div style={{ display: 'flex', gap: '40px', zIndex: 1 }}>
                                {signatures.map((sig, index) => (
                                    <div key={index} className="doc-signature" style={{ textAlign: 'center' }}>
                                        <div className="doc-signature-line" style={{ width: '200px', borderBottom: '1px solid #000', marginBottom: '5px' }}></div>
                                        <p className="doc-signature-title" style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', margin: 0 }}>{sig}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const renderTemplateContent = (templateType) => { 
        switch (templateType) {
            case 'Report':
                return renderReportCard();
            case 'Transcript':
                return renderTranscript();
            case 'Certificate':
                return renderCertificate();
            case 'Form':
            case 'Other':
            default:
                return renderGenericForm();
        }
    };

    return (
        <div className="doc-container" id="template-preview-container">
            <style>{css}</style>
            {renderWatermark()}
            {renderTemplateContent(templateType)}
        </div>
    );
};
