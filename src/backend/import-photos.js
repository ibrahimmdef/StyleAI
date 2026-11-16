// Adds many pieces at once instead of using Add Item one by one.
//   node import-photos.js you@example.com pieces.json
// pieces.json is a list like:
//   [{ "file": "/home/me/Pictures/coat.jpg", "name": "Black Coat", "category": "Outerwear",
//      "type": "Coat", "color": "Black", "seasons": ["Winter"], "styles": ["Classic"] }]
// Every photo goes through the same background removal as Add Item.
import "dotenv/config";
import fs from "fs";
import { checkItem } from "../shared/catalog.js";
import { pool } from "./db.js";
import { cutOut } from "./replicate.js";

const [email, listFile] = process.argv.slice(2);
if (!email || !listFile) {
  console.log("Use it like: node import-photos.js you@example.com pieces.json");
  process.exit(1);
}

const pieces = JSON.parse(fs.readFileSync(listFile, "utf8"));
fs.mkdirSync("uploads", { recursive: true });

const found = await pool.query("select id from users where email = $1", [
  email.toLowerCase(),
]);
if (!found.rows.length) {
  console.log(`No account with ${email}. Sign up in the app first.`);
  process.exit(1);
}
const userId = found.rows[0].id;

// Check the whole list first, so a typo doesn't leave it half done
for (const piece of pieces) {
  const problem = checkItem(piece) || (!piece.name && "Name is missing.");
  if (problem) {
    console.log(`${piece.file}: ${problem}`);
    process.exit(1);
  }
  if (!fs.existsSync(piece.file)) {
    console.log(`${piece.file}: file not found`);
    process.exit(1);
  }
}

let added = 0;
for (const [i, piece] of pieces.entries()) {
  try {
    const image = await cutOut(fs.readFileSync(piece.file), userId);
    await pool.query(
      `insert into items (user_id, name, category, type, color, seasons, styles, image)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        piece.name,
        piece.category,
        piece.type,
        piece.color,
        piece.seasons,
        piece.styles,
        image,
      ],
    );
    added++;
    console.log(`${i + 1}/${pieces.length} ${piece.name}`);
  } catch (err) {
    console.log(
      `${i + 1}/${pieces.length} ${piece.name} FAILED: ${err.message}`,
    );
  }
}

console.log(`Added ${added} of ${pieces.length} pieces.`);
await pool.end();
