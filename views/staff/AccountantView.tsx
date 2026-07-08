import React from 'react';
import { Button } from '../../components/UI';

export const AccountantView: React.FC = () => {
    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Finance Overview</h2>
                    <p className="text-slate-500 mt-1">Real-time tracking of revenue, outstanding balances, and recent transactions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50"><i className="fa-solid fa-file-export mr-2"></i> Export Report</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"><i className="fa-solid fa-plus mr-2"></i> New Invoice</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <i className="fa-solid fa-wallet text-6xl text-emerald-900"></i>
                    </div>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Total Revenue</h3>
                    <div className="text-3xl font-black text-slate-900">₦12,450,000</div>
                    <div className="mt-3 flex items-center text-xs font-bold text-emerald-600">
                        <i className="fa-solid fa-arrow-trend-up mr-1.5"></i> +14% from last term
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <i className="fa-solid fa-file-invoice-dollar text-6xl text-rose-900"></i>
                    </div>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Outstanding Fees</h3>
                    <div className="text-3xl font-black text-slate-900">₦3,200,500</div>
                    <div className="mt-3 flex items-center text-xs font-bold text-rose-500">
                        <i className="fa-solid fa-circle-exclamation mr-1.5"></i> 45 Students pending
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:border-sky-200 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <i className="fa-solid fa-money-bill-transfer text-6xl text-sky-900"></i>
                    </div>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-2">Recent Deposits</h3>
                    <div className="text-3xl font-black text-slate-900">₦850,000</div>
                    <div className="mt-3 flex items-center text-xs font-bold text-sky-600">
                        <i className="fa-solid fa-clock-rotate-left mr-1.5"></i> Last 7 days
                    </div>
                </div>

                <div className="bg-emerald-900 p-6 rounded-2xl border border-emerald-800 shadow-lg relative overflow-hidden text-white">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fa-solid fa-scale-balanced text-6xl text-white"></i>
                    </div>
                    <h3 className="text-emerald-300 text-xs font-black uppercase tracking-widest mb-2">Collection Rate</h3>
                    <div className="text-3xl font-black text-white">88.2%</div>
                    <div className="w-full bg-emerald-950 rounded-full h-1.5 mt-4 overflow-hidden">
                        <div className="bg-emerald-400 h-1.5 rounded-full" style={{ width: '88.2%' }}></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Transactions */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Recent Transactions</h3>
                            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700">View All</button>
                        </div>
                        <div className="divide-y divide-slate-50">
                            {[
                                { id: 'TX-1001', student: 'Emily Clarke', class: 'JSS 1 A', amount: 150000, date: 'Today, 09:45 AM', status: 'Completed', method: 'Bank Transfer' },
                                { id: 'TX-1002', student: 'Joshua Clarke', class: 'SSS 1', amount: 80000, date: 'Today, 08:30 AM', status: 'Completed', method: 'Card' },
                                { id: 'TX-1003', student: 'Michael Doe', class: 'JSS 3 C', amount: 200000, date: 'Yesterday', status: 'Pending', method: 'Cash Deposit' },
                            ].map(txn => (
                                <div key={txn.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                                            <i className="fa-solid fa-receipt"></i>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 text-sm">{txn.student}</p>
                                            <p className="text-xs text-slate-500 font-medium">{txn.class} • {txn.id}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900">₦{txn.amount.toLocaleString()}</p>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">{txn.date}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Quick Actions & Pending Invoices */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                        <h3 className="font-bold text-slate-900 mb-4">Pending Invoices</h3>
                        <div className="space-y-4">
                            {[
                                { class: 'JSS 1 A', count: 12, amount: 1800000 },
                                { class: 'JSS 1 B', count: 8, amount: 1200000 },
                                { class: 'SSS 3', count: 5, amount: 750000 },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">{item.class}</div>
                                        <div className="text-xs text-rose-500 font-bold mt-0.5">{item.count} Unpaid</div>
                                    </div>
                                    <div className="font-black text-slate-900">
                                        ₦{item.amount.toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 text-white shadow-md">Send Reminders</Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
