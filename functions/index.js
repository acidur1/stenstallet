const { onSchedule } = require("firebase-functions/v2/scheduler");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const webpush = require("web-push");

admin.initializeApp();
const db = admin.firestore();

const VAPID_PUBLIC_KEY  = defineSecret("VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = defineSecret("VAPID_PRIVATE_KEY");

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
