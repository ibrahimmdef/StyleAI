import pg from "pg";

// Ids are bigint in the database. pg sends those as text ("12"),
// but the frontend compares them as numbers, so turn them back into numbers.
pg.types.setTypeParser(pg.types.builtins.INT8, Number);

// Spelling out the strict SSL check keeps pg from warning about it
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL?.replace(
    "sslmode=require",
    "sslmode=verify-full",
  ),
});
