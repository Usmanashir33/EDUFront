
import React ,{useEffect} from 'react';
import { Button, Toggle,Modal } from '../UI';

interface SecuritySettingsProps {
    data: any;
    setData: (d: any) => void;
    saveData: (d: any) => void;
    originalData: any; 
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({ data, setData,saveData, originalData }) => {
    
    // Check if a specific field has been modified
    const isChanged = (field: string) => data[field] !== originalData[field];
    const checkUpdate = () => {
        let hasNotChanges = true;
        Object.entries(data).forEach(([key,value]) => {
            if (isChanged(key)) hasNotChanges = false;
        })
        return hasNotChanges;
    }
    useEffect(() => {
        // After successful save, we can revoke the object URL to free memory
        return () => setData({ ...originalData}); // Reset to original on unmount or when logo changes
    }, []);
    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Security & Access Control</h2>
                <p className="text-sm text-gray-500">Configure authentication barriers, session rules, and sensitive action guards.</p>
            </div>

            {/* Critical Authentication Section */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-navy-50 p-4 border-b border-gray-200">
                    <h4 className="font-bold text-navy-900 flex items-center">
                        <i className="fa-solid fa-key mr-2"></i> Authentication & Login
                    </h4>
                </div>
                <div className="p-6 space-y-6">
                    {/* 2FA Toggle */}
                    <div>
                        <Toggle 
                            label="Two-Factor Authentication (2FA)" 
                            description="Require an email OTP for every new device login." 
                            checked={data.twoFactor} 
                            onChange={v => setData({...data, twoFactor: v})} 
                        />
                        {isChanged('twoFactor') && (
                            <div className={`mt-2 p-3 rounded text-xs flex items-start gap-2 ${data.twoFactor ? 'bg-green-50 text-green-800 border-l-4 border-green-500' : 'bg-red-50 text-red-800 border-l-4 border-red-500'} animate-fadeIn`}>
                                <i className={`fa-solid ${data.twoFactor ? 'fa-shield-halved' : 'fa-triangle-exclamation'} mt-0.5`}></i>
                                <div>
                                    <span className="font-bold block mb-1">{data.twoFactor ? 'Security Enhanced:' : 'Security Reduced:'}</span>
                                    {data.twoFactor 
                                        ? "Users will be challenged with an OTP. Ensure email services are active." 
                                        : "Disabling 2FA makes staff accounts vulnerable to password theft and phishing attacks."}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Session Timeout */}
                    <div>
                        <label className="block text-sm font-bold text-navy-900 mb-2">Session Inactivity Timeout</label>
                        <select 
                            className={`w-full md:w-1/2 p-3 rounded-md border focus:ring-2 focus:ring-navy-900 focus:border-transparent bg-white shadow-sm transition-colors ${isChanged('sessionTimeout') ? 'border-orange-400 ring-2 ring-orange-100' : 'border-gray-300'}`} 
                            value={data.sessionTimeout} 
                            onChange={e => setData({...data, sessionTimeout: e.target.value})}
                        >
                            <option value={'30m'}>30 Minutes</option>
                            <option value={'1h'}>1 Hour</option>
                            <option value={'4h'}>4 Hours</option>
                            <option value={'24h'}>24 Hours</option>
                            <option value={'2d'}>2 Days</option>
                        </select>
                        {isChanged('sessionTimeout') && (
                            <p className="text-xs text-orange-600 mt-2 font-medium flex items-center animate-fadeIn">
                                <i className="fa-solid fa-clock mr-1"></i>
                                Timeout policy changed. Users will be auto-logged out after {data.sessionTimeout} of inactivity.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Operational Guards Section */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-navy-50 p-4 border-b border-gray-200">
                    <h4 className="font-bold text-navy-900 flex items-center">
                        <i className="fa-solid fa-shield-cat mr-2"></i> Operational Guards
                    </h4>
                </div>
                <div className="p-6 space-y-6">
                    {/* PIN Requirement */}
                    <div>
                        <Toggle 
                            label="PIN Requirement" 
                            description="Enforce 4-digit PIN for sensitive actions (Deletion, Salary Payment)." 
                            checked={data.requirePin} 
                            onChange={v => setData({...data, requirePin: v})} 
                        />
                        {isChanged('requirePin') && !data.requirePin && (
                            <div className="mt-2 p-3 rounded text-xs bg-red-50 text-red-800 flex items-start gap-2 border-l-4 border-red-500 animate-fadeIn">
                                <i className="fa-solid fa-skull-crossbones mt-0.5"></i>
                                <div>
                                    <span className="font-bold block mb-1">High Risk Action:</span>
                                    <p>Disabling PIN protection removes the final barrier against accidental or malicious data destruction (Deleting Teachers, Students, etc.). Are you sure?</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-gray-100"></div>

                    {/* New Device Alerts */}
                    <Toggle 
                        label="Loggin Device Alerts" 
                        description="Send an email notification to the Director whenever a new device logs into an admin account." 
                        checked={data.loginAlerts ?? true} 
                        onChange={v => setData({...data, loginAlerts: v})} 
                    />

                    <div className="border-t border-gray-100"></div>

                    {/* Strong Password Policy */}
                    {/* <div>
                        <Toggle 
                            label="Enforce Strong Passwords" 
                            description="Require 8+ chars, numbers, and symbols for all Staff and Director accounts." 
                            checked={data.strongPasswordPolicy ?? true} 
                            onChange={v => setData({...data, strongPasswordPolicy: v})} 
                        />
                        {isChanged('strongPasswordPolicy') && !data.strongPasswordPolicy && (
                            <p className="text-xs text-orange-600 mt-2 pl-12 flex items-center animate-fadeIn">
                                <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                <b>Warning:</b> Weak passwords are the #1 cause of data breaches. Recommended to keep enabled.
                            </p>
                        )}
                    </div> */}
                    <div className="px-6 pt-6 mt- border-t border-gray-100 md:block">
                        <Button onClick={saveData} disabled={checkUpdate()} className="w-full">
                        <i className="fa-solid fa-save mr-2"></i> Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
