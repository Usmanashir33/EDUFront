
import React, { useContext, useState } from 'react';
import { Staff, KYCDocument, SchoolRole, SchoolPermission } from '../../types';
import { Button, ImageViewer } from '../UI';
import { uiContext } from '@/customContexts/UiContext';

interface StaffRolesProps { 
    // id: string;
    staff: Staff;
    
}

type Tab = 'OVERVIEW' | 'FINANCE' | 'ADMIN';

export const StaffRoles: React.FC<StaffRolesProps> = ({ staff }) => {
    const [activeTab, setActiveTab] = useState<Tab>('OVERVIEW');
    const [showImage, setShowImage] = useState(false); 
    const {roles:systemRoles, permissions:systemPermissions} = useContext(uiContext);
    

    // Roles & Perms Logic
    const [isEditingRoles, setIsEditingRoles] = useState(false);
    const assignedRoles = systemRoles.filter(r => staff.schoolRoleIds?.includes(r.id));
    const effectivePermissionIds = Array.from(new Set(assignedRoles.flatMap(r => r.permissionIds)));
    const effectivePermissions = systemPermissions.filter(p => effectivePermissionIds.includes(p.id));

    const toggleRole = (roleId: string) => {
        const current = staff.schoolRoleIds || [];
        const next = current.includes(roleId) ? current.filter(id => id !== roleId) : [...current, roleId];
        // onUpdateStaff({ ...staff, schoolRoleIds: next });
    };

    return (
                
        <div className="px-8 pb-8 relative">
            <div className="space-y-8">
                {/* Roles & Permissions Management */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                                        <div>
                                            <h3 className="font-bold text-navy-900 flex items-center">
                                                <i className="fa-solid fa-user-lock mr-2 text-navy-600"></i> Roles & Permissions
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">Manage system access for this staff member</p>
                                        </div>
                                        <Button variant="outline" className="w-auto px-4" onClick={() => setIsEditingRoles(!isEditingRoles)}>
                                            <i className={`fa-solid ${isEditingRoles ? 'fa-check' : 'fa-pen'} mr-2`}></i> {isEditingRoles ? 'Done' : 'Manage Roles'}
                                        </Button>
                                    </div>
                                     
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Assigned System Roles</h4>
                                            {isEditingRoles ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {systemRoles.map(r => (
                                                        <label key={r.id} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${staff.schoolRoleIds?.includes(r.id) ? 'bg-navy-50 border-navy-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                                            <input 
                                                                type="checkbox" 
                                                                className="mt-1"
                                                                checked={staff.schoolRoleIds?.includes(r.id) || false}
                                                                onChange={() => toggleRole(r.id)}
                                                            />
                                                            <div>
                                                                <p className={`font-bold text-sm ${staff.schoolRoleIds?.includes(r.id) ? 'text-navy-900' : 'text-gray-700'}`}>{r.name}</p>
                                                                <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    {assignedRoles.length > 0 ? assignedRoles.map(r => (
                                                        <span key={r.id} className="bg-navy-100 text-navy-800 text-sm font-bold px-3 py-1.5 rounded-md border border-navy-200">
                                                            <i className="fa-solid fa-shield-cat mr-1 opacity-50"></i> {r.name}
                                                        </span>
                                                    )) : <span className="text-sm text-gray-500 italic">No roles assigned. User has default baseline access.</span>}
                                                </div>
                                            )}
                                        </div>

                                        {assignedRoles.length > 0 && !isEditingRoles && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">Effective Permissions ({effectivePermissions.length})</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {effectivePermissions.map(p => (
                                                        <div key={p.id} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200">
                                                            <i className="fa-solid fa-check text-green-500 text-xs"></i>
                                                            <span className="font-mono text-xs text-navy-900 font-bold leading-tight" title={p.description}>{p.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                </div>
            </div>
        </div>
            
    );
};
