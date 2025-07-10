// controllers/gatePassController.js
const GatePass = require("../models/GatePass");
const Receipt = require("../models/Receipt");
const { sendEmail } = require("../services/emailService");
const {
  tutorEmailMap,
  HOD_EMAIL,
  DEFAULT_STUDENT_EMAIL,
  generateApprovalId,
} = require("../utils/appUtils");

// @desc    Submit a new gate pass request
// @route   POST /api/gatepasses/submit
// @access  Public (should be authenticated to student role in real app)
async function submitGatePass(req, res, next) {
  console.log("Received gate pass submission:", req.body);
  const {
    name,
    dpmt,
    year,
    purpose,
    date,
    time,
    ampm,
    returnTime,
    returnampm,
    tutor,
    studentEmail, // Assuming student email is passed or retrieved from auth
  } = req.body;

  // Basic validation
  if (
    !name ||
    !dpmt ||
    !year ||
    !purpose ||
    !date ||
    !time ||
    !ampm ||
    !returnTime ||
    !returnampm ||
    !tutor
  ) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (!tutorEmailMap[tutor]) {
    return res.status(400).json({ message: "Invalid tutor selected." });
  }

  try {
    const gatePassData = {
      name: name.trim(),
      dpmt: dpmt.trim(),
      year: year.toString(),
      purpose: purpose.trim(),
      date: date,
      time: time,
      ampm: ampm,
      returnTime: returnTime,
      returnampm: returnampm,
      tutor: tutor,
      status: "Pending", // Initial status
      approvalStage: "Tutor", // First approval stage
      submissionDate: new Date().toISOString(),
      studentEmail: studentEmail || DEFAULT_STUDENT_EMAIL, // Use provided email or default
    };

    const result = await GatePass.create(gatePassData);

    // 1. Email to student: confirmation of submission
    await sendEmail({
      to: gatePassData.studentEmail,
      subject: "Gatepass Submitted Successfully",
      text: `Dear ${name},\n\nYou have submitted your gatepass request successfully. Your request will be reviewed by your staff advisor.\n\nYou can check the status in the portal.`,
      html: `<h2>Gatepass Submitted</h2><p>Dear ${name},</p><p>You have submitted your gatepass request successfully. Your request will be reviewed by your staff advisor.</p><p>You can check the status in the portal.</p>`,
    });

    // 2. Email to staff: approval link
    await sendEmail({
      to: tutorEmailMap[tutor],
      subject: "Gatepass Approval Needed",
      text: `A student (${name}, ${dpmt}, Year ${year}) has submitted a gatepass request. Please review and approve/disapprove at: http://localhost:3000/staffs-Approval`,
      html: `<h2>Gatepass Approval Needed</h2><p>A student (<strong>${name}</strong>, ${dpmt}, Year ${year}) has submitted a gatepass request.</p><p><a href="http://localhost:3000/staffs-Approval">Go to Staff Approval Page</a></p>`,
    });

    res.status(201).json({
      message: "Gate pass submitted successfully and notifications sent.",
      gatePassId: result.insertedId,
    });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
}

// @desc    Get all pending gate passes for tutor approval
// @route   GET /api/gatepasses/tutor-pending
// @access  Private (for Tutor role)
async function getTutorGatePasses(req, res, next) {
  try {
    const passes = await GatePass.find({
      approvalStage: "Tutor",
      status: "Pending",
    });
    res.status(200).json(passes);
  } catch (error) {
    next(error);
  }
}

// @desc    Get all gate passes awaiting HOD approval
// @route   GET /api/gatepasses/hod-pending
// @access  Private (for HOD role)
async function getHodGatePasses(req, res, next) {
  try {
    const passes = await GatePass.find({
      status: "Approved",
      approvalStage: "HOD",
    }); // Status is 'Approved' by tutor, stage is 'HOD'
    res.status(200).json(passes);
  } catch (error) {
    next(error);
  }
}

// @desc    Update gate pass status by Tutor
// @route   POST /api/gatepasses/update-tutor-status
// @access  Private (for Tutor role)
async function updateGatePassStatus(req, res, next) {
  const { id, status } = req.body; // status can be "Approved" or "Disapproved"

  if (!id || !status) {
    return res
      .status(400)
      .json({ message: "Gate pass ID and status are required." });
  }

  try {
    const gatePass = await GatePass.findById(id);
    if (!gatePass) {
      return res.status(404).json({ message: "Gate pass not found." });
    }

    if (status === "Approved") {
      await GatePass.update(id, {
        status: "Approved", // Approved by tutor
        approvalStage: "HOD", // Next stage is HOD
        tutorApprovalDate: new Date().toISOString(),
      });

      // 1. Notify student: awaiting HOD
      await sendEmail({
        to: gatePass.studentEmail,
        subject: "Gatepass Approved by Staff - Awaiting HOD Approval",
        text: `Dear ${gatePass.name},\n\nYour gatepass request has been approved by your staff advisor and is now awaiting final approval from the HOD.\n\nYou will be notified once the HOD reviews your request.`,
        html: `<h2>Gatepass Awaiting HOD Approval</h2><p>Dear ${gatePass.name},</p><p>Your gatepass request has been approved by your staff advisor and is now awaiting final approval from the HOD.</p><p>You will be notified once the HOD reviews your request.</p>`,
      });

      // 2. Notify HOD: approval link
      await sendEmail({
        to: HOD_EMAIL,
        subject: `Gatepass Approval Needed (HOD) - ${gatePass.name}`,
        text: `A gatepass request from ${gatePass.name} (${gatePass.dpmt}, Year ${gatePass.year}) is awaiting your approval. Please review at: http://localhost:3000/hod-approval`,
        html: `<h2>Gatepass Approval Needed (HOD)</h2><p>A gatepass request from <strong>${gatePass.name}</strong> is awaiting your approval.</p><p><a href="http://localhost:3000/hod-approval">Go to HOD Approval Page</a></p>`,
      });

      res
        .status(200)
        .json({
          message:
            "Gate pass approved by tutor, notifications sent, and forwarded to HOD.",
        });
    } else if (status === "Disapproved") {
      await GatePass.delete(id); // Delete the record if disapproved by tutor

      // Notify student of disapproval
      await sendEmail({
        to: gatePass.studentEmail,
        subject: "Your Gate Pass Request Has Been Disapproved",
        text: `Dear ${gatePass.name},\n\nUnfortunately, your gate pass request for "${gatePass.purpose}" on ${gatePass.date} has been disapproved by your tutor.`,
        html: `
          <h2>Gate Pass Disapproved</h2>
          <p>Dear ${gatePass.name},</p>
          <p>Unfortunately, your gate pass request for <strong>${gatePass.purpose}</strong> on <strong>${gatePass.date}</strong> has been <strong>disapproved</strong> by your tutor.</p>
          <p>Please contact your tutor or department for more information if needed.</p>
          <br>
          <p>Best regards,<br>Gate Pass Management System</p>
        `,
      });

      res
        .status(200)
        .json({ message: "Gate pass disapproved and record deleted." });
    } else {
      res.status(400).json({
        message:
          "Invalid status provided. Must be 'Approved' or 'Disapproved'.",
      });
    }
  } catch (error) {
    next(error);
  }
}

// @desc    Process HOD approval/disapproval
// @route   POST /api/gatepasses/hod-approve-disapprove
// @access  Private (for HOD role)
async function hodApproval(req, res, next) {
  const { id, status } = req.body; // status can be "Approved" or "Disapproved"

  if (!id || !status) {
    return res
      .status(400)
      .json({ message: "Gate pass ID and status are required." });
  }

  try {
    const gatePass = await GatePass.findById(id);
    if (!gatePass) {
      return res.status(404).json({ message: "Gate pass not found." });
    }

    if (status === "Approved") {
      const approvalId = generateApprovalId();
      const hodApprovalDate = new Date().toISOString();

      // Create a receipt entry
      const receiptData = {
        ...gatePass, // Copy all existing gate pass data
        approvalId: approvalId,
        hodApprovalDate: hodApprovalDate,
        hodName: "Department HOD", // Placeholder, ideally from auth
        status: "Approved", // Final status
        approvalStage: "Final",
        approvalDate: hodApprovalDate, // Overall approval date
      };
      await Receipt.create(receiptData);

      // Update the original gate pass record to mark as finally approved
      await GatePass.update(id, {
        status: "Approved",
        approvalStage: "Final",
        hodApprovalDate: hodApprovalDate,
        hodName: "Department HOD", // Placeholder
        approvalId: approvalId, // Link to the generated receipt
      });

      // Notify student with receipt link and final approval
      await sendEmail({
        to: gatePass.studentEmail,
        subject: "Your Gatepass is Approved by HOD!",
        text: `Dear ${gatePass.name},\n\nCongratulations! Your gatepass has been approved by the HOD. You may now use your gatepass.\n\nYou can view and download your official gatepass receipt here: http://localhost:3000/receipt/${approvalId}`,
        html: `<h2>Gatepass Approved by HOD</h2><p>Dear ${gatePass.name},</p><p>Congratulations! Your gatepass has been approved by the HOD. You may now use your gatepass.</p><p><a href="http://localhost:3000/receipt/${approvalId}">View Your Gatepass Receipt</a></p>`,
      });

      res.status(200).json({
        message:
          "Gate pass approved by HOD, receipt generated, and student notified.",
        approvalId: approvalId,
      });
    } else if (status === "Disapproved") {
      await GatePass.delete(id); // Delete the record if disapproved by HOD

      // Notify student of disapproval
      await sendEmail({
        to: gatePass.studentEmail,
        subject: "Your Gate Pass Request Has Been Disapproved",
        html: `
          <h2>Gate Pass Disapproved 😔</h2>
          <p>Dear ${gatePass.name},</p>
          <p>We regret to inform you that your gate pass request for <strong>${gatePass.purpose}</strong> on <strong>${gatePass.date}</strong> has been <strong>disapproved</strong> by the HOD.</p>
          <p>For more details or to appeal, please contact your department office.</p>
          <br>
          <p>Best regards,<br>Gate Pass Management System</p>
        `,
      });
      res
        .status(200)
        .json({ message: "Gate pass disapproved by HOD and record deleted." });
    } else {
      res.status(400).json({
        message:
          "Invalid status provided. Must be 'Approved' or 'Disapproved'.",
      });
    }
  } catch (error) {
    next(error);
  }
}

// @desc    Get approved gate passes for a specific student
// @route   GET /api/gatepasses/student-approved/:studentName
// @access  Private (for Student role)
async function getApprovedGatePassesForStudent(req, res, next) {
  const { studentName } = req.params;

  if (!studentName) {
    return res.status(400).json({ message: "Student name is required." });
  }

  try {
    const approvedPasses = await Receipt.find({
      name: studentName,
      status: "Approved",
    });
    res.status(200).json(approvedPasses);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  submitGatePass,
  getTutorGatePasses,
  getHodGatePasses,
  updateGatePassStatus,
  hodApproval,
  getApprovedGatePassesForStudent,
};
