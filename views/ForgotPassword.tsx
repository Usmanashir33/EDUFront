import React, { useState } from 'react';
import { Input, Button, FadeIn } from '../components/UI';
import { ViewState } from '../types';

interface ForgotPasswordProps {
  onNavigate: (view: ViewState) => void;
}

type Step = 'EMAIL' | 'OTP' | 'NEW_PASSWORD' | 'SUCCESS';

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<Step>('EMAIL');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  
  // OTP State
  const [otp, setOtp] = useState(['', '', '', '', '']); // 5 digit OTP
  
  // Password State
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Step 1: Handle Email Submit
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setErrors({ email: 'Valid email is required' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
      setErrors({});
    }, 1000);
  };

  // Step 2: Handle OTP Logic
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.some(d => d === '')) {
      alert("Please enter full code");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('NEW_PASSWORD');
    }, 1000);
  };

  // Step 3: Handle New Password
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 8) {
      setErrors({ new: 'Password too short' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setErrors({ confirm: 'Passwords do not match' });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('SUCCESS');
    }, 1000);
  };

  const renderStep = () => {
    switch (step) {
      case 'EMAIL':
        return (
          <form onSubmit={handleEmailSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto h-16 w-16 bg-navy-50 rounded-full flex items-center justify-center mb-4 text-navy-600">
                <i className="fa-solid fa-key text-2xl"></i>
              </div>
              <h2 className="text-xl font-bold text-navy-900">Forgot Password?</h2>
              <p className="text-sm text-gray-600 mt-2">Enter your email to receive a recovery code.</p>
            </div>
            <Input
              name="email"
              label="Registered Email"
              type="email"
              iconClass="fa-regular fa-envelope"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors({}); }}
              error={errors.email}
            />
            <Button type="submit" isLoading={loading}>Send Recovery Code</Button>
            <button type="button" onClick={() => onNavigate(ViewState.LOGIN)} className="w-full text-sm text-navy-600 hover:text-navy-800 font-medium mt-4">
              Back to Login
            </button>
          </form>
        );

      case 'OTP':
        return (
          <form onSubmit={handleOtpSubmit} className="space-y-6 text-center">
             <div className="mb-6">
               <h2 className="text-xl font-bold text-navy-900">Enter Code</h2>
               <p className="text-sm text-gray-600 mt-1">We sent a 5-digit code to <b>{email}</b></p>
             </div>
             <div className="flex justify-center gap-3 mb-6">
                {otp.map((data, index) => (
                  <input
                    key={index}
                    type="text"
                    maxLength={1}
                    className="w-12 h-14 border border-gray-300 rounded-lg text-center text-xl font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    value={data}
                    onChange={e => handleOtpChange(e.target, index)}
                    onFocus={e => e.target.select()}
                  />
                ))}
             </div>
             <Button type="submit" isLoading={loading} disabled={otp.some(d => d === '')}>Verify Code</Button>
             <button type="button" onClick={() => setStep('EMAIL')} className="w-full text-sm text-navy-600 mt-4">Change Email</button>
          </form>
        );

      case 'NEW_PASSWORD':
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
             <div className="text-center mb-6">
               <h2 className="text-xl font-bold text-navy-900">Reset Password</h2>
               <p className="text-sm text-gray-600">Create a strong new password for your account.</p>
             </div>
             <Input
               name="new"
               label="New Password"
               type="password"
               iconClass="fa-solid fa-lock"
               value={passwords.new}
               onChange={e => { setPasswords({...passwords, new: e.target.value}); setErrors({}); }}
               error={errors.new}
             />
             <Input
               name="confirm"
               label="Confirm Password"
               type="password"
               iconClass="fa-solid fa-check-double"
               value={passwords.confirm}
               onChange={e => { setPasswords({...passwords, confirm: e.target.value}); setErrors({}); }}
               error={errors.confirm}
             />
             <Button type="submit" isLoading={loading}>Update Password</Button>
          </form>
        );
      
      case 'SUCCESS':
        return (
          <div className="text-center py-8">
            <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <i className="fa-solid fa-check text-4xl text-green-600"></i>
            </div>
            <h2 className="text-2xl font-bold text-navy-900 mb-2">Password Updated!</h2>
            <p className="text-gray-600 mb-8">Your password has been securely reset. You can now login.</p>
            <Button onClick={() => onNavigate(ViewState.LOGIN)}>Return to Login</Button>
          </div>
        );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <FadeIn>
        {renderStep()}
      </FadeIn>
    </div>
  );
};