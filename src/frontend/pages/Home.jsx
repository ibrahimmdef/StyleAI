import { useCallback, useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
import { Brand } from "../components/Sidebar";
import OutfitPreview from "../components/OutfitPreview";
import ItemPicker from "../components/ItemPicker";
import WeatherCard, { loadWeather } from "../components/WeatherCard";
import { fitsSeason, getSeason, needsLayer } from "../../shared/rules";
import {
  OPTIONAL_SLOTS,
  SLOTS,
  getSlot,
  outfitKey,
  readStorage,
  writeStorage,
} from "../data";

// Home page: today's outfit, swapping pieces, generating, saving.
export default function Home() {
  const [wardrobe, setWardrobe] = useState([]);
  const [weather, setWeather] = useState(null);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const [outfit, setOutfit] = useState(() =>
    readStorage("styleai.outfit.v1", {}),
  );
  const [saved, setSaved] = useState(() => {
    const value = readStorage("styleai.saved.v1", []);
    return Array.isArray(value)
      ? value.filter(
          (entry) =>
            entry &&
            typeof entry.key === "string" &&
            entry.slots &&
            typeof entry.slots === "object",
        )
      : [];
  });
  const [favorites, setFavorites] = useState(() => {
    const value = readStorage("styleai.favorites.v1", []);
    return Array.isArray(value)
      ? value.filter((key) => typeof key === "string")
      : [];
  });
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
    writeStorage("styleai.outfit.v1", outfit);
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

  // Random outfit that fits today's season and temperature. The AI call can go here later.
  function generate() {
    if (isGenerating) return;
    if (wardrobe.length === 0) {
      notify("Add some clothes to your wardrobe first.");
      return;
    }
    setIsGenerating(true);
    generateTimer.current = setTimeout(() => {
      const season = getSeason();
      const next = {};

      for (const slot of SLOTS) {
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

  // Saved and favorite state for the current outfit
  const key = outfitKey(outfit);
  const isSaved = saved.some((entry) => entry.key === key);
  const isFavorite = favorites.includes(key);

  function save() {
    if (isSaved) {
      notify("This outfit is already saved.");
      return;
    }
    const next = [
      ...saved,
      { key, slots: outfit, savedAt: new Date().toISOString() },
    ];
    if (writeStorage("styleai.saved.v1", next)) {
      setSaved(next);
      notify("Outfit saved. A little inspiration for later.");
    } else
      notify("Could not save. Please allow browser storage and try again.");
  }

  function toggleFavorite() {
    const next = isFavorite
      ? favorites.filter((value) => value !== key)
      : [...favorites, key];
    if (writeStorage("styleai.favorites.v1", next)) {
      setFavorites(next);
      notify(isFavorite ? "Removed from favorites." : "Added to favorites.");
    } else notify("Could not update favorites. Please allow browser storage.");
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
            Good morning, User
          </h1>
          <p className="mt-1.5 text-[13px] leading-5 text-muted">
            Here’s your outfit recommendation for today.
          </p>
        </div>
        <time className="pt-1 text-[11px] text-muted">{date}</time>
      </header>

      {/* Weather on the left, outfit on the right */}
      <div className="grid items-stretch gap-5 min-[1150px]:grid-cols-[270px_minmax(0,1fr)] min-[1400px]:grid-cols-[290px_minmax(0,1fr)]">
        <div className="grid gap-5 sm:grid-cols-2 min-[1150px]:flex min-[1150px]:flex-col">
          <WeatherCard
            weather={weather}
            failed={weatherFailed}
            hasLayer={Boolean(items.outerwear)}
          />
        </div>

        <OutfitPreview
          items={items}
          isSaved={isSaved}
          isFavorite={isFavorite}
          isGenerating={isGenerating}
          onFavorite={toggleFavorite}
          onSave={save}
          onGenerate={generate}
          onSwap={setActiveSlot}
        />
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
