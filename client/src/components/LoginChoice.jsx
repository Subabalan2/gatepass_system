import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/LoginChoice.css";

const LoginChoice = () => {
  const navigate = useNavigate();

  return (
    <div className="login-choice-container">
      <div className="login-card">
        <div className="logo">
          <img src="/images/logo.jpeg" alt="NEC Logo" />
        </div>
        <h1>NEC College Portal</h1>
        <p>Please select your login type</p>
        <div className="button-group">
          <button onClick={() => navigate("/staffslogin")}>Staff Login</button>
          <button onClick={() => navigate("/hod-login")}>HOD Login</button>
        </div>
      </div>        
    </div>
  );
};

export default LoginChoice;
