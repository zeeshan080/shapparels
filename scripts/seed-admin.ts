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

  const email = "admin@shapparels.pk";
  const password = "Admin@123";

  try {
    // Delete existing admin if present
    const existing = await db.select().from(user).where(eq(user.email, email)).limit(1);
    if (existing.length > 0) {
      await db.delete(account).where(eq(account.userId, existing[0].id));
      await db.delete(user).where(eq(user.id, existing[0].id));
      console.log("Deleted existing admin user");
    }

    // Hash password using scrypt (BetterAuth format: N=16384, r=16, p=1, dkLen=64)
    const salt = randomBytes(16).toString("hex");
    const maxmem = 128 * 16384 * 16 * 2;
    const hash = scryptSync(password, salt, 64, { N: 16384, r: 16, p: 1, maxmem }).toString("hex");
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
