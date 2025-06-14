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
  const [session, setSession] = useState('2023/2024');
  const [newSubject, setNewSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classOverallResults, setClassOverallResults] = useState(null);
  const [pt1, setPt1] = useState('');
  const [pt2, setPt2] = useState('');
  const [pt3, setPt3] = useState('');
  const [exam, setExam] = useState('');
  const [attendance, setAttendance] = useState('');
  const [punctuality, setPunctuality] = useState('');
  const [neatness, setNeatness] = useState('');
  const [honesty, setHonesty] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [creativity, setCreativity] = useState('');
  const [sports, setSports] = useState('');
  const [daysOpened, setDaysOpened] = useState('');
  const [daysPresent, setDaysPresent] = useState('');
  const [attendanceSuccess, setAttendanceSuccess] = useState(null);
  const [fetchingClassResults, setFetchingClassResults] = useState(false);
  const [submittingResults, setSubmittingResults] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);
  const [prefilling, setPrefilling] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    if (teacherUser) {
      setTeacherInfo(teacherUser);
      setLoading(false);
      if (teacherUser.class) {
        fetchClassStudents(teacherUser.class);
        fetchSubjects(teacherUser.class);
      }
    } else if (!token) {
      navigate('/login');
      setLoading(false);
    }
  }, [teacherUser, token, navigate]);

  const fetchClassStudents = async (teacherClass) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/students?class=${encodeURIComponent(teacherClass)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
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
  };

  const fetchSubjects = async (teacherClass) => {
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/subjects?class=${encodeURIComponent(teacherClass)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          navigate('/login');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error("Failed to fetch subjects:", error);
      setSubjects([]);
    }
  };

