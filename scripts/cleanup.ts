import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";

async function cleanup() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const pgSql = postgres(connectionString);
  const db = drizzle(pgSql);

  // 1. Truncate all data tables (order matters due to FK constraints)
  console.log("Truncating database tables...");
  await db.execute(sql`TRUNCATE TABLE product_option_values CASCADE`);
  await db.execute(sql`TRUNCATE TABLE product_option_types CASCADE`);
  await db.execute(sql`TRUNCATE TABLE product_images CASCADE`);
  await db.execute(sql`TRUNCATE TABLE product_variants CASCADE`);
  await db.execute(sql`TRUNCATE TABLE order_items CASCADE`);
  await db.execute(sql`TRUNCATE TABLE orders CASCADE`);
  await db.execute(sql`TRUNCATE TABLE products CASCADE`);
  await db.execute(sql`TRUNCATE TABLE categories CASCADE`);
  await db.execute(sql`TRUNCATE TABLE contact_messages CASCADE`);
  // Truncate auth tables to remove old admin user
  await db.execute(sql`TRUNCATE TABLE account CASCADE`);
  await db.execute(sql`TRUNCATE TABLE session CASCADE`);
  await db.execute(sql`TRUNCATE TABLE verification CASCADE`);
  await db.execute(sql`TRUNCATE TABLE "user" CASCADE`);
  console.log("All database tables truncated.");

  // 2. Delete all R2 objects
  const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
  const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
  const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
  const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

  if (R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME) {
    console.log("Deleting all R2 objects...");
    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });

    let continuationToken: string | undefined;
    let totalDeleted = 0;

    do {
      const listResult = await r2.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          ContinuationToken: continuationToken,
        })
      );

      const objects = listResult.Contents;
      if (objects && objects.length > 0) {
        await r2.send(
          new DeleteObjectsCommand({
            Bucket: R2_BUCKET_NAME,
            Delete: {
              Objects: objects.map((obj) => ({ Key: obj.Key })),
            },
          })
        );
        totalDeleted += objects.length;
      }

      continuationToken = listResult.NextContinuationToken;
    } while (continuationToken);

    console.log(`Deleted ${totalDeleted} R2 objects.`);
  } else {
    console.log("R2 credentials not found, skipping R2 cleanup.");
  }

  console.log("Cleanup complete!");
  await pgSql.end();
  process.exit(0);
}

cleanup();
