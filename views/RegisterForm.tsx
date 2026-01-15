import React, { useState } from 'react';
import { Input, Button, FadeIn, Modal } from '../components/UI';
import { ViewState } from '../types';

interface RegisterFormProps {
  onNavigate: (view: ViewState) => void;
  onRegisterSuccess: (email: string) => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onNavigate, onRegisterSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolEmail: '',
    schoolAddress: '',
    schoolPhone: '',
    directorName: '',
    directorEmail: '',
    directorPhone: '',
    directorPassword: '',
    directorPassword2: '',
    tag: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    checkRequired('schoolPhone', 'Contact Phone');
    checkRequired('schoolAddress', 'Physical Address');
    
    checkRequired('directorName', 'Director Name');
    checkRequired('directorEmail', 'Personal Email');
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      const firstError = document.querySelector('.text-red-600');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setShowSuccessModal(true);
    }, 1500);
  };

  const handleModalContinue = () => {
    setShowSuccessModal(false);
    onRegisterSuccess(formData.directorEmail);
  };

  return (
    <div className="w-full">
      <FadeIn>
        <div className="flex justify-between items-end mb-8 border-b border-gray-200 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-navy-900">Institution Registration</h2>
            <p className="mt-1 text-sm text-gray-600">Complete the form below to register a new school entity.</p>
          </div>
          <button 
            onClick={() => onNavigate(ViewState.LOGIN)}
            className="text-sm font-medium text-navy-600 hover:text-navy-800 flex items-center"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i> Back to Login
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* School Details Section */}
          <div className="bg-navy-50/50 p-6 rounded-lg border border-navy-100">
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
                label="Contact Phone"
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
              <div className="md:col-span-2">
                <Input
                  name="directorName"
                  label="Full Name & Title"
                  type="text"
                  iconClass="fa-regular fa-user"
                  placeholder="Dr. John Doe"
                  value={formData.directorName}
                  onChange={handleChange}
                  error={errors.directorName}
                />
              </div>
              <Input
                name="directorEmail"
                label="Personal Email"
                type="email"
                iconClass="fa-regular fa-envelope"
                placeholder="director.doe@school.edu"
                value={formData.directorEmail}
                onChange={handleChange}
                error={errors.directorEmail}
              />
              <Input
                name="directorPhone"
                label="Direct Phone"
                type="tel"
                iconClass="fa-solid fa-mobile-screen"
                placeholder="+1 (555) 999-9999"
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
        </form>

        <Modal 
          isOpen={showSuccessModal} 
          onClose={handleModalContinue} 
          title="Registration Successful!"
          icon="fa-solid fa-check"
        >
          Your school has been successfully registered. Please verify your email address to activate your director account.
        </Modal>

      </FadeIn>
    </div>
  );
};