// src/pages/StaffsApproval.js
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/staffapproval.css"; // Ensure this path is correct

const StaffsApproval = () => {
  /* ---------------------------------------------------------------- state */
  const [gatePasses, setGatePasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // dept filter
  const [error, setError] = useState(null); // Added error state for display

  const navigate = useNavigate();

  // Determine the base URL. Prefer VITE_REACT_APP_API_URL for Vite,
  // then REACT_APP_API_URL for Create React App, fallback to localhost.
  const backendBaseUrl =
    process.env.REACT_APP_API_URL ||
    import.meta.env?.VITE_REACT_APP_API_URL ||
    "http://localhost:3002";

  // Warn if backendBaseUrl is not set
  if (!backendBaseUrl) {
    console.error("Backend API URL is not set. Please check your .env file.");
  }

  // Log the base URL for debugging in development
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.log("StaffsApproval: Backend Base URL:", backendBaseUrl);
    }
  }, [backendBaseUrl]);

  /* ---------------------------------------------------------------- fetchers */
  const fetchGatePasses = async () => {
    setLoading(true);
    setError(null); // Clear previous errors

    if (!backendBaseUrl) {
      setError(
        "Backend API URL is not set. Please check your .env file and restart the frontend."
      );
      setLoading(false);
      return;
    }

    try {
      // *** CORRECTION HERE: Use /api/gatepasses/tutor-pending ***
      const { data } = await axios.get(
        `${backendBaseUrl}/api/gatepasses/tutor-pending`
      );
      setGatePasses(Array.isArray(data) ? data : []);
      if (!Array.isArray(data)) {
        console.warn(
          "API response was not an array for tutor pending passes:",
          data
        );
        setError(
          "Received unexpected data format from server for pending passes."
        );
      }
    } catch (e) {
      let errorMsg =
        e.response?.data?.message || e.message || "Failed to load gate passes.";
      if (
        e.message &&
        (e.message.includes("Network Error") || e.message.includes("CORS"))
      ) {
        errorMsg =
          "Could not connect to backend. Please check that the backend server is running and the API URL is correct.";
      }
      setError(errorMsg);
      setGatePasses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGatePasses();
  }, []); // Empty dependency array means this runs once on mount

  /* ---------------------------------------------------------------- actions */
  const handleApproval = async (id, status) => {
    if (!id) {
      alert("Error: Gate pass ID is missing.");
      return;
    }

    const confirmAction = window.confirm(
      `Are you sure you want to ${status} this gate pass?`
    );
    if (!confirmAction) return;

    setLoading(true);
    setError(null); // Clear previous errors

    try {
      // *** CORRECTION HERE: Use /api/gatepasses/update-tutor-status ***
      // The backend expects `id` and `status` in the request body
      await axios.post(`${backendBaseUrl}/api/gatepasses/update-tutor-status`, {
        id,
        status, // "Approved" or "Disapproved"
      });

      alert(`Gate pass ${status === "Approved" ? "approved" : "rejected"}.`);
      fetchGatePasses(); // refresh list to remove the processed item
    } catch (e) {
      console.error(
        "Error updating gate-pass status:",
        e.response?.data || e.message
      );
      setError(
        e.response?.data?.message ||
          e.message ||
          "Error updating gate-pass status."
      );
      alert(e.response?.data?.message || "Error updating gate-pass status.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/");
    }
  };

  /* ---------------------------------------------------------------- helpers */
  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : "N/A";

  const filteredPasses = useMemo(() => {
    if (filter === "all") return gatePasses;
    return gatePasses.filter(
      (p) => p.dpmt?.toUpperCase() === filter.toUpperCase()
    );
  }, [gatePasses, filter]);

  /* ---------------------------------------------------------------- render */
  return (
    <div className="staffs-approvalbg-container">
      <div className="approval-container">
        {/* header */}
        <header className="approval-header">
          <div>
            <h1 className="header-title">
              Gate Pass Requests – Tutor Approval
            </h1>
            <p className="header-subtitle">
              {filteredPasses.length} pending requests
            </p>
          </div>
          <button
            className="refresh-btn"
            onClick={fetchGatePasses}
            disabled={loading}
          >
            ⟳ Refresh
          </button>
        </header>

        {error && (
          <div className="error-message">
            <span role="img" aria-label="error-icon">
              ❌
            </span>{" "}
            {error}
          </div>
        )}

        {/* filter bar */}
        <FilterBar filter={filter} setFilter={setFilter} loading={loading} />

        {loading && filteredPasses.length === 0 ? ( // Only show loader if no data is present yet
          <Loader />
        ) : filteredPasses.length > 0 ? (
          <RequestsTable
            passes={filteredPasses}
            fmtDate={fmtDate}
            loading={loading} // Pass loading prop to disable buttons
            onDecision={handleApproval}
          />
        ) : (
          <EmptyState />
        )}

        {/* footer */}
        <footer className="approval-footer">
          <div className="footer-content">
            <span>Gate Pass Management System — Staff Approval Portal</span>
            <button
              className="logout-btn"
              onClick={handleLogout}
              disabled={loading}
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
        </footer>
      </div>
    </div>
  );
};

