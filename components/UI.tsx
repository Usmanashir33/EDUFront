
import React, { useState, useRef, useEffect,useContext } from 'react';
import { uiContext } from '@/customContexts/UiContext';
import useRequest from '@/customHooks/RequestHook';
import { authContext } from '@/customContexts/AuthContext';
import { createPortal } from 'react-dom';


// --- STUNNING LOADING ICON (Small) ---
export const Spinner: React.FC<{ size?: 'sm' | 'md' | 'lg', className?: string }> = ({ size = 'sm', className = '' }) => {
  const sizeClass = size === 'md' ? 'w-6 h-6' : size === 'lg' ? 'w-8 h-8' : 'w-4 h-4';
  const borderClass = size === 'md' ? 'border-2' : size === 'lg' ? 'border-[3px]' : 'border-[1.5px]';
  
  return (
    <div className={`relative z-[9999999]  flex items-center justify-center ${sizeClass} ${className}`}>
        <div className={`absolute inset-0 rounded-full border-navy-200 border-t-navy-900 ${borderClass} animate-spin`}></div>
        <div className={`absolute inset-0 rounded-full border-transparent border-b-gold-500 ${borderClass} animate-spin-reverse opacity-70`}></div>
    </div>
  );
};

// --- STUNNING FULL PAGE LOADER ---
export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[99999] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fadeIn">
      <div className="relative w-24 h-24 flex items-center justify-center mb-8">
        {/* Outer Navy Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-navy-100 border-t-navy-900 animate-spin-slow"></div>
        {/* Inner Gold Ring */}
        <div className="absolute inset-2 rounded-full border-4 border-white border-b-gold-500 animate-spin-reverse shadow-sm"></div>
        
        {/* Central Floating Icon */}
        <div className="relative z-10 text-navy-900 text-3xl animate-float">
           <div className="bg-white rounded-full p-2 shadow-sm">
             <i className="fa-solid fa-graduation-cap"></i>
           </div>
        </div>
        
        {/* Pulse Effect */}
        <div className="absolute inset-0 rounded-full bg-gold-400/20 animate-ping opacity-20"></div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-xl font-black text-navy-900 tracking-widest uppercase">SchoolManger</h3>
        <div className="flex items-center justify-center gap-1">
           <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
           <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
           <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
        </div>
        <p className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">Loading Resources...</p>
      </div>
    </div>
  );
};
// --- INPUT COMPONENT WITH ICON & PASSWORD TOGGLE ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  iconClass: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, iconClass, className, error, type, ...props }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';
  
  // Determine the actual input type to render based on toggle state
  const inputType = isPasswordType ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`relative ${className || ''}`}>
      <label className={`block text-sm font-semibold mb-1.5 transition-colors ${error ? 'text-red-600' : 'text-navy-800'}`}>
        {label}
      </label>
      <div className="relative group">
        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${error ? 'text-red-400' : 'text-navy-400 group-focus-within:text-navy-600'}`}>
          <i className={iconClass}></i>
        </div>
        <input
          {...props}
          type={inputType}
          className={`block w-full pl-10 pr-${isPasswordType ? '10' : '3'} py-3 border rounded-md leading-5 bg-white placeholder-gray-400 focus:outline-none transition duration-200 ease-in-out sm:text-sm
            ${error 
                ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500 focus:ring-2' 
                : 'border-gray-300 text-navy-900 focus:ring-2 focus:ring-navy-900/10 focus:border-navy-900'
            }
          `}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer focus:outline-none ${error ? 'text-red-400 hover:text-red-600' : 'text-gray-400 hover:text-navy-600'}`}
            tabIndex={-1}
          >
            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-xs text-red-600 animate-fadeIn font-medium">
          <i className="fa-solid fa-circle-exclamation mr-1"></i>
          {error}
        </p>
      )}
    </div>
  );
};

