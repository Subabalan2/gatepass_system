const User = require("../models/User");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "changeme_secret";

// Register a new user
async function register(req, res, next) {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are required." });
  }
  try {
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: "Email already registered." });
    }
    const user = await User.create({ email, password, name });
    res
      .status(201)
      .json({
        message: "User registered successfully.",
        user: { email: user.email, name: user.name },
      });
  } catch (err) {
    next(err);
  }
}

// Login a user
async function login(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ message: "Email and password are required." });
  }
  try {
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    // Create JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res
      .status(200)
      .json({ token, user: { email: user.email, name: user.name } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
