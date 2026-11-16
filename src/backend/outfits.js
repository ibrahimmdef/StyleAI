import { Router } from "express";
import { OCCASIONS } from "../shared/catalog.js";
import { localUserId, pool } from "./db.js";

const router = Router();

// Saved outfit as the frontend sees it: { id, key, name, occasion, slots, favorite, savedAt }
// slots is { top: itemId, bottom: itemId, ... }, key is that same outfit as text
const COLUMNS = `id, key, name, occasion, slots, favorite, saved_at as "savedAt"`;

// Postgres error code for "this would break a unique rule"
const ALREADY_THERE = "23505";

router.get("/outfits", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select ${COLUMNS} from outfits where user_id = $1 order by id`,
      [await localUserId()],
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load the outfits" });
  }
});

router.post("/outfits", async (req, res) => {
  const { key, name, occasion, slots, favorite } = req.body;

  if (typeof key !== "string" || !slots || typeof slots !== "object") {
    return res.status(400).json({ message: "Outfit is missing" });
  }
  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }
  if (occasion !== undefined && !OCCASIONS.includes(occasion)) {
    return res.status(400).json({ message: "Unknown occasion" });
  }

  try {
    const userId = await localUserId();

    // Same outfit saved twice? Just send back the one we already have.
    const existing = await pool.query(
      `select ${COLUMNS} from outfits where user_id = $1 and key = $2`,
      [userId, key],
    );
    if (existing.rows.length) return res.json(existing.rows[0]);

    const { rows } = await pool.query(
      `insert into outfits (user_id, key, name, occasion, slots, favorite)
       values ($1, $2, $3, $4, $5, $6) returning ${COLUMNS}`,
      [
        userId,
        key,
        name.trim(),
        occasion ?? "Casual",
        slots,
        Boolean(favorite),
      ],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save the outfit" });
  }
});

// Name, occasion, favorite and the pieces can change. Send only what changed.
router.patch("/outfits/:id", async (req, res) => {
  const { name, occasion, favorite, slots, key } = req.body;

  if (slots !== undefined) {
    if (typeof key !== "string" || !slots || typeof slots !== "object") {
      return res.status(400).json({ message: "Outfit is missing" });
    }
  }
  if (name !== undefined && (typeof name !== "string" || !name.trim())) {
    return res.status(400).json({ message: "Name can't be empty" });
  }
  if (occasion !== undefined && !OCCASIONS.includes(occasion)) {
    return res.status(400).json({ message: "Unknown occasion" });
  }

  try {
    const userId = await localUserId();
    const found = await pool.query(
      `select ${COLUMNS} from outfits where id = $1 and user_id = $2`,
      [Number(req.params.id), userId],
    );
    if (found.rows.length === 0) {
      return res.status(404).json({ message: "Outfit not found" });
    }

    // Start from what's saved and change only what was sent
    const outfit = found.rows[0];
    if (slots !== undefined) {
      outfit.slots = slots;
      outfit.key = key;
    }
    if (name !== undefined) outfit.name = name.trim();
    if (occasion !== undefined) outfit.occasion = occasion;
    if (favorite !== undefined) outfit.favorite = Boolean(favorite);

    const { rows } = await pool.query(
      `update outfits set key = $1, name = $2, occasion = $3, slots = $4, favorite = $5
       where id = $6 and user_id = $7 returning ${COLUMNS}`,
      [
        outfit.key,
        outfit.name,
        outfit.occasion,
        outfit.slots,
        outfit.favorite,
        outfit.id,
        userId,
      ],
    );
    res.json(rows[0]);
  } catch (err) {
    // Don't end up with the same outfit saved twice
    if (err.code === ALREADY_THERE) {
      return res.status(400).json({ message: "This outfit is already saved" });
    }
    console.error(err);
    res.status(500).json({ message: "Could not update the outfit" });
  }
});

// Deletes every saved outfit (used when the wardrobe is reset)
router.delete("/outfits", async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "delete from outfits where user_id = $1",
      [await localUserId()],
    );
    res.json({ message: `${rowCount} outfits deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete the outfits" });
  }
});

router.delete("/outfits/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      "delete from outfits where id = $1 and user_id = $2",
      [Number(req.params.id), await localUserId()],
    );
    if (rowCount === 0) {
      return res.status(404).json({ message: "Outfit not found" });
    }
    res.json({ message: "Outfit deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete the outfit" });
  }
});

export default router;
