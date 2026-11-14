import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  EllipsisVertical,
  Heart,
  Pencil,
  Plus,
  Shirt,
  Trash2,
} from "lucide-react";
import { Button } from "../components/Buttons";
import { SLOTS, STORAGE, writeStorage } from "../data";
import { SEASONS } from "../../shared/catalog";
import { fitsSeason } from "../../shared/rules";

const API = "http://localhost:5000/api/outfits";

const TABS = ["All outfits", "Favorites"];
const SEASON_FILTERS = ["All", ...SEASONS];

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const menuItem = "flex w-full items-center gap-2 px-3 py-2 text-left";

// Same pill for both filter rows, filled when picked
function pill(active) {
  return `rounded-full px-4 py-2 text-sm transition ${
    active ? "bg-brand text-white" : "text-muted hover:bg-selected"
  }`;
}

// An outfit fits a season when every piece in it does
function fitsOutfit(entry, wardrobe, season) {
  return SLOTS.map((slot) =>
    wardrobe.find((item) => item.id === entry.slots[slot]),
  )
    .filter(Boolean)
    .every((item) => fitsSeason(item, season));
}

export default function Outfits() {
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState([]);
  const [saved, setSaved] = useState([]);
  const [tab, setTab] = useState("All outfits");
  const [season, setSeason] = useState("All");

  // Outfits only store item ids, the photos come from the wardrobe
  useEffect(() => {
    fetch("http://localhost:5000/api/Items")
      .then((res) => res.json())
      .then((data) => setWardrobe(data));
  }, []);

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => setSaved(data));
  }, []);

  // Newest first. Both filters apply together.
  const shown = saved
    .filter((entry) => tab === "All outfits" || entry.favorite)
    .filter((entry) => season === "All" || fitsOutfit(entry, wardrobe, season))
    .reverse();

  // Favorite and rename both change one outfit, so they share this
  async function updateOutfit(id, changes) {
    const res = await fetch(`${API}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    if (!res.ok) {
      alert("Could not update the outfit.");
      return;
    }
    const updated = await res.json();
    setSaved(saved.map((entry) => (entry.id === id ? updated : entry)));
  }

  async function deleteOutfit(id) {
    if (!confirm("Delete this outfit?")) return;

    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Could not delete the outfit.");
      return;
    }
    setSaved(saved.filter((entry) => entry.id !== id));
  }

  // Make it today's outfit and go to Home
  function wear(entry) {
    writeStorage(STORAGE.outfit, entry.slots);
    navigate("/");
  }

  return (
    <div className="min-h-[70vh] rounded-2xl border border-line bg-white p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Outfits</h1>
          <p className="mt-1 text-sm text-muted">
            Your saved and favorite looks.
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate("/outfits/new")}>
          Build your outfit
        </Button>
      </header>

      {/* Filters: stacked on small screens, one row on desktop (tabs left, seasons right) */}
      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setTab(name)}
              className={pill(tab === name)}
            >
              {name}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {SEASON_FILTERS.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setSeason(name)}
              className={pill(season === name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Shirt size={36} strokeWidth={1.3} className="text-brand" />
          <p className="mt-4 text-sm text-muted">
            {season !== "All"
              ? `No ${season.toLowerCase()} outfits here yet.`
              : tab === "Favorites"
                ? "No favorites yet. Tap the heart on an outfit you love."
                : "No saved outfits yet."}
          </p>
          <Link to="/" className="mt-3 text-sm font-medium text-brand">
            Make one on Home
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shown.map((entry) => (
            <OutfitCard
              key={entry.id}
              entry={entry}
              wardrobe={wardrobe}
              isFavorite={entry.favorite}
              onFavorite={() =>
                updateOutfit(entry.id, { favorite: !entry.favorite })
              }
              onWear={() => wear(entry)}
              onRename={(name) => updateOutfit(entry.id, { name })}
              onDelete={() => deleteOutfit(entry.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// One saved outfit: a small picture of its pieces, its name and a menu
function OutfitCard({
  entry,
  wardrobe,
  isFavorite,
  onFavorite,
  onWear,
  onRename,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);

  // Older outfits were saved before names existed
  const name = entry.name || "Untitled outfit";

  function finishRename(value) {
    setRenaming(false);
    // Empty name? Keep the old one.
    if (value.trim() && value.trim() !== name) onRename(value.trim());
  }

  // Find each piece in the wardrobe. Deleted pieces just drop out.
  const pieces = SLOTS.map((slot) =>
    wardrobe.find((item) => item.id === entry.slots[slot]),
  ).filter(Boolean);

  // Same idea as on Home: two pieces per column
  const columns = [];
  for (let i = 0; i < pieces.length; i += 2) {
    columns.push(pieces.slice(i, i + 2));
  }

  return (
    <article
      onMouseLeave={() => setMenuOpen(false)}
      className="relative rounded-2xl border border-line bg-white p-3"
    >
      {/* Tapping the picture opens the outfit */}
      <Link
        to={`/outfits/${entry.id}`}
        className="flex h-48 gap-2 rounded-xl bg-canvas/60 p-3 transition hover:bg-canvas"
      >
        {columns.map((column) => (
          <div
            key={column[0].id}
            className="flex min-w-0 flex-1 flex-col gap-2"
          >
            {column.map((item) => (
              <img
                key={item.id}
                src={item.image}
                alt={item.name}
                className="min-h-0 w-full flex-1 object-contain"
              />
            ))}
          </div>
        ))}
      </Link>

      <div className="mt-3 flex items-center gap-1">
        <div className="mr-auto min-w-0">
          {renaming ? (
            <input
              autoFocus
              defaultValue={name}
              onBlur={(e) => finishRename(e.target.value)}
              // Enter saves, Escape puts the old name back
              onKeyDown={(e) => {
                if (e.key === "Enter") e.target.blur();
                if (e.key === "Escape") {
                  e.target.value = name;
                  e.target.blur();
                }
              }}
              className="w-full rounded-md border border-brand/40 px-1.5 py-0.5 text-sm font-medium outline-none"
            />
          ) : (
            <p className="truncate text-sm font-medium">{name}</p>
          )}
          <p className="text-xs text-muted">
            {entry.savedAt &&
              `${dateFormat.format(new Date(entry.savedAt))} · `}
            {pieces.length} pieces
          </p>
        </div>
        <button
          type="button"
          onClick={onFavorite}
          aria-label="Favorite"
          className="rounded-full p-1.5 text-brand hover:bg-selected"
        >
          <Heart size={16} className={isFavorite ? "fill-current" : ""} />
        </button>
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Outfit options"
          className="rounded-full p-1.5 text-muted hover:bg-selected hover:text-brand"
        >
          <EllipsisVertical size={16} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-3 bottom-14 z-10 w-36 rounded-xl border border-line bg-white py-1 text-sm shadow-lg">
          <button
            type="button"
            onClick={onWear}
            className={`${menuItem} hover:bg-selected`}
          >
            <Shirt size={14} /> Wear today
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setRenaming(true);
            }}
            className={`${menuItem} hover:bg-selected`}
          >
            <Pencil size={14} /> Rename
          </button>
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onDelete();
            }}
            className={`${menuItem} text-red-600 hover:bg-red-50`}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </article>
  );
}
