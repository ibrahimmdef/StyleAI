import { Bookmark, Check, Heart, Plus } from "lucide-react";
import { Button } from "./Buttons";
import OutfitCanvas from "./OutfitCanvas";
import { OPTIONAL_SLOTS, SLOTS, SLOT_LABELS } from "../data";

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
        <OutfitCanvas items={items} onSwap={onSwap} disabled={isGenerating} />
      )}

      {/* One row: add buttons on the left, save on the right. Always shown. */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
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

        {/* ml-auto pushes this and everything after it to the right */}
        <span className="ml-auto text-xs text-muted">
          {pieces.length} pieces
        </span>
        <Button
          variant="secondary"
          icon={isSaved ? Check : Bookmark}
          onClick={onSave}
        >
          {isSaved ? "Saved" : "Save outfit"}
        </Button>
      </div>

      {/* Whatever Home puts inside <OutfitPreview>...</OutfitPreview> shows up here */}
      {children}
    </section>
  );
}
