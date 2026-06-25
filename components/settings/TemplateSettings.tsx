
import React, { useMemo, useState } from 'react';
import { Toggle, Button, ImageUpload, Modal, Toast, Input, PinModal } from '../UI';
import { TemplateEditor } from './template-editor/TemplateEditor';
import { TemplateConfig } from './template-editor/types';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';

interface DocTemplate {
    id: string;
    name: string;
    type: 'Form' | 'Report' | 'Transcript' | 'Certificate' | 'Other';
    fileType: 'HTML';
    lastUpdated: string;
    created_at?: string;
    isConfigured: boolean;
    isActive?: boolean;
    category?: 'SYSTEM' | 'SCHOOL';
    config?: TemplateConfig;
    htmlContent?: string;
}

interface TemplateSettingsProps {
    // data: any;
    // setData: (d: any) => void;
}

export const TemplateSettings: React.FC<TemplateSettingsProps> = ({
    // data, setData

}) => {

    // const templateTypes = [...new Map(data?.documents?.map((d: DocTemplate) => [d.name,d.type]))]
    const [serverForm,setserverForm] = useState(new FormData() ) ;
    const [configuringDoc, setConfiguringDoc] = useState<DocTemplate | null>(null);
    const [previewingDoc, setPreviewingDoc] = useState<DocTemplate | null>(null);
    const [deletingDoc, setDeletingDoc] = useState<DocTemplate | null>(null);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<'Create' | 'Update' | 'Delete' | null >('Create');
    const [showPinModal,setShowPinModal] = useState(false)
    const [editorPin,setEditorPin] = useState(false)
    const [defaultNewDocType, setDefaultNewDocType] = useState<'Form' | 'Report' | 'Transcript' | 'Certificate' | 'Other'>('Report');
    const [pendingAction,setPendingAction] = useState<{name?:string,id?:any}>({name:"",id:''})
    const {currentUser} = React.useContext(authContext);
    const {selectedSchool,setToast,templates,setTemplates:setData} = React.useContext(uiContext);
    const {sendRequest} = useRequest() ;
    const tempTypes = [
        {name:"Form",type:'Form'},
        {name:"Report Card",type:'Report'},
        {name:"Transcript",type:'Transcript'},
        {name:"Certificate",type:'Certificate'},
        {name:"Other",type:'Other Docs'},
    ]
    const data = useMemo(()=> {
        return {
        headerImage: '', 
          useCustomHeader: true,
          documents: templates || []
        }
    },[templates])

    const triggeredFunc = (resp) => {
        setConfiguringDoc(null) ;
        setPendingAction({name:'',id:''})

        setToast({ message: resp?.success, type: 'success' }) ;
        console.log('resp: ', resp);

        if (resp?.new_temp){ // new template 
            const updated = [...data.documents,resp.new_temp]
            setData(updated);
            return ;
        }
        if (resp?.updated_temp){ // updating template 
            let u = resp?.updated_temp
            let isActive = u.isActive 
            const updated = data.documents.map((d: DocTemplate) => d.id === u.id ? {...u} : isActive ? {...d,isActive:false} : d);
            setData(updated);
            return ;
        }
        if (resp?.deleted_temp){ // deleted template
            const updated = data.documents.filter((d: DocTemplate) => d.id !== resp.deleted_temp.id);
            setData(updated) ;
            return ;
        }
    }

    const handlePinSuccess = (pins:string) => {
        serverForm.append('pin',pins)
        
        if (configuringDoc?.id){
            setEditorPin(false)
        }else{
            setShowPinModal(false);
        }

        if (pendingRequests === "Create"){
            let url = `/school/template/${selectedSchool.id}/`
            sendRequest(url,"POST",serverForm as any ,triggeredFunc,true,true) 
        }
        else if (pendingRequests === "Update") {
            let url = `/school/template/${selectedSchool.id}/${pendingAction?.id}/`
            sendRequest(url,"PUT",serverForm as any ,triggeredFunc,true,true) ;
            setPendingAction({name:'',id:''})
        }
        else if (pendingRequests === "Delete") {
            let url = `/school/template/${selectedSchool.id}/${deletingDoc?.id}/${pins}/`
            sendRequest(url,"DELETE",serverForm as any ,triggeredFunc,true,!true) 
            setDeletingDoc(null); // to close the modal 
            return ;

        }
        return ;
    }

    const saveTemplate = (config:any, htmlContent:any) => {
        // console.log('htmlContent: ', htmlContent);
        setPendingAction({name:'DOC',id:configuringDoc?.id}); // used if pin is required 

        let form:any = new FormData()

        form.append('config', JSON.stringify(config))
        form.append("school", selectedSchool?.id)
        form.append("name",   configuringDoc?.name)
        form.append("type",configuringDoc?.type)
        // console.log('configuringDoc: ', configuringDoc);
        form.append("filetype",configuringDoc?.fileType)
        // form.append("htmlContent",htmlContent)
        
        setserverForm(form)
        // Make the api call here  when user  need no pin to talk to server  
        if (!currentUser?.user?.pin_set && pendingRequests === "Create"){
            let url = `/school/template/${selectedSchool.id}/`
            sendRequest(url,"POST",serverForm as any ,triggeredFunc,true,true) 
            return ;
        }
        if (!currentUser?.user?.pin_set && pendingRequests === "Update"){
            let url = `/school/template/${selectedSchool.id}/${configuringDoc?.id}/`
            sendRequest(url,"PUT",serverForm as any ,triggeredFunc,true,true) 
            return ;
        }
        if (configuringDoc?.id){
            setEditorPin(true)
        }else{
            setShowPinModal(true);
        }
        return ;
    }

    const handleDeleteTemp = () => {
            setPendingRequests("Delete")
            // api call here  no pins required 
            let pins = null 
            if (!currentUser?.user?.pin_set){
                let url = `/school/template/${selectedSchool.id}/${deletingDoc?.id}/${pins}/`
                sendRequest(url,"DELETE",serverForm as any ,triggeredFunc,true,!true) 
                return ;
            }
            setShowPinModal(true);
            return ;
    };

    const handleActivateTemplate = (doc:DocTemplate) => {
        setPendingRequests("Update");
        setPendingAction({name:'DOC',id:doc.id}); // used if pin is required 
        
        let form:any = new FormData()
        form.append("isActive",true)
        setserverForm(form)
       
        if (!currentUser?.user?.pin_set){
            let url = `/school/template/${selectedSchool.id}/${doc?.id}/`
            sendRequest(url,"PUT",serverForm as any ,triggeredFunc,true,true) 
            return ;
        }
        setShowPinModal(true);
        return ;
    }
                                                
    const renderTemplateCategory = (title: string, type: 'Form' | 'Report' | 'Transcript' | 'Certificate' | 'Other') => {
        const templates = data.documents?.filter((d: DocTemplate) => d.type === type) || [];
        const activeId = templates.find((d: DocTemplate) => d.isActive)?.id || null;

        const getIcon = type === "Form"? "fa-file-lines" :
                        type === "Report"? "fa-chart-bar" :
                        type === "Transcript"? "fa-file-signature" :
                        type === "Certificate"? "fa-certificate" :
                        "fa-file" ;

        return (
            <div className="mb-8">
                <div className="flex gap-4 items-center mb-4 border-b border-gray-100 pb-2">
                    <h3 className="font-bold text-navy-900 flex items-center text-lg">
                        <i className={`fa-solid ${getIcon} mr-2 text-navy-600`}></i> {title}
                    </h3>
                    <Button onClick={() => { setDefaultNewDocType(type); setUploadingDoc(true); setPendingRequests("Create") }} className="text-xs px-3 py-1 w-fit ">
                        <i className="fa-solid fa-plus mr-2"></i> Create New
                    </Button>
                </div>
                {templates.length > 0 ? ( 
                    <div className="grid grid-cols-2 md:grid-cols-3 md:grid-cols-4  gap-4"> 
                        {templates.map((doc: DocTemplate,index) => (
                            <div key={`${doc.id}-${index}`} className={`border ${doc?.isActive? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow relative group bg-white`}>
                                { activeId === doc.id && (
                                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm z-10 flex items-center">
                                        <i className="fa-solid fa-check-circle mr-1"></i> Active 
                                    </div>
                                )}

                                <div className="h-24 bg-gray-50 rounded mb-3 flex items-center justify-center text-4xl text-gray-300 relative overflow-hidden">
                                    <i className="fa-solid fa-file-code text-blue-500"></i>
                                    {doc.isConfigured &&
                                     <div className="absolute top-2 left-2 bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">
                                         Configured
                                     </div>}
                                </div>
                                <h4 className="font-bold text-navy-900 text-sm truncate pr-6" title={doc.name}>{doc.name}</h4>
                                <p className="text-xs text-gray-500 mb-2">HTML Template</p>
                                
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button 
                                        onClick={() => setPreviewingDoc(doc)}
                                        className="text-gray-600 text-xs font-bold border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 flex-1 flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-eye mr-1"></i> Preview
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setPendingRequests("Update");
                                            setConfiguringDoc(doc);

                                        }}
                                        className="text-gold-600 text-xs font-bold border border-gold-300 px-2 py-1 rounded hover:bg-gold-50 flex-1 flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-pen-ruler mr-1"></i> Design.
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {activeId !== doc.id && (
                                        <button 
                                            onClick={(e) => {
                                                // e.stopPropagation();
                                                handleActivateTemplate(doc);
                                            }}
                                            className="text-green-600 text-xs font-bold border border-green-300 px-2 py-1 rounded hover:bg-green-50 flex-1 flex items-center justify-center"
                                        >
                                            <i className="fa-solid fa-check mr-1"></i> Set Active
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => {
                                            setDeletingDoc(doc);
                                            
                                        }}
                                        className="text-red-500 text-xs font-bold border border-red-200 px-2 py-1 rounded hover:bg-red-50 flex-1 flex items-center justify-center"
                                    >
                                        <i className="fa-solid fa-trash mr-1"></i> Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                        <p className="text-gray-500 text-sm mb-3">No {title?.toLowerCase()}s available.</p>
                        <Button onClick={() => { setDefaultNewDocType(type); setUploadingDoc(true);  setPendingRequests("Create");}} variant="outline" className="text-xs">
                            Create New {title}
                        </Button>
                    </div>
                )}
            </div>
        );
    };

    // --- CREATE TEMPLATE MODAL ---
    const CreateTemplateModal = () => {
        const [newDocName, setNewDocName] = useState('');
        const [newDocType, setNewDocType] = useState<'Form' | 'Report' | 'Transcript' | 'Certificate' | 'Other' | string>(defaultNewDocType);
        const [customType, setCustomType] = useState('');

        const handleCreate = () => {
            if (!newDocName) {
                onToast({ message: "Please provide a name.", type: 'error' });
                return;
            }

            const finalType = newDocType === 'Other' && customType ? customType : newDocType;

            const newDoc: DocTemplate = {
                id: `school_doc_${Date.now()}` ,
                name: newDocName,
                type: finalType as any,
                fileType: 'HTML',
                lastUpdated: new Date().toISOString().split('T')[0],
                isConfigured: false ,
                category: 'SCHOOL',
                config: {
                    documentTitle: newDocName,
                    templateType: finalType as any
                } as any
            };

            setUploadingDoc(false);
            setConfiguringDoc(newDoc); // Open editor immediately
            onToast({ message: "Template Initiated! Please configure and save it.", type: 'success' });
        };

        return (
            <div className="relative">
                <Modal isOpen={uploadingDoc} onClose={() => setUploadingDoc(false)} title="Create New Template." icon="fa-solid fa-file-circle-plus"
                    className={''}
                    >
                    <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                            <i className="fa-solid fa-circle-info mr-2"></i>
                            Use our visual editor to design your school's unique documents. The generated HTML can be used by your backend to generate PDFs.
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Template Name</label>
                            <Input 
                                value={newDocName} 
                                onChange={(e) => setNewDocName(e.target.value)} 
                                placeholder="e.g., Mid-Term Report Card" 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Template Type</label>
                            <select 
                                value={newDocType} 
                                onChange={(e) => setNewDocType(e.target.value as any)}
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                            >
                                <option value="Form">Form</option>
                                <option value="Report">Report Card</option>
                                <option value="Transcript">Transcript</option>
                                <option value="Certificate">Certificate</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        {newDocType === 'Other' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Specify Other Type</label>
                                <Input 
                                    value={customType} 
                                    onChange={(e) => setCustomType(e.target.value)} 
                                    placeholder="e.g., ID Card, Letterhead" 
                                />
                            </div>
                        )}

                        <div className="flex justify-end pt-4 border-t border-gray-100 gap-2">
                            <Button variant="outline" onClick={() => setUploadingDoc(false)}>Cancel</Button>
                            <Button onClick={handleCreate}>Create & Design</Button>
                        </div>
                    </div>
                </Modal>

            </div>
        );
    };

    // --- DOCUMENT PREVIEW MODAL ---
    const TemplatePreviewModal = () => {
        if (!previewingDoc) return null;

        return (
            <Modal isOpen={!!previewingDoc} onClose={() => setPreviewingDoc(null)} title={`Preview: ${previewingDoc.name}`} icon="fa-solid fa-eye">
                <div className="bg-gray-100 p-4 rounded-lg overflow-hidden flex flex-col items-center min-h-[500px]">
                    {previewingDoc.htmlContent ? (
                        <div 
                            className="bg-white shadow-xl transform scale-90 origin-top w-[210mm] min-h-[297mm] flex flex-col"
                            dangerouslySetInnerHTML={{ __html: previewingDoc.htmlContent }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            This template has not been configured yet.
                        </div>
                    )}
                </div>
                <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-gray-100">
                    <Button variant="outline" onClick={() => setPreviewingDoc(null)}>Close Preview</Button>
                    <Button onClick={() => window.print()}><i className="fa-solid fa-print mr-2"></i> Print Test</Button>
                </div>
            </Modal>
        );
    };

    // --- DELETE TEMPLATE MODAL ---
    const DeleteTemplateModal = () => {
        if (!deletingDoc) return null ;

        return (
            <Modal isOpen={!!deletingDoc} onClose={() => setDeletingDoc(null)} title="Delete Template" icon="fa-solid fa-triangle-exclamation">
                <div className="p-4">
                    <p className="text-gray-700 mb-4">Are you sure you want to delete the template <strong>{deletingDoc.name}</strong>? This action cannot be undone.</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setDeletingDoc(null)}>Cancel</Button>
                        <Button onClick={handleDeleteTemp} className="bg-red-600 hover:bg-red-700 text-white border-red-600">Delete</Button>
                    </div>
                </div>
            </Modal>
        );
    };

    if (configuringDoc) {
        return ( 
            <>
                <div className="animate-fadeIn relative ">
                    <div className="mb-4 flex items-center justify-between"> 
                        <div>
                            <h2 className="text-xl font-bold text-navy-900"> Editing: {configuringDoc.name} </h2>
                            <p className="text-sm text-gray-500"> Design your template visually. The generated HTML will be saved for backend PDF generation. </p>
                        </div>
                        <Button variant="outline" onClick={() => setConfiguringDoc(null)} className="text-sm max-w-md">
                            <i className="fa-solid fa-arrow-left mr-2"></i> Back to Templates
                        </Button>
                    </div>
                        <TemplateEditor 
                            initialConfig={configuringDoc.config}
                            onSave={(config, htmlContent) => { saveTemplate(config, htmlContent)}}
                            onCancel={() => setConfiguringDoc(null)}
                            pinModal = {editorPin}
                            setPinModal = {setEditorPin}
                            handlePinSuccess={handlePinSuccess}
                        />
                </div>
            </>
        );
    }

    return (
        <> 
        
            <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
            <TemplatePreviewModal />
            {<DeleteTemplateModal />}
            <div className="space-y-6 animate-fadeIn max-h-full overflow-y-auto  ">
                <CreateTemplateModal />
                <div className="border-b border-gray-100 pb-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-navy-900"> System Templates</h2>
                        <p className="text-sm text-gray-500">Manage and design your official school documents.</p>
                    </div>
                    <Button onClick={() => {setDefaultNewDocType("Form");setUploadingDoc(true); setPendingRequests("Create") }} className="text-xs px-3 py-1 w-fit ">
                        <i className="fa-solid fa-plus mr-2"></i> Create New
                    </Button>
                
                </div>
                {tempTypes && tempTypes.map((temp,index) => (
                    <div key={`temp-${index}`}>
                        {renderTemplateCategory(temp.name as string , temp.type as any)}

                    </div>
                ))}

                
            </div>
        </>
    );
};
