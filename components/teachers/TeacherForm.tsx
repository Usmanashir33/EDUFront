
import React, { useState ,useContext } from 'react';
import { Teacher, SchoolSection, ClassRoom } from '../../types';
import { Input, Button, MultiSelectDropdown, ImageUpload } from '../UI';
import { cleanCurrencyInput, formatInputCurrency } from './TeacherFinance';
import urls from '@/customHooks/ServerUrls';
import { uiContext } from '@/customContexts/UiContext';

interface TeacherFormProps { 
    initialData?: any | null; 
    onSubmit: (data:any ) => void; 
    onCancel: () => void; 
}

export const TeacherForm: React.FC<TeacherFormProps> = ({  
    initialData, 
    onSubmit, 
    onCancel 
}) => {
    const {
        sections, // sections data
        classRooms, // classRooms data
        isLoading, // loading state for form submission
    } = useContext(uiContext)
    const {selectedSchool} = useContext(uiContext)

    const [formData, setFormData] = useState({
        firstName: initialData?.first_name || '', 
        lastName: initialData?.last_name ||  '', 
        middleName: initialData?.middle_name || '', 
        title: initialData?.title ||  '',
        email: initialData?.email || '', 
        phone: initialData?.phone || '',  
        gender: initialData?.gender || "male", 
        address: initialData?.address || '',
        dateOfBirth: initialData?.date_of_birth || '', 
        picture: initialData?.picture || '', 
        nin: initialData?.nin || '',
        role: initialData?.role || '',
        salary: initialData?.salary ||  '',
        status: initialData?.user?.is_active? "Active" : "Inactive" ,
        bankDetails: { 
            bankName: initialData?.bank_details?.bank_name || "", 
            accountNumber:initialData?.bank_details?.account_number || '', 
            accountName:initialData?.bank_details?.account_name || '' },
        kyc: { 
            isVerified: false, 
            documents: [
                { type: 'idCard', name: 'National ID', status: 'Pending' },
                { type: 'passportPhoto', name: 'Passport Photo', status: 'Pending' },
                { type: 'addressProof', name: 'Utility Bill', status: 'Pending' }
            ] 
        }
    });

    const updateBank = (field: string, value: string) => {
        setFormData({
            ...formData,
            bankDetails: { ...formData.bankDetails!, [field]: value }
        });
    };

    return (
        <div className="animate-fadeIn w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-10">
            <div className="bg-navy-900 px-8 py-6 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center">
                    <i className="fa-solid fa-chalkboard-user mr-3 text-gold-500"></i>
                    {initialData ? 'Update Teacher Profile' : 'Teacher Onboarding'}
                </h2>
                <button onClick={onCancel} className="text-white hover:text-gold-500 transition-colors">
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>

                
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-8 space-y-8">
                
                <div className="flex flex-col md:flex-row gap-8">
                     {/* Photo Upload */}
                    <div className="shrink-0 flex justify-center md:justify-start">
                       <ImageUpload 
                          label="Profile Photo" 
                          currentImage={urls.BASE_URL + formData.picture} 
                          onImageSelected={(url) => setFormData({...formData, picture: url})} 
                       />
                    </div>
                    
                    <div className="flex-1">
                        <h3 className="font-bold text-navy-900 border-b pb-2 mb-6 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-2 text-xs"><i className="fa-solid fa-id-card"></i></span>
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-1">
                                <Input label="Title" autoFocus  placeholder="Mr/Ms/Dr" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} iconClass="fa-solid fa-heading" />
                            </div>
                            <div className="md:col-span-3 grid grid-cols-3 gap-4">
                                <Input placeholder='First Name' required label="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} iconClass="fa-solid fa-user" />
                                <Input placeholder='Last Name' required label="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} iconClass="fa-solid fa-user" />
                                <Input placeholder='Middle Name' label="Middle Name" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} iconClass="fa-solid fa-user" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <Input placeholder='Email' required type="email" label="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} iconClass="fa-regular fa-envelope" />
                            <Input placeholder='Phone' required type="tel" label="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} iconClass="fa-solid fa-phone" />
                            <Input placeholder='Address' label="Address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} iconClass="fa-solid fa-map-pin" />
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-navy-800 mb-1.5">Gender</label>
                                    <select 
                                        className="w-full p-3 border border-gray-300 rounded-md outline-none bg-white"
                                        value={formData.gender}
                                        onChange={e => setFormData({...formData, gender: e.target.value as any})}
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <Input type="date" label="Date of Birth" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} iconClass="fa-solid fa-calendar" />
                            </div>
                            <Input placeholder='NIN / National ID' label="NIN / National ID" value={formData.nin} onChange={e => setFormData({...formData, nin: e.target.value})} iconClass="fa-solid fa-fingerprint" />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-10">
                    <div className="space-y-6">
                         <h3 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center">
                            <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-2 text-xs"><i className="fa-solid fa-building-columns"></i></span>
                            Financial Data
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-2 gap-10">
                            <Input 
                                label="Base Salary" 
                                type="text"
                                value={formatInputCurrency(formData.salary || '')} 
                                onChange={e => setFormData({...formData, salary: cleanCurrencyInput(e.target.value)})} 
                                iconClass="fa-solid fa-money-bill" 
                                placeholder="₦0.00"
                            />
                            <Input placeholder='Bank Name' label="Bank Name" value={formData.bankDetails?.bankName} onChange={e => updateBank('bankName', e.target.value)} iconClass="fa-solid fa-building-columns" />
                            <Input placeholder='Account Number' label="Account Number" value={formData.bankDetails?.accountNumber} onChange={e => updateBank('accountNumber', e.target.value)} iconClass="fa-solid fa-hashtag" />
                            <Input placeholder='Account Name' label="Account Name" value={formData.bankDetails?.accountName} onChange={e => updateBank('accountName', e.target.value)} iconClass="fa-solid fa-signature" />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <Button type="button" variant="outline" className="w-auto px-8" onClick={onCancel}>Cancel</Button>
                    <Button disabled={isLoading} type="submit" className="w-auto px-8">{initialData ? 'Update Teacher' : 'Complete Onboarding'}</Button>
                </div>
            </form>
        </div>
    );
};
