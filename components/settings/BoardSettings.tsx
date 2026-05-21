
import { useEffect } from 'react';
import { Input, ImageUpload, Button } from '../UI';
import urls from '@/customHooks/ServerUrls';
import { uiContext } from '@/customContexts/UiContext';

interface BoardSettingsProps {
    data: any;
    setData: (d: any) => void;
    saveData: (d: any) => void;
    originalData: any;
}

export const BoardSettings: React.FC<BoardSettingsProps> = ({ data, setData,saveData, originalData }) => {
    const showWarning = (field: string) => data[field] !== originalData[field];
    const getLogo = () => {
        if (typeof data?.logo ===  'string'){ // not file object 
            return urls.BASE_URL + data.logo
        }else {
            const previewUrl = URL.createObjectURL(data?.logo);
            return previewUrl;
        }
    }

    const checkUpdate = () => {
        let hasNotChanges = true; 
        Object.entries(data).forEach(([key,value]) => {
            if (showWarning(key)) hasNotChanges = false;
        })
        return hasNotChanges;
    }
    useEffect(() => {
        // After successful save, we can revoke the object URL to free memory
        if (data.logo && data.logo instanceof File) {
            const previewUrl = URL.createObjectURL(data.logo);
            return () => URL.revokeObjectURL(previewUrl);
        }
        return () => setData({ ...originalData}); // Reset to original on unmount or when logo changes
    }, []);
    return (
        <div className="space-y-8 animate-fadeIn h-full ">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Institution Board</h2>
                <p className="text-sm text-gray-500">Manage school identity, logo, and contact information.</p>
            </div>

            {/* Logo Section with Live Preview */}
            <div className="bg-navy-50 rounded-xl p-6 border border-navy-100 flex flex-col md:flex-row items-center gap-8">
                <div className="shrink-0 flex flex-col items-center">
                    <ImageUpload 
                        label="School Logo"
                        currentImage={urls.BASE_URL+ data.logo}
                        onImageSelected={(url) => setData({ ...data, logo: url })}
                        className=""
                    />
                    <p className="text-xs text-gray-400 mt-2 text-center">Recommended: Square PNG</p>
                </div>

                <div className="flex-1 w-full">
                    <h4 className="text-xs font-bold text-navy-400 uppercase mb-3">Live Identity Preview</h4>
                    {/* Simulated Header Preview */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                            {data.logo ? (
                                <img src={getLogo()} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <i className="fa-solid fa-school text-gray-300 text-2xl"></i>
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-navy-900 text-lg leading-tight">{data.name || 'School Name'}</h3>
                            <p className="text-xs text-gray-500">{data.address || 'Address Line'}</p>
                            <p className="text-[10px] text-navy-400 mt-1 font-mono">{data.tag || 'ID-TAG'}</p>
                        </div>
                    </div>
                    {/* Simulated ID Card Preview (Small) */}
                    <div className="mt-4 flex gap-4">
                         <div className="bg-gradient-to-r from-navy-900 to-navy-800 rounded-lg p-3 w-48 text-white shadow-md relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-12 h-12 bg-white/10 rounded-bl-full"></div>
                            <div className="flex items-center gap-2 mb-2">
                                 <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center overflow-hidden">
                                     {data.logo ? <img src={getLogo()} className="w-full h-full object-contain"/> : <span className="text-navy-900 text-[8px] font-bold">LOGO</span>}
                                 </div>
                                 <span className="text-[8px] font-bold tracking-wider opacity-80 uppercase truncate w-24">{data.name}</span>
                            </div>
                            <div className="w-8 h-8 bg-white/20 rounded mb-1"></div>
                            <div className="h-1 w-16 bg-white/20 rounded mb-1"></div>
                            <div className="h-1 w-10 bg-white/20 rounded"></div>
                         </div>
                         <div className="text-xs text-gray-400 flex items-end pb-1">
                             <i className="fa-solid fa-arrow-left mr-2"></i> How it appears on ID Cards
                         </div>
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                    <Input 
                        label="School Name" 
                        value={data.name} 
                        onChange={e => setData({ ...data, name: e.target.value })} 
                        iconClass="fa-solid fa-school" 
                    />
                    {showWarning('name') && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r text-xs text-orange-800 animate-fadeIn">
                            <p className="font-bold flex items-center"><i className="fa-solid fa-triangle-exclamation mr-2"></i> Name Change Detected</p>
                            <p>Changing the school name will update all future generated reports and transcripts. Please ensure this name is legally available.</p>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <Input 
                        label="Institution ID / Tag" 
                        value={data.tag} 
                        onChange={e => setData({ ...data, tag: e.target.value })} 
                        iconClass="fa-solid fa-tag" 
                    />
                    {showWarning('tag') && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r text-xs text-orange-800 animate-fadeIn">
                            <p className="font-bold flex items-center"><i className="fa-solid fa-triangle-exclamation mr-2"></i> Critical Identifier Modified</p>
                            <p>Modifying the Institution ID may disconnect linked teacher/student accounts using the old ID prefix.</p>
                        </div>
                    )}
                </div>

                <div className="md:col-span-2">
                    <Input label="Physical Address" value={data.address} onChange={e => setData({ ...data, address: e.target.value })} iconClass="fa-solid fa-location-dot" />
                </div>

                <div className="space-y-2">
                    <Input 
                        label="Official Email" 
                        value={data.email} 
                        onChange={e => setData({ ...data, email: e.target.value })} 
                        iconClass="fa-regular fa-envelope" 
                    />
                    {showWarning('email') && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r text-xs text-orange-800 animate-fadeIn">
                            <p className="font-bold flex items-center"><i className="fa-solid fa-triangle-exclamation mr-2"></i> Email Update</p>
                            <p>System notifications and password resets will be routed to this new address. Verification may be required.</p>
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Input label="Contact Phone" value={data.phone} onChange={e => setData({ ...data, phone: e.target.value })} iconClass="fa-solid fa-phone" />

                    {showWarning('phone') && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded-r text-xs text-orange-800 animate-fadeIn">
                            <p className="font-bold flex items-center"><i className="fa-solid fa-triangle-exclamation mr-2"></i> Phone Update</p>
                            <p>System notifications and communication will be routed to this new phone number.</p>
                        </div>
                    )}
                </div>
                <Input label="Website URL(Optional)" value={data?.website} onChange={e => setData({ ...data, website: e.target.value })} iconClass="fa-solid fa-globe" />
                <div className="px-6 pt-6 mt- border-t border-gray-100 hidden md:block">
                    <Button onClick={saveData} disabled={checkUpdate()} className="w-full">
                    <i className="fa-solid fa-save mr-2"></i> Save Changes
                    </Button>
                </div>
            </div>
        </div>
    );
};
