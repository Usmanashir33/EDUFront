
import React, { useState, useEffect ,useContext} from 'react';
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

// Mock Schools Data moved outside for accessibility
const schoolsMock = [
  {
    id: '1',
    name: 'AUA Technologu Ltd',
    address: '123 Education Lane, Knowledge City',
    studentCount: 1250,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  },
  { 
     id: '2', 
    name: 'Ainul-Ma,arif Islamic Academy',
    address: '456 River Rd, Westside',
    studentCount: 850,
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  },
  {        
    id: '3',
    name: 'Tech Future Institute',
    address: '789 Innovation Blvd, Tech Park',
    studentCount: 2100,
    image: 'https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  }
];


// Layout for Authentication Pages
const AuthLayout = ({ children }: { children?: React.ReactNode }) => {
  const {toast, setToast, isLoading,setIsLoading,pageLoading,setPageLoading, } = useContext(uiContext);
  
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
      <ProtectedRoute>
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
      </ProtectedRoute>
    </>
  );
} ;

// Layout for Dashboard (Full Screen)
const DashboardLayout = ({ children }: { children?: React.ReactNode }) => {
  const {toast, setToast, isLoading,setIsLoading,pageLoading,setPageLoading, } = useContext(uiContext);
  
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
  const [selectedSchool, setSelectedSchool] = useState<School | null | any>(null);
  const [schools, setSchools] = useState<School | null | []>([]);
  const [userRole, setUserRole] = useState<UserRole>('director');

  // const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>({ message: "string", type: 'success' });
  const { currentUser,setCurrentUser,getCurrentUser,getToken,
            isAuthenticated,setIsAuthenticated,logout } = useContext(authContext);
  const {currentView, setCurrentView,setPageLoading} = useContext(uiContext)
  // --- SESSION PERSISTENCE ---
  useEffect(() => {
    const storedSession = localStorage.getItem('session');
    const storedTokens =  localStorage.getItem('a_token');

    if (storedSession && storedTokens) {
        try {
            const session: SessionData = JSON.parse(storedSession);
            const directorschools =  JSON.parse(localStorage.getItem('directorschools'));
            setSchools(directorschools);
            setUserRole(session.role);
            setCurrentUser(session.user)
            
            // Check expiry (e.g. 24 hours) - Mock implementation
            if (Date.now() - session.timestamp > 86400000) {
                localStorage.removeItem('session');
                return;
            }

            if (session?.school?.id) {
                const school = directorschools?.find(s => s.id === session.school?.id);
                if (school) { // either has selected school or no 
                    setSelectedSchool(school);
                    setCurrentView(ViewState.DASHBOARD);

                } else if (session.role === 'director') { // but school not selected 
                    setCurrentView(ViewState.SELECT_SCHOOL);
                }
            } else if (session.role === 'director') {
                setCurrentView(ViewState.SELECT_SCHOOL);
            } else {
                // If student/staff has no school selected (shouldn't happen in real app but mock safety)
                setCurrentView(ViewState.LOGIN);
            }
        } catch (e) {
            console.error("Failed to parse session", e);
            // localStorage.removeItem('session');
        }
    }
    
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleLogin = (mode:String, response:any) => {
    const responseData = response?.data
    setPageLoading(true)
    console.log('response login : ', response?.data);
    let role:string = 'director';
    let nextView = ViewState.SELECT_SCHOOL;
    let initialSchool: School | null | any = null;

    if (mode === 'director') {
        // Directors & Parents go to School Selection
        role = 'director';
        setSchools(responseData?.data?.directorschools)
        nextView = ViewState.SELECT_SCHOOL;
        
    } else {
        // Students & Staff go DIRECTLY to Dashboard
        initialSchool = responseData?.data?.school ;
        role = mode?.toLowerCase() 
        setSelectedSchool(initialSchool) ;
        nextView = ViewState.DASHBOARD ;

    }
    //'data' : {"role":user.role,"tokens":tokens,"data":data},
    // set is Authenticated true 
    setTimeout(() => {
      localStorage.setItem('a_token',responseData?.tokens?.access);
      localStorage.setItem('r_token',responseData?.tokens?.refresh);
      localStorage.setItem('directorschools',JSON.stringify(responseData?.data?.directorschools));
      // set currentUser 
      setUserRole(role);
      setCurrentUser(responseData?.data?.user) // user base on the role 
      setIsAuthenticated(true);

      setCurrentView(nextView);
      setPageLoading(false)

      // Save Session
    const session: SessionData = {
        role,
        user: responseData?.data?.user,
        school : initialSchool,
        timestamp: Date.now()
    };
    localStorage.setItem('session', JSON.stringify(session));
    }, 2000);

  };



  const handleSelectSchool = (schoolId: string) => {
    const school = schools.find(s => s?.id === schoolId);
    if (school) {
      setSelectedSchool(school);
      setCurrentView(ViewState.DASHBOARD);
      
      // Update session with school selection
      const stored = localStorage.getItem('session');
      if (stored) {
          const session = JSON.parse(stored);
          session.school = school;
          localStorage.setItem('session', JSON.stringify(session));
      }
    }
  };

  const handleLogout = () => {
    setPageLoading(true)
    setTimeout(() => {
      localStorage.removeItem('session');
      localStorage.removeItem('a_token');
      localStorage.removeItem('r_token');
      localStorage.removeItem('directorschools');
      setIsAuthenticated(false);
      setCurrentUser(null);
      setSelectedSchool(null);
      setCurrentView(ViewState.LOGIN); 
      setUserRole('director'); // Reset role 
      setPageLoading(false)
    }, 3000);
  };

  // Router
  const renderView = () => {
    switch (currentView) {

      case ViewState.LOGIN:
        return (
          <AuthLayout>
              <LoginForm onNavigate={handleNavigate} onLogin={handleLogin} />
          </AuthLayout>
        );

      case ViewState.REGISTER:
        return (
          <AuthLayout>
                <RegisterForm onNavigate={handleNavigate} onLogin={handleLogin} />
          </AuthLayout>
        );

      case ViewState.VERIFY:
        return (
          <AuthLayout>
                <VerificationForm email={userEmail || 'user@example.com'} onNavigate={handleNavigate} />
          </AuthLayout>
        );

      case ViewState.FORGOT_PASSWORD:
        return (
            <AuthLayout>
                <ForgotPassword onNavigate={handleNavigate} />
            </AuthLayout>
        );
      case ViewState.SELECT_SCHOOL:
        return (
           <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
               <div className="w-full max-w-5xl">
                  <ProtectedRoute>
                    <SchoolSelection 
                          onNavigate={handleNavigate} 
                          onSelectSchool={handleSelectSchool} 
                          schools={schools} 
                    />
                  </ProtectedRoute>
               </div>
           </div>
        );
      case ViewState.DASHBOARD:
        return (
            <DashboardLayout>
              <ProtectedRoute>
                {selectedSchool && (
                    <Dashboard school={selectedSchool} userRole={userRole} onLogout={handleLogout} />
                )}
              </ProtectedRoute>
            </DashboardLayout>
        );
      default:
        return <div>View not found</div>;
    }
  };
 
  return renderView();
};

export default App;
