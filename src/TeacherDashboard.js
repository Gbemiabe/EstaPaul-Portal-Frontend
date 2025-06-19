import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChalkboardTeacher,
  FaUsers,
  FaBook,
  FaUpload,
  FaSignOutAlt,
  FaUserGraduate,
  FaCalendarAlt,
  FaSearch,
  FaPlus,
  FaArrowLeft,
  FaSpinner,
  FaChartBar,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
import './TeacherDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

function TeacherDashboard({ teacherUser, token }) {
  const navigate = useNavigate();
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [classStudents, setClassStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [results, setResults] = useState(null); // For individual student results (academic, psychomotor, attendance)
  const [selectedTerm, setSelectedTerm] = useState('1st');
  const [session, setSession] = useState('');
  const [availableSessions, setAvailableSessions] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classOverallResults, setClassOverallResults] = useState(null);

  // Academic Score States
  const [pt1, setPt1] = useState('');
  const [pt2, setPt2] = useState('');
  const [pt3, setPt3] = useState('');
  const [exam, setExam] = useState('');
  const [submittingAcademicResults, setSubmittingAcademicResults] = useState(false);
  const [academicResultsPrefill, setAcademicResultsPrefill] = useState(null);

  // Psychomotor Skill States
  const [psychomotorResults, setPsychomotorResults] = useState(null);
  const [attendanceSkill, setAttendanceSkill] = useState('');
  const [punctuality, setPunctuality] = useState('');
  const [neatness, setNeatness] = useState('');
  const [honesty, setHonesty] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [creativity, setCreativity] = useState('');
  const [sports, setSports] = useState('');
  const [submittingPsychomotorSkills, setSubmittingPsychomotorSkills] = useState(false);
  const [psychomotorPrefill, setPsychomotorPrefill] = useState(null);

  // Attendance Specific States
  const [daysOpened, setDaysOpened] = useState('');
  const [daysPresent, setDaysPresent] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState(null); // Not explicitly used as boolean, could be message
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [attendancePrefill, setAttendancePrefill] = useState(null);


  // General Loading/Submitting States
  const [fetchingClassResults, setFetchingClassResults] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [prefilling, setPrefilling] = useState(false); // General prefill loading

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  const fetchClassStudents = useCallback(async (teacherClass) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/students?class=${encodeURIComponent(teacherClass)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClassStudents(data.students || []);
    } catch (error) {
      console.error("Failed to fetch students:", error);
      setClassStudents([]);
    } finally {
      setLoading(false);
    }
  }, [token, handleLogout]);

  const fetchSubjects = useCallback(async (teacherClass) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/subjects?class=${encodeURIComponent(teacherClass)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      setSubjects([]);
    }
  }, [token, handleLogout]);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAvailableSessions(data.sessions || []); // Backend returns { sessions: [...] }
      return data.sessions || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }, [token, handleLogout]);

  const fetchClassOverallResults = useCallback(async () => {
    if (!teacherInfo?.class || !selectedTerm || !session) {
      alert('Please select both term and session to view class results');
      return;
    }
    setFetchingClassResults(true);
    try {
      // Backend expects session_id, frontend stores session name (string)
      const selectedSessionObject = availableSessions.find(s => s.name === session);
      if (!selectedSessionObject) {
        alert('Selected session not found. Please choose a valid session.');
        setFetchingClassResults(false);
        return;
      }
      const sessionId = selectedSessionObject.id;

      const response = await fetch(
        `${API_BASE_URL}/teacher/class-overall-results?class=${encodeURIComponent(teacherInfo.class)}&term=${selectedTerm}&session_id=${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClassOverallResults(data);
    } catch (error) {
      console.error('Error fetching class overall results:', error);
      alert(`Failed to fetch class results: ${error.message}`);
    } finally {
      setFetchingClassResults(false);
    }
  }, [teacherInfo, selectedTerm, session, availableSessions, token, handleLogout]);

  const fetchStudentResults = useCallback(async (studentId, term, sessionId) => {
    setFetchingResults(true);
    try {
        const response = await fetch(
            `${API_BASE_URL}/teacher/student-results/${studentId}?term=${term}&session_id=${sessionId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                }
            }
        );
        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                handleLogout();
            }
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setResults(data); // This will contain academic, psychomotor, attendance
    } catch (error) {
        console.error("Failed to fetch student results:", error);
        setResults(null);
    } finally {
        setFetchingResults(false);
    }
  }, [token, handleLogout]);

  const addSubject = useCallback(async () => {
    if (!newSubject.trim()) {
      alert('Subject name cannot be empty.');
      return;
    }
    setAddingSubject(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ subject_name: newSubject }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message);
      setNewSubject('');
      if (teacherInfo?.class) {
        fetchSubjects(teacherInfo.class); // Refresh subjects list
      }
    } catch (error) {
      console.error("Failed to add subject:", error);
      alert(`Failed to add subject: ${error.message}`);
    } finally {
      setAddingSubject(false);
    }
  }, [newSubject, teacherInfo, token, fetchSubjects, handleLogout]);

  const deleteSubject = useCallback(async (subjectId) => {
    if (!window.confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      alert('Subject deleted successfully.');
      if (teacherInfo?.class) {
        fetchSubjects(teacherInfo.class); // Refresh subjects list
      }
    } catch (error) {
      console.error("Failed to delete subject:", error);
      alert(`Failed to delete subject: ${error.message}`);
    }
  }, [teacherInfo, token, fetchSubjects, handleLogout]);


  // Prefill Academic Results
  const prefillAcademicResults = useCallback(async (studentId, subjectId, term, sessionId) => {
    setPrefilling(true);
    setAcademicResultsPrefill(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/teacher/academic-results-prefill?student_id=${studentId}&subject_id=${subjectId}&term=${term}&session_id=${sessionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAcademicResultsPrefill(data.result || null);
      setPt1(data.result?.pt1 || '');
      setPt2(data.result?.pt2 || '');
      setPt3(data.result?.pt3 || '');
      setExam(data.result?.exam || '');
    } catch (error) {
      console.error('Error prefilling academic results:', error);
      alert(`Failed to prefill academic results: ${error.message}`);
      setAcademicResultsPrefill(null);
      setPt1(''); setPt2(''); setPt3(''); setExam('');
    } finally {
      setPrefilling(false);
    }
  }, [token, handleLogout]);

  // Submit Academic Results
  const submitAcademicResults = useCallback(async () => {
    if (!selectedStudent || !selectedSubject || !selectedTerm || !session) {
      alert('Please select student, subject, term, and session.');
      return;
    }

    const selectedSessionObject = availableSessions.find(s => s.name === session);
    if (!selectedSessionObject) {
      alert('Selected session not found. Please choose a valid session.');
      return;
    }
    const sessionId = selectedSessionObject.id;

    const academicResultsData = [{
      student_id: selectedStudent,
      subject_id: selectedSubject,
      term: selectedTerm,
      session_id: sessionId,
      pt1: pt1 === '' ? null : Number(pt1),
      pt2: pt2 === '' ? null : Number(pt2),
      pt3: pt3 === '' ? null : Number(pt3),
      exam: exam === '' ? null : Number(exam),
    }];

    setSubmittingAcademicResults(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/results/academic-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ academicResults: academicResultsData }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message);
      // Clear form or prefill again
      setSelectedStudent('');
      setSelectedSubject('');
      setPt1(''); setPt2(''); setPt3(''); setExam('');
      setAcademicResultsPrefill(null);
    } catch (error) {
      console.error("Failed to submit academic results:", error);
      alert(`Failed to submit academic results: ${error.message}`);
    } finally {
      setSubmittingAcademicResults(false);
    }
  }, [selectedStudent, selectedSubject, selectedTerm, session, pt1, pt2, pt3, exam, token, availableSessions, handleLogout]);


  // Prefill Psychomotor Skills
  const prefillPsychomotorSkills = useCallback(async (studentId, term, sessionId) => {
    setPrefilling(true);
    setPsychomotorPrefill(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/teacher/psychomotor-skills-prefill?student_id=${studentId}&term=${term}&session_id=${sessionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setPsychomotorPrefill(data.result || null);
      setAttendanceSkill(data.result?.attendance || ''); // Backend returns 'attendance', map to attendanceSkill
      setPunctuality(data.result?.punctuality || '');
      setNeatness(data.result?.neatness || '');
      setHonesty(data.result?.honesty || '');
      setResponsibility(data.result?.responsibility || '');
      setCreativity(data.result?.creativity || '');
      setSports(data.result?.sports || '');
    } catch (error) {
      console.error('Error prefilling psychomotor skills:', error);
      alert(`Failed to prefill psychomotor skills: ${error.message}`);
      setPsychomotorPrefill(null);
      setAttendanceSkill(''); setPunctuality(''); setNeatness(''); setHonesty('');
      setResponsibility(''); setCreativity(''); setSports('');
    } finally {
      setPrefilling(false);
    }
  }, [token, handleLogout]);

  // Submit Psychomotor Skills
  const submitPsychomotorSkills = useCallback(async () => {
    if (!selectedStudent || !selectedTerm || !session) {
      alert('Please select student, term, and session.');
      return;
    }

    const selectedSessionObject = availableSessions.find(s => s.name === session);
    if (!selectedSessionObject) {
      alert('Selected session not found. Please choose a valid session.');
      return;
    }
    const sessionId = selectedSessionObject.id;

    const psychomotorData = [{
      student_id: selectedStudent,
      term: selectedTerm,
      session_id: sessionId,
      attendance: attendanceSkill, // Map attendanceSkill to backend's 'attendance'
      punctuality,
      neatness,
      honesty,
      responsibility,
      creativity,
      sports
    }];

    setSubmittingPsychomotorSkills(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/results/psychomotor-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ psychomotorResults: psychomotorData }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message);
      // Clear form or prefill again
      setSelectedStudent('');
      setAttendanceSkill(''); setPunctuality(''); setNeatness(''); setHonesty('');
      setResponsibility(''); setCreativity(''); setSports('');
      setPsychomotorPrefill(null);
    } catch (error) {
      console.error("Failed to submit psychomotor skills:", error);
      alert(`Failed to submit psychomotor skills: ${error.message}`);
    } finally {
      setSubmittingPsychomotorSkills(false);
    }
  }, [selectedStudent, selectedTerm, session, attendanceSkill, punctuality, neatness, honesty, responsibility, creativity, sports, token, availableSessions, handleLogout]);


  // Prefill Attendance
  const prefillAttendance = useCallback(async (studentId, term, sessionId) => {
    setPrefilling(true);
    setAttendancePrefill(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/teacher/attendance-prefill?student_id=${studentId}&term=${term}&session_id=${sessionId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setAttendancePrefill(data.result || null);
      setDaysOpened(data.result?.days_opened || '');
      setDaysPresent(data.result?.days_present || '');
    } catch (error) {
      console.error('Error prefilling attendance:', error);
      alert(`Failed to prefill attendance: ${error.message}`);
      setAttendancePrefill(null);
      setDaysOpened(''); setDaysPresent('');
    } finally {
      setPrefilling(false);
    }
  }, [token, handleLogout]);

  // Submit Attendance
  const submitAttendance = useCallback(async () => {
    if (!selectedStudent || !selectedTerm || !session || daysOpened === '' || daysPresent === '') {
      alert('Please select student, term, session, and provide days opened/present.');
      return;
    }

    const selectedSessionObject = availableSessions.find(s => s.name === session);
    if (!selectedSessionObject) {
      alert('Selected session not found. Please choose a valid session.');
      return;
    }
    const sessionId = selectedSessionObject.id;

    const attendanceData = [{
      student_id: selectedStudent,
      term: selectedTerm,
      session_id: sessionId,
      days_opened: Number(daysOpened),
      days_present: Number(daysPresent),
    }];

    setSubmittingAttendance(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/attendance-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ attendanceRecords: attendanceData }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message);
      // Clear form
      setSelectedStudent('');
      setDaysOpened(''); setDaysPresent('');
      setAttendancePrefill(null);
    } catch (error) {
      console.error("Failed to submit attendance:", error);
      alert(`Failed to submit attendance: ${error.message}`);
    } finally {
      setSubmittingAttendance(false);
    }
  }, [selectedStudent, selectedTerm, session, daysOpened, daysPresent, token, availableSessions, handleLogout]);


  // Main useEffect for initial data loading
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true); // Start loading for teacher info and initial fetches
    if (teacherUser) {
      setTeacherInfo(teacherUser);
      if (teacherUser.class) {
        fetchClassStudents(teacherUser.class);
        fetchSubjects(teacherUser.class);
      }
      // Load sessions first, then handle initial session selection logic
      fetchSessions().then(sessionsData => {
        if (sessionsData.length > 0) {
          const storedSession = localStorage.getItem('selectedTeacherSession');
          const defaultSession = sessionsData[sessionsData.length - 1]?.name;
          const initialSession = storedSession && sessionsData.some(s => s.name === storedSession)
            ? storedSession
            : defaultSession;
          if (initialSession) {
            setSession(initialSession);
          }
        }
        setLoading(false); // End loading after all initial fetches
      }).catch(() => setLoading(false)); // Ensure loading stops even on session fetch error
    } else {
      // If teacherUser is null initially, assume not logged in or still loading parent component
      // The navigate('/login') above handles not-logged-in, so this case is for 'still loading'
      setLoading(false);
    }
  }, [teacherUser, token, navigate, fetchClassStudents, fetchSubjects, fetchSessions]); // Removed direct fetchSessions call, now chained.


  // Effect to re-fetch class students/subjects if teacher's class changes (unlikely, but for robustness)
  useEffect(() => {
    if (teacherInfo?.class && activeTab === 'students') { // Only refresh students if on students tab
      fetchClassStudents(teacherInfo.class);
    }
    if (teacherInfo?.class && activeTab === 'subjects') { // Only refresh subjects if on subjects tab
      fetchSubjects(teacherInfo.class);
    }
  }, [teacherInfo?.class, activeTab, fetchClassStudents, fetchSubjects]);


  // Effect for class overall results tab
  useEffect(() => {
    if (activeTab === 'class-results' && teacherInfo?.class && selectedTerm && session) {
      fetchClassOverallResults();
    }
  }, [activeTab, selectedTerm, session, teacherInfo?.class, fetchClassOverallResults]);

  // Handle session change
  const handleSessionChange = (e) => {
    const newSession = e.target.value;
    setSession(newSession);
    localStorage.setItem('selectedTeacherSession', newSession); // Persist selection
  };

  const filteredStudents = classStudents.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );


  if (loading) {
    return (
      <div className="dashboard-loading">
        <FaSpinner className="spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Ensure teacherInfo is available before rendering dashboard
  if (!teacherInfo) {
    // This case should ideally be caught by the initial useEffect and navigate to login
    // but as a fallback or if teacherUser prop somehow becomes null after initial load.
    return (
      <div className="dashboard-error">
        <p>Teacher information not available. Please log in again.</p>
        <button onClick={handleLogout} className="btn btn-primary">Go to Login</button>
      </div>
    );
  }


  return (
    <div className="teacher-dashboard">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h3>Teacher Portal</h3>
        </div>
        <ul className="sidebar-menu">
          <li>
            <button onClick={() => setActiveTab('students')} className={activeTab === 'students' ? 'active' : ''}>
              <FaUsers /> My Students
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('subjects')} className={activeTab === 'subjects' ? 'active' : ''}>
              <FaBook /> Subjects
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('upload-results')} className={activeTab === 'upload-results' ? 'active' : ''}>
              <FaUpload /> Upload Results
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('class-results')} className={activeTab === 'class-results' ? 'active' : ''}>
              <FaChartBar /> Class Results
            </button>
          </li>
          <li>
            <button onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </li>
        </ul>
      </nav>

      <div className="main-content">
        <header className="navbar">
          <h2>Welcome, {teacherInfo.full_name} ({teacherInfo.class})</h2>
          <div className="navbar-profile">
            <span>{teacherInfo.email}</span>
            <button onClick={handleLogout} className="btn btn-danger btn-sm">Logout</button>
          </div>
        </header>

        <main className="dashboard-body">
          {activeTab === 'students' && (
            <section className="students-section">
              <h3>My Students in {teacherInfo.class}</h3>
              <div className="search-bar">
                <input
                  type="text"
                  placeholder="Search students by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FaSearch className="search-icon" />
              </div>
              {loading ? (
                <div className="loading-indicator">
                  <FaSpinner className="spinner" /> <p>Loading students...</p>
                </div>
              ) : classStudents.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped student-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Full Name</th>
                        <th>Gender</th>
                        <th>Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map(student => (
                        <tr key={student.id}>
                          <td>{student.student_id}</td>
                          <td>{student.full_name}</td>
                          <td>{student.gender}</td>
                          <td>{student.is_active ? <FaCheckCircle className="text-success" /> : <FaTimesCircle className="text-danger" />}</td>
                          <td>
                            <button
                              onClick={() => {
                                setSelectedStudent(student.id);
                                // You might want to prefill a form or show a modal here
                                // For now, just navigate or set tab to upload-results for that student
                                setActiveTab('upload-results'); // Direct to upload for this student
                              }}
                              className="btn btn-info btn-sm"
                            >
                              Manage Results
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No students found in your class.</p>
                </div>
              )}
            </section>
          )}

          {activeTab === 'subjects' && (
            <section className="subjects-section">
              <h3>My Subjects for {teacherInfo.class}</h3>
              <div className="add-subject-form">
                <input
                  type="text"
                  placeholder="New Subject Name"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                />
                <button onClick={addSubject} className="btn btn-primary" disabled={addingSubject}>
                  {addingSubject ? <FaSpinner className="spinner-sm" /> : <FaPlus />} Add Subject
                </button>
              </div>
              {loading ? (
                <div className="loading-indicator">
                  <FaSpinner className="spinner" /> <p>Loading subjects...</p>
                </div>
              ) : subjects.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped subject-table">
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Added On</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(subject => (
                        <tr key={subject.id}>
                          <td>{subject.name}</td>
                          <td>{new Date(subject.created_at).toLocaleDateString()}</td>
                          <td>
                            <button
                              onClick={() => deleteSubject(subject.id)}
                              className="btn btn-danger btn-sm"
                            >
                              <FaTrash /> Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No subjects assigned to your class or added yet.</p>
                </div>
              )}
            </section>
          )}

          {activeTab === 'upload-results' && (
            <section className="upload-results-section">
              <h3>Upload Results</h3>
              <div className="form-group">
                <label>Select Student:</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="form-control"
                >
                  <option value="">-- Select Student --</option>
                  {classStudents.map(student => (
                    <option key={student.id} value={student.id}>{student.full_name} ({student.student_id})</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group col-md-4">
                  <label>Term:</label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="form-control"
                  >
                    <option value="1st">1st Term</option>
                    <option value="2nd">2nd Term</option>
                    <option value="3rd">3rd Term</option>
                  </select>
                </div>
                <div className="form-group col-md-4">
                  <label>Session:</label>
                  <select
                    value={session}
                    onChange={handleSessionChange}
                    className="form-control"
                  >
                    <option value="">-- Select Session --</option>
                    {availableSessions.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStudent && selectedTerm && session && (
                <div className="result-forms-container">
                  <h4>Academic Results</h4>
                  <div className="form-group">
                    <label>Select Subject:</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="form-control"
                    >
                      <option value="">-- Select Subject --</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => prefillAcademicResults(selectedStudent, selectedSubject, selectedTerm, availableSessions.find(s => s.name === session)?.id)}
                      className="btn btn-secondary btn-sm mt-2"
                      disabled={!selectedSubject || prefilling}
                    >
                      {prefilling ? <FaSpinner className="spinner-sm" /> : "Prefill Academic"}
                    </button>
                  </div>

                  {selectedSubject && (
                    <div className="academic-form row">
                      <div className="form-group col-md-3">
                        <label>PT1:</label>
                        <input type="number" className="form-control" value={pt1} onChange={(e) => setPt1(e.target.value)} />
                      </div>
                      <div className="form-group col-md-3">
                        <label>PT2:</label>
                        <input type="number" className="form-control" value={pt2} onChange={(e) => setPt2(e.target.value)} />
                      </div>
                      <div className="form-group col-md-3">
                        <label>PT3:</label>
                        <input type="number" className="form-control" value={pt3} onChange={(e) => setPt3(e.target.value)} />
                      </div>
                      <div className="form-group col-md-3">
                        <label>Exam:</label>
                        <input type="number" className="form-control" value={exam} onChange={(e) => setExam(e.target.value)} />
                      </div>
                      <div className="col-12 mt-3">
                        <button onClick={submitAcademicResults} className="btn btn-success" disabled={submittingAcademicResults}>
                          {submittingAcademicResults ? <FaSpinner className="spinner-sm" /> : "Submit Academic Results"}
                        </button>
                      </div>
                    </div>
                  )}

                  <h4 className="mt-4">Psychomotor Skills</h4>
                  <button
                    onClick={() => prefillPsychomotorSkills(selectedStudent, selectedTerm, availableSessions.find(s => s.name === session)?.id)}
                    className="btn btn-secondary btn-sm mt-2"
                    disabled={prefilling}
                  >
                    {prefilling ? <FaSpinner className="spinner-sm" /> : "Prefill Psychomotor"}
                  </button>
                  <div className="psychomotor-form row">
                    <div className="form-group col-md-4">
                      <label>Attendance (Skill):</label>
                      <input type="text" className="form-control" value={attendanceSkill} onChange={(e) => setAttendanceSkill(e.target.value)} />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Punctuality:</label>
                      <input type="text" className="form-control" value={punctuality} onChange={(e) => setPunctuality(e.target.value)} />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Neatness:</label>
                      <input type="text" className="form-control" value={neatness} onChange={(e) => setNeatness(e.target.value)} />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Honesty:</label>
                      <input type="text" className="form-control" value={honesty} onChange={(e) => setHonesty(e.target.value)} />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Responsibility:</label>
                      <input type="text" className="form-control" value={responsibility} onChange={(e) => setResponsibility(e.target.value)} />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Creativity:</label>
                      <input type="text" className="form-control" value={creativity} onChange={(e) => setCreativity(e.target.value)} />
                    </div>
                    <div className="form-group col-md-4">
                      <label>Sports:</label>
                      <input type="text" className="form-control" value={sports} onChange={(e) => setSports(e.target.value)} />
                    </div>
                    <div className="col-12 mt-3">
                      <button onClick={submitPsychomotorSkills} className="btn btn-success" disabled={submittingPsychomotorSkills}>
                        {submittingPsychomotorSkills ? <FaSpinner className="spinner-sm" /> : "Submit Psychomotor Skills"}
                      </button>
                    </div>
                  </div>

                  <h4 className="mt-4">Attendance Records</h4>
                  <button
                    onClick={() => prefillAttendance(selectedStudent, selectedTerm, availableSessions.find(s => s.name === session)?.id)}
                    className="btn btn-secondary btn-sm mt-2"
                    disabled={prefilling}
                  >
                    {prefilling ? <FaSpinner className="spinner-sm" /> : "Prefill Attendance"}
                  </button>
                  <div className="attendance-form row">
                    <div className="form-group col-md-6">
                      <label>Days Opened:</label>
                      <input type="number" className="form-control" value={daysOpened} onChange={(e) => setDaysOpened(e.target.value)} />
                    </div>
                    <div className="form-group col-md-6">
                      <label>Days Present:</label>
                      <input type="number" className="form-control" value={daysPresent} onChange={(e) => setDaysPresent(e.target.value)} />
                    </div>
                    <div className="col-12 mt-3">
                      <button onClick={submitAttendance} className="btn btn-success" disabled={submittingAttendance}>
                        {submittingAttendance ? <FaSpinner className="spinner-sm" /> : "Submit Attendance"}
                      </button>
                    </div>
                  </div>

                  <h4 className="mt-4">View All Results for Selected Student</h4>
                  <button
                    onClick={() => fetchStudentResults(selectedStudent, selectedTerm, availableSessions.find(s => s.name === session)?.id)}
                    className="btn btn-primary mt-2"
                    disabled={fetchingResults}
                  >
                    {fetchingResults ? <FaSpinner className="spinner-sm" /> : "Load All Results"}
                  </button>

                  {results && (
                    <div className="mt-4">
                      <h5>Student Results Overview</h5>
                      <pre>{JSON.stringify(results, null, 2)}</pre> {/* Display raw results for now */}
                     {results && (
  <div className="mt-4 results-display-container">
    <h5 className="mb-3">Detailed Results for Student</h5>

    /* Academic Results Section */
    {results.academic_results && results.academic_results.length > 0 && (
      <div className="academic-results-section mb-4 card">
        <div className="card-header">
          <h6>Academic Performance - {selectedTerm} Term, {session} Session</h6>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-bordered table-sm academic-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>PT1</th>
                  <th>PT2</th>
                  <th>PT3</th>
                  <th>Exam</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {results.academic_results.map((res) => (
                  <tr key={res.id || res.subject_name}> /* Use res.id if available, else subject_name */
                    <td>{res.subject_name}</td>
                    <td>{res.pt1 !== null ? res.pt1 : '-'}</td>
                    <td>{res.pt2 !== null ? res.pt2 : '-'}</td>
                    <td>{res.pt3 !== null ? res.pt3 : '-'}</td>
                    <td>{res.exam !== null ? res.exam : '-'}</td>
                    <td>{res.total !== null ? res.total : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

    /* Psychomotor Skills Section */
    {results.psychomotor_results && (
      <div className="psychomotor-results-section mb-4 card">
        <div className="card-header">
          <h6>Psychomotor Skills - {selectedTerm} Term, {session} Session</h6>
        </div>
        <div className="card-body">
          <ul className="list-group list-group-flush">
            <li className="list-group-item"><strong>Attendance:</strong> {results.psychomotor_results.attendance || 'N/A'}</li>
            <li className="list-group-item"><strong>Punctuality:</strong> {results.psychomotor_results.punctuality || 'N/A'}</li>
            <li className="list-group-item"><strong>Neatness:</strong> {results.psychomotor_results.neatness || 'N/A'}</li>
            <li className="list-group-item"><strong>Honesty:</strong> {results.psychomotor_results.honesty || 'N/A'}</li>
            <li className="list-group-item"><strong>Responsibility:</strong> {results.psychomotor_results.responsibility || 'N/A'}</li>
            <li className="list-group-item"><strong>Creativity:</strong> {results.psychomotor_results.creativity || 'N/A'}</li>
            <li className="list-group-item"><strong>Sports:</strong> {results.psychomotor_results.sports || 'N/A'}</li>
          </ul>
        </div>
      </div>
    )}

    /* Attendance Records Section */
    {results.attendance_records && (
      <div className="attendance-records-section mb-4 card">
        <div className="card-header">
          <h6>Attendance Records - {selectedTerm} Term, {session} Session</h6>
        </div>
        <div className="card-body">
          <ul className="list-group list-group-flush">
            <li className="list-group-item"><strong>Days Opened:</strong> {results.attendance_records.days_opened !== null ? results.attendance_records.days_opened : 'N/A'}</li>
            <li className="list-group-item"><strong>Days Present:</strong> {results.attendance_records.days_present !== null ? results.attendance_records.days_present : 'N/A'}</li>
          </ul>
        </div>
      </div>
    )}

    {!results.academic_results?.length && !results.psychomotor_results && !results.attendance_records && (
      <div className="alert alert-info mt-4" role="alert">
        No results found for this student for the selected term and session.
      </div>
    )}
  </div>
)}
                    </div>
                  )}

                </div>
              )}
            </section>
          )}

          {activeTab === 'class-results' && (
            <section className="class-results-section">
              <h3>Class Overall Results for {teacherInfo.class}</h3>
              <div className="form-row">
                <div className="form-group col-md-4">
                  <label>Term:</label>
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="form-control"
                  >
                    <option value="1st">1st Term</option>
                    <option value="2nd">2nd Term</option>
                    <option value="3rd">3rd Term</option>
                  </select>
                </div>
                <div className="form-group col-md-4">
                  <label>Session:</label>
                  <select
                    value={session}
                    onChange={handleSessionChange}
                    className="form-control"
                  >
                    <option value="">-- Select Session --</option>
                    {availableSessions.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group col-md-4 d-flex align-items-end">
                  <button onClick={fetchClassOverallResults} className="btn btn-primary" disabled={fetchingClassResults}>
                    {fetchingClassResults ? <FaSpinner className="spinner-sm" /> : "Load Class Results"}
                  </button>
                </div>
              </div>

              {fetchingClassResults ? (
                <div className="loading-indicator">
                  <FaSpinner className="spinner" /> <p>Loading class results...</p>
                </div>
              ) : classOverallResults && classOverallResults.results?.length > 0 ? (
                <div className="class-overall-table mt-4">
                  <h4>Summary for {classOverallResults.class} - {classOverallResults.term} Term - {classOverallResults.session} Session</h4>
                  <p><strong>Average Total Score:</strong> {classOverallResults.averageTotalScore ? classOverallResults.averageTotalScore.toFixed(2) : 'N/A'}</p>
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Full Name</th>
                          <th>Total Score</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classOverallResults.results.map((student, index) => (
                          <tr key={student.id}>
                            <td>{student.position}</td>
                            <td>{student.full_name}</td>
                            <td>{student.term_total_score}</td>
                            <td>
                              <button
                                onClick={() => {
                                  setSelectedStudent(student.id);
                                  fetchStudentResults(student.id, selectedTerm, availableSessions.find(s => s.name === session)?.id);
                                  setActiveTab('upload-results'); // Switch to upload tab to view details
                                }}
                                className="btn btn-secondary btn-sm"
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No class results available. Select term and session, then click "Load Results".</p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

export default TeacherDashboard;
