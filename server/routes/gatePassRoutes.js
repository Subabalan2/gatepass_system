// routes/gatePassRoutes.js
const express = require("express");
const {
  submitGatePass,
  getTutorGatePasses,
  getHodGatePasses,
  updateGatePassStatus,
  hodApproval,
  getApprovedGatePassesForStudent,
} = require("../controllers/gatePassController");

const router = express.Router();

router.post("/submit", submitGatePass);
router.get("/tutor-pending", getTutorGatePasses);
router.get("/hod-pending", getHodGatePasses);
router.post("/update-tutor-status", updateGatePassStatus); // Renamed for clarity
router.post("/hod-approve-disapprove", hodApproval); // Renamed for clarity
router.get("/student-approved/:studentName", getApprovedGatePassesForStudent);

module.exports = router;
