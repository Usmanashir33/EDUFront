
import React, { useState, useEffect ,useContext, useRef} from 'react';
import { ViewState, School, UserRole, SessionData } from './types';
import { LoginForm } from './views/LoginForm';
import { RegisterForm } from './views/RegisterForm';
import { VerificationForm } from './views/VerificationForm';
import { SchoolSelection } from './views/SchoolSelection';
import { ForgotPassword } from './views/ForgotPassword';
import { Dashboard } from './views/DirectorDashboard';
import { authContext } from './customContexts/AuthContext';
import { Input, Button, FadeIn ,Toast,PageLoader ,Spinner } from './components/UI';
import { uiContext, } from './customContexts/UiContext';
import ProtectedRoute from './customProtectors/ProtectedRoute';
import useRequest from './customHooks/RequestHook';
import { ResultVerification } from './views/ResultVerification';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import UnProtectedRoutes from './customProtectors/UnProtectedRoutes';

// Layout for Authentication Pages
const AuthLayout = ({ children }: { children?: React.ReactNode }) => {
  const {toast, setToast, isLoading,pageLoading } = useContext(uiContext);
  
  useEffect(() => { // to automatically close toast after 3 seconds
  if (toast) {
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }
}, [toast]);
  return (
    <><UnProtectedRoutes>
          {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
          {pageLoading && <PageLoader />}
          {isLoading && <div className="fixed z-[999999] top-14 w-full flex items-center justify-center mb-8">
            <Spinner size="lg" className="animate-spin-slow" />
          </div>}
            
          <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4  ">
            
            <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ">
              {/* Left Side: Branding */}
              <div className="hidden lg:flex flex-col justify-center text-navy-900 pr-8">
                  <div className="mb-6 animate-fadeIn">
                    <div className="h-16 w-16 bg-navy-900 rounded-lg flex items-center justify-center text-gold-500 text-3xl mb-6 shadow-lg">
                      <i className="fa-solid fa-graduation-cap"></i>
                    </div>
                    <h1 className="text-5xl font-bold mb-4 tracking-tight">EduPortal</h1>
                    <p className="text-xl text-navy-600 max-w-md leading-relaxed">
                      Empowering education through seamless management. Connect directors, teachers, and students in one unified platform.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6 mt-8 animate-fadeIn" style={{ animationDelay: '200ms' }}>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-navy-100">
                        <i className="fa-solid fa-chart-pie text-gold-500 text-2xl mb-2"></i>
                        <h3 className="font-bold text-navy-800">Smart Analytics</h3>
                        <p className="text-xs text-gray-500 mt-1">Real-time insights for better decisions.</p>
                    </div>
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-navy-100">
                        <i className="fa-solid fa-users text-gold-500 text-2xl mb-2"></i>
                        <h3 className="font-bold text-navy-800">Community First</h3>
                        <p className="text-xs text-gray-500 mt-1">Tools built for engagement.</p>
                    </div>
                  </div>
              </div>

              {/* Right Side: Form Card     max-w-md   */}
              <div className="w-full   max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                  <div className="h-2 bg-gradient-to-r from-navy-900 via-navy-700 to-gold-500"></div>
                  <div className="p-8">
                      {children}
                  </div>
              </div>
            </div>
          </div>
      </UnProtectedRoutes>
    </>
  );
} ;

// Layout for Dashboard (Full Screen)
const DashboardLayout = ({ children }: { children?: React.ReactNode }) => {
  const {toast, setToast, isLoading,pageLoading } = useContext(uiContext);
  
  useEffect(() => { // to automatically close toast after 3 seconds
  if (toast) {
    const timer = setTimeout(() => {
      setToast(null);
    }, 3000);
    return () => clearTimeout(timer);
  }
  }, [toast]);
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {pageLoading && <PageLoader />}
      {isLoading && <div className="absolute top-14 w-full flex items-center justify-center mb-8">
        <Spinner size="lg" className="animate-spin-slow" />
      </div>}
      <div className="min-h-screen bg-navy-50">
        {children}
      </div>
    </>
);
};

 
const App: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string>('');
  const [isLoginSession ,setIsLoginSession] = useState(false);
  const navigate = useNavigate();
  const { currentUser,setCurrentUser,
          getCurrentUser,getToken,
          userRole, setUserRole,
          isAuthenticated,setIsAuthenticated,
          setSchoolData,
        } = useContext(authContext);
  const {sendRequest} = useRequest();
  const fetchedRef = useRef(false);

  const {setCurrentView,setPageLoading,selectedSchool, setSelectedSchool} = useContext(uiContext)
  
  
  const handleNavigate = (view: string) => {
    navigate(view,);
  };

  const handleLogin = (mode:String, response:any) => {
    const responseData = response?.data
    // console.log('response login : ', response?.data);
    let role:string = 'director';
    let nextView = ViewState.SELECT_SCHOOL;
    let initialSchool: School | null | any = null;

    if (mode === 'director') {
        // Directors & Parents go to School Selection
        role = 'director';
        // check if its one school 
        if(responseData?.directorschools?.length > 1 ){
          nextView = ViewState.SELECT_SCHOOL;
        }
        // DIRECTLY to Dashboard
        initialSchool = responseData?.directorschools[0] ;
        role = mode?.toLowerCase() 
        setSelectedSchool(initialSchool) ;
        nextView = ViewState.DASHBOARD ;

        
    } else {
      // Students & Staff go DIRECTLY to Dashboard
          initialSchool = responseData?.school ;
          role = mode?.toLowerCase() 
          setSelectedSchool(initialSchool) ;
          nextView = ViewState.DASHBOARD ;
    }
    // set is Authenticated true 
      localStorage.setItem('a_token',response?.tokens?.access);
      localStorage.setItem('r_token',response?.tokens?.refresh);
      if (role === 'director'){
        localStorage.setItem('directorschools',JSON.stringify(responseData?.directorschools));
      }else{
        localStorage.setItem('school',JSON.stringify(responseData?.school));
      }
      setIsLoginSession(true);
      setUserRole(role);
      setCurrentUser(responseData) // user instance data base on the role 
      setIsAuthenticated(true);
      navigate('/',{replace:true})
    const session: SessionData = {
        role,
        user: responseData,
        school : initialSchool,
        timestamp: Date.now()
    };
    localStorage.setItem('session', JSON.stringify(session));
      // set currentUser
  }
    

  const handleSelectSchool = (schoolId: string) => {
    const directorschools =  JSON.parse(localStorage.getItem('directorschools') as any );
    const school = directorschools.find(s => s?.id === schoolId);
    if (school) { 
      setSelectedSchool(school); // this will trigger session update in the authcontext 
      setCurrentView(ViewState.DASHBOARD);
      // Update session with school selection
      const stored = localStorage.getItem('session');
      if (stored) {
          const session = JSON.parse(stored);
          session.school = school;
          localStorage.setItem('session', JSON.stringify(session));
      }
    }
    if ( school?.id) { 
      sendRequest(`/school/school-detail/director/${school?.id}/`,'GET',null as any ,setSchoolData,false,false,true) ;
    }
  };

  useEffect(() => {
    if (!isLoginSession) return ;
    // call the big data api here 
    let role = userRole?.toLowerCase()
    if ( selectedSchool?.id) { 
      sendRequest(`/school/school-detail/${role}/${selectedSchool?.id}/`,'GET',null as any ,setSchoolData,false,false,true) ;
    }
    setIsLoginSession(false);
  },[isLoginSession,selectedSchool,])

  // --- SESSION PERSISTENCE ---
  useEffect(() => {
    if (isLoginSession) return ;
        // prevent duplicate queries here 
        if (fetchedRef.current) return;
        fetchedRef.current = true;

        const storedSession = localStorage.getItem('session');
        const storedTokens =  localStorage.getItem('a_token');
    
        if (storedSession && storedTokens) {
            try {
                const session  = JSON.parse(storedSession);
                const directorschools =  JSON.parse(localStorage.getItem('directorschools') as any ) || null;
                // setSchools(directorschools);
                setUserRole(session.role);
                setCurrentUser(session.user)
                
                // Check expiry (e.g. 24 hours) - Mock implementation
                if (Date.now() - session.timestamp > 86400000) {
                    localStorage.removeItem('session');
                    localStorage.removeItem('r_token');
                    localStorage.removeItem('a_token');
                    return;
                }
                if (session?.school?.id) {
                    // const school = directorschools?.find(s => s.id === session.school?.id);
                    const school = session?.school;
                    if (school) {
                        // fetch school big data  records here           //
                        setSelectedSchool(school) ;
                        if (session?.role){ // director/student/teacher/parent/staff 
                          let role = session?.role?.toLowerCase()
                          sendRequest(`/school/school-detail/${role}/${school?.id}/`,'GET',null as any , setSchoolData,false,false,true) ;
                        }
                    } else if (session.role === 'director' && directorschools ) { // but school not selected 
                        setCurrentView(ViewState.SELECT_SCHOOL);
                    }else{
                      // If student/staff has no school 
                      setCurrentView(ViewState.LOGIN);
                    }
                } else {
                    // If student/staff has no school 
                    setCurrentView(ViewState.LOGIN);
                }
            } catch (e) {
                console.error("Failed to parse session", e);
            }
        }
  }, []); // when ever school is selected we need to fetch its bulk data 
    
  const handleLogout = () => {
    setPageLoading(true) 
    setTimeout(() => {
      localStorage.removeItem('session') ;
      localStorage.removeItem('a_token') ;
      localStorage.removeItem('r_token') ;
      localStorage.removeItem('directorschools') ;
      setIsAuthenticated(false) ;
      setCurrentUser(null) ;
      setSelectedSchool(null) ;
      setCurrentView(ViewState.LOGIN); 
      setUserRole('director'); // Reset role 
      setPageLoading(false)
    }, 2000);
  };

  // Router
  return(
    <Routes>
        {/* <Route path="/" element={<Navigate to="/director/overview/" replace />} /> */}
        <Route path='/*' element ={
          <DashboardLayout>
              <ProtectedRoute>
                    {selectedSchool ? (
                    <Dashboard
                      userRole={userRole}
                      onLogout={handleLogout}
                    />
                  ) : (
                      <PageLoader />
                  )} 
              </ProtectedRoute>
           </DashboardLayout>
        }/>
        <Route path='/auth' element ={
            <AuthLayout>
              <ForgotPassword onNavigate={handleNavigate} />
          </AuthLayout>
        }/>
        <Route path='/auth/login' element ={
            <AuthLayout>
                <LoginForm onNavigate={handleNavigate} onLogin={handleLogin} />
          </AuthLayout>
        }/>
        <Route path='/auth/register' element ={
            <AuthLayout>
              <RegisterForm onNavigate={handleNavigate} onLogin={handleLogin} />
          </AuthLayout>
        }/>
        <Route path='/auth/verify' element ={
            <AuthLayout>
              <VerificationForm email={userEmail || 'user@example.com'} onNavigate={handleNavigate} />
          </AuthLayout>
        }/>
        <Route path='/auth/selection' element ={
            <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
               <div className="w-full max-w-5xl">
                  <ProtectedRoute>
                    <SchoolSelection 
                          onNavigate={handleNavigate} 
                          onSelectSchool={handleSelectSchool} 
                    />
                  </ProtectedRoute>
               </div>
           </div>
        }/>
        <Route path='/resultverification' element ={
            <DashboardLayout>
                <ResultVerification onNavigate={handleNavigate} />
            </DashboardLayout>
        }/>
    </Routes>
  )
};

export default App;
