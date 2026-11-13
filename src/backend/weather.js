import { Router } from "express";

const router = Router();
const HOURS = [9, 15, 20];

router.get("/weather", async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ message: "lat and lon are required" });
  }

  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,weather_code` +
      `&daily=temperature_2m_max,temperature_2m_min` +
      `&hourly=temperature_2m,weather_code` +
      `&timezone=auto&forecast_days=1`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ message: "Weather service error" });
    }
    const data = await response.json();

    return res.json({
      temp: Math.round(data.current.temperature_2m),
      code: data.current.weather_code,
      high: Math.round(data.daily.temperature_2m_max[0]),
      low: Math.round(data.daily.temperature_2m_min[0]),
      hours: HOURS.map((h) => ({
        hour: h,
        temp: Math.round(data.hourly.temperature_2m[h]),
        code: data.hourly.weather_code[h],
      })),
    });
  } catch (err) {
    console.error("WEATHER ERROR:", err);
    if (res.headersSent) return;
    return res.status(500).json({ message: "Something went wrong" });
  }
});
console.log("Weather route initialized");

export default router;
