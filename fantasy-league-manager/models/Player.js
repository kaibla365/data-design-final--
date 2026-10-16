const mongoose = require("mongoose");
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  sport: { type: String, required: true, enum: ["Football", "Basketball", "Baseball", "Hockey"] },
  position: { type: String, required: true },
  proTeam: { type: String, default: "Unassigned" },
  active: { type: Boolean, default: true }
}, { timestamps: true });
schema.index({ name: "text", proTeam: "text", position: "text" });
module.exports = mongoose.model("Player", schema);
