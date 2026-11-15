import { Router } from "express";
import fs from "fs";
import { COLORS, OCCASIONS, SEASONS, STYLES } from "../shared/catalog.js";

const router = Router();
const DATA_FILE = "preferences.json";

// What a new user starts with
const DEFAULTS = {
  styles: ["Casual"],
  colors: [],
  avoidColors: [],
  coldTolerance: 3,
  unit: "C",
  occasions: ["Casual"],
  seasons: [],
};

function readPreferences() {
  if (!fs.existsSync(DATA_FILE)) return DEFAULTS;
  return { ...DEFAULTS, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) };
}

// Every value in the list has to be one we know
function allIn(list, allowed) {
  return Array.isArray(list) && list.every((value) => allowed.includes(value));
}

router.get("/preferences", (req, res) => {
  res.json(readPreferences());
});

router.put("/preferences", (req, res) => {
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

  const preferences = {
    styles,
    colors,
    avoidColors,
    coldTolerance,
    unit,
    occasions,
    seasons,
  };
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(preferences, null, 2) + "\n");
    res.json(preferences);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not save preferences" });
  }
});

export default router;
