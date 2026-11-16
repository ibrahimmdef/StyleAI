import { ArrowLeftRight } from "lucide-react";
import { IconButton } from "./Buttons";
import { SLOTS, SLOT_LABELS } from "../data";
import { fileUrl } from "../api";

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

// The outfit drawn as a picture. Without onSwap there are no swap buttons.
export default function OutfitCanvas({ items, onSwap, disabled }) {
  const pieces = SLOTS.filter((slot) => items[slot]);

  // Two pieces per column: 4 pieces -> 2 columns, 5 or 6 -> 3 columns
  const columns = [];
  for (let i = 0; i < pieces.length; i += 2) {
    columns.push(pieces.slice(i, i + 2));
  }

  return (
    <div className="flex h-96 gap-4 sm:h-120">
      {columns.map((column) => (
        <div
          key={column[0]}
          className="flex min-w-0 flex-1 flex-col justify-center gap-3"
        >
          {column.map((slot) => (
            <div key={slot} className={`relative min-h-0 ${SIZES[slot]}`}>
              <img
                src={fileUrl(items[slot].image)}
                alt={items[slot].name}
                className="h-full w-full object-contain"
              />
              {onSwap && (
                <IconButton
                  label={`Change ${SLOT_LABELS[slot]}`}
                  icon={ArrowLeftRight}
                  disabled={disabled}
                  onClick={() => onSwap(slot)}
                  className="absolute top-0 right-0 size-8"
                />
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
