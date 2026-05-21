import React, { useState, useMemo,useContext,useEffect } from 'react';
import { Device } from '../types';
import { Button, Input, Toast, PinModal, Modal } from '../components/UI';
import useRequest from '@/customHooks/RequestHook';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import { liveContext } from '@/customContexts/LiveContext';

interface DeviceManagerProps {
  devices: Device[];
  onUpdateDevices: (devices: Device[]) => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  devices,
  onUpdateDevices,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Fingerprint Scanner' | 'Camera' | 'Other'>('All');
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'delete' | 'update' | 'save', device?: Device } | null>(null);
  const {selectedSchool,copyToClipboard} = React.useContext(uiContext);
  const {currentUser} = React.useContext(authContext);
  const {schoolSocketRef} = useContext(liveContext)
  const {sendRequest} = useRequest();

  // Form State
  const [formData, setFormData] = useState<Partial<Device>>({
    name: '',
    type: 'Fingerprint Scanner',
    purpose: 'Attendance',
    location: '',
    status: 'Active',
  });

  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            d.uniqueCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            d.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      const matchesType = typeFilter === 'All' || d.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [devices, searchQuery, statusFilter, typeFilter]);

  const stats = useMemo(() => {
    return {
      total: devices.length,
      active: devices.filter(d => d.status === 'Active').length,
      connected: devices.filter(d => d.connectivity === 'Connected').length,
      disconnected: devices.filter(d => d.connectivity === 'Disconnected').length,
    };
  }, [devices]);

  const TriggeredFunc = (resp) => {
    // console.log('resp: ', resp);
    setPendingAction(null);
    if (resp.allDeviceData){
      onUpdateDevices([...resp.allDeviceData]);

    }else if (resp?.createdDeviceData){
      setIsFormModalOpen(false);
      onUpdateDevices([resp?.createdDeviceData, ...devices]);
      setToast({ message: 'Device registered successfully!', type: 'success' });

    }else if (resp?.updatedDeviceData){
      setIsFormModalOpen(false);
      onUpdateDevices(devices.map(device => 
        device.id === resp?.updatedDeviceData?.id ? resp?.updatedDeviceData : device
      ));
      if (editingDevice) {
        setEditingDevice(resp?.updatedDeviceData)
        setToast({ message:resp?.success, type: 'success' });
      }

    }else if (resp?.deletedDeviceData){
      onUpdateDevices(devices.filter(device => device.id !== resp?.deletedDeviceData?.id));
      setToast({ message: resp?.success, type: 'success' });
    }
  }

  const handleOpenForm = (device?: Device) => {
    if (device) {
      setPendingAction({type: 'update', device});
      setEditingDevice(device);
      setFormData({ ...device });
    } else {
      setEditingDevice(null);
      setFormData({
        name: '',
        school: selectedSchool?.id, 
        type: 'Fingerprint Scanner',
        purpose: 'Attendance',
        location: '',
        status: 'Active',
      });
    }
    setIsFormModalOpen(true);
  };

  React.useEffect(() => {
      // fetch devices available  from server on component mount
      //  to ensure we have the latest data (especially after actions that modify identities)
      let url = `/a_d/fetch_device/${selectedSchool.id}/`
      sendRequest(url,"GET",null,TriggeredFunc,true)
    }, []);
  // handle websocket for devices connectivity 
  useEffect(() => {
      if (schoolSocketRef.current ) {
      schoolSocketRef.current.onmessage = async (e) => {
        let data = JSON.parse(e.data)
        if (data?.signalType === 'deviceConnectivity') {
          TriggeredFunc(data)
          return;
        }
      }
    }
    },[schoolSocketRef.current,devices])

  const handleSaveForm = () => {
    let url = '';
    let method = '';
    if (!formData.name || !formData.location) {
      setToast({ message: 'Name and Location are required.', type: 'error' });
      return;
    }
    if (editingDevice) {
      setPendingAction({ type: 'update', device: editingDevice });
        url = `/a_d/update_device/${selectedSchool.id}/${editingDevice.id}/` // update  url
        method = "PUT";
    }else{
        setPendingAction({ type: 'save' });
        url = `/a_d/create_device/${selectedSchool.id}/`
        method = "POST";
    }
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server \
      sendRequest(url,method,formData,TriggeredFunc,true,false) 
       return 
    }
    setIsPinModalOpen(true);
  };

  const handleDeleteClick = (device: Device) => {
    setPendingAction({ type: 'delete', device });
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server \
      let url = `/a_d/delete_device/${selectedSchool.id}/${device!.id}/${''}/` // delete url
      sendRequest(url,"DELETE",null,TriggeredFunc,true,false) 
       return 
    }
    setIsPinModalOpen(true);
  };

  const handleToggleStatusClick = (device: Device, newStatus: string) => {
    setPendingAction({ type: 'update', device });
    formData.status = newStatus;
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server \
      let url = `/a_d/update_device/${selectedSchool.id}/${device?.id}/` // update  url
      sendRequest(url,"PUT",formData,TriggeredFunc,true,false)
       return 
    }
    setIsPinModalOpen(true);
  };
  const handlePinSuccess = (pins) => {
    formData.pin = pins;
    if (!pendingAction) return;
    
    if (pendingAction.type === 'update') {
      let url = `/a_d/update_device/${selectedSchool.id}/${pendingAction.device?.id}/` // update  url
      sendRequest(url,"PUT",formData,TriggeredFunc,true,false)
      
    } else if (pendingAction?.type === 'delete') {
      let url = `/a_d/delete_device/${selectedSchool.id}/${pendingAction.device?.id}/${pins}/` // delete url
      sendRequest(url,"DELETE",null,TriggeredFunc,true,false)
      
    } else if (pendingAction?.type === 'save') {
      let url = `/a_d/create_device/${selectedSchool.id}/`
      sendRequest(url,"POST",formData,TriggeredFunc,true,false)
    }
    setIsPinModalOpen(false);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'Fingerprint Scanner': return 'fa-fingerprint';
      case 'Camera': return 'fa-camera';
      default: return 'fa-microchip';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">Device Management</h2>
          <p className="text-gray-500 text-sm mt-1">Configure and monitor school attendance devices</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="flex items-center gap-2 w-fit">
          <i className="fa-solid fa-plus"></i> Add Device
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <i className="fa-solid fa-server text-xl"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Total Devices</p>
            <p className="text-2xl font-bold text-navy-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
            <i className="fa-solid fa-power-off text-xl"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Active</p>
            <p className="text-2xl font-bold text-navy-900">{stats.active}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <i className="fa-solid fa-wifi text-xl"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Connected</p>
            <p className="text-2xl font-bold text-navy-900">{stats.connected}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
            <i className="fa-solid fa-link-slash text-xl"></i>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase">Disconnected</p>
            <p className="text-2xl font-bold text-navy-900">{stats.disconnected}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:w-80">
          <i className="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
          <input 
            type="text" 
            placeholder="Search devices by name, code, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
          />
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <select 
            title ='Filter by device type'
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="w-full sm:w-48 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
          >
            <option value="All">All Types</option>
            <option value="Fingerprint Scanner">Fingerprint Scanners</option>
            <option value="Camera">Cameras</option>
            <option value="Other">Other</option>
          </select>
          <select 
            title='Filter by device status'
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full sm:w-40 p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-navy-500 outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevices.length === 0 ? (
          <div className="col-span-full bg-white p-12 rounded-xl border border-gray-100 text-center">
            <div className="w-16 h-16 mx-auto bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-4">
              <i className="fa-solid fa-microchip text-2xl"></i>
            </div>
            <h3 className="text-lg font-bold text-navy-900 mb-1">No Devices Found</h3>
            <p className="text-gray-500">Try adjusting your search or filters, or add a new device.</p>
          </div>
        ) : (
          filteredDevices.map(device => (
            <div key={device.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      device.type === 'Fingerprint Scanner' ? 'bg-indigo-50 text-indigo-600' :
                      device.type === 'Camera' ? 'bg-sky-50 text-sky-600' : 'bg-gray-50 text-gray-600'
                    }`}>
                      <i className={`fa-solid ${getDeviceIcon(device.type)}`}></i>
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-900 leading-tight">{device.name}</h3>
                      <p className="text-xs text-gray-500">{device.type}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      device.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {device.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500"><i className="fa-solid fa-location-dot w-4"></i> Location</span>
                    <span className="font-medium text-navy-900">{device.location}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500"><i className="fa-solid fa-key w-4"></i> Token Code</span>
                    <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700">{device.uniqueCode.substring(0, 8)}...</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500"><i className="fa-solid fa-signal w-4"></i> Network</span>
                    <div className="flex items-center gap-1.5">
                      {device.connectivity === 'Connected' ? (
                        <>
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                          </span>
                          <span className="text-emerald-600 font-medium text-xs">Connected</span>
                        </>
                      ) : (
                        <>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                          <span className="text-red-600 font-medium text-xs">Offline</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 p-3 flex justify-between items-center">
                <button 
                  onClick={() => { setSelectedDevice(device); setIsDetailsModalOpen(true); }}
                  className="text-sm font-medium text-navy-600 hover:text-navy-800 px-2 py-1"
                >
                  View Details
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleToggleStatusClick(device,device.status === 'Active' ? 'Inactive' : 'Active')}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                      device.status === 'Active' ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                    title={device.status === 'Active' ? 'Deactivate' : 'Activate'}
                  >
                    <i className={`fa-solid ${device.status === 'Active' ? 'fa-pause' : 'fa-play'}`}></i>
                  </button>
                  <button 
                    onClick={() => handleOpenForm(device)}
                    className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-colors"
                    title="Edit Device"
                  >
                    <i className="fa-solid fa-pen"></i>
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(device)}
                    className="w-8 h-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-colors"
                    title="Delete Device"
                  >
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingDevice ? "Edit Device" : "Add New Device"} icon="fa-solid fa-microchip">
        <div className="space-y-4">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-3 items-start mb-4">
            <i className="fa-solid fa-circle-info mt-0.5"></i>
            <p>
              {editingDevice 
                ? "Update the configuration for this device. Changes require authorization." 
                : "Register a new device. A unique secure token will be generated automatically upon creation."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Name *</label>
              <Input 
              autoFocus
                value={formData.name || ''} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g., Main Entrance Scanner"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Device Type *</label>
              <select 
              title='Select device type'
                value={formData.type || 'Fingerprint Scanner'} 
                onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
              >
                <option value="Fingerprint Scanner">Fingerprint Scanner</option>
                <option value="Camera">Camera</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purpose *</label>
              <select 
                title='Select device purpose'
                value={formData.purpose || 'Attendance'} 
                onChange={(e) => setFormData({...formData, purpose: e.target.value as any})}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
              >
                <option value="Attendance">Attendance</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
              <Input  
              
                value={formData.location || ''} 
                onChange={(e) => setFormData({...formData, location: e.target.value})} 
                placeholder="e.g., Block A Entrance"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Initial Status</label>
              <select 
                title='Select initial device status'
                value={formData.status || 'Active'} 
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-navy-500 focus:border-navy-500 sm:text-sm"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveForm} className="flex items-center gap-2">
              <i className="fa-solid fa-shield-halved"></i> Save & Authorize
            </Button>
          </div>
        </div>
      </Modal>

      {/* Details Modal */}
      {selectedDevice && (
        <Modal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} title="Device Details" icon="fa-solid fa-circle-info">
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm ${
                selectedDevice.type === 'Fingerprint Scanner' ? 'bg-indigo-100 text-indigo-600' :
                selectedDevice.type === 'Camera' ? 'bg-sky-100 text-sky-600' : 'bg-gray-200 text-gray-600'
              }`}>
                <i className={`fa-solid ${getDeviceIcon(selectedDevice.type)}`}></i>
              </div>
              <div>
                <h3 className="text-xl font-bold text-navy-900">{selectedDevice.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    selectedDevice.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {selectedDevice.status}
                  </span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{selectedDevice.type}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Location</p>
                <p className="font-medium text-navy-900">{selectedDevice.location}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Purpose</p>
                <p className="font-medium text-navy-900">{selectedDevice.purpose}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm col-span-2">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Connection Status</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {selectedDevice.connectivity === 'Connected' ? (
                      <>
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        <span className="text-emerald-700 font-bold">Online & Connected</span>
                      </>
                    ) : (
                      <>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        <span className="text-red-700 font-bold">Offline / Disconnected</span>
                      </>
                    )}
                  </div>
                  {selectedDevice.lastSeen && (
                    <span className="text-xs text-gray-500">Last seen: {new Date(selectedDevice.lastSeen).toLocaleString()}</span>
                  )}
                </div>
              </div>
              
              <div className="bg-navy-900 p-4 rounded-xl shadow-sm col-span-2 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <i className="fa-solid fa-key text-6xl"></i>
                </div>
                <p className="text-xs font-bold text-navy-300 uppercase mb-2">Authentication Token (Unique Code)</p>
                <div className="flex items-center justify-between bg-navy-950 p-3 rounded-lg border border-navy-800 relative">
                  <code className="font-mono text-sm text-green-400 select-all">
                    {selectedDevice.uniqueCode}
                  </code>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(selectedDevice.uniqueCode);
                        setToast({ message: 'Token copied to clipboard', type: 'success' });
                      } catch (err) {
                        setToast({ message: 'Copy failed', type: 'error' });
                      }
                    }}
                    className="relative z-10 cursor-pointer text-navy-200 hover:text-white transition-colors"
                    title="Copy to clipboard"
                  >
                    <i className="fa-regular fa-copy pointer-events-none"></i>
                  </button>
                </div>
                <p className="text-[10px] text-navy-400 mt-2">
                  <i className="fa-solid fa-triangle-exclamation text-yellow-500 mr-1"></i>
                  Keep this token secure. It is used by the device to authenticate with the server.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setIsDetailsModalOpen(false)}>Close</Button>
            </div>
          </div>
        </Modal>
      )}

      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        title="Authorize Action"
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
