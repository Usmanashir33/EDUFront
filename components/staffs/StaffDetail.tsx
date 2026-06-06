
import React, { useContext, useEffect, useRef, useState } from 'react';
import { KYCDocument } from '../../types';
import { Button, ImageViewer, Modal } from '../UI';
import { safeParseFloat } from './StaffFinance';
import urls from '@/customHooks/ServerUrls';
import { uiContext } from '@/customContexts/UiContext';
import { StaffRoles } from './StaffRoles';
import useRequest from '@/customHooks/RequestHook';

interface StaffDetailProps { 
    id: string;
    staff: any;
    setStaff: any;
    onBack: () => void ;
    onEdit: () => void ;
    onTriggerSalary: (data: any) => void;
    onViewReceipt: (data: any) => void;
    onTriggerSuspend: () => void;
    onTriggerDelete: () => void;
    onOpenBankModal: () => void;
    onViewDoc: (doc: KYCDocument) => void;
    onVerifyDoc: (doc: KYCDocument) => void ;
    onServerSave: (name: any,method:'ADD'|'EDIT'|'DELETE',form?:any) => void ;
}

type Tab = 'OVERVIEW' | 'FINANCE' | 'ADMIN' | 'ROLES';

export const StaffDetail: React.FC<StaffDetailProps> = ({ 
    id, staff, setStaff,
    onBack, onEdit, onTriggerSalary, onViewReceipt, 
    onTriggerSuspend, onTriggerDelete, onOpenBankModal,  onViewDoc, onVerifyDoc ,
    onServerSave
}) => {

    const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW'); 
    const [showImage, setShowImage] = useState(false);
    const [isDeletingModalOpen,setIsDeletingModalOpen] = useState(false); 
    const {isLoading,selectedSchool,roles,setToast} = useContext(uiContext);
    const {sendRequest} = useRequest() ;
    
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const isPaidThisMonth = staff?.paymentHistory?.some(p => p.month === currentMonth && p.status === 'Paid');
    const schoolRole = roles.filter(r => r.id === staff?.school_role) || [];

    const handleManageRoles = (staffId: string, roleIds: string[]) => {
        // Call API to update roles
        let form = {
            school:selectedSchool?.id,
            staffId,
            roleIds
        }
        onServerSave('ROLE_USER', 'EDIT', form);
        return ;
    }
    const triggeredFunc =  (resp) => {
            // console.log('resp: ', resp);
            if (resp?.staff_details){ 
            setStaff(t => ({...t,...resp?.staff_details}));
            }
        }
    useEffect(() => {
            if (id){ 
              let sUrl = `/staff/details/${selectedSchool?.id}/${id}/`
              sendRequest(sUrl,"GET",null as any ,triggeredFunc,!true,false);
            }
      },[id]);
    

    const topRef = useRef<null|any>(null)
          useEffect(() => {
              topRef?.current?.scrollIntoView({
                  behavior: "smooth",
                  block: "start"
              })
          }, [])
    return (
        <div className="animate-fadeIn space-y-2 relative -mt-2" >
            <div className="absolute bbd -top-10 " ref={topRef} > </div>
            {/* Profile Header */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="h-32 bg-gradient-to-r from-navy-800 to-navy-600 relative">
                    {/* <div className="absolute inset-0 bg-pattern opacity-0"></div> */}
                     <button onClick={onBack} className="absolute left-2 top-0 flex items-center text-gold-400 hover:text-gold-700 transition-colors no-print animate-pulse">
                        <i className="fa-solid fa-arrow-left mr-2 text-xl rounded-lg p-2 rounded-lg bg-gold-50"></i> Back 
                    </button>
                 </div> 
                 <div className="px-8 pb-8 relative">
                    <div className="flex flex-col md:flex-row justify-between items-end -mt-12 mb-6">
                        <div className="flex items-end">
                            <div 
                                className={`w-28 h-28 rounded-xl bg-white p-1.5 shadow-lg relative shrink-0 ${staff?.picture ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                                onClick={() => staff?.picture && setShowImage(true)}
                                title={staff?.picture ? "Click to view full image" : ""}
                            >
                                <div className="w-full h-full bg-navy-50 rounded-lg flex items-center justify-center text-4xl text-navy-300 font-bold border border-gray-100 overflow-hidden">
                                    {staff?.picture ? <img src={urls.BASE_URL +  staff?.picture} alt="" className="w-full h-full object-cover"/> : `${staff?.first_name[0]}${staff?.last_name[0]}`}
                                </div>
                                <span className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white ${staff?.is_active ? 'bg-green-500' : 'bg-red-500'}`}>
                                    <i className={`fa-solid ${staff?.is_active ? 'fa-check' : 'fa-ban'}`}></i>
                                </span>
                            </div>
                            <div className="ml-5 mb-1">
                                <h1 className="text-3xl font-bold text-navy-900 leading-tight">{staff?.title} {staff?.first_name} {staff?.last_name}</h1>
                                <div className="flex items-center gap-3 mt-1">
                                    <p className="text-gray-500 font-medium text-sm flex items-center">
                                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200 mr-2">{staff?.staff_id}</span>
                                        {staff?.role}
                                    </p>
                                    {staff.kyc?.isVerified ? (
                                        <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded flex items-center"><i className="fa-solid fa-shield-halved mr-1"></i> Verified</span>
                                    ) : (
                                        <span className="text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded flex items-center"><i className="fa-solid fa-circle-exclamation mr-1"></i> Pending KYC</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-4 md:mt-0">
                            <Button variant="outline" className="w-auto px-4" onClick={onEdit}>
                                <i className="fa-solid fa-pen-to-square mr-2"></i> Edit Profile
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-8 border-b border-gray-200 mt-8 overflow-x-auto">
                        {[
                            { id: 'OVERVIEW', label: 'Overview', icon: 'fa-solid fa-chart-pie' },
                            { id: 'FINANCE', label: 'Finance', icon: 'fa-solid fa-file-invoice-dollar' },
                            { id: 'ADMIN', label: 'Admin', icon: 'fa-solid fa-shield-halved' },
                            { id: 'ROLES', label: 'Roles', icon: 'fa-solid fa-user-lock' }
                        ].map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id as Tab)} className={`pb-4 text-sm font-bold flex items-center transition-all ${activeTab === t.id ? 'text-navy-900 border-b-2 border-navy-900' : 'text-gray-400 hover:text-navy-600'}`}>
                                <i className={`${t.icon} mr-2`}></i>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="pt-8 min-h-[300px]">
                        {/* OVERVIEW TAB */}
                        {activeTab === 'OVERVIEW' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                        <h3 className="font-bold text-navy-900 border-b border-gray-100 pb-3 mb-4 flex items-center">
                                            <i className="fa-solid fa-user mr-2 text-navy-600"></i>
                                            Personal Information
                                        </h3>
                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div><p className="text-gray-500 text-xs uppercase font-bold">Full Name</p><p className="font-semibold text-navy-900">{staff?.title} {staff?.first_name} {staff?.last_name} {staff?.middle_name}</p></div>
                                            <div><p className="text-gray-500 text-xs uppercase font-bold">Gender</p><p className="font-semibold text-navy-900">{staff?.gender}</p></div>
                                            <div><p className="text-gray-500 text-xs uppercase font-bold">Date of Birth</p><p className="font-semibold text-navy-900">{staff?.date_of_birth ? new Date(staff?.date_of_birth).toLocaleDateString() : 'N/A'}</p></div>
                                            <div><p className="text-gray-500 text-xs uppercase font-bold">Date Joined</p><p className="font-semibold text-navy-900">{new Date(staff?.joined_at).toLocaleDateString()}</p></div>
                                            <div><p className="text-gray-500 text-xs uppercase font-bold">NIN</p><p className="font-semibold text-navy-900">{staff?.nin || 'Not Provided'}</p></div>
                                            <div><p className="text-gray-500 text-xs uppercase font-bold">Phone</p><p className="font-semibold text-navy-900">{staff?.phone}</p></div>
                                            <div><p className="text-gray-500 text-xs uppercase font-bold">Email</p><p className="font-semibold text-navy-900">{staff?.email}</p></div>
                                            <div className="col-span-2"><p className="text-gray-500 text-xs uppercase font-bold">Address</p><p className="font-semibold text-navy-900">{staff?.address}</p></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
                                        <h3 className="font-bold text-navy-900 border-b border-gray-100 pb-3 mb-4 flex items-center">
                                            <i className="fa-solid fa-briefcase mr-2 text-navy-600"></i>
                                            Job Details
                                        </h3>
                                        <div className="space-y-4 text-sm">
                                            <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">General Role</span><span className="font-semibold text-navy-900">{staff?.role?.toUpperCase()}</span></div>
                                            <div className="flex justify-between items-center border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Assigned School Role</span>
                                                {schoolRole.map(r => {return (
                                                    <span key={r.id} className="bg-navy-100 text-navy-800 text-sm font-bold px-3 py-1.5 rounded-md border border-navy-200">
                                                        <i className="fa-solid fa-shield-cat mr-1 opacity-50"></i> {r.name}
                                                    </span>
                                                )})}
                                            </div>
                                            <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Assigned NSA Role</span><span className="font-semibold text-navy-900 capitalize">{staff?.activity_role?.role || 'N/A'}</span></div>
                                            <div className="flex justify-between border-b border-gray-50 pb-2"><span className="text-gray-500 uppercase text-xs font-bold">Rank</span><span className="font-semibold text-navy-900 capitalize">{staff?.activity_role?.rank || 'N/A'}</span></div>
                                            <div><span className="text-gray-500 uppercase text-xs font-bold block mb-1">Description</span><p className="text-gray-700 bg-gray-50 p-2 rounded">{staff?.activity_role?.description || 'No description provided.'}</p></div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm text-center">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase">Current Status</h4>
                                        <div className={`text-xl font-bold my-2 ${staff?.is_active ? 'text-green-600' : 'text-red-600'}`}>
                                            {staff?.is_active? "Active" : "Inactive"}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'FINANCE' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="lg:col-span-2 space-y-8">
                                    {/* Action Card */}
                                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-navy-900">Payroll Action</h3>
                                                <p className="text-sm text-gray-500">Processing for: <span className="font-bold text-navy-900">{currentMonth}</span></p>
                                            </div>
                                            <span className={`px-3 py-1 rounded text-xs font-bold border ${isPaidThisMonth ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                {isPaidThisMonth ? 'PAID' : 'PENDING'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Base Salary (₦)</label>
                                                <div className="flex">
                                                    <div className="p-3 border rounded-md font-mono font-bold text-lg bg-gray-50 text-gray-600 border-gray-200 flex-1">
                                                        ₦{safeParseFloat(staff?.salary).toLocaleString()}
                                                    </div>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => onTriggerSalary({
                                                    baseSalary: staff?.salary || '0',
                                                    bonus: '0', bonusRemark: '',
                                                    deductions: '0', deductionRemark: '',
                                                    tax: '0',
                                                    month: currentMonth
                                                })} 
                                                disabled={isPaidThisMonth}
                                                variant={isPaidThisMonth ? 'secondary' : 'primary'}
                                                type="button"
                                            >
                                                {isPaidThisMonth ? <><i className="fa-solid fa-check mr-2"></i> Salary Paid</> : <><i className="fa-solid fa-calculator mr-2"></i> Calculate & Pay</>}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Payment History */}
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Payment History</h4>
                                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Month</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Net Pay</th>
                                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {staff?.paymentHistory?.map(p => (
                                                        <tr key={p.id}>
                                                            <td className="px-6 py-4 text-sm text-navy-900 font-medium">{p.month}</td>
                                                            <td className="px-6 py-4 text-sm text-navy-900 font-bold">{new Date(p.date).toLocaleDateString()}</td>
                                                            <td className="px-6 py-4 text-sm text-navy-900 font-bold">₦{safeParseFloat(p.amount).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button 
                                                                    onClick={() => onViewReceipt(p)}
                                                                    className="text-xs text-navy-600 hover:text-navy-900 font-medium hover:underline bg-navy-50 px-3 py-1 rounded-full border border-navy-100"
                                                                >
                                                                    <i className="fa-solid fa-receipt mr-1"></i> Slip
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!staff?.paymentHistory || staff?.paymentHistory.length === 0) && (
                                                        <tr><td colSpan={4} className="p-4 text-center text-gray-500 text-sm">No payment history found.</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                                {/* Bank Info */}
                                <div className="space-y-6">
                                    <div className="bg-gradient-to-br from-navy-900 to-navy-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden group">
                                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white opacity-10 rounded-full"></div>
                                        
                                        {/* Edit Button */}
                                        <button 
                                            onClick={() => {
                                                setToast({message:'Edit in the staff edit profile',type:'info'})
                                                topRef?.current?.scrollIntoView({
                                                    behavior: "smooth",
                                                    block: "start"
                                                })
                                            }}
                                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors z-10"
                                            title="Edit Bank Details"
                                        >
                                            <i className="fa-solid fa-pen-to-square"></i>
                                        </button>

                                        <h4 className="text-sm font-bold text-gold-500 uppercase mb-4 tracking-wider flex items-center">
                                            <i className="fa-solid fa-building-columns mr-2"></i> Bank Details
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-navy-300 text-xs uppercase">Bank Name</p>
                                                <p className="font-bold text-lg">{staff?.bank_details?.bank_name || 'Not Provided'}</p>
                                            </div>
                                            <div>
                                                <p className="text-navy-300 text-xs uppercase">Account Number</p>
                                                <p className="font-mono text-xl tracking-widest">{staff?.bank_details?.account_number || '**** ****'}</p>
                                            </div>
                                            <div>
                                                <p className="text-navy-300 text-xs uppercase">Account Name</p>
                                                <p className="font-medium text-sm">{staff?.bank_details?.account_name || 'Not Provided'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'ROLES' && (
                            <StaffRoles staff={staff} handleManageRoles={handleManageRoles} />
                        )}
                        {activeTab === 'ADMIN' && (
                            <div className="space-y-8">
                                {/* KYC Management */}
                                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                     <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                        <h3 className="font-bold text-navy-900 flex items-center">
                                            <i className="fa-solid fa-file-contract mr-2 text-navy-600"></i> KYC & Verification
                                        </h3>
                                        {staff?.kyc?.isVerified && <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded">Verified</span>}
                                     </div>
                                     
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div className="space-y-3">
                                             <p className="text-sm text-gray-600 mb-2">Submitted Documents</p>
                                             {staff?.kyc?.documents.map((doc, idx) => (
                                                 <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
                                                     <div className="flex items-center gap-3">
                                                         <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${doc.status === 'Verified' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                                                             <i className={`fa-solid ${doc.status === 'Verified' ? 'fa-check' : 'fa-hourglass'}`}></i>
                                                         </div>
                                                         <div>
                                                             <p className="text-sm font-medium text-navy-900">{doc.name}</p>
                                                             <p className="text-[10px] text-gray-500 uppercase">{doc.status}</p>
                                                         </div>
                                                     </div>
                                                     <button 
                                                        onClick={() => onViewDoc(doc)}
                                                        className="text-xs bg-white border border-gray-300 px-3 py-1 rounded hover:bg-navy-50 text-navy-700"
                                                     >
                                                         View
                                                     </button>
                                                     {doc.status !== 'Verified' && (
                                                         <button 
                                                            onClick={() => onVerifyDoc(doc)}
                                                            className="text-xs bg-blue-50 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100 text-blue-700 ml-2"
                                                         >
                                                             Verify
                                                         </button>
                                                     )}
                                                 </div>
                                             ))}
                                         </div>
                                         
                                         <div className="border-l border-gray-100 pl-6 flex flex-col justify-center">
                                             <div className="text-center p-6 bg-navy-50 rounded-lg border border-dashed border-navy-200">
                                                 <i className="fa-solid fa-upload text-3xl text-navy-300 mb-2"></i>
                                                 <p className="text-sm font-bold text-navy-700">Request Update</p>
                                                 <p className="text-xs text-gray-500 mb-4">Send a notification to staff to upload pending documents.</p>
                                                 <Button variant="outline" className="text-xs w-auto px-4">Send Request</Button>
                                             </div>
                                         </div>
                                     </div>
                                </div>

                                {/* Danger Zone */}
                                <div className="bg-red-50 border border-red-100 rounded-lg p-6">
                                    <h3 className="text-lg font-bold text-red-800 mb-4">Account Control</h3>
                                    <div className="flex gap-4">
                                        <Button variant="secondary" className="w-auto max-w-fit  px-4" onClick={onTriggerSuspend}>
                                            {!staff?.is_active ? 'Activate Account' : 'Suspend Account'}
                                        </Button>
                                        <Button variant="danger" className="w-auto max-w-fit  px-4" onClick={() => setIsDeletingModalOpen(true)}>Delete Staff</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                 </div>
            </div>
             <Modal isOpen={isDeletingModalOpen} onClose={() => {setIsDeletingModalOpen(false);  }} title="Staff Deletion" size="md">
                  <div className="space-y-4">
                      <p className=" bg-red-50 p-2 text-sm text-red-600 rounded-md ">Please confirm staff deleting. This action is irreversible and all the staff related data will also be deleted!</p>
                      <div className="flex justify-end gap-3">
                          <Button isLoading={isLoading}  variant="secondary" onClick={() => setIsDeletingModalOpen(false)}>Cancel</Button>
                          <Button 
                              isLoading={isLoading}
                              onClick={() => {
                                onTriggerDelete() ;
                                setIsDeletingModalOpen(false);
                              }}
                              className="bg-red-600 text-white"
                          >
                              Confirm Deleting
                          </Button>
                      </div>
                  </div>
              </Modal>
                        
            
            <ImageViewer 
                isOpen={showImage} 
                imageUrl={urls.BASE_URL + staff?.picture} 
                onClose={() => setShowImage(false)} 
            />
        </div>
    );
};
