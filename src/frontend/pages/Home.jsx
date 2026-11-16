import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { Brand } from "../components/Sidebar";
import { Button } from "../components/Buttons";
import OutfitPreview from "../components/OutfitPreview";
import ItemPicker from "../components/ItemPicker";
import OutfitPrompt from "../components/OutfitPrompt";
import WeatherCard, { loadWeather } from "../components/WeatherCard";
import {
  allowedColor,
  boostColors,
  fitsSeason,
  fitsStyle,
  getSeason,
  matchedStyles,
  needsLayer,
  preferWhere,
} from "../../shared/rules";
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
import { API_URL } from "../api";

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
  const [preferences, setPreferences] = useState(null);
  const [outfit, setOutfit] = useState(() => readStorage(STORAGE.outfit, {}));
  const [saved, setSaved] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeSlot, setActiveSlot] = useState(null);
  // The chat with Stella, newest last: [{ question, answer }]
  const [chat, setChat] = useState([]);
  const [hasOpened, setHasOpened] = useState(false);
  const noticeTimer = useRef();

  useEffect(
    () => () => {
      clearTimeout(noticeTimer.current);
    },
    [],
  );

  useEffect(() => {
    writeStorage(STORAGE.outfit, outfit);
  }, [outfit]);

  // Load the real wardrobe from the backend
  useEffect(() => {
    fetch(`${API_URL}/api/Items`)
      .then((res) => res.json())
      .then((data) =>
        setWardrobe(data.map((item) => ({ ...item, slot: getSlot(item) }))),
      )
      .catch(() => notify("Could not load your wardrobe."));
  }, []);

  // Saved outfits, so we know if the one on screen is saved or a favorite
  useEffect(() => {
    fetch(`${API_URL}/api/outfits`)
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

  // Unit, cold tolerance and the rest, from the Preferences page
  useEffect(() => {
    fetch(`${API_URL}/api/preferences`)
      .then((res) => res.json())
      .then((data) => setPreferences(data))
      // No preferences is fine, Stella just gets no hints
      .catch(() => setPreferences({}));
  }, []);

  // Stella says hi once the wardrobe, weather and preferences are in.
  // Picking today's outfit costs an AI call, so she only does it once a day.
  useEffect(() => {
    const ready =
      wardrobe.length > 0 && (weather || weatherFailed) && preferences;
    if (!ready || hasOpened) return;
    setHasOpened(true);

    const today = new Date().toDateString();
    if (readStorage(STORAGE.outfitDay, "") === today) {
      setChat([
        {
          question: "",
          answer: `${hello()} Today's fit is ready. Want something different? Just ask.`,
        },
      ]);
      return;
    }
    writeStorage(STORAGE.outfitDay, today);
    generate("", [], true);
  }, [wardrobe, weather, weatherFailed, preferences, hasOpened]);

  // The name stays here, it isn't sent to the AI
  function hello() {
    return `${greeting(new Date().getHours())}, ${profile?.name || "there"}!`;
  }

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

  // What may go in each slot. Only the hard rules apply here: pinned pieces,
  // avoided colors and a layer when it's cold. Everything else is the AI's call.
  function allowedPieces(pinnedIds) {
    const slots = {};
    const cold = weather
      ? needsLayer(weather.temp, preferences?.coldTolerance)
      : false;

    for (const slot of SLOTS) {
      // A pinned piece for this slot wins
      const pinned = wardrobe.filter(
        (item) => item.slot === slot && pinnedIds.includes(item.id),
      );
      if (pinned.length) {
        slots[slot] = { required: true, items: pinned };
        continue;
      }

      // Avoided colors never go in. Pinned pieces above still do, the user picked them.
      const items = wardrobe.filter(
        (item) =>
          item.slot === slot && allowedColor(item, preferences?.avoidColors),
      );
      // Cold: a layer must go in. Warm: the AI may still add a light one.
      const required =
        slot === "outerwear" ? cold : !OPTIONAL_SLOTS.includes(slot);
      slots[slot] = { required, items, cold };
    }
    return slots;
  }

  // No AI, or it failed: our own pick. Without the AI's judgment the rules
  // are stricter here: season and styles first, liked colors more often.
  function randomPicks(slots) {
    const season = getSeason();
    const picks = {};
    for (const [slot, { required, items, cold }] of Object.entries(slots)) {
      const inSeason = preferWhere(items, (item) => fitsSeason(item, season));
      const options = preferWhere(inSeason, (item) =>
        fitsStyle(item, preferences?.styles),
      );
      // Optional pieces go in a bit more than half the time. No layer when it's warm.
      let skip = !required && Math.random() < 0.4;
      if (slot === "outerwear" && weather && !cold) skip = true;
      // Liked colors have two tickets in the draw
      const draw = boostColors(options, preferences?.colors);
      picks[slot] =
        draw.length && !skip
          ? draw[Math.floor(Math.random() * draw.length)].id
          : null;
    }
    return picks;
  }

  // Puts the answer in place of the "styling…" message at the end of the chat
  function answer(question, text) {
    setChat((list) => [...list.slice(0, -1), { question, answer: text }]);
  }

  // Asks the AI first. If it isn't set up, is over its daily limit or fails,
  // the random pick takes over for the button and the daily pick.
  // `opening` is the daily pick when the page opens.
  async function generate(prompt, pinnedIds, opening = false) {
    if (isGenerating) return;
    if (wardrobe.length === 0) {
      notify("Add some clothes to your wardrobe first.");
      return;
    }

    setIsGenerating(true);
    // The last few messages go along, so Stella gets follow-ups like "something warmer?".
    // Only typed questions: the greeting has the person's name in it, that stays here.
    const history = chat
      .filter((message) => message.question && message.answer)
      .slice(-3);
    // Question shows right away, the answer fills in when it comes
    setChat([...chat, { question: prompt, answer: null }].slice(-10));
    const slots = allowedPieces(pinnedIds);
    try {
      const res = await fetch(`${API_URL}/api/ai/outfit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request: prompt,
          opening,
          temp: weather?.temp,
          slots,
          // Hints, not rules: the AI weighs them against the request
          person: {
            styles: preferences?.styles ?? [],
            likedColors: preferences?.colors ?? [],
            avoidColors: preferences?.avoidColors ?? [],
            season: getSeason(),
          },
          // So the AI gives something new instead of the same outfit again
          current: Object.values(outfit).filter(Boolean),
          history,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      // A question gets only an answer, the outfit on screen stays
      if (data.outfit) {
        const next = {};
        for (const slot of SLOTS) next[slot] = data.picks[slot] ?? null;
        setOutfit(next);
      }
      const reply = data.reply || "Here's a fresh one from your wardrobe.";
      answer(prompt, opening ? `${hello()} ${reply}` : reply);
    } catch {
      // A typed message might not be asking for an outfit, so don't guess
      if (prompt) {
        answer(
          prompt,
          "I can't think straight right now, sorry. Tap Generate new outfit for a quick pick.",
        );
        return;
      }
      setOutfit(randomPicks(slots));
      answer(
        prompt,
        opening
          ? `${hello()} I picked today's outfit for you.`
          : "Here's a fresh one from your wardrobe.",
      );
    } finally {
      setIsGenerating(false);
    }
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
      const res = await fetch(`${API_URL}/api/outfits`, {
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
      const res = await fetch(`${API_URL}/api/outfits/${savedEntry.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !isFavorite }),
      });
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

  // For "Why this outfit?": the user's styles that are really in this outfit
  const pieces = Object.values(items).filter(Boolean);
  const styleMatch = matchedStyles(pieces, preferences?.styles);

  // The device's own time zone, so the date matches the greeting
  const date = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
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
            unit={preferences?.unit}
            hasLayer={Boolean(items.outerwear)}
            styles={styleMatch}
            isEmpty={pieces.length === 0}
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
            chat={chat}
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
          onPick={(id) => changeItem(activeSlot, id)}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {/* Short message after an action */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`fixed right-4 bottom-24 left-4 z-40 mx-auto flex w-fit max-w-[calc(100%-32px)] items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm shadow-lg transition-all lg:right-8 lg:bottom-7 lg:left-auto ${notice ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
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
