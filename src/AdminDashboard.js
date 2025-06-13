import React, { useState, useEffect, useCallback } from 'react';
import { 
  FaUserPlus, FaUserGraduate, FaFilePdf, FaCog, FaPoll, 
  FaBullhorn, FaChartBar, FaSignOutAlt, FaSearch, FaTrash, FaCheckCircle 
} from 'react-icons/fa';
import './AdminDashboard.css';

const CLASS_ORDER = [
  'Creche', 'KG 1', 'KG 2', 'Nursery 1', 'Nursery 2', 'Primary 1',
  'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'JSS 1',
  'JSS 2', 'JSS 3', 'SS1', 'SS2', 'SS3' 
];

const ALL_CLASSES = [...CLASS_ORDER];
const TERMS = ['1st', '2nd', '3rd'];
const getCurrentYear = () => new Date().getFullYear();
const generateSessions = () => {
    const currentYear = getCurrentYear();
    const sessions = [];
    for (let i = -2; i <= 2; i++) {
        const startYear = currentYear + i;
        sessions.push(`${startYear}/${startYear + 1}`);
    }
    return sessions;
};
const ALL_SESSIONS = generateSessions();

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api'; 

function AdminDashboard({ adminUser, onLogout, token, allClasses, allSessions }) { 
  const [activeTab, setActiveTab] = useState('createUser'); 
  const [newUser, setNewUser] = useState({
    userType: 'student',
    student_id: '',
    email: '',
    password: '',
    full_name: '',
    gender: '',
    class: '',
    picture: null,
  });
  const [message, setMessage] = useState(''); 
  const [error, setError] = useState('');     
  const [loading, setLoading] = useState(false); 
  const [users, setUsers] = useState([]); 
  const [fetchUsersLoading, setFetchUsersLoading] = useState(true); 
  const [fetchUsersError, setFetchUsersError] = useState(''); 
  const [deleteLoadingId, setDeleteLoadingId] = useState(null); 
  const [showInactiveUsers, setShowInactiveUsers] = useState(false); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [results, setResults] = useState([]); 
  const [fetchResultsLoading, setFetchResultsLoading] = useState(true); 
  const [fetchResultsError, setFetchResultsError] = useState(''); 
  const [approveLoadingId, setApproveLoadingId] = useState(null); 
  const [promotionLoading, setPromotionLoading] = useState(false); 
  const [promotionMessage, setPromotionMessage] = useState(''); 
  const [promotionError, setPromotionError] = useState('');     
  const [exportClass, setExportClass] = useState(allClasses && allClasses.length > 0 ? allClasses[0] : ''); 
  const [exportTerm, setExportTerm] = useState(TERMS && TERMS.length > 0 ? TERMS[0] : ''); 
  const [exportSession, setExportSession] = useState(allSessions && allSessions.length > 0 ? allSessions[0] : ''); 
  const [exportLoading, setExportLoading] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const [exportError, setExportError] = useState('');
  const [notificationData, setNotificationData] = useState({
    recipientType: 'all',
    recipientClass: allClasses && allClasses.length > 0 ? allClasses[0] : '',
    recipientStudentId: '',
    subject: '',
    messageBody: ''
  });
  const [notificationSending, setNotificationSending] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationError, setNotificationError] = useState('');
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState('');

  const customConfirm = useCallback((message) => {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = "custom-confirm-modal";
      modal.innerHTML = `
        <div class="custom-confirm-content">
          <p>${message}</p>
          <div class="custom-confirm-buttons">
            <button id="cancelBtn">Cancel</button>
            <button id="confirmBtn">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('confirmBtn').onclick = () => {
        document.body.removeChild(modal);
        resolve(true);
      };
      document.getElementById('cancelBtn').onclick = () => {
        document.body.removeChild(modal);
        resolve(false);
      };
    });
  }, []); 

  useEffect(() => {
    setNewUser(prev => ({
      ...prev,
      class: (prev.userType === 'student' || prev.userType === 'teacher') ? (allClasses && allClasses.length > 0 ? allClasses[0] : '') : ''
    }));
    setExportClass(allClasses && allClasses.length > 0 ? allClasses[0] : '');
    setExportTerm(TERMS && TERMS.length > 0 ? TERMS[0] : '');
    setExportSession(allSessions && allSessions.length > 0 ? allSessions[0] : '');
    setNotificationData(prev => ({
      ...prev,
      recipientClass: allClasses && allClasses.length > 0 ? allClasses[0] : '' 
    }));
  }, [allClasses, allSessions]);

  useEffect(() => {
    const clearMessage = (setter) => setTimeout(() => setter(''), 5000);
    if (message) clearMessage(setMessage);
    if (error) clearMessage(setError);
    if (fetchUsersError) clearMessage(setFetchUsersError);
    if (fetchResultsError) clearMessage(setFetchResultsError);
    if (promotionMessage) clearMessage(setPromotionMessage);
    if (promotionError) clearMessage(setPromotionError);
    if (exportMessage) clearMessage(setExportMessage);
    if (exportError) clearMessage(setExportError);
    if (notificationMessage) clearMessage(setNotificationMessage);
    if (notificationError) clearMessage(setNotificationError);
    if (analysisError) clearMessage(setAnalysisError);
  }, [message, error, fetchUsersError, fetchResultsError, promotionMessage, promotionError, exportMessage, exportError, notificationMessage, notificationError, analysisError]);

  const fetchAllUsers = useCallback(async (includeInactive = false) => {
    setFetchUsersLoading(true);
    setFetchUsersError('');
    try {
      const url = `${API_BASE_URL}/admin/users${includeInactive ? '?includeInactive=true' : ''}`; 
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
      setFetchUsersError(err.message);
      setUsers([]); 
    } finally {
      setFetchUsersLoading(false);
    }
  }, [token]);

  const fetchAllResults = useCallback(async () => {
    setFetchResultsLoading(true);
    setFetchResultsError('');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/results`, { 
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch results');
      }
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      console.error('Error fetching results:', err);
      setFetchResultsError(err.message);
      setResults([]); 
    } finally {
      setFetchResultsLoading(false);
    }
  }, [token]);

  const fetchAnalysisData = useCallback(async () => {
    setAnalysisLoading(true);
    setAnalysisError('');
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analysis`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch analysis data');
      }
      const data = await response.json();
      setAnalysisData(data.analysis);
    } catch (err) {
      console.error('Error fetching analysis data:', err);
      setAnalysisError(err.message);
      setAnalysisData(null);
    } finally {
      setAnalysisLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchAllUsers(showInactiveUsers);
      fetchAllResults();
      if (activeTab === 'dataAnalysis') { 
          fetchAnalysisData();
      }
    }
  }, [token, showInactiveUsers, fetchAllUsers, fetchAllResults, activeTab, fetchAnalysisData]);

  const handleNewUserChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'picture') {
      setNewUser(prev => ({ ...prev, picture: files[0] }));
    } else if (name === 'userType') {
      const newType = value;
      setNewUser(prev => ({ 
        ...prev, 
        userType: newType,
        email: '', 
        student_id: '', 
        class: (newType === 'student' || newType === 'teacher') ? (allClasses && allClasses.length > 0 ? allClasses[0] : '') : '',
        picture: null
      }));
      const fileInput = document.getElementById('picture');
      if (fileInput) fileInput.value = ''; 
    }
    else {
      setNewUser(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(''); 
    setError(''); 

    try {
      const data = new FormData();
      data.append('userType', newUser.userType);
      data.append('full_name', newUser.full_name);
      data.append('gender', newUser.gender);
      data.append('password', newUser.password);

      if (newUser.userType === 'admin' || newUser.userType === 'teacher') {
        data.append('email', newUser.email);
      }
      if (newUser.userType === 'teacher' || newUser.userType === 'student') {
        data.append('class', newUser.class);
      }
      if (newUser.userType === 'student') {
        data.append('student_id', newUser.student_id);
        if (newUser.picture) {
          data.append('picture', newUser.picture);
        } else {
          setError('Student requires a profile picture.');
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`${API_BASE_URL}/admin/users`, { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: data,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create user');
      }

      const result = await response.json();
      setMessage(result.message); 
      
      setNewUser({
        userType: 'student', 
        student_id: '', 
        email: '', 
        password: '',
        full_name: '', 
        gender: '', 
        class: allClasses && allClasses.length > 0 ? allClasses[0] : '', 
        picture: null,
      });
      const fileInput = document.getElementById('picture');
      if (fileInput) fileInput.value = ''; 

      fetchAllUsers(showInactiveUsers);

    } catch (err) {
      console.error('Error creating user:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    const confirmDelete = await customConfirm(`Are you sure you want to delete user: ${userName}? This action cannot be undone.`);
    if (!confirmDelete) return;

    setDeleteLoadingId(userId); 
    setMessage(''); 
    setError('');   

    try {
      if (adminUser.id === userId) {
          setError('Admins cannot delete their own account through this endpoint.');
          setDeleteLoadingId(null);
          return;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user');
      }

      const result = await response.json();
      setMessage(result.message);
      fetchAllUsers(showInactiveUsers);
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message);
    } finally {
      setDeleteLoadingId(null); 
    }
  };

  const handleApproveResult = async (resultId, studentName, subjectName) => {
    const confirmApprove = await customConfirm(`Are you sure you want to approve the result for ${studentName} - ${subjectName}?`);
    if (!confirmApprove) return;

    setApproveLoadingId(resultId); 
    setMessage(''); 
    setError('');   

    try {
      const response = await fetch(`${API_BASE_URL}/admin/results/${resultId}/approve`, { 
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve result');
      }

      const result = await response.json();
      setMessage(result.message);
      fetchAllResults();
    } catch (err) {
      console.error('Error approving result:', err);
      setError(err.message);
    } finally {
      setApproveLoadingId(null); 
    }
  };

  const handlePromoteStudents = async () => {
    const confirmPromotion = await customConfirm(
      'Are you sure you want to promote all eligible students to their next class? SS3 students will be graduated.'
    );
    if (!confirmPromotion) return;

    setPromotionLoading(true);
    setPromotionMessage('');
    setPromotionError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/promote-students`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}), 
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to promote students');
      }

      const result = await response.json();
      setPromotionMessage(
        `${result.message} Promoted: ${result.promotedCount}, Graduated: ${result.graduatedCount}, Skipped: ${result.skippedCount}. ${result.details}`
      );

      fetchAllUsers(showInactiveUsers);
    } catch (err) {
      console.error('Error promoting students:', err);
      setPromotionError(err.message);
    } finally {
      setPromotionLoading(false);
    }
  };

  const toggleShowInactiveUsers = () => {
    setShowInactiveUsers((prev) => !prev);
  };

  const handleExportResults = async () => {
    setExportLoading(true);
    setExportMessage('');
    setExportError('');

    if (!exportClass || !exportTerm || !exportSession) {
      setExportError('Please select a Class, Term, and Session to export results.');
      setExportLoading(false);
      return;
    }

    try {
      const encodedClass = encodeURIComponent(exportClass);
      const encodedTerm = encodeURIComponent(exportTerm);
      const encodedSession = encodeURIComponent(exportSession);

      const apiUrl = `${API_BASE_URL}/admin/export-results/${encodedClass}/${encodedTerm}/${encodedSession}`; 
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
          const contentType = response.headers.get("content-type");
          let errorMessage = `HTTP error! status: ${response.status}`;

          if (contentType && contentType.includes("application/json")) {
              try {
                  const errorData = await response.json();
                  errorMessage = errorData.message || errorMessage;
              } catch (jsonParseError) {
                  const errorText = await response.text();
                  errorMessage = `${errorMessage}. Failed to parse JSON: ${jsonParseError.message}. Response: ${errorText.substring(0, 200)}...`;
              }
          } else {
              const errorText = await response.text();
              errorMessage = `${errorMessage}. Response: ${errorText.substring(0, 200)}...`; 
          }
          throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${exportClass}_${exportTerm}_${exportSession}_results.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\n"]*)['"]?;?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = decodeURIComponent(filenameMatch[1].replace(/\+/g, ' ')); 
        }
      }
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename; 
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setExportMessage('Results exported successfully!');

    } catch (err) {
      console.error('Error exporting results:', err);
      setExportError(err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleNotificationChange = (e) => {
    const { name, value } = e.target;
    setNotificationData(prev => ({ ...prev, [name]: value }));
  };

  const handleSendNotification = async (e) => {
    e.preventDefault();
    setNotificationSending(true);
    setNotificationMessage('');
    setNotificationError('');

    if (!notificationData.subject || !notificationData.messageBody) {
      setNotificationError('Subject and message body cannot be empty.');
      setNotificationSending(false);
      return;
    }
    if (notificationData.recipientType === 'class' && !notificationData.recipientClass) {
      setNotificationError('Please select a class for class-specific notifications.');
      setNotificationSending(false);
      return;
    }
    if (notificationData.recipientType === 'student' && !notificationData.recipientStudentId) {
      setNotificationError('Please enter a student ID for student-specific notifications.');
      setNotificationSending(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/send-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send notification');
      }

      const result = await response.json();
      setNotificationMessage(result.message);
      setNotificationData({
        recipientType: 'all',
        recipientClass: allClasses && allClasses.length > 0 ? allClasses[0] : '',
        recipientStudentId: '',
        subject: '',
        messageBody: ''
      });
    } catch (err) {
      console.error('Error sending notification:', err);
      setNotificationError(err.message);
    } finally {
      setNotificationSending(false);
    }
  };

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.role === 'student' ? user.student_id : user.email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {adminUser?.full_name} ({adminUser?.role})</span>
            <button onClick={onLogout} className="logout-button">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          onClick={() => setActiveTab('createUser')}
          className={`nav-tab ${activeTab === 'createUser' ? 'active' : ''}`}
        >
          <FaUserPlus /> Create User
        </button>
        <button
          onClick={() => setActiveTab('promoteStudents')}
          className={`nav-tab ${activeTab === 'promoteStudents' ? 'active' : ''}`}
        >
          <FaUserGraduate /> Promote Students
        </button>
        <button
          onClick={() => setActiveTab('exportResults')}
          className={`nav-tab ${activeTab === 'exportResults' ? 'active' : ''}`}
        >
          <FaFilePdf /> Export Results
        </button>
        <button
          onClick={() => setActiveTab('manageUsers')}
          className={`nav-tab ${activeTab === 'manageUsers' ? 'active' : ''}`}
        >
          <FaCog /> Manage Users
        </button>
        <button
          onClick={() => setActiveTab('manageResults')}
          className={`nav-tab ${activeTab === 'manageResults' ? 'active' : ''}`}
        >
          <FaPoll /> Manage Results
        </button>
        <button
          onClick={() => setActiveTab('sendNotification')}
          className={`nav-tab ${activeTab === 'sendNotification' ? 'active' : ''}`}
        >
          <FaBullhorn /> Send Notification
        </button>
        <button
          onClick={() => setActiveTab('dataAnalysis')}
          className={`nav-tab ${activeTab === 'dataAnalysis' ? 'active' : ''}`}
        >
          <FaChartBar /> Data Analysis
        </button>
      </nav>

      <main className="dashboard-main">
        {message && <div className="alert success">{message}</div>}
        {error && <div className="alert error">{error}</div>}

        {activeTab === 'createUser' && (
          <div className="card">
            <h2><FaUserPlus /> Create New User</h2>
            <form onSubmit={handleCreateUser} className="form-grid">
              <div className="form-group">
                <label htmlFor="userType">User Type</label>
                <select id="userType" name="userType" value={newUser.userType} onChange={handleNewUserChange}>
                  <option value="admin">Admin</option>
                  <option value="teacher">Teacher</option>
                  <option value="student">Student</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={newUser.full_name}
                  onChange={handleNewUserChange}
                  required
                  placeholder="Enter full name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={newUser.password}
                  onChange={handleNewUserChange}
                  required
                  placeholder="Enter password"
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select id="gender" name="gender" value={newUser.gender} onChange={handleNewUserChange} required>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              {(newUser.userType === 'admin' || newUser.userType === 'teacher') && (
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={newUser.email}
                    onChange={handleNewUserChange}
                    required
                    placeholder="Enter email"
                  />
                </div>
              )}
              {(newUser.userType === 'teacher' || newUser.userType === 'student') && (
                <div className="form-group">
                  <label htmlFor="class">Class</label>
                  <select id="class" name="class" value={newUser.class} onChange={handleNewUserChange} required>
                    <option value="">Select Class</option>
                    {allClasses.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              )}
              {newUser.userType === 'student' && (
                <>
                  <div className="form-group">
                    <label htmlFor="student_id">Student ID</label>
                    <input
                      type="text"
                      id="student_id"
                      name="student_id"
                      value={newUser.student_id}
                      onChange={handleNewUserChange}
                      required
                      placeholder="Enter student ID"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="picture">Profile Picture</label>
                    <input
                      type="file"
                      id="picture"
                      name="picture"
                      accept="image/*"
                      onChange={handleNewUserChange}
                      required
                    />
                  </div>
                </>
              )}
              <button type="submit" className="submit-button" disabled={loading}>
                {loading ? 'Creating User...' : `Create ${newUser.userType.charAt(0).toUpperCase() + newUser.userType.slice(1)}`}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'promoteStudents' && (
          <div className="card">
            <h2><FaUserGraduate /> Student Promotion</h2>
            <p>
              Promote all active students to their next class. SS3 students will be marked as 'Graduated' and become inactive.
            </p>
            {promotionMessage && <div className="alert success">{promotionMessage}</div>}
            {promotionError && <div className="alert error">{promotionError}</div>}
            <button onClick={handlePromoteStudents} className="action-button" disabled={promotionLoading}>
              {promotionLoading ? 'Promoting Students...' : 'Promote All Students'}
            </button>
          </div>
        )}

        {activeTab === 'exportResults' && (
          <div className="card">
            <h2><FaFilePdf /> Export Results (PDF)</h2>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="exportClass">Select Class</label>
                <select id="exportClass" value={exportClass} onChange={(e) => setExportClass(e.target.value)} required>
                  <option value="">Select Class</option>
                  {allClasses.map((cls) => (
                    <option key={`export-${cls}`} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="exportTerm">Select Term</label>
                <select id="exportTerm" value={exportTerm} onChange={(e) => setExportTerm(e.target.value)} required>
                  <option value="">Select Term</option>
                  {TERMS.map((term) => (
                    <option key={`export-${term}`} value={term}>{term}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="exportSession">Select Session</label>
                <select id="exportSession" value={exportSession} onChange={(e) => setExportSession(e.target.value)} required>
                  <option value="">Select Session</option>
                  {allSessions.map((session) => (
                    <option key={`export-${session}`} value={session}>{session}</option>
                  ))}
                </select>
              </div>
            </div>
            {exportMessage && <div className="alert success">{exportMessage}</div>}
            {exportError && <div className="alert error">{exportError}</div>}
            <button
              onClick={handleExportResults}
              className="action-button"
              disabled={exportLoading || !exportClass || !exportTerm || !exportSession}
            >
              {exportLoading ? 'Generating PDF...' : 'Export Results to PDF'}
            </button>
          </div>
        )}

        {activeTab === 'manageUsers' && (
          <div className="card">
            <h2><FaCog /> Manage Existing Users</h2>
            <div className="filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={showInactiveUsers}
                  onChange={toggleShowInactiveUsers}
                />
                Show Inactive / Graduated Students
              </label>
              <div className="search-container">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search by name or ID/email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            {fetchUsersLoading ? (
              <p>Loading users...</p>
            ) : fetchUsersError ? (
              <div className="alert error">Error fetching users: {fetchUsersError}</div>
            ) : filteredUsers.length === 0 ? (
              <p>No users found. Try adjusting your search or create new users.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th><FaUserPlus /> Name</th>
                      <th>Role</th>
                      <th>Identifier</th>
                      <th>Class</th>
                      <th>Gender</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, index) => (
                      <tr key={user.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                        <td className="user-name">
                          {user.profile_picture && user.role === 'student' ? (
                            <img
                              src={user.profile_picture}
                              alt={user.full_name}
                              onError={(e) => { e.target.src = "https://placehold.co/24x24/cccccc/000000?text=NA"; }}
                            />
                          ) : (
                            <div className="avatar">{user.full_name.charAt(0)}</div>
                          )}
                          {user.full_name}
                        </td>
                        <td>{user.role}</td>
                        <td>{user.role === 'student' ? user.student_id : user.email}</td>
                        <td>{user.class || 'N/A'}</td>
                        <td>{user.gender}</td>
                        <td>
                          <span className={`status ${user.is_active ? 'active' : 'inactive'}`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            className="delete-button"
                            disabled={deleteLoadingId === user.id || adminUser.id === user.id}
                          >
                            <FaTrash />
                            {deleteLoadingId === user.id ? 'Deleting...' : (adminUser.id === user.id ? 'Self' : 'Delete')}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'manageResults' && (
          <div className="card">
            <h2><FaPoll /> Manage Student Results</h2>
            {fetchResultsLoading ? (
              <p>Loading results...</p>
            ) : fetchResultsError ? (
              <div className="alert error">Error fetching results: {fetchResultsError}</div>
            ) : results.length === 0 ? (
              <p>No results found. Please ensure teachers have uploaded results.</p>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Term</th>
                      <th>Session</th>
                      <th>Total Score</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={result.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                        <td>{result.student_name} ({result.student_id})</td>
                        <td>{result.student_class}</td>
                        <td>{result.subject_name}</td>
                        <td>{result.term}</td>
                        <td>{result.session_name}</td>
                        <td>{result.total_score}</td>
                        <td>
                          <span className={`status ${result.is_approved ? 'active' : 'pending'}`}>
                            {result.is_approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td>
                          {!result.is_approved ? (
                            <button
                              onClick={() => handleApproveResult(result.id, result.student_name, result.subject_name)}
                              className="approve-button"
                              disabled={approveLoadingId === result.id}
                            >
                              <FaCheckCircle />
                              {approveLoadingId === result.id ? 'Approving...' : 'Approve'}
                            </button>
                          ) : (
                            <span className="approved">
                              <FaCheckCircle /> Approved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'sendNotification' && (
          <div className="card">
            <h2><FaBullhorn /> Send Notification</h2>
            {notificationMessage && <div className="alert success">{notificationMessage}</div>}
            {notificationError && <div className="alert error">{notificationError}</div>}
            <form onSubmit={handleSendNotification} className="form-grid">
              <div className="form-group">
                <label htmlFor="recipientType">Send To</label>
                <select id="recipientType" name="recipientType" value={notificationData.recipientType} onChange={handleNotificationChange}>
                  <option value="all">All Students</option>
                  <option value="class">Specific Class</option>
                  <option value="student">Specific Student (by ID)</option>
                </select>
              </div>
              {notificationData.recipientType === 'class' && (
                <div className="form-group">
                  <label htmlFor="recipientClass">Select Class</label>
                  <select
                    id="recipientClass"
                    name="recipientClass"
                    value={notificationData.recipientClass}
                    onChange={handleNotificationChange}
                    required
                  >
                    <option value="">Select Class</option>
                    {allClasses.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              )}
              {notificationData.recipientType === 'student' && (
                <div className="form-group">
                  <label htmlFor="recipientStudentId">Student ID</label>
                  <input
                    type="text"
                    id="recipientStudentId"
                    name="recipientStudentId"
                    value={notificationData.recipientStudentId}
                    onChange={handleNotificationChange}
                    placeholder="e.g., student-001"
                    required
                  />
                </div>
              )}
              <div className="form-group full-width">
                <label htmlFor="subject">Subject</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={notificationData.subject}
                  onChange={handleNotificationChange}
                  required
                  placeholder="Enter subject"
                />
              </div>
              <div className="form-group full-width">
                <label htmlFor="messageBody">Message</label>
                <textarea
                  id="messageBody"
                  name="messageBody"
                  rows="5"
                  value={notificationData.messageBody}
                  onChange={handleNotificationChange}
                  required
                  placeholder="Enter your message"
                />
              </div>
              <button type="submit" className="submit-button" disabled={notificationSending}>
                {notificationSending ? 'Sending Notification...' : 'Send Notification'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'dataAnalysis' && (
          <div className="card">
            <h2><FaChartBar /> Portal Data Analysis</h2>
            {analysisLoading ? (
              <p>Loading analysis data...</p>
            ) : analysisError ? (
              <div className="alert error">{analysisError}</div>
            ) : analysisData ? (
              <div className="analysis-grid">
                <div className="analysis-card">
                  <h3><FaUserPlus /> User Statistics</h3>
                  <p>Total Users: <strong>{analysisData.users.total}</strong></p>
                  <p>Admins: <strong>{analysisData.users.admins}</strong></p>
                  <p>Teachers: <strong>{analysisData.users.teachers}</strong></p>
                  <p>Students (Total): <strong>{analysisData.users.students}</strong></p>
                  <p>Active Students: <strong className="text-success">{analysisData.users.activeStudents}</strong></p>
                  <p>Inactive Students: <strong className="text-error">{analysisData.users.inactiveStudents}</strong></p>
                </div>
                <div className="analysis-card">
                  <h3><FaPoll /> Result Statistics</h3>
                  <p>Total Results: <strong>{analysisData.results.total}</strong></p>
                  <p>Approved: <strong className="text-success">{analysisData.results.approved}</strong></p>
                  <p>Pending: <strong className="text-warning">{analysisData.results.pending}</strong></p>
                  <p>Avg. Score: <strong>{analysisData.results.averageTotalScore}</strong></p>
                </div>
                <div className="analysis-card">
                  <h3><FaBullhorn /> Notification Statistics</h3>
                  <p>Total Sent: <strong>{analysisData.notifications.total}</strong></p>
                  <p>Read: <strong className="text-success">{analysisData.notifications.read}</strong></p>
                  <p>Unread: <strong className="text-error">{analysisData.notifications.unread}</strong></p>
                </div>
              </div>
            ) : (
              <p>No analysis data available.</p>
            )}
          </div>
        )}
      </main>

      <footer className="dashboard-footer">
        <p>© {new Date().getFullYear()} School Management System. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default AdminDashboard;