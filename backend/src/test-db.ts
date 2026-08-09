import { query, initDb } from "./lib/db";

async function testDatabase() {
  await initDb();
  const users = await query("SELECT id, name, email, role FROM users");
  console.log("Users:", users);
}

testDatabase().catch((error) => {
  console.error("Database error:", error);
});