const fetchClassOverallResults = async () => {
  if (!teacherInfo?.class || !selectedTerm || !session) {
    alert('Please select both term and session to view class results');
    return;
  }
  
  setFetchingClassResults(true);
  try {
    const response = await fetch(
      `${API_BASE_URL}/teacher/class-overall-results?class=${encodeURIComponent(teacherInfo.class)}&term=${selectedTerm}&session_id=${session}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
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
};

useEffect(() => {
  if (activeTab === 'class-results' && teacherInfo?.class) {
    fetchClassOverallResults();
  }
}, [activeTab, selectedTerm, session, teacherInfo?.class]);

const fetchAcademicResultForPrefill = async (studentId, subjectId, term, session) => {
  if (!studentId || !subjectId || !term || !session) {
    return;
  }
  setPrefilling(true);
  try {
    const url = `${API_BASE_URL}/teacher/result/${encodeURIComponent(studentId)}/${encodeURIComponent(subjectId)}/${encodeURIComponent(term)}/${encodeURIComponent(session)}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch academic result for prefill:", error);
    return null;
  } finally {
    setPrefilling(false);
  }
};

const fetchPsychomotorForPrefill = async (studentId, term, session) => {
  if (!studentId || !term || !session) {
    return;
  }
  setPrefilling(true);
  try {
    const url = `${API_BASE_URL}/teacher/psychomotor/${encodeURIComponent(studentId)}/${encodeURIComponent(term)}/${encodeURIComponent(session)}`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch psychomotor result for prefill:", error);
    return null;
  } finally {
    setPrefilling(false);
  }
};

useEffect(() => {
  if (activeTab === 'upload') {
    setPt1(''); setPt2(''); setPt3(''); setExam('');
    setAttendance(''); setPunctuality(''); setNeatness('');
    setHonesty(''); setResponsibility(''); setCreativity(''); setSports('');
    setDaysOpened(''); setDaysPresent('');

    if (selectedStudent && selectedSubject && selectedTerm && session) {
      fetchAcademicResultForPrefill(selectedStudent, selectedSubject, selectedTerm, session)
        .then(data => {
          if (data && data.result) {
            setPt1(data.result.pt1 !== undefined ? data.result.pt1.toString() : '');
            setPt2(data.result.pt2 !== undefined ? data.result.pt2.toString() : '');
            setPt3(data.result.pt3 !== undefined ? data.result.pt3.toString() : '');
            setExam(data.result.exam !== undefined ? data.result.exam.toString() : '');
          }
        });
    }

    if (selectedStudent && selectedTerm && session) {
      fetchPsychomotorForPrefill(selectedStudent, selectedTerm, session)
        .then(data => {
          if (data) {
            if (data.psychomotor) {
              setAttendance(data.psychomotor.attendance || '');
              setPunctuality(data.psychomotor.punctuality || '');
              setNeatness(data.psychomotor.neatness || '');
              setHonesty(data.psychomotor.honesty || '');
              setResponsibility(data.psychomotor.responsibility || '');
              setCreativity(data.psychomotor.creativity || '');
              setSports(data.psychomotor.sports || '');
            }
            if (data.days_opened !== undefined && data.days_present !== undefined) {
              setDaysOpened(data.days_opened.toString());
              setDaysPresent(data.days_present.toString());
            }
          }
        });
    }
  }
}, [selectedStudent, selectedSubject, selectedTerm, session, activeTab, token]);

useEffect(() => {
  if (activeTab === 'attendance') {
    setDaysOpened('');
    setDaysPresent('');
    setAttendanceSuccess(null);

    if (selectedStudent && selectedTerm && session) {
      fetchPsychomotorForPrefill(selectedStudent, selectedTerm, session)
        .then(data => {
          if (data && data.days_opened !== undefined && data.days_present !== undefined) {
            setDaysOpened(data.days_opened.toString());
            setDaysPresent(data.days_present.toString());
          }
        });
    }
  }
}, [activeTab, selectedStudent, selectedTerm, session, token]);

  const fetchStudentResults = async (studentId, term, session) => {
  setFetchingResults(true);
  setResults(null);
  
  try {
    // 1. Validate inputs
    if (!studentId || !term || !session) {
      const missing = [];
      if (!studentId) missing.push('student ID');
      if (!term) missing.push('term');
      if (!session) missing.push('session');
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }

    // 2. Prepare request
    const encodedStudentId = encodeURIComponent(studentId);
    const encodedSession = encodeURIComponent(session);
    const url = `${API_BASE_URL}/teacher/student-results/${encodedStudentId}/${term}/${encodedSession}`;

    // 3. Make API call
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // 4. Handle response
    const responseText = await response.text();
    
    // Check for HTML error pages
    if (responseText.startsWith('<!DOCTYPE') || responseText.startsWith('<html')) {
      throw new Error('Server returned an error page');
    }

    // Parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', {
        status: response.status,
        response: responseText.substring(0, 200)
      });
      throw new Error('Invalid server response format');
    }

    // Check for API errors
    if (!response.ok) {
      throw new Error(
        data.message || 
        data.error?.message || 
        `Request failed with status ${response.status}`
      );
    }

    // 5. Transform data (optional - only if you need to modify the structure)
    const enhancedData = {
      ...data,
      // Add any frontend-specific transformations here
      attendanceRate: data.attendance?.days_opened 
        ? (data.attendance.days_present / data.attendance.days_opened * 100).toFixed(2)
        : null
    };

    // 6. Update state
    setResults(enhancedData);
    setSelectedStudent(studentId);
    setActiveTab('results');

    return enhancedData;

  } catch (error) {
    console.error('Error fetching student results:', {
      studentId,
      term,
      session,
      error: error.message
    });

    // Enhanced error messages
    let userMessage = error.message;
    if (error.message.includes('Unauthorized')) {
      userMessage = 'You are not authorized to view these results';
    } else if (error.message.includes('not found')) {
      userMessage = 'Student record not found';
    }

    alert(`Error: ${userMessage}`);
    setResults(null);
    throw error; 
    
  } finally {
    setFetchingResults(false);
  }
};
  
  const handleSubmitResults = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }
    if (!selectedSubject) {
      alert('Please select a subject');
      return;
    }
    if (parseInt(pt1) > 30 || parseInt(pt2) > 30 || parseInt(pt3) > 30) {
      alert('PT scores cannot exceed 30 marks each');
      return;
    }
    if (parseInt(exam) > 70) {
      alert('Exam score cannot exceed 70 marks');
      return;
    }

    if ([pt1, pt2, pt3, exam].some(score => score === '' || isNaN(parseInt(score)))) {
      alert('Please enter valid numeric scores for all PTs and Exam.');
      return;
    }

    if ([attendance, punctuality, neatness, honesty, responsibility, creativity, sports].some(skill => skill === '')) {
      alert('Please select a grade for all psychomotor skills.');
      return;
    }

    setSubmittingResults(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/results`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify({
          student_id: selectedStudent,
          term: selectedTerm,
          session,
          subject_id: selectedSubject,
          pt1: parseInt(pt1),
          pt2: parseInt(pt2),
          pt3: parseInt(pt3),
          exam: parseInt(exam),
          attendance,
          punctuality,
          neatness,
          honesty,
          responsibility,
          creativity,
          sports
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to upload results`);
      }

      alert('Results uploaded successfully!');
      if (selectedStudent && selectedSubject && selectedTerm && session) {
        fetchAcademicResultForPrefill(selectedStudent, selectedSubject, selectedTerm, session);
      }
      if (selectedStudent && selectedTerm && session) {
        fetchPsychomotorForPrefill(selectedStudent, selectedTerm, session);
      }
    } catch (error) {
      alert(`Error uploading results: ${error.message}`);
    } finally {
      setSubmittingResults(false);
    }
  };

  const resetUploadForm = () => {
    setSelectedStudent('');
    setSelectedSubject('');
    setPt1('');
    setPt2('');
    setPt3('');
    setExam('');
    setAttendance('');
    setPunctuality('');
    setNeatness('');
    setHonesty('');
    setResponsibility('');
    setCreativity('');
    setSports('');
  };

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
          session,
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
        credentials: 'include',
        body: JSON.stringify({ subject_name: newSubject.trim(), class_name: teacherInfo?.class })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to add subject`);
      }

      alert('Subject added successfully!');
      setNewSubject('');
      if (teacherInfo?.class) {
        await fetchSubjects(teacherInfo.class);
      }
    } catch (error) {
      alert(`Error adding subject: ${error.message}`);
    } finally {
      setAddingSubject(false);
    }
  };

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
            <li className={activeTab === 'upload' ? 'active' : ''} onClick={() => setActiveTab('upload')}>
              <FaUpload className="menu-icon" /> <span className="menu-text">Upload Results</span>
            </li>
            <li className={activeTab === 'attendance' ? 'active' : ''} onClick={() => setActiveTab('attendance')}>
              <FaCalendarAlt className="menu-icon" /> <span className="menu-text">Record Attendance</span>
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
                          onClick={() => fetchStudentResults(student.student_id || student.id, selectedTerm, session)}
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
                              onClick={() => {
                                setSelectedSubject(subject.id);
                                setActiveTab('upload');
                              }}
                              className="btn btn-secondary btn-sm"
                            >
                              <FaUpload /> Upload Results
                            </button>
                          </td>
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

          {activeTab === 'upload' && (
            <section className="dashboard-section upload-results-section">
              <div className="section-header">
                <h2 className="section-title"><FaUpload /> Upload Student Results</h2>
                <button
                  onClick={() => setActiveTab('subjects')}
                  className="btn btn-back"
                >
                  <FaArrowLeft /> Back to Subjects
                </button>
              </div>

              <form onSubmit={handleSubmitResults} className="data-form upload-form">
                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="select-student">Select Student: <span className="required">*</span></label>
                    <select
                      id="select-student"
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
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
                    <label htmlFor="select-subject">Select Subject: <span className="required">*</span></label>
                    <select
                      id="select-subject"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      required
                    >
                      <option value="">Choose a subject...</option>
                      {subjects.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    {subjects.length === 0 && (
                      <p className="form-hint">
                        No subjects available. <button type="button" onClick={() => setActiveTab('add-subject')} className="link-btn">Add subjects first</button>
                      </p>
                    )}
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="select-term">Term: <span className="required">*</span></label>
                    <select
                      id="select-term"
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      required
                    >
                      <option value="1st">First Term</option>
                      <option value="2nd">Second Term</option>
                      <option value="3rd">Third Term</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="academic-session">Academic Session: <span className="required">*</span></label>
                    <input
                      type="text"
                      id="academic-session"
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      placeholder="e.g., 2023/2024"
                      required
                    />
                  </div>
                </div>

                <h3 className="form-section-heading">Academic Scores {prefilling && selectedStudent && selectedSubject ? <FaSpinner className="spinner-icon-inline" /> : ''}</h3>

                <div className="form-grid-4">
                  <div className="form-group">
                    <label htmlFor="pt1">PT 1 Score: <span className="required">*</span></label>
                    <input
                      type="number"
                      id="pt1"
                      min="0"
                      max="30"
                      value={pt1}
                      onChange={(e) => setPt1(e.target.value)}
                      placeholder="Max: 30"
                      required
                    />
                    <small className="input-hint">Out of 30 marks</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pt2">PT 2 Score: <span className="required">*</span></label>
                    <input
                      type="number"
                      id="pt2"
                      min="0"
                      max="30"
                      value={pt2}
                      onChange={(e) => setPt2(e.target.value)}
                      placeholder="Max: 30"
                      required
                    />
                    <small className="input-hint">Out of 30 marks</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pt3">PT 3 Score: <span className="required">*</span></label>
                    <input
                      type="number"
                      id="pt3"
                      min="0"
                      max="30"
                      value={pt3}
                      onChange={(e) => setPt3(e.target.value)}
                      placeholder="Max: 30"
                      required
                    />
                    <small className="input-hint">Out of 30 marks</small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="exam-score">Exam Score: <span className="required">*</span></label>
                    <input
                      type="number"
                      id="exam-score"
                      min="0"
                      max="70"
                      value={exam}
                      onChange={(e) => setExam(e.target.value)}
                      placeholder="Max: 70"
                      required
                    />
                    <small className="input-hint">Out of 70 marks</small>
                  </div>
                </div>

                {pt1 !== '' && pt2 !== '' && pt3 !== '' && exam !== '' && (
                  <div className="score-preview">
                    <h4>Score Preview:</h4>
                    <p>Average PT: {Math.round((parseInt(pt1 || 0) + parseInt(pt2 || 0) + parseInt(pt3 || 0)) / 3)}</p>
                    <p>Total Score: {Math.round((parseInt(pt1 || 0) + parseInt(pt2 || 0) + parseInt(pt3 || 0)) / 3 + parseInt(exam || 0))}/100</p>
                  </div>
                )}

                <h3 className="form-section-heading">Psychomotor Skills Assessment {prefilling && selectedStudent ? <FaSpinner className="spinner-icon-inline" /> : ''}</h3>

                <div className="form-grid-3">
                  {[
                    { key: 'attendance', label: 'Attendance', value: attendance, setter: setAttendance },
                    { key: 'punctuality', label: 'Punctuality', value: punctuality, setter: setPunctuality },
                    { key: 'neatness', label: 'Neatness', value: neatness, setter: setNeatness },
                    { key: 'honesty', label: 'Honesty', value: honesty, setter: setHonesty },
                    { key: 'responsibility', label: 'Responsibility', value: responsibility, setter: setResponsibility },
                    { key: 'creativity', label: 'Creativity', value: creativity, setter: setCreativity },
                    { key: 'sports', label: 'Sports/Physical Activity', value: sports, setter: setSports }
                  ].map((skill) => (
                    <div key={skill.key} className="form-group">
                      <label htmlFor={skill.key}>{skill.label}: <span className="required">*</span></label>
                      <select
                        id={skill.key}
                        value={skill.value}
                        onChange={(e) => skill.setter(e.target.value)}
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
                    type="button"
                    onClick={resetUploadForm}
                    className="btn btn-secondary"
                    disabled={submittingResults || prefilling}
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingResults || prefilling}
                  >
                    {submittingResults ? <FaSpinner className="spinner-icon" /> : 'Upload Results'}
                  </button>
                </div>
              </form>
            </section>
          )}

          {activeTab === 'attendance' && (
            <section className="dashboard-section record-attendance-section">
              <h2 className="section-title"><FaCalendarAlt /> Record Student Attendance {prefilling && selectedStudent ? <FaSpinner className="spinner-icon-inline" /> : ''}</h2>
              <form onSubmit={handleSubmitAttendance} className="data-form attendance-form">
                <div className="form-grid-1">
                  <div className="form-group">
                    <label htmlFor="attendance-student">Select Student: <span className="required">*</span></label>
                    <select
                      id="attendance-student"
                      value={selectedStudent}
                      onChange={(e) => setSelectedStudent(e.target.value)}
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
                    <label htmlFor="attendance-term">Term: <span className="required">*</span></label>
                    <select
                      id="attendance-term"
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      required
                    >
                      <option value="1st">First Term</option>
                      <option value="2nd">Second Term</option>
                      <option value="3rd">Third Term</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="attendance-session">Academic Session: <span className="required">*</span></label>
                    <input
                      type="text"
                      id="attendance-session"
                      value={session}
                      onChange={(e) => setSession(e.target.value)}
                      placeholder="e.g., 2023/2024"
                      required
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label htmlFor="days-opened">Days School Opened: <span className="required">*</span></label>
                    <input
                      type="number"
                      id="days-opened"
                      min="1"
                      value={daysOpened}
                      onChange={(e) => setDaysOpened(e.target.value)}
                      placeholder="Total school days"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="days-present">Days Present: <span className="required">*</span></label>
                    <input
                      type="number"
                      id="days-present"
                      min="0"
                      value={daysPresent}
                      onChange={(e) => setDaysPresent(e.target.value)}
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
                    type="button"
                    onClick={() => {
                      setSelectedStudent('');
                      setDaysOpened('');
                      setDaysPresent('');
                      setAttendanceSuccess(null);
                    }}
                    className="btn btn-secondary"
                    disabled={submittingAttendance || prefilling}
                  >
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submittingAttendance || prefilling}
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
                    <label htmlFor="new-subject-name">Subject Name: <span className="required">*</span></label>
                    <input
                      type="text"
                      id="new-subject-name"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="e.g., Mathematics, English Language, Biology"
                      required
                    />
                    <small className="input-hint">Enter the name of the subject you want to add to {teacherInfo.class}</small>
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

                {subjects.length > 0 && (
                  <div className="existing-subjects-card">
                    <h3 className="card-title">Current Subjects for {teacherInfo.class}:</h3>
                    <div className="subjects-tags-container">
                      {subjects.map(subject => (
                        <span key={subject.id} className="subject-tag">
                          {subject.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
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
                  <p>Loading results for {classStudents.find(s => (s.student_id || s.id) === selectedStudent)?.full_name || 'selected student'}...</p>
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
                              {results.term !== '1st' && <th>1st Term Total</th>}
                              {results.term === '3rd' && <th>2nd Term Total</th>}
                              {results.term !== '1st' && <th>Cum. Avg</th>}
                              <th>Class Avg</th>
                              <th>Grade</th>
                              <th>Remark</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.academicResults.map((result, index) => (
                              <tr key={index}>
                                <td>{result.subject_name || result.subject}</td>
                                <td>{result.pt1}</td>
                                <td>{result.pt2}</td>
                                <td>{result.pt3}</td>
                                <td>{result.avg_pt !== undefined ? Math.round(result.avg_pt) : 'N/A'}</td>
                                <td>{result.exam}</td>
                                <td>{result.total_score}</td>
                                {results.term !== '1st' && (
                                  <td>{result.first_term_total_score !== null ? result.first_term_total_score : 'N/A'}</td>
                                )}
                                {results.term === '3rd' && (
                                  <td>{result.second_term_total_score !== null ? result.second_term_total_score : 'N/A'}</td>
                                )}
                                {results.term !== '1st' && (
                                    <td>{result.subject_cum_avg !== null ? result.subject_cum_avg : 'N/A'}</td>
                                )}
                                <td>N/A</td>
                                <td className={`grade-cell grade-${result.grade ? result.grade.toLowerCase() : ''}`}>{result.grade}</td>
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
                      <button onClick={() => { setActiveTab('upload'); setSelectedStudent(results.student?.student_id || results.student?.id); }} className="btn btn-primary">
                        Upload Results for {results.student?.full_name}
                      </button>
                    </div>
                  )}

                  {results.psychomotor && Object.keys(results.psychomotor).length > 0 && (
                    <div className="results-table-card">
                      <h4 className="card-title">Psychomotor Skills</h4>
                      <div className="table-responsive">
                        <table className="data-table psychomotor-table">
                          <tbody>
                            {Object.entries(results.psychomotor).map(([skill, value]) => (
                              <tr key={skill}>
                                <td className="skill-name">{skill.replace(/_/g, ' ')}</td>
                                <td className="skill-grade">{value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {results.overallPerformance && (
                    <div className="overall-performance-card">
                      <h4 className="card-title">Overall Performance Summary</h4>
                      <div className="performance-stats-grid">
                        <div className="stat-item">
                          <label className="stat-label">Total Score (Current Term):</label>
                          <span className="stat-value">{results.overallPerformance.totalScored}/{results.overallPerformance.totalObtainable}</span>
                        </div>
                        <div className="stat-item">
                          <label className="stat-label">Percentage (Current Term):</label>
                          <span className="stat-value">{results.overallPerformance.percentage}%</span>
                        </div>
                        {results.term !== '1st' && results.overallPerformance.firstTermTotalScore !== null && (
                            <div className="stat-item">
                                <label className="stat-label">1st Term Total Score:</label>
                                <span className="stat-value">{results.overallPerformance.firstTermTotalScore}</span>
                            </div>
                        )}
                        {results.term === '3rd' && results.overallPerformance.secondTermTotalScore !== null && (
                            <div className="stat-item">
                                <label className="stat-label">2nd Term Total Score:</label>
                                <span className="stat-value">{results.overallPerformance.secondTermTotalScore}</span>
                            </div>
                        )}
                        {results.term !== '1st' && results.overallPerformance.cumulativeAverage !== null && (
                            <div className="stat-item">
                                <label className="stat-label">Cumulative Overall Avg:</label>
                                <span className="stat-value">{results.overallPerformance.cumulativeAverage}%</span>
                            </div>
                        )}

                        <div className="stat-item">
                          <label className="stat-label">Position:</label>
                          <span className="stat-value">{results.overallPerformance.position}</span>
                        </div>
                        <div className="stat-item">
                          <label className="stat-label">Attendance:</label>
                          <span className="stat-value">
                            {results.attendance ?
                              `${results.attendance.days_present}/${results.attendance.days_opened} days (${Math.round((results.attendance.days_present / results.attendance.days_opened) * 100)}%)` :
                              'N/A'
                            }
                          </span>
                        </div>
                      </div>
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
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="term-select"
                  >
                    <option value="1st">First Term</option>
                    <option value="2nd">Second Term</option>
                    <option value="3rd">Third Term</option>
                  </select>
                  <input
                    type="text"
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    placeholder="Session (e.g., 2023/2024)"
                    className="session-input"
                  />
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
                  <p>Loading class results for {selectedTerm} term, {session} session...</p>
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
                                  fetchStudentResults(student.id, selectedTerm, session);
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
