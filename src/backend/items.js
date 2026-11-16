import { Router } from "express";
import fs from "fs";
import path from "path";
import { checkItem } from "../shared/catalog.js";
import { localUserId, pool } from "./db.js";

const router = Router();

// What the frontend gets for an item
const COLUMNS = "id, name, category, type, color, seasons, styles, image";

// Removes a photo from uploads. basename keeps only the file name,
// so a url like "../server.js" can't delete anything outside uploads.
function deletePhoto(imageUrl) {
  if (!imageUrl) return;
  const file = path.join("uploads", path.basename(imageUrl));
  fs.rm(file, { force: true }, (err) => {
    if (err) console.error("PHOTO DELETE ERROR:", err);
  });
}

// Deletes photos no item uses, e.g. someone uploaded a photo and hit Cancel.
// Only files older than an hour, so a photo that's being added right now is safe.
export async function cleanUploads() {
  if (!fs.existsSync("uploads")) return;

  try {
    // Every user's photos count, not only the local one
    const { rows } = await pool.query("select image from items");
    const used = rows.map((row) => path.basename(row.image));
    const hourAgo = Date.now() - 60 * 60 * 1000;

    for (const name of fs.readdirSync("uploads")) {
      const file = path.join("uploads", name);
      // Profile photos aren't items, leave them alone
      if (name.startsWith("avatar-")) continue;
      if (used.includes(name) || fs.statSync(file).mtimeMs > hourAgo) continue;
      fs.rmSync(file, { force: true });
      console.log("Removed unused photo:", name);
    }
  } catch (err) {
    console.error("UPLOAD CLEANUP ERROR:", err.message);
  }
}

router.get("/Items", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select ${COLUMNS} from items where user_id = $1 order by id`,
      [await localUserId()],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load the wardrobe" });
  }
});

router.get("/Items/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select ${COLUMNS} from items where id = $1 and user_id = $2`,
      [Number(req.params.id), await localUserId()],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load the item" });
  }
});

router.put("/Items/:id", async (req, res) => {
  const { name, category, type, color, seasons, styles, image } = req.body;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }
  const problem = checkItem(req.body);
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  try {
    const userId = await localUserId();
    const old = await pool.query(
      "select image from items where id = $1 and user_id = $2",
      [Number(req.params.id), userId],
    );
    if (old.rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }

    const { rows } = await pool.query(
      `update items set name = $1, category = $2, type = $3, color = $4,
         seasons = $5, styles = $6, image = $7
       where id = $8 and user_id = $9 returning ${COLUMNS}`,
      [
        name,
        category,
        type,
        color,
        seasons,
        styles,
        image,
        Number(req.params.id),
        userId,
      ],
    );

    // New photo picked: the old one isn't needed anymore
    if (old.rows[0].image !== image) deletePhoto(old.rows[0].image);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save the item" });
  }
});

router.delete("/Items/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "delete from items where id = $1 and user_id = $2 returning image",
      [Number(req.params.id), await localUserId()],
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Item not found" });
    }
    deletePhoto(rows[0].image);
    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete the item" });
  }
});

// Empties the whole wardrobe: every item and its photo. The profile photo stays.
router.delete("/Items", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "delete from items where user_id = $1 returning image",
      [await localUserId()],
    );
    for (const row of rows) deletePhoto(row.image);
    res.json({ message: `${rows.length} items deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not empty the wardrobe" });
  }
});

router.post("/Items", async (req, res) => {
  const { name, category, type, color, seasons, styles, image } = req.body;

  if (!image) {
    return res.status(400).json({ message: "Image is required" });
  }

  // Only categories and types from the catalog, so the AI can trust the data
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }
  const problem = checkItem(req.body);
  if (problem) {
    return res.status(400).json({ message: problem });
  }

  try {
    const { rows } = await pool.query(
      `insert into items (user_id, name, category, type, color, seasons, styles, image)
       values ($1, $2, $3, $4, $5, $6, $7, $8) returning ${COLUMNS}`,
      [
        await localUserId(),
        name,
        category,
        type,
        color,
        seasons,
        styles,
        image,
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save the item" });
  }
});

export default router;
