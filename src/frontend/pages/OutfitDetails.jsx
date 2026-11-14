import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Bookmark,
  ChevronRight,
  Heart,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/Buttons";
import OutfitCanvas from "../components/OutfitCanvas";
import { SEASONS, STYLES } from "../../shared/catalog";
import { fitsSeason } from "../../shared/rules";
import {
  OPTIONAL_SLOTS,
  SLOTS,
  SLOT_LABELS,
  STORAGE,
  defaultOutfitName,
  getSlot,
  outfitKey,
  writeStorage,
} from "../data";

const API = "http://localhost:5000/api/outfits";

const EMPTY = {
  top: null,
  bottom: null,
  outerwear: null,
  shoes: null,
  bag: null,
  accessory: null,
};

const card = "rounded-2xl border border-line bg-white p-4 sm:p-6";
const tag = "rounded-full bg-selected px-3 py-1 text-xs text-muted";

// Styles every piece shares, and seasons every piece fits
function outfitTags(pieces) {
  if (pieces.length === 0) return [];
  const styles = STYLES.filter((style) =>
    pieces.every((item) => item.styles?.includes(style)),
  );
  const seasons = SEASONS.filter((season) =>
    pieces.every((item) => fitsSeason(item, season)),
  );
  // Fits every season? Then the season says nothing, leave it out.
  return seasons.length === SEASONS.length ? styles : [...styles, ...seasons];
}

