import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();
const MODEL = "gemini-3.5-flash-lite";
const NONE = "none";

// The rules already decided what is allowed. The model only picks what looks good together.
const INSTRUCTIONS = `You style one outfit from a person's own wardrobe.
For each slot you get the pieces that are allowed there. Pick one piece per slot by its id.
Slots marked "required" must get a piece. Optional slots can be "none" if the outfit looks better without them.
Pick pieces whose colors and styles go well together and that suit the person's request, if there is one.
If a current outfit is given, make the new one clearly different: change at least two pieces when the allowed pieces make that possible.
Then write one short, friendly sentence (under 20 words) on why the outfit works.`;

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
      reason: { type: "string" },
    },
    required: ["picks", "reason"],
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
  };
}

router.post("/ai/outfit", async (req, res) => {
  const { request, temp, slots, current } = req.body;

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

    res.json({ picks, reason: String(answer.reason ?? "") });
  } catch (err) {
    console.error("AI ERROR:", err.message);
    // 429 = the free daily limit is used up
    const status = err.status === 429 ? 429 : 502;
    res.status(status).json({ message: "AI could not pick an outfit" });
  }
});

export default router;
