const express = require("express");
const mongoose = require("mongoose");
const Roster = require("../models/Roster");
const Player = require("../models/Player");
const Stats = require("../models/Stats");
const { requireFan, requireLogin } = require("../middleware/authMiddleware");
const router = express.Router();
router.get("/", requireLogin, async (req, res, next) => {
  try {
    const rosters = await Roster.find(req.query.all === "true" ? {} : { ownerId: req.session.user.id }).populate("players").sort({ updatedAt: -1 });
    const result = await Promise.all(rosters.map(async roster => {
      const ids = roster.players.map(p => p._id);
      const match = { playerId: { $in: ids }, season: roster.season };
      if (req.query.week) match.week = Number(req.query.week);
      const sums = await Stats.aggregate([{ $match: match }, { $group: { _id: null, points: { $sum: "$points" }, touchdowns: { $sum: "$touchdowns" }, passingYards: { $sum: "$passingYards" }, rushingYards: { $sum: "$rushingYards" }, receivingYards: { $sum: "$receivingYards" } } }]);
      return { ...roster.toObject(), weeklyStats: sums[0] || { points: 0, touchdowns: 0, passingYards: 0, rushingYards: 0, receivingYards: 0 } };
    }));
    res.json(result);
  } catch (err) { next(err); }
});
router.post("/", requireFan, async (req, res, next) => {
  try {
    const { teamName, sport, players = [] } = req.body;
    if (!teamName || !sport || !Array.isArray(players)) return res.status(400).json({ error: "Team name, sport, and player list are required." });
    if (players.length > 30 || new Set(players.map(String)).size !== players.length || !players.every(mongoose.isValidObjectId)) return res.status(400).json({ error: "Use up to 30 unique valid player IDs." });
    const valid = await Player.find({ _id: { $in: players }, sport, active: true });
    if (valid.length !== players.length) return res.status(400).json({ error: "All players must be active players in the selected sport." });
    res.status(201).json(await (await Roster.create({ teamName, sport, players, ownerId: req.session.user.id, ownerName: req.session.user.username })).populate("players"));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "You already have a roster with that name." });
    next(err);
  }
});
router.patch("/:id/players", requireFan, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid roster ID." });
    const roster = await Roster.findOne({ _id: req.params.id, ownerId: req.session.user.id });
    if (!roster) return res.status(404).json({ error: "Roster not found." });
    const players = req.body.players;
    if (!Array.isArray(players) || players.length > 30 || new Set(players.map(String)).size !== players.length || !players.every(mongoose.isValidObjectId)) return res.status(400).json({ error: "Provide up to 30 unique valid player IDs." });
    const valid = await Player.find({ _id: { $in: players }, sport: roster.sport, active: true });
    if (valid.length !== players.length) return res.status(400).json({ error: "All players must be active in this roster's sport." });
    roster.players = players;
    await roster.save();
    res.json(await roster.populate("players"));
  } catch (err) { next(err); }
});
module.exports = router;
