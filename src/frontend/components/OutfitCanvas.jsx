import { SLOT_LABELS } from "../data";
import { fileUrl } from "../api";

// Right column, top to bottom. Jewelry gets the top corner.
const SMALL = ["jewelry", "accessory", "bag"];

// The outfit as a flat lay, like the design: top and bottom on the left,
// the coat with the shoes under it in the middle, small things on the right.
// Tapping a piece swaps it. Without onSwap nothing can be changed.
//
// Two layouts, one set of boxes:
// - Phone: a two-row grid, so the top lines up with the coat and the bottom with the shoes.
//   The column boxes are "contents" there, so the pieces sit in the grid directly.
// - sm and up: three flex columns, each one arranging its own pieces.
export default function OutfitCanvas({ items, onSwap, disabled }) {
  const small = SMALL.filter((slot) => items[slot]);

  // One piece. size and fit are full class names, so Tailwind finds them.
  function piece(slot, size, fit = "") {
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

  return (
    <div
      className={`grid h-96 grid-rows-2 gap-x-4 gap-y-2 sm:flex sm:h-120 sm:justify-center sm:gap-6 ${
        // No small things? Then on a phone the clothes get the full width.
        small.length ? "grid-cols-8" : "grid-cols-6"
      }`}
    >
      {/* Top and bottom. On a phone they lean toward each other. */}
      {(items.top || items.bottom) && (
        <div className="contents sm:flex sm:w-1/3 sm:min-w-0 sm:flex-col sm:gap-4">
          {items.top &&
            piece(
              "top",
              "col-span-3 col-start-1 row-start-1 sm:flex-2",
              "object-bottom sm:object-center",
            )}
          {items.bottom &&
            piece(
              "bottom",
              "col-span-3 col-start-1 row-start-2 sm:flex-3",
              "object-top sm:object-center",
            )}
        </div>
      )}

      {/* Coat with the shoes under it */}
      {(items.outerwear || items.shoes) && (
        <div className="contents sm:flex sm:w-1/3 sm:min-w-0 sm:flex-col sm:justify-end sm:gap-4">
          {items.outerwear &&
            piece(
              "outerwear",
              "col-span-3 col-start-4 row-start-1 sm:flex-1",
              "object-bottom sm:object-center",
            )}
          {items.shoes &&
            piece(
              "shoes",
              "col-span-3 col-start-4 row-start-2 h-3/5 px-2 sm:h-1/4 sm:shrink-0 sm:px-6",
              "object-top sm:object-center",
            )}
        </div>
      )}

      {/* Small things, spread out */}
      {small.length > 0 && (
        <div className="col-span-2 col-start-7 row-span-2 row-start-1 flex min-h-0 flex-col justify-around sm:w-1/4 sm:min-w-0">
          {small.map((slot) => piece(slot, "h-20 shrink-0 sm:h-28"))}
        </div>
      )}
    </div>
  );
}
