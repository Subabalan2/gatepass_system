// utils/appUtils.js
// Tutor Email Mapping (For testing, all set to your email. Change after testing!)
const tutorEmailMap = {
  Amsaveni: "2212062@nec.edu.in",
  Karthikeyan: "2212062@nec.edu.in",
  PiriyaDharsini: "2212062@nec.edu.in",
  VijayKumar: "2212062@nec.edu.in",
  RajKumar: "2212062@nec.edu.in",
  Dheenathayalan: "2212062@nec.edu.in",
  Amutha: "2212062@nec.edu.in",
};

// Default HOD and Student emails for testing (replace with dynamic logic)
const HOD_EMAIL = "2212062@nec.edu.in";
const DEFAULT_STUDENT_EMAIL = "student@example.com";

// Generate unique approval ID
function generateApprovalId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `GP-${timestamp}-${randomStr}`.toUpperCase();
}

module.exports = {
  tutorEmailMap,
  HOD_EMAIL,
  DEFAULT_STUDENT_EMAIL,
  generateApprovalId,
};
