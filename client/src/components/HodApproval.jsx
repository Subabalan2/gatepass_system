

// src/pages/HodApproval.js

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/hodapproval.css"; // Ensure this path is correct for your styles

const HodApproval = () => {
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard stats states (reflecting the new backend /dashboard/stats endpoint)
  const [pendingTotalCount, setPendingTotalCount] = useState(0); // This will come from /dashboard/stats
  const [hodPendingCount, setHodPendingCount] = useState(0); // This is the count of passes in the table
  const [totalApprovedCount, setTotalApprovedCount] = useState(0);
  const [todayApprovedCount, setTodayApprovedCount] = useState(0);

  const navigate = useNavigate();
  // Use process.env.REACT_APP_BACKEND_URL for consistency
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

  // Log the base URL for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("HodApproval: Backend Base URL:", backendBaseUrl);
    }
  }, [backendBaseUrl]);


  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
      alert("Logging out...");
      localStorage.clear();
      navigate("/");
    }
  };

  // Fetches only the passes awaiting HOD approval
  const fetchHodGatePasses = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Fetching HOD gate passes from:", `${backendBaseUrl}/api/gatepasses/hod-pending`);
      const response = await axios.get(`${backendBaseUrl}/api/gatepasses/hod-pending`);

      if (Array.isArray(response.data)) {
        setGatePasses(response.data);
        setHodPendingCount(response.data.length); // Update count for table
      } else {
        console.error("API didn't return an array for HOD gate passes:", response.data);
        setGatePasses([]);
        setHodPendingCount(0);
        setError("Received invalid data format from server for pending passes.");
      }
    } catch (err) {
      console.error("Error fetching HOD gate pass details:", err);
      setGatePasses([]);
      setHodPendingCount(0);
      setError("Failed to load pending gate passes. Please check server connection.");
    } finally {
      setLoading(false);
    }
  };

  // Fetches dashboard statistics from the new dedicated endpoint
  const fetchDashboardStats = async () => {
    try {
      console.log("Fetching dashboard stats from:", `${backendBaseUrl}/api/dashboard/stats`);
      const response = await axios.get(`${backendBaseUrl}/api/dashboard/stats`);

      const stats = response.data;
      if (stats) {
        setPendingTotalCount(stats.pendingCount || 0);
        setTotalApprovedCount(stats.approvedCount || 0);
        setTodayApprovedCount(stats.todayApproved || 0);
      } else {
        console.warn("Dashboard stats endpoint returned empty data.");
        setPendingTotalCount(0);
        setTotalApprovedCount(0);
        setTodayApprovedCount(0);
      }
    } catch (err) {
      console.error("Error fetching dashboard statistics:", err);
      // Don't block UI if stats fail, just log error
      // setError(prev => prev ? prev : "Failed to load dashboard stats."); // Only set if no other error exists
    }
  };

  useEffect(() => {
    fetchHodGatePasses();
    fetchDashboardStats(); // Fetch dashboard stats on mount
  }, []);

  // Handler for HOD approval/disapproval
  const handleHodApproval = async (id, status) => {
    if (!id) {
      alert("Error: Gate pass ID is missing.");
      return;
    }

    const confirmAction = window.confirm(`Are you sure you want to ${status} this gate pass?`);
    if (!confirmAction) return;

    setLoading(true); // Indicate loading while processing
    setError(null); // Clear previous errors

    try {
      // Use the new MVC endpoint for HOD actions
      console.log("Sending HOD approval/disapproval to:", `${backendBaseUrl}/api/gatepasses/hod-approve-disapprove`);
      await axios.post(`${backendBaseUrl}/api/gatepasses/hod-approve-disapprove`, {
        id,
        status, // "Approved" or "Disapproved"
      });

      if (status === "Approved") {
        alert("Gate pass approved successfully and student notified!");
      } else {
        alert("Gate pass rejected and student notified!");
      }

      // Refresh both the pending list and the dashboard stats after action
      fetchHodGatePasses();
      fetchDashboardStats();

    } catch (err) {
      console.error("Error processing HOD approval:", err);
      let errorMessage = "Failed to process approval. Please try again.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false); // End loading
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "short", day: "numeric" };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return "N/A";
    }
  };

  return (
    <div className="approval-page hod-theme">
      <div className="approval-header">
        <h1>HOD Gate Pass Approval</h1>
        <p>Final review of tutor-approved gate passes</p>
      </div>

      <div className="approval-container">
        {error && (
          <div className="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}

        <div className="stats-container">
          <div className="stat-card">
            <h3>Pending For Me</h3> {/* Specific to HOD's current list */}
            <div className="stat-value">{hodPendingCount}</div>
          </div>
          <div className="stat-card">
            <h3>Total Pending</h3> {/* From dashboard stats */}
            <div className="stat-value">{pendingTotalCount}</div>
          </div>
          <div className="stat-card">
            <h3>Today's Approved</h3>
            <div className="stat-value">{todayApprovedCount}</div>
          </div>
          <div className="stat-card">
            <h3>Total Approved</h3>
            <div className="stat-value">{totalApprovedCount}</div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Awaiting Final Approval</h2>
            <button
              className="refresh-btn"
              onClick={() => {
                fetchHodGatePasses();
                fetchDashboardStats();
              }}
              disabled={loading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" />
              </svg>
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading && gatePasses.length === 0 ? ( // Show loading only if initial load or list is empty
            <div className="loading">Loading gate pass requests...</div>
          ) : (
            <div className="table-responsive">
              <table className="approval-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Year</th>
                    <th>Purpose</th>
                    <th>Date</th>
                    <th>Departure</th>
                    <th>Return</th>
                    <th>Tutor</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {gatePasses.length > 0 ? (
                    gatePasses.map((pass) => (
                      <tr key={pass._id || pass.approvalId || Math.random()}> {/* More robust key */}
                        <td className="name-cell">{pass.name || "N/A"}</td>
                        <td>{pass.dpmt || "N/A"}</td>
                        <td>{pass.year || "N/A"}</td>
                        <td className="purpose-cell">{pass.purpose || "N/A"}</td>
                        <td>{formatDate(pass.date)}</td>
                        <td>{pass.time ? `${pass.time} ${pass.ampm || ""}` : "N/A"}</td>
                        <td>
                          {pass.returnTime
                            ? `${pass.returnTime} ${pass.returnampm || ""}`
                            : "Not specified"}
                        </td>
                        <td>{pass.tutor || "N/A"}</td>
                        <td className="action-buttons">
                          <button
                            className="approve-btn"
                            onClick={() => handleHodApproval(pass._id, "Approved")}
                            disabled={loading}
                          >
                            ✅ Approve
                          </button>
                          <button
                            className="disapprove-btn"
                            onClick={() => handleHodApproval(pass._id, "Disapproved")}
                            disabled={loading}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="no-data">
                        {loading ? "Loading..." : (error ? error : "No pending gate passes for HOD approval.")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="approval-footer">
          <div className="footer-content">
            <span>Gate Pass Management System — HOD Approval Portal</span>
            <button className="logout-btn" onClick={handleLogout}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HodApproval;
