require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
async function main() {
  const [username, email, password] = process.argv.slice(2);
  if (!username || !email || !password || password.length < 8) {
    console.error('Usage: node scripts/create-admin.js "adminname" "admin@example.com" "StrongPassword1!"');
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGODB_URI);
  if (await Admin.findOne({ $or: [{ username }, { email: email.toLowerCase() }] })) throw new Error("Admin username or email already exists.");
  await Admin.create({ username, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 12) });
  console.log(`Admin account "${username}" created.`);
  await mongoose.disconnect();
}
main().catch(err => { console.error(err.message); process.exit(1); });
