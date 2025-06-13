import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client
import { useNavigate } from 'react-router-dom'; // For redirection

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // To show loading state on button
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Error getting session:", sessionError.message);
        }
          };
    checkSession();
  }, []); // Run once on component mount


  const handlePasswordReset = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) { // Example: enforce minimum password length
        setError('Password must be at least 6 characters long.');
        return;
    }

    setLoading(true); // Start loading state

    try {
      const { error } = await supabase.auth.updateUser({ password: password });

      if (error) {
        setError(error.message);
        console.error('Password update error:', error);
      } else {
        setMessage('Your password has been reset successfully! Redirecting to login...');
        // Redirect to the login page after a short delay
        setTimeout(() => {
          navigate('/login'); // Make sure you have a '/login' route configured in App.js
        }, 3000);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Unexpected error during password reset:', err);
    } finally {
      setLoading(false); // End loading state
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Set New Password</h2>
      <form onSubmit={handlePasswordReset}>
        <div className="form-group">
          <label htmlFor="password">New Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your new password"
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm your new password"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default ResetPassword;
