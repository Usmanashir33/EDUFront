import React, { useState ,useEffect, useContext } from 'react';
import { Input, Button, FadeIn, Modal } from '../components/UI';
import { ViewState } from '../types';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';

interface RegisterFormProps {
  onNavigate: (view: ViewState) => void;
  onLogin: (mode: 'director' | 'academic', response:any) => void;
}
type LoginProps = 'CREDENTIALS' | 'OTP' 

export const RegisterForm: React.FC<RegisterFormProps> = ({ onNavigate,onLogin}) => {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [step,setStep] = useState<LoginProps>("CREDENTIALS")
  const [url, setUrl] = useState('/school/register-new-school/');
  const {sendAuthRequest} = useRequest() ;
  const [oldResent, setOldResent] = useState<number>(20); // initial 20 seconds
  const [resent, setResent] = useState<number>(0); 
    // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [formData, setFormData] = useState({ 
    // school data fields
    schoolName: '',
    schoolEmail: '',
    schoolAddress: '',
    schoolPhone: '',
    tag: '',

    // director data fields
    directorTitle: '', 
    directorGender: '',
    directorFirstName: '',
    directorLastName: '',
    directorMiddleName: '',
    directorEmail: '',
    directorPhone: '',
    directorPassword: '',
    directorPassword2: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
   const {toast, setToast, isLoading,setIsLoading,pageLoading,setPageLoading, } = useContext(uiContext);
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
  useEffect(() => { // to automatically close toast after 3 seconds
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Helper to check required fields
    const checkRequired = (field: keyof typeof formData, label: string) => {
      if (!formData[field]) {
        newErrors[field as string] = `${label} is required`;
        isValid = false;
      }
    };

    checkRequired('schoolName', 'School Name');
    checkRequired('schoolEmail', 'Official Email');
    // checkRequired('schoolPhone', 'Contact Phone');
    checkRequired('schoolAddress', 'Physical Address');
    checkRequired('tag', 'Institution ID / Tag');
    
    checkRequired('directorFirstName', 'First Name');
    checkRequired('directorLastName', 'Last Name');
    checkRequired('directorEmail', 'Director Email');
    checkRequired('directorPhone', 'Director Phone');
    checkRequired('directorPassword', 'Password');
    
    if (formData.directorPassword && formData.directorPassword.length < 8) {
      newErrors.directorPassword = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (formData.directorPassword !== formData.directorPassword2) {
      newErrors.directorPassword2 = 'Passwords do not match';
      isValid = false;
    }

    // Basic Email Regex
    const emailRegex = /\S+@\S+\.\S+/;
    if (formData.schoolEmail && !emailRegex.test(formData.schoolEmail)) {
        newErrors.schoolEmail = 'Invalid email format';
        isValid = false;
    }
    if (formData.directorEmail && !emailRegex.test(formData.directorEmail)) {
        newErrors.directorEmail = 'Invalid email format';
        isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const TriggeredFunc = (data) => {
    console.log('data: ', data);
    // {"success":"otp_sent",} "success":"school_created",
    const loginstatus =["school_created"]
    const preloginstatus =["otp_sent",]
    // check if data is success or error and proceed accordingly
    if (preloginstatus.includes(data.success)) {
        if (data.success === preloginstatus[1]) { // users email is not verified on his account
            setToast({message: 'Incomplete Registration / Unverified Email. Please complete your registration.', type: 'info'});
        }else{
            setToast({message: 'OTP has been sent to your email ', type: 'success'});
        }
        setResent(oldResent);
        if (step === 'CREDENTIALS') {
            setStep('OTP');
            // setUrl(data?.redirect_to);
        }
    }
    else if (loginstatus.includes(data?.success?.toLowerCase().replace(/\s+/g, ''))) {
        setToast({message: 'Login successful', type: 'success'});
        // check user role and redirect accordingly
        if (data?.role?.toLowerCase() === 'director') {
            return onLogin('director',data) ;
        }
        onLogin('director',data) ;
    }
    else {
        // Handle error (for simplicity, setting a generic error)
        setToast({ message: data.error || 'An error occurred. Please try again.', type: 'error' });
    }
    
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      const firstError = document.querySelector('.text-red-600');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    // mimic the formdata to match the server required fields 
    const fd:any = new FormData();
    fd.append('school_email', formData.schoolEmail ?? '');
    fd.append('school_name', formData.schoolName ?? '');
    fd.append('school_tag', formData.tag ?? '');
    fd.append('school_phone', formData.schoolPhone ?? '');
    fd.append('school_address', formData.schoolAddress ?? '');

    fd.append('director_first_name', formData.directorFirstName ?? '');
    fd.append('director_last_name', formData.directorLastName ?? '');
    fd.append('director_middle_name', formData.directorMiddleName ?? '');
    fd.append('director_email', formData.directorEmail ?? '');
    fd.append('director_phone', formData.directorPhone ?? '');

    fd.append('director_title', formData.directorTitle ?? '');
    fd.append('director_gender', formData.directorGender ?? '');
    fd.append('director_password', formData.directorPassword ?? '');

    fd.append('director_password2', formData.directorPassword2 ?? '');
    fd.append('otp', otp.join('') ?? '');

    // console.log(Object.fromEntries(fd.entries()));
    // call the API HERE 
      sendAuthRequest(url,"POST",fd,TriggeredFunc,true,true); // true because i use formdata object as a form 
  };

  return (
    <div className="w-full ">
      <FadeIn>
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Institution Registration</h2>
            <p className="mt-1 text-sm text-gray-600">Complete the form below to register a new school entity.</p>
          </div>
          {step === "CREDENTIALS" && <button 
            onClick={() => onNavigate(ViewState.LOGIN)}
            className="text-sm font-medium text-navy-600 hover:text-navy-800 flex items-center"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> Back to Login
          </button>}
        </div>

        {step === "CREDENTIALS" && <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* School Details Section */}
          <div className="bg-navy-50/50 p-6 rounded-lg border border-navy-100 ">
            <h3 className="text-lg font-bold text-navy-900 mb-6 flex items-center border-b border-navy-100 pb-3">
              <span className="w-8 h-8 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-3 text-sm">
                <i className="fa-solid fa-school"></i>
              </span>
              School Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                name="schoolName"
                label="School Name"
                type="text"
                iconClass="fa-solid fa-building"
                placeholder="Ex. Springfield High Academy"
                value={formData.schoolName}
                onChange={handleChange}
                error={errors.schoolName}
              />
              <Input
                name="tag"
                label="Institution ID / Tag"
                type="text"
                iconClass="fa-solid fa-tag"
                placeholder="Ex. SCH-2024-001"
                value={formData.tag}
                onChange={handleChange}
                error={errors.tag}
              />
               <Input
                name="schoolEmail"
                label="Official Email"
                type="email"
                iconClass="fa-regular fa-envelope"
                placeholder="admin@school.edu"
                value={formData.schoolEmail}
                onChange={handleChange}
                error={errors.schoolEmail}
              />
              <Input
                name="schoolPhone"
                label="Contact Phone (optional)"
                type="tel"
                iconClass="fa-solid fa-phone"
                placeholder="+1 (555) 000-0000"
                value={formData.schoolPhone}
                onChange={handleChange}
                error={errors.schoolPhone}
              />
              <div className="md:col-span-2">
                <Input
                  name="schoolAddress"
                  label="Physical Address"
                  type="text"
                  iconClass="fa-solid fa-location-dot"
                  placeholder="123 Education Lane, Knowledge City, ST 12345"
                  value={formData.schoolAddress}
                  onChange={handleChange}
                  error={errors.schoolAddress}
                />
              </div>
            </div>
          </div>

          {/* Director Details Section */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
             <h3 className="text-lg font-bold text-navy-900 mb-6 flex items-center border-b border-gray-100 pb-3">
              <span className="w-8 h-8 rounded-full bg-gold-400 text-navy-900 flex items-center justify-center mr-3 text-sm">
                <i className="fa-solid fa-user-tie"></i>
              </span>
              Director Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* i want this to be inthe same line while in big screen or medium screen */}
                <Input
                  name="directorTitle"
                  label="Title"
                  type="text"
                  maxLength = '6'
                  iconClass="fa-regular fa-user"
                  placeholder="Dr. / Mr. / Ms. / Mrs."
                  value={formData.directorTitle}
                  onChange={handleChange}
                  error={errors.directorTitle}
                />
                <div className='flex gap-1 flex-col'>
                <label HtmlFor="directorGender" className='text-gray-600 text-sm font-semibold' >Gender
                </label>
                  <select name="directorGender"  error={errors.directorGender}
                    className="border border-gray-300 rounded-md px-3 py-2 bg-white" value={formData.directorGender} onChange={handleChange}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
              <Input
                name="directorFirstName"
                label="First Name"
                type="text"
                iconClass="fa-regular fa-envelope"
                placeholder="Usman"
                value={formData.directorFirstName}
                onChange={handleChange}
                error={errors.directorFirstName}
              />
              <Input
                name="directorLastName"
                label="Last Name"
                type="text"
                iconClass="fa-regular fa-envelope"
                placeholder="Ashir"
                value={formData.directorLastName}
                onChange={handleChange}
                error={errors.directorLastName}
              />

              <Input
                name="directorMiddleName"
                label="Middle Name (optional)"
                type="text"
                iconClass="fa-regular fa-envelope"
                placeholder="Muhammad"
                value={formData.directorMiddleName}
                onChange={handleChange}
                error={errors.directorMiddleName}
              />

              <Input
                name="directorEmail"
                label="Director Email"
                type="email"
                iconClass="fa-regular fa-envelope"
                placeholder="director.doe@gmail.com"
                value={formData.directorEmail}
                onChange={handleChange}
                error={errors.directorEmail}
              />
              <Input
                name="directorPhone"
                label="Director Phone"
                type="tel"
                iconClass="fa-solid fa-mobile-screen"
                placeholder="0800 000 1111"
                value={formData.directorPhone}
                onChange={handleChange}
                error={errors.directorPhone}
              />
              <Input
                name="directorPassword"
                label="Create Password"
                type="password"
                iconClass="fa-solid fa-lock"
                placeholder="••••••••"
                value={formData.directorPassword}
                onChange={handleChange}
                error={errors.directorPassword}
              />
              <Input
                name="directorPassword2"
                label="Confirm Password"
                type="password"
                iconClass="fa-solid fa-check-double"
                placeholder="••••••••"
                value={formData.directorPassword2}
                onChange={handleChange}
                error={errors.directorPassword2}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" className="w-auto px-8" onClick={() => onNavigate(ViewState.LOGIN)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={loading} variant="primary" className="w-auto px-10">
              Complete Registration
            </Button>
          </div>
        </form>}
        {step === 'OTP' && (
                    <form onSubmit={handleSubmit} className="animate-fadeIn">
                        <div className="flex justify-center gap-3 mb-8">
                            {otp.map((data, index) => (
                            <input
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
                            Verify Your Credentials
                        </Button>
        
                        <div className="mt-6 text-center space-y-3">
                            {resent === 0 && <button
                                type="button"
                                className="text-sm text-navy-600 font-medium hover:text-navy-800"
                                onClick={() => {
                                    // Resend OTP Logic
                                    let formDetails:any = { // data to be sent to backend as the view requested 
                                        username_field : formData.directorEmail,
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