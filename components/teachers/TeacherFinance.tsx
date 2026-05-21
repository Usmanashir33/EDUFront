
import React, { useState } from 'react';
import { Teacher, PaymentRecord } from '../../types';
import { Button, Input, Modal } from '../UI';

// Helpers
export const safeParseFloat = (val: string | number | undefined): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return val;
    const clean = val.toString().replace(/[^0-9.-]+/g, '');
    const num = parseFloat(clean); 
    return isNaN(num) ? 0 : num;
};

export const formatInputCurrency = (value: string) => {
    if (!value) return '';
    const number = value.replace(/[^0-9]/g, '');
    return number ? '₦' + parseInt(number).toLocaleString() : '';
};

export const cleanCurrencyInput = (value: string) => {
    return value.replace(/[^0-9]/g, '');
};

interface PaymentReceiptProps { 
    data: { teacher: Teacher, record: PaymentRecord };
    onClose: () => void; 
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({ data, onClose }) => {
    const breakdown = data.record.breakdown || {
        baseSalary: data.record.amount,
        bonus: '0', bonusRemark: '',
        deductions: '0', deductionRemark: '',
        tax: '0',
        netSalary: data.record.amount
    };

    const base = safeParseFloat(breakdown.baseSalary);
    const bonus = safeParseFloat(breakdown.bonus);
    const tax = safeParseFloat(breakdown.tax);
    const deductions = safeParseFloat(breakdown.deductions);
    const net = safeParseFloat(breakdown.netSalary);

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-navy-900/80 backdrop-blur-sm">
            <div className="relative bg-white w-full max-w-lg rounded-lg shadow-2xl animate-fadeIn flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="bg-navy-900 text-white p-6 text-center relative shrink-0 rounded-t-lg overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-gold-500 rounded-full opacity-20"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-navy-900 mx-auto mb-3 shadow-lg">
                            <i className="fa-solid fa-graduation-cap text-xl"></i>
                        </div>
                        <h2 className="text-xl font-bold tracking-wider uppercase">Official Payslip</h2>
                        <p className="text-navy-200 text-xs">EduPortal School Management System</p>
                    </div>
                    <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
                        <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                {/* Body */}
                <div className="p-6 md:p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed overflow-y-auto">
                    <div className="flex justify-between items-center border-b border-dashed border-gray-300 pb-4 mb-4">
                        <div>
                            <span className="text-gray-500 text-[10px] uppercase font-bold block">Employee</span>
                            <span className="text-navy-900 font-bold text-sm">{data.teacher.title} {data.teacher.lastName} {data.teacher.firstName}</span>
                        </div>
                        <div className="text-right">
                            <span className="text-gray-500 text-[10px] uppercase font-bold block">Ref #</span>
                            <span className="text-navy-900 font-mono text-sm">{data.record.transactionRef}</span>
                        </div>
                    </div>

                    <div className="space-y-3 mb-6 bg-white p-4 rounded border border-gray-100 shadow-sm">
                         <div className="flex justify-between">
                            <span className="text-gray-500 text-sm font-medium">Month</span>
                            <span className="text-navy-900 font-bold">{data.record.month}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Staff ID</span>
                            <span className="text-navy-900 font-medium">{data.teacher.staffId}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500 text-sm">Payment Date</span>
                            <span className="text-navy-900 font-medium">{new Date(data.record.date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded border border-gray-100 space-y-3 mb-6">
                         <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Earnings & Deductions</h4>
                         <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Base Salary</span>
                            <span className="font-medium text-navy-900">₦{base.toLocaleString()}</span>
                        </div>
                        {(bonus > 0) && (
                            <div className="flex justify-between text-sm text-green-700 bg-green-50 p-2 rounded border border-green-100">
                                <div className="flex flex-col">
                                    <span className="font-bold flex items-center"><i className="fa-solid fa-plus mr-1"></i> Bonus</span>
                                    {breakdown.bonusRemark && <span className="text-xs text-green-600 italic">"{breakdown.bonusRemark}"</span>}
                                </div>
                                <span className="font-medium">₦{bonus.toLocaleString()}</span>
                            </div>
                        )}
                         {(tax > 0) && (
                            <div className="flex justify-between text-sm text-red-600">
                                <span><i className="fa-solid fa-minus mr-1"></i> Tax</span>
                                <span className="font-medium">- ₦{tax.toLocaleString()}</span>
                            </div>
                         )}
                         {(deductions > 0) && (
                            <div className="flex justify-between text-sm text-red-700 bg-red-50 p-2 rounded border border-red-100">
                                <div className="flex flex-col">
                                    <span className="font-bold flex items-center"><i className="fa-solid fa-minus mr-1"></i> Deductions</span>
                                    {breakdown.deductionRemark && <span className="text-xs text-red-600 italic">"{breakdown.deductionRemark}"</span>}
                                </div>
                                <span className="font-medium">- ₦{deductions.toLocaleString()}</span>
                            </div>
                        )}
                        <div className="border-t border-gray-200 my-2 pt-2">
                             <div className="flex justify-between items-center">
                                <span className="text-navy-900 font-bold uppercase text-sm">Net Pay</span>
                                <span className="text-2xl font-bold text-navy-900">₦{net.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                     <div className="text-center">
                        <span className="text-green-600 font-bold uppercase border-2 border-green-600 px-4 py-1 inline-block rounded transform -rotate-6 text-sm opacity-80">
                            PAID & VERIFIED
                        </span>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex gap-3 border-t border-gray-200 shrink-0 rounded-b-lg">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={() => window.print()}>
                        <i className="fa-solid fa-print mr-2"></i> Print Slip
                    </Button>
                </div>
            </div>
        </div>
    );
};

interface PayrollCalculatorProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    setData: (d: any) => void;
    onAuthorize: () => void;
}

export const PayrollCalculator: React.FC<PayrollCalculatorProps> = ({ isOpen, onClose, data, setData, onAuthorize }) => {
    const base = safeParseFloat(data.baseSalary);
    const bonus = safeParseFloat(data.bonus);
    const tax = safeParseFloat(data.tax);
    const ded = safeParseFloat(data.deductions);
    const net = base + bonus - tax - ded;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Payroll Calculator" icon="fa-solid fa-calculator">
            <div className="space-y-4">
                <div className="bg-navy-50 p-3 rounded-lg text-center border border-navy-100">
                    <p className="text-sm text-navy-600">Preparing Salary for: <span className="font-bold text-navy-900">{data.month}</span></p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Base Salary (Fixed)</label>
                        <div className="w-full p-2 bg-gray-100 border border-gray-300 rounded font-bold text-gray-600">
                            ₦{base.toLocaleString()}
                        </div>
                    </div>
                    
                     <div className="bg-green-50 p-3 rounded border border-green-100">
                        <label className="block text-xs font-bold text-green-700 uppercase mb-1">Add Bonus</label>
                        <input 
                            type="text" 
                            value={formatInputCurrency(data.bonus)} 
                            onChange={e => setData({...data, bonus: cleanCurrencyInput(e.target.value)})} 
                            className="w-full p-2 border border-green-200 rounded mb-2 text-right font-medium"
                            placeholder="₦0"
                        />
                        <input 
                            type="text"
                            value={data.bonusRemark}
                            onChange={e => setData({...data, bonusRemark: e.target.value})}
                            className="w-full p-2 border border-green-200 rounded text-xs"
                            placeholder="Remark (e.g. Performance)"
                        />
                    </div>

                     <div className="bg-red-50 p-3 rounded border border-red-100">
                        <label className="block text-xs font-bold text-red-700 uppercase mb-1">Deductions / Fines</label>
                         <input 
                            type="text" 
                            value={formatInputCurrency(data.deductions)} 
                            onChange={e => setData({...data, deductions: cleanCurrencyInput(e.target.value)})} 
                            className="w-full p-2 border border-red-200 rounded mb-2 text-right font-medium"
                            placeholder="₦0"
                        />
                         <input 
                            type="text"
                            value={data.deductionRemark}
                            onChange={e => setData({...data, deductionRemark: e.target.value})}
                            className="w-full p-2 border border-red-200 rounded text-xs"
                            placeholder="Remark (e.g. Lateness)"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tax Amount</label>
                        <input 
                            type="text" 
                            value={formatInputCurrency(data.tax)} 
                            onChange={e => setData({...data, tax: cleanCurrencyInput(e.target.value)})} 
                            className="w-full p-2 border border-gray-300 rounded text-right"
                            placeholder="₦0"
                        />
                    </div>
                </div>

                <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex justify-between items-center bg-navy-900 text-white p-4 rounded-lg shadow-md">
                        <span className="font-bold uppercase text-sm">Net Payable</span>
                        <span className="text-2xl font-bold">₦{net.toLocaleString()}</span>
                    </div>
                </div>

                <Button onClick={onAuthorize}>Authorize Payment</Button>
            </div>
        </Modal>
    );
};

interface BankDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: any;
    setData: (d: any) => void;
    onSave: () => void;
}

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({ isOpen, onClose, data, setData, onSave }) => (
    <Modal isOpen={isOpen} onClose={onClose} title="Update Bank Details" icon="fa-solid fa-building-columns">
         <div className="space-y-4">
            <Input label="Bank Name" value={data.bankName} onChange={e => setData({...data, bankName: e.target.value})} iconClass="fa-solid fa-building-columns" />
            <Input label="Account Number" value={data.accountNumber} onChange={e => setData({...data, accountNumber: e.target.value})} iconClass="fa-solid fa-hashtag" />
            <Input label="Account Name" value={data.accountName} onChange={e => setData({...data, accountName: e.target.value})} iconClass="fa-solid fa-signature" />
            <div className="pt-2">
                <Button onClick={onSave}>Save Changes</Button>
            </div>
        </div>
    </Modal>
);
