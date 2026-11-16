import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Heart, Pencil, Sparkles } from "lucide-react";
import { Button } from "../components/Buttons";
import OutfitCanvas from "../components/OutfitCanvas";
import FrostedCard from "../components/FrostedCard";
import { SLOTS, STORAGE, getSlot, outfitTags, writeStorage } from "../data";
import { API_URL, fileUrl } from "../api";

const API = `${API_URL}/api/outfits`;

const card = "rounded-2xl border border-line bg-surface p-4 sm:p-6";
const tag = "rounded-full bg-selected px-3 py-1 text-xs text-muted";

// A short line under the tags, made from the pieces
function describe(pieces) {
  if (pieces.length === 0) return "This outfit has no pieces left.";
  // Most used colors first
  const count = (color) => pieces.filter((item) => item.color === color).length;
  const colors = [...new Set(pieces.map((item) => item.color))].sort(
    (a, b) => count(b) - count(a),
  );
  const main = colors.slice(0, 2).join(" and ").toLowerCase();
  return `${pieces.length} pieces from your wardrobe, mostly ${main}. Tap a piece to see or edit it.`;
}

// One saved outfit: the picture, its pieces, wear it or edit it
export default function OutfitDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState([]);
  const [outfit, setOutfit] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/Items`)
      .then((res) => res.json())
      .then((data) =>
        setWardrobe(data.map((item) => ({ ...item, slot: getSlot(item) }))),
      )
      .catch(() => setError("Could not load your wardrobe."));
  }, []);

  useEffect(() => {
    fetch(API)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((entry) => entry.id === Number(id));
        if (found) setOutfit(found);
        else setError("Outfit not found.");
      })
      .catch(() => setError("Could not load the outfit."));
  }, [id]);

  if (!outfit) {
    return <p className="py-24 text-center text-sm text-muted">{error}</p>;
  }

  // Item for each place, null when it's empty or the piece was deleted
  const items = {};
  for (const slot of SLOTS) {
    items[slot] =
      wardrobe.find((item) => item.id === outfit.slots[slot]) ?? null;
  }
  const pieces = SLOTS.map((slot) => items[slot]).filter(Boolean);

  async function toggleFavorite() {
    const res = await fetch(`${API}/${outfit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: !outfit.favorite }),
    });
    if (res.ok) setOutfit(await res.json());
  }

  function wear() {
    writeStorage(STORAGE.outfit, outfit.slots);
    navigate("/");
  }

  function edit() {
    navigate(`/outfits/${outfit.id}/edit`);
  }

  return (
    <div>
      {/* Header */}
      <Link
        to="/outfits"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand"
      >
        <ArrowLeft size={16} /> Back to outfits
      </Link>

      <div className="mt-3 flex items-center gap-3">
        <h1 className="truncate text-3xl font-bold tracking-tight">
          {outfit.name || "Untitled outfit"}
        </h1>
        <button
          type="button"
          onClick={toggleFavorite}
          aria-label="Favorite"
          className="rounded-full border border-line p-1.5 text-brand hover:bg-selected"
        >
          <Heart size={16} className={outfit.favorite ? "fill-current" : ""} />
        </button>
        <Button
          variant="secondary"
          icon={Pencil}
          onClick={edit}
          className="ml-auto max-sm:hidden"
        >
          Edit outfit
        </Button>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <FrostedCard>
          <OutfitCanvas items={items} />
        </FrostedCard>

        <section className={`${card} flex flex-col`}>
          <div className="flex flex-wrap items-center gap-2">
            {outfitTags(pieces, outfit.occasion).map((name) => (
              <span key={name} className={tag}>
                {name}
              </span>
            ))}
            <span className={`${tag} ml-auto`}>{pieces.length} pieces</span>
          </div>

          <p className="mt-4 text-sm leading-6 text-muted">
            {describe(pieces)}
          </p>

          {/* flex-1 + auto-rows-fr: the rows share the card's height, no empty gap */}
          <div className="mt-5 grid flex-1 auto-rows-fr gap-3 sm:grid-cols-2">
            {pieces.map((item) => (
              <Link
                key={item.id}
                to={`/wardrobe/${item.id}/edit`}
                className="flex items-center gap-3 rounded-xl border border-line p-2 transition hover:border-brand/40"
              >
                <img
                  src={fileUrl(item.image)}
                  alt={item.name}
                  className="size-12 rounded-lg bg-canvas object-contain p-1"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="truncate text-xs text-muted">
                    {item.category} · {item.color}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-muted" />
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-6">
            <Button icon={Sparkles} onClick={wear}>
              Wear this outfit
            </Button>
            <Button variant="secondary" icon={Pencil} onClick={edit}>
              Edit outfit
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
