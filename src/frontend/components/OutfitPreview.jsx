import {
  ArrowLeftRight,
  Plus,
  Bookmark,
  Check,
  Heart,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { Button, IconButton } from "./Buttons";
import { slotLabels } from "../data";

export default function OutfitPreview({
  items,
  isFavorite,
  isSaved,
  isGenerating,
  onFavorite,
  onSave,
  onGenerate,
  onSwap,
}) {
  const count = Object.values(items).filter(Boolean).length;
  return (
    <section
      aria-labelledby="todays-outfit-title"
      className="flex min-w-0 flex-col rounded-[14px] border border-line bg-white p-4 shadow-soft sm:p-5 xl:p-6"
    >
      <header className="mb-5 flex items-center gap-3">
        <h2
          id="todays-outfit-title"
          className="mr-auto text-lg font-semibold tracking-tight sm:text-xl"
        >
          Today’s Outfit
        </h2>
        <span className="hidden rounded-full bg-[#edf5ff] px-3 py-1.5 text-[10px] text-muted sm:inline-flex">
          Casual
        </span>
        <span className="hidden rounded-full bg-[#edf5ff] px-3 py-1.5 text-[10px] text-muted sm:inline-flex">
          Autumn
        </span>
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
        <IconButton
          label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          icon={Heart}
          aria-pressed={isFavorite}
          onClick={onFavorite}
          className={`size-9 border-transparent text-[#476897] ${isFavorite ? "[&>svg]:fill-brand [&>svg]:text-brand" : ""}`}
        />
      </header>
      <OutfitCanvas items={items} onSwap={onSwap} disabled={isGenerating} />
      <footer className="mt-5 flex flex-wrap items-center gap-2.5 border-t border-line pt-4 sm:gap-3">
        <Button
          icon={isGenerating ? LoaderCircle : Sparkles}
          onClick={onGenerate}
          disabled={isGenerating}
          className={`flex-1 px-3 sm:flex-none sm:px-5 ${isGenerating ? "[&>svg]:animate-spin" : ""}`}
        >
          {isGenerating ? "Styling your day…" : "Generate new outfit"}
        </Button>
        <Button
          variant="secondary"
          icon={isSaved ? Check : Bookmark}
          onClick={onSave}
          className="px-3 sm:px-5"
        >
          {isSaved ? "Saved" : "Save outfit"}
        </Button>
        <span
          className="ml-auto text-[11px] whitespace-nowrap text-muted"
          aria-live="polite"
        >
          {count} pieces
        </span>
      </footer>
    </section>
  );
}

// Geyimlərin jaketli / jaketsiz düzülüşü.
// Literal Tailwind classes let Tailwind discover every possible composition.
const layered = {
  top: "col-start-1 row-start-1 row-span-2",
  bottom: "col-start-1 row-start-3 row-span-4",
  outerwear: "col-start-2 row-start-1 row-span-4",
  shoes: "col-start-2 row-start-5 row-span-2",
  glasses: "col-start-3 row-start-1",
  bag: "col-start-3 row-start-2 row-span-2",
  earrings: "col-start-3 row-start-4",
  necklace: "col-start-3 row-start-5 row-span-2",
};
const unlayered = {
  top: "col-start-1 row-start-1 row-span-2",
  bottom: "col-start-1 row-start-3 row-span-4",
  glasses: "col-start-2 row-start-1",
  bag: "col-start-2 row-start-2 row-span-2",
  earrings: "col-start-3 row-start-1 row-span-2",
  necklace: "col-start-3 row-start-3 row-span-2",
  shoes: "col-start-2 col-span-2 row-start-5 row-span-2",
};
const imageSizes = {
  top: "max-h-full max-w-[90%]",
  bottom: "max-h-full max-w-[90%]",
  outerwear: "max-h-full max-w-full",
  shoes: "max-h-[92%] max-w-full",
  glasses: "max-h-[76%] max-w-[94%]",
  bag: "max-h-[94%] max-w-[92%]",
  earrings: "max-h-[90%] max-w-[74%]",
  necklace: "max-h-[92%] max-w-[84%]",
};

function OutfitCanvas({ items, onSwap, disabled = false }) {
  const hasLayer = Boolean(items.outerwear);
  const placement = hasLayer ? layered : unlayered;

  return (
    <div className="relative">
      <div
        data-testid="outfit-canvas"
        data-has-layer={hasLayer}
        className={`grid h-[clamp(360px,calc(100dvh-430px),550px)] grid-rows-[repeat(6,minmax(0,1fr))] gap-x-3 gap-y-2 ${hasLayer ? "grid-cols-[1fr_1.16fr_.76fr]" : "grid-cols-[1.12fr_.8fr_.55fr]"}`}
      >
        {Object.entries(placement).map(([slot, position]) => {
          const item = items[slot];
          if (!item) return null;
          return (
            <div
              key={slot}
              data-slot={slot}
              className={`group relative flex min-h-0 min-w-0 items-center justify-center p-1.5 ${position}`}
            >
              <img
                key={item.id}
                src={item.image}
                alt={item.name}
                draggable="false"
                className={`h-full w-full object-contain ${imageSizes[slot]}`}
              />
              <IconButton
                label={`Change ${slotLabels[slot]}`}
                icon={ArrowLeftRight}
                disabled={disabled}
                onClick={() => onSwap(slot)}
                className="absolute top-1 right-0 size-8 shadow-[0_2px_8px_#dce8f8] sm:size-8 [&>svg]:size-3.5"
              />
            </div>
          );
        })}
      </div>
      {!hasLayer && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onSwap("outerwear")}
          className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-dashed border-brand/30 px-3 text-xs text-brand hover:bg-selected"
        >
          <Plus size={14} /> Add a layer
        </button>
      )}
      {["bag", "glasses", "earrings", "necklace"].some(
        (slot) => !items[slot],
      ) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {["bag", "glasses", "earrings", "necklace"]
            .filter((slot) => !items[slot])
            .map((slot) => (
              <button
                key={slot}
                type="button"
                disabled={disabled}
                onClick={() => onSwap(slot)}
                className="min-h-9 rounded-lg px-2 text-xs text-brand hover:bg-selected"
              >
                + Add {slotLabels[slot]}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
