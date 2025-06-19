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
  FaTimesCircle,
  FaHeartbeat // New icon for Psychomotor
} from 'react-icons/fa';
import './TeacherDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

function TeacherDashboard({ teacherUser, token }) {
  // --- DEBUGGING: Log component renders ---
  console.log('TeacherDashboard component rendering...');

  const navigate = useNavigate();
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('students');
  const [classStudents, setClassStudents] = useState([]);
  const [subjects, setSubjects] = useState([]); // All subjects for the teacher's class
  const [selectedStudent, setSelectedStudent] = useState(''); // Used for single-student view and pre-populating forms
  const [results, setResults] = useState(null); // For individual student results (academic, psychomotor, attendance)
  const [selectedTerm, setSelectedTerm] = useState('1st');
  const [session, setSession] = useState(''); // Initialize as empty string, will be set from localStorage or fetched sessions
  const [availableSessions, setAvailableSessions] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [classOverallResults, setClassOverallResults] = useState(null);

  // Academic Scores for MULTI-STUDENT Bulk Upload
  const [academicDataGrid, setAcademicDataGrid] = useState([]); // [{ student_id, full_name, subject_scores: { subject_id: { pt1, pt2, pt3, exam } } }]
  const [submittingAcademicResultsBulk, setSubmittingAcademicResultsBulk] = useState(false);

  // Individual Student Academic Score States (for single student view via "View Details" button)
  const [singleStudentAcademicPt1, setSingleStudentAcademicPt1] = useState('');
  const [singleStudentAcademicPt2, setSingleStudentAcademicPt2] = useState('');
  const [singleStudentAcademicPt3, setSingleStudentAcademicPt3] = useState('');
  const [singleStudentAcademicExam, setSingleStudentAcademicExam] = useState('');
  const [singleSelectedSubject, setSingleSelectedSubject] = useState(''); // For single student academic upload

  // Psychomotor Skill States (for individual student upload in new separate tab)
  const [psychomotorResults, setPsychomotorResults] = useState(null); // For prefill
  const [attendanceSkill, setAttendanceSkill] = useState('');
  const [punctuality, setPunctuality] = useState('');
  const [neatness, setNeatness] = useState('');
  const [honesty, setHonesty] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [creativity, setCreativity] = useState('');
  const [sports, setSports] = useState('');
  const [submittingPsychomotorSkills, setSubmittingPsychomotorSkills] = useState(false);
  const [psychomotorPrefill, setPsychomotorPrefill] = useState(null);

  // Attendance Specific States (for individual student upload in Academic & Attendance tab)
  const [daysOpened, setDaysOpened] = useState('');
  const [daysPresent, setDaysPresent] = useState('');
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [attendancePrefill, setAttendancePrefill] = useState(null);

  // General Loading/Submitting States
  const [fetchingClassResults, setFetchingClassResults] = useState(false);
  const [addingSubject, setAddingSubject] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false); // For single student result view
  const [prefilling, setPrefilling] = useState(false); // For academic prefill (old) or psychomotor/attendance prefill

  const handleLogout = useCallback(() => {
    console.log('handleLogout called'); // DEBUGGING
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  }, [navigate]);

  const fetchClassStudents = useCallback(async (teacherClass) => {
    console.log('fetchClassStudents called for class:', teacherClass); // DEBUGGING
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
    console.log('fetchSubjects called for class:', teacherClass); // DEBUGGING
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
    console.log('fetchSessions called'); // DEBUGGING
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
      return data.sessions || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }, [token, handleLogout]);

  // NEW: Fetch all academic results for the class to prefill the bulk upload grid
  const prefillAllAcademicResults = useCallback(async () => {
    console.log('prefillAllAcademicResults called with:', { class: teacherInfo?.class, selectedTerm, session }); // DEBUGGING
    if (!teacherInfo?.class || !selectedTerm || !session) {
      // Don't alert here, as this function will be called on mount/selector change
      return;
    }
    const selectedSessionObject = availableSessions.find(s => s.name === session);
    if (!selectedSessionObject) {
      console.warn('Selected session not found for prefill. Session:', session); // DEBUGGING
      return;
    }
    const sessionId = selectedSessionObject.id;

    setSubmittingAcademicResultsBulk(true); // Use this state for prefilling too, to indicate data loading
    try {
      // Assuming a backend endpoint like /teacher/academic-results/class-prefill
      // that returns all academic results for a class, term, and session
      const response = await fetch(
        `${API_BASE_URL}/teacher/academic-results/class-prefill?class_id=${encodeURIComponent(teacherInfo.class)}&term=${selectedTerm}&session_id=${sessionId}`,
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
      const data = await response.json(); // Expected format: [{ student_id, full_name, subjects: [{ subject_id, pt1, pt2, ... }] }]

      // Initialize academicDataGrid with all students and prefill existing scores
      const newAcademicDataGrid = classStudents.map(student => {
        const studentData = data.find(item => item.student_id === student.id);
        const subjectScores = {};
        subjects.forEach(subject => {
          const score = studentData?.subjects.find(s => s.subject_id === subject.id);
          subjectScores[subject.id] = {
            pt1: score?.pt1 || '',
            pt2: score?.pt2 || '',
            pt3: score?.pt3 || '',
            exam: score?.exam || '',
          };
        });
        return {
          student_id: student.id,
          full_name: student.full_name,
          subject_scores: subjectScores,
        };
      });
      setAcademicDataGrid(newAcademicDataGrid);

    } catch (error) {
      console.error('Error prefilling academic results for class:', error);
      alert(`Failed to prefill academic results: ${error.message}`);
      // Fallback: Initialize with empty grid if prefill fails
      const emptyAcademicDataGrid = classStudents.map(student => {
        const subjectScores = {};
        subjects.forEach(subject => {
          subjectScores[subject.id] = { pt1: '', pt2: '', pt3: '', exam: '' };
        });
        return { student_id: student.id, full_name: student.full_name, subject_scores: subjectScores };
      });
      setAcademicDataGrid(emptyAcademicDataGrid);
    } finally {
      setSubmittingAcademicResultsBulk(false); // End loading for prefill
    }
  }, [teacherInfo?.class, selectedTerm, session, availableSessions, classStudents, subjects, token, handleLogout]);


  const fetchClassOverallResults = useCallback(async () => {
    console.log('fetchClassOverallResults called with:', { class: teacherInfo?.class, selectedTerm, session }); // DEBUGGING
    if (!teacherInfo?.class || !selectedTerm || !session) {
      alert('Please select both term and session to view class results');
      return;
    }
    setFetchingClassResults(true);
    try {
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
    console.log('fetchStudentResults called for student:', studentId, 'term:', term, 'session:', sessionId); // DEBUGGING
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
    console.log('addSubject called for:', newSubject); // DEBUGGING
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
        body: JSON.stringify({ subject_name: newSubject, class_name: teacherInfo.class }), // Pass class_name
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
    console.log('deleteSubject called for ID:', subjectId); // DEBUGGING
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


  // NEW: Handle input changes in the academic data grid
  const handleAcademicScoreChange = useCallback((studentId, subjectId, scoreType, value) => {
    console.log('handleAcademicScoreChange called for student:', studentId, 'subject:', subjectId, 'type:', scoreType, 'value:', value); // DEBUGGING
    setAcademicDataGrid(prevGrid =>
      prevGrid.map(studentRow =>
        studentRow.student_id === studentId
          ? {
              ...studentRow,
              subject_scores: {
                ...studentRow.subject_scores,
                [subjectId]: {
                  ...studentRow.subject_scores[subjectId],
                  [scoreType]: value === '' ? '' : Number(value), // Keep empty string for empty input, convert to number otherwise
                },
              },
            }
          : studentRow
      )
    );
  }, []);

  // NEW: Submit all academic results from the grid
  const submitAllAcademicResults = useCallback(async () => {
    console.log('submitAllAcademicResults called'); // DEBUGGING
    if (!selectedTerm || !session) {
      alert('Please select term and session.');
      return;
    }

    const selectedSessionObject = availableSessions.find(s => s.name === session);
    if (!selectedSessionObject) {
      alert('Selected session not found. Please choose a valid session.');
      return;
    }
    const sessionId = selectedSessionObject.id;

    // Flatten the academicDataGrid into the format expected by the bulk API
    // [{ student_id, subject_id, term, session_id, pt1, pt2, pt3, exam }]
    const academicResultsToSubmit = [];
    academicDataGrid.forEach(studentRow => {
      subjects.forEach(subject => {
        const scores = studentRow.subject_scores[subject.id];
        // Only include if at least one score is provided
        if (scores && (scores.pt1 !== '' || scores.pt2 !== '' || scores.pt3 !== '' || scores.exam !== '')) {
          academicResultsToSubmit.push({
            student_id: studentRow.student_id,
            subject_id: subject.id,
            term: selectedTerm,
            session_id: sessionId,
            pt1: scores.pt1 === '' ? null : scores.pt1,
            pt2: scores.pt2 === '' ? null : scores.pt2,
            pt3: scores.pt3 === '' ? null : scores.pt3,
            exam: scores.exam === '' ? null : scores.exam,
          });
        }
      });
    });

    if (academicResultsToSubmit.length === 0) {
      alert('No academic results entered to submit.');
      return;
    }

    setSubmittingAcademicResultsBulk(true);
    try {
      const response = await fetch(`${API_BASE_URL}/teacher/results/academic-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ academicResults: academicResultsToSubmit }),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      alert(data.message);
      // Re-prefill the grid to show saved state
      prefillAllAcademicResults();
    } catch (error) {
      console.error("Failed to submit academic results:", error);
      alert(`Failed to submit academic results: ${error.message}`);
    } finally {
      setSubmittingAcademicResultsBulk(false);
    }
  }, [academicDataGrid, selectedTerm, session, availableSessions, subjects, token, prefillAllAcademicResults, handleLogout]);


  // Prefill Psychomotor Skills (for new dedicated tab)
  const prefillPsychomotorSkills = useCallback(async () => {
    console.log('prefillPsychomotorSkills called for student:', selectedStudent); // DEBUGGING
    if (!selectedStudent || !selectedTerm || !session) {
      alert('Please select student, term, and session to prefill psychomotor results.');
      return;
    }
    const selectedSessionObject = availableSessions.find(s => s.name === session);
    if (!selectedSessionObject) {
      alert('Selected session not found. Please choose a valid session.');
      return;
    }
    const sessionId = selectedSessionObject.id;

    setPrefilling(true);
    setPsychomotorPrefill(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/teacher/psychomotor-skills-prefill?student_id=${selectedStudent}&term=${selectedTerm}&session_id=${sessionId}`,
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
      setAttendanceSkill(data.result?.attendance || '');
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
  }, [selectedStudent, selectedTerm, session, token, availableSessions, handleLogout]);

  // Submit Psychomotor Skills (for new dedicated tab)
  const submitPsychomotorSkills = useCallback(async () => {
    console.log('submitPsychomotorSkills called'); // DEBUGGING
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
      attendance: attendanceSkill,
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
      setAttendanceSkill(''); setPunctuality(''); setNeatness(''); setHonesty('');
      setResponsibility(''); setCreativity(''); setSports('');
      setPsychomotorPrefill(null);
      // Optionally, prefill again to confirm save
      prefillPsychomotorSkills();
    } catch (error) {
      console.error("Failed to submit psychomotor skills:", error);
      alert(`Failed to submit psychomotor skills: ${error.message}`);
    } finally {
      setSubmittingPsychomotorSkills(false);
    }
  }, [selectedStudent, selectedTerm, session, attendanceSkill, punctuality, neatness, honesty, responsibility, creativity, sports, token, availableSessions, handleLogout, prefillPsychomotorSkills]);


  // Prefill Attendance (for Academic & Attendance tab - single student)
  const prefillAttendance = useCallback(async () => {
    console.log('prefillAttendance called for student:', selectedStudent); // DEBUGGING
    if (!selectedStudent || !selectedTerm || !session) {
      alert('Please select student, term, and session to prefill attendance.');
      return;
    }
    const selectedSessionObject = availableSessions.find(s => s.name === session);
    if (!selectedSessionObject) {
      alert('Selected session not found. Please choose a valid session.');
      return;
    }
    const sessionId = selectedSessionObject.id;

    setPrefilling(true);
    setAttendancePrefill(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/teacher/attendance-prefill?student_id=${selectedStudent}&term=${selectedTerm}&session_id=${sessionId}`,
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
  }, [selectedStudent, selectedTerm, session, token, availableSessions, handleLogout]);

  // Submit Attendance (for Academic & Attendance tab - single student)
  const submitAttendance = useCallback(async () => {
    console.log('submitAttendance called'); // DEBUGGING
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
      // Clear form or prefill again
      setDaysOpened(''); setDaysPresent('');
      setAttendancePrefill(null);
      // Optionally, prefill again to confirm save
      prefillAttendance();
    } catch (error) {
      console.error("Failed to submit attendance:", error);
      alert(`Failed to submit attendance: ${error.message}`);
    } finally {
      setSubmittingAttendance(false);
    }
  }, [selectedStudent, selectedTerm, session, daysOpened, daysPresent, token, availableSessions, handleLogout, prefillAttendance]);


  // Main useEffect for initial data loading
  useEffect(() => {
    console.log('useEffect: Initial data loading triggered'); // DEBUGGING
    if (!token) {
      navigate('/login');
      return;
    }
    setLoading(true);
    if (teacherUser) {
      setTeacherInfo(teacherUser);
      const initialFetches = [
        fetchClassStudents(teacherUser.class),
        fetchSubjects(teacherUser.class),
        fetchSessions().then(sessionsData => {
          setAvailableSessions(sessionsData);
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
        })
      ];

      Promise.all(initialFetches)
        .catch(error => console.error("Initial data fetch error:", error))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [teacherUser, token, navigate, fetchClassStudents, fetchSubjects, fetchSessions]);


  // DEBUGGING: Temporarily COMMENT OUT this useEffect to check for blinking issue
  // This useEffect re-fetches class students/subjects/academic grid if class, term, or session changes
  /*
  useEffect(() => {
    console.log('useEffect: Class/Tab/Session change detected. Dependencies:', { class: teacherInfo?.class, activeTab, selectedTerm, session, classStudentsLength: classStudents.length, subjectsLength: subjects.length }); // DEBUGGING
    if (teacherInfo?.class && activeTab === 'students') {
      fetchClassStudents(teacherInfo.class);
    }
    if (teacherInfo?.class && activeTab === 'subjects') {
      fetchSubjects(teacherInfo.class);
    }
    // New: Fetch all academic results when class, term, or session changes on the 'academic-attendance' tab
    if (activeTab === 'academic-attendance' && teacherInfo?.class && selectedTerm && session && classStudents.length > 0 && subjects.length > 0) {
      prefillAllAcademicResults();
    }
  }, [teacherInfo?.class, activeTab, selectedTerm, session, classStudents.length, subjects.length, fetchClassStudents, fetchSubjects, prefillAllAcademicResults]);
  */

  // DEBUGGING: Temporarily COMMENT OUT this useEffect to check for blinking issue
  // Effect for class overall results tab
  /*
  useEffect(() => {
    console.log('useEffect: Class Results tab active. Dependencies:', { activeTab, selectedTerm, session, class: teacherInfo?.class }); // DEBUGGING
    if (activeTab === 'class-results' && teacherInfo?.class && selectedTerm && session) {
      fetchClassOverallResults();
    }
  }, [activeTab, selectedTerm, session, teacherInfo?.class, fetchClassOverallResults]);
  */

  // Handle session change
  const handleSessionChange = (e) => {
    console.log('handleSessionChange called. New session:', e.target.value); // DEBUGGING
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

  if (!teacherInfo) {
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
            <button onClick={() => setActiveTab('academic-attendance')} className={activeTab === 'academic-attendance' ? 'active' : ''}>
              <FaUpload /> Academic & Attendance
            </button>
          </li>
          <li>
            <button onClick={() => setActiveTab('psychomotor')} className={activeTab === 'psychomotor' ? 'active' : ''}>
              <FaHeartbeat /> Psychomotor Skills
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
                                // Reset single student form states
                                setSingleSelectedSubject('');
                                setSingleStudentAcademicPt1('');
                                setSingleStudentAcademicPt2('');
                                setSingleStudentAcademicPt3('');
                                setSingleStudentAcademicExam('');
                                setDaysOpened('');
                                setDaysPresent('');
                                setResults(null); // Clear previous single student view results
                                setActiveTab('academic-attendance'); // Direct to academic-attendance for this student
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

          {activeTab === 'academic-attendance' && (
            <section className="academic-attendance-section">
              <h3>Academic & Attendance Records</h3>
              <p className="text-muted">Enter academic scores for all students in the class. Attendance is managed per student below.</p>

              <div className="form-row mb-4">
                <div className="form-group col-md-6">
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
                <div className="form-group col-md-6">
                  <label>Session:</label>
                  <select
                    value={session}
                    onChange={handleSessionChange}
                    className="form-control"
                  >
                    <option value="">{availableSessions.length > 0 ? "-- Select Session --" : "Loading sessions..."}</option>
                    {availableSessions.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedTerm && session && classStudents.length > 0 && subjects.length > 0 ? (
                <>
                  <h4 className="mt-4">Academic Results (Bulk Entry)</h4>
                  {submittingAcademicResultsBulk ? (
                    <div className="loading-indicator">
                      <FaSpinner className="spinner" /> <p>Loading academic data...</p>
                    </div>
                  ) : (
                    <div className="academic-bulk-table-container table-responsive">
                      <table className="table table-bordered table-sm academic-bulk-table">
                        <thead>
                          <tr>
                            <th rowSpan="2">Student Name</th>
                            {subjects.map(subject => (
                              <th colSpan="4" key={subject.id} className="text-center bg-light">{subject.name}</th>
                            ))}
                          </tr>
                          <tr>
                            {subjects.map(subject => (
                              <React.Fragment key={`${subject.id}-scores`}>
                                <th>PT1</th>
                                <th>PT2</th>
                                <th>PT3</th>
                                <th>Exam</th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {academicDataGrid.map(studentRow => (
                            <tr key={studentRow.student_id}>
                              <td>{studentRow.full_name}</td>
                              {subjects.map(subject => (
                                <React.Fragment key={`${studentRow.student_id}-${subject.id}-inputs`}>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={studentRow.subject_scores[subject.id]?.pt1 || ''}
                                      onChange={(e) => handleAcademicScoreChange(studentRow.student_id, subject.id, 'pt1', e.target.value)}
                                      min="0" max="100" // Example range, adjust as needed
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={studentRow.subject_scores[subject.id]?.pt2 || ''}
                                      onChange={(e) => handleAcademicScoreChange(studentRow.student_id, subject.id, 'pt2', e.target.value)}
                                      min="0" max="100"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={studentRow.subject_scores[subject.id]?.pt3 || ''}
                                      onChange={(e) => handleAcademicScoreChange(studentRow.student_id, subject.id, 'pt3', e.target.value)}
                                      min="0" max="100"
                                    />
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      className="form-control form-control-sm"
                                      value={studentRow.subject_scores[subject.id]?.exam || ''}
                                      onChange={(e) => handleAcademicScoreChange(studentRow.student_id, subject.id, 'exam', e.target.value)}
                                      min="0" max="100"
                                    />
                                  </td>
                                </React.Fragment>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <button
                    onClick={submitAllAcademicResults}
                    className="btn btn-success mt-3"
                    disabled={submittingAcademicResultsBulk}
                  >
                    {submittingAcademicResultsBulk ? <FaSpinner className="spinner-sm" /> : "Submit All Academic Results"}
                  </button>

                  <hr className="my-5" /> {/* Separator for attendance */}

                  {/* Attendance Records - still managed per student here */}
                  <h4 className="mt-4">Attendance Records (Per Student)</h4>
                  <div className="form-group">
                    <label>Select Student for Attendance:</label>
                    <select
                      value={selectedStudent}
                      onChange={(e) => {
                        setSelectedStudent(e.target.value);
                        // Reset attendance fields when student changes
                        setDaysOpened('');
                        setDaysPresent('');
                        setAttendancePrefill(null);
                        setResults(null); // Clear overall results for previous student
                      }}
                      className="form-control"
                    >
                      <option value="">-- Select Student --</option>
                      {classStudents.map(student => (
                        <option key={student.id} value={student.id}>{student.full_name} ({student.student_id})</option>
                      ))}
                    </select>
                  </div>

                  {selectedStudent && selectedTerm && session && (
                    <div className="attendance-forms-container">
                      <button
                        onClick={prefillAttendance}
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
                        <div className="mt-4 results-display-container">
                          <h5 className="mb-3">Detailed Results for Student</h5>

                          {/* Academic Results Section */}
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
                                        <tr key={res.id || res.subject_name}>
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

                          {/* Psychomotor Skills Section (This will now be less relevant here as it has its own tab, but displayed if part of fetched results) */}
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

                          {/* Attendance Records Section */}
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
                </>
              ) : (
                <div className="alert alert-info mt-4" role="alert">
                  Please select a Term and Session, and ensure students and subjects are available to begin bulk entry.
                </div>
              )}
            </section>
          )}

          {activeTab === 'psychomotor' && (
            <section className="psychomotor-section">
              <h3>Upload Psychomotor Skills (Per Student)</h3>
              <p className="text-muted">Select a student, term, and session to enter or update their psychomotor skills.</p>
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
                <div className="form-group col-md-6">
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
                <div className="form-group col-md-6">
                  <label>Session:</label>
                  <select
                    value={session}
                    onChange={handleSessionChange}
                    className="form-control"
                  >
                    <option value="">{availableSessions.length > 0 ? "-- Select Session --" : "Loading sessions..."}</option>
                    {availableSessions.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedStudent && selectedTerm && session ? (
                <div className="psychomotor-forms-container">
                  <h4 className="mt-4">Psychomotor Skills Entry</h4>
                  <button
                    onClick={prefillPsychomotorSkills}
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
                </div>
              ) : (
                <div className="alert alert-info mt-4" role="alert">
                  Please select a Student, Term, and Session to manage psychomotor skills.
                </div>
              )}
            </section>
          )}


          {activeTab === 'class-results' && (
            <section className="class-results-section">
              <h3>Class Overall Results for {teacherInfo.class}</h3>
              <div className="form-row">
                <div className="form-group col-md-6">
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
                <div className="form-group col-md-6">
                  <label>Session:</label>
                  <select
                    value={session}
                    onChange={handleSessionChange}
                    className="form-control"
                  >
                    <option value="">{availableSessions.length > 0 ? "-- Select Session --" : "Loading sessions..."}</option>
                    {availableSessions.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group col-12 d-flex justify-content-end">
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
                                  const currentSessionId = availableSessions.find(s => s.name === session)?.id;
                                  if (currentSessionId) {
                                    fetchStudentResults(student.id, selectedTerm, currentSessionId);
                                  } else {
                                    alert('Session ID not found for selected session.');
                                  }
                                  setActiveTab('academic-attendance');
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
