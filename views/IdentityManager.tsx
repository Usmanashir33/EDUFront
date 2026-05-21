
import React, { useState, useRef, useEffect } from 'react';
import { Student, Teacher, Staff, BiometricIdentity, Director } from '../types';
import { Button, Modal, Toast, PinModal } from '../components/UI';
import { uiContext } from '@/customContexts/UiContext';
import { authContext } from '@/customContexts/AuthContext';
import useRequest from '@/customHooks/RequestHook';
import urls from '@/customHooks/ServerUrls';

interface IdentityManagerProps {
  students: Student[];
  teachers: Teacher[];
  staff: Staff[];
  identities: BiometricIdentity[];
  onUpdateIdentities: (identities: BiometricIdentity[]) => void;
}

export const IdentityManager: React.FC<IdentityManagerProps> = ({ students, teachers, staff,identities, onUpdateIdentities }) => {
  
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; type: 'teacher' | 'staff' | 'student' | 'director' } | null>(null);
  const [enrollStep, setEnrollStep] = useState<'SELECT' | 'PHOTO' | 'FACE' | 'FINGERPRINT' | 'REVIEW'>('SELECT');
  const [userTypeFilter, setUserTypeFilter] = useState<'ALL' | 'TEACHER' | 'STAFF' | 'STUDENT' | 'DIRECTOR'>('ALL');
  
  // Enrollment data
  const [livePhoto, setLivePhoto] = useState<string | null>(null);
  const [faceFrames, setFaceFrames] = useState<string[]>([]);
  const [isCapturingFace, setIsCapturingFace] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [faceInstruction, setFaceInstruction] = useState('Position your face in the oval');
  
  const [isFaceAligned, setIsFaceAligned] = useState(false);
  const [isDetectingFace, setIsDetectingFace] = useState(false); 
  
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingIdentity, setViewingIdentity] = useState<BiometricIdentity | null>(null);

  // PIN Security
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState<{ type: 'DELETE' | 'CREATE' | "UPDATE"; id: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null) // canvas to draw face bounding box overlay;
  const streamRef = useRef<MediaStream | null>(null);
  const [cameras, setCameras] = useState([]);
  const wsRef = useRef(null);
  const [fingerData, setFingerData] = useState(null);
  let [selectedCamera, setSelectedCamera] = useState("");
   const {
          // students,setStudents, // students data
          // teachers, setTeachers ,// teachers data
          // staffs:staff, setStaff, // staff data
          selectedSchool,
      } = React.useContext(uiContext)
  const {currentUser,getToken} = React.useContext(authContext);
  const {sendRequest} = useRequest()

  // Combine all users for selection
  // 🔧 Only showing modified parts (so you can easily replace)