// --- IMAGE UPLOAD COMPONENT ---
interface ImageUploadProps {
  label: string;
  currentImage?: string;
  onImageSelected: (base64OrUrl: string) => void;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ label, currentImage, onImageSelected, className }) => {
  const [preview, setPreview] = useState<string | undefined>(currentImage);
  const [showCamera, setShowCamera] = useState(false);
  const [zoom, setZoom] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const {dataURLtoFile} = useContext(uiContext) ;

  useEffect(() => {
  if (!preview && currentImage) {
    setPreview(currentImage);
  }
  // return () => {setPreview(undefined)}
}, [currentImage]);

  // Handle File Select
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
         // Convert to File before sending
        const file = dataURLtoFile(result, 'photo.jpg'); 
        onImageSelected(file);
        setZoom(1); // Reset zoom on new image
      };
      reader.readAsDataURL(file);
    }
  };

  // Start Camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setShowCamera(true);
      // Wait for modal to render
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      alert("Unable to access camera. Please ensure permissions are granted.");
      console.error(err);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  // Capture Photo
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Flip horizontally to match mirror effect if desired, usually simpler to just draw
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setPreview(dataUrl);
         // Convert to File before sending
        const file = dataURLtoFile(dataUrl, 'student_photo.jpg');
        onImageSelected(file);
        setZoom(1);
        stopCamera();
      }
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <label className="block text-sm font-semibold text-navy-800 mb-2">{label}</label>
      
      {/* Image Circle Container */}
      <div className="relative group">
        <div className={`w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden flex items-center justify-center bg-gray-100 transition-all group-hover:border-gold-500 relative`}>
          {preview ? (
            <img 
                src={preview} 
                alt="Preview" 
                className="w-full h-full object-cover transition-transform duration-200"
                style={{ transform: `scale(${zoom})` }}
            />
          ) : (
            <i className="fa-solid fa-user text-4xl text-gray-300"></i>
          )}
        </div>
        
        {/* Hover Edit Overlay */}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <i className="fa-solid fa-pen text-white text-xl"></i>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-3 flex flex-col items-center space-y-2 w-full max-w-[200px]">
         {/* Buttons */}
         <div className="flex gap-2 w-full">
            <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 px-3 bg-white border border-gray-300 rounded text-xs font-semibold text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition-colors flex items-center justify-center"
            >
                <i className="fa-solid fa-upload mr-1.5"></i>  Upload
            </button>
            <button 
                type="button"
                onClick={startCamera}
                className="flex-1 py-1.5 px-3 bg-white border border-gray-300 rounded text-xs font-semibold text-navy-700 hover:bg-navy-50 hover:border-navy-300 transition-colors flex items-center justify-center"
            >
                <i className="fa-solid fa-camera mr-1.5"></i>  Camera
            </button>
         </div>

         {/* Zoom Slider (Only if image present) */}
         {preview && (
            <div className="w-full px-1 flex items-center gap-2 animate-fadeIn">
                <i className="fa-solid fa-image text-[10px] text-gray-400"></i>
                <input 
                    type="range" 
                    min="1" 
                    max="3" 
                    step="0.1" 
                    value={zoom} 
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-navy-600"
                    title="Zoom Image"
                />
                <i className="fa-solid fa-magnifying-glass-plus text-[10px] text-gray-400"></i>
            </div>
         )}
         
         <p className="text-[10px] text-gray-500 text-center w-full">Click buttons to upload or capture</p>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center animate-fadeIn">
            <div className="relative w-full max-w-2xl  aspect-video bg-black flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain transform scale-x-[-1]"></video>
                
                {/* Overlay Guides */}
                <div className="absolute inset-0 pointer-events-none border border-white/20">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-2 border-white/50 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]"></div>
                </div>
            </div>
            
            <div className="w-full p-6 flex items-center justify-center gap-6 bg-black">
                <button 
                    onClick={stopCamera}
                    className="w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700 transition-colors"
                    title="Cancel"
                >
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>
                <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                    title="Capture"
                >
                    <div className="w-12 h-12 rounded-full bg-gold-500"></div>
                </button>
                <div className="w-12"></div> {/* Spacer for balance */}
            </div>
        </div>
      )}
    </div>
  );
};

// --- IMAGE VIEWER COMPONENT ---
interface ImageViewerProps {
    isOpen: boolean;
    imageUrl?: string;
    altText?: string;
    onClose: () => void;
}
  
