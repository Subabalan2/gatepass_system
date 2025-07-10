


import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginForm.css";

const StaffsLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");

    const isEmailValid =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
    if (!isEmailValid) {
      setError("Please enter a valid email address");
      return;
    }

    if (password === "123456") {
      navigate("/reset-password", { state: { email } });
      return;
    }

    const isPasswordValid = /^[a-zA-Z]+@\d+$/.test(password);
    if (isPasswordValid) {
      navigate("/staffs-approval");
    } else {
      setError("Invalid password format. Use letters@numbers (e.g., user@123)");
    }
  };

  return (
    <>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="logo">
              <img src="/images/logo.jpeg" alt="NEC Logo" />
            </div>
            <h2>NEC Gate Pass</h2>
            <h2>Staff Approval Login</h2>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="auth-button">
              Login
            </button>
          </form>
        </div>
      </div>

      
    </>
  );
};

export default StaffsLogin;
