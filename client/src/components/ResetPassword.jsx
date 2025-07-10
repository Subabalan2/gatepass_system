import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/LoginForm.css";

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [registerNumber, setRegisterNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // Get register number from navigation state
    if (location.state && location.state.registerNumber) {
      setRegisterNumber(location.state.registerNumber);
    } else {
      // If no register number is provided, redirect to login
      navigate("/loginpage");
    }
  }, [location, navigate]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handlePasswordReset = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Password format validation (letters@numbers)
    const isPasswordValid = /^[a-zA-Z]+@\d+$/.test(newPassword);
    if (!isPasswordValid) {
      setError("Password must follow format: letters@numbers (e.g., user@123)");
      return;
    }

    // Check if passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Password reset logic would typically include an API call
    // For now, we'll just simulate a successful reset
    setSuccess("Password reset successful!");

    // Redirect to login page after 2 seconds
    setTimeout(() => {
      navigate("/loginpage");
    }, 2000);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <img src="/images/logo.jpeg" alt="NEC Logo" />
          </div>
          <h2>Reset Password</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handlePasswordReset} className="auth-form">
          <div className="form-group">
            <label htmlFor="registerNumber">Register Number</label>
            <input
              type="text"
              id="registerNumber"
              value={registerNumber}
              disabled
            />
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              placeholder="letters@numbers (e.g., user@123)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-button">
            Reset Password
          </button>
        </form>

        <div className="auth-footer">
          <p>© {new Date().getFullYear()} NEC Gate Pass System</p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
