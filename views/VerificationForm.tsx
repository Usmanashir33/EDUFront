import React, { useState } from 'react';
import { Button, FadeIn } from '../components/UI';
import { ViewState } from '../types';

interface VerificationFormProps {
  email: string;
  onNavigate: (view: string) => void;
}

export const VerificationForm: React.FC<VerificationFormProps> = ({ email, onNavigate }) => {
  // Changed to 5 digits
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling && element.value !== "") {
      (element.nextSibling as HTMLInputElement).focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
        // Focus previous input on backspace if current is empty
        const inputs = document.querySelectorAll('input[name="otp-input"]');
        if (inputs[index - 1]) {
            (inputs[index - 1] as HTMLInputElement).focus();
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate verification API
    setTimeout(() => {
      setLoading(false);
      onNavigate('/auth/login');
    }, 1500);
  };

  return (
    <div className="w-full max-w-md mx-auto text-center">
      <FadeIn>
        <div className="mb-8">
            <div className="mx-auto h-20 w-20 bg-navy-50 rounded-full flex items-center justify-center mb-6 border-2 border-navy-100">
                <i className="fa-solid fa-shield-halved text-3xl text-navy-900"></i>
            </div>
            <h2 className="text-2xl font-bold text-navy-900">Security Verification</h2>
            <p className="mt-3 text-sm text-gray-600">
            For security, please enter the 5-digit code sent to your email address:
            <br/>
            <span className="font-bold text-navy-800 mt-1 block">{email}</span>
            </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-3 mb-10">
            {otp.map((data, index) => (
              <input
                key={index}
                name="otp-input"
                type="text"
                maxLength={1}
                className="w-12 h-14 sm:w-14 sm:h-16 border border-gray-300 rounded-md text-center text-2xl font-bold text-navy-900 focus:border-navy-900 focus:ring-1 focus:ring-navy-900 focus:outline-none transition-all bg-gray-50 focus:bg-white shadow-sm"
                value={data}
                onChange={(e) => handleChange(e.target, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>

          <Button type="submit" isLoading={loading} disabled={otp.join('').length !== 5} variant="primary">
            Verify & Continue
          </Button>

          <div className="mt-8">
             <p className="text-sm text-gray-500">
                Didn't receive the code?{' '}
                <button
                    type="button"
                    className="font-medium text-navy-700 hover:text-navy-900 underline"
                    onClick={() => alert("Resending code...")}
                >
                    Resend Code
                </button>
             </p>
          </div>
          <div className="mt-4">
             <button
                type="button"
                className="text-xs text-gray-400 hover:text-gray-600"
                onClick={() => onNavigate('/auth/register')}
            >
                Incorrect email? Start Over
            </button>
          </div>
        </form>
      </FadeIn>
    </div>
  );
};