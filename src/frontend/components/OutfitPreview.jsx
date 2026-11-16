import { Bookmark, Check, Gem, Heart, Plus } from "lucide-react";
import { Button } from "./Buttons";
import OutfitCanvas from "./OutfitCanvas";
import { OPTIONAL_SLOTS, SLOTS, SLOT_LABELS, outfitTags } from "../data";

const tag = "rounded-full bg-selected px-3 py-1 text-xs text-muted";

// Today's outfit on Home: the picture, its tags, add/save buttons and the prompt box
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
  const pieces = SLOTS.map((slot) => items[slot]).filter(Boolean);
  // Jewelry gets its own tiny button, the rest get "Add bag" and so on
  const missing = OPTIONAL_SLOTS.filter(
    (slot) => !items[slot] && slot !== "jewelry",
  );

  return (
    // Frosted, blurry card: soft color spots behind, so white and gray pieces stand out.
    // isolate keeps the -z-10 spots inside this card.
    <section className="relative isolate flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white bg-linear-to-br from-selected via-canvas to-white p-4 shadow-soft sm:p-6">
      <span className="absolute -top-24 -left-24 -z-10 size-96 rounded-full bg-brand/20 blur-3xl" />
      <span className="absolute top-1/3 -right-32 -z-10 size-96 rounded-full bg-ink/10 blur-3xl" />
      <span className="absolute -bottom-32 left-1/4 -z-10 size-80 rounded-full bg-brand/10 blur-3xl" />

      <header className="mb-4 flex items-center gap-2">
        <h2 className="mr-auto text-xl font-semibold">Today's Outfit</h2>
        {/* Styles and seasons the pieces share, same as on My Outfits */}
        {outfitTags(pieces).map((name) => (
          <span key={name} className={tag}>
            {name}
          </span>
        ))}
        <button
          type="button"
          onClick={onFavorite}
          aria-label="Favorite"
          className="p-1 text-brand"
        >
          <Heart size={20} className={isFavorite ? "fill-current" : ""} />
        </button>
      </header>

      {pieces.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted">
          No outfit yet. Generate one from your wardrobe.
        </p>
      ) : (
        <OutfitCanvas items={items} onSwap={onSwap} disabled={isGenerating} />
      )}

      {/* Add buttons on the left, save on the right */}
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
        {!items.jewelry && (
          <button
            type="button"
            disabled={isGenerating}
            onClick={() => onSwap("jewelry")}
            title="Add jewelry"
            aria-label="Add jewelry"
            className="inline-flex items-center rounded-full border border-dashed border-brand/30 p-1.5 text-brand hover:bg-selected"
          >
            <Plus size={12} />
            <Gem size={12} />
          </button>
        )}
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

      {/* The prompt box from Home */}
      {children}
    </section>
  );
}
