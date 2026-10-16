const express = require("express");
const mongoose = require("mongoose");
const Stats = require("../models/Stats");
const Player = require("../models/Player");
const { requireLogin, requireAdmin } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireLogin, async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.week) filter.week = Number(req.query.week);
    if (req.query.season) filter.season = Number(req.query.season);
    if (req.query.sport) filter.sport = req.query.sport;
    res.json(await Stats.find(filter).populate("playerId", "name position proTeam sport").sort({ season: -1, week: 1 }).limit(500));
  } catch (err) { next(err); }
});
router.post("/", requireAdmin, async (req, res, next) => {
  try {
    const { playerId, gameDate, week, season, sport } = req.body;
    if (!mongoose.isValidObjectId(playerId) || !gameDate || !week || !season || !sport) return res.status(400).json({ error: "Player, date, week, season, and sport are required." });
    if (!Number.isInteger(Number(week)) || Number(week) < 1 || !Number.isInteger(Number(season))) return res.status(400).json({ error: "Week and season must be valid numbers." });
    if (Number.isNaN(Date.parse(gameDate))) return res.status(400).json({ error: "Invalid game date." });
    if (!(await Player.findOne({ _id: playerId, sport }))) return res.status(400).json({ error: "Player does not exist in the selected sport." });
    const fields = ["points", "passingYards", "rushingYards", "receivingYards", "touchdowns", "rebounds", "assists"];
    const stats = { playerId, gameDate, week: Number(week), season: Number(season), sport, enteredBy: req.session.user.id, notes: req.body.notes || "" };
    for (const field of fields) {
      const value = req.body[field] === undefined ? 0 : Number(req.body[field]);
      if (!Number.isFinite(value) || value < 0) return res.status(400).json({ error: `${field} must be a non-negative number.` });
      stats[field] = value;
    }
    res.status(201).json(await Stats.create(stats));
  } catch (err) { next(err); }
});
module.exports = router;
