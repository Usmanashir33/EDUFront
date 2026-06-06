
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Button } from '../UI';
import { uiContext } from '@/customContexts/UiContext';

interface StaffRolesProps { 
    staff: any;
    handleManageRoles: (staffId: string, roleIds: string[]) => void;
}

export const StaffRoles: React.FC<StaffRolesProps> = ({ staff, handleManageRoles }) => {
    const saveRef = useRef<any|null>(null)
    const {roles:systemRoles, permissions:systemPermissions,staffs} = useContext(uiContext);

    // Roles & Perms Logic
    const [isEditingRoles, setIsEditingRoles] = useState(false);
    const [roleChanged,setRoleChanged] = useState(false);
    const [assignedRoles,setAssignedRoles] = useState(systemRoles.filter(r => r.id === staff?.school_role) || []);
    const effectivePermissionIds = Array.from(new Set(assignedRoles.flatMap(r => r.permissionIds)));
    const effectivePermissions = systemPermissions.filter(p => effectivePermissionIds.includes(p.id));

    const toggleRole = (roleId: string) => {
        if (assignedRoles.find(r => r.id === roleId)) {
            setAssignedRoles(prev => prev.filter(r => r.id !== roleId));
        }else{
            const roleToAdd = systemRoles.find(r => r.id === roleId);
            if(roleToAdd) setAssignedRoles(prev => [roleToAdd]);
            saveRef?.current?.scrollIntoView({
               behavior: "smooth",
              block: "start"
            })
        }
    };

    // check role change pls 
    useEffect(() => {
        if (!assignedRoles?.length) return ;
        const ass = (systemRoles.filter(r => r.id === staff?.school_role) || [])?.map(a => a?.id)
        const assignedRoleIds = assignedRoles.map(r => r.id) ;

        setRoleChanged(
            assignedRoleIds.sort().every((value, index) => value !== ass.sort()[index])
        )
    }, [assignedRoles]);

    useEffect(() => {
        if (!isEditingRoles) return ; // close the edit mode if systemRoles changed (e.g. after saving changes) by server response 
        setIsEditingRoles(false);
    }, [staffs]);

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
                                        <div ref={saveRef}>
                                            <Button variant="outline" className={`w-auto max-w-fit  px-4 ${(isEditingRoles && roleChanged)? "bg-navy-700 text-gray-100 animate-bounce hover:bg-navy-600" : ''}`} onClick={() => {
                                                if(isEditingRoles && roleChanged){
                                                    // save changes
                                                    handleManageRoles(staff.id, assignedRoles.map(r => r.id));
                                                    return ;
                                                }
                                                setIsEditingRoles(!isEditingRoles);

                                            }}>
                                                <i className={`fa-solid ${isEditingRoles ? 'fa-check' : 'fa-pen'}  mr-2`}></i> {isEditingRoles ? roleChanged?"Save Changes":"Done" : 'Manage Roles'}
                                            </Button>
                                        </div>
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
                                                                checked={assignedRoles.some(role => role.id === r.id)}
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
