import { useState } from "react";
import { Cookie } from "lucide-react";
import { STORAGE, removeStorage, writeStorage } from "../data";
import { getLocation } from "./WeatherCard";

const button =
  "flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition active:scale-95 disabled:opacity-60";

// Asks what the app may keep in this browser and if it may use the location.
// The parent decides when to show it and what happens after (onDone).
export default function CookieBanner({ onDone }) {
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState(true);
  const [location, setLocation] = useState(true);
  const [isAsking, setIsAsking] = useState(false);

  async function answer(allowPreferences, allowLocation) {
    writeStorage(STORAGE.consent, {
      preferences: allowPreferences,
      location: allowLocation,
      date: new Date().toISOString(),
    });
    // Said no: take out what was kept before
    if (!allowPreferences) removeStorage(STORAGE.outfit);

    // Said yes: the browser shows its own location popup now, not later on Home
    if (allowLocation) {
      setIsAsking(true);
      await getLocation();
    }
    onDone();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/20 px-4 dark:bg-black/60 pt-4 sm:pt-10">
      <div className="w-full max-w-md animate-drop-in rounded-2xl border border-line bg-surface p-5 shadow-soft">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-selected text-brand">
            <Cookie size={20} strokeWidth={1.6} />
          </span>
          <h2 className="font-semibold">Before you start</h2>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted">
          StyleAI keeps a little data in your browser so today's outfit is still
          there when you come back, and uses your location for the weather. No
          ads, no tracking.
        </p>

        {showDetails && (
          <div className="mt-4 flex flex-col gap-3 rounded-xl bg-canvas/60 p-4">
            <Choice
              title="Necessary"
              text="Remembers these choices. Always on."
              on
            />
            <Choice
              title="Preferences"
              text="Keeps today's outfit on this device."
              on={preferences}
              onToggle={() => setPreferences(!preferences)}
            />
            <Choice
              title="Location"
              text="Weather for where you are. Off means Baku."
              on={location}
              onToggle={() => setLocation(!location)}
            />
          </div>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => answer(false, false)}
            disabled={isAsking}
            className={`${button} bg-selected text-brand hover:bg-selected/70`}
          >
            Necessary only
          </button>
          <button
            type="button"
            onClick={() => answer(true, true)}
            disabled={isAsking}
            className={`${button} bg-brand text-white hover:bg-brand-hover`}
          >
            {isAsking ? "Finding you…" : "Accept all"}
          </button>
        </div>
        <button
          type="button"
          onClick={() =>
            showDetails ? answer(preferences, location) : setShowDetails(true)
          }
          disabled={isAsking}
          className="mt-3 w-full text-center text-xs font-medium text-muted hover:text-brand"
        >
          {showDetails ? "Save my choices" : "Customize"}
        </button>
      </div>
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
