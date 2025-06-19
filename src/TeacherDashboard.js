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
    FaChartBar
} from 'react-icons/fa';
import './TeacherDashboard.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:3001/api";

const TERMS = ['1st', '2nd', '3rd'];
const getCurrentYear = () => new Date().getFullYear();
const generateSessions = () => {
    const currentYear = getCurrentYear();
    const sessions = [];
    for (let i = -2; i <= 2; i++) { // Generate current, previous 2, and next 2 sessions
        const startYear = currentYear + i;
        sessions.push(`${startYear}/${startYear + 1}`);
    }
    return sessions.reverse(); // Latest session first
};
const ALL_SESSIONS = generateSessions();

// Make sure `onLogout` is passed as a prop from your parent component (e.g., App.js)
function TeacherDashboard({ teacherUser, token, onLogout }) {
    const navigate = useNavigate();
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('students');
    const [classStudents, setClassStudents] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(''); // For single student view
    const [selectedSubject, setSelectedSubject] = useState('');
    const [results, setResults] = useState(null); // For single student academic result
    const [psychomotor, setPsychomotor] = useState(null); // For single student psychomotor result
    const [selectedTerm, setSelectedTerm] = useState('1st');
    const [session, setSession] = useState(''); // Initialize as empty string
    const [availableSessions, setAvailableSessions] = useState([]); // State for fetched sessions

    const [newSubject, setNewSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [classOverallResults, setClassOverallResults] = useState(null);

    // Academic Score States (for single upload, if used)
    const [pt1, setPt1] = useState('');
    const [pt2, setPt2] = useState('');
    const [pt3, setPt3] = useState('');
    const [exam, setExam] = useState('');

    // Psychomotor Score States (for single upload)
    const [punctuality, setPunctuality] = useState('');
    const [neatness, setNeatness] = useState('');
    const [politeness, setPoliteness] = useState('');
    const [attentiveness, setAttentiveness] = useState('');
    const [participation, setParticipation] = useState('');

    const [uploadLoading, setUploadLoading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [uploadSuccess, setUploadSuccess] = useState('');

    // Bulk Academic Score States
    const [bulkAcademicResults, setBulkAcademicResults] = useState([]); // To store data for bulk upload
    const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
    const [bulkUploadError, setBulkUploadError] = useState('');
    const [bulkUploadSuccess, setBulkUploadSuccess] = useState('');


    // Fetch Teacher Info
    useEffect(() => {
        const fetchTeacherInfo = async () => {
            if (!token || !teacherUser) {
                setLoading(false);
                navigate('/login');
                return;
            }
            try {
                const response = await fetch(`${API_BASE_URL}/teacher/me`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch teacher info');
                }
                const data = await response.json();
                setTeacherInfo(data);
            } catch (err) {
                console.error("Failed to fetch teacher info:", err);
                // Handle error, maybe logout
            } finally {
                setLoading(false);
            }
        };
        fetchTeacherInfo();
    }, [token, teacherUser, navigate]);

    // Fetch Sessions on component mount
    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/sessions`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch sessions');
                }
                const data = await response.json();
                setAvailableSessions(data);
                if (data.length > 0) {
                    // Set the latest session as default
                    const latestSession = data[data.length - 1].name;
                    setSession(latestSession);
                }
            } catch (error) {
                console.error("Error fetching sessions:", error);
                // Fallback to hardcoded sessions if API fails
                setAvailableSessions(ALL_SESSIONS.map(s => ({ name: s })));
                setSession(ALL_SESSIONS[0]);
            }
        };
        fetchSessions();
    }, [token]);

    // Fetch Class Students
    const fetchClassStudents = useCallback(async () => {
        if (!teacherInfo || !teacherInfo.class) return;
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/students/${teacherInfo.class}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch class students');
            }
            const data = await response.json();
            setClassStudents(data);
        } catch (err) {
            console.error("Failed to fetch class students:", err);
        }
    }, [teacherInfo, token]);

    // Fetch Subjects
    const fetchSubjects = useCallback(async () => {
        if (!teacherInfo || !teacherInfo.class) return;
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/subjects/${teacherInfo.class}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch subjects');
            }
            const data = await response.json();
            setSubjects(data);
        } catch (err) {
            console.error("Failed to fetch subjects:", err);
        }
    }, [teacherInfo, token]);

    // Fetch Single Academic Result for Prefill (If using single upload form)
    const fetchAcademicResultForPrefill = async (studentId, subjectId, term, session) => {
        try {
            const url = `${API_BASE_URL}/teacher/result/${encodeURIComponent(studentId)}/${encodeURIComponent(subjectId)}/${encodeURIComponent(term)}/${encodeURIComponent(session)}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                // If 404, it means no existing result, so return nulls
                if (response.status === 404) return { pt1: null, pt2: null, pt3: null, exam: null };
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching academic result for prefill:", error);
            setUploadError('Failed to fetch previous results: ' + error.message);
            return { pt1: null, pt2: null, pt3: null, exam: null };
        }
    };

    // Fetch Single Psychomotor Result for Prefill (If using single upload form)
    const fetchPsychomotorResultForPrefill = async (studentId, term, session) => {
        try {
            const url = `${API_BASE_URL}/teacher/psychomotor/${encodeURIComponent(studentId)}/${encodeURIComponent(term)}/${encodeURIComponent(session)}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                 if (response.status === 404) return { punctuality: null, neatness: null, politeness: null, attentiveness: null, participation: null };
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Error fetching psychomotor result for prefill:", error);
            return { punctuality: null, neatness: null, politeness: null, attentiveness: null, participation: null };
        }
    };

    // Fetch Class Overall Results
    const fetchClassOverallResults = useCallback(async () => {
        if (!teacherInfo || !teacherInfo.class || !selectedTerm || !session) return;
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/class-results/${teacherInfo.class}/${selectedTerm}/${session}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                throw new Error('Failed to fetch class overall results');
            }
            const data = await response.json();
            setClassOverallResults(data);
        } catch (err) {
            console.error("Failed to fetch class overall results:", err);
            setClassOverallResults(null);
        }
    }, [teacherInfo, selectedTerm, session, token]);

    // Handle Add Subject
    const handleAddSubject = async (e) => {
        e.preventDefault();
        if (!newSubject.trim() || !teacherInfo || !teacherInfo.class) {
            alert('Subject name and class are required.');
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/subjects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ name: newSubject, class: teacherInfo.class }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to add subject');
            }
            alert('Subject added successfully!');
            setNewSubject('');
            fetchSubjects(); // Refresh subjects list
        } catch (error) {
            console.error("Error adding subject:", error);
            alert('Error adding subject: ' + error.message);
        }
    };

    // Handle single academic score submission (if single form is re-enabled)
    const handleSubmitAcademicScores = async (e) => {
        e.preventDefault();
        setUploadLoading(true);
        setUploadError('');
        setUploadSuccess('');

        if (!selectedStudent || !selectedSubject || !selectedTerm || !session) {
            setUploadError('Please select student, subject, term, and session.');
            setUploadLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/teacher/results/academic-single`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_id: selectedStudent,
                    term: selectedTerm,
                    session: session, // Send session name
                    subject_id: selectedSubject,
                    pt1: pt1 === '' ? null : Number(pt1),
                    pt2: pt2 === '' ? null : Number(pt2),
                    pt3: pt3 === '' ? null : Number(pt3),
                    exam: exam === '' ? null : Number(exam),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUploadSuccess(data.message || 'Academic result uploaded successfully!');
            // After successful upload, refresh the prefill data
            fetchAcademicResultForPrefill(selectedStudent, selectedSubject, selectedTerm, session)
                .then(prefillData => {
                    if (prefillData) {
                        setPt1(prefillData.pt1 !== undefined && prefillData.pt1 !== null ? prefillData.pt1.toString() : '');
                        setPt2(prefillData.pt2 !== undefined && prefillData.pt2 !== null ? prefillData.pt2.toString() : '');
                        setPt3(prefillData.pt3 !== undefined && prefillData.pt3 !== null ? prefillData.pt3.toString() : '');
                        setExam(prefillData.exam !== undefined && prefillData.exam !== null ? prefillData.exam.toString() : '');
                    }
                });
        } catch (error) {
            console.error("Academic result upload error:", error);
            setUploadError('Failed to upload academic result: ' + error.message);
        } finally {
            setUploadLoading(false);
        }
    };

    // Handle psychomotor score submission
    const handleSubmitPsychomotorScores = async (e) => {
        e.preventDefault();
        setUploadLoading(true);
        setUploadError('');
        setUploadSuccess('');

        if (!selectedStudent || !selectedTerm || !session) {
            setUploadError('Please select student, term, and session.');
            setUploadLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/teacher/psychomotor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    student_id: selectedStudent,
                    term: selectedTerm,
                    session: session, // Send session name
                    punctuality: punctuality === '' ? null : Number(punctuality),
                    neatness: neatness === '' ? null : Number(neatness),
                    politeness: politeness === '' ? null : Number(politeness),
                    attentiveness: attentiveness === '' ? null : Number(attentiveness),
                    participation: participation === '' ? null : Number(participation),
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setUploadSuccess(data.message || 'Psychomotor result uploaded successfully!');
            // Refresh prefill for psychomotor
            fetchPsychomotorResultForPrefill(selectedStudent, selectedTerm, session)
                .then(prefillData => {
                    if (prefillData) {
                        setPunctuality(prefillData.punctuality !== undefined && prefillData.punctuality !== null ? prefillData.punctuality.toString() : '');
                        setNeatness(prefillData.neatness !== undefined && prefillData.neatness !== null ? prefillData.neatness.toString() : '');
                        setPoliteness(prefillData.politeness !== undefined && prefillData.politeness !== null ? prefillData.politeness.toString() : '');
                        setAttentiveness(prefillData.attentiveness !== undefined && prefillData.attentiveness !== null ? prefillData.attentiveness.toString() : '');
                        setParticipation(prefillData.participation !== undefined && prefillData.participation !== null ? prefillData.participation.toString() : '');
                    }
                });
        } catch (error) {
            console.error("Psychomotor result upload error:", error);
            setUploadError('Failed to upload psychomotor result: ' + error.message);
        } finally {
            setUploadLoading(false);
        }
    };

    // Handler for Bulk Score Changes
    const handleBulkScoreChange = useCallback((studentId, scoreType, value) => {
        setBulkAcademicResults(prevResults => {
            const existingResultIndex = prevResults.findIndex(r => r.student_id === studentId);
            const parsedValue = value === '' ? null : Number(value); // Store null for empty strings or invalid numbers

            if (existingResultIndex !== -1) {
                const updatedResults = [...prevResults];
                updatedResults[existingResultIndex] = {
                    ...updatedResults[existingResultIndex],
                    student_id: studentId,
                    [scoreType]: parsedValue,
                    term: selectedTerm,
                    session: session,
                    subject_id: selectedSubject,
                };
                return updatedResults;
            } else {
                return [
                    ...prevResults,
                    {
                        student_id: studentId,
                        [scoreType]: parsedValue,
                        term: selectedTerm,
                        session: session,
                        subject_id: selectedSubject,
                    }
                ];
            }
        });
    }, [selectedTerm, session, selectedSubject]); // Dependencies for useCallback

    // Fetch Bulk Prefill Data (Defined here to be accessible by useEffect and handleSubmitBulkAcademicScores)
    const fetchBulkPrefillData = useCallback(async (classId, subjectId, term, session) => {
        try {
            const response = await fetch(`${API_BASE_URL}/teacher/results/class/${encodeURIComponent(classId)}/${encodeURIComponent(subjectId)}/${encodeURIComponent(term)}/${encodeURIComponent(session)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 404) {
                    setBulkAcademicResults([]); // No data found, initialize empty
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Map fetched data to ensure all students are present in bulkAcademicResults,
            // and prefill their scores if available.
            const prefilledBulkData = classStudents.map(student => {
                const existingResult = data.find(r => r.student_id === student.id);
                return {
                    student_id: student.id,
                    pt1: existingResult ? (existingResult.pt1 !== null ? existingResult.pt1 : '') : '',
                    pt2: existingResult ? (existingResult.pt2 !== null ? existingResult.pt2 : '') : '',
                    pt3: existingResult ? (existingResult.pt3 !== null ? existingResult.pt3 : '') : '',
                    exam: existingResult ? (existingResult.exam !== null ? existingResult.exam : '') : '',
                    term: term, // Use the passed term and session
                    session: session,
                    subject_id: subjectId, // Use the passed subjectId
                };
            });
            setBulkAcademicResults(prefilledBulkData);
        } catch (error) {
            console.error("Error fetching bulk prefill data:", error);
            setBulkAcademicResults([]); // On error, start empty
        }
    }, [token, classStudents, setBulkAcademicResults]); // Dependencies for useCallback

    // Handle Bulk Academic Scores Submission
    const handleSubmitBulkAcademicScores = async () => {
        setBulkUploadLoading(true);
        setBulkUploadError('');
        setBulkUploadSuccess('');

        if (!selectedSubject || !selectedTerm || !session) {
            setBulkUploadError('Please select a subject, term, and session.');
            setBulkUploadLoading(false);
            return;
        }

        // Filter out results that are completely empty or have no student_id
        const resultsToSend = bulkAcademicResults
            .filter(r => r.student_id && (r.pt1 !== null || r.pt2 !== null || r.pt3 !== null || r.exam !== null))
            .map(result => ({
                student_id: result.student_id,
                term: result.term,
                session: result.session,
                subject_id: result.subject_id,
                pt1: result.pt1,
                pt2: result.pt2,
                pt3: result.pt3,
                exam: result.exam,
            }));


        if (resultsToSend.length === 0) {
            setBulkUploadError('No valid results entered to upload.');
            setBulkUploadLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/teacher/results/academic-bulk`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(resultsToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setBulkUploadSuccess(data.message || 'Bulk academic results uploaded successfully!');
            // After successful upload, refresh the bulk data in the table
            if (teacherInfo && teacherInfo.class) {
                fetchBulkPrefillData(teacherInfo.class, selectedSubject, selectedTerm, session);
            }
        } catch (error) {
            console.error("Bulk academic results upload error:", error);
            setBulkUploadError('Failed to upload bulk academic results: ' + error.message);
        } finally {
            setBulkUploadLoading(false);
        }
    };


    // Combined useEffect for initial data fetching based on activeTab and selections
    useEffect(() => {
        if (teacherInfo) {
            fetchClassStudents();
            fetchSubjects();
        }
    }, [teacherInfo, fetchClassStudents, fetchSubjects]);

    // Effect for prefilling single academic and psychomotor (if used) and bulk academic
    useEffect(() => {
        setUploadSuccess(''); // Clear single upload success
        setBulkUploadSuccess(''); // Clear bulk upload success

        // Fetch class students if not already loaded (important for bulk table)
        if (teacherInfo && classStudents.length === 0) {
            fetchClassStudents();
        }

        // Logic for single academic prefill (keep this if you maintain single upload UI)
        if (activeTab === 'upload' && selectedStudent && selectedTerm && session) {
            // Academic
            if (selectedSubject) {
                fetchAcademicResultForPrefill(selectedStudent, selectedSubject, selectedTerm, session)
                    .then(data => {
                        if (data) { // Check data directly
                            setPt1(data.pt1 !== undefined && data.pt1 !== null ? data.pt1.toString() : '');
                            setPt2(data.pt2 !== undefined && data.pt2 !== null ? data.pt2.toString() : '');
                            setPt3(data.pt3 !== undefined && data.pt3 !== null ? data.pt3.toString() : '');
                            setExam(data.exam !== undefined && data.exam !== null ? data.exam.toString() : '');
                        } else {
                            setPt1(''); setPt2(''); setPt3(''); setExam('');
                        }
                    })
                    .catch(error => {
                        console.error("Error prefilling single academic result:", error);
                        setPt1(''); setPt2(''); setPt3(''); setExam('');
                    });
            } else {
                setPt1(''); setPt2(''); setPt3(''); setExam('');
            }

            // Psychomotor
            fetchPsychomotorResultForPrefill(selectedStudent, selectedTerm, session)
                .then(data => {
                    if (data) {
                        setPunctuality(data.punctuality !== undefined && data.punctuality !== null ? data.punctuality.toString() : '');
                        setNeatness(data.neatness !== undefined && data.neatness !== null ? data.neatness.toString() : '');
                        setPoliteness(data.politeness !== undefined && data.politeness !== null ? data.politeness.toString() : '');
                        setAttentiveness(data.attentiveness !== undefined && data.attentiveness !== null ? data.attentiveness.toString() : '');
                        setParticipation(data.participation !== undefined && data.participation !== null ? data.participation.toString() : '');
                    } else {
                        setPunctuality(''); setNeatness(''); setPoliteness(''); setAttentiveness(''); setParticipation('');
                    }
                })
                .catch(error => {
                    console.error("Error prefilling psychomotor result:", error);
                    setPunctuality(''); setNeatness(''); setPoliteness(''); setAttentiveness(''); setParticipation('');
                });
        }

        // Trigger bulk prefill when relevant selections change
        if (activeTab === 'upload' && teacherInfo && teacherInfo.class && selectedSubject && selectedTerm && session) {
            fetchBulkPrefillData(teacherInfo.class, selectedSubject, selectedTerm, session);
        } else if (activeTab === 'upload') {
            setBulkAcademicResults([]); // Clear bulk results if not all criteria selected
        }

    }, [selectedStudent, selectedSubject, selectedTerm, session, activeTab, token, classStudents, teacherInfo, fetchClassStudents, fetchBulkPrefillData]);


    // Effect to fetch class overall results
    useEffect(() => {
        if (activeTab === 'overall-results') {
            fetchClassOverallResults();
        }
    }, [activeTab, fetchClassOverallResults]);

    if (loading) {
        return (
            <div className="dashboard-container">
                <div className="loading-spinner">
                    <FaSpinner className="spinner" />
                    <p>Loading teacher dashboard...</p>
                </div>
            </div>
        );
    }

    if (!teacherInfo) {
        return (
            <div className="dashboard-container">
                <div className="error-message">
                    <p>Error: Could not load teacher information. Please try logging in again.</p>
                    <button onClick={onLogout} className="btn btn-primary">Go to Login</button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-left">
                    <h1>Teacher Dashboard</h1>
                    <p>Welcome, {teacherInfo.full_name || teacherUser.username} ({teacherInfo.class ? `Class: ${teacherInfo.class}` : 'No Class Assigned'})</p>
                </div>
                <div className="header-right">
                    <button onClick={onLogout} className="btn btn-danger">
                        <FaSignOutAlt /> Logout
                    </button>
                </div>
            </header>

            <nav className="dashboard-nav">
                <ul>
                    <li>
                        <button onClick={() => setActiveTab('students')} className={activeTab === 'students' ? 'active' : ''}>
                            <FaUsers /> Students
                        </button>
                    </li>
                    <li>
                        <button onClick={() => setActiveTab('subjects')} className={activeTab === 'subjects' ? 'active' : ''}>
                            <FaBook /> Subjects
                        </button>
                    </li>
                    <li>
                        <button onClick={() => setActiveTab('upload')} className={activeTab === 'upload' ? 'active' : ''}>
                            <FaUpload /> Upload Results
                        </button>
                    </li>
                    <li>
                        <button onClick={() => setActiveTab('overall-results')} className={activeTab === 'overall-results' ? 'active' : ''}>
                            <FaChartBar /> Class Results
                        </button>
                    </li>
                    /* Adding other navigation items as needed */
                </ul>
            </nav>

            <main className="dashboard-content">
                {/* Students Tab */}
                {activeTab === 'students' && (
                    <section className="dashboard-section">
                        <h2>My Students ({teacherInfo.class})</h2>
                        {classStudents.length > 0 ? (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Student ID</th>
                                            <th>Name</th>
                                            <th>Gender</th>
                                            <th>Date of Birth</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {classStudents.map(student => (
                                            <tr key={student.id}>
                                                <td>{student.student_id}</td>
                                                <td>{student.full_name}</td>
                                                <td>{new Date(student.dob).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p>No students found for your class.</p>
                        )}
                    </section>
                )}

                {activeTab === 'subjects' && (
                    <section className="dashboard-section">
                        <h2>My Subjects ({teacherInfo.class})</h2>
                        <div className="subjects-list">
                            {subjects.length > 0 ? (
                                <ul>
                                    {subjects.map(subject => (
                                        <li key={subject.id}>{subject.name}</li>
                                    ))}
                                </ul>
                            ) : (
                                <p>No subjects assigned to your class yet.</p>
                            )}
                        </div>

                        <h3 className="mt-4">Add New Subject to Your Class</h3>
                        <form onSubmit={handleAddSubject} className="form-inline">
                            <div className="form-group mb-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="New Subject Name"
                                    value={newSubject}
                                    onChange={(e) => setNewSubject(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn btn-success mb-2 ml-2">
                                <FaPlus /> Add Subject
                            </button>
                        </form>
                    </section>
                )}

                {activeTab === 'upload' && (
                    <section className="dashboard-section">
                        <h2>Upload Results</h2>

                        <div className="form-group">
                            <label htmlFor="sessionSelect">Select Session:</label>
                            <select
                                id="sessionSelect"
                                value={session}
                                onChange={(e) => setSession(e.target.value)}
                                className="form-control"
                            >
                                {availableSessions.length > 0 ? (
                                    availableSessions.map((s, index) => (
                                        <option key={index} value={s.name}>{s.name}</option>
                                    ))
                                ) : (
                                    <option value="">Loading Sessions...</option>
                                )}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="termSelect">Select Term:</label>
                            <select
                                id="termSelect"
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="form-control"
                            >
                                {TERMS.map(term => (
                                    <option key={term} value={term}>{term}</option>
                                ))}
                            </select>
                        </div>

                        <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Bulk Academic Results Upload</h3>

                        {classStudents.length > 0 ? (
                            <div className="bulk-upload-container">
                                <div className="form-group">
                                    <label htmlFor="bulkSubjectSelect">Select Subject:</label>
                                    <select
                                        id="bulkSubjectSelect"
                                        value={selectedSubject}
                                        onChange={(e) => setSelectedSubject(e.target.value)}
                                        className="form-control"
                                        required
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.map(subject => (
                                            <option key={subject.id} value={subject.id}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedSubject && selectedTerm && session ? (
                                    <div className="table-responsive">
                                        <table className="table table-striped result-table">
                                            <thead>
                                                <tr>
                                                    <th>Student Name</th>
                                                    <th>PT1</th>
                                                    <th>PT2</th>
                                                    <th>PT3</th>
                                                    <th>Exam</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {classStudents.map(student => (
                                                    <tr key={student.id}>
                                                        <td>{student.full_name}</td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={bulkAcademicResults.find(r => r.student_id === student.id)?.pt1 || ''}
                                                                onChange={(e) => handleBulkScoreChange(student.id, 'pt1', e.target.value)}
                                                                className="form-control"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={bulkAcademicResults.find(r => r.student_id === student.id)?.pt2 || ''}
                                                                onChange={(e) => handleBulkScoreChange(student.id, 'pt2', e.target.value)}
                                                                className="form-control"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={bulkAcademicResults.find(r => r.student_id === student.id)?.pt3 || ''}
                                                                onChange={(e) => handleBulkScoreChange(student.id, 'pt3', e.target.value)}
                                                                className="form-control"
                                                            />
                                                        </td>
                                                        <td>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                value={bulkAcademicResults.find(r => r.student_id === student.id)?.exam || ''}
                                                                onChange={(e) => handleBulkScoreChange(student.id, 'exam', e.target.value)}
                                                                className="form-control"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                        <button
                                            onClick={handleSubmitBulkAcademicScores}
                                            className="btn btn-primary mt-3"
                                            disabled={bulkUploadLoading}
                                        >
                                            {bulkUploadLoading ? 'Uploading...' : 'Upload All Academic Results'}
                                        </button>
                                        {bulkUploadError && <div className="alert error mt-3">{bulkUploadError}</div>}
                                        {bulkUploadSuccess && <div className="alert success mt-3">{bulkUploadSuccess}</div>}
                                    </div>
                                ) : (
                                    <p className="mt-3">Please select a subject, term, and session to start entering bulk results.</p>
                                )}
                            </div>
                        ) : (
                            <p>Loading students for bulk upload...</p>
                        )}


                        {/*
                        <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Single Academic Results Upload (Commented Out)</h3>
                        <form onSubmit={handleSubmitAcademicScores}>
                            <div className="form-group">
                                <label htmlFor="studentSelect">Select Student:</label>
                                <select
                                    id="studentSelect"
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Select Student</option>
                                    {classStudents.map(student => (
                                        <option key={student.id} value={student.id}>{student.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="subjectSelect">Select Subject:</label>
                                <select
                                    id="subjectSelect"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group col-md-3">
                                    <label htmlFor="pt1">PT1</label>
                                    <input type="number" min="0" max="100" id="pt1" className="form-control" value={pt1} onChange={(e) => setPt1(e.target.value)} />
                                </div>
                                <div className="form-group col-md-3">
                                    <label htmlFor="pt2">PT2</label>
                                    <input type="number" min="0" max="100" id="pt2" className="form-control" value={pt2} onChange={(e) => setPt2(e.target.value)} />
                                </div>
                                <div className="form-group col-md-3">
                                    <label htmlFor="pt3">PT3</label>
                                    <input type="number" min="0" max="100" id="pt3" className="form-control" value={pt3} onChange={(e) => setPt3(e.target.value)} />
                                </div>
                                <div className="form-group col-md-3">
                                    <label htmlFor="exam">Exam</label>
                                    <input type="number" min="0" max="100" id="exam" className="form-control" value={exam} onChange={(e) => setExam(e.target.value)} />
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary" disabled={uploadLoading}>
                                {uploadLoading ? 'Uploading...' : 'Upload Academic Result'}
                            </button>
                            {uploadError && <div className="alert error mt-3">{uploadError}</div>}
                            {uploadSuccess && <div className="alert success mt-3">{uploadSuccess}</div>}
                        </form>
                        */}

                        <h3 style={{ marginTop: '30px', marginBottom: '20px' }}>Upload Psychomotor Skills (Single Student)</h3>
                         <form onSubmit={handleSubmitPsychomotorScores}>
                            <div className="form-group">
                                <label htmlFor="psychomotorStudentSelect">Select Student:</label>
                                <select
                                    id="psychomotorStudentSelect"
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    className="form-control"
                                    required
                                >
                                    <option value="">Select Student</option>
                                    {classStudents.map(student => (
                                        <option key={student.id} value={student.id}>{student.full_name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group col-md-4">
                                    <label htmlFor="punctuality">Punctuality (1-5)</label>
                                    <input type="number" min="1" max="5" id="punctuality" className="form-control" value={punctuality} onChange={(e) => setPunctuality(e.target.value)} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label htmlFor="neatness">Neatness (1-5)</label>
                                    <input type="number" min="1" max="5" id="neatness" className="form-control" value={neatness} onChange={(e) => setNeatness(e.target.value)} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label htmlFor="politeness">Politeness (1-5)</label>
                                    <input type="number" min="1" max="5" id="politeness" className="form-control" value={politeness} onChange={(e) => setPoliteness(e.target.value)} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label htmlFor="attentiveness">Attentiveness (1-5)</label>
                                    <input type="number" min="1" max="5" id="attentiveness" className="form-control" value={attentiveness} onChange={(e) => setAttentiveness(e.target.value)} />
                                </div>
                                <div className="form-group col-md-4">
                                    <label htmlFor="participation">Participation (1-5)</label>
                                    <input type="number" min="1" max="5" id="participation" className="form-control" value={participation} onChange={(e) => setParticipation(e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary" disabled={uploadLoading}>
                                {uploadLoading ? 'Uploading...' : 'Upload Psychomotor Skills'}
                            </button>
                            {uploadError && <div className="alert error mt-3">{uploadError}</div>}
                            {uploadSuccess && <div className="alert success mt-3">{uploadSuccess}</div>}
                        </form>

                    </section>
                )}


                {activeTab === 'overall-results' && (
                    <section className="dashboard-section">
                        <h2>Class Overall Results</h2>
                        <div className="form-group">
                            <label htmlFor="overallSessionSelect">Select Session:</label>
                            <select
                                id="overallSessionSelect"
                                value={session}
                                onChange={(e) => setSession(e.target.value)}
                                className="form-control"
                            >
                                {availableSessions.length > 0 ? (
                                    availableSessions.map((s, index) => (
                                        <option key={index} value={s.name}>{s.name}</option>
                                    ))
                                ) : (
                                    <option value="">Loading Sessions...</option>
                                )}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="overallTermSelect">Select Term:</label>
                            <select
                                id="overallTermSelect"
                                value={selectedTerm}
                                onChange={(e) => setSelectedTerm(e.target.value)}
                                className="form-control"
                            >
                                {TERMS.map(term => (
                                    <option key={term} value={term}>{term}</option>
                                ))}
                            </select>
                        </div>
                        <button onClick={fetchClassOverallResults} className="btn btn-primary mb-3">
                            <FaSearch /> Load Class Results
                        </button>
                        {classOverallResults ? (
                            <div className="results-summary">
                                <h3>{selectedTerm} Term, {session} Session Results</h3>
                                <p>Total Students: {classOverallResults.totalStudents}</p>
                                <p>Class Average Total Score: {classOverallResults.averageOverallScore.toFixed(2)}</p>

                                <div className="table-responsive">
                                    <table className="table table-striped result-table">
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
                                                                // You might navigate to a detailed student view or open a modal here
                                                                // For now, let's just log or set a state for viewing details
                                                                // console.log(`Viewing details for ${student.full_name}`);
                                                                setActiveTab('upload'); // Example: go to upload tab with student selected
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

            <footer className="dashboard-footer">
                <p>© {new Date().getFullYear()} School Management System. All rights reserved.</p>
            </footer>
        </div>
    );
}

export default TeacherDashboard;
