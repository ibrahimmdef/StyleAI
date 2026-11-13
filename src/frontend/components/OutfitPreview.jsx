import { ArrowLeftRight, Bookmark, Check, Heart, Plus } from "lucide-react";
import { Button, IconButton } from "./Buttons";
import { OPTIONAL_SLOTS, SLOTS, SLOT_LABELS } from "../data";

// Clothes grow to fill the free space, small things keep a fixed size
// so boots don't end up huge. Full class names, so Tailwind can find them.
const SIZES = {
  top: "flex-2",
  bottom: "flex-3",
  outerwear: "flex-3",
  shoes: "h-28 sm:h-36",
  bag: "h-24 sm:h-32",
  accessory: "h-20 sm:h-28",
};

const tag = "rounded-full bg-selected px-3 py-1 text-xs text-muted";

export default function OutfitPreview({
  items,
  isFavorite,
  isSaved,
  isGenerating,
  onFavorite,
  onSave,
  onSwap,
  children,
}) {
  const pieces = SLOTS.filter((slot) => items[slot]);
  const missing = OPTIONAL_SLOTS.filter((slot) => !items[slot]);

  // Two pieces per column: 4 pieces -> 2 columns, 5 or 6 -> 3 columns
  const columns = [];
  for (let i = 0; i < pieces.length; i += 2) {
    columns.push(pieces.slice(i, i + 2));
  }

  return (
    <section className="flex min-w-0 flex-col rounded-2xl border border-line bg-white p-4 sm:p-6">
      <header className="mb-4 flex items-center gap-3">
        <h2 className="mr-auto text-xl font-semibold">Today’s Outfit</h2>
        <span className={tag}>Casual</span>
        <span className={tag}>Autumn</span>
        <button
          type="button"
          onClick={onFavorite}
          aria-label="Favorite"
          className="p-1 text-brand"
        >
          <Heart size={20} className={isFavorite ? "fill-current" : ""} />
        </button>
      </header>

      {/* Outfit pieces */}
      {pieces.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted">
          No outfit yet. Generate one from your wardrobe.
        </p>
      ) : (
        <div className="flex h-96 gap-4 sm:h-120">
          {columns.map((column) => (
            <div
              key={column[0]}
              className="flex min-w-0 flex-1 flex-col justify-center gap-3"
            >
              {column.map((slot) => (
                <div key={slot} className={`relative min-h-0 ${SIZES[slot]}`}>
                  <img
                    src={items[slot].image}
                    alt={items[slot].name}
                    className="h-full w-full object-contain"
                  />
                  <IconButton
                    label={`Change ${SLOT_LABELS[slot]}`}
                    icon={ArrowLeftRight}
                    disabled={isGenerating}
                    onClick={() => onSwap(slot)}
                    className="absolute top-0 right-0 size-8"
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Empty optional slots */}
      {missing.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {missing.map((slot) => (
            <button
              key={slot}
              type="button"
              disabled={isGenerating}
              onClick={() => onSwap(slot)}
              className="inline-flex items-center gap-1 rounded-lg border border-dashed border-brand/30 px-3 py-1.5 text-xs text-brand hover:bg-selected"
            >
              <Plus size={14} /> Add {SLOT_LABELS[slot]}
            </button>
          ))}
        </div>
      )}

      {/* Whatever Home puts inside <OutfitPreview>...</OutfitPreview> shows up here */}
      {children}

      <footer className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <Button
          variant="secondary"
          icon={isSaved ? Check : Bookmark}
          onClick={onSave}
        >
          {isSaved ? "Saved" : "Save outfit"}
        </Button>
        <span className="ml-auto text-xs text-muted">
          {pieces.length} pieces
        </span>
      </footer>
    </section>
  );
}
