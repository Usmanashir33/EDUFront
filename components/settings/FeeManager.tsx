import { useContext } from 'react';
import { FadeIn, Modal, Button,} from '../UI';
import { uiContext } from '@/customContexts/UiContext';


const FeeManager = ({
    schoolFees,
    setEditingFeeId,
    setFeeAmount,
    setSelectedClasses,
    setIsFeeModalOpen,
    setClassSectionFilter,
    setFeeName,
    setIsDeleteModalOpen,
    setActionToValidate
}) => {
    const {isLoading,classRooms} = useContext(uiContext);
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
    };
    return ( 
        <div>
             <FadeIn>
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h3 className="font-bold text-navy-900 text-xl">School Fee Amount Settings</h3>
                                            <p className="text-sm text-gray-500">Manage expected fee amounts for specific classes.</p>
                                        </div>
                                        <Button
                                        disabled={isLoading}
                                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-navy-900 text-white rounded-lg hover:bg-navy-600 transition w-fit "
                                        onClick={() => {
                                            setEditingFeeId(null) ;
                                            setFeeAmount('') ;
                                            setSelectedClasses([]) ;
                                            setIsFeeModalOpen(true) ;
                                            }} variant = "primary"  
                                            >
                                            <i className='fa-solid fa-plus'></i>
                                            Add Fee Setting</Button>
                                    </div>
            
                                    {/* Configured Fees List */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Name</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Classes</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Created</th>
                                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Updated</th>
                                                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
                                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {schoolFees.length === 0 ? (
                                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No fee settings configured yet.</td></tr>
                                                ) : (
                                                    schoolFees.map(fs => {
                                                        let clss = classRooms.filter(c => fs?.class_rooms.includes(c.id))
                                                        return (
                                                        <tr key={fs.id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-4 text-md text-gray-500 font-bold ">{fs?.name}</td>
                                                            <td className="px-4 py-4 text-sm font-bold text-navy-900 flex flex-col gap-2">{
                                                                clss?.map(cid => (
                                                                <span key={cid.id} className='inline-block bg-gray-200 text-blue-800 text-xs font-semibold p-2 rounded-sm'>
                                                                    {cid?.name}
                                                                </span>))
                                                            }</td>
                                                            {/* insert date here  */}
                                                            <td className="px-4 py-4 text-sm text-gray-500">{fs.createdAt}</td>
                                                            <td className="px-4 py-4 text-sm text-gray-500">{fs.updatedAt}</td>
                                                            <td className="px-4 py-4 text-sm font-bold text-right text-green-600">{formatCurrency(fs.amount)}</td>
                                                            <td className="px-4 py-4 text-center flex space-x-2">
                                                                <button onClick={() => {
                                                                    setClassSectionFilter('ALL');
                                                                    setSelectedClasses(fs?.class_rooms);
                                                                    setEditingFeeId(fs.id);
                                                                    setFeeName(fs.name);    
                                                                    setFeeAmount(fs.amount.toString());
                                                                    setIsFeeModalOpen(true);
                                                                    }} className="text-navy-600 hover:text-navy-800 p-2"><i className="fa-solid fa-pen"></i>
                                                                </button>
                                                                <button onClick={() => {
                                                                    setActionToValidate({type: 'DELETE_FEE_SETTING', id: fs.id}); // i attach the id here so that when the user confirms deletion in the modal, we know which fee setting to delete
                                                                    setIsDeleteModalOpen(true);
                                                                    }} className="text-red-600 hover:text-red-800 p-2"><i className="fa-solid fa-trash"></i>
                                                                </button>
                                                            </td>
            
                                                        </tr>
                                                    )})
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </FadeIn>
        </div>
     );
}
 
export default FeeManager;