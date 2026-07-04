import React, { useEffect, useMemo, useState } from 'react';

//  Updated to use absolute path aliases
import { Button, FadeIn, PinModal, Toast } from '@/components/UI';
import { Teacher, SchoolSection, Subject, SchoolRole, SchoolPermission } from '@/types';

// 🛠️ Sub-Components (Updated with absolute paths)
import { SecuritySettings } from '@/components/settings/SecuritySettings';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';

import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';

type SettingsTab = 'SECURITY' | 'APPEARANCE' ;
type PendingActionMethodes =  'ADD' | 'EDIT' | 'DELETE' | 'TOGGLE'

interface SettingsManagerProps { 
}

export const TeacherSettingsManager: React.FC<SettingsManagerProps> = ({ 
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('SECURITY');
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const {selectedSchool,
    setSelectedSchool,
  } = React.useContext(uiContext);

  const {currentUser,setCurrentUser} = React.useContext(authContext);
  let [serverForm,setServerForm] = useState(new FormData());
  const {sendRequest} = useRequest();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction,setPendingAction] = useState<{name:any,method:PendingActionMethodes,id?:any}>({name:"",method:"ADD",id:null})
    


  // Default Values
const defaultSecurity = () => {
  return {
          requirePin: currentUser?.user?.pin_set,
          sessionTimeout: currentUser?.user?.session_timeout,
          twoFactor: currentUser?.user?.otp_required ,
          loginAlerts: currentUser?.user?.login_alerts, // New professional setting
        }
}
const defaults = useMemo(() => {
return { 
      
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
  
  }; 
},[selectedSchool])


  // State Management
  const [security, setSecurity] = useState(() => defaultSecurity());

  const [appearance, setAppearance] = useState(defaults.appearance);
  // const [templates, setTemplates] = useState( defaults.templates);
 
  
 
  const TriggeredFunc = (res) => {
    // console.log('res: ', res);
    if (res?.success){setToast({message: res.success, type: 'success'}) }
    // update ui here 

   if (res?.updated_user) { 
      let u = res?.updated_user
      setCurrentUser(prev => ({
        ...prev,
        user: {
          ...prev.user,
          pin_set:u.requirePin,
          session_timeout :u.sessionTimeout ,
          otp_required:u.twoFactor ,
          login_alerts:u.loginAlerts
        }
      })) ;
      setSecurity(
          {
          requirePin: u.requirePin,
          sessionTimeout: u.sessionTimeout,
          twoFactor: u.twoFactor ,
          loginAlerts: u.loginAlerts, 
        }
      )
    }

    

  } 



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
  const handlePinSuccess = (pins:any) => {
    try {  
      serverForm.append("pin", pins );
    }catch(e){
    }
    setShowPinModal(false);

    if(activeTab === 'SECURITY') {
        sendRequest(`/director/security-settings/${selectedSchool.id}/`,"PUT",serverForm as any,TriggeredFunc,true,true)
    }
   
  } 
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
            <TabButton id="SECURITY" label="Security Settings" icon="fa-solid fa-shield-halved" />
            <TabButton id="APPEARANCE" label="Appearance Settings" icon="fa-solid fa-palette" />
          </nav>
        </div>
  
        {/* Content Area */}
        <div className="flex-1 w-full bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-10 h-full max-h-full overflow-y-auto ">
          <FadeIn key={activeTab}>
          

            
            {activeTab === 'SECURITY' && <SecuritySettings data={security} setData={setSecurity} saveData = {saveSecurity} originalData={defaultSecurity()}   />}
            
            {activeTab === 'APPEARANCE' && <AppearanceSettings data={appearance} setData={setAppearance} />}
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