// One page, three jobs: /outfits/new builds an outfit, /outfits/:id shows one,
// and the Edit button turns the shown one into the builder.
export default function OutfitDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState([]);
  const [outfit, setOutfit] = useState(null);
  const [slots, setSlots] = useState(EMPTY);
  const [name, setName] = useState(defaultOutfitName());
  const [isEditing, setIsEditing] = useState(!id);
  const [activeSlot, setActiveSlot] = useState(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/Items")
      .then((res) => res.json())
      .then((data) =>
        setWardrobe(data.map((item) => ({ ...item, slot: getSlot(item) }))),
      )
      .catch(() => setError("Could not load your wardrobe."));
  }, []);

  // Opening a saved outfit: fill the page with it
  useEffect(() => {
    if (!id) return;
    fetch(API)
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((entry) => entry.id === Number(id));
        if (!found) {
          setError("Outfit not found.");
          return;
        }
        setOutfit(found);
        setSlots({ ...EMPTY, ...found.slots });
        setName(found.name || "Untitled outfit");
      })
      .catch(() => setError("Could not load the outfit."));
  }, [id]);

  // Item for each place, null when it's empty or the piece was deleted
  const items = {};
  for (const slot of SLOTS) {
    items[slot] = wardrobe.find((item) => item.id === slots[slot]) ?? null;
  }
  const pieces = SLOTS.map((slot) => items[slot]).filter(Boolean);
  const options = wardrobe.filter((item) => item.slot === activeSlot);

  // While editing every place is listed, empty ones too
  const rows = isEditing ? SLOTS : SLOTS.filter((slot) => items[slot]);

  // Tapping the piece that's already in clears the place
  function pick(itemId) {
    setSlots({
      ...slots,
      [activeSlot]: slots[activeSlot] === itemId ? null : itemId,
    });
    setActiveSlot(null);
    setError("");
  }

  function cancel() {
    if (!outfit) return navigate("/outfits");
    setSlots({ ...EMPTY, ...outfit.slots });
    setName(outfit.name || "Untitled outfit");
    setIsEditing(false);
    setActiveSlot(null);
    setError("");
  }

  async function toggleFavorite() {
    const res = await fetch(`${API}/${outfit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ favorite: !outfit.favorite }),
    });
    if (res.ok) setOutfit(await res.json());
  }

  function wear() {
    writeStorage(STORAGE.outfit, slots);
    navigate("/");
  }

  async function save() {
    const missing = SLOTS.filter(
      (slot) => !OPTIONAL_SLOTS.includes(slot) && !slots[slot],
    );
    if (missing.length) {
      setError(
        `Pick ${missing.map((slot) => SLOT_LABELS[slot]).join(", ")} first.`,
      );
      return;
    }
    if (!name.trim()) {
      setError("Give your outfit a name.");
      return;
    }

    setIsSaving(true);
    try {
      // New outfit: POST. Saved one: PATCH only the parts that can change.
      const res = await fetch(outfit ? `${API}/${outfit.id}` : API, {
        method: outfit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: outfitKey(slots),
          name: name.trim(),
          slots,
          favorite: outfit ? undefined : false,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOutfit(data);
      setIsEditing(false);
      setError("");
      if (!outfit) navigate(`/outfits/${data.id}`, { replace: true });
    } catch (err) {
      setError(err.message || "Could not save the outfit.");
    } finally {
      setIsSaving(false);
    }
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
        {isEditing ? (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Outfit name"
            className="min-w-0 flex-1 border-b border-line text-3xl font-bold tracking-tight outline-none focus:border-brand"
          />
        ) : (
          <h1 className="truncate text-3xl font-bold tracking-tight">{name}</h1>
        )}

        {outfit && !isEditing && (
          <>
            <button
              type="button"
              onClick={toggleFavorite}
              aria-label="Favorite"
              className="rounded-full border border-line p-1.5 text-brand hover:bg-selected"
            >
              <Heart
                size={16}
                className={outfit.favorite ? "fill-current" : ""}
              />
            </button>
            <Button
              variant="secondary"
              icon={Pencil}
              onClick={() => setIsEditing(true)}
              className="ml-auto max-sm:hidden"
            >
              Edit outfit
            </Button>
          </>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {/* The outfit as a picture */}
        <section className={card}>
          {pieces.length === 0 ? (
            <p className="py-40 text-center text-sm text-muted">
              Pick pieces on the right to see your outfit here.
            </p>
          ) : (
            <OutfitCanvas items={items} />
          )}
        </section>

        <section className={`${card} flex flex-col`}>
          {activeSlot ? (
            // Choosing a piece for one place
            <>
              <button
                type="button"
                onClick={() => setActiveSlot(null)}
                className="inline-flex items-center gap-2 self-start text-lg font-semibold capitalize"
              >
                <ArrowLeft size={18} className="text-brand" />
                Choose {SLOT_LABELS[activeSlot]}
              </button>

              {options.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted">
                  No {SLOT_LABELS[activeSlot]} in your wardrobe yet.{" "}
                  <Link to="/wardrobe/new" className="font-medium text-brand">
                    Add one
                  </Link>
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {options.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => pick(item.id)}
                      className={`rounded-xl border p-2 text-left transition ${
                        slots[activeSlot] === item.id
                          ? "border-brand bg-selected"
                          : "border-line hover:border-brand/40"
                      }`}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="aspect-square w-full object-contain"
                      />
                      <p className="mt-2 truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted">{item.type}</p>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            // Tags and the list of pieces
            <>
              <div className="flex flex-wrap items-center gap-2">
                {outfitTags(pieces).map((name) => (
                  <span key={name} className={tag}>
                    {name}
                  </span>
                ))}
                <span className={`${tag} ml-auto`}>{pieces.length} pieces</span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {rows.map((slot) => (
                  <PieceRow
                    key={slot}
                    slot={slot}
                    item={items[slot]}
                    isEditing={isEditing}
                    onPick={() => setActiveSlot(slot)}
                  />
                ))}
              </div>

              {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

              {/* mt-auto keeps the buttons at the bottom of the card */}
              <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                {isEditing ? (
                  <>
                    <Button icon={Bookmark} onClick={save} disabled={isSaving}>
                      {isSaving ? "Saving…" : "Save outfit"}
                    </Button>
                    <Button variant="secondary" onClick={cancel}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <Button icon={Sparkles} onClick={wear}>
                      Wear this outfit
                    </Button>
                    <Button
                      variant="secondary"
                      icon={Pencil}
                      onClick={() => setIsEditing(true)}
                    >
                      Edit outfit
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

// One place in the outfit. Viewing: links to the piece. Editing: opens the picker.
function PieceRow({ slot, item, isEditing, onPick }) {
  const row =
    "flex items-center gap-3 rounded-xl border p-2 text-left transition hover:border-brand/40";

  if (!item) {
    return (
      <button
        type="button"
        onClick={onPick}
        className={`${row} border-dashed border-line text-sm text-brand`}
      >
        <span className="grid size-12 place-items-center rounded-lg bg-selected">
          <Plus size={18} />
        </span>
        Add {SLOT_LABELS[slot]}
        {!OPTIONAL_SLOTS.includes(slot) && (
          <span className="text-xs text-muted">(needed)</span>
        )}
      </button>
    );
  }

  const content = (
    <>
      <img
        src={item.image}
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
    </>
  );

  return isEditing ? (
    <button type="button" onClick={onPick} className={`${row} border-line`}>
      {content}
    </button>
  ) : (
    <Link to={`/wardrobe/${item.id}/edit`} className={`${row} border-line`}>
      {content}
    </Link>
  );
}
