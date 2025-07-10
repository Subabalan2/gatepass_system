// controllers/dashboardController.js
const GatePass = require("../models/GatePass");
const Receipt = require("../models/Receipt");

// @desc    Get dashboard statistics (pending, approved, today's approved, awaiting HOD)
// @route   GET /api/dashboard/stats
// @access  Private (for Admin/Staff roles)
async function getDashboardStats(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingCount = await GatePass.count({ status: "Pending" });
    const approvedCount = await Receipt.count({ status: "Approved" }); // Total final approved
    const todayApproved = await Receipt.count({
      status: "Approved",
      approvalDate: { $gte: today.toISOString() }, // Check receipts based on final approval date
    });
    const awaitingHOD = await GatePass.count({
      status: "Approved", // Approved by tutor
      approvalStage: "HOD", // Awaiting HOD
    });

    res.status(200).json({
      pendingCount,
      approvedCount,
      todayApproved,
      awaitingHOD,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardStats,
};
