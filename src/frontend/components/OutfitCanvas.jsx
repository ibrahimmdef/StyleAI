import { SLOT_LABELS } from "../data";
import { fileUrl } from "../api";

// Right column, top to bottom. Jewelry gets the top corner.
const SMALL = ["jewelry", "accessory", "bag"];

// The outfit as a flat lay, like the design: top and bottom on the left,
// the layer with the shoes under it in the middle, small things on the right.
// Tapping a piece swaps it. Without onSwap nothing can be changed.
export default function OutfitCanvas({ items, onSwap, disabled }) {
  const small = SMALL.filter((slot) => items[slot]);

  // One piece. size is a full class name, so Tailwind finds it.
  function piece(slot, size) {
    return (
      <button
        key={slot}
        type="button"
        disabled={!onSwap || disabled}
        onClick={() => onSwap(slot)}
        title={onSwap ? `Change ${SLOT_LABELS[slot]}` : undefined}
        className={`relative min-h-0 rounded-xl p-1 transition enabled:hover:bg-white/60 ${size}`}
      >
        <img
          src={fileUrl(items[slot].image)}
          alt={items[slot].name}
          className="size-full object-contain"
        />
      </button>
    );
  }

  return (
    <div className="flex h-96 justify-center gap-6 sm:h-120">
      {(items.top || items.bottom) && (
        <div className="flex w-1/3 min-w-0 flex-col gap-4">
          {items.top && piece("top", "flex-2")}
          {items.bottom && piece("bottom", "flex-3")}
        </div>
      )}

      {/* Shoes sit under the layer. With no layer they stay at the bottom. */}
      {(items.outerwear || items.shoes) && (
        <div className="flex w-1/3 min-w-0 flex-col justify-end gap-4">
          {items.outerwear && piece("outerwear", "flex-1")}
          {items.shoes && piece("shoes", "h-1/4 shrink-0 px-6")}
        </div>
      )}

      {/* Small things, spread out */}
      {small.length > 0 && (
        <div className="flex w-1/4 min-w-0 flex-col justify-around">
          {small.map((slot) => piece(slot, "h-20 shrink-0 sm:h-28"))}
        </div>
      )}
    </div>
  );
}
