import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Info, Shirt, Trash2 } from "lucide-react";
import { Button } from "../components/Buttons";
import OutfitCanvas from "../components/OutfitCanvas";
import { OCCASIONS } from "../../shared/catalog";
import {
  OPTIONAL_SLOTS,
  SLOTS,
  SLOT_LABELS,
  defaultOutfitName,
  getSlot,
  outfitKey,
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

// Tab order from the design: top, layer, bottoms, shoes, then the small things
const TABS = ["top", "outerwear", "bottom", "shoes", "bag", "accessory"];

const card = "rounded-2xl border border-line bg-white p-4 sm:p-6";
const label = "text-sm font-medium";

// Same page for /outfits/new and /outfits/:id/edit
export default function BuildOutfit() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState([]);
  const [slots, setSlots] = useState(EMPTY);
  const [name, setName] = useState(defaultOutfitName());
  const [occasion, setOccasion] = useState("Casual");
  const [tab, setTab] = useState("top");
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

  // Editing: start from the saved outfit
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
        setSlots({ ...EMPTY, ...found.slots });
        setName(found.name || "Untitled outfit");
        setOccasion(found.occasion || "Casual");
      })
      .catch(() => setError("Could not load the outfit."));
  }, [id]);

  const items = {};
  for (const slot of SLOTS) {
    items[slot] = wardrobe.find((item) => item.id === slots[slot]) ?? null;
  }
  const options = wardrobe.filter((item) => item.slot === tab);
  const isOptional = OPTIONAL_SLOTS.includes(tab);

  function pick(itemId) {
    setSlots({ ...slots, [tab]: itemId });
    setError("");
  }

  function remove() {
    setSlots({ ...slots, [tab]: null });
  }

  // Switch on: put the first piece in. Switch off: leave the place empty.
  function toggleSlot() {
    if (slots[tab]) remove();
    else if (options.length) pick(options[0].id);
  }

  async function save() {
    const missing = SLOTS.filter(
      (slot) => !OPTIONAL_SLOTS.includes(slot) && !slots[slot],
    );
    if (missing.length) {
      setError(
        `Pick ${missing.map((slot) => SLOT_LABELS[slot]).join(", ")} first.`,
      );
      setTab(missing[0]);
      return;
    }
    if (!name.trim()) {
      setError("Give your outfit a name.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(isEdit ? `${API}/${id}` : API, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: outfitKey(slots),
          name: name.trim(),
          occasion,
          slots,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      navigate(`/outfits/${data.id}`);
    } catch (err) {
      setError(err.message || "Could not save the outfit.");
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Link
        to={isEdit ? `/outfits/${id}` : "/outfits"}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand"
      >
        <ArrowLeft size={16} /> Back
      </Link>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">
        {isEdit ? "Edit Your Outfit" : "Build Your Outfit"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        Create your perfect look by combining items from your wardrobe.
      </p>

      {/* Name and occasion */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className={label}>Outfit name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Weekend Neutrals"
            className="mt-2 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm font-medium outline-none focus:border-brand"
          />
        </label>
        <div>
          <span className={label}>Occasion</span>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {OCCASIONS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setOccasion(name)}
                className={`rounded-xl py-3 text-sm transition ${
                  occasion === name
                    ? "bg-brand text-white"
                    : "bg-selected text-muted hover:text-brand"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* Preview. The swap buttons jump to that piece's tab. */}
        <section className={card}>
          <h2 className="mb-4 font-semibold">Outfit Preview</h2>
          {Object.values(items).some(Boolean) ? (
            <OutfitCanvas items={items} onSwap={setTab} />
          ) : (
            <div className="flex h-96 flex-col items-center justify-center gap-3 text-center sm:h-120">
              <Shirt size={36} strokeWidth={1.3} className="text-brand" />
              <p className="text-sm text-muted">
                Pick pieces on the right to see your outfit here.
              </p>
            </div>
          )}
        </section>

        {/* Pieces for the selected tab */}
        <section className={`${card} flex flex-col`}>
          <h2 className="font-semibold">Add Items</h2>

          <div className="mt-4 flex flex-wrap gap-2">
            {TABS.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setTab(slot)}
                className={`flex-1 rounded-full px-3 py-1.5 text-xs capitalize transition ${
                  tab === slot
                    ? "bg-brand text-white"
                    : "bg-selected text-muted hover:text-brand"
                }`}
              >
                {SLOT_LABELS[slot]}
              </button>
            ))}
          </div>

          {isOptional && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted">
              Optional {SLOT_LABELS[tab]}
              <Info size={14} />
              {/* A small switch: the knob slides right when it's on */}
              <button
                type="button"
                onClick={toggleSlot}
                aria-label={`Wear a ${SLOT_LABELS[tab]}`}
                className={`ml-auto flex h-6 w-11 items-center rounded-full p-0.5 transition ${
                  slots[tab] ? "justify-end bg-brand" : "bg-line"
                }`}
              >
                <span className="size-5 rounded-full bg-white shadow" />
              </button>
            </div>
          )}

          {options.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">
              No {SLOT_LABELS[tab]} in your wardrobe yet.{" "}
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
                  className={`relative rounded-xl border p-2 text-left transition ${
                    slots[tab] === item.id
                      ? "border-brand ring-1 ring-brand"
                      : "border-line hover:border-brand/40"
                  }`}
                >
                  {slots[tab] === item.id && (
                    <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-brand text-white">
                      <Check size={12} />
                    </span>
                  )}
                  <img
                    src={item.image}
                    alt={item.name}
                    className="aspect-square w-full object-contain"
                  />
                  <p className="mt-2 truncate text-xs font-medium">
                    {item.name}
                  </p>
                  <p className="text-xs text-muted">{item.color}</p>
                </button>
              ))}
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          {/* mt-auto pushes the buttons to the bottom of the card */}
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
            {isOptional && slots[tab] && (
              <button
                type="button"
                onClick={remove}
                className="inline-flex items-center gap-2 text-sm text-red-600"
              >
                <Trash2 size={16} /> Remove {SLOT_LABELS[tab]}
              </button>
            )}
            <Button
              variant="secondary"
              onClick={() => navigate(isEdit ? `/outfits/${id}` : "/outfits")}
              className="ml-auto"
            >
              Cancel
            </Button>
            <Button onClick={save} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save outfit"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
