
import React, { useContext, useState } from 'react';
import { Pencil, Trash2, Star } from "lucide-react";
import { Input, Toggle ,Button, Modal,PinModal} from '../UI';
import { uiContext } from '@/customContexts/UiContext';
import FeeManager from './FeeManager';
import useRequest from '@/customHooks/RequestHook';
import { authContext } from '@/customContexts/AuthContext';

interface FinanceSettingsProps {
    data: any;
    saveData: (action: 'ADD' | 'EDIT'| 'DELETE'|"TOGGLE",formData?: any) => void;
    isFinanceFormOpen : boolean; 
    setIsFinanceFormOpen : any;
}

const  BankAccountsSection = ({ accounts, onEdit, onDelete ,onAdd}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 border border-gray-200">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Bank Accounts
        </h2>
        <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-navy-900 text-white rounded-lg hover:bg-navy-600 transition" onClick={() => {
          onAdd();
        }}>
          <i className="fa-solid fa-plus"></i>
          Add Account
        </button>
      </div>   

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts?.map((acc) => (
          <div
            key={acc.id}
            className="relative bg-gradient-to-br from-indigo-50 to-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
          >
            
            {/* Default badge */}
            {acc.is_default && (
              <span className="absolute top-3 right-3 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                <Star size={12} /> Default
              </span>
            )}

            {/* Active / Inactive */}
            <span
              className={`inline-block text-xs px-2 py-1 rounded-full mb-3 ${
                acc.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              {acc.is_active ? "Active" : "Inactive"}
            </span>

            {/* Bank Info */}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">
                {acc.bank_name}
              </h3>

              <p className="text-sm text-gray-600">
                {acc.account_name}
              </p>

              <p className="font-mono text-base text-indigo-600 tracking-wide">
                {acc.account_number}
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => onEdit(acc)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition"
              >
                <Pencil size={14} />
                Edit
              </button>

              <button
                onClick={() => onDelete(acc)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {accounts?.length === 0 && (
        <div className="text-center text-gray-500 py-10">
          No bank accounts added yet
        </div>
      )}
    </div>
  );
}

export const FinanceSettings: React.FC<FinanceSettingsProps> = ({ data,saveData ,isFinanceFormOpen, setIsFinanceFormOpen }) => {
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const [isDeleteBankModalOpen, setIsDeleteBankModalOpen] = React.useState(false);
    const {isLoading,schoolFees,selectedSchool,setToast,setSchoolFees,sections,classRooms} = useContext(uiContext) ;
    const {currentUser} = useContext(authContext) ;
    const [mode,setMode] = React.useState<'ADD' | 'EDIT'>('ADD'); // or 'EDIT'
    const [serverForm,setServerForm] = useState({});
    const [pinModalOpen, setPinModalOpen] = useState(false);
    
    

    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [editingFeeId, setEditingFeeId] = useState<string | null>(null);
    const [classSectionFilter, setClassSectionFilter] = useState<'ALL' | any >('ALL');
    const [feeAmount, setFeeAmount] = useState('');
    const [feeName, setFeeName] = useState('');
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
    const [actionToValidate, setActionToValidate] = useState<{type: 'APPROVE' | 'REJECT' | 'SUBMIT_PAYMENT' | 'SAVE_FEE_SETTING'| 'UPDATE_FEE_SETTING'|'DELETE_FEE_SETTING' | 'APPROVE_BULK' | 'REJECT_BULK', id: string} | null>(null);
    const {sendRequest} = useRequest()


    const [editingBank, setEditingBank] = React.useState({
        bank_name : '',
        account_number : '',
        account_name : '',
        is_default : false,
        is_active : false
    });
    const filteredClasses = classSectionFilter === 'ALL' ? classRooms.map(cls => cls.id) : classRooms.filter(c => c?.section == sections.find(sec => sec.name === classSectionFilter)?.id).map(cls => cls.id);
        const handleSettingsSave = (operation : "CREATE" | "EDIT") => {  
            let form = {
                school : selectedSchool?.id ,
                classIds: selectedClasses,
                amount: parseFloat(feeAmount),
                name: feeName
            }
            setServerForm(form);
            if (!currentUser?.user?.pin_set){
            // make the api call here to save the form data, then on success, open the pin modal. For now, we'll just simulate this with a timeout.
                if (operation === "EDIT"){
                    sendRequest(`/school_finance/school-fee-settings/update/${editingFeeId}/`,"PUT",form as any,TriggeredFunc,true,false) 
                } else{
                    sendRequest("/school_finance/school-fee-settings/create/","POST",form as any,TriggeredFunc,true,false) 
                }
                return 
            }
            if (operation === "EDIT"){
                setActionToValidate({ type: 'UPDATE_FEE_SETTING', id: 'FEE_SETTING' });
            } else{
                setActionToValidate({ type: 'SAVE_FEE_SETTING', id: 'FEE_SETTING' });
            }
            setPinModalOpen(true);
        }
    const handlePinsuccess = (pins: string) => {
            setPinModalOpen(false);
                if (actionToValidate?.type === 'SAVE_FEE_SETTING') {
                    let form = { ...serverForm, pin: pins }
                    setServerForm(form);
                    // make the api call here to save the fee setting using the serverForm data, then on success:
                    sendRequest("/school_finance/school-fee-settings/create/","POST",form as any,TriggeredFunc,true,false)
                    return 
                }
                if (actionToValidate?.type === 'UPDATE_FEE_SETTING') {
                    let form = { ...serverForm, pin: pins }
                    setServerForm(form);
                    // make the api call here to save the fee setting using the serverForm data, then on success:
                    sendRequest(`/school_finance/school-fee-settings/update/${editingFeeId}/`,"PUT",form as any,TriggeredFunc,true,false) 
                    return 
                }
                if (actionToValidate?.type === 'DELETE_FEE_SETTING') {
                    // Handle fee setting deletion
                    sendRequest(`/school_finance/school-fee-settings/delete/${selectedSchool?.id}/${actionToValidate?.id}/${pins}/`,"DELETE",null as any ,TriggeredFunc,true,false)
                    return 
                }
            setActionToValidate(null);
        }
    const TriggeredFunc = (resp) => {
        console.log('resp: ', resp);
        if (resp?.new_school_fees){
            setIsFeeModalOpen(false);
            setEditingFeeId(null);
            setSelectedClasses([]);
            setSchoolFees(prev => [...prev, resp.new_school_fees]);
            setToast({ type: 'success', message: resp?.success });
            return
        }
        if (resp?.updated_school_fees){
            setIsFeeModalOpen(false);
            setEditingFeeId(null);
            setSelectedClasses([]);
            setSchoolFees(prev => prev.map(fs => fs.id === resp.updated_school_fees.id ? resp.updated_school_fees : fs));
            setToast({ type: 'success', message: resp?.success });
            return
        }
        if (resp?.deleted_school_fees){
            setIsDeleteModalOpen(false);
            setEditingFeeId(null);
            setSchoolFees(prev => prev.filter(fs => fs.id !== resp.deleted_school_fees.id));
            setToast({ type: 'success', message: resp?.success });
            return
        }
        
    }
    const handleDeleteSetting = () => {
        let feeId = actionToValidate?.id || null
        if (!feeId || (actionToValidate?.type !== "DELETE_FEE_SETTING")) return;
        // check user pin 
        if (!currentUser?.user?.pin_set){
            sendRequest(`/school_finance/school-fee-settings/delete/${selectedSchool?.id}/${feeId}/""/`,"DELETE",null as any ,TriggeredFunc,true,false)
            return ;
        }
        // setPinModalOpen(true);
    }
    const handleAddNewBank = () => {
        setMode('ADD');
        setEditingBank({
            bank_name : '',
            account_number : '',
            account_name : '',
            is_default : false,
            is_active : false
    });
        setIsFinanceFormOpen(true);
    }
    const handleEditBank = (bank) => {
        setMode('EDIT');
        setEditingBank(bank);
        setIsFinanceFormOpen(true);
    }
    const handleDeleteBank = (bank) => {
        // Implement delete logic here
        setEditingBank(bank);
        setIsDeleteBankModalOpen(true);
    }
    return (
        <div className="space-y-6 animate-fadeIn ">
            <Modal isOpen={isFinanceFormOpen} onClose={() => setIsFinanceFormOpen(false)} title={mode === "EDIT" ? "Edit Bank Account" : "Add New Bank Account"} icon="fa-solid fa-building-columns">
                <div className="space-y-4">
                    <Input required placeholder="Enter bank name" label="Bank Name" value={editingBank.bank_name} onChange={e => setEditingBank({...editingBank, bank_name: e.target.value})} iconClass="fa-solid fa-building-columns" />
                    <Input required placeholder="Enter account number" label="Account Number" value={editingBank.account_number} onChange={e => setEditingBank({...editingBank, account_number: e.target.value})} iconClass="fa-solid fa-hashtag" />
                    <Input required placeholder="Enter account name" label="Account Name" value={editingBank.account_name} onChange={e => setEditingBank({...editingBank, account_name: e.target.value})} iconClass="fa-solid fa-signature" />
                    <Toggle label="Set as Default Account" checked={editingBank.is_default} onChange={v => setEditingBank({...editingBank, is_default: v})} />
                    <Toggle label="Active Account" checked={editingBank.is_active} onChange={v => setEditingBank({...editingBank, is_active: v})} />
                    <Button 
                        disabled={isLoading}
                        onClick={() => {
                            // Handle save logic here, e.g. call an API to update the account
                            if (!editingBank.bank_name.length || !editingBank.account_number.length || !editingBank.account_name.length) {
                                alert("Please fill in all fields");
                                return;
                            }
                            if (mode === 'ADD') {
                                saveData('ADD', editingBank);
                            } else if (mode === 'EDIT') {
                                saveData('EDIT', editingBank);
                            }
                            // setIsFinanceFormOpen(false);
                            return; 
                        }} 
                        className="w-full">
                        <i className="fa-solid fa-save mr-2"></i>{mode === 'ADD' ? 'Add Account' : 'Save Account Changes'}
                    </Button>
                </div>
            </Modal>
            {/* // Delete Confirmation Modal */}
            <Modal isOpen={isDeleteBankModalOpen} onClose={() => setIsDeleteBankModalOpen(false)} title={mode === "EDIT" ? "Edit Bank Account" : "Add New Bank Account"} icon="fa-solid fa-building-columns">
                    <div className="space-y-4">
                    {/* hedaet tp warn about deleting  */}
                    <div className="">
                        <h4 className="text-sm text-red-600 rounded-md  bg-red-100 font-bold p-3 flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            Warning: Deleting a bank account is irreversible. Ensure no pending transactions are linked to this account before proceeding.
                        </h4>
                    </div>
                        <div className="flex justify-end gap-4">
                            <Button 
                                onClick={() => {saveData('DELETE', editingBank); setIsDeleteBankModalOpen(false)}} 
                                className="w-50 bg-red-500 hover:bg-red-600 text-white mx-auto">
                                    <i className="fa-solid fa-save mr-2"></i>Delete Bank Account
                            </Button>
                            <Button 
                                onClick={() => {setIsDeleteBankModalOpen(false)}} 
                                className="w-50 bg-gray-300 hover:bg-gray-400 text-gray-800 mx-auto">
                                    <i className="fa-solid fa-save mr-2"></i>Cancel 
                            </Button>

                        </div>
                    </div>
            </Modal>

            <div className="border-b border-gray-100 pb-4">
                <h2 className="text-xl font-bold text-navy-900">Financial Settings</h2>
                <p className="text-sm text-gray-500">Configure currency, payments, and banking details.</p>
            </div>
            <BankAccountsSection 
                accounts={data?.bank_accounts}
                onEdit={acc => handleEditBank(acc)}
                onDelete={acc => handleDeleteBank(acc)} 
                onAdd={handleAddNewBank}
            />
            
            <FeeManager 
                schoolFees={schoolFees}
                setEditingFeeId={setEditingFeeId}
                setFeeAmount={setFeeAmount}
                setSelectedClasses={setSelectedClasses}
                setIsFeeModalOpen={setIsFeeModalOpen}
                setClassSectionFilter={setClassSectionFilter}
                setFeeName={setFeeName}
                setIsDeleteModalOpen={setIsDeleteModalOpen}
                setActionToValidate={setActionToValidate}
            />
            
            {/* // Delete Confirmation Modal */}
            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={"Delete Setting"} icon="fa-solid fa-trash">
                <div className="space-y-4">
                    {/* hedaet tp warn about deleting  */}
                    <div className="">
                        <h4 className="text-sm text-red-600 rounded-md  bg-red-100 font-bold p-3 flex items-center gap-2">
                            <i className="fa-solid fa-triangle-exclamation"></i>
                            Warning: Deleting a Fee Setting is irreversible. Ensure to set another setting for the respective classes affected to avoid Fee Calculation issues.
                        </h4>
                    </div>
                    <div className="flex justify-end gap-4">
                        <Button 
                            disabled = {isLoading}
                            onClick={() => {handleDeleteSetting()}} 
                            className="w-50 bg-red-500 hover:bg-red-600 text-white mx-auto">
                                <i className="fa-solid fa-save mr-2"></i>Delete Fee Setting
                        </Button>
                        <Button 
                            onClick={() => {setIsDeleteModalOpen(false)}} 
                            className="w-50 bg-gray-300 hover:bg-gray-400 text-gray-800 mx-auto">
                                <i className="fa-solid fa-save mr-2"></i>Cancel 
                        </Button>
                                
                    </div>
                </div>
            </Modal>
            {/* Fee Settings Modal */}
            <Modal isOpen={isFeeModalOpen} onClose={() => setIsFeeModalOpen(false)} title={editingFeeId ? "Edit Fee Setting" : "Add Fee Setting"} size="lg">
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Selection Name </label>
                        <input type="text" required maxLength={30} value={feeName} onChange={(e) => setFeeName(e.target.value)} placeholder="Name (e.g Special Fee)" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-navy-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Amount (NGN)</label>
                        <input type="number" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="e.g. 150000" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-navy-500" />
                    </div>
                    
                    {/* {!editingFeeId && ( */}
                    {(
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-bold text-gray-700">Select Classes</label>
                                <div className="flex gap-2">
                                    <select value={classSectionFilter || "ALL" } onChange={(e) => setClassSectionFilter(e.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1">
                                        <option value="ALL">All Sections</option>
                                        {sections.map(sec  => (
                                            <option key={sec.id} value={sec.name}>
                                                {sec.name}
                                            </option>
                                        ))}
                                    </select>
                                    <button onClick={() => {
                                        if (selectedClasses.length === filteredClasses.length) {
                                            setSelectedClasses([]); // Deselect all
                                        } else {
                                            setSelectedClasses(filteredClasses); // Select all filtered
                                        }
                                    }} className="text-xs font-bold text-navy-600 hover:text-navy-800">
                                       Select All
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {classRooms
                                    .filter(cls => classSectionFilter === 'ALL' || cls?.section === sections.find(sec => sec.name === classSectionFilter)?.id)
                                    .map(cls => (
                                    <label key={cls.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedClasses.includes(cls.id) ? 'bg-navy-50 border-navy-500 ring-1 ring-navy-500' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                                        <input type="checkbox" className="hidden" checked={selectedClasses.includes(cls.id)} onChange={(e) => {
                                            if (e.target.checked) setSelectedClasses([...selectedClasses, cls.id]);
                                            else setSelectedClasses(selectedClasses.filter(c => c !== cls.id));
                                        }} />
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${selectedClasses.includes(cls.id) ? 'bg-navy-900 border-navy-900' : 'border-gray-300'}`}>
                                            {selectedClasses.includes(cls.id) && <i className="fa-solid fa-check text-white text-xs"></i>}
                                        </div>
                                        <span className="font-bold text-gray-700">{cls.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="flex justify-end pt-4 border-t border-gray-100 gap-3">
                        <Button variant="secondary" onClick={() => setIsFeeModalOpen(false)}>Cancel</Button>
                        <Button
                            disabled = {isLoading}
                         onClick={() => {
                            if (!feeAmount || (!editingFeeId && selectedClasses.length === 0)) {
                                setToast({ type: 'error', message: 'Please enter amount and select at least one class.' });
                                return;
                            }
                            if (editingFeeId) {
                                handleSettingsSave("EDIT");
                            }
                            else {
                                handleSettingsSave("CREATE");
                            }
                            return ;
                            
                        }} className="bg-navy-900 text-white px-8">{editingFeeId?"Update Settings":"Save Settings"}</Button>
                    </div>
                </div>
            </Modal>
            
            
            
            <PinModal 
                isOpen={pinModalOpen} 
                onClose={() => { setPinModalOpen(false); setActionToValidate(null); }}
                onSuccess={(pins) => handlePinsuccess(pins)}
                title={`Enter your PIN to ${actionToValidate?.type.toLowerCase()}`}
            />
        </div>
    );
};