import { useState } from "react";
import { Check, Search, Shirt, X } from "lucide-react";
import { OPTIONAL_SLOTS, SLOT_LABELS } from "../data";
import { fileUrl } from "../api";

const card = "relative rounded-xl border bg-surface p-2 text-left transition";

// Swap one piece of the outfit. Tapping a piece puts it in right away.
export default function ItemPicker({
  slot,
  wardrobe,
  currentId,
  onPick,
  onClose,
}) {
  const [query, setQuery] = useState("");

  const items = wardrobe.filter(
    (item) =>
      item.slot === slot &&
      item.name.toLowerCase().includes(query.toLowerCase()),
  );
  const canLeaveOut = OPTIONAL_SLOTS.includes(slot);

  function pick(id) {
    onPick(id);
    onClose();
  }

  return (
    // The dark background closes it, the white box doesn't
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-4 dark:bg-black/60"
    >
      <section
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-dvh w-full max-w-2xl flex-col rounded-2xl bg-canvas p-5 shadow-soft"
      >
        <header className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Change {SLOT_LABELS[slot]}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-muted hover:bg-selected hover:text-brand"
          >
            <X size={18} />
          </button>
        </header>

        {/* Search */}
        <label className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2.5 text-muted">
          <Search size={16} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your wardrobe…"
            className="flex-1 bg-transparent text-sm text-ink outline-none"
          />
        </label>

        {/* Pieces */}
        <div className="mt-4 grid grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pick(item.id)}
              className={`${card} ${
                item.id === currentId
                  ? "border-brand ring-1 ring-brand"
                  : "border-line hover:border-brand/40"
              }`}
            >
              {item.id === currentId && (
                <span className="absolute top-2 right-2 grid size-5 place-items-center rounded-full bg-brand text-white">
                  <Check size={12} />
                </span>
              )}
              <img
                src={fileUrl(item.image)}
                alt={item.name}
                className="h-32 w-full rounded-lg object-contain dark:bg-ink/85"
              />
              <p className="mt-2 truncate text-xs font-medium">{item.name}</p>
              <p className="text-xs text-muted">{item.color}</p>
            </button>
          ))}

          {/* Optional places can stay empty */}
          {canLeaveOut && !query && (
            <button
              type="button"
              onClick={() => pick(null)}
              className={`${card} flex flex-col items-center justify-center gap-2 border-dashed text-sm text-muted hover:border-brand/40 hover:text-brand`}
            >
              <Shirt size={28} strokeWidth={1.3} />
              Leave it out
            </button>
          )}
        </div>

        {items.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">
            Nothing here. Try another search.
          </p>
        )}
      </section>
    </div>
  );
}
