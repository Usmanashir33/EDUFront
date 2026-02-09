
import React, { useState, useEffect, useRef ,useContext } from 'react';
import { Student, ClassRoom, Subject, AcademicRecord } from '../../types';
import { Input, Button, FadeIn, MultiSelectDropdown, PinModal, Toast, ImageUpload, ImageViewer } from '../UI';
import { uiContext } from '@/customContexts/UiContext';
import urls from '@/customHooks/ServerUrls';

// --- FORM LOGIC ---
// 
export const StudentForm = ({ 
    initialData, 
    onSubmit, 
    onCancel 
  }: { // assigned type here 
    initialData?: any | null, 
    onSubmit: (data: Partial<Student>) => void, 
    onCancel: () => void 
  }) => {
    // Default form structure
    const [formData, setFormData] = useState({
      firstName: initialData? initialData.first_name :'', 
      lastName: initialData?initialData.last_name :'',
      middleName: initialData?initialData.middle_name :'',
      email: initialData?initialData.email :'',
      gender: initialData?initialData.gender : '',
      picture: initialData?initialData.picture :'',
      nin: initialData?initialData?.nin :'',
      classRoomIds: initialData?initialData.class_room : [],
      status: initialData?initialData.user?.is_active : '',
      admissionNumber: initialData?initialData.admission_number : '',
      dateOfBirth: initialData?initialData.date_of_birth :'',
      guardian : 
      { fullName:initialData?initialData?.guardian?.full_name :'', 
        relationship: initialData?initialData?.guardian?.relation_ship :'', 
        phone: initialData?initialData?.guardian?.phone :'', 
        email: initialData?initialData?.guardian?.email :'', 
        address: initialData?initialData?.guardian?.address :'',
      }
    });

    const {
            students,setStudents, // students data
              teachers, setTeachers ,// teachers data
              staff, setStaff, // staff data
              classRooms, setClassRooms, // classRooms data
              subjects, setSubjects, // subjects data
          } = useContext(uiContext)
    const updateGuardian = (field: string, value: string) => {
        setFormData({
            ...formData,
            guardian: { ...formData.guardian!, [field]: value }
        });
    };

    return (
      <div className="animate-fadeIn w-full max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-navy-900 px-8 py-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center">
            <i className="fa-solid fa-user-graduate mr-3 text-gold-500"></i>
            {initialData ? 'Update Student Record' : 'New Student Registration'}
          </h2>
          <button onClick={onCancel} className="text-white hover:text-gold-500 transition-colors">
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        
        <form onSubmit={(e) => { 
            e.preventDefault();
            e.stopPropagation();
            onSubmit(formData); 

        }} className="p-8 space-y-8">
           {/* Photo & Basic Identity */}
           <div className="flex flex-col md:flex-row gap-8">
             <div className="shrink-0 flex justify-center md:justify-start">
               <ImageUpload 
                  label="Student Photo" 
                  currentImage={urls.BASE_URL+formData.picture} 
                  onImageSelected={(url) => setFormData({...formData, picture: url})} 
               />
             </div>
             
             <div className="flex-1 space-y-6">
                <h3 className="font-bold text-navy-900 border-b pb-2 flex items-center">
                   <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-2 text-xs"><i className="fa-solid fa-id-card"></i></span>
                   Identity Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input required label="First Name" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} iconClass="fa-solid fa-user" />
                  <Input label="Middle Name" value={formData.middleName} onChange={e => setFormData({...formData, middleName: e.target.value})} iconClass="fa-solid fa-user" />
                  <Input required label="Last Name" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} iconClass="fa-solid fa-user" />
                  
                  <div>
                    <label className="block text-sm font-semibold text-navy-800 mb-1.5">Gender</label>
                    <select 
                        className="w-full p-3 border border-gray-300 rounded-md"
                        value={formData.gender}
                        onChange={e => setFormData({...formData, gender: e.target.value as any})}
                    >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                  </div>
                  <Input type="date" label="Date of Birth" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} iconClass="fa-solid fa-calendar" />
                  <Input label="NIN / ID Number" value={formData.nin} onChange={e => setFormData({...formData, nin: e.target.value})} iconClass="fa-solid fa-fingerprint" placeholder="National Identity Number" />
               </div>
               <Input type="email" label="Student Email (Required)" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} iconClass="fa-regular fa-envelope" />
             </div>
           </div>

           {/* 2. Academic & Guardian */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <h3 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-2 text-xs"><i className="fa-solid fa-graduation-cap"></i></span>
                    Academic Placement
                  </h3>
                  
                  <MultiSelectDropdown 
                      label="Assigned Classes (Select Multiple)"
                      items={classRooms}
                      selectedIds={formData.classRoomIds || []}
                      onChange={(ids) => setFormData({...formData, classRoomIds: ids})}
                      placeholder="Assign classes..."
                  />

                  {initialData && (
                     <Input disabled label="Admission Number" value={formData.admissionNumber} iconClass="fa-solid fa-id-badge" />
                  )}
                  
                  <div>
                    <label className="block text-sm font-semibold text-navy-800 mb-1.5">Current Status</label>
                    <div className="flex gap-4">
                        {['Active', 'Inactive', 'Suspended'].map(s => (
                             <label key={s} className="flex items-center cursor-pointer">
                                 <input 
                                    type="radio" 
                                    name="status"
                                    value={s}
                                    checked={formData.status === s}
                                    onChange={() => setFormData({...formData, status: s as any})}
                                    className="w-4 h-4 text-navy-900 border-gray-300 focus:ring-navy-900" 
                                 />
                                 <span className="ml-2 text-sm text-gray-700">{s}</span>
                             </label>
                        ))}
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="font-bold text-navy-900 border-b pb-2 mb-4 flex items-center">
                    <span className="w-6 h-6 rounded-full bg-navy-100 text-navy-700 flex items-center justify-center mr-2 text-xs"><i className="fa-solid fa-users"></i></span>
                    Guardian Information
                  </h3>
                  <div className="grid grid-cols-1 gap-4">
                    <Input label="Guardian Full Name" value={formData.guardian?.fullName} onChange={e => updateGuardian('fullName', e.target.value)} iconClass="fa-solid fa-user-shield" />
                    <Input label="Email" value={formData.guardian?.email} onChange={e => updateGuardian('email', e.target.value)} iconClass="fa-solid fa-phone" />
                    <Input label="Phone Number" value={formData.guardian?.phone} onChange={e => updateGuardian('phone', e.target.value)} iconClass="fa-solid fa-phone" />
                    <Input label="Relationship" value={formData.guardian?.relationship} onChange={e => updateGuardian('relationship', e.target.value)} iconClass="fa-solid fa-link" />
                    <Input label="Address" value={formData.guardian?.address} onChange={e => updateGuardian('address', e.target.value)} iconClass="fa-solid fa-map-pin" />
                  </div>
               </div>
           </div>

           <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
              <Button variant="outline" className="w-auto px-8" onClick={onCancel} type="button">Cancel</Button>
              <Button className="w-auto px-8" type="submit">
                  {initialData ? 'Update Record' : 'Register Student'}
              </Button>
           </div>
        </form>
      </div>
    );
  };