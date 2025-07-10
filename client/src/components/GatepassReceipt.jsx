




//new server

import React, { useRef, useState, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const Receipt = ({ pass, onClose }) => {
  const receiptRef = useRef();
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [error, setError] = useState("");
  const [isServerPdfLoading, setIsServerPdfLoading] = useState(false);

  // Get API base URL from environment variable
  const baseUrl = process.env.react_app_url || "http://localhost:3001";

  // Validate pass data early
  if (!pass) {
    return (
      <div className="receipt-overlay" style={overlayStyle}>
        <div className="receipt-modal" style={modalStyle}>
          <div className="receipt-header" style={modalHeaderStyle}>
            <h2>Error</h2>
            <button
              className="close-btn"
              onClick={onClose}
              style={closeButtonStyle}
            >
              ×
            </button>
          </div>
          <div className="receipt-content" style={{ padding: "20px" }}>
            <p>No pass data available to display.</p>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      // Check for invalid date
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }
      const options = { year: "numeric", month: "short", day: "numeric" };
      return date.toLocaleDateString(undefined, options);
    } catch (err) {
      console.error("Date formatting error:", err);
      return "Invalid Date";
    }
  };

  const formatTime = (dateString) => {
    try {
      if (!dateString) return "N/A";
      const date = new Date(dateString);
      // Check for invalid date
      if (isNaN(date.getTime())) {
        return "Invalid Time";
      }
      const options = { hour: "2-digit", minute: "2-digit", hour12: true };
      return date.toLocaleTimeString(undefined, options);
    } catch (err) {
      console.error("Time formatting error:", err);
      return "Invalid Time";
    }
  };

  // Client-side PDF generation
  const handleDownloadPDF = async () => {
    const input = receiptRef.current;
    if (!input) {
      setError("Receipt content not found for PDF generation.");
      return;
    }

    setIsGeneratingPDF(true);
    setError("");

    try {
      // html2canvas options for better quality and handling
      const canvas = await html2canvas(input, {
        scale: 2, // Higher resolution
        useCORS: true, // Needed if you have images from different origins
        allowTaint: true, // For tainting canvas with cross-origin images
        backgroundColor: "#ffffff", // Explicitly set white background
        logging: false, // Disable verbose html2canvas logs
        // Ensure the QR code text is part of the DOM if using pseudo-elements
        onclone: (clonedDoc) => {
          const qrBox = clonedDoc.querySelector(".qr-box");
          if (qrBox && !qrBox.textContent.trim()) {
            // Add text content if not already present
            const span = clonedDoc.createElement("span");
            span.textContent = "QR CODE";
            span.style.cssText =
              "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 10px; color: #7f8c8d;";
            qrBox.appendChild(span);
          }
        },
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4"); // Portrait, millimeters, A4 size

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      // Add image to PDF. Adjust position and size to fit the page with margins.
      const margin = 10; // mm margin on all sides
      const finalImgWidth = pdfWidth - 2 * margin;
      const finalImgHeight = (imgProps.height * finalImgWidth) / imgProps.width;

      // Check if content fits on one page. If taller than page, scale down to fit height.
      if (finalImgHeight > pdf.internal.pageSize.getHeight() - 2 * margin) {
        const scaleFactor =
          (pdf.internal.pageSize.getHeight() - 2 * margin) / finalImgHeight;
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          finalImgWidth * scaleFactor,
          finalImgHeight * scaleFactor
        );
      } else {
        pdf.addImage(
          imgData,
          "PNG",
          margin,
          margin,
          finalImgWidth,
          finalImgHeight
        );
      }

      const filename = `Gatepass_Receipt_${pass.approvalId || "Unknown"}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setError(
        "Failed to generate PDF. Please try again. (Ensure content is visible on screen)"
      );
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Server-side PDF download (using the new MVC backend endpoint)
  const handleServerPDFDownload = async () => {
    if (!pass.approvalId) {
      setError("Approval ID is required to download receipt from server");
      return;
    }

    setIsServerPdfLoading(true);
    setError("");

    try {
      // Use the new endpoint path for downloading receipts
      const response = await fetch(
        `${baseUrl}/api/receipts/${pass.approvalId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/pdf",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server returned ${response.status}: ${errorText}`);
      }

      // Create a blob from the PDF response
      const blob = await response.blob();

      // Create a link element to trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Gatepass_Receipt_${pass.approvalId}.pdf`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading PDF from server:", err);
      setError(`Failed to download PDF from server: ${err.message}`);
    } finally {
      setIsServerPdfLoading(false);
    }
  };

  const handlePrint = () => {
    try {
      const printContent = receiptRef.current;
      if (!printContent) {
        setError("Print content not found.");
        return;
      }
      setError(""); // Clear previous errors

      const printWindow = window.open("", "_blank");
      printWindow.document.write(`
        <html>
          <head>
            <title>Gate Pass Receipt - ${pass.approvalId || "Unknown"}</title>
            <style>
              /* Styles from the provided inline CSS for the receipt-content */
              body { 
                margin: 0; 
                padding: 20px; 
                font-family: Arial, sans-serif; 
                background: white;
                color: #333;
              }
              .receipt-content { 
                max-width: 800px; 
                margin: 0 auto; 
                background: white;
                padding: 30px;
                border: 2px solid #333;
                border-radius: 10px;
              }
              .receipt-institution h1 { 
                text-align: center; 
                color: #2c3e50; 
                margin-bottom: 5px;
                font-size: 28px;
                font-weight: bold;
              }
              .receipt-institution p { 
                text-align: center; 
                color: #7f8c8d; 
                margin-bottom: 30px;
                font-size: 14px;
                font-weight: 600;
              }
              .receipt-approval-info { 
                display: flex; 
                justify-content: space-between; 
                margin-bottom: 30px;
                padding: 15px;
                background: #ecf0f1;
                border-radius: 8px;
                border-left: 4px solid #3498db;
              }
              .receipt-approval-id, .receipt-approval-date {
                text-align: center;
              }
              .receipt-approval-id span, .receipt-approval-date span {
                display: block;
                color: #7f8c8d;
                font-size: 12px;
                margin-bottom: 5px;
              }
              .receipt-approval-id strong, .receipt-approval-date strong {
                color: #2c3e50;
                font-size: 16px;
              }
              .receipt-details {
                margin-bottom: 30px;
              }
              .receipt-field { 
                margin-bottom: 15px; 
                padding: 10px;
                background: #f8f9fa;
                border-radius: 5px;
                display: flex;
                justify-content: space-between;
                align-items: center;
              }
              .receipt-row { 
                display: flex; 
                gap: 20px;
                margin-bottom: 15px;
              }
              .receipt-row .receipt-field {
                flex: 1;
              }
              .label { 
                font-weight: bold; 
                color: #34495e;
                font-size: 14px;
              }
              .value {
                color: #2c3e50;
                font-size: 14px;
                font-weight: 500;
              }
              .receipt-verification { 
                display: flex; 
                justify-content: space-between; 
                margin-top: 40px;
                padding: 20px;
                border-top: 2px solid #34495e;
                align-items: center;
              }
              .qr-placeholder {
                text-align: center;
              }
              .qr-box { 
                width: 80px;
                height: 80px;
                border: 2px solid #95a5a6;
                margin: 0 auto 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #ecf0f1;
                font-size: 10px;
                color: #7f8c8d;
                position: relative; /* Needed for absolute positioning of text content */
              }
              /* For printing, ensure "QR CODE" is visible even if html2canvas misses pseudo-elements */
              .qr-box span { 
                display: block; /* Make sure the span for "QR CODE" is visible in print */
              }
              .receipt-stamp {
                text-align: center;
              }
              .stamp-box { 
                border: 3px solid #27ae60; 
                color: #27ae60; 
                padding: 15px 25px; 
                font-weight: bold; 
                font-size: 18px;
                margin-bottom: 20px;
                border-radius: 5px;
                background: rgba(39, 174, 96, 0.1);
              }
              .signature-line {
                width: 150px;
                height: 2px;
                background: #34495e;
                margin: 10px auto;
              }
              .receipt-footer { 
                text-align: center; 
                margin-top: 30px; 
                padding: 20px;
                background: #f8f9fa;
                border-radius: 8px;
                border: 1px solid #dee2e6;
              }
              .receipt-footer p {
                margin: 5px 0;
                color: #6c757d;
                font-size: 12px;
              }
              /* Print specific styles */
              @media print {
                body { margin: 0; padding: 0; }
                /* Hide the overlay, modal chrome during print */
                .receipt-overlay { display: none !important; } 
                .receipt-modal { 
                  box-shadow: none !important; 
                  border: none !important; 
                  width: auto !important; 
                  height: auto !important;
                  max-width: none !important;
                  max-height: none !important;
                  overflow: visible !important;
                }
                .receipt-header, .receipt-actions { display: none !important; }
                .receipt-content { border: none !important; border-radius: 0 !important; padding: 0 !important; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      // Fallback for browsers that don't trigger onload quickly
      setTimeout(() => {
        if (!printWindow.closed) {
          printWindow.print();
          printWindow.close();
        }
      }, 500);
    } catch (err) {
      console.error("Print error:", err);
      setError(`Failed to print: ${err.message}`);
    }
  };

  // Inline styles for the modal structure (kept for self-contained component demo/usage)
  const overlayStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  };

  const modalStyle = {
    backgroundColor: "white",
    borderRadius: "10px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    maxWidth: "90vw",
    maxHeight: "90vh",
    overflow: "auto",
    position: "relative",
    width: "700px", // A fixed width for better layout consistency
  };

  const modalHeaderStyle = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px 30px",
    borderBottom: "1px solid #dee2e6",
    backgroundColor: "#f8f9fa",
  };

  const closeButtonStyle = {
    background: "none",
    border: "none",
    fontSize: "24px",
    cursor: "pointer",
    color: "#6c757d",
    padding: "5px",
    borderRadius: "50%",
    width: "40px",
    height: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const actionsContainerStyle = {
    display: "flex",
    gap: "15px",
    padding: "20px 30px",
    borderTop: "1px solid #dee2e6",
    backgroundColor: "#f8f9fa",
  };

  const buttonStyle = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "12px 24px",
    color: "white",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
    transition: "background-color 0.2s ease",
  };

  return (
    <div className="receipt-overlay" style={overlayStyle}>
      <div className="receipt-modal" style={modalStyle}>
        <div className="receipt-header" style={modalHeaderStyle}>
          <h2 style={{ margin: 0, color: "#2c3e50" }}>
            Gate Pass Approval Receipt
          </h2>
          <button onClick={onClose} style={closeButtonStyle}>
            ×
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: "15px",
              backgroundColor: "#f8d7da",
              color: "#721c24",
              border: "1px solid #f5c6cb",
              borderRadius: "5px",
              margin: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* This div is what html2canvas will capture for PDF and printing */}
        <div ref={receiptRef} style={{ padding: "30px" }}>
          <div style={{ textAlign: "center", marginBottom: "30px" }}>
            <h1
              style={{
                color: "#2c3e50",
                marginBottom: "5px",
                fontSize: "28px",
              }}
            >
              NEC Gate Pass
            </h1>
            <p
              style={{ color: "#7f8c8d", fontWeight: "600", fontSize: "14px" }}
            >
              OFFICIAL APPROVAL RECEIPT
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "30px",
              padding: "15px",
              backgroundColor: "#ecf0f1",
              borderRadius: "8px",
              borderLeft: "4px solid #3498db",
            }}
          >
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  color: "#7f8c8d",
                  fontSize: "12px",
                  marginBottom: "5px",
                }}
              >
                Approval ID:
              </span>
              <strong style={{ color: "#2c3e50", fontSize: "16px" }}>
                {pass.approvalId || "N/A"}
              </strong>
            </div>
            <div style={{ textAlign: "center" }}>
              <span
                style={{
                  display: "block",
                  color: "#7f8c8d",
                  fontSize: "12px",
                  marginBottom: "5px",
                }}
              >
                Approved On:
              </span>
              <strong style={{ color: "#2c3e50", fontSize: "16px" }}>
                {pass.approvalDate
                  ? `${formatDate(pass.approvalDate)} at ${formatTime(
                      pass.approvalDate
                    )}`
                  : "N/A"}
              </strong>
            </div>
          </div>

          <div style={{ marginBottom: "30px" }}>
            <div
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: "bold", color: "#34495e" }}>
                Student Name:
              </span>
              <span style={{ color: "#2c3e50" }}>{pass.name || "N/A"}</span>
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#34495e" }}>
                  Department:
                </span>
                <span style={{ color: "#2c3e50" }}>{pass.dpmt || "N/A"}</span>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#34495e" }}>
                  Year:
                </span>
                <span style={{ color: "#2c3e50" }}>{pass.year || "N/A"}</span>
              </div>
            </div>

            <div
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: "bold", color: "#34495e" }}>
                Purpose:
              </span>
              <span style={{ color: "#2c3e50" }}>{pass.purpose || "N/A"}</span>
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#34495e" }}>
                  Date:
                </span>
                <span style={{ color: "#2c3e50" }}>
                  {pass.date ? formatDate(pass.date) : "N/A"}
                </span>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#34495e" }}>
                  Departure Time:
                </span>
                <span style={{ color: "#2c3e50" }}>
                  {pass.time ? `${pass.time} ${pass.ampm || ""}` : "N/A"}
                </span>
              </div>
            </div>

            <div
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#f8f9fa",
                borderRadius: "5px",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontWeight: "bold", color: "#34495e" }}>
                Return Time:
              </span>
              <span style={{ color: "#2c3e50" }}>
                {pass.returnTime
                  ? `${pass.returnTime} ${pass.returnampm || ""}`
                  : "Not specified"}
              </span>
            </div>

            <div style={{ display: "flex", gap: "20px", marginBottom: "15px" }}>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#34495e" }}>
                  Tutor Approval:
                </span>
                <span style={{ color: "#2c3e50" }}>{pass.tutor || "N/A"}</span>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: "10px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontWeight: "bold", color: "#34495e" }}>
                  HOD Approval:
                </span>
                <span style={{ color: "#2c3e50" }}>Approved</span>
              </div>
            </div>
          </div>

          {/* <div
            className="receipt-verification" // Added class for print CSS to target
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: "40px",
              padding: "20px",
              borderTop: "2px solid #34495e",
              alignItems: "center",
            }}
          >
            <div className="qr-placeholder" style={{ textAlign: "center" }}>
              <div
                className="qr-box" // Added class for html2canvas onclone logic
                style={{
                  width: "80px",
                  height: "80px",
                  border: "2px solid #95a5a6",
                  margin: "0 auto 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#ecf0f1",
                  fontSize: "10px",
                  color: "#7f8c8d",
                  position: "relative", // Needed for absolute positioning of span
                }}
              >
                
                <span>QR CODE</span>
              </div>
              <span style={{ fontSize: "12px", color: "#7f8c8d" }}>
                Scan to verify
              </span>
            </div>

            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  border: "3px solid #27ae60",
                  color: "#27ae60",
                  padding: "15px 25px",
                  fontWeight: "bold",
                  fontSize: "18px",
                  marginBottom: "20px",
                  borderRadius: "5px",
                  backgroundColor: "rgba(39, 174, 96, 0.1)",
                }}
              >
                APPROVED
              </div>
              <div
                style={{
                  width: "150px",
                  height: "2px",
                  backgroundColor: "#34495e",
                  margin: "10px auto",
                }}
              ></div>
              <span style={{ fontSize: "12px", color: "#7f8c8d" }}>
                HOD Signature
              </span>
            </div>
          </div> */}

          <div
            style={{
              textAlign: "center",
              marginTop: "30px",
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              border: "1px solid #dee2e6",
            }}
          >
            <p style={{ margin: "5px 0", color: "#6c757d", fontSize: "12px" }}>
              This is an official gate pass approval document.
            </p>
            <p style={{ margin: "5px 0", color: "#6c757d", fontSize: "12px" }}>
              Present this receipt at the campus gate when departing.
            </p>
          </div>
        </div>

        <div className="receipt-actions" style={actionsContainerStyle}>
          {/* <button
            onClick={handlePrint}
            style={{ ...buttonStyle, backgroundColor: "#007bff" }}
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
              <polyline points="6 9 6 2 18 2 18 9"></polyline>
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
              <rect x="6" y="14" width="12" height="8"></rect>
            </svg>
            Print Receipt
          </button> */}

          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            style={{
              ...buttonStyle,
              backgroundColor: isGeneratingPDF ? "#6c757d" : "#28a745",
              cursor: isGeneratingPDF ? "not-allowed" : "pointer",
            }}
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {isGeneratingPDF ? "Generating PDF..." : "Download PDF (Client)"}
          </button>

          
          
        </div>
      </div>
    </div>
  );
};

export default Receipt;
