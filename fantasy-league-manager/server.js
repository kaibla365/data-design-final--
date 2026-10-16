require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: "fantasy.sid",
  secret: process.env.SESSION_SECRET || "development-only-change-this-secret",
  resave: false, saveUninitialized: false,
  store: process.env.MONGODB_URI ? MongoStore.create({ mongoUrl: process.env.MONGODB_URI }) : undefined,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 28800000 }
}));
app.use(express.static("public"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/players", require("./routes/players"));
app.use("/api/rosters", require("./routes/rosters"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/history", require("./routes/history"));
app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "Fantasy League Manager" }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: "An unexpected server error occurred." }); });

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("Missing MONGODB_URI. Copy .env.example to .env and configure MongoDB.");
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");
  app.listen(PORT, () => console.log(`Fantasy League Manager running at http://localhost:${PORT}`));
}
start().catch(err => { console.error("Startup failed:", err.message); process.exit(1); });
