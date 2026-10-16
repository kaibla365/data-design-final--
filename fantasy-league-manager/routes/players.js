const express = require("express");
const Player = require("../models/Player");
const { requireLogin, requireAdmin } = require("../middleware/authMiddleware");
const router = express.Router();
const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
router.get("/", requireLogin, async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.sport) filter.sport = req.query.sport;
    if (req.query.search) filter.$or = ["name", "proTeam", "position"].map(field => ({ [field]: new RegExp(escapeRegex(req.query.search), "i") }));
    res.json(await Player.find(filter).sort({ sport: 1, name: 1 }).limit(200));
  } catch (err) { next(err); }
});
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { name, sport, position, proTeam } = req.body;
    if (!name || !sport || !position) return res.status(400).json({ error: "Name, sport, and position are required." });
    res.status(201).json(await Player.create({ name, sport, position, proTeam }));
  } catch (err) { next(err); }
});
module.exports = router;
