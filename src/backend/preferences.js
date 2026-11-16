import { Router } from "express";
import { COLORS, OCCASIONS, SEASONS, STYLES } from "../shared/catalog.js";
import { pool } from "./db.js";

const router = Router();

// Database names on the left, the names the frontend uses on the right
const COLUMNS = `styles, colors, avoid_colors as "avoidColors",
  cold_tolerance as "coldTolerance", unit, occasions, seasons`;

// Every value in the list has to be one we know
function allIn(list, allowed) {
  return Array.isArray(list) && list.every((value) => allowed.includes(value));
}

router.get("/preferences", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `select ${COLUMNS} from preferences where user_id = $1`,
      [req.userId],
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load preferences" });
  }
});

router.put("/preferences", async (req, res) => {
  const {
    styles,
    colors,
    avoidColors,
    coldTolerance,
    unit,
    occasions,
    seasons,
  } = req.body;
  const colorNames = Object.keys(COLORS);

  if (!allIn(styles, STYLES) || styles.length === 0) {
    return res.status(400).json({ message: "Pick at least one style" });
  }
  if (!allIn(colors, colorNames) || !allIn(avoidColors, colorNames)) {
    return res.status(400).json({ message: "Unknown color" });
  }
  if (![1, 2, 3, 4, 5].includes(coldTolerance)) {
    return res.status(400).json({ message: "Cold tolerance is 1 to 5" });
  }
  if (unit !== "C" && unit !== "F") {
    return res.status(400).json({ message: "Unit is C or F" });
  }
  if (!allIn(occasions, OCCASIONS) || !allIn(seasons, SEASONS)) {
    return res.status(400).json({ message: "Unknown occasion or season" });
  }

  try {
    const { rows } = await pool.query(
      `update preferences set styles = $1, colors = $2, avoid_colors = $3,
         cold_tolerance = $4, unit = $5, occasions = $6, seasons = $7
       where user_id = $8 returning ${COLUMNS}`,
      [
        styles,
        colors,
        avoidColors,
        coldTolerance,
        unit,
        occasions,
        seasons,
        req.userId,
      ],
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save preferences" });
  }
});

export default router;