export const ImageViewer: React.FC<ImageViewerProps> = ({ isOpen, imageUrl, altText, onClose }) => {
    if (!isOpen || !imageUrl) return null;

    const previewContent =  (
        <div 
            className="fixed inset-0 z-[99999] bg-navy-950/95 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" 
            onClick={onClose}
        >
            <button 
                onClick={onClose} 
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50"
            >
                <i className="fa-solid fa-xmark text-xl"></i>
            </button>
            <div className="relative max-w-5xl max-h-[90vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
                 <img 
                    src={imageUrl} 
                    alt={altText || "Full View"} 
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl" 
                />
            </div>
        </div>
    );
    return createPortal(previewContent, document.body);
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
  icon? : any ;
}

export const Button: React.FC<ButtonProps> = ({ children, variant = 'primary', isLoading, className,...props }) => {
  const baseStyles = "w-full flex justify-center items-center py-3 px-4 border text-sm font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";
  
  const variants = {
    primary: "border-transparent text-white bg-navy-900 hover:bg-navy-800 focus:ring-navy-900",
    secondary: "border-transparent text-navy-900 bg-gold-400 hover:bg-gold-500 focus:ring-gold-500",
    outline: "border-gray-300 text-navy-700 bg-white hover:bg-gray-50 focus:ring-navy-500",
    danger: "border-transparent text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
  };

  return (
    <button
      disabled={isLoading || props.disabled}
      className={`${baseStyles} ${variants[variant]} ${className || ''} ${isLoading || props.disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
      {...props}
    >
      {isLoading && <i className={`mr-2 ${props?.icon? props.icon : 'fa-solid fa-circle-notch fa-spin'}`}></i>}
      {children}
    </button>
  );
};

export const FadeIn: React.FC<{ children: React.ReactNode, delay?: number }> = ({ children, delay = 0 }) => (
  <div className="animate-fadeIn opacity-0" style={{ animationDelay: `${delay}ms` }}>
    {children}
  </div>
);

// --- TOGGLE SWITCH ---
interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange, description }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex flex-col">
      <span className="text-sm font-medium text-navy-900">{label}</span>
      {description && <span className="text-xs text-gray-500">{description}</span>}
    </div>
    <button
      type="button"
      className={`${
        checked ? 'bg-green-500' : 'bg-gray-200'
      } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-navy-600 focus:ring-offset-2`}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span
        aria-hidden="true"
        className={`${
          checked ? 'translate-x-5' : 'translate-x-0'
        } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
      />
    </button>
  </div>
);


// --- PROFESSIONAL TOAST NOTIFICATION ---
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000); // Increased duration slightly
    return () => clearTimeout(timer);
  }, [onClose]);

  const styles = {
    success: {
      bg: 'bg-white',
      border: 'border-l-4 border-green-500',
      icon: 'fa-circle-check',
      iconColor: 'text-green-500',
      progress: 'bg-green-500'
    },
    error: {
      bg: 'bg-white',
      border: 'border-l-4 border-red-500',
      icon: 'fa-circle-xmark',
      iconColor: 'text-red-500',
      progress: 'bg-red-500'
    },
    info: {
      bg: 'bg-navy-900',
      border: 'border-l-4 border-gold-500',
      icon: 'fa-circle-info',
      iconColor: 'text-gold-500',
      progress: 'bg-gold-500',
      textColor: 'text-white' // Special case for info
    }
  };

  const currentStyle = styles[type];
  const isInfo = type === 'info';

  return (
    <div className={`fixed top-6 right-6 z-[9999999] flex flex-col w-full max-w-sm overflow-hidden rounded-lg shadow-2xl animate-slideInRight ${currentStyle.bg} ${currentStyle.border}`}>
      <div className="flex items-center p-4 gap-4">
        <div className="shrink-0">
           <i className={`fa-solid ${currentStyle.icon} text-2xl ${currentStyle.iconColor}`}></i>
        </div>
        <div className="flex-1 min-w-0">
           <p className={`text-sm font-bold ${isInfo ? 'text-white' : 'text-gray-900'}`}>
             {type === 'success' ? 'Success' : type === 'error' ? 'Error' : 'Information'}
           </p>
           <p className={`text-sm ${isInfo ? 'text-gray-300' : 'text-gray-600'} truncate`}>
             {message}
           </p>
        </div>
        <button onClick={onClose} className={`ml-auto ${isInfo ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}>
          <i className="fa-solid fa-xmark"></i>
        </button>
      </div>
      {/* Progress Bar */}
      <div className="w-full h-1 bg-gray-200/20">
         <div className={`h-full ${currentStyle.progress} animate-progress`}></div>
      </div>
    </div>
  );
};


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  icon?: string;
  className?:string
}

// export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, icon, className }) => {
//   if (!isOpen) return null;

//   return (
//     <div className={`fixed inset-0 z-50 overflow-y-auto ${className}`} aria-labelledby="modal-title" role="dialog" aria-modal="true">
//       <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
//         <div className="fixed inset-0 bg-navy-900 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

//         <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

//         <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6 animate-fadeIn">
//           <div>
//             {icon && (
//               <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-navy-50 mb-4 border border-navy-100">
//                 <i className={`${icon} text-navy-600 text-xl`}></i>
//               </div>
//             )}
//             <div className="text-center sm:text-left w-full">
//               <h3 className="text-lg leading-6 font-bold text-navy-900 text-center mb-6" id="modal-title">
//                 {title}
//               </h3>
//               <div className="mt-2 w-full">
//                 {children}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// --- PIN MODAL ---
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, icon }) => {
  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[150] overflow-hidden flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div className="fixed inset-0 bg-navy-950/35 bg-opacity-80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <div className="relative bg-white rounded-xl shadow-2xl transform transition-all sm:max-w-2xl sm:w-full animate-fadeIn max-h-[90vh] flex flex-col w-full">
          <div className="flex-shrink-0 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4">
              {icon ? (
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-navy-50 border border-navy-100">
                  <i className={`${icon} text-navy-600 text-xl`}></i>
                </div>
              ) : <div></div>}
              <button onClick={onClose} className="text-gray-400 hover:text-navy-900 transition-colors ml-auto">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            <div className="text-left w-full">
              <h3 className="text-lg leading-6 font-bold text-navy-900" id="modal-title">
                {title}
              </h3>
            </div>
          </div>
          <div className="w-full overflow-y-auto custom-scrollbar flex-grow p-4 sm:p-6">
            {children}
          </div>
        </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data:string) => void;
  title?: string;
}

type PinFlow = 'ENTER' | 'EMAIL' | 'OTP' | 'NEW_PIN';

export const PinModal: React.FC<PinModalProps> = ({ isOpen, onClose, onSuccess, title = "Security Verification" }) => {
    const [flow, setFlow] = useState<PinFlow>('ENTER');
    const [pin, setPin] = useState(['', '', '', '']);
    const [currentPin, setCurrentPin] = useState("0000"); // Default PIN
    const [error, setError] = useState('');
    const {sendRequest} = useRequest();
    const {currentUser} = useContext(authContext) ;
    const {isLoading:loading,setIsLoading:setLoading,setToast} = useContext(uiContext) ;

    // Reset Flow States
    const [resetEmail, setResetEmail] = useState(currentUser?.email);
    const [otp, setOtp] = useState(['', '', '', '', '']);
    
    const TriggeredFunc = (data) => {
      setToast({message: data?.success, type: 'success'}); 
      if (data?.success == 'otp_sent'){
        setFlow('OTP');
        setError('');
      }else{ // success 
        setFlow('ENTER')
        setResetEmail(currentUser?.email)
        setOtp(['', '', '', '', ''])
      }
    }
    useEffect(() => {
        if (isOpen) {
            setPin(['', '', '', '']);
            setError('');
            setFlow('ENTER');
            setLoading(false);
        }
    }, [isOpen]);

    const handleChange = (element: HTMLInputElement, index: number, stateSetter: React.Dispatch<React.SetStateAction<string[]>>, currentState: string[]) => {
        if (isNaN(Number(element.value))) return;
        const newArr = [...currentState];
        newArr[index] = element.value;
        stateSetter(newArr);
        setError('');
        
        if (element.nextSibling && element.value !== "") {
            (element.nextSibling as HTMLInputElement).focus();
        }
    };
    

    // 1. Verify PIN
    const handleVerify = () => {
        if (pin.join('').length !== 4) return;
        setLoading(true);
        onSuccess(pin.join(''));
        setPin(['', '', '', '']); 
    };

    // 2. Send Reset Code
    const handleSendCode = () => {
        if (!resetEmail.includes('@')) {
            setError('Please enter a valid email.');
            return;
        }
        let form:any ={
          "username_field" : resetEmail,
        }
        sendRequest("/authuser/resend-otp/","POST",form,TriggeredFunc,true,false)
       
    };

    // 3. Verify OTP
    const handleVerifyOTP = () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            setFlow('NEW_PIN');
            setPin(['', '', '', '']); // Clear pin state for new pin input
        }, 1000);
    };

    // 4. Set New PIN
    const handleSetNewPin = () => {
        const newP = pin.join('');
        if (newP.length !== 4) return;
        let form:any ={
          "email" : resetEmail,
          "pin1":newP,
          "pin2":newP,
          "otp" : otp.join('') 
        }
        sendRequest("/authuser/pin-change/","POST",form,TriggeredFunc,true,false)
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center">
             {/* Full screen backdrop with blur */}
            <div className="fixed inset-0 bg-navy-950/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative bg-white rounded-2xl px-8 pt-8 pb-8 text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-sm sm:w-full animate-fadeIn border border-gray-100">
                
                {/* Close Button */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-navy-900 transition-colors">
                    <i className="fa-solid fa-xmark text-xl"></i>
                </button>

                <div className="text-center">
                    {/* Header Icon */}
                    <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-6 border-4 ${flow === 'ENTER' ? 'bg-navy-50 border-navy-100 text-navy-900' : 'bg-gold-50 border-gold-100 text-gold-600'}`}>
                        <i className={`fa-solid ${flow === 'ENTER' ? 'fa-lock' : 'fa-key'} text-2xl`}></i>
                    </div>

                    {/* --- FLOW 1: ENTER PIN --- */}
                    {flow === 'ENTER' && (
                        <>
                            <h3 className="text-xl leading-6 font-bold text-navy-900">{title}</h3>
                            <p className="mt-2 text-sm text-gray-500">Enter your 4-digit Director PIN.</p>
                            
                            <div className="mt-8 mb-6 flex justify-center gap-3">
                                {pin.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        type="password"
                                        maxLength={1}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-lg focus:border-navy-900 focus:ring-0 outline-none transition-all text-navy-900 bg-gray-50 focus:bg-white"
                                        value={digit}
                                        onChange={e => handleChange(e.target, idx, setPin, pin)}
                                        autoFocus={idx === 0}
                                        disabled={loading}
                                    />
                                ))}
                            </div>
                            
                            {error && <p className="text-red-600 text-xs font-bold mb-4 bg-red-50 py-2 rounded animate-fadeIn"><i className="fa-solid fa-triangle-exclamation mr-1"></i> {error}</p>}

                            <Button 
                                variant="primary" 
                                onClick={handleVerify} 
                                isLoading={loading}
                                disabled={pin.join('').length !== 4}
                                className="mb-4"
                            >
                                Verify & Proceed
                            </Button>
                            
                            <button onClick={() => setFlow('EMAIL')} className="text-xs text-navy-500 hover:text-navy-800 underline font-medium">
                                Forgot or Reset PIN?
                            </button>
                        </>
                    )}

                    {/* --- FLOW 2: RESET EMAIL --- */}
                    {flow === 'EMAIL' && (
                        <>
                            <h3 className="text-xl font-bold text-navy-900">Reset Security PIN</h3>
                            <p className="mt-2 text-sm text-gray-500 mb-6">Enter your registered director email.</p>
                            
                            <div className="text-left mb-6">
                                <label className="block text-xs font-bold text-navy-700 uppercase mb-2">Email Address</label>
                                <input 
                                    type="email" 
                                    className="w-full p-3 border border-gray-300 rounded-md text-sm focus:border-navy-900 focus:ring-1 focus:ring-navy-900 outline-none"
                                    placeholder="director@school.edu"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-red-600 text-xs mb-4">{error}</p>}
                            
                            <Button onClick={handleSendCode} isLoading={loading}>Send Verification Code</Button>
                            <button onClick={() => setFlow('ENTER')} className="mt-4 text-xs text-gray-400 hover:text-navy-900">Cancel</button>
                        </>
                    )}

                    {/* --- FLOW 3: OTP --- */}
                    {flow === 'OTP' && (
                        <>
                            <h3 className="text-xl font-bold text-navy-900">Enter Code</h3>
                            <p className="mt-2 text-sm text-gray-500 mb-6">We sent a code to <span className="font-bold text-navy-900">{resetEmail}</span></p>
                            
                            <div className="flex justify-center gap-2 mb-6">
                                {otp.map((d, i) => (
                                    <input
                                        key={i}
                                        maxLength={1}
                                        className="w-10 h-12 text-center border border-gray-300 rounded font-bold text-lg focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                                        value={d}
                                        onChange={e => handleChange(e.target, i, setOtp, otp)}
                                    />
                                ))}
                            </div>

                            <Button onClick={handleVerifyOTP} isLoading={loading} disabled={otp.some(x => x === '')}>Verify Code</Button>
                        </>
                    )}

                    {/* --- FLOW 4: NEW PIN --- */}
                    {flow === 'NEW_PIN' && (
                        <>
                            <h3 className="text-xl font-bold text-navy-900">Set New PIN</h3>
                            <p className="mt-2 text-sm text-gray-500 mb-6">Choose a new 4-digit security PIN.</p>
                            
                            <div className="mb-6 flex justify-center gap-3">
                                {pin.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        type="password"
                                        maxLength={1}
                                        className="w-12 h-14 text-center text-2xl font-bold border-2 border-gold-400 rounded-lg focus:border-gold-600 focus:ring-0 outline-none transition-all text-navy-900 bg-white"
                                        value={digit}
                                        onChange={e => handleChange(e.target, idx, setPin, pin)}
                                        autoFocus={idx === 0}
                                    />
                                ))}
                            </div>

                            <Button onClick={handleSetNewPin} isLoading={loading} disabled={pin.join('').length !== 4}>Set PIN</Button>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
    return createPortal(modalContent, document.body);
};

