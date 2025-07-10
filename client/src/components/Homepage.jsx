import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate hook
import "../styles/homepage.css";

function Homepage() {
  const navigate = useNavigate(); // Hook to navigate programmatically
  const [selectedOption, setSelectedOption] = useState("select");

  const handleChange = (event) => {
    setSelectedOption(event.target.value);
    if (event.target.value === "students") {
      navigate("/loginpage"); 
    }
    if (event.target.value === "staffs") {
      navigate("/loginchoice");
    }
    
  };

  return (
    <div className="homebg">
    <div className="hero-section">
      <div className="content">
        <h1>Welcome to National Engineering College</h1>
        <p>Empowering minds through excellence in education and innovation.</p>
      </div>
      <div>
        <select value={selectedOption} onChange={handleChange}>
          <option value="select">Select Login</option>
          <option value="students">Students</option>
          <option value="staffs">Staffs</option>
          <option value="security">Security</option>
        </select>
      </div>

      <footer className="footer">
        <p>&copy; 2015 National Engineering College | All Rights Reserved</p>
      </footer>
    </div>
    </div>
  );
}

export default Homepage;
