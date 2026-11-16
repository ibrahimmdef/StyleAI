import { useState } from "react";
import { Cookie } from "lucide-react";
import { STORAGE, readStorage, writeStorage } from "../data";

const button =
  "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-95";

// Asks once what the app may keep in this browser
export default function CookieBanner() {
  const [isOpen, setIsOpen] = useState(
    () => readStorage(STORAGE.consent, null) === null,
  );
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState(true);

  if (!isOpen) return null;

  function answer(allowPreferences) {
    writeStorage(STORAGE.consent, {
      preferences: allowPreferences,
      date: new Date().toISOString(),
    });
    // Said no: take out what was kept before
    if (!allowPreferences) localStorage.removeItem(STORAGE.outfit);
    setIsOpen(false);
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-line bg-white p-5 shadow-soft sm:left-auto sm:max-w-sm">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-selected text-brand">
          <Cookie size={20} strokeWidth={1.6} />
        </span>
        <h2 className="font-semibold">Your browser, your choice</h2>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted">
        StyleAI keeps a little data in your browser so today's outfit is still
        there when you come back. No ads, no tracking.
      </p>

      {showDetails && (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-canvas/60 p-4">
          <Choice
            title="Necessary"
            text="Remembers this choice. Always on."
            on
          />
          <Choice
            title="Preferences"
            text="Keeps today's outfit on this device."
            on={preferences}
            onToggle={() => setPreferences(!preferences)}
          />
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => answer(false)}
          className={`${button} bg-selected text-brand hover:bg-selected/70`}
        >
          Necessary only
        </button>
        <button
          type="button"
          onClick={() => answer(true)}
          className={`${button} bg-brand text-white hover:bg-brand-hover`}
        >
          Accept all
        </button>
      </div>
      <button
        type="button"
        onClick={() =>
          showDetails ? answer(preferences) : setShowDetails(true)
        }
        className="mt-3 w-full text-center text-xs font-medium text-muted hover:text-brand"
      >
        {showDetails ? "Save my choices" : "Customize"}
      </button>
    </div>
  );
}

// One line with a switch. Without onToggle the switch is locked.
function Choice({ title, text, on, onToggle }) {
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted">{text}</p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        aria-label={title}
        className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition disabled:opacity-60 ${
          on ? "justify-end bg-brand" : "bg-line"
        }`}
      >
        <span className="size-5 rounded-full bg-white shadow" />
      </button>
    </div>
  );
}
