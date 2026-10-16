const express = require("express");
const bcrypt = require("bcryptjs");
const Fan = require("../models/Fan");
const Admin = require("../models/Admin");
const { requireLogin } = require("../middleware/authMiddleware");
const router = express.Router();

// Public registration can only create fans. Admins are provisioned separately.
router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password || password.length < 8) return res.status(400).json({ error: "Username, email, and password (at least 8 characters) are required." });
    const normalizedEmail = email.trim().toLowerCase();
    if (await Fan.findOne({ $or: [{ username: username.trim() }, { email: normalizedEmail }] }) ||
        await Admin.findOne({ $or: [{ username: username.trim() }, { email: normalizedEmail }] })) {
      return res.status(409).json({ error: "That username or email is already in use." });
    }
    const fan = await Fan.create({ username: username.trim(), email: normalizedEmail, passwordHash: await bcrypt.hash(password, 12) });
    req.session.user = { id: fan.id, username: fan.username, role: "fan" };
    res.status(201).json({ user: req.session.user });
  } catch (err) { next(err); }
});
router.post("/login", async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password || !["fan", "admin"].includes(role)) return res.status(400).json({ error: "Username, password, and account type are required." });
    const account = await (role === "admin" ? Admin : Fan).findOne({ username: username.trim() });
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) return res.status(401).json({ error: "Invalid credentials." });
    req.session.regenerate(err => {
      if (err) return next(err);
      req.session.user = { id: account.id, username: account.username, role };
      res.json({ user: req.session.user });
    });
  } catch (err) { next(err); }
});
router.post("/logout", (req, res, next) => req.session.destroy(err => {
  if (err) return next(err);
  res.clearCookie("fantasy.sid");
  res.json({ message: "Logged out." });
}));
router.get("/me", requireLogin, (req, res) => res.json({ user: req.session.user }));
module.exports = router;
