import React, {useState, useEffect, useRef, useContext} from "react";
import {Student, ClassRoom, Subject, AcademicRecord} from "../../types";
import {Input, Button, FadeIn, MultiSelectDropdown, PinModal, Toast, ImageUpload, ImageViewer, Modal} from "../UI";
import {generateStudentReportData} from "../../utils";

import {uiContext} from "@/customContexts/UiContext";
import useRequest from "@/customHooks/RequestHook";
import urls from "@/customHooks/ServerUrls";
import {authContext} from "@/customContexts/AuthContext";
import StudentReport from "./StudentReport";
import { setTimeout } from "timers/promises";



type ViewMode = "LIST" | "DETAIL" | "ADD" | "EDIT";
type DetailTab = "OVERVIEW" | "ACADEMIC" | "GUARDIAN" | "ADMIN";
type TermViewTab = "REPORT" | "ANALYSIS" | "RECORDS";
interface StudentDetailProps {
  id: string;
  student,setStudent,
  setViewMode?: (param?:ViewMode) => void | undefined;
  triggerSuspend: () => void;
  triggerDelete: () => void;
}
// --- DETAIL VIEW ---
export const StudentDetail: React.FC<StudentDetailProps> = ({id,student:s,setStudent, setViewMode, triggerDelete, triggerSuspend}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>("OVERVIEW");
  const [showImage, setShowImage] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  // Academic History State
  const [selectedHistoryClass, setSelectedHistoryClass] = useState<string | null>(null);
  const [isDeletingModalOpen,setIsDeletingModalOpen] = useState(false)
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [termViewTab, setTermViewTab] = useState<TermViewTab>("REPORT");
  const [reportData, setReportData] = useState<any>(null);
  // Security & Notification State
  const {selectedSchool} = useContext(uiContext); 
  const {
    classRooms,
    isLoading,
  } = useContext(uiContext);
  const {sendRequest} = useRequest();

  if (!s) return null;
  const assignedClassesIds = s?.active_class_rooms || [];
  const assignedClasses = classRooms.filter((c) => assignedClassesIds.includes(c.id));
  const triggeredFunc = (resp) => {
    if (resp?.student_details){ 
      setStudent(resp?.student_details);
    }
    if (pendingAction === "REPORT") {
        if (resp?.studentReport){
          setTermViewTab("REPORT"); // Default to report view
          const data = generateStudentReportData(resp?.studentReport);
          setReportData(data);
        }
        else {
          setReportData(null); // report not found 
        }
    }
  };
  // Handle Report Card Generation
  const handleViewReport = (clsId: string,termId: string) => {
    // fetch from serverv/*   */
    setSelectedTerm(termId);
    setPendingAction("REPORT");
    let url = `/result/reportsheet/fetch/${s.id}/${termId}/${clsId}/`
    sendRequest(url,"GET",null as any ,triggeredFunc,true,false)
  };
  useEffect(() => {
    if (id){ 
      // setSelectedCls(classRooms.find((c) => c.id === selectedId)) ;
      let sUrl = `/student/details/${selectedSchool?.id}/${id}/`
      sendRequest(sUrl,"GET",null as any ,triggeredFunc,!true,false);
    }
    // return (() => {setStudent(null)});
  },[id])
  const topRef = useRef<any>(null)
  useEffect(() => {
      topRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
      })
  }, [])

  return (
    <div className="animate-fadeIn space-y-6">
      {/* Print Styling - Ensures scrollable content is visible on paper */}
      {/* <style>{`
                
                    @media print {
                      body * {
                        visibility: hidden;
                      }

                      #report-card-container,
                      #report-card-container * {
                        visibility: visible;
                      }

                      #report-card-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                      }

                      .no-print {
                        display: none !important;
                      }
                    }
                     @page {
                      size: A4;
                      // margin: 6mm;
                    }

                    @media print {
                      html, body {
                        width: 210mm;
                        height: 297mm;
                      }
                      body{
                        -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
                      }

                      #report-card-container {
                        width: 100%;
                        min-height: 100%;
                        box-shadow: none !important;
                      }

  .no-print {
    display: none !important;
  }

 
}
  @media print {
  table {
    page-break-inside: avoid;
  }

  .page-break {
    page-break-before: always;
  }
}
  @media print {
  body {
    zoom: 0.95;
  }
}
  @media print {
  #report-card-container {
    transform: scale(0.97);
    transform-origin: top center;
  }
}
            `}</style> */}

      {/* Professional Profile Header (Hidden when printing Report Card) */}
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden no-print" >
        <div className="h-32 bg-gradient-to-r from-navy-900 to-navy-700 relative">
          {/* <div className="absolute inset-0 bg-pattern opacity-10 "></div> */}
          <div className="absolute -mt-20 -top-10 bbd " ref={topRef}> </div>
          <button onClick={() =>{ setViewMode("LIST")}} className="absolute left-4 top-2 flex items-center text-gold-400 hover:text-gold-700 transition-colors no-print animate-pulse">
            <i className="fa-solid fa-arrow-left mr-2 text-xl rounded-lg p-2 rounded-lg bg-gold-50"></i> Back 
          </button>
          <div className="absolute bottom-4 right-6 text-white/20 text-4xl">
            <i className="fa-solid fa-graduation-cap"></i>
          </div>
        </div>
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
            <div className="flex items-end">
              <div className={`w-28 h-28 rounded-xl bg-white p-1.5 shadow-lg relative shrink-0 ${s?.picture ? "cursor-pointer hover:scale-105 transition-transform" : ""}`} onClick={() => s?.picture && setShowImage(true)}>
                <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center text-5xl text-gray-400 overflow-hidden border border-gray-200">{s?.picture ? <img src={urls.BASE_URL + s?.picture} alt="Student" className="w-full h-full object-cover" /> : <i className="fa-solid fa-user"></i>}</div>
                <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${s?.is_active ? "bg-green-500" : "bg-red-500"}`}>
                  <i className={`fa-solid ${s?.is_active ? "fa-check" : "fa-ban"}`}></i>
                </span>
              </div>
              <div className="ml-5 mb-1">
                <h1 className="text-3xl font-bold text-navy-900 leading-tight">
                  {s?.first_name} {s?.last_name}
                </h1>
                <p className="text-gray-500 font-medium flex items-center text-sm mt-1">
                  <span>{s?.role}</span>
                  <span className="bg-navy-50 text-navy-700 px-2 py-0.5 rounded border border-navy-100 mx-2">{s?.admission_number}</span>
                  {s?.email}
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button variant="outline" className="w-auto px-4" onClick={() => setViewMode("EDIT")}>
                <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Profile
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 border-b border-gray-200 mt-8 overflow-x-auto">
            {[
              {id: "OVERVIEW", label: "Overview", icon: "fa-solid fa-chart-pie"},
              {id: "ACADEMIC", label: "Academic History", icon: "fa-solid fa-book-open"},
              {id: "GUARDIAN", label: "Guardian Info", icon: "fa-solid fa-house-user"},
              {id: "ADMIN", label: "Administrative", icon: "fa-solid fa-shield-halved"},
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as DetailTab);
                  setSelectedTerm(null);
                }}
                className={`pb-4 text-sm font-semibold flex items-center transition-all whitespace-nowrap ${activeTab === tab.id ? "text-navy-900 border-b-2 border-navy-900" : "text-gray-500 hover:text-navy-700"}`}
              >
                <i className={`${tab.icon} mr-2`}></i>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="pt-8 min-h-[300px]">
            {activeTab === "OVERVIEW" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-navy-50 p-6 rounded-lg border border-navy-100 flex items-start gap-4">
                    <i className="fa-solid fa-bullhorn text-navy-600 text-xl mt-1"></i>
                    <div>
                      <h3 className="font-bold text-navy-900">Latest Activity</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Enrolled in {assignedClasses.length} classes for the current session. Guardian contact updated on {new Date(s.joinedAt).toLocaleDateString()}.
                      </p>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-navy-900">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-y-4 text-sm border-t pt-4">
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-bold">Full Name</p>
                      <p className="font-semibold text-navy-900">
                        {s?.first_name} {s?.middle_name} {s?.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-bold">Gender</p>
                      <p className="font-semibold text-navy-900">{s?.gender || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-bold">Date of Birth</p>
                      <p className="font-semibold text-navy-900">{s?.date_of_birth || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs uppercase font-bold">Joined At</p>
                      <p className="font-semibold text-navy-900">{new Date(s?.joined_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Attendance</h4>
                    <div className="relative w-24 h-24 mx-auto my-4 flex items-center justify-center">
                      <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-green-500 rounded-full" style={{clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)"}}></div>
                      <span className="text-xl font-bold text-navy-900">96%</span>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Excellent</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ACADEMIC" && (
              <div className="flex flex-col lg:flex-row gap-8 h-full min-h-[600px]">
                {/* Left: History Navigation */}
                <div className="lg:w-1/3 space-y-4 no-print flex-shrink-0">
                  <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center">
                    <i className="fa-solid fa-clock-rotate-left mr-2"></i> Class History
                  </h3>
                  <div className="space-y-3">
                    {assignedClasses.map((cls, idx) => (
                      <div key={cls.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
                        <div
                          className={`p-4 cursor-pointer flex justify-between items-center transition-colors ${selectedHistoryClass === cls.id ? "bg-navy-900 text-white" : "hover:bg-gray-50"}`}
                          onClick={() => {
                            setSelectedHistoryClass(selectedHistoryClass === cls.id ? null : cls.id);
                            setSelectedTerm(null);
                          }}
                        >
                          <div>
                            <h4 className="font-bold text-sm">{cls.name}</h4>
                            <p className={`text-xs ${selectedHistoryClass === cls.id ? "text-navy-300" : "text-gray-500"}`}>{idx === 0 ? "Current Session" : "2022/2023 Session"}</p>
                          </div>
                          <i className={`fa-solid fa-chevron-down transition-transform ${selectedHistoryClass === cls.id ? "rotate-180" : ""}`}></i>
                        </div>

                        {/* Terms Accordion */}
                        {selectedHistoryClass === cls.id && (
                          <div className="bg-gray-50 border-t border-gray-200 p-2 space-y-1 animate-fadeIn">
                            {/* {["1st Term", "2nd Term", "3rd Term"].map((term) => ( */}
                            {selectedSchool?.terms.map((term) => (
                              <button key={term.id} onClick={() => handleViewReport(cls.id, term?.id)} className={`w-full text-left px-4 py-2 text-sm rounded flex justify-between items-center ${selectedTerm === term ? "bg-gold-100 text-gold-800 font-bold border border-gold-300" : "text-gray-600 hover:bg-white hover:shadow-sm"}`}>
                                <span>{term?.name} Report</span>
                                {selectedTerm === term?.id && <i className="fa-solid fa-circle-check"></i>}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {assignedClasses.length === 0 && <p className="text-gray-500 italic p-4 text-center bg-gray-50 rounded">No enrolled classes found.</p>}
                  </div>
                </div>

                {/* Right: Result View */}
                <div className="lg:w-2/3 flex-1">
                  {selectedTerm && reportData ? (
                    <div className="animate-fadeIn flex flex-col h-full">
                      {/* Term View Tabs */}
                      <div className="flex items-center gap-2 mb-4 bg-gray-100 p-1 rounded-lg w-fit no-print">
                        <button onClick={() => setTermViewTab("REPORT")} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${termViewTab === "REPORT" ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-navy-700"}`}>
                          Report Sheet
                        </button>
                        <button onClick={() => setTermViewTab("ANALYSIS")} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${termViewTab === "ANALYSIS" ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-navy-700"}`}>
                          Performance Analysis
                        </button>
                        <button onClick={() => setTermViewTab("RECORDS")} className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${termViewTab === "RECORDS" ? "bg-white text-navy-900 shadow-sm" : "text-gray-500 hover:text-navy-700"}`}>
                          Term Records
                        </button>
                      </div> 

                      {/* REPORT VIEW */}
                      {termViewTab === "REPORT" && <StudentReport reportData={reportData} 
                       />}

                      {/* ANALYSIS VIEW */} 
                      {termViewTab === "ANALYSIS" && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1 overflow-y-auto">
                          <h3 className="font-bold text-navy-900 mb-6">Subject Performance Analysis</h3>
                          <div className="space-y-6">
                            {reportData.academics.map((sub: any, idx: number) => {
                              const diff = sub.total - sub.classAvg;
                              return (
                                <div key={idx} className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="font-bold text-navy-800">{sub.subject}</span>
                                    <span className="text-gray-500">
                                      {sub.total}% (Class Avg: {sub.classAvg.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                                    <div className={`h-full ${sub.total >= 70 ? "bg-green-500" : sub.total >= 50 ? "bg-blue-500" : "bg-red-500"}`} style={{width: `${Math.min(sub.total, 100)}%`}}></div>
                                  </div>
                                  <p className="text-xs text-gray-400 text-right">{diff > 0 ? <span className="text-green-600">+{diff.toFixed(1)} above avg</span> : <span className="text-red-500">{diff.toFixed(1)} below avg</span>}</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* RECORDS VIEW */}
                      {termViewTab === "RECORDS" && (
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1 overflow-y-auto space-y-8">
                          <div>
                            <h4 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center">
                              <i className="fa-solid fa-money-bill-wave mr-2 text-green-600"></i> Fee Status for Term
                            </h4>
                            <div className="bg-gray-50 p-4 rounded border border-gray-200 flex justify-between items-center">
                              <div>
                                <p className="text-xs text-gray-500 uppercase font-bold">Total Fees</p>
                                <p className="text-lg font-bold text-navy-900">₦{reportData.termRecords.fees.amount}</p>
                              </div>
                              <span className="bg-green-100 text-green-700 px-3 py-1 rounded text-sm font-bold uppercase">{reportData.termRecords.fees.status}</span>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center">
                              <i className="fa-solid fa-triangle-exclamation mr-2 text-orange-500"></i> Disciplinary Incidents
                            </h4>
                            {reportData.termRecords.incidents.length > 0 ? (
                              <div className="space-y-3">
                                {reportData.termRecords.incidents.map((inc: any, i: number) => (
                                  <div key={i} className="p-3 border border-orange-200 bg-orange-50 rounded">
                                    <div className="flex justify-between">
                                      <span className="font-bold text-orange-800 text-sm">{inc.title}</span>
                                      <span className="text-xs text-orange-600">{inc.date}</span>
                                    </div>
                                    <p className="text-xs text-gray-700 mt-1">{inc.description}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic text-sm">No incidents recorded this term.</p>
                            )}
                          </div>

                          <div>
                            <h4 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center">
                              <i className="fa-solid fa-trophy mr-2 text-gold-500"></i> Activities & Clubs
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {reportData.termRecords.activities.map((act: string, i: number) => (
                                <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100">
                                  {act}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <i className="fa-solid fa-file-invoice text-2xl text-navy-200"></i>
                      </div>
                      <h3 className="text-lg font-bold text-navy-900 mb-2">Select a Term or No record found</h3>
                      <p className="max-w-xs">Click on a class from the history list on the left, then select a term to view reports and records.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "GUARDIAN" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center mb-6 pb-4 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 mr-4">
                      <i className="fa-solid fa-user-shield text-xl"></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-900 text-lg">{s.guardian?.full_name || "Not Listed"}</h3>
                      <p className="text-sm text-gray-500">{s.guardian?.relation_ship || "Guardian"}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <i className="fa-solid fa-phone w-6 text-gold-500 mt-1"></i>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Primary Phone</p>
                        <p className="font-bold text-navy-900">{s.guardian?.phone || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <i className="fa-solid fa-envelope w-6 text-gold-500 mt-1"></i>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Email Address</p>
                        <p className="font-medium text-navy-800">{s.guardian?.email || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <i className="fa-solid fa-location-dot w-6 text-gold-500 mt-1"></i>
                      <div>
                        <p className="text-xs text-gray-400 uppercase font-bold">Home Address</p>
                        <p className="font-medium text-navy-800">{s.guardian?.address || "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "ADMIN" && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-8">
                <h3 className="text-xl font-bold text-red-800 mb-2 flex items-center">
                  <i className="fa-solid fa-triangle-exclamation mr-3"></i> Danger Zone
                </h3>
                <p className="text-sm text-red-600 mb-8 max-w-2xl">These actions are critical and require Director Verification (PIN).</p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-white p-5 rounded border border-red-100 shadow-sm">
                    <div>
                      <h4 className="font-bold text-gray-800">{!s.is_active ? "Reactivate Student" : "Suspend Student"}</h4>
                      <p className="text-xs text-gray-500 mt-1">Temporarily revoke access.</p>
                    </div>
                    <Button disabled={isLoading} variant={!s.is_active ? "primary" : "secondary"} className="w-auto max-w-fit  px-6" onClick={triggerSuspend}>
                      {!s.is_active ? "Activate" : "Suspend"}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between bg-white p-5 rounded border border-red-100 shadow-sm">
                    <div>
                      <h4 className="font-bold text-red-700">Delete Record</h4>
                      <p className="text-xs text-gray-500 mt-1">Permanently remove student record.</p>
                    </div>
                    <Button disabled={isLoading} variant="danger" className="w-auto max-w-fit  px-6" onClick={() => {setIsDeletingModalOpen(true)}}>
                      Delete Student
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Rejection Note Modal */}
                  <Modal isOpen={isDeletingModalOpen} onClose={() => {setIsDeletingModalOpen(false);  }} title="Student Deletion" size="md">
                      <div className="space-y-4">
                          <p className=" bg-red-50 p-2 text-sm text-red-600 rounded-md ">Please confirm student record delete. This action is irreversible and all the student related data will also be deleted!</p>
                          <div className="flex justify-end gap-3">
                              <Button isLoading={isLoading}  variant="secondary" onClick={() => setIsDeletingModalOpen(false)}>Cancel</Button>
                              <Button 
                                  isLoading={isLoading}
                                  onClick={() => {
                                    triggerDelete() ;
                                    setIsDeletingModalOpen(false);
                                  }}
                                  className="bg-red-600 text-white"

                              >
                                  Confirm Deleting
                              </Button>
                          </div>
                      </div>
                  </Modal>
      <ImageViewer isOpen={showImage} imageUrl={urls.BASE_URL + s.picture} onClose={() => setShowImage(false)} />
    </div>
  );
};
