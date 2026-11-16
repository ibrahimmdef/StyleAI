import fs from "fs";
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

// Reads an old JSON data file if it's still there, otherwise {}
function oldFile(name) {
  return fs.existsSync(name) ? JSON.parse(fs.readFileSync(name, "utf8")) : {};
}

// Until there are accounts, everything belongs to one local user: the first one.
// The login step replaces this with whoever is logged in.
let localId = null;

export async function localUserId() {
  if (localId) return localId;

  const found = await pool.query("select id from users order by id limit 1");
  if (found.rows.length) {
    localId = found.rows[0].id;
    return localId;
  }

  // First run: make the user, keeping the name and settings from the old JSON files
  const profile = oldFile("profile.json");
  const prefs = oldFile("preferences.json");
  const made = await pool.query(
    `insert into users (email, password_hash, name, photo)
     values ($1, '', $2, $3) returning id`,
    [
      (profile.email ?? "").toLowerCase(),
      profile.name || "User",
      profile.photo ?? "",
    ],
  );
  localId = made.rows[0].id;
  await pool.query(
    `insert into preferences (user_id, styles, colors, avoid_colors,
       cold_tolerance, unit, occasions, seasons, notifications)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      localId,
      prefs.styles ?? ["Casual"],
      prefs.colors ?? [],
      prefs.avoidColors ?? [],
      prefs.coldTolerance ?? 3,
      prefs.unit ?? "C",
      prefs.occasions ?? ["Casual"],
      prefs.seasons ?? [],
      profile.notifications ?? true,
    ],
  );
  console.log("Made the local user");
  return localId;
}
