// controllers/receiptController.js
const Receipt = require("../models/Receipt");
const { generateGatePassPdf } = require("../services/pdfService");

// @desc    Get a specific receipt by approval ID
// @route   GET /api/receipts/:approvalId
// @access  Public (should be authenticated to student/staff in real app)
async function getReceiptById(req, res, next) {
  const { approvalId } = req.params;

  if (!approvalId) {
    return res.status(400).json({ message: "Approval ID is required." });
  }

  try {
    const receipt = await Receipt.findOne({ approvalId });

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found." });
    }
    res.status(200).json(receipt);
  } catch (error) {
    next(error);
  }
}

// @desc    Download a receipt as PDF by approval ID
// @route   GET /api/receipts/download/:approvalId
// @access  Public (should be authenticated to student/staff in real app)
async function downloadReceiptPdf(req, res, next) {
  const { approvalId } = req.params;

  if (!approvalId) {
    return res.status(400).json({ message: "Approval ID is required." });
  }

  try {
    const receipt = await Receipt.findOne({ approvalId });

    if (!receipt) {
      return res.status(404).json({ message: "Receipt not found." });
    }

    const pdfBuffer = await generateGatePassPdf(receipt);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="GatePass-${approvalId}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
}

// @desc    Get recently approved passes (e.g., for a public dashboard or log)
// @route   GET /api/receipts/approved-recent
// @access  Public
async function getRecentlyApproved(req, res, next) {
  try {
    const recentlyApproved = await Receipt.findRecentlyApproved(10); // Get last 10
    res.status(200).json(recentlyApproved);
  } catch (error) {
    next(error);
  }
}

// @desc    Permanently delete a receipt by approval ID (admin only)
// @route   DELETE /api/receipts/:approvalId
// @access  Admin
async function deleteReceiptByApprovalId(req, res, next) {
  const { approvalId } = req.params;
  console.log(
    "[DELETE] Attempting to delete receipt with approvalId:",
    approvalId
  ); // Log approvalId
  if (!approvalId) {
    return res.status(400).json({ message: "Approval ID is required." });
  }
  try {
    const result = await Receipt.deleteByApprovalId(approvalId);
    console.log("[DELETE] Delete result:", result); // Log result
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "Receipt not found or already deleted." });
    }
    res.status(200).json({ message: "Receipt deleted successfully." });
  } catch (error) {
    console.error("[DELETE] Error deleting receipt:", error); // Log error
    next(error);
  }
}

module.exports = {
  getReceiptById,
  downloadReceiptPdf,
  getRecentlyApproved,
  deleteReceiptByApprovalId,
};
