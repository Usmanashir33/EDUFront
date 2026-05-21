
import React from 'react';

interface AppearanceSettingsProps {
    data: any;
    setData: (d: any) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({ data, setData }) => {
    
    const modes = [
        { 
            id: 'Light', 
            icon: 'fa-sun', 
            previewBg: 'bg-gray-50', 
            previewHeader: 'bg-white border-b', 
            previewText: 'text-gray-800',
            description: 'Classic clean interface for daylight usage.'
        },
        { 
            id: 'Dark', 
            icon: 'fa-moon', 
            previewBg: 'bg-gray-900', 
            previewHeader: 'bg-gray-800 border-b border-gray-700', 
            previewText: 'text-gray-200',
            description: 'High contrast dark theme for low light.'
        },
        { 
            id: 'System', 
            icon: 'fa-desktop', 
            previewBg: 'bg-gradient-to-br from-gray-50 to-gray-900', 
            previewHeader: 'bg-white/50 backdrop-blur', 
            previewText: 'text-navy-900',
            description: 'Adapts to your device system settings.'
        }
    ];

    return (
        <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Visual Preferences</h2>
                <p className="text-sm text-gray-500">Customize the look and feel of the portal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {modes.map(mode => {
                    const isActive = data.theme === mode.id;
                    return (
                        <div 
                            key={mode.id} 
                            onClick={() => setData({...data, theme: mode.id})} 
                            className={`relative cursor-pointer rounded-2xl border-2 p-4 flex flex-col gap-4 transition-all duration-300 group ${
                                isActive 
                                ? 'border-navy-900 bg-white shadow-xl ring-2 ring-navy-900/10 scale-105' 
                                : 'border-gray-200 bg-white hover:border-navy-300 hover:shadow-md'
                            }`}
                        >
                            {/* Checkmark indicator */}
                            {isActive && (
                                <div className="absolute -top-3 -right-3 bg-navy-900 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-md animate-fadeIn">
                                    <i className="fa-solid fa-check"></i>
                                </div>
                            )}

                            {/* UI Preview Mockup */}
                            <div className={`w-full h-32 rounded-xl shadow-inner overflow-hidden flex flex-col ${mode.previewBg} border border-gray-100`}>
                                <div className={`h-8 w-full ${mode.previewHeader} flex items-center px-3 gap-2`}>
                                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                </div>
                                <div className="p-3 space-y-2">
                                    <div className={`h-2 w-3/4 rounded ${mode.id === 'Dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    <div className={`h-2 w-1/2 rounded ${mode.id === 'Dark' ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                                    <div className={`h-8 w-full mt-4 rounded ${mode.id === 'Dark' ? 'bg-navy-800' : 'bg-white shadow-sm'}`}></div>
                                </div>
                            </div>

                            <div className="text-center">
                                <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full mb-2 ${isActive ? 'bg-navy-900 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                    <i className={`fa-solid ${mode.icon}`}></i>
                                </div>
                                <h3 className={`font-bold text-lg ${isActive ? 'text-navy-900' : 'text-gray-600'}`}>{mode.id} Mode</h3>
                                <p className="text-xs text-gray-500 mt-1 leading-snug">{mode.description}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
