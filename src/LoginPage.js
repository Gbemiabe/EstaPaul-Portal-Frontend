// frontend/src/LoginPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link here

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

// LoginPage now accepts 'onLoginSuccess' as a prop from App.js
function LoginPage({ onLoginSuccess }) {
    const [identifier, setIdentifier] = useState(''); // This will be student_id or email
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    console.log('LoginPage rendered with onLoginSuccess:', typeof onLoginSuccess);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Login form submitted with:', { identifier, role });
        setMessage('');
        setLoading(true);

        try {
            console.log('Making login request to:', `${API_BASE_URL}/auth/login`);
            const response = await fetch(`${API_BASE_URL}/auth/login`, { // Use the defined API_BASE_URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier, password, role }), // Send identifier, password, and role
            });

            console.log('Login response status:', response.status);
            const data = await response.json();
            console.log('Login response data:', data);

            if (response.ok) {
                console.log('Login successful, calling onLoginSuccess with:', { user: data.user, token: data.token });

                if (onLoginSuccess) {
                    onLoginSuccess(data.user, data.token);
                } else {
                    console.error('onLoginSuccess prop is not provided!');
                }
                setMessage(data.message);
            } else {
                console.log('Login failed with message:', data.message);
                setMessage(data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage('Network error. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-group">
                        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                            {role === 'student' ? 'Student ID' : 'Email'}:
                        </label>
                        <input
                            type="text"
                            id="identifier"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">Login As:</label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                    {message && <p className={`mt-4 text-center ${message.includes('failed') || message.includes('error') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}

                    {/* New "Forgot Password?" link added here */}
                    <p className="mt-4 text-center text-sm">
                        <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Forgot Password?
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;
