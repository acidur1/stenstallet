const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const webpush = require("web-push");
const { GoogleGenAI } = require("@google/genai");

admin.initializeApp();
const db = admin.firestore();

const VAPID_PUBLIC_KEY  = defineSecret("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = defineSecret("VAPID_PRIVATE_KEY");
const GEMINI_API_KEY    = defineSecret("GEMINI_API_KEY");

const DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

function getWeekKey(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const week = getISOWeek(date);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function getDayName(date) {
  const jsDay = date.getDay();
  const idx = jsDay === 0 ? 6 : jsDay - 1;
  return DAYS[idx];
}

async function sendReminder(mealId, mealLabel, mealTime) {
  webpush.setVapidDetails(
    "mailto:andreas.evekull@fortnox.se",
    VAPID_PUBLIC_KEY.value(),
    VAPID_PRIVATE_KEY.value()
  );

  const now = new Date();
  const dayName = getDayName(now);
  const weekKey = getWeekKey(now);

  const [assignDoc, personsDoc] = await Promise.all([
    db.doc(`config/assignments_${weekKey}`).get(),
    db.doc("config/persons").get(),
  ]);

  if (!assignDoc.exists) return;

  const personId = (assignDoc.data().map || {})[`${dayName}-${mealId}`];
  if (!personId) return;

  const persons = personsDoc.exists ? (personsDoc.data().list || []) : [];
  const person = persons.find(p => p.id === personId);
  const name = person ? person.name : "Du";

  const subsSnap = await db.collection("push_subscriptions")
    .where("personId", "==", personId)
    .get();

  if (subsSnap.empty) return;

  const payload = JSON.stringify({
    title: "🐴 Stenstallet",
    body: `${name}, påminnelse: ${mealLabel} kl ${mealTime} om 30 min!`,
  });

  await Promise.all(subsSnap.docs.map(async subDoc => {
    try {
      await webpush.sendNotification(JSON.parse(subDoc.data().subscription), payload);
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await subDoc.ref.delete();
      }
    }
  }));
}

const secrets = [VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY];

exports.remindMorgon = onSchedule(
  { schedule: "30 6 * * *", timeZone: "Europe/Stockholm", secrets },
  () => sendReminder("morgon", "Morgon", "07:00")
);
exports.remindLunch = onSchedule(
  { schedule: "30 11 * * *", timeZone: "Europe/Stockholm", secrets },
  () => sendReminder("lunch", "Lunch", "12:00")
);
exports.remindMiddag = onSchedule(
  { schedule: "30 16 * * *", timeZone: "Europe/Stockholm", secrets },
  () => sendReminder("middag", "Middag", "17:00")
);
exports.remindKvall = onSchedule(
  { schedule: "0 20 * * *", timeZone: "Europe/Stockholm", secrets },
  () => sendReminder("kvall", "Kväll", "20:30")
);

// ── Whiteboard sync ───────────────────────────────────────────────────────────
exports.parseWhiteboard = onRequest(
  { secrets: [GEMINI_API_KEY], cors: true, timeoutSeconds: 60, region: "europe-west1" },
  async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    const { imageBase64, mimeType, persons, meals, weekOffset } = req.body;
    if (!imageBase64 || !persons || !meals) return res.status(400).send("Missing fields");

    const personNames = persons.map(p => p.name).join(", ");
    const mealIds     = meals.map(m => m.id).join(", ");
    const days        = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

    const prompt = `Du ser ett handskrivet fodringsschema för ett stall på en whiteboard.

Kända personer i systemet: ${personNames}
Måltider: ${mealIds} (morgon, lunch, middag, kvall)
Veckodagar: ${days.join(", ")}

Analysera bilden och extrahera schemat. Returnera ENDAST ett JSON-objekt utan förklaringar eller markdown.

Format:
{
  "schedule": {
    "Mån-morgon": "PersonNamn",
    "Mån-lunch": "PersonNamn",
    "Mån-middag": "PersonNamn",
    "Mån-kvall": "PersonNamn",
    "Tis-morgon": "PersonNamn",
    ... (alla 28 kombinationer)
  },
  "confidence": "high|medium|low",
  "notes": "eventuella kommentarer om otydligheter"
}

Viktigt:
- Matcha namnen mot de kända personerna ovan (använd exakt stavning från listan)
- Om en cell är tom eller oläslig, sätt null
- "Box: X" är hästboxar, inte personer — sätt null för dessa
- Fokusera på den aktuella veckan om schemat visar flera veckor`;

    try {
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY.value() });

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [
            { text: prompt },
            { inlineData: { data: imageBase64, mimeType: mimeType || "image/jpeg" } },
          ]},
        ],
      });

      const text = result.text.trim();
      const json = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
      const parsed = JSON.parse(json);

      res.json(parsed);
    } catch (err) {
      console.error("parseWhiteboard error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);
