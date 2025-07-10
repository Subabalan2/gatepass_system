// src/pages/CompletedPassesDashboard.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import "../styles/dashboard.css"; // Ensure this path is correct for your styles
import Receipt from "../components/GatepassReceipt"; // Ensure this path is correct for your Receipt component

const CompletedPassesDashboard = () => {
  // Renamed for clarity in React component
  const [completedPasses, setCompletedPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingReceipt, setDownloadingReceipt] = useState(null);
  const [deletedTimestamps, setDeletedTimestamps] = useState({});

  // Delete button is now visible to all users
  // State for the Receipt modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPassForReceipt, setSelectedPassForReceipt] = useState(null);

  // Use process.env.REACT_APP_BACKEND_URL for clarity and consistency
  // Make sure to add REACT_APP_BACKEND_URL="http://localhost:3001" to your .env file in the React project
  const baseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

  // Fetches all HOD-approved passes (now from the new endpoint)
  const fetchCompletedPasses = async () => {
    setLoading(true);
    try {
      // Changed endpoint to the new MVC route for recently approved receipts
      const response = await axios.get(
        `${baseUrl}/api/receipts/approved-recent`
      );
      setCompletedPasses(response.data);
    } catch (error) {
      console.error("Error fetching completed passes:", error);
      // Optionally, set an error state to display to the user
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedPasses();
  }, []);

  const downloadReceipt = async (approvalId) => {
    if (!approvalId) {
      alert("No approval ID available for download.");
      return;
    }
    setDownloadingReceipt(approvalId);

    try {
      // Changed endpoint to the new MVC route for downloading receipts
      const response = await axios.get(
        `${baseUrl}/api/receipts/download/${approvalId}`,
        { responseType: "blob" } // Important for downloading files
      );

      // Create a Blob from the response data
      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element to trigger the download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `GatePass-${approvalId}.pdf`); // Filename for download
      document.body.appendChild(link);
      link.click(); // Programmatically click the link to trigger download

      // Clean up the URL object and the link element
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      alert("Receipt download initiated!");
    } catch (error) {
      console.error("Error downloading receipt:", error);
      // More user-friendly error message
      alert(
        "Failed to download receipt. Please check console for details or try again."
      );
    } finally {
      setDownloadingReceipt(null);
    }
  };

  // Function to view the receipt in a modal
  const viewReceipt = (pass) => {
    setSelectedPassForReceipt(pass);
    setShowReceiptModal(true);
  };

  // Function to close the receipt modal
  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setSelectedPassForReceipt(null);
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Use 12-hour format with AM/PM
    };
    try {
      // Ensure the date string is parsed correctly, especially if it's an ISO string
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid Date";
    }
  };

  // Admin delete handler
  const handleDelete = async (approvalId) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this record? This cannot be undone."
      )
    )
      return;
    try {
      await axios.delete(`${baseUrl}/api/receipts/${approvalId}`);
      setDeletedTimestamps((prev) => ({
        ...prev,
        [approvalId]: new Date().toISOString(),
      }));
      // Optionally, remove from UI immediately:
      setCompletedPasses((prev) =>
        prev.filter((p) => p.approvalId !== approvalId)
      );
      alert("Record deleted successfully.");
    } catch (err) {
      alert("Failed to delete record. See console for details.");
      console.error(err);
    }
  };

  return (
    <div className="approval-page hod-theme">
      <div className="approval-header">
        <h1>Completed Gate Passes</h1>
        <p>A log of all HOD-approved gate passes, ready for download.</p>
      </div>
      <div className="approval-container">
        <div className="card">
          <div className="card-header">
            <h2>Approved Gate Pass Log</h2>
            <button
              className="refresh-btn"
              onClick={fetchCompletedPasses}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh List"}
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading completed passes...</div>
          ) : (
            <div className="table-responsive">
              <table className="approval-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Department</th>
                    <th>Purpose</th>
                    <th>Approval Date</th>
                    <th>Approval ID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {completedPasses.length > 0 ? (
                    completedPasses.map((pass) => (
                      <tr key={pass.approvalId}>
                        <td className="name-cell">{pass.name}</td>
                        <td>{pass.dpmt}</td>
                        <td className="purpose-cell">{pass.purpose}</td>
                        <td>{formatDate(pass.approvalDate)}</td>
                        <td className="approval-id">{pass.approvalId}</td>
                        <td className="action-buttons">
                          <button
                            className="view-receipt-btn"
                            style={{
                              backgroundColor: "#1976d2",
                              color: "#fff",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontWeight: 600,
                              transition: "background 0.2s",
                              marginRight: 8,
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#115293")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#1976d2")
                            }
                            onClick={() => viewReceipt(pass)}
                            title="View receipt details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ marginRight: 4 }}
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                            View
                          </button>
                          {/* <button
                            className="download-receipt-btn"
                            onClick={() => downloadReceipt(pass.approvalId)}
                            disabled={downloadingReceipt === pass.approvalId}
                          >
                            {downloadingReceipt === pass.approvalId
                              ? "Downloading..."
                              : "Download PDF"}
                          </button> */}
                          {/* Delete button is visible to all users */}
                          <button
                            className="delete-btn"
                            style={{
                              marginLeft: 8,
                              color: "#fff",
                              backgroundColor: "#e53935",
                              border: "none",
                              borderRadius: "4px",
                              padding: "6px 12px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              fontWeight: 600,
                              transition: "background 0.2s",
                            }}
                            onMouseOver={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#b71c1c")
                            }
                            onMouseOut={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "#e53935")
                            }
                            onClick={() => handleDelete(pass.approvalId)}
                            title="Delete permanently (admin only)"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ marginRight: 4 }}
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                            Delete
                          </button>
                          {deletedTimestamps[pass.approvalId] && (
                            <div style={{ fontSize: "0.8em", color: "#888" }}>
                              Deleted at:{" "}
                              {new Date(
                                deletedTimestamps[pass.approvalId]
                              ).toLocaleString()}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-data">
                        No completed gate passes found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* The Receipt Modal for viewing */}
      {showReceiptModal && selectedPassForReceipt && (
        <Receipt pass={selectedPassForReceipt} onClose={closeReceiptModal} />
      )}
    </div>
  );
};

export default CompletedPassesDashboard;
