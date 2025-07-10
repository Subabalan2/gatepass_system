const nodemailer = require("nodemailer");
require("dotenv").config();

// Tutor Email Mapping
const tutorEmailMap = {
  Amsaveni: "2212062@nec.edu.in",
  Karthikeyan: "2212062@nec.edu.in",
  PiriyaDharsini: "2212062@nec.edu.in",
  VijayKumar: "2212062@nec.edu.in",
  RajKumar: "2212062@nec.edu.in",
  Dheenathayalan: "2212062@nec.edu.in",
  Amutha: "2212062@nec.edu.in",
};

const createTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log("Email credentials not configured");
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

module.exports = {
  createTransporter,
  tutorEmailMap,
};
