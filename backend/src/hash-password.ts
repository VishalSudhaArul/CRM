import bcrypt from "bcrypt";
import { query, initDb } from "./lib/db";

async function updatePassword() {
  await initDb();
  const hashedPassword = await bcrypt.hash("test123", 10);

  await query(`UPDATE users SET password = $1 WHERE id = 1`, [hashedPassword]);

  console.log("Password updated successfully!");
  console.log("User ID: 1");
  console.log("Password: test123");
}

updatePassword().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});