/* ========================================================================== */
/* -----------------------  small sub-components  --------------------------- */

const FilterBar = ({ filter, setFilter, loading }) => {
  const depts = ["CSE", "ECE", "EEE", "MECH", "CIVIL", "AIDS", "IT"]; // Added IT
  return (
    <div className="filter-bar">
      <span className="filter-label">Filter by Department:</span>
      <button
        className={`filter-btn ${filter === "all" ? "active" : ""}`}
        onClick={() => setFilter("all")}
        disabled={loading}
      >
        All
      </button>
      {depts.map((d) => (
        <button
          key={d}
          className={`filter-btn ${filter === d ? "active" : ""}`}
          onClick={() => setFilter(d)}
          disabled={loading}
        >
          {d}
        </button>
      ))}
    </div>
  );
};

const RequestsTable = ({ passes, fmtDate, loading, onDecision }) => (
  <table className="requests-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>
          <span className="column-icon">
            <svg
              className="icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
            </svg>
            Department
          </span>
        </th>
        <th>Year</th>
        <th>Purpose</th>
        <th>
          <span className="column-icon">
            <svg
              className="icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            Date
          </span>
        </th>
        <th>
          <span className="column-icon">
            <svg
              className="icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3"></path>
            </svg>
            Departure
          </span>
        </th>
        <th>
          <span className="column-icon">
            <svg
              className="icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"></path>
            </svg>
            Return
          </span>
        </th>
        <th>
          <span className="column-icon">
            <svg
              className="icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            Tutor
          </span>
        </th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {passes.map((p) => (
        <tr key={p._id}>
          <td>{p.name || "N/A"}</td>
          <td>
            <span className="badge">{p.dpmt || "N/A"}</span>
          </td>
          <td>{p.year || "N/A"}</td>
          <td className="purpose-text" title={p.purpose || ""}>
            {p.purpose || "N/A"}
          </td>
          <td>{fmtDate(p.date)}</td>
          <td>
            <div className="time-display">
              <svg
                className="icon"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              {`${p.time || ""} ${p.ampm || ""}`}
            </div>
          </td>
          <td>
            {p.returnTime ? (
              <div className="time-display">
                <svg
                  className="icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                {`${p.returnTime} ${p.returnampm || ""}`}
              </div>
            ) : (
              <span className="time-not-specified">—</span>
            )}
          </td>
          <td>{p.tutor || "N/A"}</td>
          <td className="action-buttons">
            <button
              className="approve-btn"
              disabled={loading}
              onClick={() => onDecision(p._id, "Approved")}
            >
              ✅ Approve
            </button>
            <button
              className="disapprove-btn"
              disabled={loading}
              onClick={() => onDecision(p._id, "Disapproved")}
            >
              ✖ Reject
            </button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
);

const Loader = () => (
  <div className="loading-container">
    <div className="spinner"></div>
    <p>Loading requests…</p>
  </div>
);

const EmptyState = () => (
  <div className="empty-state">
    <svg
      className="empty-icon"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
    <h3 className="empty-title">No gate-pass requests found</h3>
    <p className="empty-description">
      All requests have been processed, or none have been submitted.
    </p>
  </div>
);

export default StaffsApproval;
