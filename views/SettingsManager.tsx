
import React, { useEffect, useMemo, useState } from 'react';
import { Button, FadeIn, PinModal, Toast } from '../components/UI';
import { Teacher, SchoolSection, Subject,SchoolRole,SchoolPermission } from '../types';

// Sub-Components
import { BoardSettings } from '../components/settings/BoardSettings';
import { AcademicSettings } from '../components/settings/AcademicSettings';
import { TimetableSettings } from '../components/settings/TimetableSettings';
import { FinanceSettings } from '../components/settings/FinanceSettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { TemplateSettings } from '../components/settings/TemplateSettings';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import { RoleSettings } from '@/components/settings/RoleSettings';

type SettingsTab = 'BOARD'|'ROLES' | 'ACADEMIC' | 'TIMETABLE' | 'FINANCE' | 'SECURITY' | 'APPEARANCE' | 'TEMPLATES';
type FinanceActions = 'ADD' | 'EDIT' | 'DELETE' | 'TOGGLE' | "SETFEE" | "SETPROMOTION";


interface SettingsManagerProps { 
    onLogActivity?: (action: any, module: any, description: string) => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ 
    onLogActivity,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('BOARD');
  const [financeAction, setFinanceAction] = useState<FinanceActions>('ADD');
  const [isFinanceFormOpen, setIsFinanceFormOpen] = useState(false);
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const {selectedSchool,
    setSelectedSchool,
    templates:configuredTemp,
    finances,
    setFinances ,
    teachers,
    sections,
    subjects,
    setPromotionLogs,
    promotionLogs,
    roles,
    permissions,
    setRoles,
    setPermissions
  } = React.useContext(uiContext);
  const {currentUser,setCurrentUser} = React.useContext(authContext);
  let [serverForm,setServerForm] = useState(new FormData());
  const {sendRequest} = useRequest();
  const [showPinModal, setShowPinModal] = useState(false);
  const [promotionMappings, setPromotionMappings] = useState<{fromClassId: string, toClassId: string}[]>([]);
  const [pendingAction,setPendingAction] = useState<{name:any,method:'ADD'|"EDIT"|"DELETE",id?:any}>({name:"",method:"ADD",id:null})
    

  // Default Values
const defaultBord = () => {
  return {
          name: selectedSchool?.name   || "",
          logo: selectedSchool?.logo   || "",
          tag: selectedSchool?.tag  || "" ,
          address: selectedSchool?.address  || "",
          email: selectedSchool?.email  || "",
          phone: selectedSchool?.phone  || "",
          website: selectedSchool?.website  || ""
      }
  
}
const defaults = useMemo(() => {
  return { 
      board: {
          name: selectedSchool?.name ,
          logo: selectedSchool?.logo ,
          tag: selectedSchool?.tag ,
          address: selectedSchool?.address,
          email: selectedSchool?.email,
          phone: selectedSchool?.phone,
          website: selectedSchool?.website
      },
      
      academic: {
          session: selectedSchool?.sessions?.find((s) => s.is_current )?.name  || '2023/2024',
          term: selectedSchool?.terms?.find((t) => t.is_current  ) ?.name  || '1st Term',
          availableSessions:selectedSchool?.sessions.map((s) => s.name) ||  ['2023/2024', '2024/2025'], // Added for dynamic list
          availableTerms: selectedSchool?.terms?.map((s) => s.name) || ['1st Term', '2nd Term', '3rd Term'], // Added for dynamic list
          autoPromotion: selectedSchool?.auto_promotion,
          lockPastRecords: selectedSchool?.lock_records,
          gradingSystem : selectedSchool?.grading_system || 'Standard (A-F)' ,
          executedPromotions :[ ]
        },
      finance: {
          onlinePayment: true,
          paymentDueDate: 14,
  
          bank_accounts: [
  
          ],
      },
      security: {
          requirePin: currentUser?.user?.pin_set,
          sessionTimeout: '30 Minutes',
          twoFactor: currentUser?.user?.otp_required ,
          loginAlerts: true, // New professional setting
          strongPasswordPolicy : true // New professional setting
      },
      
      appearance: {
          theme: 'Light',
          accentColor: 'Navy',
          compactMode: false
      },
  
      templates: {
          headerImage: '', 
          useCustomHeader: true,
          documents: configuredTemp ,
      }
  };
},[selectedSchool])