interface MultiSelectGridProps {
  label: string;
  items: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export const MultiSelectGrid: React.FC<MultiSelectGridProps> = ({ label, items, selectedIds, onChange }) => {
  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(itemId => itemId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      <label className="block text-sm font-semibold text-navy-800 mb-3">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto custom-scrollbar">
        {items.map(item => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`cursor-pointer px-3 py-2 text-xs font-medium rounded border transition-all flex items-center justify-between ${
                isSelected 
                  ? 'bg-navy-800 text-white border-navy-900' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300'
              }`}
            >
              <span className="truncate mr-2">{item.name}</span>
              {isSelected ? <i className="fa-solid fa-check text-gold-500"></i> : <i className="fa-regular fa-circle text-gray-300"></i>}
            </div>
          );
        })}
        {items.length === 0 && <p className="col-span-3 text-xs text-gray-400 italic">No items available.</p>}
      </div>
    </div>
  );
};

interface MultiSelectDropdownProps {
  label: string;
  items: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}

export const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({ 
  label, items, selectedIds, onChange, placeholder = "Select items..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(itemId => itemId !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const selectedNames = items
    .filter(i => selectedIds.includes(i.id))
    .map(i => i.name)
    .join(', ');

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-semibold text-navy-800 mb-1.5">{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full p-3 border rounded-md cursor-pointer flex justify-between items-center bg-white min-h-[46px] ${isOpen ? 'ring-2 ring-navy-900/10 border-navy-900' : 'border-gray-300'}`}
      >
        <div className="text-sm truncate pr-4 text-navy-900 font-medium">
          {selectedIds.length > 0 ? selectedNames : <span className="text-gray-400">{placeholder}</span>}
        </div>
        <i className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}></i>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto animate-fadeIn">
          {items.map(item => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className="flex items-center px-4 py-3 hover:bg-navy-50 cursor-pointer border-b border-gray-50 last:border-0"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-navy-900 border-navy-900' : 'bg-white border-gray-300'}`}>
                  {isSelected && <i className="fa-solid fa-check text-white text-xs"></i>}
                </div>
                <span className={`text-sm ${isSelected ? 'font-semibold text-navy-900' : 'text-gray-600'}`}>{item.name}</span>
              </div>
            );
          })}
          {items.length === 0 && (
             <div className="px-4 py-3 text-sm text-gray-500 italic">No items available</div>
          )}
        </div>
      )}
    </div>
  );
};
interface PaginatorProps {
  data: string[];
  setData: (data:any) => void;
  filteredData: string[];
  schoolId: string | undefined;
  url: string;
  sendRequest: (url: string, method: string, body: any, onSuccess: (resp: any) => void, showLoading: boolean, showError: boolean) => void;
}
export const Paginator:React.FC<PaginatorProps> = ({ data, setData, filteredData, schoolId, url, sendRequest }) => {
  //----------------------------------- Pagination States Starts ----------------------------------------
    const [totalData,setTotalData] = useState(0) ;
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages,setTotalPages] = useState(2);
    // const dataPerPage = 2 ; // testinh
    const dataPerPage = 50;
    
    
    const handlePageDataChange = (resp: any) => {
      let paginated_data = resp?.results?.paginated_data || [];
      setData(paginated_data);
      setTotalData(resp?.count || 0);
      setTotalPages(resp?.total_pages || 10);
    }
    //----------------------------------- Pagination States Ends ----------------------------------------
    

  return ( 
    <>
       {((data.length >= dataPerPage) || (totalData > 0 )) && (
                     <div className="fixed bottom-3 right-1 -translate-x-1/4 bg-white/90 backdrop-blur-md shadow-xl border border-gray-200 rounded-full px-4 py-2 flex items-center gap-6 z-10 transition-all">
                         <div className="text-sm text-gray-600 font-medium whitespace-nowrap">
                             Showing <span className="font-bold text-navy-900">{filteredData.length}</span> to <span className="font-bold text-navy-900">{Math.min(dataPerPage, totalData)}</span> of <span className="font-bold text-navy-900">{totalData}</span> students
                         </div>
                         <div className="w-px h-6 bg-gray-300"></div>
                         <div className="flex items-center gap-2">
                             <button 
                                 onClick={() => {
                                  let nextPage = Math.max(1, currentPage - 1);
                                  sendRequest(`${url}?page=${nextPage}`,"GET",null as any ,handlePageDataChange,true,false)

                                  setCurrentPage(nextPage);
                                }}
                                 disabled={currentPage === 1}
                                 className="w-10 h-10 flex items-center justify-center rounded-full text-navy-700 hover:bg-navy-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                             >
                                 <i className="fa-solid fa-chevron-left"></i>
                             </button>
                             
                             <div className="flex items-center gap-1">
                                 {[...Array(totalPages)].map((_, i) => {
                                     // Show limited pages (max 5)
                                     const pageNumber = i + 1;
                                     if (
                                         pageNumber === 1 ||
                                         pageNumber === totalPages ||
                                         (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                                     ) {
                                         return (
                                              <button 
                                                 key={pageNumber}
                                                 onClick={() => {
                                                  setCurrentPage(pageNumber) ;
                                                  sendRequest(`${url}?page=${pageNumber}`,"GET",null as any ,handlePageDataChange,true,false)
                                                 }}
                                                 className={`w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-colors ${currentPage === pageNumber ? 'bg-navy-900 text-white shadow-md' : 'text-navy-700 hover:bg-navy-50'}`}
                                             >
                                                 {pageNumber}
                                             </button>
                                         );
                                     } else if (
                                         pageNumber === currentPage - 2 ||
                                         pageNumber === currentPage + 2
                                     ) {
                                         return <span key={pageNumber} className="w-4 text-center text-gray-400">...</span>;
                                     }
                                     return null;
                                 })}
                             </div>

                             <button 
                                onClick={() => {
                                  if (!schoolId) return;
                                  let nextPage = Math.min(totalPages, currentPage + 1);
                                  sendRequest(`${url}?page=${nextPage}`,"GET",null as any ,handlePageDataChange,true,false)
                                  setCurrentPage(nextPage)

                                 }}
                                 disabled={currentPage === totalPages}
                                 className="w-10 h-10 flex items-center justify-center rounded-full text-navy-700 hover:bg-navy-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                             >
                                 <i className="fa-solid fa-chevron-right"></i>
                             </button>
                         </div>
                     </div>
            )} 
    </>
  );
}
 