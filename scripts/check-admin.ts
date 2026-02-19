import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { user, account } from "../lib/db/schema/auth";

async function check() {
  const sql = postgres(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  const users = await db.select().from(user);
  console.log("Users:", JSON.stringify(users, null, 2));

  const accounts = await db.select().from(account);
  console.log("Accounts:", JSON.stringify(accounts, null, 2));

  await sql.end();
}

check();
