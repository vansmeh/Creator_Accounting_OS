import express from "express";
import OpenAI   from "openai";

const router = express.Router();

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set in server/.env");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function chat(system, user) {
  const client = getClient();
  const resp   = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user",   content: user },
    ],
    temperature: 0.7,
  });
  return resp.choices[0].message.content.trim();
}

function tryParseJson(text) {
  // Strip markdown code blocks if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return cleaned;
  }
}

// ── Route 1: Scan Contract ─────────────────────────────────────────────────────
router.post("/scan-contract", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "text is required" });

    const system = `You are a contract lawyer specializing in creator economy agreements in India.
Analyze the following brand deal contract or email for red flags.
Look for: exclusivity clauses, usage rights beyond 1 year, kill fees,
payment terms beyond 30 days, IP ownership grabs, non-compete clauses.
Return a JSON array of flags: [{"severity":"high|medium|low","clause":"string","risk":"string","suggestion":"string"}]
Be specific. No fluff. Return only valid JSON.`;

    const raw    = await chat(system, text);
    const result = tryParseJson(raw);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Route 2: Benchmark Rate ────────────────────────────────────────────────────
router.post("/benchmark-rate", async (req, res) => {
  try {
    const { deliverable, niche, followers, platform } = req.body;

    const system = `You are a creator economy analyst with current knowledge of Indian influencer
market rates in 2025-2026.
Given: deliverable type, niche, follower count, platform.
Return JSON: {"lowEnd":number,"midRange":number,"highEnd":number,"currency":"INR","reasoning":"string","tips":["string"]}
Base on real market data. Be direct. No disclaimers. Return only valid JSON.`;

    const user   = `Deliverable: ${deliverable}\nNiche: ${niche}\nFollowers: ${followers}\nPlatform: ${platform}`;
    const raw    = await chat(system, user);
    const result = tryParseJson(raw);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Route 3: Research Brand ────────────────────────────────────────────────────
router.post("/research-brand", async (req, res) => {
  try {
    const { brandName } = req.body;
    if (!brandName?.trim()) return res.status(400).json({ message: "brandName is required" });

    const system = `You are a creator economy researcher. Given a brand name:
1. Describe what they do and their creator marketing strategy
2. Typical deal sizes they offer creators in India (INR)
3. Payment reputation (fast/slow/problematic) if known
4. Red flags or green flags working with them
5. Negotiation leverage points for a creator
Return JSON: {
  "about":"string",
  "typicalDealRange":{"low":number,"high":number},
  "paymentReputation":"good|mixed|poor|unknown",
  "redFlags":["string"],
  "greenFlags":["string"],
  "negotiationTips":["string"]
}
Return only valid JSON.`;

    const raw    = await chat(system, `Brand name: ${brandName}`);
    const result = tryParseJson(raw);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Route 4: Rewrite Reminder ──────────────────────────────────────────────────
router.post("/rewrite-reminder", async (req, res) => {
  try {
    const { brandName, amount, deliverable, daysOverdue, tone, dealHistory } = req.body;

    const system = `You are a professional communication expert for Indian content creators.
Write a payment reminder message for WhatsApp.
Tone: ${tone} (polite = warm but firm, firm = direct and professional, final = serious, implies consequences)
Rules:
- Under 100 words
- No emojis unless tone is polite
- No legal threats unless tone is final
- Sound human, not template-y
- End with clear call to action
Return only the message text, nothing else.`;

    const user = `Brand: ${brandName}
Amount: ₹${amount}
Deliverable: ${deliverable}
Days overdue: ${daysOverdue}
Additional context: ${dealHistory || "none"}`;

    const result = await chat(system, user);
    res.json({ result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Route 5: Forecast Cash ─────────────────────────────────────────────────────
router.post("/forecast-cash", async (req, res) => {
  try {
    const { deals, income } = req.body;

    const system = `You are a financial analyst. Given a list of brand deals (with amounts, due dates, status)
and income entries, forecast when money will actually arrive.
Assume average payment delay of 15 days beyond due date for first-time brands, 7 days for known brands.
Return JSON: {
  "next30Days":number,
  "next60Days":number,
  "next90Days":number,
  "atRisk":number,
  "recommendations":["string"],
  "timeline":[{"date":"string","expectedAmount":number,"dealOrSource":"string"}]
}
Return only valid JSON.`;

    const user = `Deals: ${JSON.stringify(deals?.slice(0, 20))}
Income: ${JSON.stringify(income?.slice(0, 20))}`;

    const raw    = await chat(system, user);
    const result = tryParseJson(raw);
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
