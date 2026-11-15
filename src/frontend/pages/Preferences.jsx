import { useEffect, useState } from "react";
import {
  Briefcase,
  Check,
  Coffee,
  Crown,
  Dumbbell,
  Feather,
  Hourglass,
  Shirt,
  Zap,
} from "lucide-react";
import { Button } from "../components/Buttons";
import { COLORS, OCCASIONS, SEASONS } from "../../shared/catalog";

const API = "http://localhost:5000/api/preferences";

// Icon and a short line for each style card
const STYLE_CARDS = [
  {
    name: "Casual",
    icon: Shirt,
    text: "Comfortable and effortless everyday looks.",
  },
  {
    name: "Smart casual",
    icon: Coffee,
    text: "Polished but relaxed, good for most days.",
  },
  {
    name: "Formal",
    icon: Briefcase,
    text: "Suits, blazers and sharp office looks.",
  },
  {
    name: "Minimal",
    icon: Feather,
    text: "Clean, timeless pieces with a refined look.",
  },
  {
    name: "Classic",
    icon: Crown,
    text: "Timeless basics that never go out of style.",
  },

  {
    name: "Sporty",
    icon: Dumbbell,
    text: "Athletic and comfortable, made to move.",
  },
  {
    name: "Streetwear",
    icon: Zap,
    text: "Bold, urban looks with sneakers and hoodies.",
  },

  {
    name: "Vintage",
    icon: Hourglass,
    text: "Retro pieces with a story behind them.",
  },
];

const card = "rounded-2xl border border-line bg-white p-5";
const box = "rounded-xl bg-canvas/60 p-4";

// Adds the value if it's missing, takes it out if it's there
function toggle(list, value) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

// Small rounded button used for occasions and seasons
function chip(active) {
  return `rounded-xl border px-4 py-2 text-sm transition ${
    active
      ? "border-brand bg-white text-brand"
      : "border-transparent bg-selected text-muted hover:text-brand"
  }`;
}

export default function Preferences() {
  const [styles, setStyles] = useState([]);
  const [colors, setColors] = useState([]);
  const [avoidColors, setAvoidColors] = useState([]);
  const [coldTolerance, setColdTolerance] = useState(3);
  const [unit, setUnit] = useState("C");
  const [occasions, setOccasions] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => {
        setStyles(data.styles);
        setColors(data.colors);
        setAvoidColors(data.avoidColors);
        setColdTolerance(data.coldTolerance);
        setUnit(data.unit);
        setOccasions(data.occasions);
        setSeasons(data.seasons);
      })
      .catch(() => setError("Could not load your preferences."));
  }, []);

  // A color can't be liked and avoided at the same time
  function pickColor(color) {
    setColors(toggle(colors, color));
    setAvoidColors(avoidColors.filter((item) => item !== color));
  }

  function avoidColor(color) {
    setAvoidColors(toggle(avoidColors, color));
    setColors(colors.filter((item) => item !== color));
  }

  async function save() {
    setMessage("");
    if (styles.length === 0) {
      setError("Pick at least one style.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(API, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          styles,
          colors,
          avoidColors,
          coldTolerance,
          unit,
          occasions,
          seasons,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setError("");
      setMessage("Preferences saved.");
    } catch (err) {
      setError(err.message || "Could not save your preferences.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight">
        Make it feel like you
      </h1>
      <p className="mt-1 text-sm text-muted">
        Tell us about your style and preferences to get personalized outfit
        recommendations.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        <div className="flex flex-col gap-5 lg:col-span-3">
          {/* Style cards */}
          <section className={card}>
            <h2 className="font-semibold">Preferred Styles</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {STYLE_CARDS.map((style) => {
                const active = styles.includes(style.name);
                const Icon = style.icon;
                return (
                  <button
                    key={style.name}
                    type="button"
                    onClick={() => setStyles(toggle(styles, style.name))}
                    className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-brand bg-selected/40"
                        : "border-line hover:border-brand/40"
                    }`}
                  >
                    <span
                      className={`grid size-12 shrink-0 place-items-center rounded-xl transition ${
                        active
                          ? "bg-brand text-white"
                          : "bg-selected text-brand"
                      }`}
                    >
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-sm font-medium ${active ? "text-brand" : ""}`}
                      >
                        {style.name}
                      </span>
                      <span className="mt-0.5 block text-xs leading-4 text-muted">
                        {style.text}
                      </span>
                    </span>
                    {/* Works like a checkbox: empty ring, filled when picked */}
                    <span
                      className={`grid size-5 shrink-0 place-items-center rounded-full border transition ${
                        active
                          ? "border-brand bg-brand text-white"
                          : "border-line"
                      }`}
                    >
                      {active && <Check size={12} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Colors */}
          <section className={card}>
            <h2 className="font-semibold">Preferred Colors</h2>
            <Swatches selected={colors} onToggle={pickColor} />

            <h2 className="mt-6 font-semibold">
              Avoided Colors{" "}
              <span className="font-normal text-muted">(optional)</span>
            </h2>
            <Swatches selected={avoidColors} onToggle={avoidColor} />
          </section>
        </div>

        {/* Weather and comfort */}
        <section className={`${card} flex flex-col gap-4 lg:col-span-2`}>
          <h2 className="font-semibold">Weather & Comfort</h2>

          <div className={box}>
            <h3 className="text-sm font-medium">Cold Tolerance</h3>
            <input
              type="range"
              min="1"
              max="5"
              value={coldTolerance}
              onChange={(e) => setColdTolerance(Number(e.target.value))}
              className="mt-3 w-full accent-brand"
            />
            <div className="mt-1 flex justify-between text-xs text-muted">
              <span>Prefer lighter layers</span>
              <span>Prefer warmer layers</span>
            </div>
          </div>

          <div className={box}>
            <h3 className="text-sm font-medium">Temperature Unit</h3>
            <div className="mt-3 inline-flex rounded-xl bg-white p-1">
              {["C", "F"].map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setUnit(name)}
                  className={`rounded-lg px-8 py-2 text-sm transition ${
                    unit === name ? "bg-brand text-white" : "text-muted"
                  }`}
                >
                  °{name}
                </button>
              ))}
            </div>
          </div>

          <div className={box}>
            <h3 className="text-sm font-medium">Occasions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {OCCASIONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setOccasions(toggle(occasions, name))}
                  className={chip(occasions.includes(name))}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className={box}>
            <h3 className="text-sm font-medium">Seasons</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {SEASONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setSeasons(toggle(seasons, name))}
                  className={chip(seasons.includes(name))}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Save */}
      <div className="mt-5 flex items-center justify-end gap-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-brand">{message}</p>}
        <Button onClick={save} disabled={isSaving} className="px-10">
          {isSaving ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </div>
  );
}

// A row of color dots. The picked ones get a ring and a check.
function Swatches({ selected, onToggle }) {
  return (
    <div className="mt-3 flex flex-wrap gap-3">
      {Object.entries(COLORS).map(([name, hex]) => (
        <button
          key={name}
          type="button"
          title={name}
          aria-label={name}
          onClick={() => onToggle(name)}
          style={{ backgroundColor: hex }}
          className={`grid size-10 place-items-center rounded-full border border-black/10 transition ${
            selected.includes(name) ? "ring-2 ring-brand ring-offset-2" : ""
          }`}
        >
          {selected.includes(name) && (
            <Check
              size={16}
              className={name === "White" ? "text-ink" : "text-white"}
            />
          )}
        </button>
      ))}
    </div>
  );
}
