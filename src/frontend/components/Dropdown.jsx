import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// Our own select. The browser's list can't be styled and opens wherever it likes,
// this one always opens below and looks like the rest of the app.
// labels is optional, to show "All seasons" instead of "All".
export default function Dropdown({
  value,
  options,
  labels = {},
  onChange,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const label = (option) => labels[option] ?? option;

  function pick(option) {
    onChange(option);
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between gap-2 text-left ${className}`}
      >
        {label(value)}
        <ChevronDown
          size={16}
          className={`shrink-0 text-muted transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          {/* Invisible layer over the page: tapping anywhere else closes the list */}
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-30" />
          <ul className="absolute top-full left-0 z-40 mt-1 max-h-64 min-w-full overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-soft">
            {options.map((option) => (
              <li key={option}>
                <button
                  type="button"
                  onClick={() => pick(option)}
                  className={`flex w-full items-center justify-between gap-4 px-3 py-2 text-left text-sm whitespace-nowrap hover:bg-selected ${
                    option === value ? "text-brand" : ""
                  }`}
                >
                  {label(option)}
                  {option === value && <Check size={14} />}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
