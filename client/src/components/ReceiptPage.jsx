

// //new code



// src/pages/ReceiptPage.js

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/ReceiptPage.css"; // Ensure this path is correct for your styles

const ReceiptPage = () => {
  const { approvalId } = useParams(); // Get approvalId from URL
  const navigate = useNavigate();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  // Use process.env.REACT_APP_BACKEND_URL for consistency
  const backendBaseUrl = process.env.REACT_APP_BACKEND_URL || "http://localhost:3001";

  // Log the base URL for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log("ReceiptPage: Backend Base URL:", backendBaseUrl);
      console.log("ReceiptPage: Approval ID from URL:", approvalId);
    }
  }, [backendBaseUrl, approvalId]);

  useEffect(() => {
    const fetchReceipt = async () => {
      setLoading(true);
      setError(null); // Clear previous errors

      if (!approvalId) {
        setError("No Approval ID provided in the URL.");
        setLoading(false);
        return;
      }

      try {
        // Corrected endpoint to match MVC backend: /api/receipts/:approvalId
        console.log("Fetching receipt from:", `${backendBaseUrl}/api/receipts/${approvalId}`);
        const response = await axios.get(`${backendBaseUrl}/api/receipts/${approvalId}`);

        if (response.data) {
          setReceipt(response.data);
        } else {
          setError("Receipt data not found for this ID.");
        }
      } catch (err) {
        console.error("Error fetching receipt:", err);
        let errorMessage = "Failed to load receipt. It may not exist or an error occurred.";
        if (err.response && err.response.status === 404) {
          errorMessage = "Receipt not found for this ID. It may have been deleted or expired.";
        } else if (err.message) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [approvalId, backendBaseUrl]); // Re-run effect if approvalId or base URL changes

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const downloadReceipt = async () => {
    if (!receipt || !approvalId) {
      alert("No receipt data or approval ID available for download.");
      return;
    }

    setDownloading(true);
    setError(null); // Clear previous errors

    try {
      // Corrected endpoint to match MVC backend: /api/receipts/download/:approvalId
      console.log("Downloading receipt from:", `${backendBaseUrl}/api/receipts/download/${approvalId}`);
      const response = await axios({
        url: `${backendBaseUrl}/api/receipts/download/${approvalId}`,
        method: "GET",
        responseType: "blob", // Important for receiving binary data like PDF
      });

      // Create a Blob from the response data
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `GatePass-${approvalId}.pdf`); // Filename for download
      document.body.appendChild(link);
      link.click(); // Programmatically click the link

      // Clean up the URL object and the link element
      link.remove(); // Use .remove() for modern browsers
      window.URL.revokeObjectURL(url);
      alert("Receipt PDF download initiated!");

    } catch (err) {
      console.error("Error downloading receipt:", err);
      let errorMessage = "Failed to download receipt. Please try again.";
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      alert(`Error: ${errorMessage}`);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: "numeric", month: "long", day: "numeric" };
    try {
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch {
      return "Invalid Date";
    }
  };

  const formatTime = (time, ampm) => {
    if (!time) return "N/A";
    return `${time} ${ampm || ""}`;
  };

  if (loading) {
    return (
      <div className="receipt-container loading-container">
        <div className="loading-spinner"></div>
        <p>Loading receipt...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="receipt-container error-container">
        <div className="error-icon">❌</div>
        <h2>Error</h2>
        <p>{error}</p>
        <button className="back-button" onClick={handleBack}>
          Back
        </button>
      </div>
    );
  }

  // If receipt is null after loading and no error, means 404 or empty data
  if (!receipt) {
    return (
      <div className="receipt-container error-container">
        <div className="error-icon">🤷‍♂️</div>
        <h2>Receipt Not Found</h2>
        <p>The gate pass receipt with ID "{approvalId}" could not be found.</p>
        <button className="back-button" onClick={handleBack}>
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="receipt-page">
      <div className="receipt-container">
        <div className="receipt-header">
          <h1>Gate Pass Receipt</h1>
          <div className="approval-id">
            <span>Approval ID: <strong>{approvalId}</strong></span>
          </div>
        </div>

        <div className="receipt-body">
          <div className="school-info">
            <h2>NEC College of Engineering & Technology</h2> {/* Updated name */}
            <p>Kovilpatti, Thoothukudi - 628503</p> {/* Updated address */}
          </div>

          <div className="student-info">
            <div className="info-row">
              <div className="info-item">
                <label>Student Name:</label>
                <span>{receipt.name || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>Department:</label>
                <span>{receipt.dpmt || "N/A"}</span>
              </div>
            </div>

            <div className="info-row">
              <div className="info-item">
                <label>Year:</label>
                <span>{receipt.year || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>Date of Leave:</label> {/* Changed label for clarity */}
                <span>{formatDate(receipt.date)}</span>
              </div>
            </div>

            <div className="info-row">
              <div className="info-item">
                <label>Departure Time:</label>
                <span>{formatTime(receipt.time, receipt.ampm)}</span>
              </div>
              <div className="info-item">
                <label>Expected Return Time:</label> {/* Changed label for clarity */}
                <span>
                  {receipt.returnTime
                    ? formatTime(receipt.returnTime, receipt.returnampm)
                    : "Not specified"}
                </span>
              </div>
            </div>

            <div className="info-row full-width">
              <div className="info-item">
                <label>Purpose:</label>
                <span>{receipt.purpose || "N/A"}</span>
              </div>
            </div>

            <div className="info-row">
              <div className="info-item">
                <label>Tutor Approval:</label>
                <span>{receipt.tutor || "N/A"}</span>
              </div>
              <div className="info-item">
                <label>HOD Approval Date:</label>
                <span>{formatDate(receipt.hodApprovalDate || receipt.approvalDate)}</span> {/* Use hodApprovalDate if available, fallback to approvalDate */}
              </div>
            </div>
          </div>

          <div className="approval-stamp">
            <div className="stamp">APPROVED</div>
          </div>

          <div className="important-note">
            <p>
              <strong>Important:</strong> This gate pass must be presented at
              the gate when leaving and returning to campus.
            </p>
          </div>
        </div>

        <div className="receipt-footer">
          <button className="back-button" onClick={handleBack}>
            Back
          </button>
          <button
            className="download-button"
            onClick={downloadReceipt}
            disabled={downloading}
          >
            {downloading ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptPage;
