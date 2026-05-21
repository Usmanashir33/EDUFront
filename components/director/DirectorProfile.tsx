
import React, { useState, useRef, useEffect ,useContext } from 'react';
import { Director, Gender } from '../../types';
import { Input, Button, ImageUpload, PinModal, Toast, Modal } from '../UI';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import { uiContext } from '@/customContexts/UiContext';
import urls from '@/customHooks/ServerUrls';

interface DirectorProfileProps {
    onLogActivity: (action: any, module: any, desc: string) => void;
}

type VerificationStep = 'IDLE' | 'PIN_CHECK' | 'OTP_CHECK';

export const DirectorProfile: React.FC<DirectorProfileProps> = ({ onLogActivity }) => {
    // --- STATE MANAGEMENT ---
    const {currentUser :director,setCurrentUser,setUserRole} = useContext(authContext);
    const [formData, setFormData] = useState<Director>({ ...director });
    const [isDirty, setIsDirty] = useState(false);
    const {toast, setToast,} = useContext(uiContext);
    let [serverForm,setServerForm]= useState(new FormData()) // form to handle server data 
    const {sendRequest} = useRequest() ;
    
    // Security Flow State
    const [verificationStep, setVerificationStep] = useState<VerificationStep>('IDLE');
    const [otp, setOtp] = useState(['', '', '', '', '']);
    const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
    

    // Track original email to detect changes
    const isEmailChanged = formData.email !== director.email;

    // --- HANDLERS ---
    const handleChange = (field: any, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
    };
    const TriggeredFunc = (data) => {
        console.log('data: ', data);
        if (data.success === 'otp_sent')   {
            serverForm.delete('otp') // reset the old 
            setVerificationStep('OTP_CHECK') ;
            setToast({ message: data?.success, type: 'success' });


     }else if (data?.updated_director){
        serverForm.delete('otp') // reset the old 
        serverForm.delete('pin') // reset the old 
        // 1. Commit Update
        // update the session user 
        const storedSession = localStorage.getItem('session');
    
        if (storedSession) {
            try {
                const session  = JSON.parse(storedSession);
                let updated_session = session
                updated_session.user = data?.updated_director
                // save in the session 
                localStorage.setItem('session', JSON.stringify(updated_session));
                setUserRole(data?.updated_director?.role.toLowerCase());
                setCurrentUser(data?.updated_director);
            }
            catch(error){
                console.log('error: ', "login again ", error);
            }
        }

        // 2. Log Activity
        const actionDesc = isEmailChanged 
            ? `Updated profile and changed email to ${formData.email}` 
            : `Updated profile details`;
        onLogActivity('UPDATE', 'PROFILE', actionDesc);
            
        // 3. Reset UI State
        setVerificationStep('IDLE');
        setIsDirty(false);
            
        // 4. Show Success Message
        setToast({ message: 'Profile updated successfully!', type: 'success' });
     }
    }
    const handleInitiateSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isDirty) return;
        // Start Security Flow -> Step 1: PIN
        Object.entries(formData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                serverForm.append(key, value as any);
            }
        });

        if (!director?.user?.pin_set){
            // Make the api call here  when user  need no pin to talk to server 
            sendRequest("/director/update/","PUT",serverForm,TriggeredFunc,true,true)
            return 
        } 
        setVerificationStep("PIN_CHECK")
    }
    const handlePinSuccess = (pins) => {
        // PIN Validated -> Move to Step 2: OTP
        serverForm.append("pin",pins)
        // Reset OTP state for clean entry
        setOtp(['', '', '', '', '']);
        // Make the api call here  when user  need  pin to talk to server 
        sendRequest("/director/update/","PUT",serverForm,TriggeredFunc,true,true)
    };

    const handleOtpChange = (element: HTMLInputElement, index: number) => {
        if (isNaN(Number(element.value))) return;
        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);
        
        // Auto focus next
        if (element.nextSibling && element.value !== "") {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };

    const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === "Backspace" && otp[index] === "" && index > 0) {
            const inputs = document.querySelectorAll('input[name="profile-otp"]');
            if (inputs[index - 1]) {
                (inputs[index - 1] as HTMLInputElement).focus();
            }
        }
    };

    const handleFinalizeUpdate = () => {
        if (otp.some(d => d === '')) return;
        serverForm.append("otp",otp.join(''))
        // setIsVerifyingOtp(true);
        sendRequest("/director/update/","PUT",serverForm,TriggeredFunc,true,true)
        return 
    };

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto pb-10">
            {/* {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />} */}

            {/* Header Section */}
            <div className="relative bg-gradient-to-r from-navy-900 to-navy-700 rounded-t-2xl p-8 overflow-hidden shadow-lg">
                <div className="absolute inset-0 bg-pattern opacity-10"></div>
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-gold-500 rounded-full opacity-20 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row  gap-8 ">
                    {/* Image Upload */}
                     <ImageUpload 
                        label="" 
                        currentImage={urls.BASE_URL + formData.picture} 
                        onImageSelected={(url) => handleChange('picture', url)}
                        />
                    {/* Text Header */}
                    <div className="text-center md:text-left text-white flex-1">
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                            <span className="bg-gold-500 text-navy-900 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">{formData.role}</span>
                            <span className="bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider">ID: {formData.id.slice(-6)}</span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-1">{formData.title} {formData.first_name} {formData.last_name} {formData?.middle_name}</h1>
                        <p className="text-navy-100 text-lg opacity-90">{director.email}</p> {/* Show original email in header */}
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleInitiateSave} className="bg-white rounded-b-2xl shadow-sm border-x border-b border-gray-200 p-8 space-y-10">
                
                {/* Personal Information */}
                <div>
                    <h3 className="text-lg font-bold text-navy-900 border-b border-gray-100 pb-3 mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-navy-50 text-navy-600 flex items-center justify-center mr-3 text-sm border border-navy-100">
                            <i className="fa-solid fa-id-card"></i>
                        </span>
                        Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="md:col-span-1">
                            <Input 
                                label="Title" 
                                placeholder="Dr/Mr/Ms" 
                                value={formData.title} 
                                onChange={(e) => handleChange('title', e.target.value)} 
                                iconClass="fa-solid fa-heading" 
                            />
                        </div>
                        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Input 
                                required 
                                label="First Name" 
                                value={formData.first_name} 
                                onChange={(e) => handleChange('first_name', e.target.value)} 
                                iconClass="fa-solid fa-user" 
                            />
                            <Input 
                                label="Middle Name" 
                                value={formData.middle_name} 
                                onChange={(e) => handleChange('middle_name', e.target.value)} 
                                iconClass="fa-solid fa-user" 
                            />
                            <Input 
                                required 
                                label="Last Name" 
                                value={formData.last_name} 
                                onChange={(e) => handleChange('last_name', e.target.value)} 
                                iconClass="fa-solid fa-user" 
                            />
                        </div>
                    </div>
                </div>

                {/* Contact Details */}
                <div>
                    <h3 className="text-lg font-bold text-navy-900 border-b border-gray-100 pb-3 mb-6 flex items-center">
                        <span className="w-8 h-8 rounded-full bg-navy-50 text-navy-600 flex items-center justify-center mr-3 text-sm border border-navy-100">
                            <i className="fa-solid fa-address-book"></i>
                        </span>
                        Contact Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-navy-800 mb-1.5">Gender</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-navy-400">
                                    <i className="fa-solid fa-venus-mars"></i>
                                </div>
                                <select 
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900 transition duration-200 ease-in-out sm:text-sm"
                                    value={formData.gender}
                                    onChange={(e) => handleChange('gender', e.target.value as Gender)}
                                >
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>
                        <Input 
                            required 
                            type="tel" 
                            label="Phone Number" 
                            value={formData.phone} 
                            onChange={(e) => handleChange('phone', e.target.value)} 
                            iconClass="fa-solid fa-phone" 
                        />
                        <div className="md:col-span-2">
                            <Input 
                                required 
                                type="email" 
                                label="Official Email Address" 
                                value={formData.email} 
                                onChange={(e) => handleChange('email', e.target.value)} 
                                iconClass="fa-regular fa-envelope" 
                                className={`transition-colors ${isEmailChanged ? 'bg-gold-50 border-gold-300 focus:border-gold-500 focus:ring-gold-500/20' : 'bg-gray-50'}`}
                            />
                            {isEmailChanged ? (
                                <p className="text-xs text-gold-600 mt-1 font-bold animate-fadeIn">
                                    <i className="fa-solid fa-triangle-exclamation mr-1"></i>
                                    Changing email requires additional OTP verification sent to the NEW address.
                                </p>
                            ) : (
                                <p className="text-xs text-gray-500 mt-1 ml-1">
                                    <i className="fa-solid fa-circle-info mr-1"></i>
                                    Official communication will be sent here.
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Save Action */}
                <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                    {isDirty && <span className="text-sm text-orange-600 animate-pulse font-medium">Unsaved changes detected</span>}
                    <Button 
                        type="submit" 
                        disabled={!isDirty} 
                        className="w-auto px-8 py-3 text-base shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                        <i className="fa-solid fa-shield-check mr-2"></i> Verify & Save Changes
                    </Button>
                </div>
            </form>

            {/* STEP 1: PIN Verification Modal */}
            <PinModal 
                isOpen={verificationStep === 'PIN_CHECK'} 
                onClose={() => setVerificationStep('IDLE')} 
                onSuccess={handlePinSuccess}
                title="Security Verification"
            />

            {/* STEP 2: OTP Verification Modal */}
            <Modal
                isOpen={verificationStep === 'OTP_CHECK'}
                onClose={() => setVerificationStep('IDLE')}
                title="Email Verification"
                icon="fa-solid fa-envelope-circle-check"
            >
                <div className="text-center space-y-6">
                    <div className="bg-navy-50 p-4 rounded-lg border border-navy-100">
                        <p className="text-sm text-gray-600 mb-1">
                            We have sent a 5-digit verification code to:
                        </p>
                        <p className="text-lg font-bold text-navy-900 break-all">
                            {formData.email}
                        </p>
                        {isEmailChanged && (
                            <p className="text-xs text-gold-600 font-bold mt-2 uppercase tracking-wide">
                                (New Email Address)
                            </p>
                        )}
                    </div>

                    <div className="flex justify-center gap-3">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                name="profile-otp"
                                type="text"
                                maxLength={1}
                                className="w-12 h-14 border-2 border-gray-300 rounded-lg text-center text-xl font-bold text-navy-900 focus:border-navy-900 focus:ring-0 outline-none transition-all bg-white shadow-sm"
                                value={digit}
                                onChange={(e) => handleOtpChange(e.target, index)}
                                onKeyDown={(e) => handleOtpKeyDown(e, index)}
                                onFocus={(e) => e.target.select()}
                                autoFocus={index === 0}
                                disabled={isVerifyingOtp}
                            />
                        ))}
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button 
                            onClick={handleFinalizeUpdate} 
                            disabled={otp.some(d => d === '')}
                            isLoading={isVerifyingOtp}
                            variant="primary"
                        >
                            Confirm Update
                        </Button>
                        
                        <button 
                            onClick={() => setVerificationStep('IDLE')}
                            className="text-sm text-gray-400 hover:text-navy-900 transition-colors"
                            disabled={isVerifyingOtp}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
