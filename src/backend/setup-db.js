// Creates the tables from schema.sql in the database from .env.
// Run it with: npm run db:setup. Safe to run again.
import "dotenv/config";
import fs from "fs";
import pg from "pg";

// The direct (unpooled) address is better for changing tables
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is missing in .env");
  process.exit(1);
}

// Spelling out the strict SSL check keeps pg from warning about it
const client = new pg.Client({
  connectionString: url.replace("sslmode=require", "sslmode=verify-full"),
});

try {
  await client.connect();
  await client.query(fs.readFileSync("schema.sql", "utf8"));

  const { rows } = await client.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' order by table_name`,
  );
  console.log("Tables:", rows.map((row) => row.table_name).join(", "));
} catch (err) {
  console.error("Could not set up the database:", err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
