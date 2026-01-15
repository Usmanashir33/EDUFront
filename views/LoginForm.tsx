
import React, { useState } from 'react';
import { Input, Button, FadeIn } from '../components/UI';
import { ViewState } from '../types';

interface LoginFormProps {
  onNavigate: (view: ViewState) => void;
  onLogin: (mode: 'director' | 'academic', id: string) => void;
}

type LoginMode = 'director' | 'academic';
type LoginStep = 'CREDENTIALS' | 'OTP';

export const LoginForm: React.FC<LoginFormProps> = ({ onNavigate, onLogin }) => {
  const [step, setStep] = useState<LoginStep>('CREDENTIALS');
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<LoginMode>('director');
  
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
        ? 'Email address is required' 
        : 'Enrollment ID is required';
      isValid = false;
    } else if (loginMode === 'director' && !/\S+@\S+\.\S+/.test(formData.identifier)) {
      newErrors.identifier = 'Please enter a valid email format';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 'CREDENTIALS') {
        if (!validateCredentials()) return;

        setLoading(true);
        // Simulate API Credential Check
        setTimeout(() => {
            setLoading(false);
            // Move to OTP step (Simulate sending email)
            setStep('OTP');
        }, 1500);
    } else {
        // OTP Step
        if (otp.some(d => d === '')) {
            setErrors({ otp: 'Please enter the complete 5-digit code.' });
            return;
        }

        setLoading(true);
        // Simulate OTP Verification
        setTimeout(() => {
            setLoading(false);
            onLogin(loginMode, formData.identifier); 
        }, 1500);
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
                : <span>Please enter the verification code sent to <br/><span className="font-bold text-navy-900">{formData.identifier}</span></span>}
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
                    placeholder="••••••••"
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
                    <Button type="submit" isLoading={loading} variant="primary">
                    Verify Credentials
                    </Button>
                </div>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                <p className="text-sm text-gray-600">
                    Need to register a new school?{' '}
                    <button
                    onClick={() => onNavigate(ViewState.REGISTER)}
                    className="font-bold text-navy-700 hover:text-navy-900 transition-colors underline decoration-2 decoration-gold-400 hover:decoration-gold-500"
                    >
                    Director Registration
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
                        key={index}
                        name="login-otp"
                        type="text"
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

                <Button type="submit" isLoading={loading} disabled={otp.some(d => d === '')} variant="primary">
                    Verify & Login
                </Button>

                <div className="mt-6 text-center space-y-3">
                    <button
                        type="button"
                        className="text-sm text-navy-600 font-medium hover:text-navy-800"
                        onClick={() => alert("New code sent!")}
                    >
                        Resend Code
                    </button>
                    <div className="block">
                        <button
                            type="button"
                            className="text-xs text-gray-400 hover:text-gray-600"
                            onClick={() => { setStep('CREDENTIALS'); setOtp(['','','','','']); }}
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
