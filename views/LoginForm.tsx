
import React, { useState,useEffect } from 'react';
import { Input, Button, FadeIn ,PageLoader } from '../components/UI';
import { ViewState } from '../types';
import useRequest from '@/customHooks/RequestHook';
import { uiContext } from '@/customContexts/UiContext';

interface LoginFormProps {
  onNavigate: (view: ViewState) => void;
  onLogin: (mode: 'director' | 'academic', response:any) => void;
}
interface formDataType {
    username_field : string; 
    password: string;
    otp: string | null ;
}

type LoginMode = 'director' | 'academic';
type LoginStep = 'CREDENTIALS' | 'OTP';

export const LoginForm: React.FC<LoginFormProps> = ({ onNavigate, onLogin }) => {

const [step, setStep] = useState<LoginStep>('CREDENTIALS');
  const [loginMode, setLoginMode] = useState<LoginMode>('director');
  const {sendAuthRequest} = useRequest();
  const [url,setUrl] = useState<string>("/authuser/loginRequest/");
  const {setToast,isLoading,pageLoading,} = React.useContext(uiContext);
  const [oldResent, setOldResent] = useState<number>(20); // initial 20 seconds
  const [resent, setResent] = useState<number>(0); 
  
  
  const [formData, setFormData] = useState({
    identifier: '', // Email or Enrollment ID
    password: ''
  });
  const [errors, setErrors] = useState<{ identifier?: string; password?: string, otp?: string }>({});

  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '']);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    setErrors(prev => ({ ...prev, otp: undefined }));
    
    // Auto focus next
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

    useEffect(() => {
        if (resent === 0) return setOldResent(oldResent *2); // add 30 minutes for next resend;
        setTimeout(() => {
            setResent(resent-1);
        }, 1000);
        
    }, [resent]);

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
        const inputs = document.querySelectorAll('input[name="login-otp"]');
        if (inputs[index - 1]) {
            (inputs[index - 1] as HTMLInputElement).focus();
        }
    }
  };

  const toggleMode = (mode: LoginMode) => {
    setLoginMode(mode);
    setFormData({ identifier: '', password: '' });
    setErrors({});
    setStep('CREDENTIALS');
  };

  const validateCredentials = () => {
    const newErrors: { identifier?: string; password?: string } = {};
    let isValid = true;

    if (!formData.identifier) {
      newErrors.identifier = loginMode === 'director' 
        ? 'Email address or Username is required' 
        : 'Enrollment ID is required';
      isValid = false;
    } else if (loginMode === 'director' && !/\S+@\S+\.\S+/.test(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid email format';
      isValid = false;
    }

    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password greater than 6 characters required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const TriggeredFunc = (data: any) => {
    // console.log('data: ', data);
    if (data?.incomplete_registration) { // users email is not verified on his account
            setToast({message:data?.success, type: 'info'});
            setResent(oldResent);
            setStep('OTP');
            setUrl(data?.redirect_to) ;
    }else if (data?.otp_sent || data?.success === 'otp_sent'){
        setToast({message:data?.success, type: 'success'});
        setResent(oldResent) ;
        setStep('OTP') ;
        if (data?.otp_sent) setUrl(data?.redirect_to) ;
    }else if(data?.logged_user){ // log user in here
        setToast({message: data?.success, type: 'success'});
        let userRole = data?.logged_user?.role?.toLowerCase()
        if (userRole === 'director'){
            return onLogin('director',data?.logged_user) ;
        }else{
            return onLogin(loginMode,data?.logged_user) ;
        }

    }else {
        // Handle error (for simplicity, setting a generic error)
        setToast({ message: data.error || 'An error occurred. Please try again.', type: 'error' });
    }
    
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let formDetails:formDataType = { // data to be sent to backend as the view requested 
        username_field: formData.identifier,
        password : formData.password,
        otp : otp.join('')
    }
    
    if (step === 'CREDENTIALS') {
        if (!validateCredentials()) return;
        // Simulate API Credential Check
        sendAuthRequest(url,"POST",formDetails as any ,TriggeredFunc,true,false);
    } else { // OTP Step
        if (otp.some(d => d === '')) {
            setErrors({ otp: 'Please enter the complete 5-digit code.' });
            return;
        }
        sendAuthRequest(url,"POST",formDetails as any ,TriggeredFunc,true,false); 
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <FadeIn>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-navy-900">
              {step === 'CREDENTIALS' ? 'Welcome Back' : 'Security Check'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === 'CREDENTIALS' 
                ? 'Secure access for our educational community.' 
                : <span>Please enter the verification code sent to <span className="font-bold text-red-600">Check spam folder</span><br/><span className="font-bold text-navy-900">{formData.identifier}</span></span>}
          </p>
        </div>
        {step === 'CREDENTIALS' && (
            <>
                {/* Login Type Tabs */}
                <div className="flex p-1 space-x-1 bg-navy-50 rounded-xl mb-8 border border-navy-100">
                <button
                    className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 focus:outline-none ${
                    loginMode === 'director'
                        ? 'bg-white text-navy-900 shadow-sm ring-1 ring-black ring-opacity-5'
                        : 'text-navy-500 hover:text-navy-700 hover:bg-white/50'
                    }`}
                    onClick={() => toggleMode('director')}
                >
                    Director & Parents
                </button>
                <button
                    className={`w-full py-2.5 text-sm font-medium leading-5 rounded-lg transition-all duration-200 focus:outline-none ${
                    loginMode === 'academic'
                        ? 'bg-white text-navy-900 shadow-sm ring-1 ring-black ring-opacity-5'
                        : 'text-navy-500 hover:text-navy-700 hover:bg-white/50'
                    }`}
                    onClick={() => toggleMode('academic')}
                >
                    Student & Staff
                </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    name="identifier"
                    label={loginMode === 'director' ? 'Email Address' : 'Enrollment / Staff ID'}
                    type={loginMode === 'director' ? 'email' : 'text'}
                    iconClass={loginMode === 'director' ? 'fa-regular fa-envelope' : 'fa-solid fa-id-card'}
                    placeholder={loginMode === 'director' ? 'user@example.com' : 'STU-2024-001'}
                    value={formData.identifier}
                    onChange={handleChange}
                    error={errors.identifier}
                    className="mb-4"
                />
                
                <div className="relative">
                    <Input
                    name="password"
                    label="Password"
                    type="password"
                    iconClass="fa-solid fa-lock"
                    placeholder=" •••••••• "
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    />
                    <div className="absolute top-0 right-0">
                    <button 
                        type="button"
                        onClick={() => onNavigate(ViewState.FORGOT_PASSWORD)}
                        className="text-xs font-semibold text-navy-600 hover:text-navy-800"
                        >
                        Forgot password?
                    </button>
                    </div>
                </div>

                <div className="pt-2">
                    <Button type="submit" isLoading={isLoading} variant="primary">
                        Verify Credentials
                    </Button>
                </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                    Need to register a new school?{'  '}
                    <button
                    onClick={() => onNavigate(ViewState.REGISTER)}
                    className="font-bold text-navy-700 hover:text-navy-900 transition-colors decoration-2 decoration-gold-400 hover:decoration-gold-500"
                    >   Director Registration
                    </button>
                </p>
                </div>
            </>
        )}

        {step === 'OTP' && (
            <form onSubmit={handleSubmit} className="animate-fadeIn">
                <div className="flex justify-center gap-3 mb-8">
                    {otp.map((data, index) => (
                    <input
                        alt ='inp-ba'
                        key={index}
                        name="login-otp"
                        type="number"
                        min="0"
                        max="9"
                        maxLength={1}
                        className="w-12 h-14 border border-gray-300 rounded-lg text-center text-xl font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 focus:outline-none transition-all bg-gray-50 focus:bg-white shadow-sm"
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onKeyDown={(e) => handleOtpKeyDown(e, index)}
                        onFocus={(e) => e.target.select()}
                        autoFocus={index === 0}
                    />
                    ))}
                </div>
                {errors.otp && <p className="text-red-600 text-xs text-center mb-4">{errors.otp}</p>}

                <Button type="submit" isLoading={isLoading} disabled={otp.some(d => d === '')} variant="primary">
                    Verify & Login
                </Button>

                <div className="mt-6 text-center space-y-3">
                    {resent === 0 && <button
                        type="button"
                        className="text-sm text-navy-600 font-medium hover:text-navy-800"
                        onClick={() => {
                            // Resend OTP Logic
                            let formDetails: any  = { // data to be sent to backend as the view requested 
                                username_field : formData.identifier,
                            }
                            setOtp(['','','','','']);
                            sendAuthRequest("/authuser/resend-otp/","POST",formDetails,TriggeredFunc,true,false);
                        }}
                    >
                        Resend Code
                    </button>}
                    {!(resent == 0) &&  <button
                        type="button"
                        className="text-sm text-navy-600 font-medium hover:text-navy-800"
                    >
                        Resend code in the next <b>{resent}</b> secs
                    </button>}

                    <div className="block">
                        <button
                            type="button"
                            className="text-xs text-gray-400 hover:text-gray-600"
                            onClick={() => { 
                                setStep('CREDENTIALS'); setOtp(['','','','','']); 
                                setUrl("/authuser/loginRequest/")
                            }}
                        >
                            <i className="fa-solid fa-arrow-left mr-1"></i> Back to Credentials
                        </button>
                    </div>
                </div>
            </form>
        )}
      </FadeIn>
    </div>
  );
};
