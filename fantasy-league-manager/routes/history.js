const express = require("express");
const { requireLogin } = require("../middleware/authMiddleware");
const router = express.Router();
// These randomized records are fictional demonstration data, not official sports history.
router.get("/", requireLogin, async (req, res) => {
  if (!process.env.MOCKAROO_API_KEY) return res.status(503).json({ error: "Add MOCKAROO_API_KEY to .env to enable Mockaroo." });
  try {
    const count = Math.min(Math.max(Number(req.query.count) || 10, 1), 50);
    const fields = [
      { name: "teamName", type: "Words", min: 2, max: 3 },
      { name: "playerName", type: "Full Name" },
      { name: "sport", type: "Custom List", values: ["Football", "Basketball", "Baseball", "Hockey"] },
      { name: "position", type: "Custom List", values: ["QB", "RB", "WR", "TE", "PG", "SG", "C", "F", "P", "OF", "G", "D"] },
      { name: "points", type: "Number", min: 0, max: 40, decimals: 0 },
      { name: "season", type: "Custom List", values: ["2023", "2024", "2025"] }
    ];
    const response = await fetch(`https://api.mockaroo.com/api/generate.json?count=${count}&array=true`, {
      method: "POST", headers: { "X-API-Key": process.env.MOCKAROO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify(fields), signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) return res.status(502).json({ error: "Mockaroo returned an error. Check the API key and usage limit." });
    res.json({ demo: true, notice: "Randomized fictional demonstration data, not official historical results.", records: await response.json() });
  } catch (_err) { res.status(502).json({ error: "Could not reach Mockaroo. Try again later." }); }
});
module.exports = router;
