const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  playerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Player", index: true },
  gameDate: { type: Date, required: true }, week: { type: Number, required: true, min: 1, max: 30 },
  season: { type: Number, required: true },
  sport: { type: String, required: true, enum: ["Football", "Basketball", "Baseball", "Hockey"] },
  points: { type: Number, default: 0, min: 0 }, passingYards: { type: Number, default: 0, min: 0 },
  rushingYards: { type: Number, default: 0, min: 0 }, receivingYards: { type: Number, default: 0, min: 0 },
  touchdowns: { type: Number, default: 0, min: 0 }, rebounds: { type: Number, default: 0, min: 0 },
  assists: { type: Number, default: 0, min: 0 }, notes: { type: String, maxlength: 500 },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Admin" }
}, { timestamps: true });
schema.index({ playerId: 1, season: 1, week: 1 });
module.exports = mongoose.model("Stats", schema);