  // State Management
  const [board, setBoard] = useState(() => defaultBord() );
  const [academic, setAcademic] = useState(defaults.academic);
  const [security, setSecurity] = useState(defaults.security);
  const [appearance, setAppearance] = useState(defaults.appearance);
  const [templates, setTemplates] = useState( defaults.templates);
  useEffect(() => {
      setBoard(defaults?.board)
      // setAcademic(defaults?.academic)
      // setSecurity(defaults?.security)
      // setAppearance(defaults?.appearance)
      // setTemplates(defaults?.templates)
  },[defaults])

  const TriggeredFunc = (res) => {
    console.log('res: ', res);
    if (res?.success){setToast({message: res.success, type: 'success'}) }
    // update ui here 

    if (res?.created_account) {
      setIsFinanceFormOpen(false) ;
      setFinances(prev => ({...prev, bank_accounts: [res.created_account,...prev.bank_accounts]})) ;
      return 
    }
    if (res?.promotion_log) {
      setPromotionLogs((prev: any[]) => {
          const newLog = res.promotion_log;
          const exists = prev.some(log => log.id === newLog.id);
          if (exists) {
              return prev.map(log =>
                  log.id === newLog.id ? newLog : log
              );
          }
          return [newLog, ...prev];
      });
      setPromotionMappings([]);
      return;
    }

    if (res?.updated_account) {
      setIsFinanceFormOpen(false) ;
      setFinances(prev => {
        const updatedAccounts = prev.bank_accounts.map(acc => acc.id === res.updated_account?.id ? res.updated_account : res.updated_account?.is_default ? {...acc, is_default: false} : acc);
        return {...prev, bank_accounts: updatedAccounts};
      }) ;
    }

    if (res?.deleted_account) {
      setFinances(prev => {
        const filteredAccounts = prev.bank_accounts.filter(acc => acc.id != res.deleted_account?.id);
        return {...prev, bank_accounts: filteredAccounts} ;
      }) 
    }

    if (res?.updated_school) { 
      try {
        const session =  JSON.parse(localStorage.getItem('session') as any);
        if (!session) throw new Error("No session found in localStorage");
        localStorage.setItem('session', JSON.stringify({
          ...session,
          school: res.updated_school
          }))
        }catch(e){
            console.error("Failed to update session in localStorage: ", e);
        }
        setSelectedSchool(res.updated_school) ;
    }
    if (res?.updated_user) { 
      try {
        const session =  JSON.parse(localStorage.getItem('session') as any );
        if (!session) throw new Error("No session found in localStorage");
        localStorage.setItem('session', JSON.stringify({
          ...session,
          user: res.updated_user
        }))
      }catch(e){
          console.error("Failed to update session in localStorage: ", e);
      }
      setCurrentUser(res.updated_user) ;
    }

  }

