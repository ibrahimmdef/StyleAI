import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import { STYLIST } from "../shared/catalog.js";

const router = Router();
const MODEL = "gemini-3.5-flash-lite";
const NONE = "none";

// Our code only removes what must never go in. The taste, and the talking, is the model's job.
const INSTRUCTIONS = `You are ${STYLIST}, the stylist inside StyleAI. You know this person's wardrobe and help them dress from it.

First work out what the person wants:
- "opening" is true: they just opened the app. Pick today's outfit for them, and in your reply say you picked
  today's fit and why it suits today's weather. Don't greet them, the app already says hello.
- Empty request: they pressed "Generate new outfit". Make a new outfit.
- They ask for an outfit or for something to wear ("a fit for dinner", "what should I wear to the gym",
  "something comfy for tonight"): make an outfit.
- Anything else (hi, thanks, a question about their wardrobe, a comment, a plan without asking what to wear):
  set "outfit" to false, just answer, and pick "none" everywhere. Never change their outfit when they didn't ask
  for one. If it sounds like they might want one, offer it.
  Example: "going to a wedding on saturday" is a plan, not a request. Answer and offer to pick something.

When you make an outfit:
- For each slot you get the pieces allowed there. Pick one per slot by id.
- Slots marked "required" must get a piece. Optional slots can be "none" when the outfit is better without them.
- Think like a real stylist: colors that work together, one consistent style, the weather and the occasion.
- The person's preferred styles, liked colors and the season are hints, not rules. The request wins:
  "gym" needs sporty pieces, "wedding" needs the smartest ones.
- In the cold, prefer warm pieces; in the heat, light ones. Each piece lists the seasons it is for.
- If a current outfit is given, change at least two pieces when you can.

Be honest about the wardrobe:
- Never call a piece something it isn't. A leather jacket is not gym wear.
- If the wardrobe has nothing that really fits the request, say so and name what's missing
  (for example "you don't have any sportswear yet, add some joggers and trainers").
  If something is close enough, make the closest outfit and say it's a compromise.
  If nothing is close, set "outfit" to false.
- Slots listed in "emptySlots" have no pieces at all. Colors in "avoidedColors" are hidden on purpose.

"earlierMessages" are the last few messages of this chat, oldest first. Use them for follow-ups:
"something warmer?" or "swap the shoes" are about the outfit you just made.

Your reply: talk to the person like a stylist friend texting back, casual and warm, in their language.
Keep it short: one to three sentences, under 60 words. No lists, no markdown.`;

// Only these ids (or "none") can come back, so the model can't make up pieces.
// Required slots are checked in code, because in question mode nothing is picked.
function buildSchema(slots) {
  const picks = {};
  for (const [slot, { items }] of Object.entries(slots)) {
    picks[slot] = {
      type: "string",
      enum: [...items.map((item) => String(item.id)), NONE],
    };
  }
  return {
    type: "object",
    properties: {
      outfit: { type: "boolean" },
      picks: {
        type: "object",
        properties: picks,
        required: Object.keys(picks),
      },
      reply: { type: "string" },
    },
    required: ["outfit", "picks", "reply"],
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

// Keeps only the strings in a list, so odd input can't end up in the prompt
function strings(list) {
  return Array.isArray(list)
    ? list.filter((value) => typeof value === "string")
    : [];
}

router.post("/ai/outfit", async (req, res) => {
  const { request, temp, slots, current, person, opening, history } = req.body;

  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ message: "AI is not set up" });
  }
  if (!slots || typeof slots !== "object") {
    return res.status(400).json({ message: "slots are required" });
  }
  // Empty slots are left out of the picks, but the model hears about them
  const filled = Object.fromEntries(
    Object.entries(slots).filter(([, slot]) => slot.items?.length),
  );
  const emptySlots = Object.keys(slots).filter((slot) => !filled[slot]);
  if (Object.keys(filled).length === 0) {
    return res.status(400).json({ message: "Nothing to pick from" });
  }

  const input = JSON.stringify({
    opening: opening === true,
    request: typeof request === "string" ? request.slice(0, 300) : "",
    temperatureC: temp,
    person: {
      styles: strings(person?.styles),
      likedColors: strings(person?.likedColors),
      avoidedColors: strings(person?.avoidColors),
      season: typeof person?.season === "string" ? person.season : "",
    },
    currentOutfit: Array.isArray(current) ? current.map(String) : [],
    earlierMessages: (Array.isArray(history) ? history : [])
      .slice(-3)
      .map((message) => ({
        person: String(message?.question ?? "").slice(0, 300),
        you: String(message?.answer ?? "").slice(0, 400),
      })),
    emptySlots,
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
      // The default is "minimal", nearly no thinking. A bit more makes the answers smarter.
      generation_config: { thinking_level: "medium" },
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: buildSchema(filled),
      },
      // Don't keep the wardrobe on Google's side
      store: false,
    });

    const answer = JSON.parse(interaction.output_text);
    const reply = String(answer.reply ?? "");

    // Just talking, the outfit on screen stays
    if (!answer.outfit) {
      return res.json({ outfit: false, reply });
    }

    // Check it anyway: every pick must be one we sent, and required slots filled
    const picks = {};
    for (const [slot, { required, items }] of Object.entries(filled)) {
      const id = answer.picks?.[slot];
      const item = items.find((item) => String(item.id) === id);
      if (!item && (required || id !== NONE)) {
        return res.status(502).json({ message: `Bad pick for ${slot}` });
      }
      picks[slot] = item ? item.id : null;
    }

    res.json({ outfit: true, picks, reply });
  } catch (err) {
    console.error("AI ERROR:", err.message);
    // 429 = the free daily limit is used up
    const status = err.status === 429 ? 429 : 502;
    res.status(status).json({ message: "AI could not pick an outfit" });
  }
});

export default router;
