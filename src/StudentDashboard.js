import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUserGraduate, FaPoll, FaBell, FaCalendarCheck, FaFilePdf, FaSignOutAlt 
} from 'react-icons/fa';
import './StudentDashboard.css';

// Constants for terms and sessions
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

// Base URL for backend API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

function StudentDashboard({ studentUser, onLogout, token }) {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('results');

    const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
    const [selectedSession, setSelectedSession] = useState(ALL_SESSIONS[0]);

    const [profile, setProfile] = useState(null);
    const [academicResults, setAcademicResults] = useState([]);
    const [psychomotorSkills, setPsychomotorSkills] = useState({});
    
    const [cumulativeData, setCumulativeData] = useState({
        firstTermOverallTotalScore: 'N/A',
        secondTermOverallTotalScore: 'N/A',
        cumulativeAveragePercentage: 'N/A',
    });

    const [overallPerformance, setOverallPerformance] = useState({
        totalObtainable: 0,
        totalScored: 0,
        percentage: 0,
        classAverage: 'N/A',
        gradeOfPercentage: 'N/A',
        positionInClass: 'N/A',
        teacherComment: '',
        headTeacherComment: '',
    });

    const [notifications, setNotifications] = useState([]);
    const [fetchNotificationsLoading, setFetchNotificationsLoading] = useState(false);
    const [fetchNotificationsError, setFetchNotificationsError] = useState('');
    const [showNotificationDetails, setShowNotificationDetails] = useState(null);

    const [attendanceData, setAttendanceData] = useState(null);
    const [fetchAttendanceLoading, setFetchAttendanceLoading] = useState(false);
    const [fetchAttendanceError, setFetchAttendanceError] = useState('');

    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState('');

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

    const fetchStudentProfile = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_BASE_URL}/student/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch student profile');
            }
            const data = await response.json();
            setProfile(data.student);
        } catch (err) {
            console.error('Error fetching student profile:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const fetchStudentResults = useCallback(async () => {
        if (!profile || !selectedTerm || !selectedSession) return;
        setLoading(true);
        setError('');
        try {
            const encodedTerm = encodeURIComponent(selectedTerm);
            const encodedSession = encodeURIComponent(selectedSession);
            const response = await fetch(`${API_BASE_URL}/student/results/${encodedTerm}/${encodedSession}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch results');
            }
            const data = await response.json();
            setAcademicResults(data.academicResults || []);
            setPsychomotorSkills(data.psychomotor || {});
            setCumulativeData(data.cumulativeData || { 
                firstTermOverallTotalScore: 'N/A', 
                secondTermOverallTotalScore: 'N/A', 
                cumulativeAveragePercentage: 'N/A' 
            });
            setOverallPerformance(data.overallPerformance || {
                totalObtainable: 0, totalScored: 0, percentage: 0, classAverage: 'N/A',
                gradeOfPercentage: 'N/A', positionInClass: 'N/A', teacherComment: '', headTeacherComment: ''
            });
            setAttendanceData(data.attendance || null);
        } catch (err) {
            console.error('Error fetching student results:', err);
            setError(err.message);
            setAcademicResults([]);
            setPsychomotorSkills({});
            setCumulativeData({ firstTermOverallTotalScore: 'N/A', secondTermOverallTotalScore: 'N/A', cumulativeAveragePercentage: 'N/A' });
            setOverallPerformance({
                totalObtainable: 0, totalScored: 0, percentage: 0, classAverage: 'N/A',
                gradeOfPercentage: 'N/A', positionInClass: 'N/A', teacherComment: '', headTeacherComment: ''
            });
            setAttendanceData(null);
        } finally {
            setLoading(false);
        }
    }, [profile, selectedTerm, selectedSession, token]);

    const fetchStudentNotifications = useCallback(async () => {
        setFetchNotificationsLoading(true);
        setFetchNotificationsError('');
        try {
            const response = await fetch(`${API_BASE_URL}/student/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to fetch notifications');
            }
            const data = await response.json();
            setNotifications(data.notifications || []);
        } catch (err) {
            console.error('Error fetching student notifications:', err);
            setFetchNotificationsError(err.message);
            setNotifications([]);
        } finally {
            setFetchNotificationsLoading(false);
        }
    }, [token]);

    const handleMarkAsRead = useCallback(async (notificationId) => {
        const confirmRead = await customConfirm('Mark this notification as read?');
        if (!confirmRead) return;
        try {
            const response = await fetch(`${API_BASE_URL}/student/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to mark notification as read');
            }
            fetchStudentNotifications();
        } catch (err) {
            console.error('Error marking notification as read:', err);
            setError(err.message);
        }
    }, [token, fetchStudentNotifications, customConfirm]);

    const fetchStudentAttendance = useCallback(async () => {
        if (!profile || !selectedTerm || !selectedSession) return;
        setFetchAttendanceLoading(true);
        setFetchAttendanceError('');
        try {
            const encodedTerm = encodeURIComponent(selectedTerm);
            const encodedSession = encodeURIComponent(selectedSession);
            const response = await fetch(`${API_BASE_URL}/student/attendance/${encodedTerm}/${encodedSession}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorData = await response.json();
                if (response.status === 200 && errorData.attendance === null) {
                    setAttendanceData(null);
                    setFetchAttendanceError(errorData.message);
                } else {
                    throw new Error(errorData.message || 'Failed to fetch attendance data');
                }
            } else {
                const data = await response.json();
                setAttendanceData(data.attendance);
            }
        } catch (err) {
            console.error('Error fetching student attendance:', err);
            setFetchAttendanceError(err.message);
            setAttendanceData(null);
        } finally {
            setFetchAttendanceLoading(false);
        }
    }, [profile, selectedTerm, selectedSession, token]);

    const handleDownloadResult = useCallback(async () => {
        setExportLoading(true);
        setExportError('');
        if (!selectedTerm || !selectedSession) {
            setExportError('Please select a Term and Session to download results.');
            setExportLoading(false);
            return;
        }
        try {
            const encodedTerm = encodeURIComponent(selectedTerm);
            const encodedSession = encodeURIComponent(selectedSession);
            const apiUrl = `${API_BASE_URL}/student/export-result/${encodedTerm}/${encodedSession}`;
            const response = await fetch(apiUrl, { headers: { 'Authorization': `Bearer ${token}` } });
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
            let filename = `Student_Result_${selectedTerm}_${selectedSession}.pdf`;
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
        } catch (err) {
            console.error('Error downloading result PDF:', err);
            setExportError(err.message);
        } finally {
            setExportLoading(false);
        }
    }, [selectedTerm, selectedSession, token]);

    useEffect(() => {
        fetchStudentProfile();
    }, [fetchStudentProfile]);

    useEffect(() => {
        if (profile) {
            if (activeTab === 'results') {
                fetchStudentResults();
            } else if (activeTab === 'notifications') {
                fetchStudentNotifications();
            } else if (activeTab === 'attendance') {
                fetchStudentAttendance();
            }
        }
    }, [profile, selectedTerm, selectedSession, activeTab, fetchStudentResults, fetchStudentNotifications, fetchStudentAttendance]);

    const handleTermChange = (e) => setSelectedTerm(e.target.value);
    const handleSessionChange = (e) => setSelectedSession(e.target.value);

    useEffect(() => {
        const clearError = setTimeout(() => setError(''), 5000);
        const clearExportError = setTimeout(() => setExportError(''), 5000);
        const clearFetchNotificationsError = setTimeout(() => setFetchNotificationsError(''), 5000);
        const clearFetchAttendanceError = setTimeout(() => setFetchAttendanceError(''), 5000);
        return () => {
            clearTimeout(clearError);
            clearTimeout(clearExportError);
            clearTimeout(clearFetchNotificationsError);
            clearTimeout(clearFetchAttendanceError);
        };
    }, [error, exportError, fetchNotificationsError, fetchAttendanceError]);

    if (loading && !profile) {
        return <div className="dashboard-loading">Loading Student Dashboard...</div>;
    }

    if (error && !profile) {
        return (
            <div className="dashboard-error">
                <div className="alert error">Error: {error}</div>
                <button onClick={onLogout} className="logout-button"><FaSignOutAlt /> Logout</button>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="dashboard-error">
                <div className="alert error">Student data not available. Please log in again.</div>
                <button onClick={onLogout} className="logout-button"><FaSignOutAlt /> Logout</button>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>Student Dashboard</h1>
                    <div className="user-info">
                        <span>Welcome, {profile.full_name} ({profile.student_id})</span>
                        <button onClick={onLogout} className="logout-button">
                            <FaSignOutAlt /> Logout
                        </button>
                    </div>
                </div>
            </header>

            <nav className="dashboard-nav">
                <button
                    onClick={() => setActiveTab('results')}
                    className={`nav-tab ${activeTab === 'results' ? 'active' : ''}`}
                >
                    <FaPoll /> Results
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`nav-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                >
                    <FaBell /> Notifications
                    {notifications.filter(n => !n.is_read).length > 0 && (
                        <span className="notification-badge">
                            {notifications.filter(n => !n.is_read).length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('attendance')}
                    className={`nav-tab ${activeTab === 'attendance' ? 'active' : ''}`}
                >
                    <FaCalendarCheck /> Attendance
                </button>
            </nav>

            <main className="dashboard-main">
                {error && <div className="alert error">{error}</div>}
                {exportError && <div className="alert error">{exportError}</div>}
                {fetchNotificationsError && <div className="alert error">{fetchNotificationsError}</div>}
                {fetchAttendanceError && <div className="alert error">{fetchAttendanceError}</div>}

                <div className="card profile-card">
                    <h2><FaUserGraduate /> Profile</h2>
                    <div className="profile-content">
                        {profile.profile_picture ? (
                            <img
                                src={profile.profile_picture}
                                alt={`${profile.full_name}'s profile`}
                                className="profile-picture"
                                onError={(e) => { e.target.src = "https://placehold.co/96x96/cccccc/000000?text=NO+PIC"; }}
                            />
                        ) : (
                            <div className="avatar">{profile.full_name.charAt(0)}</div>
                        )}
                        <div className="profile-details">
                            <p><strong>Name:</strong> {profile.full_name}</p>
                            <p><strong>Student ID:</strong> {profile.student_id}</p>
                            <p><strong>Class:</strong> {profile.class}</p>
                            <p><strong>Gender:</strong> {profile.gender}</p>
                            <p><strong>Status:</strong> 
                                <span className={`status ${profile.is_active ? 'active' : 'inactive'}`}>
                                    {profile.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>

                {activeTab === 'results' && (
                    <div className="card">
                        <h2><FaPoll /> View Results</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="selectTerm">Select Term</label>
                                <select id="selectTerm" value={selectedTerm} onChange={handleTermChange}>
                                    {TERMS.map((term) => (
                                        <option key={term} value={term}>{term}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="selectSession">Select Session</label>
                                <select id="selectSession" value={selectedSession} onChange={handleSessionChange}>
                                    {ALL_SESSIONS.map((session) => (
                                        <option key={session} value={session}>{session}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button onClick={handleDownloadResult} className="action-button" disabled={exportLoading}>
                            <FaFilePdf /> {exportLoading ? 'Generating PDF...' : 'Download Result PDF'}
                        </button>
                        {loading ? (
                            <p>Loading results...</p>
                        ) : (
                            <>
                                {academicResults.length > 0 || Object.keys(psychomotorSkills).length > 0 || attendanceData ? (
                                    <>
                                        {academicResults.length > 0 && (
                                            <div className="table-container">
                                                <h3>Academic Performance</h3>
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Subject</th>
                                                            <th>PT1</th>
                                                            <th>PT2</th>
                                                            <th>PT3</th>
                                                            <th>Avg PT</th>
                                                            <th>Exam</th>
                                                            <th>Total</th>
                                                            {selectedTerm !== '1st' && <th>1st Term Total</th>}
                                                            {selectedTerm === '3rd' && <th>2nd Term Total</th>}
                                                            <th>Cum Avg (Subj)</th>
                                                            <th>Class Avg (Subj)</th>
                                                            <th>Grade</th>
                                                            <th>Remark</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {academicResults.map((result, index) => (
                                                            <tr key={index} className={index % 2 === 0 ? 'even' : 'odd'}>
                                                                <td>{result.subject_name}</td>
                                                                <td>{result.pt1}</td>
                                                                <td>{result.pt2}</td>
                                                                <td>{result.pt3}</td>
                                                                <td>{result.avg_pt}</td>
                                                                <td>{result.exam}</td>
                                                                <td>{result.total_score}</td>
                                                                {selectedTerm !== '1st' && (
                                                                    <td>{result.first_term_subject_total || 'N/A'}</td>
                                                                )}
                                                                {selectedTerm === '3rd' && (
                                                                    <td>{result.second_term_subject_total || 'N/A'}</td>
                                                                )}
                                                                <td>{result.cumulative_subject_average || 'N/A'}</td>
                                                                <td>{result.subject_class_average || 'N/A'}</td>
                                                                <td>{result.grade}</td>
                                                                <td>{result.remark}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                        {Object.keys(psychomotorSkills).length > 0 && (
                                            <div className="psychomotor-grid">
                                                <h3>Psychomotor Skills</h3>
                                                <div className="grid">
                                                    {Object.entries(psychomotorSkills).map(([skill, score]) => (
                                                        <div key={skill} className="psychomotor-item">
                                                            <span>{skill.replace(/_/g, ' ')}:</span>
                                                            <span>{score}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {attendanceData && (
                                            <div className="attendance-card">
                                                <h3>Attendance Summary</h3>
                                                <div className="grid">
                                                    <div className="attendance-item">
                                                        <span>Total Days School Opened:</span>
                                                        <span>{attendanceData.days_opened}</span>
                                                    </div>
                                                    <div className="attendance-item">
                                                        <span>Days Present:</span>
                                                        <span>{attendanceData.days_present}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="performance-summary">
                                            <h3>Overall Performance Summary</h3>
                                            <div className="grid">
                                                <div className="performance-card">
                                                    <h4>Current Term Score Summary</h4>
                                                    <p>Total Score Obtained: <strong>{overallPerformance.totalScored}</strong></p>
                                                    <p>Total Score Obtainable: <strong>{overallPerformance.totalObtainable}</strong></p>
                                                    <p>Percentage: <strong>{overallPerformance.percentage}%</strong></p>
                                                    <p>Grade: <strong>{overallPerformance.gradeOfPercentage}</strong></p>
                                                </div>
                                                <div className="performance-card">
                                                    <h4>Class Performance & Position</h4>
                                                    <p>Class Average: <strong>{overallPerformance.classAverage}</strong></p>
                                                    <p>Position in Class: <strong>{overallPerformance.positionInClass}</strong></p>
                                                </div>
                                                {selectedTerm !== '1st' && (
                                                    <div className="performance-card">
                                                        <h4>Overall Cumulative Term Averages</h4>
                                                        {selectedTerm === '2nd' && (
                                                            <p>1st Term Overall Total Score: <strong>{cumulativeData.firstTermOverallTotalScore || 'N/A'}</strong></p>
                                                        )}
                                                        {selectedTerm === '3rd' && (
                                                            <>
                                                                <p>1st Term Overall Total Score: <strong>{cumulativeData.firstTermOverallTotalScore || 'N/A'}</strong></p>
                                                                <p>2nd Term Overall Total Score: <strong>{cumulativeData.secondTermOverallTotalScore || 'N/A'}</strong></p>
                                                            </>
                                                        )}
                                                        <p>Cumulative Average: <strong>{cumulativeData.cumulativeAveragePercentage || 'N/A'}%</strong></p>
                                                    </div>
                                                )}
                                                <div className="comment-card">
                                                    <p><strong>Teacher's Comment:</strong> {overallPerformance.teacherComment}</p>
                                                </div>
                                                <div className="comment-card">
                                                    <p><strong>Head Teacher's Comment:</strong> {overallPerformance.headTeacherComment}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <p>No results, psychomotor data, or attendance available for {selectedTerm} Term, {selectedSession} Session.</p>
                                )}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'notifications' && (
                    <div className="card">
                        <h2><FaBell /> Your Notifications</h2>
                        {fetchNotificationsLoading ? (
                            <p>Loading notifications...</p>
                        ) : fetchNotificationsError ? (
                            <div className="alert error">{fetchNotificationsError}</div>
                        ) : notifications.length === 0 ? (
                            <p>No notifications found.</p>
                        ) : (
                            <div className="notification-list">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                                        onClick={() => setShowNotificationDetails(notification)}
                                    >
                                        <div className="notification-header">
                                            <h4>{notification.subject}</h4>
                                            <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <p>{notification.message_body}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {showNotificationDetails && (
                            <div className="modal">
                                <div className="modal-content">
                                    <h3>{showNotificationDetails.subject}</h3>
                                    <p>{showNotificationDetails.message_body}</p>
                                    <p><strong>Sent:</strong> {new Date(showNotificationDetails.created_at).toLocaleString()}</p>
                                    <p><strong>Status:</strong> {showNotificationDetails.is_read ? 'Read' : 'Unread'}</p>
                                    <div className="modal-actions">
                                        {!showNotificationDetails.is_read && (
                                            <button
                                                onClick={() => handleMarkAsRead(showNotificationDetails.id)}
                                                className="action-button"
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setShowNotificationDetails(null)}
                                            className="action-button"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="card">
                        <h2><FaCalendarCheck /> Your Attendance</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="attendanceTerm">Select Term</label>
                                <select id="attendanceTerm" value={selectedTerm} onChange={handleTermChange}>
                                    {TERMS.map((term) => (
                                        <option key={`att-${term}`} value={term}>{term}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="attendanceSession">Select Session</label>
                                <select id="attendanceSession" value={selectedSession} onChange={handleSessionChange}>
                                    {ALL_SESSIONS.map((session) => (
                                        <option key={`att-${session}`} value={session}>{session}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {fetchAttendanceLoading ? (
                            <p>Loading attendance data...</p>
                        ) : fetchAttendanceError ? (
                            <div className="alert error">{fetchAttendanceError}</div>
                        ) : attendanceData ? (
                            <div className="attendance-card">
                                <h3>Attendance Summary</h3>
                                <div className="grid">
                                    <div className="attendance-item">
                                        <span>Total Days School Opened:</span>
                                        <span>{attendanceData.days_opened}</span>
                                    </div>
                                    <div className="attendance-item">
                                        <span>Days Present:</span>
                                        <span>{attendanceData.days_present}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p>No attendance data available for {selectedTerm} Term, {selectedSession} Session.</p>
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

export default StudentDashboard;