const allStudents = [...students?.map(t => ({id: t.user?.id,uniqueId: t.admission_number,name: `${t?.first_name} ${t?.last_name}`,type: t?.role?.toLowerCase() || 'student'}))]
const allTeachers = [...teachers?.map(t => ({id: t.user?.id,uniqueId: t.staff_id,name: `${t?.first_name} ${t?.last_name}`,type: t?.role?.toLowerCase() || 'teacher'}))]
const allStaff = [...staff?.map(t => ({id: t.user?.id,uniqueId: t.staff_id,name: `${t?.first_name} ${t?.last_name}`,type: t?.role?.toLowerCase() || 'staff'}))]
const [serverForm,setServerForm] = useState(new FormData())
const allUsers = [allStudents,allTeachers,allStaff].flat();
  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         u.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = userTypeFilter === 'ALL' || u.type.toUpperCase() === userTypeFilter;
    return matchesSearch && matchesType;
  });

  const TriggeredFunc = (resp) => {
    // console.log('resp: ', resp);
    setPinAction(null);
    if (resp.allBioData){
      onUpdateIdentities([...resp.allBioData]);

    }else if (resp?.createdBioData){
      onUpdateIdentities([resp?.createdBioData, ...identities]);
      setToast({ message: 'Identity registered successfully!', type: 'success' });
      resetEnrollment();

    }else if (resp?.updatedBioData){
      onUpdateIdentities(identities.map(ident => 
        ident.id === resp?.updatedBioData?.id ? resp?.updatedBioData : ident
      ));
      if (viewingIdentity) {setViewingIdentity(resp?.updatedBioData)}
      setToast({ message:resp?.success, type: 'success' });

    }else if (resp?.deletedBioData){
      onUpdateIdentities(identities.filter(ident => ident.id !== resp?.deletedBioData?.id));
      setToast({ message: resp?.success, type: 'success' });
    }
  }



  const drawBoundingBox = (box: {x: number, y: number, w: number, h: number}) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#04af43'; // green-500
    ctx.lineWidth = 4;
    ctx.strokeRect(box.x, box.y, box.w, box.h);
    
    // Draw corners
    ctx.fillStyle = '#22c55e';
    const cornerSize = 10;
    // Top Left
    ctx.fillRect(box.x - 2, box.y - 2, cornerSize, 4);
    ctx.fillRect(box.x - 2, box.y - 2, 4, cornerSize);
    // Top Right
    ctx.fillRect(box.x + box.w - cornerSize + 2, box.y - 2, cornerSize, 4);
    ctx.fillRect(box.x + box.w - 2, box.y - 2, 4, cornerSize);
    // Bottom Left
    ctx.fillRect(box.x - 2, box.y + box.h - 2, cornerSize, 4);
    ctx.fillRect(box.x - 2, box.y + box.h - cornerSize + 2, 4, cornerSize);
    // Bottom Right
    ctx.fillRect(box.x + box.w - cornerSize + 2, box.y + box.h - 2, cornerSize, 4);
    ctx.fillRect(box.x + box.w - 2, box.y + box.h - cornerSize + 2, 4, cornerSize);
  };

  const clearBoundingBox = () => {
      const canvas = overlayCanvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleWebSocketResp =   (resp:any ) => {
    const data = JSON.parse(resp.data);
    if (data.type === "fingerprint_detection" && enrollStep === 'FINGERPRINT'){
      

    }
    console.log('data: ', data);
  }

  const connectSecket = async () => {
          // Initialize the WebSocket connection and assign it to webSocketRef.current
          const token = await getToken()
          if (token) {
            
              // wsRef.current = new WebSocket(`${urls.WS_URL}/face_detection/?token=${token}`,);
              wsRef.current = new WebSocket(`ws://127.0.0.1:8001/device_socket/c1d544ad-5ea2-42bc-ba86-1131fe9a6b0a/920ee449-63ef-4f65-aa4a-9f6bdfb8d9aa/`,);
              wsRef.current.binaryType = 'arraybuffer'; // to handle media data as binary array
      
              wsRef.current.onopen = () => {
                console.log('Face Detection WebSocket connection opened');
              //   readUnreads();
              };
      
              wsRef.current.onclose = () => {
                console.log('Face Detection WebSocket connection closed');
              };
      
              wsRef.current.onerror = (error) => { 
                console.log(`Face Detection WebSocket error:${error.message}`);
              };

              wsRef.current.onmessage = (event) => {
                handleWebSocketResp(event) 
    };
          }
      }
  useEffect(() => {
    connectSecket() // connect to websocket 
          // when the file demounted 
          return () => {
              if (wsRef.current) {
                  wsRef.current.close();
              }}
  },[]); // Empty dependency array means this effect runs only once
  
  const selectCameras = async () => { // grab connected cameras to allow user to select if multiple are available (like front/back on phones)
    const devices = await navigator.mediaDevices.enumerateDevices();

    const videoDevices = devices.filter(
      device => device.kind === "videoinput" 
    );
    setCameras(videoDevices);
    let readyCam = videoDevices.length > 1 ? videoDevices[1].deviceId : videoDevices[0].deviceId; // select the first external camera by default (usually the one facing the user), if only one is available
    setSelectedCamera(readyCam);
    selectedCamera = readyCam ;
    return selectedCamera ;
  };

  const startCamera = async () => {
    try {
      const cam = await selectCameras() ;
      if (!cam) throw new Error("No camera found");
      const stream = await navigator.mediaDevices.getUserMedia({ video: {
        deviceId: selectedCamera ? { exact: selectedCamera } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 } 
      } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      
    } catch {
      setToast({ message: 'Could not access camera', type: 'error' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleCamera = async () => {
    stopCamera();
    let another = cameras.find(cam => cam.deviceId !== selectedCamera);
    if (another) {
      setSelectedCamera(another.deviceId);
      const stream = await navigator.mediaDevices.getUserMedia({ video: {
        deviceId: another ? { exact: another.deviceId } : undefined,
        width: { ideal: 1280 },
        height: { ideal: 720 } 
      } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    }
  }
 
useEffect(() => {
  const handleDeviceChange = async () => {
    if (enrollStep === 'PHOTO' || enrollStep === 'FACE') {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(d => d.kind === "videoinput");
      setCameras(videoDevices);
      stopCamera(); // stop current stream to reset with new device list
      startCamera(); // restart camera to apply any changes (like new camera added or removed)
    }
  }
  navigator.mediaDevices.addEventListener(
    "devicechange",
    handleDeviceChange
  );
  
  return () => {
    navigator.mediaDevices.removeEventListener(
      "devicechange",
      handleDeviceChange
    );
  };
}, [selectedCamera]);

  useEffect(() => {
    if (enrollStep === 'PHOTO' || enrollStep === 'FACE') {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [enrollStep]);

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        let dataUrl = canvas.toDataURL('image/jpeg');
        setLivePhoto(dataUrl);
        setEnrollStep('FACE');


      //   Mock calling face detection engine 
        canvas.toBlob((blob) => {
          if ( blob && wsRef.current.readyState  === WebSocket.OPEN) { wsRef.current.send(blob) } 
        }, "image/jpeg", 0.7);

      }

    }
  };
  const startFaceDetection = () => {
    setIsDetectingFace(true);
    setFaceInstruction('Aligning face...');
    setTimeout(() => {
      setIsDetectingFace(false);
      setIsFaceAligned(true);
      setFaceInstruction('Face Detected! Ready to scan.');
      
    }, 1000);
  };
  const waitForFaceResponse = () => {
    return new Promise((resolve) => {
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        resolve(data);
      };
    });
};
  const captureFaceSequence = async () => {
    if (!isFaceAligned) return;
    setIsCapturingFace(true);
    const instructions = [
      'Look Straight',
      'Turn Head Left',
      'Turn Head Right',
      'Look Up Slightly',
      'Look Down Slightly'
    ];
    let faceFrameCount = 0 
    let faceFramesData = []
    while (faceFrameCount < 5 ) {
      setFaceInstruction(instructions[faceFrameCount ]);
      setCaptureProgress((faceFrameCount  + 1) * 20);
      
      // Wait for user to adjust
      await new Promise(resolve => setTimeout(resolve, 1600));

      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 480     ;
        canvas.height = 480    ;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Crop to square center for better face focus
          const vWidth = videoRef.current.videoWidth;
          const vHeight = videoRef.current.videoHeight;
          const size = Math.min(vWidth, vHeight);
          const x = (vWidth - size)  /   2;
          const y = (vHeight - size) /  2;
          ctx.translate(canvas.width,     0);
          ctx.scale(-1, 1);
          ctx.drawImage(videoRef.current, x, y, size, size, 0, 0, 480, 480);
          
          // Start sending frames to WebSocket for face detection 
          canvas.toBlob((blob) => {
              if (blob && wsRef.current.readyState === WebSocket.OPEN) {wsRef.current.send(blob)} 
            }, "image/jpeg", 0.7);
        }

        let data: any = await waitForFaceResponse() // wait for face detection response from backend before allowing next capture to ensure we only capture valid face frames for enrollment
        if (data.type === "face_detection"){
          let box = data.face_data?.facial_area
          if (data.detected && box) {
              faceFrameCount ++   
              faceFramesData.push(canvas.toDataURL('image/jpeg', 0.7));
              drawBoundingBox(box);
          } else {
            setFaceInstruction('Face not detected. Try again.');
            clearBoundingBox();
          }
    }
      }
    }
    if (faceFramesData.length > 3 ) { // ensure we have at least 3 valid face frames before proceeding to enrollment, to improve accuracy) {
      setIsCapturingFace(false);
      setFaceInstruction('Scan Complete');
      setFaceFrames(faceFramesData);
      clearBoundingBox();
      setTimeout(() => setEnrollStep('FINGERPRINT'), 800);
    }
  };

  const handleSaveIdentity = () => {
    if (!selectedUser) return;
    let form = new FormData()
    form.append("school",selectedSchool?.id)
    form.append("userId",selectedUser.id)
    form.append("userType",selectedUser.type)
    form.append("status",'Active') 
    
    form.append("livePhoto",livePhoto)
    form.append("faceRegistered",`${faceFrames.length > 0}`)
    form.append("faceData", JSON.stringify(faceFrames));

    form.append("fingerprintRegistered",'false')
    form.append("fingerprintId",`FP-${Math.random().toString(36).substr(2, 9)}`)
    setServerForm(form);
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server  
      sendRequest(`/a_d/create_ident/${selectedSchool.id}/`,"POST",serverForm,TriggeredFunc,true,true)
      return 
    }
    setPinAction({type:"CREATE",id:null})
    setIsPinModalOpen(true) ;
    return ;
  };

  const resetEnrollment = () => {
    setIsEnrollModalOpen(false);
    setSelectedUser(null);
    setEnrollStep('SELECT');
    setLivePhoto(null);
    setFaceFrames([]);
    setCaptureProgress(0);
    setFaceInstruction('Position your face in the oval');
    setIsFaceAligned(false);
    setIsDetectingFace(false);
    stopCamera();
    setIsCapturingFace(false);
    setIsDetectingFace(false);
    setFingerData(null);
    setSelectedCamera('');
  };

  const handlePinSuccess = (pins) => {
    serverForm.append('pin', pins);
    if (!pinAction) return;
    
    if (pinAction.type === 'UPDATE') {
      let url = `/a_d/update_ident/${selectedSchool.id}/${pinAction?.id}/` // update  url
      sendRequest(url,"PUT",serverForm,TriggeredFunc,true,true)
      
    } else if (pinAction.type === 'DELETE') {
      let url = `/a_d/delete_ident/${selectedSchool.id}/${pinAction?.id}/${pins}/` // delete url
      sendRequest(url,"DELETE",null,TriggeredFunc,true,false)
      
    } else if (pinAction.type === 'CREATE') {
      let url = `/a_d/create_ident/${selectedSchool.id}/`
      sendRequest(url,"POST",serverForm,TriggeredFunc,true,true)
    }
    setIsPinModalOpen(false);
  };

  useEffect(() => {
    // fetch identities from server on component mount
    //  to ensure we have the latest data (especially after actions that modify identities)
    let url = `/a_d/fetch_ident/${selectedSchool.id}/`
    sendRequest(url,"GET",null,TriggeredFunc,true,!false)
  }, []);

  const handleAction = (id: string,type: 'UPDATE'| "DELETE",action?:any) => {
    setPinAction({ type, id });
    let pin =''
    let url = `/a_d/delete_ident/${selectedSchool.id}/${id}/${pin}/` // delete url
    
    // setServerForm(null) // for delete action 

    if (type === "UPDATE"){
      let form = new FormData()
      form.append(action.field,action.value)
      form.append('school',selectedSchool?.id)
      setServerForm(form) // for update fields 
      url = `/a_d/update_ident/${selectedSchool.id}/${id}/` // update  url

    }
    if (!currentUser?.user?.pin_set){
      // Make the api call here  when user  need no pin to talk to server \
      let methode = type === "UPDATE"? "PUT" :"DELETE"
      sendRequest(url,methode,serverForm,TriggeredFunc,true,true) 
       return 
    }
    setIsPinModalOpen(true);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-navy-900 tracking-tight">Identity Hub</h2>
          <p className="text-gray-500 mt-1">Manage biometric enrollment and facial recognition data.</p>
        </div>
        <Button 
          onClick={() => setIsEnrollModalOpen(true)}
          className="w-full md:w-auto bg-navy-900 text-white hover:bg-navy-800 flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all"
        >
          <i className="fa-solid fa-user-plus"></i>
          Enroll New Identity
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-id-card"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Registered</p>
              <h3 className="text-2xl font-bold text-navy-900">{identities.length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-face-smile"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Face Enrolled</p>
              <h3 className="text-2xl font-bold text-navy-900">{identities.filter(i => i.faceRegistered).length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-fingerprint"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fingerprint Enrolled</p>
              <h3 className="text-2xl font-bold text-navy-900">{identities.filter(i => i.fingerprintRegistered).length}</h3>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center text-xl">
              <i className="fa-solid fa-circle-check"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Identities</p>
              <h3 className="text-2xl font-bold text-navy-900">{identities.filter(i => i.status === 'Active').length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Identity List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-navy-900 text-lg">Registered Identities</h3>
          <div className="relative w-full md:w-72">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            <input 
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="p-4 font-semibold text-gray-600 text-sm">User</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Type</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Biometrics</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-sm">Last Updated</th>
                <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {identities?.filter(i => i.userName.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <i className="fa-solid fa-id-card-clip text-5xl mb-4 opacity-20"></i>
                      <p className="text-lg font-medium">No identities registered yet</p>
                      <p className="text-sm">Start by enrolling a user's biometric data.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                identities
                  .filter(i => i.userName.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(ident => (
                  <tr key={ident.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy-100 overflow-hidden border border-navy-200 flex items-center justify-center">
                          {ident.livePhoto ? (
                            <img src={urls.BASE_URL + ident.livePhoto} alt={ident.userName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-navy-600 font-bold">{ident.userName.charAt(0)}</span>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-navy-900">{ident.userName}</p>
                          <p className="text-xs text-gray-500">{ident.uniqueId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {ident.userType}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {ident.faceRegistered && (
                          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center" title="Face Registered">
                            <i className="fa-solid fa-face-smile text-xs"></i>
                          </div>
                        )}
                        {ident.fingerprintRegistered && (
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center" title="Fingerprint Registered">
                            <i className="fa-solid fa-fingerprint text-xs"></i>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        ident.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {ident.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {new Date(ident.lastUpdated).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setViewingIdentity(ident)}
                          className="p-2 text-navy-600 hover:bg-navy-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <i className="fa-solid fa-eye"></i>
                        </button>
                        <button 
                          onClick={() => handleAction(ident.id,"UPDATE",{field:"status",value:ident.status === 'Active'? "Inactive":"Active"})}
                          className={`p-2 rounded-lg transition-colors ${
                            ident.status === 'Active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={ident.status === 'Active' ? 'Deactivate' : 'Activate'}
                        >
                          <i className={`fa-solid ${ident.status === 'Active' ? 'fa-circle-pause' : 'fa-circle-play'}`}></i>
                        </button>
                        <button 
                          onClick={() => handleAction(ident.id,"DELETE")}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Identity"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment Modal */}
      <Modal 
        isOpen={isEnrollModalOpen} 
        onClose={resetEnrollment} 
        title="Biometric Enrollment" 
        icon="fa-solid fa-fingerprint"
      >
        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 sm:gap-4 mb-4">
            {['SELECT', 'PHOTO', 'FACE', 'FINGERPRINT', 'REVIEW'].map((step, i) => {
              const steps = ['SELECT', 'PHOTO', 'FACE', 'FINGERPRINT', 'REVIEW'];
              const currentIndex = steps.indexOf(enrollStep);
              const isCompleted = i < currentIndex;
              const isActive = i === currentIndex;
              
              return (
                <React.Fragment key={step}>
                  <div className={`flex flex-col items-center gap-1`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isCompleted ? 'bg-green-500 text-white' : 
                      isActive ? 'bg-navy-900 text-white ring-4 ring-navy-100' : 
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {isCompleted ? <i className="fa-solid fa-check"></i> : i + 1}
                    </div>
                  </div>
                  {i < 4 && <div className={`flex-1 h-1 rounded-full ${i < currentIndex ? 'bg-green-500' : 'bg-gray-100'}`}></div>}
                </React.Fragment>
              );
            })}
          </div>

          {/* Step 1: Select User */}
          {enrollStep === 'SELECT' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-navy-900">Select User</h4>
                <p className="text-gray-500">Choose the person you want to enroll.</p>
              </div>

              {/* User Type Tabs */}
              <div className="flex p-1 bg-gray-100 rounded-xl mb-4 overflow-x-auto custom-scrollbar">
                {['ALL', 'DIRECTOR', 'TEACHER', 'STAFF', 'STUDENT'].map(type => (
                  <button
                    key={type}
                    onClick={() => setUserTypeFilter(type as any)}
                    className={`flex-1 min-w-[80px] py-2 text-[10px] font-bold rounded-lg transition-all ${
                      userTypeFilter === type 
                        ? 'bg-white text-navy-900 shadow-sm' 
                        : 'text-gray-500 hover:text-navy-700'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input 
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy-500/20 focus:border-navy-500 transition-all"
                />
              </div>
              <div className="max-h-64 overflow-y-auto custom-scrollbar border border-gray-100 rounded-xl divide-y divide-gray-50">
                {filteredUsers.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">No users found in this category.</div>
                ) : (
                  filteredUsers.map(user => (
                    <button 
                      key={`${user.type}-${user.id}`}
                      onClick={() => { setSelectedUser(user); setEnrollStep('PHOTO'); }}
                      className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-600 font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-navy-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.uniqueId}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        {user.type}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Step 2: Live Photo */}
          {enrollStep === 'PHOTO' && (
            <div className="space-y-4 animate-fadeIn text-center">
              <div className="mb-2">
                <h4 className="text-lg sm:text-xl font-bold text-navy-900">Live Profile Picture</h4>
                <p className="text-xs sm:text-sm text-gray-500">Capture a clear photo of {selectedUser?.name}.</p>
              </div>
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto bg-black rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
                {cameras.length > 1 && (
                  <button
                    onClick={toggleCamera}
                    className="absolute top-2 right-2 bg-white text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-black-500 transition-colors z-10 flex items-center gap-1"
                  >
                    🔄 Switch
                  </button>
                )}
                <div className="absolute inset-0 border-[30px] sm:border-[40px] border-black/40 pointer-events-none">
                  <div className="w-full h-full border-2 border-white/50 rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setEnrollStep('SELECT')}>Back</Button>
                <Button onClick={capturePhoto} className="bg-navy-900 text-white px-8">Capture Photo</Button>
              </div>
            </div>
          )}

          {/* Step 3: Face Recognition (Mini Video) */}
          {enrollStep === 'FACE' && (
            <div className="space-y-4 animate-fadeIn text-center">
              <div className="mb-2">
                <h4 className="text-lg sm:text-xl font-bold text-navy-900">Facial Recognition Scan</h4>
                <p className="text-xs sm:text-sm text-gray-500">Follow the instructions to scan your face.</p>
              </div>
              <div className="relative w-48 h-48 sm:w-64 sm:h-64 mx-auto bg-black rounded-3xl overflow-hidden border-4 border-white shadow-2xl">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]"></video>
                <canvas ref={overlayCanvasRef} width={480} height={480} className="absolute inset-0 w-full h-full object-cover pointer-events-none"></canvas>
                {cameras.length > 1 && (
                  <button
                    onClick={toggleCamera}
                    className="absolute top-2 right-2 bg-white text-gray-800 px-3 py-1 rounded-md text-sm hover:bg-black-500 transition-colors z-10 flex items-center gap-1"
                  >
                    🔄 Switch
                  </button>
                )}
                {/* Oval Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none ">
                  <div className="absolute inset-0 bg-navy-950/30" style={{ clipPath: 'polygon(0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%, 50% 10%, 15% 30%, 15% 70%, 50% 90%, 85% 70%, 85% 30%, 50% 10%)' }}></div>
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] rounded-[50%] border-4 transition-all duration-500 ${isFaceAligned ? 'border-transparent' : 'border-gold-500/50 shadow-[0_0_0_2px_rgba(255,255,255,0.2)]'}`}></div>
                  
                  {/* Scanning Line */}
                  {isCapturingFace && (
                    <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl">
                      <div className="w-full h-1 bg-gold-500 shadow-[0_0_15px_#f59e0b] absolute animate-scan"></div>
                    </div>
                  )}
                </div>

                {isCapturingFace && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gold-500/30">
                      <div className="h-full bg-gold-500 transition-all duration-300" style={{ width: `${captureProgress}%` }}></div>
                    </div>
                    <div className="bg-navy-900/80 backdrop-blur-sm px-4 py-2 sm:px-6 sm:py-3 rounded-full border border-white/20 animate-pulse mt-auto mb-4">
                      <p className="text-white font-bold text-sm sm:text-lg">{faceInstruction}</p>
                    </div>
                  </div>
                )}
                
                {!isCapturingFace && faceFrames.length > 0 && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <div className="bg-white rounded-full w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-green-500 text-2xl sm:text-3xl shadow-lg">
                      <i className="fa-solid fa-check"></i>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setEnrollStep('PHOTO')} disabled={isCapturingFace}> Back </Button>
                {!isFaceAligned ? (
                  <Button 
                    onClick={startFaceDetection} 
                    disabled={isDetectingFace} 
                    className="bg-navy-900 text-white px-8"
                  >
                    {isDetectingFace ? 'Detecting...' : 'Detect Face'}
                  </Button>
                ) : faceFrames.length === 0 ? (
                  <Button onClick={captureFaceSequence} disabled={isCapturingFace} className="bg-navy-900 text-white px-8"> Start Face Scan </Button>
                ) : (
                  <Button onClick={() => setEnrollStep('FINGERPRINT')} className="bg-green-600 text-white px-8"> Continue </Button>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Fingerprint Simulation */}
          {enrollStep === 'FINGERPRINT' && (
            <div className="space-y-4 animate-fadeIn text-center">
              <div className="mb-2">
                <h4 className="text-lg sm:text-xl font-bold text-navy-900">Fingerprint Enrollment</h4>
                <p className="text-xs sm:text-sm text-gray-500">Place the user's finger on the external scanner device.</p>
              </div>
              <div className="py-12 flex flex-col items-center justify-center">
                  {!fingerData &&  
                <div className="w-32 h-32 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-6xl animate-pulse border-4 border-orange-100"> 
                    <i className="fa-solid fa-fingerprint "></i>
                  </div>}

                  {fingerData &&  <div className="w-32 h-32 rounded-full bg-navy-100 text-green-500 flex items-center justify-center text-6xl animate-pulse border-4 border-green-100">
                    <i className="fa-solid fa-fingerprint "></i>
                  </div>}

                {!fingerData && <p className="mt-6 text-orange-800 font-bold">Waiting for device input...</p>}
                {fingerData && <p className="mt-6 text-green-600 font-bold">Finger Print Detected</p>}
                <p className="text-xs text-gray-400 mt-2">Ensure the Fingerprint Scanner is connected via USB/Network.</p>
              </div>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setEnrollStep('FACE')}>Back</Button>
                <Button onClick={() => setEnrollStep('REVIEW')} className="bg-navy-900 text-white px-8">Simulate Capture</Button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Save */}
          {enrollStep === 'REVIEW' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center mb-6">
                <h4 className="text-xl font-bold text-navy-900">Review Enrollment</h4>
                <p className="text-gray-500">Verify the captured data before saving.</p>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-4 border-b border-gray-200 pb-4">
                  <div className="w-16 h-16 rounded-full bg-navy-100 overflow-hidden border-2 border-white shadow-sm">
                    {livePhoto && <img alt='live' src={ livePhoto } className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-lg">{selectedUser?.name}</p>
                    <p className="text-sm text-gray-500">{selectedUser?.type.toUpperCase()} • { selectedUser?.uniqueId }</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Face Recognition</p>
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <i className="fa-solid fa-circle-check"></i>
                      <span>{faceFrames.length} Frames Captured</span>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">Fingerprint</p>
                    <div className="flex items-center gap-2 text-green-600 font-bold">
                      <i className="fa-solid fa-circle-check"></i>
                      <span> Template Generated </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto py-2 custom-scrollbar">
                  {faceFrames.map((frame, i) => (
                    <img key={i} src={frame} alt='frame'className="w-16 h-12 rounded object-cover border border-gray-200 flex-shrink-0" />
                  ))}
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setEnrollStep('FINGERPRINT')}>Back</Button>
                <Button onClick={handleSaveIdentity} className="bg-green-600 text-white px-12 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Complete Enrollment
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* View Identity Modal */}
      <Modal
        isOpen={!!viewingIdentity}
        onClose={() => setViewingIdentity(null)}
        title="Identity Details"
        icon="fa-solid fa-id-card"
      >
        {viewingIdentity && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full bg-navy-100 overflow-hidden border-4 border-white shadow-xl mb-4">
                {viewingIdentity.livePhoto ? (
                  <img src={urls.BASE_URL + viewingIdentity.livePhoto} alt={viewingIdentity.userName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl text-navy-600 font-bold">
                    {viewingIdentity.userName.charAt(0)}
                  </div>
                )}
              </div>
              <h4 className="text-2xl font-bold text-navy-900">{viewingIdentity.userName}</h4>
              <p className="text-gray-500">{viewingIdentity.userType.toUpperCase()} • {viewingIdentity.uniqueId}</p>
              <span className={`mt-3 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                viewingIdentity.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {viewingIdentity.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3">Facial Data</p>
                <div className="grid grid-cols-3 gap-2">
                  {viewingIdentity.faceData?.map((frame, i) => (
                    <img key={i} src={urls.BASE_URL+frame} alt={'frame'}className="w-full aspect-video rounded object-cover border border-gray-200" />
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 italic">5-frame sequence stored for 3D reconstruction.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col justify-center items-center">
                <p className="text-xs font-bold text-gray-400 uppercase mb-3 w-full">Fingerprint Data</p>
                <i className="fa-solid fa-fingerprint text-5xl text-orange-500 mb-2"></i>
                <p className="text-sm font-mono text-gray-600">{viewingIdentity.fingerprintId}</p>
                <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold">Encrypted Template</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleAction(viewingIdentity.id,"UPDATE",{field:"status",value:viewingIdentity.status === 'Active'? "Inactive":"Active"})}
              >
                {viewingIdentity.status === 'Active' ? 'Deactivate' : 'Activate'}
              </Button>
              <Button 
                variant="danger" 
                className="flex-1"
                onClick={() => { handleAction(viewingIdentity.id,"DELETE"); setViewingIdentity(null); }}
              >
                Delete Identity
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <PinModal 
        isOpen={isPinModalOpen}
        onClose={() => { setIsPinModalOpen(false); setPinAction(null); }}
        // onVerified={handlePinSuccess}
        onSuccess={handlePinSuccess}
        title={pinAction?.type === 'DELETE' ? 'Confirm Deletion' : pinAction?.type === 'UPDATE' ? 'Confirm Update' : 'Set PIN for New Identity'}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};
