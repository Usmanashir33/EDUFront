import React, { useContext, useEffect, useState } from 'react';
import { SchoolRole, SchoolPermission } from '../../types';
import { Button, Input, Modal, Toast } from '../UI';
import { uiContext } from '@/customContexts/UiContext';
import urls from '@/customHooks/ServerUrls';

interface RoleSettingsProps {
    roles: any;
    permissions: SchoolPermission[];
    onUpdateRoles: (form: any ,action:"ADD"|"EDIT"|"DELETE") => void;
    onUpdatePermissions: (perms: SchoolPermission[],action:"ADD"|"EDIT"|"DELETE") => void;
}

export const RoleSettings: React.FC<RoleSettingsProps> = ({
     roles, permissions, onUpdateRoles, onUpdatePermissions,
    }) => {
    const {isLoading,selectedSchool,setToast} = useContext(uiContext);
    const [view, setView] = useState<'ROLES' | 'PERMISSIONS'>('ROLES');
    const [showDeleteRoleModal,setShowDeleteRoleModal] = useState(false);
    // Modals
    const [roleModal, setRoleModal] = useState<{ isOpen: boolean; data: Partial<SchoolRole> | null }>({ isOpen: false, data: null });
    const [permModal, setPermModal] = useState<{ isOpen: boolean; data: Partial<SchoolPermission> | null }>({ isOpen: false, data: null });
    const [viewRoleModal, setViewRoleModal] = useState<{ isOpen: boolean; data: SchoolRole | null }>({ isOpen: false, data: null });

    const handleSaveRole = (e: React.FormEvent) => {
        e.preventDefault();
        const fd = new FormData(e.target as HTMLFormElement);
        const name = fd.get('name') as string;
        const desc = fd.get('description') as string;
        let id = roleModal.data?.id ;
        const selectedPerms = fd.getAll('permissions') as string[] ;
        let action: "ADD" | "EDIT" | "DELETE" = id ? "EDIT" : "ADD";
        let form:any = {
            name,
            description: desc,
            permissionIds: selectedPerms,
            school : selectedSchool?.id ,
        }
        id? form.id = id : null ;
        onUpdateRoles(form,action);
        return ;
    };
    const handleDeleteRole = () => {
        let id = roleModal.data?.id ;
        onUpdateRoles({id},"DELETE");
    }
    const handleSavePerm = (e: React.FormEvent) => {
        e.preventDefault();
        setPermModal({ isOpen: false, data: {} })
        setToast({message:"Adding permission is currently not available",type:'info'})
        // const fd = new FormData(e.target as HTMLFormElement);
        // const name = fd.get('name') as string;
        // const desc = fd.get('description') as string;
        // let id = permModal.data?.id ;
        // let action: "ADD" | "EDIT" | "DELETE" = id ? "EDIT" : "ADD";
        // let form:any = {
        //     name,
        //     description: desc,
        //     school : selectedSchool?.id ,
        // }
        // id? form.id = id : null ;
        // onUpdatePermissions(form,action);
        return ;
    };

    useEffect(() => {
        // this is used to clear the form when the server return success response  in the setting manager 
        setRoleModal({ isOpen: false, data: null })
        setPermModal({ isOpen: false, data: null })
        return ;
    },[roles,permissions])

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-navy-50 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10">
                    <h2 className="text-xl font-bold text-navy-900 border-b-2 border-gold-500 inline-block pb-1">Access Control</h2>
                    <p className="text-sm text-gray-500 mt-2">Manage system roles and explicit permissions</p>
                </div>
                <div className="flex gap-2 bg-gray-100 p-1 rounded-lg mt-4 md:mt-0 relative z-10">
                    <button 
                        onClick={() => setView('ROLES')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'ROLES' ? 'bg-white text-navy-900 shadow' : 'text-gray-500 hover:text-navy-700'}`}
                    >
                        System Roles
                    </button>
                    <button 
                        onClick={() => setView('PERMISSIONS')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${view === 'PERMISSIONS' ? 'bg-white text-navy-900 shadow' : 'text-gray-500 hover:text-navy-700'}`}
                    >
                        Permissions
                    </button>
                </div>
            </div>

            {view === 'ROLES'? (
                <div className="space-y-4">
                    <div className="flex justify-end"> 
                        <Button className="w-auto px-4" onClick={() => setRoleModal({ isOpen: true, data: { permissionIds: [] } })}>
                            <i className="fa-solid fa-plus mr-2"></i> Create New Role
                        </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {roles.map(r => {
                            const associatedUsers:any = r?.users || [];

                            return (
                                <div key={r.id} onClick={() => setViewRoleModal({ isOpen: true, data: r })} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md hover:border-gold-300 transition-all cursor-pointer group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-navy-900 text-lg group-hover:text-gold-600 transition-colors">{r.name}</h3>
                                        <div className="flex gap-4 items-center">
                                            
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setRoleModal({ isOpen: true, data: r }); }}
                                                className="text-gray-400 hover:text-navy-600 p-1"
                                            >
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setRoleModal({ isOpen: false, data: r });setShowDeleteRoleModal(true); }}
                                                className="text-red-600 hover:text-red-400 p-1"
                                            >
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 h-10 overflow-hidden">{r.description}</p>
                                    <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                                        <span className="bg-navy-50 text-navy-700 px-2 flex items-center gap-1.5 py-1 rounded font-bold"><i className="fa-solid fa-key opacity-50"></i> {r.permissionIds.length} Permissions</span>
                                        <span className="bg-gray-50 text-gray-600 px-2 flex items-center gap-1.5 py-1 rounded font-bold"><i className="fa-solid fa-users opacity-50"></i> {associatedUsers.length} Users</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button className="w-auto px-4" onClick={() => setPermModal({ isOpen: true, data: {} })}>
                            <i className="fa-solid fa-plus mr-2"></i> Define Permission
                        </Button>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Permission Identifier</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {permissions.map(p => (
                                    <tr key={p.id}>
                                        <td className="px-6 py-4 font-mono text-sm text-navy-900 font-bold bg-navy-50/30">{p.name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{p.description}</td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => setPermModal({ isOpen: true, data: p })} className="text-gray-400 hover:text-navy-700">
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modals */}
            <Modal isOpen={roleModal.isOpen} onClose={() => setRoleModal({ isOpen: false, data: null })} title={roleModal.data?.id ? "Edit Role" : "Create Role"} icon="fa-solid fa-shield-halved">
                <form onSubmit={handleSaveRole} className="space-y-4">
                    <Input label="Role Name" name="name" defaultValue={roleModal.data?.name} required placeholder="e.g. Finance Administrator" />
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea name="description" defaultValue={roleModal.data?.description} required rows={2} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-navy-900" placeholder="Short description of this role..."></textarea>
                    </div>
                    <div className="space-y-2 pt-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Assigned Permissions</label>
                        <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-48 overflow-y-auto grid gap-2">
                            {permissions.map(p => (
                                <label key={p.id} className="flex items-start gap-2 bg-white p-2 rounded border border-gray-100 cursor-pointer hover:bg-navy-50 transition-colors">
                                    <input 
                                        type="checkbox" 
                                        name="permissions" 
                                        value={p.id} 
                                        defaultChecked={roleModal.data?.permissionIds?.includes(p.id)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <div className="font-mono text-xs font-bold text-navy-900">{p.name}</div>
                                        <div className="text-[10px] text-gray-500 leading-tight mt-0.5">{p.description}</div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setRoleModal({ isOpen: false, data: null })}>Cancel</Button>
                        <Button disabled={isLoading} type="submit">Save Role</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={permModal.isOpen} onClose={() => setPermModal({ isOpen: false, data: null })} title={permModal.data?.id ? "Edit Permission" : "Define Permission"} icon="fa-solid fa-key">
                <form onSubmit={handleSavePerm} className="space-y-4">
                    <Input label="Permission Identifier" name="name" disabled defaultValue={permModal.data?.name} required placeholder="e.g. view_finance_records (Not Allowed Now)" className="font-mono text-sm" />
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea name="description" defaultValue={permModal.data?.description} required rows={3} className="w-full px-3 py-2 border rounded-md focus:outline-none focus:border-navy-900" placeholder="What does this permission allow..."></textarea>
                    </div>
                    <div className="pt-4 flex gap-3">
                        <Button type="button" variant="outline" onClick={() => setPermModal({ isOpen: false, data: null })}>Cancel</Button>
                        <Button type="submit" >Save Permission</Button>
                    </div>
                </form>
            </Modal>

             <Modal isOpen={viewRoleModal.isOpen} onClose={() => setViewRoleModal({ isOpen: false, data: null })} title="Role Overview" icon="fa-solid fa-users-viewfinder">
                {viewRoleModal?.data && (
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold text-navy-900 text-lg">{viewRoleModal.data.name}</h3>
                            <p className="text-sm text-gray-600">{viewRoleModal.data.description}</p>
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase border-b pb-1">Included Permissions ({viewRoleModal?.data?.permissionIds?.length})</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                                {viewRoleModal?.data?.permissionIds?.map(pid => {
                                    const p = permissions.find(x => x.id === pid);
                                    return p ? (
                                        <div key={p.id} className="bg-gray-50 p-2 rounded border border-gray-200 flex items-center gap-2">
                                            <i className="fa-solid fa-check text-green-500 text-xs"></i>
                                            <div>
                                                <div className="text-xs font-mono font-bold text-navy-900">{p.name}</div>
                                                <div className="text-[10px] text-gray-500 truncate w-32">{p.description}</div>
                                            </div>
                                        </div>
                                    ) : null;
                                })}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-gray-500 uppercase border-b pb-1">Assigned Users</h4>
                            <div className="max-h-48 overflow-y-auto pr-2 space-y-2">
                                {(()=>{
                                    const roleUsers:any = viewRoleModal.data?.users || [];
                                    if(roleUsers.length === 0) return <div className="text-sm text-gray-500 italic py-2">No users currently assigned to this role.</div>;
                                    return roleUsers.map(u => (
                                        <div key={u?.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 shadow-sm">
                                            <div className="w-8 h-8 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-xs overflow-hidden">
                                                {u?.picture ? <img src={urls.BASE_URL + u?.picture} alt="" className="w-full h-full object-cover border-rounded border-gray"/> : u?.first_name[0]}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-navy-900">{u?.first_name} {u?.last_name}</div>
                                                <div className="text-xs text-gray-500 capitalize">{u?.role}●{u?.username}</div>
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                        <div className="pt-2 flex justify-end">
                            <Button variant="outline" onClick={() => setViewRoleModal({ isOpen: false, data: null })}>Close</Button>
                        </div>
                    </div>
                )}
            </Modal>
            {/* Fee Settings Configuration Warning Modal */}
                        <Modal isOpen={showDeleteRoleModal} onClose={() => setShowDeleteRoleModal(false)} title="School Configuration Alert" size="sm">
                            <div className="space-y-4 flex flex-col items-center text-center pt-2 pb-4">
                                <div className="w-20 h-20 bg-gold-100 rounded-full flex items-center justify-center shadow-sm border border-gold-200">
                                    <i className="fa-solid fa-triangle-exclamation text-4xl text-gold-500 animate-pulse"></i>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-navy-900 mb-3">Action Required.</h3>
                                    <p className="text-gray-600 text-sm leading-relaxed max-w-sm mx-auto font-medium">
                                        <strong>
                                            <i className='px-1'>{roleModal?.data?.name}</i> 
                                        </strong>
                                            
                                            has
                                             <b className='px-1'>
                                                { roleModal?.data?.permissionIds?.length}
                                            </b> Permissions and 
                                            <b className='px-1'>
                                                { roleModal?.data?.users?.length} Users.
                                            </b>
                                        <br/><br/>

                                        If the Role is <b>Deleted.</b>
                                        All users,staffs,teachers associated with this Role will loose their access to the permissions
                                        associated with the Role. <b>if you are agree</b>
                                         <strong className="text-navy-900"> Click Delete ⇓ </strong> below to proceed.
                                    </p>
                                </div>
                                
                                <div className="flex w-full gap-4 mt-6 border-t border-gray-100 pt-6">
                                    <Button variant="secondary" onClick={() => setShowDeleteRoleModal(false)} className="flex-1 py-3 text-sm font-bold justify-center">
                                        Cancel
                                    </Button>
                                    <Button onClick={() => {
                                        setShowDeleteRoleModal(false);
                                        if (view === "ROLES") handleDeleteRole()
                                        // if (termOrSession === "TERM") handleAddTerm()
                                    }} className="bg-navy-900 text-white flex-[2] flex items-center justify-center py-3 text-sm font-bold shadow-md hover:bg-navy-800 transition-colors">
                                        <i className="fa-solid fa-cogs mr-2"></i> Delete
                                    </Button>
                                </div>
                            </div>
                        </Modal>
        </div>
    );
};
