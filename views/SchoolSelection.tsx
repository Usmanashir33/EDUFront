import React, { useState ,useContext} from 'react';
import { FadeIn, Button } from '../components/UI';
import urls from '@/customHooks/ServerUrls';
import { authContext } from '@/customContexts/AuthContext';

interface SchoolSelectionProps {
    onNavigate?: (view: string) => void;
    onSelectSchool: (id: string) => void; 
    // schools: School[];
}

export const SchoolSelection: React.FC<SchoolSelectionProps> = ({ onNavigate, onSelectSchool }) => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [schools,setSchools] = useState(JSON.parse(localStorage.getItem('directorschools')) || []);
    const {currentUserFullname,userRole} = useContext(authContext);

    
    const handleEnter = () => { 
        if (selectedId) {
            onSelectSchool(selectedId);
        }
    };

    return (
        <div className="w-full">
            <FadeIn>
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-gray-200">
                    <div>
                         <h2 className="text-2xl font-bold text-navy-900">Select School</h2>
                         <p className="mt-1 text-sm text-gray-600">Choose the institution you wish to manage.</p>
                    </div>
                    <div className="text-right">
                         <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{userRole?.toUpperCase()}</p>
                         <p className="text-sm font-medium text-navy-800">{currentUserFullname()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {schools.map((school, idx) => (
                        <div
                            key={school.id}
                            onClick={() => setSelectedId(school.id)}
                            className={`group relative rounded-lg cursor-pointer transition-all duration-300 border-2 overflow-hidden ${
                                selectedId === school.id 
                                ? 'border-navy-900 shadow-xl ring-2 ring-navy-900/10' 
                                : 'border-transparent bg-gray-50 hover:bg-white hover:shadow-lg hover:border-gray-200'
                            }`}
                            style={{ animationDelay: `${idx * 100} ms` }}
                        >
                            <div className="aspect-[16/9] relative overflow-hidden bg-gray-200">
                                <img 
                                    // src={school?.logo} 
                                    src={urls.BASE_URL + school?.logo} 
                                    alt={school.name} 
                                    className={`w-full h-full object-cover transition-transform duration-700 ${selectedId === school.id ? 'scale-105 saturate-100' : 'grayscale group-hover:grayscale-0 group-hover:scale-105'}`}
                                />
                                <div className="absolute inset-0 bg-navy-900/20 group-hover:bg-transparent transition-colors"></div>
                                {selectedId === school.id && (
                                    <div className="absolute top-3 right-3 z-20 bg-navy-900 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg">
                                        <i className="fa-solid fa-check"></i>
                                    </div>
                                )}
                            </div>
                            <div className="p-5">
                                <h3 className={`font-bold text-lg mb-1 transition-colors ${selectedId === school.id ? 'text-navy-900' : 'text-gray-700 group-hover:text-navy-800'}`}>
                                    {school.name}
                                </h3>
                                <div className="flex items-start mb-3 text-sm text-gray-500">
                                    <i className="fa-solid fa-map-pin mt-1 mr-2 text-gold-500 shrink-0"></i>
                                    <span className="line-clamp-2">{school.address}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-200 flex items-center justify-between text-xs font-medium text-gray-500">
                                    <span className="flex items-center">
                                        <i className="fa-solid fa-users mr-2"></i>
                                        {school?.total_students} Students
                                    </span>
                                    <span className="px-2 py-1 bg-gray-200 rounded text-gray-600">Active</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                    {/* <Button 
                        variant="outline"
                        onClick={() => onNavigate(ViewState.LOGIN)}
                        className="w-auto px-6"
                    >
                        Switch Account
                    </Button> */}
                    <Button
                        variant={selectedId ? 'primary' : 'outline'}
                        disabled={!selectedId}
                        onClick={handleEnter}
                        className="w-auto px-8"
                    >
                        Access Dashboard <i className="fa-solid fa-arrow-right ml-2"></i>
                    </Button>
                </div>
            </FadeIn>
        </div>
    );
};