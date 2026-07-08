import React from 'react';
import { Button } from '../../components/UI';

export const ExamOfficerView: React.FC = () => {
    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Examinations Overview</h2>
                    <p className="text-slate-500 mt-1">Manage termly results, processing status, and report cards.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"><i className="fa-solid fa-print mr-2"></i> Print Broadhseet</Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20"><i className="fa-solid fa-check-double mr-2"></i> Publish Results</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <i className="fa-solid fa-file-signature text-6xl text-indigo-900"></i>
                    </div>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Results Uploaded</h3>
                    <div className="text-3xl font-black text-slate-900">85%</div>
                    <div className="mt-3 flex items-center text-xs font-bold text-indigo-600">
                        <i className="fa-solid fa-spinner fa-spin mr-1.5"></i> Processing ongoing
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-amber-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <i className="fa-solid fa-triangle-exclamation text-6xl text-amber-900"></i>
                    </div>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Pending Subjects</h3>
                    <div className="text-3xl font-black text-slate-900">12</div>
                    <div className="mt-3 flex items-center text-xs font-bold text-amber-500">
                        <i className="fa-solid fa-clock mr-1.5"></i> Awaiting teacher input
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <i className="fa-solid fa-award text-6xl text-emerald-900"></i>
                    </div>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Distinctions</h3>
                    <div className="text-3xl font-black text-slate-900">142</div>
                    <div className="mt-3 flex items-center text-xs font-bold text-emerald-600">
                        <i className="fa-solid fa-arrow-trend-up mr-1.5"></i> +12% vs last term
                    </div>
                </div>

                <div className="bg-indigo-900 p-6 rounded-2xl border border-indigo-800 shadow-lg relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fa-solid fa-calendar-check text-6xl text-white"></i>
                    </div>
                    <h3 className="text-indigo-300 text-xs font-black uppercase tracking-widest mb-2">Current Session</h3>
                    <div className="text-xl font-black text-white mt-1">2023/2024</div>
                    <div className="text-lg font-bold text-indigo-200">Second Term</div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6">
                <h3 className="font-bold text-slate-900 mb-6">Class Processing Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { name: 'JSS 1 A', progress: 100, status: 'Ready for Review' },
                        { name: 'JSS 1 B', progress: 100, status: 'Ready for Review' },
                        { name: 'JSS 2 A', progress: 85, status: 'Awaiting Math' },
                        { name: 'SSS 1 Sci', progress: 40, status: 'Processing' },
                        { name: 'SSS 2 Art', progress: 0, status: 'Not Started' },
                    ].map((cls, idx) => (
                        <div key={idx} className="border border-slate-100 rounded-xl p-5 hover:border-indigo-200 transition-colors">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-bold text-slate-900">{cls.name}</h4>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                    cls.progress === 100 ? 'bg-emerald-100 text-emerald-700' :
                                    cls.progress > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                    {cls.progress}%
                                </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 mb-3 overflow-hidden">
                                <div className={`h-2 rounded-full ${cls.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} style={{ width: `${cls.progress}%` }}></div>
                            </div>
                            <p className="text-xs font-medium text-slate-500 text-right">{cls.status}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
