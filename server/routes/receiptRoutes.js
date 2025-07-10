// routes/receiptRoutes.js
const express = require("express");
const {
  getReceiptById,
  downloadReceiptPdf,
  getRecentlyApproved,
  deleteReceiptByApprovalId,
} = require("../controllers/receiptController");

const router = express.Router();

router.get("/approved-recent", getRecentlyApproved);
router.get("/:approvalId", getReceiptById); // Fetch receipt data
router.get("/download/:approvalId", downloadReceiptPdf); // Download as PDF
router.delete("/:approvalId", deleteReceiptByApprovalId); // Admin delete

module.exports = router;
