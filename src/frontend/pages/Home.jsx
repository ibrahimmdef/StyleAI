import { useCallback, useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { Brand } from "../components/Sidebar";
import { Button } from "../components/Buttons";
import OutfitPreview from "../components/OutfitPreview";
import ItemPicker from "../components/ItemPicker";
import OutfitPrompt from "../components/OutfitPrompt";
import WeatherCard, { loadWeather } from "../components/WeatherCard";
import { fitsSeason, getSeason, needsLayer } from "../../shared/rules";
import {
  OPTIONAL_SLOTS,
  SLOTS,
  STORAGE,
  defaultOutfitName,
  getSlot,
  outfitKey,
  readStorage,
  writeStorage,
} from "../data";

// Morning until noon, afternoon until 6 pm, evening after that
function greeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// Home page: today's outfit, swapping pieces, generating, saving.
export default function Home() {
  // The layout loads the profile, Home only reads the name
  const { profile } = useOutletContext();
  const [wardrobe, setWardrobe] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const [outfit, setOutfit] = useState(() => readStorage(STORAGE.outfit, {}));
  const [saved, setSaved] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeSlot, setActiveSlot] = useState(null);
  const closePicker = useCallback(() => setActiveSlot(null), []);
  const generateTimer = useRef();
  const noticeTimer = useRef();

  useEffect(
    () => () => {
      clearTimeout(generateTimer.current);
      clearTimeout(noticeTimer.current);
    },
    [],
  );

  useEffect(() => {
    writeStorage(STORAGE.outfit, outfit);
  }, [outfit]);

  // Load the real wardrobe from the backend
  useEffect(() => {
    fetch("http://localhost:5000/api/Items")
      .then((res) => res.json())
      .then((data) =>
        setWardrobe(data.map((item) => ({ ...item, slot: getSlot(item) }))),
      )
      .catch(() => notify("Could not load your wardrobe."));
  }, []);

  // Saved outfits, so we know if the one on screen is saved or a favorite
  useEffect(() => {
    fetch("http://localhost:5000/api/outfits")
      .then((res) => res.json())
      .then((data) => setSaved(data))
      .catch(() => {});
  }, []);

  // Weather lives here (not in WeatherCard) because generate needs the temperature
  useEffect(() => {
    loadWeather()
      .then((data) => setWeather(data))
      .catch(() => setWeatherFailed(true));
  }, []);

  // Toast message and swapping a piece
  function notify(message) {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 3500);
  }

  function changeItem(slot, id) {
    setOutfit((current) => ({ ...current, [slot]: id }));
    notify(
      id ? "Your outfit has been updated." : "Item removed from your outfit.",
    );
  }

  // Random outfit that fits today's season and temperature.
  // Pinned pieces always go in. `prompt` is for the AI later, it isn't used yet.
  function generate(prompt, pinnedIds) {
    if (isGenerating) return;
    if (wardrobe.length === 0) {
      notify("Add some clothes to your wardrobe first.");
      return;
    }
    setIsGenerating(true);
    generateTimer.current = setTimeout(() => {
      const season = getSeason();
      const pinned = wardrobe.filter((item) => pinnedIds.includes(item.id));
      const next = {};

      for (const slot of SLOTS) {
        // A pinned piece for this slot wins, no dice
        const mustHave = pinned.filter((item) => item.slot === slot);
        if (mustHave.length) {
          next[slot] = mustHave[Math.floor(Math.random() * mustHave.length)].id;
          continue;
        }

        const all = wardrobe.filter((item) => item.slot === slot);
        const inSeason = all.filter((item) => fitsSeason(item, season));
        // Nothing for this season? Better something than an empty slot
        const options = inSeason.length ? inSeason : all;

        let skip = OPTIONAL_SLOTS.includes(slot) && Math.random() < 0.4;
        // Cold: always add a layer. Warm: leave it out.
        if (slot === "outerwear" && weather) skip = !needsLayer(weather.temp);

        next[slot] =
          options.length && !skip
            ? options[Math.floor(Math.random() * options.length)].id
            : null;
      }
      setOutfit(next);
      setIsGenerating(false);
      notify("A fresh combination, from your wardrobe.");
    }, 550);
  }

  // Is the outfit on screen already saved? Is it a favorite?
  const key = outfitKey(outfit);
  const savedEntry = saved.find((entry) => entry.key === key);
  const isSaved = Boolean(savedEntry);
  const isFavorite = Boolean(savedEntry?.favorite);
  const isEmpty = !Object.values(outfit).some(Boolean);

  // Sends the outfit on screen to the backend. Returns the saved outfit, or null.
  async function addToSaved(favorite) {
    try {
      const res = await fetch("http://localhost:5000/api/outfits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          name: defaultOutfitName(),
          slots: outfit,
          favorite,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setSaved([...saved, created]);
      return created;
    } catch {
      return null;
    }
  }

  async function save() {
    if (isEmpty) return notify("Generate an outfit first.");
    if (isSaved) return notify("This outfit is already saved.");

    if (await addToSaved(false)) {
      notify("Outfit saved. A little inspiration for later.");
    } else {
      notify("Could not save the outfit. Is the server running?");
    }
  }

  async function toggleFavorite() {
    if (isEmpty) return notify("Generate an outfit first.");

    // Not saved yet: save it as a favorite, so it shows on the Outfits page
    if (!savedEntry) {
      if (await addToSaved(true)) notify("Added to favorites.");
      else notify("Could not update favorites.");
      return;
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/outfits/${savedEntry.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ favorite: !isFavorite }),
        },
      );
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setSaved(
        saved.map((entry) => (entry.id === updated.id ? updated : entry)),
      );
      notify(
        updated.favorite ? "Added to favorites." : "Removed from favorites.",
      );
    } catch {
      notify("Could not update favorites.");
    }
  }

  const items = Object.fromEntries(
    Object.entries(outfit).map(([slot, id]) => [
      slot,
      wardrobe.find((item) => item.id === id) ?? null,
    ]),
  );

  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Baku",
  }).format(new Date());

  return (
    <>
      <div className="mb-6 lg:hidden">
        <Brand />
      </div>

      {/* Greeting and date */}
      <header className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[25px] leading-tight font-semibold tracking-tight sm:text-[28px]">
            {greeting(new Date().getHours())}, {profile?.name || "there"}
          </h1>
          <p className="mt-1.5 text-[13px] leading-5 text-muted">
            Here’s your outfit recommendation for today.
          </p>
        </div>
        <time className="pt-1 text-[11px] text-muted">{date}</time>
      </header>

      {/* Weather on the left, outfit on the right.
          On phones the inner div steps aside (contents), so the order is
          weather, outfit, then "Why this outfit" last. */}
      <div className="grid items-stretch gap-5 min-[1150px]:grid-cols-[270px_minmax(0,1fr)] min-[1400px]:grid-cols-[290px_minmax(0,1fr)]">
        <div className="grid gap-5 max-sm:contents sm:grid-cols-2 min-[1150px]:flex min-[1150px]:flex-col">
          <WeatherCard
            weather={weather}
            failed={weatherFailed}
            hasLayer={Boolean(items.outerwear)}
          >
            {/* Quick shuffle: no text, no pinned pieces */}
            <Button
              icon={isGenerating ? LoaderCircle : Sparkles}
              onClick={() => generate("", [])}
              disabled={isGenerating}
              className={`w-full ${isGenerating ? "*:animate-spin" : ""}`}
            >
              {isGenerating ? "Styling your day…" : "Generate new outfit"}
            </Button>
          </WeatherCard>
        </div>

        <OutfitPreview
          items={items}
          isSaved={isSaved}
          isFavorite={isFavorite}
          isGenerating={isGenerating}
          onFavorite={toggleFavorite}
          onSave={save}
          onSwap={setActiveSlot}
        >
          <OutfitPrompt
            wardrobe={wardrobe}
            isGenerating={isGenerating}
            onSubmit={generate}
          />
        </OutfitPreview>
      </div>

      {/* Picker opens for whichever piece is being swapped */}
      {activeSlot && (
        <ItemPicker
          slot={activeSlot}
          wardrobe={wardrobe}
          currentId={outfit[activeSlot]}
          onApply={changeItem}
          onClose={closePicker}
        />
      )}

      {/* Short message after an action */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`fixed right-4 bottom-24 left-4 z-40 mx-auto flex w-fit max-w-[calc(100%-32px)] items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-lg transition-all lg:right-8 lg:bottom-7 lg:left-auto ${notice ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
      >
        {notice && (
          <>
            <Check
              size={17}
              className="shrink-0 text-brand"
              aria-hidden="true"
            />
            <span>{notice}</span>
          </>
        )}
      </div>
    </>
  );
}
