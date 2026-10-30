import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Search, Shirt, X } from "lucide-react";
import { Button, IconButton } from "./Buttons";
import { optionalSlots, slotLabels, wardrobeItems } from "../data";

export default function ItemPicker({ slot, currentId, onApply, onClose }) {
  const [selection, setSelection] = useState(currentId);
  const [query, setQuery] = useState("");
  const dialogRef = useRef(null);
  const initialFocus = useRef(null);
  const headingId = "item-picker-title";
  const items = wardrobeItems.filter(
    (item) =>
      item.slot === slot &&
      item.name.toLowerCase().includes(query.toLowerCase()),
  );
  const optional = optionalSlots.includes(slot);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    initialFocus.current?.focus();
    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const nodes = [
          ...dialogRef.current.querySelectorAll(
            'button:not(:disabled), input, [tabindex="0"]',
          ),
        ];
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/25 p-3 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="flex max-h-[90dvh] w-full max-w-[650px] flex-col overflow-hidden rounded-2xl border border-white bg-[#f8fbff] shadow-2xl"
      >
        <header className="flex items-center gap-4 border-b border-line bg-white px-5 py-4 sm:px-6">
          <div className="mr-auto">
            <h2 id={headingId} className="text-lg font-semibold">
              Change {slotLabels[slot]}
            </h2>
            <p className="mt-1 text-xs text-muted">
              A different piece. Still your style.
            </p>
          </div>
          <IconButton label="Close item picker" icon={X} onClick={onClose} />
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <label className="mb-5 flex items-center gap-2.5 rounded-xl border border-line bg-white px-3.5 py-3 text-muted">
            <Search size={17} aria-hidden="true" />
            <input
              ref={initialFocus}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search matching wardrobe items"
              placeholder="Search your wardrobe…"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/65 focus-visible:outline-none"
            />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {items.map((item) => (
              <button
                type="button"
                key={item.id}
                aria-pressed={selection === item.id}
                onClick={() => setSelection(item.id)}
                className={`relative flex flex-col rounded-xl border bg-white p-3 text-left transition hover:border-brand/50 ${selection === item.id ? "border-brand ring-2 ring-brand/15" : "border-line"}`}
              >
                {selection === item.id && (
                  <span className="absolute top-2 right-2 flex size-5 items-center justify-center rounded-full bg-brand text-white">
                    <Check size={12} aria-hidden="true" />
                  </span>
                )}
                <img
                  src={item.image}
                  alt=""
                  className="mb-3 h-36 w-full object-contain"
                />
                <span className="text-xs leading-5 font-medium">
                  {item.name}
                </span>
                <span className="mt-1 text-[11px] text-muted">
                  {item.category} · {item.color}
                </span>
              </button>
            ))}
            {optional && !query && (
              <button
                type="button"
                aria-pressed={selection === null}
                onClick={() => setSelection(null)}
                className={`flex min-h-52 flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-4 text-center text-sm ${selection === null ? "border-brand bg-selected/40 text-brand" : "border-line bg-white text-muted"}`}
              >
                <Shirt size={30} strokeWidth={1.3} aria-hidden="true" />
                {slot === "outerwear" ? "Without a layer" : "Leave it out"}
                {selection === null && <Check size={16} aria-hidden="true" />}
              </button>
            )}
          </div>
          {items.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">
              No matching pieces. Try another search.
            </p>
          )}
        </div>
        <footer className="flex justify-end gap-3 border-t border-line bg-white px-5 py-4 sm:px-6">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={selection === currentId}
            onClick={() => {
              onApply(slot, selection);
              onClose();
            }}
          >
            Apply change
          </Button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
