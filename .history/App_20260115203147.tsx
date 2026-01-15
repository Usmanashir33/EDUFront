
import React, { useState, useEffect } from 'react';
import { ViewState, School, UserRole, SessionData } from './types';
import { LoginForm } from './views/LoginForm';
import { RegisterForm } from './views/RegisterForm';
import { VerificationForm } from './views/VerificationForm';
import { SchoolSelection } from './views/SchoolSelection';
import { ForgotPassword } from './views/ForgotPassword';
import { Dashboard } from './views/DirectorDashboard';

// Mock Schools Data moved outside for accessibility
const schools: School[] = [
  {
    id: '1',
    name: 'AUA Te',
    address: '123 Education Lane, Knowledge City',
    studentCount: 1250,
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
  },
  {
    id: '2',
    name: 'Riverside International School',
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
const AuthLayout = ({ children }: { children?: React.ReactNode }) => (
  <div className="min-h-screen bg-navy-50 flex items-center justify-center p-4">
    <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
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

      {/* Right Side: Form Card */}
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="h-2 bg-gradient-to-r from-navy-900 via-navy-700 to-gold-500"></div>
          <div className="p-8">
              {children}
          </div>
      </div>
    </div>
  </div>
);

// Layout for Dashboard (Full Screen)
const DashboardLayout = ({ children }: { children?: React.ReactNode }) => (
  <div className="min-h-screen bg-navy-50">
    {children}
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [userEmail, setUserEmail] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('director');

  // --- SESSION PERSISTENCE ---
  useEffect(() => {
    const storedSession = localStorage.getItem('eduPortal_session');
    if (storedSession) {
        try {
            const session: SessionData = JSON.parse(storedSession);
            setUserRole(session.role);
            
            // Check expiry (e.g. 24 hours) - Mock implementation
            if (Date.now() - session.timestamp > 86400000) {
                localStorage.removeItem('eduPortal_session');
                return;
            }

            if (session.schoolId) {
                const school = schools.find(s => s.id === session.schoolId);
                if (school) {
                    setSelectedSchool(school);
                    setCurrentView(ViewState.DASHBOARD);
                } else if (session.role === 'director') {
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
            localStorage.removeItem('eduPortal_session');
        }
    }
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
  };

  const handleLogin = (mode: 'director' | 'academic', id: string) => {
    let role: UserRole = 'director';
    let nextView = ViewState.SELECT_SCHOOL;
    let initialSchool: School | null = null;

    if (mode === 'director') {
        // Directors & Parents go to School Selection
        role = 'director';
        nextView = ViewState.SELECT_SCHOOL;
    } else {
        // Students & Staff go DIRECTLY to Dashboard
        // Mock logic to determine role based on ID prefix
        const cleanId = id.toUpperCase();
        role = 'student';
        if (cleanId.startsWith('TEA')) role = 'teacher';
        else if (cleanId.startsWith('STF')) role = 'staff';
        
        // Mock: Assign them to the first school automatically since their ID is unique to a school
        initialSchool = schools[0];
        nextView = ViewState.DASHBOARD;
    }

    setUserRole(role);
    setSelectedSchool(initialSchool);
    setCurrentView(nextView);

    // Save Session
    const session: SessionData = {
        role,
        userId: id,
        schoolId: initialSchool?.id,
        timestamp: Date.now()
    };
    localStorage.setItem('eduPortal_session', JSON.stringify(session));
  };

  const handleRegisterSuccess = (email: string) => {
    setUserEmail(email);
    setCurrentView(ViewState.VERIFY);
  };

  const handleSelectSchool = (schoolId: string) => {
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      setSelectedSchool(school);
      setCurrentView(ViewState.DASHBOARD);
      
      // Update session with school selection
      const stored = localStorage.getItem('eduPortal_session');
      if (stored) {
          const session = JSON.parse(stored);
          session.schoolId = schoolId;
          localStorage.setItem('eduPortal_session', JSON.stringify(session));
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('eduPortal_session');
    setSelectedSchool(null);
    setCurrentView(ViewState.LOGIN);
    setUserRole('director'); // Reset role
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
            <RegisterForm onNavigate={handleNavigate} onRegisterSuccess={handleRegisterSuccess} />
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
                   <SchoolSelection 
                        onNavigate={handleNavigate} 
                        onSelectSchool={handleSelectSchool} 
                        schools={schools} 
                    />
               </div>
           </div>
        );
      case ViewState.DASHBOARD:
        return (
            <DashboardLayout>
                {selectedSchool && (
                    <Dashboard school={selectedSchool} userRole={userRole} onLogout={handleLogout} />
                )}
            </DashboardLayout>
        );
      default:
        return <div>View not found</div>;
    }
  };

  return renderView();
};

export default App;
