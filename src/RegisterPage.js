// frontend/src/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css'; // Use the same CSS for consistent styling

function RegisterPage() {
    const [role, setRole] = useState('student'); // Default role for selection
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    // State for Student Registration
    const [studentId, setStudentId] = useState('');
    const [studentPassword, setStudentPassword] = useState('');
    const [studentFullName, setStudentFullName] = useState('');
    const [studentGender, setStudentGender] = useState('');
    const [studentClass, setStudentClass] = useState('');
    const [studentPicture, setStudentPicture] = useState(null);

    // State for Teacher Registration
    const [teacherEmail, setTeacherEmail] = useState('');
    const [teacherPassword, setTeacherPassword] = useState('');
    const [teacherFullName, setTeacherFullName] = useState('');
    const [teacherGender, setTeacherGender] = useState('');
    const [teacherClass, setTeacherClass] = useState('');


    const handleStudentSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!studentPicture) {
            setMessage('Please upload a profile picture.');
            return;
        }

        const formData = new FormData();
        formData.append('student_id', studentId);
        formData.append('password', studentPassword);
        formData.append('full_name', studentFullName);
        formData.append('gender', studentGender);
        formData.append('class', studentClass);
        formData.append('picture', studentPicture);

        try {
            const response = await fetch('http://localhost:3000/api/auth/register/student', {
                method: 'POST',
                body: formData, // FormData automatically sets 'Content-Type': 'multipart/form-data'
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message + ' You can now log in.');
                localStorage.setItem('token', data.token); // Store token if provided
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setMessage(data.message || 'Student registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Student registration error:', error);
            setMessage('Network error during student registration. Please try again later.');
        }
    };

    const handleTeacherSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const response = await fetch('http://localhost:3000/api/auth/register/teacher', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: teacherEmail,
                    password: teacherPassword,
                    full_name: teacherFullName,
                    gender: teacherGender,
                    class: teacherClass,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message + ' You can now log in.');
                localStorage.setItem('token', data.token); // Store token if provided
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                setMessage(data.message || 'Teacher registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Teacher registration error:', error);
            setMessage('Network error during teacher registration. Please try again later.');
        }
    };

    return (
        <div className="auth-container">
            <h2>Register Account</h2>

            <div className="form-group">
                <label htmlFor="role">Register As:</label>
                <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select>
            </div>

            {role === 'student' && (
                <form onSubmit={handleStudentSubmit} className="auth-form">
                    <h3>Student Details</h3>
                    <div className="form-group">
                        <label htmlFor="studentId">Student ID:</label>
                        <input
                            type="text"
                            id="studentId"
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="studentPassword">Password:</label>
                        <input
                            type="password"
                            id="studentPassword"
                            value={studentPassword}
                            onChange={(e) => setStudentPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="studentFullName">Full Name:</label>
                        <input
                            type="text"
                            id="studentFullName"
                            value={studentFullName}
                            onChange={(e) => setStudentFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="studentGender">Gender:</label>
                        <select
                            id="studentGender"
                            value={studentGender}
                            onChange={(e) => setStudentGender(e.target.value)}
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="studentClass">Class:</label>
                        <input
                            type="text"
                            id="studentClass"
                            value={studentClass}
                            onChange={(e) => setStudentClass(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="studentPicture">Profile Picture:</label>
                        <input
                            type="file"
                            id="studentPicture"
                            accept="image/*"
                            onChange={(e) => setStudentPicture(e.target.files[0])}
                            required
                        />
                    </div>
                    <button type="submit" className="auth-button">Register Student</button>
                </form>
            )}

            {role === 'teacher' && (
                <form onSubmit={handleTeacherSubmit} className="auth-form">
                    <h3>Teacher Details</h3>
                    <div className="form-group">
                        <label htmlFor="teacherEmail">Email:</label>
                        <input
                            type="email"
                            id="teacherEmail"
                            value={teacherEmail}
                            onChange={(e) => setTeacherEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="teacherPassword">Password:</label>
                        <input
                            type="password"
                            id="teacherPassword"
                            value={teacherPassword}
                            onChange={(e) => setTeacherPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="teacherFullName">Full Name:</label>
                        <input
                            type="text"
                            id="teacherFullName"
                            value={teacherFullName}
                            onChange={(e) => setTeacherFullName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="teacherGender">Gender:</label>
                        <select
                            id="teacherGender"
                            value={teacherGender}
                            onChange={(e) => setTeacherGender(e.target.value)}
                            required
                        >
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="teacherClass">Class Taught (e.g., JSS1, SSS2):</label>
                        <input
                            type="text"
                            id="teacherClass"
                            value={teacherClass}
                            onChange={(e) => setTeacherClass(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="auth-button">Register Teacher</button>
                </form>
            )}

            {message && <p className="auth-message">{message}</p>}
        </div>
    );
}

export default RegisterPage;