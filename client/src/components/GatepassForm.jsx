import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Gatepass.css"; // Ensure this path is correct for your styles

const GatepassForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    dpmt: "",
    year: "",
    purpose: "",
    date: "",
    time: "",
    ampm: "AM",
    returnTime: "",
    returnampm: "AM",
    tutor: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverStatus, setServerStatus] = useState(null); // 'connected', 'disconnected', 'error'
  const [error, setError] = useState(null);

  // Fixed: Use a more reliable API URL configuration
  const backendBaseUrl =
    process.env.REACT_APP_API_URL ||
    process.env.REACT_APP_BACKEND_URL ||
    "http://localhost:3001";

  // For testing/debugging - log the API URL
  console.log("Backend API Base URL:", backendBaseUrl);

  const navigate = useNavigate();

  // Check server connectivity on component mount
  // useEffect(() => {
  //   const checkServerStatus = async () => {
  //     try {
  //       // Fixed: Use a more basic endpoint that's likely to exist
  //       const response = await fetch(`${backendBaseUrl}/`, {
  //         method: "GET",
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/json",
  //         },
  //         // Fixed: Use AbortController for better browser compatibility
  //         signal: AbortController ? new AbortController().signal : undefined,
  //       });

  //       if (response.ok) {
  //         setServerStatus("connected");
  //         setError(null);
  //         console.log("Server connection successful");
  //       } else {
  //         setServerStatus("error");
  //         setError(
  //           `Server returned ${response.status}: ${response.statusText}`
  //         );
  //         console.error("Server check failed:", response.status);
  //       }
  //     } catch (err) {
  //       console.error("Server connection failed:", err);
  //       setServerStatus("disconnected");
  //       setError(
  //         `Cannot connect to server at ${backendBaseUrl}. Please check if the server is running.`
  //       );
  //     }
  //   };

  //   checkServerStatus();
  // }, [backendBaseUrl]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Logout function
  const handleLogout = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      alert("Logging out...");
      localStorage.clear();
      navigate("/");
    }
  };

  // Fixed: Simplified time validation
  const validateTimes = () => {
    const [depHour, depMin] = formData.time.split(":").map(Number);
    const [retHour, retMin] = formData.returnTime.split(":").map(Number);

    // Convert to 24-hour format
    let depTime24 =
      depHour + (formData.ampm === "PM" && depHour !== 12 ? 12 : 0);
    if (formData.ampm === "AM" && depHour === 12) depTime24 = 0;

    let retTime24 =
      retHour + (formData.returnampm === "PM" && retHour !== 12 ? 12 : 0);
    if (formData.returnampm === "AM" && retHour === 12) retTime24 = 0;

    const depTotalMin = depTime24 * 60 + depMin;
    const retTotalMin = retTime24 * 60 + retMin;

    return retTotalMin > depTotalMin;
  };

  // Handle form submission with improved error handling
  const handleSubmit = async (event) => {
    event.preventDefault();

    console.log("Submit button clicked"); // Debug log

    if (isSubmitting) {
      console.log("Already submitting, preventing double submission");
      return;
    }

    // Basic validation
    const requiredFields = [
      "name",
      "dpmt",
      "year",
      "purpose",
      "date",
      "time",
      "returnTime",
      "tutor",
    ];
    for (const field of requiredFields) {
      if (!formData[field] || !formData[field].toString().trim()) {
        alert(`Please fill in the "${field}" field.`);
        return;
      }
    }

    // Validate date is not in the past
    const selectedDate = new Date(formData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      alert("Please select a date that is today or in the future.");
      return;
    }

    // Validate return time is after departure time
    if (!validateTimes()) {
      alert("Return time must be after departure time.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Prepare data for submission
    const submissionData = {
      name: formData.name.trim(),
      dpmt: formData.dpmt,
      year: formData.year,
      purpose: formData.purpose.trim(),
      date: formData.date,
      time: formData.time,
      ampm: formData.ampm,
      returnTime: formData.returnTime,
      returnampm: formData.returnampm,
      tutor: formData.tutor,
      studentEmail:
        localStorage.getItem("studentEmail") || "student@example.com",
    };

    console.log("Submitting to:", `${backendBaseUrl}/api/gatepasses/submit`);
    console.log("Data being sent:", submissionData);

    try {
      const response = await fetch(`${backendBaseUrl}/api/gatepasses/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(localStorage.getItem("token") && {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          }),
        },
        body: JSON.stringify(submissionData),
      });

      console.log("Response status:", response.status);

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      // Handle successful response
      let result = {};
      try {
        const responseText = await response.text();
        if (responseText) {
          result = JSON.parse(responseText);
        }
      } catch (e) {
        console.warn("Could not parse response as JSON");
      }

      const successMessage =
        result.message || "Gate pass submitted successfully!";
      alert(successMessage);

      // Reset form
      setFormData({
        name: "",
        dpmt: "",
        year: "",
        purpose: "",
        date: "",
        time: "",
        ampm: "AM",
        returnTime: "",
        returnampm: "AM",
        tutor: "",
      });
    } catch (error) {
      console.error("Submission failed:", error);

      let userErrorMessage =
        "An error occurred while submitting. Please try again.";

      if (error.message.includes("Failed to fetch")) {
        userErrorMessage =
          "Cannot connect to server. Please check if the server is running and try again.";
      } else {
        userErrorMessage = error.message;
      }

      setError(userErrorMessage);
      alert(userErrorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gatebg-container">
      <div className="gateform-container">
        <h2>Gate Pass Request Form</h2>

        {/* Server Status Indicator */}
        {serverStatus && (
          <div
            style={{
              padding: "10px",
              marginBottom: "20px",
              borderRadius: "4px",
              backgroundColor:
                serverStatus === "connected" ? "#d4edda" : "#f8d7da",
              color: serverStatus === "connected" ? "#155724" : "#721c24",
              border: `1px solid ${
                serverStatus === "connected" ? "#c3e6cb" : "#f5c6cb"
              }`,
            }}
          >
            Status:{" "}
            {serverStatus === "connected"
              ? "Connected to server"
              : "Server connection failed"}
            {error && (
              <div style={{ fontSize: "12px", marginTop: "5px" }}>{error}</div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="gatepass-form">
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter Name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dpmt">Department:</label>
            <select
              id="dpmt"
              name="dpmt"
              value={formData.dpmt}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Department</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="AIDS">AIDS</option>
              <option value="CIVIL">CIVIL</option>
              <option value="IT">IT</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="year">Year:</label>
            <select
              id="year"
              name="year"
              value={formData.year}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Year</option>
              <option value="I">I</option>
              <option value="II">II</option>
              <option value="III">III</option>
              <option value="IV">IV</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="purpose">Purpose:</label>
            <input
              type="text"
              id="purpose"
              name="purpose"
              placeholder="Enter Purpose"
              value={formData.purpose}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              disabled={isSubmitting}
              min={new Date().toISOString().split("T")[0]}
            />
          </div>

          <div className="form-group time-group">
            <label htmlFor="time">Departure Time:</label>
            <div className="time-input-container">
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="time-input"
              />
              <select
                name="ampm"
                value={formData.ampm}
                onChange={handleChange}
                className="ampm-select"
                disabled={isSubmitting}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="form-group time-group">
            <label htmlFor="returnTime">Return Time:</label>
            <div className="time-input-container">
              <input
                type="time"
                id="returnTime"
                name="returnTime"
                value={formData.returnTime}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                className="time-input"
              />
              <select
                name="returnampm"
                value={formData.returnampm}
                onChange={handleChange}
                className="ampm-select"
                disabled={isSubmitting}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tutor">Tutor:</label>
            <select
              id="tutor"
              name="tutor"
              value={formData.tutor}
              onChange={handleChange}
              required
              disabled={isSubmitting}
            >
              <option value="">Select Tutor</option>
              <option value="Amsaveni">Amsaveni</option>
              <option value="Karthikeyan">Karthikeyan</option>
              <option value="PiriyaDharsini">PiriyaDharsini</option>
              <option value="VijayKumar">VijayKumar</option>
              <option value="RajKumar">RajKumar</option>
              <option value="Dheenathayalan">Dheenathayalan</option>
              <option value="Amutha">Amutha</option>
            </select>
          </div>

          <div className="button-container">
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                backgroundColor: isSubmitting ? "#ccc" : "#007bff",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Gate Pass"}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isSubmitting}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </form>

        {/* Dashboard button */}
        <div
          style={{
            marginTop: "32px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            style={{
              padding: "12px 28px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "1.1em",
              fontWeight: "bold",
              boxShadow: "0 2px 8px rgba(25, 118, 210, 0.15)",
              transition: "background-color 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.backgroundColor = "#115293")
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.backgroundColor = "#1976d2")
            }
            disabled={isSubmitting}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: 4 }}
            >
              <rect x="3" y="13" width="7" height="8" />
              <rect x="14" y="8" width="7" height="13" />
              <rect x="8" y="3" width="7" height="18" />
            </svg>
            Go to Dashboard
          </button>
        </div>

        {/* Debug info */}
      </div>
    </div>
  );
};

export default GatepassForm;
