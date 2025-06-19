import React, { useState, useEffect } from 'react';
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
  FaChartBar
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
  const [results, setResults] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('1st');
  const [sessionId, setSessionId] = useState('');
  const [sessionName, setSessionName] = useState('');
  const [availableSessions, setAvailableSessions] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classOverallResults, setClassOverallResults] = useState(null);

  // Bulk Results States
  const [bulkResults, setBulkResults] = useState([]);
  const [bulkSubject, setBulkSubject] = useState('');
  const [bulkTerm, setBulkTerm] = useState('1st');
  const [bulkSessionId, setBulkSessionId] = useState('');
  const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

  // General Loading/Submitting States
  const [fetchingClassResults, setFetchingClassResults] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);

  // Attendance States
  const [daysOpened, setDaysOpened] = useState('');
  const [daysPresent, setDaysPresent] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState(null);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Psychomotor States
  const [psychomotorForm, setPsychomotorForm] = useState({
    student_id: '',
    term: '',
    session_id: '',
    attendance: '',
    punctuality: '',
    neatness: '',
    honesty: '',
    responsibility: '',
    creativity: '',
    sports: ''
  });
  const [submittingPsychomotorSkills, setSubmittingPsychomotorSkills] = useState(false);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Fetch teacher info, students, subjects, sessions
  useEffect(() => {
    if (teacherUser) {
      setTeacherInfo(teacherUser);
      setLoading(false);
      fetchClassStudents();
      fetchSubjects();
      fetchSessions();
    } else if (!token) {
      navigate('/login');
      setLoading(false);
    }
    // eslint-disable-next-line
  }, [teacherUser, token, navigate]);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setAvailableSessions(data.sessions || []);
      // Set default sessionId and sessionName
      if (data.sessions && data.sessions.length > 0) {
        setSessionId(data.sessions[0].id);
        setSessionName(data.sessions[0].name);
        setBulkSessionId(data.sessions[0].id);
      }
    } catch (error) {
      setAvailableSessions([]);
    }
  };

  // Fetch subjects
  const fetchSubjects = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/subjects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) navigate('/login');
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      setSubjects([]);
    }
  };

  // Fetch students
  const fetchClassStudents = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/students`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) navigate('/login');
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClassStudents(data.students || []);
    } catch (error) {
      setClassStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch class overall results
  const fetchClassOverallResults = async () => {
    if (!teacherInfo?.class || !selectedTerm || !sessionId) {
      alert('Please select both term and session to view class results');
      return;
    }
    setFetchingClassResults(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/teacher/class-overall-results?class=${encodeURIComponent(teacherInfo.class)}&term=${selectedTerm}&session_id=${sessionId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setClassOverallResults(data);
    } catch (error) {
      alert(`Failed to fetch class results: ${error.message}`);
    } finally {
      setFetchingClassResults(false);
    }
  };

  // Bulk upload
  const handleBulkScoreChange = (studentId, field, value) => {
    setBulkResults(prev => {
      const existing = prev.find(r => r.student_id === studentId);
      if (existing) {
        return prev.map(r =>
          r.student_id === studentId ? { ...r, [field]: value } : r
        );
      } else {
        return [...prev, {
          student_id: studentId,
          pt1: field === 'pt1' ? value : '',
          pt2: field === 'pt2' ? value : '',
          pt3: field === 'pt3' ? value : '',
          exam: field === 'exam' ? value : ''
        }];
      }
    });
  };

  const handleSubmitBulkResults = async () => {
    if (!bulkSubject || !bulkTerm || !bulkSessionId) {
      alert('Please select subject, term and session');
      return;
    }
    // Group results by student for the API
    const academicResults = classStudents.map(student => {
      const result = bulkResults.find(r => r.student_id === student.student_id) || {};
      return {
        student_id: student.student_id,
        term: bulkTerm,
        session_id: bulkSessionId,
        results: [{
          subject_id: bulkSubject,
          pt1: result.pt1 || null,
          pt2: result.pt2 || null,
          pt3: result.pt3 || null,
          exam: result.exam || null
        }]
      };
    }).filter(r => r.results.some(x => x.pt1 || x.pt2 || x.pt3 || x.exam));

    if (academicResults.length === 0) {
      alert('No results to upload');
      return;
    }

    setIsSubmittingBulk(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/results/academic-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ academicResults })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload bulk results');
      }

      const data = await response.json();
      alert(`Successfully uploaded ${data.uploaded.length} results`);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsSubmittingBulk(false);
    }
  };

  // Add subject
  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!newSubject.trim()) {
      alert('Please enter a subject name');
      return;
    }
    setAddingSubject(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subject_name: newSubject.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add subject`);
      }

      alert('Subject added successfully!');
      setNewSubject('');
      await fetchSubjects();
    } catch (error) {
      alert(`Error adding subject: ${error.message}`);
    } finally {
      setAddingSubject(false);
    }
  };

  // Attendance
  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }
    if (!daysOpened || !daysPresent) {
      alert('Please enter both days opened and days present');
      return;
    }
    if (parseInt(daysPresent) > parseInt(daysOpened)) {
      alert('Days present cannot exceed days opened');
      return;
    }
    setSubmittingAttendance(true);
    setAttendanceSuccess(null);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/attendance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          student_id: selectedStudent,
          term: selectedTerm,
          session: sessionName,
          days_opened: parseInt(daysOpened),
          days_present: parseInt(daysPresent)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to record attendance`);
      }

      const data = await response.json();
      setAttendanceSuccess(data.message);
      setTimeout(() => {
        setDaysOpened('');
        setDaysPresent('');
        setAttendanceSuccess(null);
        setSelectedStudent('');
      }, 3000);
    } catch (error) {
      alert(`Error recording attendance: ${error.message}`);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  // Psychomotor
  const handleSubmitPsychomotorSkills = async (e) => {
    e.preventDefault();
    if (!psychomotorForm.student_id || !psychomotorForm.term || !psychomotorForm.session_id) {
      alert('Please select a student, term, and session for psychomotor skills.');
      return;
    }
    setSubmittingPsychomotorSkills(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/psychomotor/update-student`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(psychomotorForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to upload psychomotor skills`);
      }

      alert('Psychomotor Skills uploaded successfully!');
    } catch (error) {
      alert(`Error uploading psychomotor skills: ${error.message}`);
    } finally {
      setSubmittingPsychomotorSkills(false);
    }
  };

  // Student results
  const fetchStudentResults = async (studentId, term, session) => {
    setFetchingResults(true);
    setResults(null);
    try {
      if (!studentId || !term || !session) {
        alert('Cannot load results. Missing student, term, or session.');
        return;
      }
      const encodedStudentId = encodeURIComponent(studentId);
      const encodedSession = encodeURIComponent(session);
      const url = `${API_BASE_URL}/teacher/student-results/${encodedStudentId}/${term}/${encodedSession}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }
      setResults(data);
      setSelectedStudent(studentId);
      setActiveTab('results');
    } catch (error) {
      alert(`Error loading results: ${error.message}`);
      setResults(null);
    } finally {
      setFetchingResults(false);
    }
  };

  // Session select handler
  const handleSessionChange = (e) => {
    const newSessionId = e.target.value;
    setSessionId(newSessionId);
    const sessionObj = availableSessions.find(s => s.id === newSessionId);
    setSessionName(sessionObj ? sessionObj.name : '');
    setBulkSessionId(newSessionId);
  };

  // Filtered students for search
  const filteredStudents = classStudents.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.student_id && student.student_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="dashboard-loading">
        <FaSpinner className="spinner-icon" />
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  if (!teacherInfo) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>Please login as a teacher to access this dashboard.</p>
        <button onClick={() => navigate('/login')} className="btn btn-primary">Go to Login</button>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title"><FaChalkboardTeacher /> Teacher Dashboard</h1>
          <div className="user-profile">
            <span className="user-name">{teacherInfo.full_name}</span>
            <span className="user-class">Class: {teacherInfo.class}</span>
            <button onClick={handleLogout} className="btn-logout">
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        <nav className="dashboard-sidebar">
          <ul className="sidebar-menu">
            <li className={activeTab === 'students' ? 'active' : ''} onClick={() => setActiveTab('students')}>
              <FaUsers className="menu-icon" /> <span className="menu-text">My Students</span>
            </li>
            <li className={activeTab === 'subjects' ? 'active' : ''} onClick={() => setActiveTab('subjects')}>
              <FaBook className="menu-icon" /> <span className="menu-text">Class Subjects</span>
            </li>
            <li className={activeTab === 'bulk-results' ? 'active' : ''} onClick={() => setActiveTab('bulk-results')}>
              <FaUpload className="menu-icon" /> <span className="menu-text">Bulk Results</span>
            </li>
            <li className={activeTab === 'psychomotor' ? 'active' : ''} onClick={() => setActiveTab('psychomotor')}>
              <FaUserGraduate className="menu-icon" /> <span className="menu-text">Psychomotor</span>
            </li>
            <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>
              <FaCalendarAlt className="menu-icon" /> <span className="menu-text">Attendance</span>
            </li>
            <li className={activeTab === 'add-subject' ? 'active' : ''} onClick={() => setActiveTab('add-subject')}>
              <FaPlus className="menu-icon" /> <span className="menu-text">Add Subject</span>
            </li>
            <li className={activeTab === 'class-results' ? 'active' : ''} onClick={() => setActiveTab('class-results')}>
              <FaChartBar className="menu-icon" /> <span className="menu-text">Class Results</span>
            </li>
          </ul>
        </nav>

        <main className="dashboard-main-content">
          {activeTab === 'students' && (
            <section className="dashboard-section students-section">
              <div className="section-header">
                <h2 className="section-title"><FaUserGraduate /> Students in {teacherInfo.class}</h2>
                <div className="search-input-group">
                  <input
                    type="text"
                    placeholder="Search students by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  <FaSearch className="search-icon" />
                </div>
              </div>

              {filteredStudents.length > 0 ? (
                <div className="students-grid">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="student-card">
                      <div className="student-avatar">
                        {student.profile_picture ? (
                          <img src={student.profile_picture} alt={student.full_name} className="avatar-img" />
                        ) : (
                          <div className="avatar-placeholder">{student.full_name.charAt(0)}</div>
                        )}
                      </div>
                      <div className="student-details">
                        <h3 className="student-name">{student.full_name}</h3>
                        <p className="student-id">ID: {student.student_id}</p>
                        <p className="student-gender">Gender: {student.gender}</p>
                        <span className={`student-status status-${student.is_active ? 'active' : 'inactive'}`}>
                          {student.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="student-actions">
                        <button
                          onClick={() => fetchStudentResults(student.student_id || student.id, selectedTerm, sessionName)}
                          className="btn btn-primary btn-view-results"
                          disabled={fetchingResults}
                        >
                          {fetchingResults && selectedStudent === (student.student_id || student.id) ? (
                            <FaSpinner className="spinner-icon" />
                          ) : (
                            <>View Results</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No students found in your class {searchTerm && `matching "${searchTerm}"`}.</p>
                  {!searchTerm && <small>Students will appear here once they are assigned to your class.</small>}
                </div>
              )}
            </section>
          )}

          {activeTab === 'subjects' && (
            <section className="dashboard-section subjects-section">
              <div className="section-header">
                <h2 className="section-title"><FaBook /> Subjects for {teacherInfo.class}</h2>
                <button
                  onClick={() => setActiveTab('add-subject')}
                  className="btn btn-primary btn-icon-text"
                >
                  <FaPlus /> Add New Subject
                </button>
              </div>

              {subjects.length > 0 ? (
                <div className="table-responsive">
                  <table className="data-table subjects-table">
                    <thead>
                      <tr>
                        <th>Subject Name</th>
                        <th>Date Added</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subjects.map(subject => (
                        <tr key={subject.id}>
                          <td>{subject.name}</td>
                          <td>{new Date(subject.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <p>No subjects found for your class.</p>
                  <button
                    onClick={() => setActiveTab('add-subject')}
                    className="btn btn-primary btn-icon-text"
                  >
                    <FaPlus /> Add Your First Subject
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'bulk-results' && (
            <section className="dashboard-section bulk-results-section">
              <div className="section-header">
                <h2 className="section-title"><FaUpload /> Bulk Upload Results</h2>
              </div>

              <div className="bulk-selectors">
                <div className="form-group">
                  <label>Subject:</label>
                  <select
                    value={bulkSubject}
                    onChange={(e) => setBulkSubject(e.target.value)}
                    required
                  >
                    <option value="">Select Subject</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Term:</label>
                  <select
                    value={bulkTerm}
                    onChange={(e) => setBulkTerm(e.target.value)}
                    required
                  >
                    <option value="1st">First Term</option>
                    <option value="2nd">Second Term</option>
                    <option value="3rd">Third Term</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Session:</label>
                  <select
                    value={bulkSessionId}
                    onChange={(e) => setBulkSessionId(e.target.value)}
                    required
                  >
                    {Array.isArray(availableSessions) && availableSessions.map(session => (
                      <option key={session.id} value={session.id}>{session.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {bulkSubject && bulkTerm && bulkSessionId && (
                <div className="bulk-results-table-container">
                  <div className="table-responsive">
                    <table className="bulk-results-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>PT1 (30)</th>
                          <th>PT2 (30)</th>
                          <th>PT3 (30)</th>
                          <th>Exam (70)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classStudents.map(student => {
                          const studentResult = bulkResults.find(r => r.student_id === student.student_id) || {};
                          return (
                            <tr key={student.id}>
                              <td>{student.full_name}</td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={studentResult.pt1 || ''}
                                  onChange={(e) => handleBulkScoreChange(student.student_id, 'pt1', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={studentResult.pt2 || ''}
                                  onChange={(e) => handleBulkScoreChange(student.student_id, 'pt2', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="30"
                                  value={studentResult.pt3 || ''}
                                  onChange={(e) => handleBulkScoreChange(student.student_id, 'pt3', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  max="70"
                                  value={studentResult.exam || ''}
                                  onChange={(e) => handleBulkScoreChange(student.student_id, 'exam', e.target.value)}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bulk-actions">
                    <button
                      onClick={handleSubmitBulkResults}
                      disabled={isSubmittingBulk || bulkResults.length === 0}
                      className="btn btn-primary"
                    >
                      {isSubmittingBulk ? <FaSpinner className="spinner-icon" /> : 'Upload Bulk Results'}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'psychomotor' && (
            <section className="dashboard-section psychomotor-section">
              <div className="section-header">
                <h2 className="section-title"><FaUserGraduate /> Psychomotor Skills Assessment</h2>
              </div>

              <form onSubmit={handleSubmitPsychomotorSkills} className="data-form psychomotor-form">
                <div className="common-selectors">
                  <div className="form-group">
                    <label>Select Student:</label>
                    <select
                      value={psychomotorForm.student_id}
                      onChange={e => setPsychomotorForm(f => ({ ...f, student_id: e.target.value }))}
                      required
                    >
                      <option value="">Choose a student...</option>
                      {classStudents.map(student => (
                        <option key={student.id} value={student.student_id || student.id}>
                          {student.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Term:</label>
                    <select
                      value={psychomotorForm.term}
                      onChange={e => setPsychomotorForm(f => ({ ...f, term: e.target.value }))}
                      required
                    >
                      <option value="1st">First Term</option>
                      <option value="2nd">Second Term</option>
                      <option value="3rd">Third Term</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Session:</label>
                    <select
                      value={psychomotorForm.session_id}
                      onChange={e => setPsychomotorForm(f => ({ ...f, session_id: e.target.value }))}
                      required
                    >
                      <option value="">Session</option>
                      {availableSessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-grid-3">
                  {[
                    { key: 'attendance', label: 'Attendance' },
                    { key: 'punctuality', label: 'Punctuality' },
                    { key: 'neatness', label: 'Neatness' },
                    { key: 'honesty', label: 'Honesty' },
                    { key: 'responsibility', label: 'Responsibility' },
                    { key: 'creativity', label: 'Creativity' },
                    { key: 'sports', label: 'Sports/Physical Activity' }
                  ].map(skill => (
                    <div key={skill.key} className="form-group">
                      <label>{skill.label}:</label>
                      <select
                        value={psychomotorForm[skill.key]}
                        onChange={e => setPsychomotorForm(f => ({ ...f, [skill.key]: e.target.value }))}
                        required
                      >
                        <option value="">Select grade</option>
                        <option value="A">A - Excellent</option>
                        <option value="B">B - Very Good</option>
                        <option value="C">C - Good</option>
                        <option value="D">D - Fair</option>
                        <option value="E">E - Poor</option>
                        <option value="F">F - Very Poor</option>
                      </select>
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingPsychomotorSkills}
                  >
                    {submittingPsychomotorSkills ? <FaSpinner className="spinner-icon" /> : 'Save Psychomotor Skills'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'attendance' && (
            <section className="dashboard-section record-attendance-section">
              <h2 className="section-title"><FaCalendarAlt /> Record Student Attendance</h2>
              <form onSubmit={handleSubmitAttendance} className="data-form attendance-form">
                <div className="form-grid-1">
                  <div className="form-group">
                    <label>Select Student:</label>
                    <select
                      value={selectedStudent}
                      onChange={e => setSelectedStudent(e.target.value)}
                      required
                    >
                      <option value="">Choose a student...</option>
                      {classStudents.map(student => (
                        <option key={student.id} value={student.student_id || student.id}>
                          {student.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Term:</label>
                    <select
                      value={selectedTerm}
                      onChange={e => setSelectedTerm(e.target.value)}
                      required
                    >
                      <option value="1st">First Term</option>
                      <option value="2nd">Second Term</option>
                      <option value="3rd">Third Term</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Session:</label>
                    <select
                      value={sessionId}
                      onChange={handleSessionChange}
                      required
                      disabled={loading}
                    >
                      {availableSessions.length > 0 ? (
                        availableSessions.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))
                      ) : (
                        <option value="">Loading sessions...</option>
                      )}
                    </select>
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Days School Opened:</label>
                    <input
                      type="number"
                      min="1"
                      value={daysOpened}
                      onChange={e => setDaysOpened(e.target.value)}
                      placeholder="Total school days"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Days Present:</label>
                    <input
                      type="number"
                      min="0"
                      value={daysPresent}
                      onChange={e => setDaysPresent(e.target.value)}
                      placeholder="Days student attended"
                      required
                    />
                  </div>
                </div>
                {daysOpened !== '' && daysPresent !== '' && parseInt(daysOpened) > 0 && (
                  <div className="attendance-preview">
                    <h4>Attendance Rate:</h4>
                    <p>{Math.round((parseInt(daysPresent || 0) / parseInt(daysOpened || 1)) * 100)}% ({daysPresent}/{daysOpened} days)</p>
                  </div>
                )}
                {attendanceSuccess && (
                  <div className="alert alert-success">
                    {attendanceSuccess}
                  </div>
                )}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingAttendance}
                  >
                    {submittingAttendance ? <FaSpinner className="spinner-icon" /> : 'Record Attendance'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'add-subject' && (
            <section className="dashboard-section add-subject-section">
              <div className="section-header">
                <h2 className="section-title"><FaBook /> Add New Subject</h2>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className="btn btn-back"
                >
                  <FaArrowLeft /> Back to Subjects
                </button>
              </div>
              <div className="add-subject-content">
                <form onSubmit={handleAddSubject} className="data-form add-subject-form">
                  <div className="form-group">
                    <label>Subject Name:</label>
                    <input
                      type="text"
                      value={newSubject}
                      onChange={e => setNewSubject(e.target.value)}
                      placeholder="e.g., Mathematics, English Language, Biology"
                      required
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={addingSubject}
                    >
                      {addingSubject ? <FaSpinner className="spinner-icon" /> : 'Add Subject'}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeTab === 'results' && (
            <section className="dashboard-section student-results-section">
              <div className="section-header">
                <h2 className="section-title"><FaUserGraduate /> Student Results</h2>
                <button
                  onClick={() => setActiveTab('students')}
                  className="btn btn-back"
                >
                  <FaArrowLeft /> Back to Students
                </button>
              </div>
              {fetchingResults ? (
                <div className="loading-results">
                  <FaSpinner className="spinner-icon" />
                  <p>Loading results...</p>
                </div>
              ) : results ? (
                <div className="results-display-container">
                  <div className="student-results-summary-card">
                    <h3 className="student-name">{results.student?.full_name}</h3>
                    <p className="student-details">Class: {results.student?.class} | Term: {results.term} | Session: {results.session}</p>
                  </div>
                  {results.academicResults && results.academicResults.length > 0 ? (
                    <div className="results-table-card">
                      <h4 className="card-title">Academic Performance</h4>
                      <div className="table-responsive">
                        <table className="data-table academic-results-table">
                          <thead>
                            <tr>
                              <th>Subject</th>
                              <th>PT1</th>
                              <th>PT2</th>
                              <th>PT3</th>
                              <th>Avg PT</th>
                              <th>Exam</th>
                              <th>Total</th>
                              <th>Grade</th>
                              <th>Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.academicResults.map((result, index) => (
                              <tr key={index}>
                                <td>{result.subject_name}</td>
                                <td>{result.pt1}</td>
                                <td>{result.pt2}</td>
                                <td>{result.pt3}</td>
                                <td>{result.avg_pt !== undefined ? Math.round(result.avg_pt) : 'N/A'}</td>
                                <td>{result.exam}</td>
                                <td>{result.total_score}</td>
                                <td>{result.grade}</td>
                                <td>{result.remark}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <p>No academic results found for this student for {results.term} term, {results.session} session.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No results available for the selected student, term, and session.</p>
                  <button onClick={() => setActiveTab('students')} className="btn btn-primary">
                    Select another student
                  </button>
                </div>
              )}
            </section>
          )}

          {activeTab === 'class-results' && (
            <section className="dashboard-section class-results-section">
              <div className="section-header">
                <h2 className="section-title"><FaChartBar /> Class Overall Results - {teacherInfo.class}</h2>
                <div className="results-controls">
                  <select
                    value={selectedTerm}
                    onChange={e => setSelectedTerm(e.target.value)}
                    className="term-select"
                  >
                    <option value="1st">First Term</option>
                    <option value="2nd">Second Term</option>
                    <option value="3rd">Third Term</option>
                  </select>
                  <select
                    value={sessionId}
                    onChange={handleSessionChange}
                    className="session-input"
                    disabled={loading}
                  >
                    {availableSessions.length > 0 ? (
                      availableSessions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))
                    ) : (
                      <option value="">Loading sessions...</option>
                    )}
                  </select>
                  <button
                    onClick={fetchClassOverallResults}
                    className="btn btn-primary"
                    disabled={fetchingClassResults}
                  >
                    {fetchingClassResults ? <FaSpinner className="spinner-icon" /> : 'Load Results'}
                  </button>
                </div>
              </div>
              {fetchingClassResults ? (
                <div className="loading-state">
                  <FaSpinner className="spinner-icon" />
                  <p>Loading class results for {selectedTerm} term...</p>
                </div>
              ) : classOverallResults ? (
                <div className="class-results-container">
                  <div className="results-summary-card">
                    <h3>Class: {classOverallResults.class}</h3>
                    <p>Term: {classOverallResults.term} | Session: {classOverallResults.session_id}</p>
                    <p>Total Students: {classOverallResults.results.length}</p>
                  </div>
                  <div className="table-responsive">
                    <table className="data-table class-results-table">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Student Name</th>
                          <th>Total Score</th>
                          <th>Subjects</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {classOverallResults.results.map((student, index) => (
                          <tr key={student.id}>
                            <td>{student.position}</td>
                            <td>{student.full_name}</td>
                            <td>{student.term_total_score}</td>
                            <td>{student.subject_count}</td>
                            <td>{student.percentage}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="class-average">
                    <strong>Class Average:</strong> {classOverallResults.classAverage}
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
