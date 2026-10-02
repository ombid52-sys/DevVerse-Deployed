import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("[Fatal Error] MONGODB_URI environment variable is required.");
  process.exit(1);
}

async function main() {
  console.log("=== DevVerse Admin Provisioning Tool ===");
  console.log(`Connecting to database: ${uri.replace(/\/\/.*@/, "//***:***@")}`);

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    const users = db.collection("users");

    const existingAdmin = await users.findOne({ role: "ADMIN" });
    if (existingAdmin) {
      console.log(`[Notice] Exactly one administrator already exists: ${existingAdmin.email} (@${existingAdmin.username})`);
      process.exit(0);
    }

    const email = (process.env.ADMIN_EMAIL || "admin@devverse.io").toLowerCase().trim();
    const username = (process.env.ADMIN_USERNAME || "admin").toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString("hex") + "A1!";

    console.log(`Provisioning administrator...`);
    console.log(`Email: ${email}`);
    console.log(`Username: ${username}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`Generated Secure Password: ${password}`);
      console.log(`[CRITICAL] Save this password immediately. Plaintext passwords are NEVER stored.`);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    await users.insertOne({
      email,
      username,
      displayName: "Platform Administrator",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      disabledUntil: null,
      bio: "DevVerse Platform Administrator",
      avatarUrl: "",
      isEmailVerified: true,
      createdAt: now,
      updatedAt: now,
    });

    console.log("Admin account successfully provisioned!");
  } catch (err) {
    console.error("[Admin Provisioning Error]", err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

main();
