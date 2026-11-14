import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bookmark, Plus, X } from "lucide-react";
import { Button } from "../components/Buttons";
import {
  OPTIONAL_SLOTS,
  SLOTS,
  SLOT_LABELS,
  defaultOutfitName,
  getSlot,
  outfitKey,
} from "../data";

const EMPTY = {
  top: null,
  bottom: null,
  outerwear: null,
  shoes: null,
  bag: null,
  accessory: null,
};

const card = "rounded-2xl border border-line bg-white p-4 sm:p-6";

// Build an outfit by hand: pick a place on the left, a piece on the right
export default function BuildOutfit() {
  const navigate = useNavigate();
  const [wardrobe, setWardrobe] = useState([]);
  const [slots, setSlots] = useState(EMPTY);
  const [activeSlot, setActiveSlot] = useState("top");
  const [name, setName] = useState(defaultOutfitName());
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

  // Only the pieces that fit the place we're filling
  const options = wardrobe.filter((item) => item.slot === activeSlot);

  function itemFor(slot) {
    return wardrobe.find((item) => item.id === slots[slot]);
  }

  // Tapping the piece that's already in clears the place
  function pick(id) {
    setSlots({ ...slots, [activeSlot]: slots[activeSlot] === id ? null : id });
    setError("");
  }

  function clear(slot) {
    setSlots({ ...slots, [slot]: null });
  }

  async function save() {
    const missing = SLOTS.filter(
      (slot) => !OPTIONAL_SLOTS.includes(slot) && !slots[slot],
    );
    if (missing.length) {
      setError(
        `Pick ${missing.map((slot) => SLOT_LABELS[slot]).join(", ")} first.`,
      );
      setActiveSlot(missing[0]);
      return;
    }
    if (!name.trim()) {
      setError("Give your outfit a name.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("http://localhost:5000/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: outfitKey(slots),
          name: name.trim(),
          slots,
          favorite: false,
        }),
      });
      if (!res.ok) throw new Error();
      navigate("/outfits");
    } catch {
      setError("Could not save the outfit. Is the server running?");
      setIsSaving(false);
    }
  }

  return (
    <div>
      <Link
        to="/outfits"
        className="inline-flex items-center gap-2 text-sm font-medium text-brand"
      >
        <ArrowLeft size={16} /> Back to outfits
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight">
        Build your outfit
      </h1>
      <p className="mt-1 text-sm text-muted">
        Pick a piece for each place. Layer, bag and accessory are optional.
      </p>

      <div className="mt-6 grid gap-5 lg:grid-cols-5">
        {/* Places in the outfit */}
        <section className={`${card} lg:col-span-2`}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Outfit name"
            className="w-full border-b border-line pb-2 text-lg font-semibold outline-none focus:border-brand"
          />

          <div className="mt-4 grid grid-cols-3 gap-3">
            {SLOTS.map((slot) => {
              const item = itemFor(slot);
              return (
                <div key={slot} className="relative">
                  <button
                    type="button"
                    onClick={() => setActiveSlot(slot)}
                    className={`flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-xl border p-2 text-xs transition ${
                      activeSlot === slot
                        ? "border-brand bg-selected"
                        : "border-dashed border-line hover:bg-selected/50"
                    }`}
                  >
                    {item ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="min-h-0 w-full flex-1 object-contain"
                      />
                    ) : (
                      <Plus size={18} className="text-brand" />
                    )}
                    <span className="text-muted capitalize">
                      {SLOT_LABELS[slot]}
                    </span>
                  </button>
                  {item && (
                    <button
                      type="button"
                      onClick={() => clear(slot)}
                      aria-label={`Remove ${SLOT_LABELS[slot]}`}
                      className="absolute top-1 right-1 rounded-full bg-white p-1 text-muted shadow hover:text-brand"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

          <Button
            icon={Bookmark}
            onClick={save}
            disabled={isSaving}
            className="mt-4 w-full"
          >
            {isSaving ? "Saving…" : "Save outfit"}
          </Button>
        </section>

        {/* Wardrobe pieces for the selected place */}
        <section className={`${card} lg:col-span-3`}>
          <h2 className="text-lg font-semibold capitalize">
            Choose {SLOT_LABELS[activeSlot]}
          </h2>

          {options.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted">
              No {SLOT_LABELS[activeSlot]} in your wardrobe yet.{" "}
              <Link to="/wardrobe/new" className="font-medium text-brand">
                Add one
              </Link>
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
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
        </section>
      </div>
    </div>
  );
}
