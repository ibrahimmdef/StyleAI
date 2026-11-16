import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { STYLIST } from "../shared/catalog.js";

const router = Router();
const MODEL = "gemini-3.5-flash-lite";
const NONE = "none";

// Our code only removes what must never go in. The taste is the model's job.
const INSTRUCTIONS = `You are ${STYLIST}, the stylist inside StyleAI. You put together one outfit from a person's own wardrobe.
For each slot you get the pieces that are allowed there. Pick one piece per slot by its id.
Slots marked "required" must get a piece. Optional slots can be "none" when the outfit is better without them.
Think like a real stylist: colors that work together, a consistent style, the weather and the occasion.
The person's preferred styles, liked colors and the current season are hints, not rules. Follow them by default,
but let the request win: "gym" means sporty pieces, "wedding" means the smartest ones, whatever the preferences say.
Each piece lists the seasons it is for. In the cold, prefer warm pieces; in the heat, prefer light ones.
If a current outfit is given, make the new one clearly different: change at least two pieces when you can.
Then reply to the person in one or two short sentences (under 30 words), casual and warm,
like a stylist friend texting back. Answer what they asked for, if they asked something,
and say in a few words why the outfit works.`;

// Only these ids (or "none" for optional slots) can come back, so the model can't make up pieces
function buildSchema(slots) {
  const picks = {};
  for (const [slot, { required, items }] of Object.entries(slots)) {
    const ids = items.map((item) => String(item.id));
    picks[slot] = { type: "string", enum: required ? ids : [...ids, NONE] };
  }
  return {
    type: "object",
    properties: {
      picks: {
        type: "object",
        properties: picks,
        required: Object.keys(picks),
      },
      reply: { type: "string" },
    },
    required: ["picks", "reply"],
  };
}

// New order every time, so the model doesn't just favor whatever comes first
function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

// Just what the model needs to know about a piece, to keep the request small
function describe(item) {
  return {
    id: String(item.id),
    name: item.name,
    type: item.type,
    color: item.color,
    styles: item.styles,
    seasons: item.seasons,
  };
}

router.post("/ai/outfit", async (req, res) => {
  const { request, temp, slots, current, person } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: "AI is not set up" });
  }
  if (!slots || typeof slots !== "object") {
    return res.status(400).json({ message: "slots are required" });
  }
  // Empty slots are left out: there's nothing to pick
  const filled = Object.fromEntries(
    Object.entries(slots).filter(([, slot]) => slot.items?.length),
  );
  if (Object.keys(filled).length === 0) {
    return res.status(400).json({ message: "Nothing to pick from" });
  }

  const input = JSON.stringify({
    request: typeof request === "string" ? request.slice(0, 300) : "",
    temperatureC: temp,
    person: {
      styles: Array.isArray(person?.styles) ? person.styles : [],
      likedColors: Array.isArray(person?.likedColors) ? person.likedColors : [],
      season: typeof person?.season === "string" ? person.season : "",
    },
    currentOutfit: Array.isArray(current) ? current.map(String) : [],
    slots: Object.fromEntries(
      Object.entries(filled).map(([slot, { required, items }]) => [
        slot,
        { required: Boolean(required), items: shuffle(items).map(describe) },
      ]),
    ),
  });

  try {
    const client = new GoogleGenAI({});
    const interaction = await client.interactions.create({
      model: MODEL,
      system_instruction: INSTRUCTIONS,
      input,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: buildSchema(filled),
      },
      // Don't keep the wardrobe on Google's side
      store: false,
    });

    const answer = JSON.parse(interaction.output_text);

    // Check it anyway: every pick must be one of the pieces we sent
    const picks = {};
    for (const [slot, { required, items }] of Object.entries(filled)) {
      const id = answer.picks?.[slot];
      const item = items.find((item) => String(item.id) === id);
      if (!item && (required || id !== NONE)) {
        return res.status(502).json({ message: `Bad pick for ${slot}` });
      }
      picks[slot] = item ? item.id : null;
    }

    res.json({ picks, reply: String(answer.reply ?? "") });
  } catch (err) {
    console.error("AI ERROR:", err.message);
    // 429 = the free daily limit is used up
    const status = err.status === 429 ? 429 : 502;
    res.status(status).json({ message: "AI could not pick an outfit" });
  }
});

export default router;
