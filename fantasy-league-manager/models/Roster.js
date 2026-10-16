const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  teamName: { type: String, required: true, trim: true, maxlength: 50 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Fan", index: true },
  ownerName: { type: String, required: true },
  sport: { type: String, required: true, enum: ["Football", "Basketball", "Baseball", "Hockey"] },
  players: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
  season: { type: Number, default: new Date().getFullYear() }
}, { timestamps: true });
schema.index({ ownerId: 1, teamName: 1 }, { unique: true });
module.exports = mongoose.model("Roster", schema);
