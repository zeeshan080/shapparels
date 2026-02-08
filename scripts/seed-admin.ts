import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { user, account } from "../lib/db/schema/auth";
import { eq } from "drizzle-orm";
import { scryptSync, randomBytes } from "crypto";

async function seedAdmin() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const sql = postgres(connectionString);
  const db = drizzle(sql);

  const email = "admin@shapparels.com";
  const password = "Admin@123";

  try {
    // Check if user exists
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existing.length > 0) {
      console.log("Admin user already exists:", email);
      await sql.end();
      process.exit(0);
    }

    // Hash password using scrypt (BetterAuth format)
    const salt = randomBytes(16).toString("hex");
    const hash = scryptSync(password, salt, 64).toString("hex");
    const hashedPassword = `${salt}:${hash}`;

    // Insert user
    const userId = randomBytes(16).toString("hex");
    const [newUser] = await db.insert(user).values({
      id: userId,
      email,
      name: "Admin",
      emailVerified: true,
    }).returning();

    // Insert credential account
    const accountId = randomBytes(16).toString("hex");
    await db.insert(account).values({
      id: accountId,
      userId: newUser.id,
      accountId: newUser.id,
      providerId: "credential",
      password: hashedPassword,
    });

    console.log("Admin user created successfully!");
    console.log("Email:", email);
    console.log("Password:", password);
  } catch (error: any) {
    console.error("Error:", error.message || error);
  }

  await sql.end();
  process.exit(0);
}

seedAdmin();
