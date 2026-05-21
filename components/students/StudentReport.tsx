import React,{useRef} from "react";

import {Button} from "../UI";
import {uiContext} from "@/customContexts/UiContext";
import { useReactToPrint } from "react-to-print";
import { TemplatePreview } from "../settings/template-editor/TemplatePreview";
interface StudentReportProps {
  reportData: any;
}

const StudentReport: React.FC<StudentReportProps> = ({reportData}) => {
  // Print Handler
  const reportRef = useRef<HTMLDivElement>(null);
 
  const handlePrint = useReactToPrint({
  contentRef: reportRef,
  documentTitle: "Student Report",
});
  
  const {selectedSchool,templates} = React.useContext(uiContext);
  const activeTemplate = templates?.find((t) => (t.type === "Report" && t.isActive));
  return (
    <>
        {/* THE REPORT CARD CONTAINER */}
      <style>
        {`
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
      `}
      </style>
              <div className="flex justify-between items-center mb-6 no-print">

                <div>
                  <h3 className="font-bold text-xl text-navy-900">Result Sheet</h3>
                  <p className="text-xs text-gray-500">
                    {reportData.data.term} • {reportData.data.session} 
                  </p>
                </div>
                <Button onClick={() => {handlePrint()}} className="w-auto px-4 gap-2">
                  <i className="fa-solid fa-print"></i> Print
                </Button>
              </div>

              <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50 shadow-inner flex-1 no-print">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-2">
                  {/* THE REPORT CARD CONTAINER */}
                  {/* <div ref={reportRef} id="report-card-containe" className="bg-white p-8 border-4 border-double border-navy-900/20 shadow-xl relative min-h-[800px] text-navy-900 w-full"> */}
                  <div ref={reportRef} id="report-card-containe" className="bg-white border-4 border-double border-navy-900/20 relative min-h-[800px] h-full w-full ">
                  {
                    activeTemplate && <TemplatePreview config={activeTemplate.config} tempData={reportData} selectedSchool={selectedSchool} />
                  }
                  {!activeTemplate && (
                    <>
                      {/* Watermark */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03]">
                        <i className="fa-solid fa-graduation-cap text-[400px]"></i>
                      </div>

                      {/* Header */}
                      <div className="text-center border-b-2 border-navy-900 pb-2 mb-2">
                        <div className="w-16 h-16 bg-navy-900 text-white rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
                          <i className="fa-solid fa-school"></i> 
                        </div>

                        <h1 className="text-2xl font-bold uppercase tracking-wide text-navy-900">{selectedSchool?.name || "Director School"}</h1>
                        <p className="text-sm text-gray-600 font-serif italic">{selectedSchool?.motto || "Excellence in Knowledge & Character"}</p>
                        <p className="text-xs text-gray-500 mt-1">{selectedSchool?.address || "Current Address "}</p>
                        <div className="mt-4 bg-navy-900 text-white inline-block px-6 py-1.5 text-sm font-bold uppercase tracking-widest rounded-full">Termly Report Sheet</div>
                      </div>

                      {/* Student Info Grid */}
                      <div className="grid grid-cols-4 md:grid-cols-3 gap-2 mb-2 text-sm border border-gray-300 p-4 rounded bg-gray-50/50">
                        <div>
                          <span className="block text-xs font-bold text-gray-500 uppercase">Name</span>
                          <span className="font-bold text-navy-900">{reportData.studentDetails.name} </span> 
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-gray-500 uppercase">Admission No</span>
                          <span className="font-mono font-bold text-navy-900">{reportData.studentDetails.admissionNo}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-gray-500 uppercase">Class</span>
                          <span className="font-bold text-navy-900">{reportData.data.classRoom}</span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-gray-500 uppercase">Position</span>
                          <span className="font-bold text-navy-900">{reportData.data.positionInClass} </span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-gray-500 uppercase">Class Students</span>
                          <span className="font-bold text-navy-900">{reportData.data.totalClassStudents} Students </span>
                        </div>
                        <div>
                          <span className="block text-xs font-bold text-gray-500 uppercase">Attendance</span>
                          <span className="font-bold text-navy-900">
                            {reportData.data.attendance.present} / {reportData.data.attendance.total}
                          </span>
                        </div>
                      </div>

                      {/* Grades Table */}
                      <div className="mb-4">
                        <h4 className="text-sm font-bold text-navy-900 uppercase border-b border-gray-300 mb-2 pb-1">Academic Performance</h4>
                        <div>
                          <table className="w-full text-sm border-collapse border border-gray-300">
                            <thead>
                              <tr className="bg-navy-50 text-navy-900">
                                <th className="border border-gray-300 px-2 py-1.5 text-left">Subject (Code)</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">1st CA(20)</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">2nd CA(20)</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Exam (60)</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Total</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-center w-16">Grade</th>
                                <th className="border border-gray-300 px-2 py-1.5 text-left">Remark</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.academics.map((sub: any, i: number) => (
                                <tr key={i} className="even:bg-gray-50/50">
                                  <td className="border border-gray-300 px-2 py-1.5 font-medium">{sub.subject} ({sub.code})</td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">{sub.ca1}</td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">{sub.ca2}</td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-center text-gray-600">{sub.exam}</td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-center font-bold text-navy-900">{sub.total}</td>
                                  <td className={`border border-gray-300 px-2 py-1.5 text-center font-bold ${sub.grade === "F" ? "text-red-600" : "text-green-700"}`}>{sub.grade}</td>
                                  <td className="border border-gray-300 px-2 py-1.5 text-xs italic text-gray-600">{sub.remark}</td>
                                </tr>
                              ))}
                              {reportData.academics.map((sub: any, i: number) => (
                                <tr key={i} className="even:bg-gray-50/50">
                                  <td className="border border-gray-300 p-2 font-medium">{sub.subject} ({sub.code})</td>
                                  <td className="border border-gray-300 p-2 text-center text-gray-600">{sub.ca1}</td>
                                  <td className="border border-gray-300 p-2 text-center text-gray-600">{sub.ca2}</td>
                                  <td className="border border-gray-300 p-2 text-center text-gray-600">{sub.exam}</td>
                                  <td className="border border-gray-300 p-2 text-center font-bold text-navy-900">{sub.total}</td>
                                  <td className={`border border-gray-300 p-2 text-center font-bold ${sub.grade === "F" ? "text-red-600" : "text-green-700"}`}>{sub.grade}</td>
                                  <td className="border border-gray-300 p-2 text-xs italic text-gray-600">{sub.remark}</td>
                                </tr>
                              ))}
                              {reportData.academics.slice(3).map((sub: any, i: number) => (
                                <tr key={i} className="even:bg-gray-50/50">
                                  <td className="border border-gray-300 p-2 font-medium">{sub.subject} ({sub.code})</td>
                                  <td className="border border-gray-300 p-2 text-center text-gray-600">{sub.ca1}</td>
                                  <td className="border border-gray-300 p-2 text-center text-gray-600">{sub.ca2}</td>
                                  <td className="border border-gray-300 p-2 text-center text-gray-600">{sub.exam}</td>
                                  <td className="border border-gray-300 p-2 text-center font-bold text-navy-900">{sub.total}</td>
                                  <td className={`border border-gray-300 p-2 text-center font-bold ${sub.grade === "F" ? "text-red-600" : "text-green-700"}`}>{sub.grade}</td>
                                  <td className="border border-gray-300 p-2 text-xs italic text-gray-600">{sub.remark}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <div className="w-full flex justify-between px-4 ">
                            <span className ="text-md "> Average Marks :   <b>{reportData.data.averageMark}%</b> </span> 
                            <span className ="text-md"> Total Marks :    <b>{reportData.data.totalMarks}</b>  </span>
                          </div>
                        </div>
                      </div>

                      {/* Behavioral & Skills Grid */}
                      <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                          <h4 className="text-sm font-bold text-navy-900 uppercase border-b border-gray-300 mb-1 pb-1">Affective Domain</h4>
                          <table className="w-full text-xs border border-gray-300">
                            <tbody>
                              {reportData.affective.map((trait: any, i: number) => (
                                <tr key={i} className="border-b border-gray-200">
                                  <td className="p-1 pl-2 font-medium">{trait.trait}</td>
                                  <td className="p-1 text-right pr-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <i key={star} className={`fa-solid fa-star mr-0.5 ${star <= trait.rating ? "text-gold-500" : "text-gray-200"}`}></i>
                                    ))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        
                        {/* sycoskills table here  */}
                        <div>
                          <h4 className="text-sm font-bold text-navy-900 uppercase border-b border-gray-300 mb-1 pb-1">Psychomotor Skills</h4>
                          <table className="w-full text-xs border border-gray-300">
                            <tbody>
                              {reportData.psychomotor.map((skill: any, i: number) => (
                                <tr key={i} className="border-b border-gray-200">
                                  <td className="p-1 pl-2 font-medium">{skill.skill}</td>
                                  <td className="p-1 text-right pr-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <i key={star} className={`fa-solid fa-star mr-0.5 ${star <= skill.rating ? "text-blue-500" : "text-gray-200"}`}></i>
                                    ))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="border border-gray-300 rounded p-4 bg-gray-50/30 space-y-4">
                        <div className="flex gap-4">
                          <div className="w-32 text-xs font-bold uppercase text-gray-500 pt-1">Form Teacher:</div>
                          <div className="flex-1 border-b border-gray-300 pb-1 text-sm font-serif italic text-navy-900">{reportData.remarks.teacher}</div>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-32 text-xs font-bold uppercase text-gray-500 pt-1">Principal:</div>
                          <div className="flex-1 border-b border-gray-300 pb-1 text-sm font-serif italic text-navy-900">{reportData.remarks.principal}</div>
                        </div>
                      </div>

                      {/* Footer Signatures */}
                      <div className="flex justify-between mt-12 pt-4">
                        <div className="text-center">
                          <div className="w-32 border-b border-black mb-1"></div>
                          <p className="text-xs text-gray-500 uppercase">Teacher's Signature</p>
                        </div>
                        <div className="text-center">
                          <div className="w-24 h-24 border-2 border-dashed border-navy-200 rounded-full flex items-center justify-center text-navy-200 mb-1 mx-auto -mt-10">
                            <span className="text-[10px] uppercase font-bold rotate-12">Official Stamp</span>
                          </div>
                          <p className="text-xs text-gray-500 uppercase mt-2">Date: {new Date(reportData?.data?.generatedAt).toLocaleDateString()}
                            {reportData?.data?.updatedAt && 
                            <span className ='text-xs text-gray-500'> • {new Date(reportData?.data?.updatedAt).toLocaleDateString()}</span>
                            }
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="w-32 border-b border-black mb-1"></div>
                          <p className="text-xs text-gray-500 uppercase">Principal's Signature</p>
                        </div>
                      </div>
                  </>)}

                  </div>

                </div>
              </div>
    </>
  );
};

export default StudentReport;