  const saveBoard = () => {
    console.log('board: ', board);
    Object.entries(board).forEach(([key, value]) => {
      // console.log(key, value);
        serverForm.append(key, value);
    });
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
        sendRequest(`/director/school-detail/${selectedSchool.id}/`,"PUT",serverForm as any ,TriggeredFunc,true,true)
       return 
    }
    setShowPinModal(true) ;
  };

  const saveFinance = (action: 'ADD' | 'EDIT'| 'DELETE'|"TOGGLE",formData?: any) => {
    setFinanceAction(action);
    let form:any = {...formData,school: selectedSchool.id}
    let methode = action === "ADD" ? "POST" : (action === "EDIT" || action === "TOGGLE") ? "PUT" : "DELETE";
    let url = action === "ADD" ? `/school/finance/create/` :
              (action === "EDIT" || action === "TOGGLE") ? `/school/finance/update/${formData.id}/` :
               `/school/finance/delete/${selectedSchool.id}/${formData.id}/""/`; // empty string to prevent error since delete endpoint doesn't need body
    setServerForm(form);
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
        sendRequest(url,methode,form,TriggeredFunc,true,false)
       return 
    }
    setShowPinModal(true) ;
  };

  const saveAcademic = (operation:"SETFEE"|"ACADEMIC"|"SETPROMOTION" = "ACADEMIC", fdata?:any ) => {
    let f:any = {}
    if (operation === "ACADEMIC"){
      let form:any = new FormData()
      Object.entries(academic).forEach(([key, value]) => {
        // check list type to loop throygh it 
  
        if (typeof value === 'object' && Array.isArray(value)) {
          value.forEach((item, index) => {
            form.append(key, item);
          });
        } else {    
          form.append(key, value);
        }
      });
      f=form; // for local use 
      setServerForm(form)
    }else if (operation === "SETFEE"){
      setFinanceAction("SETFEE")
      f = fdata // data is raedy form to be pushed to server 
      setServerForm(fdata)

    }else if (operation === "SETPROMOTION"){
      setFinanceAction("SETPROMOTION")
      f = fdata // data is raedy form to be pushed to server 
      setServerForm(fdata)
    }
    if (!f){return setToast({type:'error',message:"form not ready"})}
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
        if (financeAction === 'SETFEE'){
            sendRequest(`/school_finance/school-fee-settings/set-fee-for-classes/`,"POST",f as any,TriggeredFunc,true,!true)
          }else if (financeAction === "SETPROMOTION"){
          sendRequest(`/director/class/promotion/`,"POST",serverForm as any,TriggeredFunc,true,!true)
        }else{
          sendRequest(`/director/academic-settings/${selectedSchool.id}/`,"PUT",f as any,TriggeredFunc,true,true)
        }
       return 
    }
    setShowPinModal(true) ;
  };

  const saveSecurity = () => {
    let form:any = new FormData()
    Object.entries(security).forEach(([key, value]) => {
      // check list type to loop throygh it 

      if (typeof value === 'object' && Array.isArray(value)) {
        value.forEach((item, index) => {
          form.append(key, item) ;
        });
      } else {    
        form.append(key, value);
      }
    });
    setServerForm(form)
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
        sendRequest(`/director/security-settings/${selectedSchool.id}/`,"PUT",form,TriggeredFunc,true,true)
       return 
    }
    setShowPinModal(true);
  };
  const RolesAndPermServerResp = (res : any ) => {
    setPendingAction({name:"",method:"ADD",id:null})
    if (res?.success){setToast({message: res.success, type: 'success'}) }
    // update the ui here 
    if (res?.new_perm){
      return setPermissions(prev => [res?.new_perm,...prev]);
    }
    if (res?.updated_perm){
      let updated = res?.updated_perm
      return setPermissions(prev => {
        return prev.map(p => p.id === updated.id ? updated : p )
      });
    }
    if (res?.new_role){
      return setRoles(prev => [res?.new_role,...prev]);
    }
    if (res?.updated_role){
      let updated = res?.updated_role
      return setRoles(prev => {
        return prev.map(p => p.id === updated.id ? updated : p )
      });
    }

  }

  const handleRolesSave = (form:any,action:"ADD"|"EDIT"|"DELETE") => {
    // Here you would typically send the updated permissions to the server
    let method = action === "ADD" ? "POST" : action === "EDIT" ? "PUT" : "DELETE";
    let url = action === "ADD" ? `/school/role/create/` :
              action === "EDIT" ? `/school/role/update/${form.id}/` :
                                   `/school/role/delete/${form.id}/${''}/`; // empty string to prevent error since delete endpoint doesn't need body
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
      sendRequest(url,method,form as any,RolesAndPermServerResp,true,!true)
       return 
    }
    setServerForm(form);
    setPendingAction({name:"ROLE",method:action,id:form?.id})
    setShowPinModal(true) ;
  }
  const handlePermissionsSave = (form:any,action:"ADD"|"EDIT"|"DELETE") => {
    // Here you would typically send the updated permissions to the server
    let method = action === "ADD" ? "POST" : action === "EDIT" ? "PUT" : "DELETE";
    let url = action === "ADD" ? `/school/permission/create/` :
    action === "EDIT" ? `/school/permission/update/${form.id}/`:
    `/school/permission/delete/${form.id}/${''}/`; // empty string to prevent error since delete endpoint doesn't need body
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
      sendRequest(url,method,form as any,RolesAndPermServerResp,true,!true)
       return 
    }
    setServerForm(form);
    setPendingAction({name:"PERMISSION",method:action,id:form?.id})
    setShowPinModal(true) ;
  }

  const handlePinSuccess = (pins:any) => {
    try {  
      serverForm.append("pin", pins );
    }catch(e){
    }
    setShowPinModal(false);
    if (pendingAction?.name === "PERMISSION"){
      // Here you would typically send the updated permissions to the server
      let action = pendingAction?.method
      let id = pendingAction?.id
      let method = action === "ADD" ? "POST" : action === "EDIT" ? "PUT" : "DELETE";
      let url = action === "ADD" ? `/school/permission/create/` :
      action === "EDIT" ? `/school/permission/update/${id}/`:
      `/school/permission/delete/${id}/${pins}/`; // empty string to prevent error since delete endpoint doesn't need body
      // Make the api call here  when user  need no pin to talk to server  
      sendRequest(url,method,{...serverForm,pin:pins} as any,RolesAndPermServerResp,true,!true)
      return ;
    }
    
    if (pendingAction?.name === "ROLE"){
      // Here you would typically send the updated permissions to the server
      let action = pendingAction?.method
      let id = pendingAction?.id
      let method = action === "ADD" ? "POST" : action === "EDIT" ? "PUT" : "DELETE";
      let url = action === "ADD" ? `/school/role/create/` :
      action === "EDIT" ? `/school/role/update/${id}/`:
      `/school/role/delete/${id}/${pins}/`; // empty string to prevent error since delete endpoint doesn't need body
      // Make the api call here  when user  need no pin to talk to server  
      sendRequest(url,method,{...serverForm,pin:pins} as any,RolesAndPermServerResp,true,!true)
      return ;
    }
    
    if(activeTab === 'BOARD') {
      sendRequest(`/director/school-detail/${selectedSchool.id}/`,"PUT",serverForm as any,TriggeredFunc,true,true)
    }

    if(activeTab === 'ACADEMIC') {
      if (financeAction === 'SETFEE'){
        let f = {...serverForm,pin:pins}
        sendRequest(`/school_finance/school-fee-settings/set-fee-for-classes/`,"POST",f as any,TriggeredFunc,true,false)
      }else if (financeAction === 'SETPROMOTION'){
        let f = {...serverForm,pin:pins}
        sendRequest(`/director/class/promotion/`,"POST",f as any,TriggeredFunc,true,false)
      }else{
        sendRequest(`/director/academic-settings/${selectedSchool.id}/`,"PUT",serverForm as any,TriggeredFunc,true,true)
        }
    }
    if(activeTab === 'SECURITY') {
        sendRequest(`/director/security-settings/${selectedSchool.id}/`,"PUT",serverForm as any,TriggeredFunc,true,true)
    }
    if(activeTab === 'FINANCE') {
      let form : any = {...serverForm, pin: pins}
      if (financeAction === 'ADD') {
        sendRequest(`/school/finance/create/`,"POST",form as any ,TriggeredFunc,true,false)
      } else if (financeAction === 'EDIT' || financeAction === 'TOGGLE') {
        sendRequest(`/school/finance/update/${form?.id}/`,"PUT",form as any ,TriggeredFunc,true,false)
      } else if (financeAction === 'DELETE') {
        sendRequest(`/school/finance/delete/${selectedSchool.id}/${form?.id}/${form?.pin}/`,"DELETE",null as any ,TriggeredFunc,true,false)
      }
      return 
    }
   
  } 
  // Timetable State (Complex, kept separate mostly)
  const [timetableConfig, setTimetableConfig] = useState({
      periodsPerDay: 8,
      durationPerPeriod: 40,
      breakDuration: 30,
      selectedSections: [] as string[],
      selectedTeacherIds: [] as string[],
      teacherAvailability: {} as Record<string, { days: string[], startTime: string, endTime: string, maxHours: number }>
  });
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
    <>
      <PinModal isOpen={showPinModal} onClose={() => setShowPinModal(false)} onSuccess={handlePinSuccess} title="Authorize Action" />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="animate-fadeIn flex flex-col md:flex-row gap-2 items-start h-full max-h-full overflow-y-hidden ">
        {/* make it full screen with out allowing page scroll  */}
        
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-gray-200 py-4 shrink-0 md:sticky md:top-0 z-10">
          <h3 className="px-6 pb-4 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100">
            Configuration
          </h3>
          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible no-scrollbar">
            <TabButton id="BOARD" label="Board Settings" icon="fa-solid fa-building-columns" />
            <TabButton id="ACADEMIC" label="Academic" icon="fa-solid fa-book-open" />
            <TabButton id="ROLES" label="Roles & Access" icon="fa-solid fa-users-gear" />
            <TabButton id="TIMETABLE" label="Timetable Gen" icon="fa-solid fa-calendar-days" />
            <TabButton id="FINANCE" label="Financial" icon="fa-solid fa-wallet" />
            <TabButton id="SECURITY" label="Security" icon="fa-solid fa-shield-halved" />
            <TabButton id="APPEARANCE" label="Appearance" icon="fa-solid fa-palette" />
            <TabButton id="TEMPLATES" label="Documents & Files" icon="fa-solid fa-file-contract" />
          </nav>
        </div>
  
        {/* Content Area */}
        <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-10 h-full max-h-full overflow-y-auto ">
          <FadeIn key={activeTab}>
          

            {activeTab === 'BOARD' && <BoardSettings data={board} setData={setBoard} saveData = {saveBoard} originalData={defaultBord()} />}
            {activeTab === 'ACADEMIC' && <AcademicSettings
              data={academic}          
              setData={setAcademic}          
              saveData = {saveAcademic}          
              originalData={defaults.academic}          
              promotionMappings={promotionMappings}          
              setPromotionMappings={ setPromotionMappings}           
            />}
            
            {activeTab === 'TIMETABLE' && (
                <TimetableSettings 
                    config={timetableConfig} 
                    setConfig={setTimetableConfig} 
                    teachers={teachers} 
                    sections={sections} 
                    subjects={subjects} 
                    onToast={setToast} 
                />
            )}
            {activeTab === 'ROLES' && <RoleSettings roles={roles} permissions={permissions} onUpdateRoles={handleRolesSave} onUpdatePermissions={handlePermissionsSave} />}
          
            {activeTab === 'FINANCE' && <FinanceSettings data={finances} saveData={saveFinance} isFinanceFormOpen={isFinanceFormOpen} setIsFinanceFormOpen={setIsFinanceFormOpen} />}
            {activeTab === 'SECURITY' && <SecuritySettings data={security} setData={setSecurity} saveData = {saveSecurity} originalData={defaults.security}   />}
            {activeTab === 'APPEARANCE' && <AppearanceSettings data={appearance} setData={setAppearance} />}
            {activeTab === 'TEMPLATES' && (
                <TemplateSettings 
                    data={templates} 
                    setData={setTemplates} 
                    boardName={board.name} 
                    boardAddress={board.address} 
                    boardEmail={board.email} 
                    boardPhone={board.phone} 
                    academicSession={academic.session} 
                    onToast={setToast} 
                />
            )}
          </FadeIn>
        </div>
        
        {/* Mobile Save Button */}
        {/* <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 md:hidden z-20">
            <Button onClick={handleSave}>Save Changes</Button>
        </div> */}
      </div>

    </>
    );
};
