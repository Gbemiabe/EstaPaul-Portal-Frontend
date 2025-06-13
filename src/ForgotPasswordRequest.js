// src/pages/ForgotPasswordRequest.js (or src/components/ForgotPasswordRequest.js)

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js'; // Import Supabase client
import { Link } from 'react-router-dom'; // For the "Back to Login" link

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY // Use your PUBLIC ANON KEY here
);

function ForgotPasswordRequest() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // To show loading state

  const handleResetRequest = async (e) => {
    e.preventDefault(); // Prevent default form submission
    setMessage('');
    setError('');
    setLoading(true); // Start loading state

    try {
      // Call Supabase to send the password reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
               redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(error.message);
        console.error('Password reset request error:', error);
      } else {
        setMessage('Password reset email sent! Please check your inbox (and spam folder) for further instructions.');
        setEmail(''); // Clear email field on success
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false); // End loading state
    }
  };

  return (
    <div className="forgot-password-request-container">
      <h2>Forgot Password</h2>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
      <form onSubmit={handleResetRequest}>
        <div className="form-group">
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your_email@example.com"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
      <p className="back-to-login">
        <Link to="/login">Back to Login</Link> {/* Adjust '/login' to your actual login route */}
      </p>
    </div>
  );
}

export default ForgotPasswordRequest;
