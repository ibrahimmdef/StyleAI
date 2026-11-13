import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Layers2,
  MapPin,
  Palette,
  Sun,
} from "lucide-react";

const cardClass =
  "rounded-[14px] border border-[#d6eaff] bg-[linear-gradient(145deg,#edf8ff,#dff1ff_50%,#f2faff)] p-5 xl:p-6";

// Turns the weather code (a number) into an icon and a label
function getWeatherInfo(code) {
  if (code === 0) return { icon: Sun, label: "Clear", color: "#f7bf48" };
  if (code <= 2)
    return { icon: CloudSun, label: "Partly cloudy", color: "#f7bf48" };
  if (code === 3) return { icon: Cloud, label: "Overcast", color: "#8cafce" };
  if (code <= 48) return { icon: CloudFog, label: "Foggy", color: "#8cafce" };
  if (code <= 57)
    return { icon: CloudDrizzle, label: "Drizzle", color: "#6f9bc4" };
  if (code <= 67) return { icon: CloudRain, label: "Rain", color: "#6f9bc4" };
  if (code <= 77) return { icon: CloudSnow, label: "Snow", color: "#9db8d6" };
  if (code <= 82)
    return { icon: CloudRain, label: "Showers", color: "#6f9bc4" };
  if (code <= 86)
    return { icon: CloudSnow, label: "Snow showers", color: "#9db8d6" };
  return { icon: CloudLightning, label: "Thunderstorm", color: "#7a86b8" };
}

function formatHour(h) {
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
}

// Gets the user's location, falls back to Baku if they say no
function getLocation() {
  const baku = { lat: 40.41, lon: 49.87, isFallback: true };
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(baku);
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          isFallback: false,
        }),
      () => resolve(baku),
      { timeout: 10000 },
    );
  });
}

// Weather card
function WeatherSection({ weather, failed, isFallback }) {
  if (failed) {
    return (
      <section className={cardClass}>
        <p className="text-sm text-muted">Weather is unavailable right now.</p>
      </section>
    );
  }

  if (!weather) {
    return (
      <section className={cardClass}>
        <p className="text-sm text-muted">Loading weather...</p>
      </section>
    );
  }

  const { icon: MainIcon, label, color } = getWeatherInfo(weather.code);

  return (
    <section aria-label="Weather forecast" className={cardClass}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <MapPin
          size={18}
          fill="#5977a3"
          strokeWidth={1.5}
          className="text-[#5977a3]"
        />
        <span>{isFallback ? "Baku" : "Your location"}</span>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <MainIcon
          className="size-19 shrink-0"
          style={{ color }}
          strokeWidth={1.3}
          aria-hidden="true"
        />
        <div>
          <p className="text-[34px] leading-none font-semibold tracking-tight">
            {weather.temp}°C
          </p>
          <p className="mt-2 text-[13px]">{label}</p>
          <p className="mt-2 text-xs text-muted">
            H: {weather.high}° <span className="mx-2 text-[#b0c9e7]">·</span> L:{" "}
            {weather.low}°
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 divide-x divide-[#cfe3f5] border-t border-[#cfe3f5] pt-4">
        {weather.hours.map(({ hour, temp, code }) => {
          const { icon: Icon, color } = getWeatherInfo(code);
          return (
            <div key={hour} className="flex flex-col items-center gap-2.5">
              <span className="text-[11px] text-muted">{formatHour(hour)}</span>
              <Icon
                size={26}
                strokeWidth={1.5}
                style={{ color }}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold">{temp}°</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Short reasons for the outfit ("Why this outfit?")
function OutfitReasons({ hasLayer, temp, children }) {
  const reasons = [
    {
      icon: Cloud,
      text:
        temp != null
          ? `Comfortable for ${temp}°C`
          : "Comfortable for today's weather",
    },
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
      className="flex flex-1 flex-col rounded-[14px] border border-line bg-white/90 p-5 xl:p-6"
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

      {/* Pushed to the bottom of the card */}
      <div className="mt-auto pt-6">{children}</div>
    </section>
  );
}

// Location + weather in one go. Home calls this, because the outfit needs the temperature too.
export async function loadWeather() {
  const { lat, lon, isFallback } = await getLocation();
  const res = await fetch(
    `http://localhost:5000/api/weather?lat=${lat}&lon=${lon}`,
  );
  if (!res.ok) throw new Error("Request failed");
  return { ...(await res.json()), isFallback };
}

// Main component: only shows the weather, Home gives it the data
export default function WeatherCard({ weather, failed, hasLayer, children }) {
  return (
    <>
      <WeatherSection
        weather={weather}
        failed={failed}
        isFallback={weather?.isFallback}
      />
      <OutfitReasons hasLayer={hasLayer} temp={weather?.temp}>
        {children}
      </OutfitReasons>
    </>
  );
}
