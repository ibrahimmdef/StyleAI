import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EllipsisVertical, Heart, Shirt, Trash2 } from "lucide-react";
import {
  SLOTS,
  STORAGE,
  readFavorites,
  readSaved,
  writeStorage,
} from "../data";

const TABS = ["All outfits", "Favorites"];

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const menuItem = "flex w-full items-center gap-2 px-3 py-2 text-left";

export default function Outfits() {
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState([]);
  const [saved, setSaved] = useState(readSaved);
  const [favorites, setFavorites] = useState(readFavorites);
  const [tab, setTab] = useState("All outfits");

  // Outfits only store item ids, the photos come from the wardrobe
  useEffect(() => {
    fetch("http://localhost:5000/api/Items")
      .then((res) => res.json())
      .then((data) => setWardrobe(data));
  }, []);

  // Newest first. The Favorites tab only shows favorites.
  const shown = saved
    .filter((entry) => tab === "All outfits" || favorites.includes(entry.key))
    .reverse();

  function toggleFavorite(key) {
    const next = favorites.includes(key)
      ? favorites.filter((k) => k !== key)
      : [...favorites, key];
    writeStorage(STORAGE.favorites, next);
    setFavorites(next);
  }

  function deleteOutfit(key) {
    if (!confirm("Delete this outfit?")) return;

    const nextSaved = saved.filter((entry) => entry.key !== key);
    writeStorage(STORAGE.saved, nextSaved);
    setSaved(nextSaved);

    // A deleted outfit can't stay a favorite
    const nextFavorites = favorites.filter((k) => k !== key);
    writeStorage(STORAGE.favorites, nextFavorites);
    setFavorites(nextFavorites);
  }

  // Make it today's outfit and go to Home
  function wear(entry) {
    writeStorage(STORAGE.outfit, entry.slots);
    navigate("/");
  }

  return (
    <div className="min-h-[70vh] rounded-2xl border border-line bg-white p-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">My Outfits</h1>
        <p className="mt-1 text-sm text-muted">
          Your saved and favorite looks.
        </p>
      </header>

      <div className="mt-6 flex gap-2">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setTab(name)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              tab === name
                ? "bg-brand text-white"
                : "text-muted hover:bg-selected"
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <Shirt size={36} strokeWidth={1.3} className="text-brand" />
          <p className="mt-4 text-sm text-muted">
            {tab === "Favorites"
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
              key={entry.key}
              entry={entry}
              wardrobe={wardrobe}
              isFavorite={favorites.includes(entry.key)}
              onFavorite={() => toggleFavorite(entry.key)}
              onWear={() => wear(entry)}
              onDelete={() => deleteOutfit(entry.key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// One saved outfit: a small picture of its pieces, the date and a menu
function OutfitCard({
  entry,
  wardrobe,
  isFavorite,
  onFavorite,
  onWear,
  onDelete,
}) {
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="flex h-48 gap-2 rounded-xl bg-canvas/60 p-3">
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
      </div>

      <div className="mt-3 flex items-center gap-1">
        <div className="mr-auto">
          <p className="text-sm font-medium">
            {entry.savedAt
              ? `Saved ${dateFormat.format(new Date(entry.savedAt))}`
              : "Saved outfit"}
          </p>
          <p className="text-xs text-muted">{pieces.length} pieces</p>
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
