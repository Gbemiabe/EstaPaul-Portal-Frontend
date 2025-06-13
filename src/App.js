// frontend/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import './App.css';

// Import your dashboard components
import StudentDashboard from './StudentDashboard';
import TeacherDashboard from './TeacherDashboard';
import AdminDashboard from './AdminDashboard';
import ForgotPasswordRequest from './ForgotPasswordRequest'; // Assuming it's in the same directory or adjust path
import ResetPassword from './ResetPassword'; // Assuming it's in the same directory or adjust path


// URL for the backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';


const CLASS_ORDER = [
  'Creche', 'KG 1', 'KG 2', 'Nursery 1', 'Nursery 2', 'Primary 1',
  'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'JSS 1',
  'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3'
];

// ALL_CLASSES directly use CLASS_ORDER
const ALL_CLASSES = [...CLASS_ORDER];

// Define terms and a plausible range of sessions
const TERMS = ['1st', '2nd', '3rd'];
const getCurrentYear = () => new Date().getFullYear();
const generateSessions = () => {
    const currentYear = getCurrentYear();
    const sessions = [];
    // Generate current year, 2 past, 2 future, formatted asYYYY/YYYY+1
    for (let i = -2; i <= 2; i++) {
        const startYear = currentYear + i;
        sessions.push(`${startYear}/${startYear + 1}`);
    }
    return sessions;
};
const ALL_SESSIONS = generateSessions();


function AdmissionsPage() {
  return (
    <div className="page-content">
      <h2>Admissions Process</h2>
      <div className="info-block">
        <p>Learn about our requirements, deadlines, and how to apply.</p>
      </div>
    </div>
  );
}

function ContactUsPage() {
  return (
    <div className="page-content">
      <h2>Contact Information</h2>
      <div className="info-block">
        <p>We'd love to hear from you. Reach out with any questions or concerns.</p>
      </div>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="page-content">
      <h2>404 - Page Not Found</h2>
      <p>The page you are looking for does not exist.</p>
    </div>
  );
}

const FloatingElements = () => {
  return (
    <>
      <div className="floating-element" style={{
        width: '300px',
        height: '300px',
        background: 'linear-gradient(135deg, rgba(255,126,95,0.1) 0%, rgba(254,180,123,0.1) 100%)',
        top: '10%',
        left: '5%'
      }}></div>
      <div className="floating-element" style={{
        width: '200px',
        height: '200px',
        background: 'linear-gradient(135deg, rgba(26,44,91,0.1) 0%, rgba(46,77,150,0.1) 100%)',
        bottom: '15%',
        right: '10%'
      }}></div>
    </>
  );
};

const Navigation = () => {
  const location = useLocation();

  return (
    <nav>
      <ul>
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
        </li>
        <li>
          <Link to="/login" className={location.pathname === '/login' ? 'active' : ''}>Login</Link>
        </li>
        <li>
          <Link to="/register" className={location.pathname === '/register' ? 'active' : ''}>Register</Link>
        </li>
        <li>
          <Link to="/admissions" className={location.pathname === '/admissions' ? 'active' : ''}>Admissions</Link>
        </li>
        <li>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>Contact Us</Link>
        </li>
      </ul>
    </nav>
  );
};

// Separate the main app logic from the Router wrapper
function AppContent() {
  const [scrolled, setScrolled] = useState(false);
  // State to manage authenticated user and their token
  const [user, setUser] = useState(null); // Stores user object from backend (e.g., {id, full_name, role, email/student_id})
  const [token, setToken] = useState(localStorage.getItem('userToken') || null); // Auth token from localStorage
  const [loadingUser, setLoadingUser] = useState(true); // Loading state for initial user verification
  const navigate = useNavigate(); // Hook for programmatic navigation - now inside Router context

  // Effect to handle scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Effect to verify token and load user details on app load
  useEffect(() => {
    console.log('useEffect triggered, current token:', token);
    const loadUser = async () => {
      if (token) {
        console.log('Verifying token:', token);
        try {
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          console.log('Auth response status:', response.status);
          if (response.ok) {
            const userData = await response.json();
            console.log('User data received:', userData);
            setUser(userData); // Set the user object
          } else {
            // Token is invalid or expired, clear it
            console.log('Auth failed, logging out');
            handleLogout();
          }
        } catch (error) {
          console.error("Failed to load user:", error);
          handleLogout(); // Clear token on network/parsing errors
        } finally {
          setLoadingUser(false);
        }
      } else {
        console.log('No token found, setting loading to false');
        setLoadingUser(false); // No token, no loading needed
      }
    };
    loadUser();
  }, [token]); // Re-run if token changes

  // Function to handle successful login from LoginPage
  const handleLoginSuccess = (loggedInUser, authToken) => {
    console.log('handleLoginSuccess called with:', { loggedInUser, authToken });
    setUser(loggedInUser);
    setToken(authToken);
    localStorage.setItem('userToken', authToken);
    localStorage.setItem('userDetails', JSON.stringify(loggedInUser)); // Store user details in localStorage

    console.log('About to navigate to dashboard for role:', loggedInUser.role);

    // Redirect to appropriate dashboard based on role
    switch (loggedInUser.role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'student':
        navigate('/student-dashboard');
        break;
      case 'teacher':
        navigate('/teacher-dashboard');
        break;
      default:
        navigate('/'); // Fallback to home or a generic dashboard
        break;
    }
  };

  // Function to handle logout from any dashboard
  const handleLogout = () => {
    console.log('handleLogout called');
    setUser(null);
    setToken(null);
    localStorage.removeItem('userToken');
    localStorage.removeItem('userDetails');
    navigate('/login'); // Redirect to login page after logout
  };

  if (loadingUser) {
    console.log('Still loading user...');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-xl text-gray-700">Loading application data...</p>
      </div>
    );
  }

  console.log('Rendering app with user:', user);

  return (
    <div className={`App ${scrolled ? 'scrolled' : ''}`}>
      <FloatingElements />
      <header className="App-header">
        <h1>ESTAPAUL SCHOOL</h1>
        <p className="tagline">Excellence in Education Since 2010</p>
        <Navigation />
      </header>

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          {/* Pass the handleLoginSuccess callback to the LoginPage */}
          <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admissions" element={<AdmissionsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />

          {/* New password recovery routes */}
          <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Conditional routes for dashboards */}
          {user && user.role === 'student' && (
            <Route
              path="/student-dashboard"
              element={<StudentDashboard studentUser={user} onLogout={handleLogout} token={token} />}
            />
          )}
          {user && user.role === 'teacher' && (
            <Route
              path="/teacher-dashboard"
              element={<TeacherDashboard teacherUser={user} onLogout={handleLogout} token={token} />}
            />
          )}
          {user && user.role === 'admin' && (
            <Route
              path="/admin-dashboard"
              element={<AdminDashboard
                           adminUser={user}
                           onLogout={handleLogout}
                           token={token}
                           allClasses={ALL_CLASSES} // Pass constants to AdminDashboard
                           allSessions={ALL_SESSIONS} // Pass constants to AdminDashboard
                         />}
            />
          )}

          {/* Catch-all route for 404 Not Found pages */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer>
        <p>&copy; {new Date().getFullYear()} ESTAPAUL Group of Schools. All rights reserved.</p>
      </footer>
    </div>
  );
}

// Main App component that wraps AppContent with Router
function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
