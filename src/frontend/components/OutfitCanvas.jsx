import { SLOT_LABELS } from "../data";
import { fileUrl } from "../api";

// Right column, top to bottom. Jewelry gets the top corner.
const SMALL = ["jewelry", "accessory", "bag"];

// The outfit as a flat lay, like the design: top and bottom on the left,
// the coat with the shoes under it in the middle, small things on the right.
// Tapping a piece swaps it. Without onSwap nothing can be changed.
export default function OutfitCanvas({ items, onSwap, disabled }) {
  const small = SMALL.filter((slot) => items[slot]);

  // One piece. size and fit are full class names, so Tailwind finds them.
  // fit pushes the picture to one side of its box, so pieces that belong
  // together (top and bottom, coat and shoes) sit close instead of far apart.
  function piece(slot, size, fit = "object-center") {
    return (
      <button
        key={slot}
        type="button"
        disabled={!onSwap || disabled}
        onClick={() => onSwap(slot)}
        title={onSwap ? `Change ${SLOT_LABELS[slot]}` : undefined}
        // On hover the piece steps forward a little, so it feels picked
        className={`relative min-h-0 p-1 transition duration-200 enabled:hover:z-10 enabled:hover:scale-108 enabled:hover:drop-shadow-xl ${size}`}
      >
        <img
          src={fileUrl(items[slot].image)}
          alt={items[slot].name}
          className={`size-full object-contain ${fit}`}
        />
      </button>
    );
  }

  // A grid with two rows, so pieces on the same row line up:
  // top next to the coat, bottom next to the shoes. Small things take the right side.
  // Columns: 3 + 3 + 2 out of 8, or 3 + 3 out of 6.
  return (
    <div
      className={`grid h-96 grid-rows-2 gap-x-4 gap-y-2 sm:h-120 ${
        // No small things? Then the clothes get the full width.
        small.length ? "grid-cols-8" : "grid-cols-6"
      }`}
    >
      {items.top &&
        piece("top", "col-span-3 col-start-1 row-start-1", "object-bottom")}
      {items.bottom &&
        piece("bottom", "col-span-3 col-start-1 row-start-2", "object-top")}
      {items.outerwear &&
        piece(
          "outerwear",
          "col-span-3 col-start-4 row-start-1",
          "object-bottom",
        )}
      {/* Shoes take the top part of their row, right under the coat */}
      {items.shoes &&
        piece(
          "shoes",
          "col-span-3 col-start-4 row-start-2 h-3/5 px-2 sm:px-6",
          "object-top",
        )}

      {/* Small things, spread out */}
      {small.length > 0 && (
        <div className="col-span-2 col-start-7 row-span-2 row-start-1 flex min-h-0 flex-col justify-around">
          {small.map((slot) => piece(slot, "h-20 shrink-0 sm:h-28"))}
        </div>
      )}
    </div>
  );
}
