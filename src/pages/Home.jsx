import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Cloud,
  CloudSun,
  MapPin,
  Sun,
  Layers2,
  Palette,
} from "lucide-react";
import { Brand } from "../components/Sidebar";
import OutfitPreview from "../components/OutfitPreview";
import ItemPicker from "../components/ItemPicker";
import {
  defaultOutfit,
  itemById,
  outfitPresets,
  normalizeOutfit,
  outfitKey,
  readStorage,
  replaceSlot,
  writeStorage,
} from "../data";

// HOME: seçimlər, dəyişmə, generasiya, saxlama və səhifənin görünüşü.
export default function Home() {
  const [outfit, setOutfit] = useState(() =>
    normalizeOutfit(readStorage("styleai.outfit.v1", defaultOutfit)),
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

  // Bildiriş və geyim dəyişmə əməliyyatları.
  function notify(message) {
    clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = setTimeout(() => setNotice(""), 3500);
  }

  function changeItem(slot, id) {
    setOutfit((current) => replaceSlot(current, slot, id));
    notify(
      id ? "Your outfit has been updated." : "Item removed from your outfit.",
    );
  }

  // Sonradan burada backend / AI sorğusunu qoşa bilərsən.
  function generate() {
    if (isGenerating) return;
    setIsGenerating(true);
    // Local curated suggestions. Replace this with your backend / AI request.
    generateTimer.current = setTimeout(() => {
      setOutfit((current) => {
        const candidates = outfitPresets.filter(
          (preset) => outfitKey(preset) !== outfitKey(current),
        );
        return { ...candidates[Math.floor(Math.random() * candidates.length)] };
      });
      setIsGenerating(false);
      notify("A fresh combination, from your wardrobe.");
    }, 550);
  }

  // Saxlanmış kombin və favorit vəziyyəti.
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
    Object.entries(outfit).map(([slot, id]) => [slot, itemById[id] ?? null]),
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

      {/* Salamlaşma və tarix */}
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

      {/* Solda hava və izahlar, sağda kombin */}
      <div className="grid items-stretch gap-5 min-[1150px]:grid-cols-[270px_minmax(0,1fr)] min-[1400px]:grid-cols-[290px_minmax(0,1fr)]">
        <div className="grid gap-5 sm:grid-cols-2 min-[1150px]:flex min-[1150px]:flex-col">
          <WeatherCard />
          <OutfitReasons hasLayer={Boolean(items.outerwear)} />
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

      {/* Hansı geyim dəyişirsə, seçim pəncərəsi onu açır */}
      {activeSlot && (
        <ItemPicker
          slot={activeSlot}
          currentId={outfit[activeSlot]}
          onApply={changeItem}
          onClose={closePicker}
        />
      )}

      {/* Əməliyyatdan sonra qısa bildiriş */}
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

// Hava kartı — yalnız bu səhifədə istifadə olunur.
const hours = [
  { time: "12 PM", temperature: 19, icon: CloudSun },
  { time: "3 PM", temperature: 20, icon: CloudSun },
  { time: "6 PM", temperature: 17, icon: Cloud },
];

function WeatherSymbol({ compact = false }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center ${compact ? "size-9" : "size-[76px]"}`}
      aria-hidden="true"
    >
      <Sun
        className={`absolute text-[#f7bf48] ${compact ? "top-0 left-0 size-6" : "top-0 left-0 size-12"}`}
        fill="#ffd475"
        strokeWidth={1.5}
      />
      <Cloud
        className={`absolute text-[#b7d3ef] drop-shadow-sm ${compact ? "right-0 bottom-0 size-8" : "right-0 bottom-1 size-16"}`}
        fill="#e4effa"
        strokeWidth={1.4}
      />
    </span>
  );
}

function WeatherCard() {
  return (
    <section
      aria-label="Baku weather, sample forecast"
      className="rounded-[14px] border border-[#d6eaff] bg-[linear-gradient(145deg,#edf8ff,#dff1ff_50%,#f2faff)] p-5 xl:p-6"
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MapPin
          size={18}
          fill="#5977a3"
          strokeWidth={1.5}
          className="text-[#5977a3]"
        />
        <span>Baku</span>
        <span
          title="Illustrative forecast; connect your weather service here"
          className="ml-auto text-[9px] font-normal tracking-wide text-muted/80"
        >
          SAMPLE
        </span>
      </div>
      <div className="mt-6 flex items-center gap-4">
        <WeatherSymbol />
        <div>
          <p className="text-[34px] leading-none font-semibold tracking-tight">
            18°C
          </p>
          <p className="mt-2 text-[13px]">Partly cloudy</p>
          <p className="mt-2 text-xs text-muted">
            H: 20° <span className="mx-2 text-[#b0c9e7]">·</span> L: 13°
          </p>
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 divide-x divide-[#cfe3f5] border-t border-[#cfe3f5] pt-4">
        {hours.map(({ time, temperature, icon: Icon }) => (
          <div key={time} className="flex flex-col items-center gap-2.5">
            <span className="text-[11px] text-muted">{time}</span>
            <Icon
              size={26}
              strokeWidth={1.5}
              className="text-[#8cafce]"
              aria-hidden="true"
            />
            <span className="text-sm font-semibold">{temperature}°</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Kombinin qısa izahları.
function OutfitReasons({ hasLayer }) {
  const reasons = [
    { icon: Cloud, text: "Comfortable for 18°C" },
    { icon: Palette, text: "Matches your casual style" },
    {
      icon: Layers2,
      text: hasLayer
        ? "Easy layers for the evening"
        : "A light look for a mild day",
    },
  ];
  return (
    <section
      aria-labelledby="outfit-reasons-title"
      className="flex-1 rounded-[14px] border border-line bg-white/90 p-5 xl:p-6"
    >
      <h2 id="outfit-reasons-title" className="text-base font-semibold">
        Why this outfit?
      </h2>
      <ul className="mt-6 flex flex-col gap-6">
        {reasons.map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#eaf4ff] text-brand">
              <Icon size={21} strokeWidth={1.6} aria-hidden="true" />
            </span>
            <span className="text-[12px] leading-5 xl:text-[13px]">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
