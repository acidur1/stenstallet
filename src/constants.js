export const DAYS       = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];
export const DAYS_SHORT = ["M","T","O","T","F","L","S"];
export const SV_MONTHS      = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
export const SV_MONTHS_FULL = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
export const DAYS_FULL      = ["Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag","Söndag"];

export const MEALS = [
  { id: "morgon", label: "Morgon", icon: "🔆", time: "07:00" },
  { id: "lunch",  label: "Lunch",  icon: "🌤", time: "12:00" },
  { id: "middag", label: "Middag", icon: "☀️", time: "17:00" },
  { id: "kvall",  label: "Kväll",  icon: "🌙", time: "20:30" },
];

export const PERSON_COLORS = [
  "#e8624a","#3b9edd","#2eaa6e","#b05cc8","#e8a32a","#e8607a","#4ab8c4","#7b9de8",
];
export const HORSE_COLORS = ["#e8a32a","#7b9de8","#e8624a","#2eaa6e","#b05cc8","#4ab8c4"];

export const DEFAULT_PERSONS = [
  { id: 1, name: "Anna", color: PERSON_COLORS[0] },
  { id: 2, name: "Erik", color: PERSON_COLORS[1] },
  { id: 3, name: "Sara", color: PERSON_COLORS[2] },
];
export const DEFAULT_HORSES = [
  { id: 1, name: "Askungen",      color: HORSE_COLORS[0], note: "Låg energi, lite hö" },
  { id: 2, name: "Silverblixten", color: HORSE_COLORS[1], note: "Känslig mage" },
  { id: 3, name: "Röda Vinden",   color: HORSE_COLORS[2], note: "Extra kraftfoder" },
];

export const buildDefaultAssignments = (persons) => {
  const a = {};
  const pids = persons.map(p => p.id);
  DAYS.forEach((d, di) => MEALS.forEach((m, mi) => {
    a[`${d}-${m.id}`] = pids[(di + mi) % pids.length];
  }));
  return a;
};

export const getWeekDates = (offset) => {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7;
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + offset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};
export const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};
export const getWeekKey = (offset) => {
  const dates = getWeekDates(offset);
  const mon = dates[0];
  return `${mon.getFullYear()}-W${String(getISOWeek(mon)).padStart(2, "0")}`;
};
export const fmtDate = (d) => `${d.getDate()} ${SV_MONTHS[d.getMonth()]}`;

export const VAPID_PUBLIC_KEY = "BNcRyxOvZ2UYo10fOVBuZ4N1sdWLCL_5X7eU6r_W0vZ2uBGaOMrXOrvB5-mjKwnrPb_WY-AnVOOiVvB7YdFSlZo";
export const urlBase64ToUint8Array = (b64) => {
  const padding = "=".repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
};

export const THEMES = {
  dark: {
    bg:"#0f1117", bgGrad:"#0f1117",
    headerBg:"#1a1d27", headerBorder:"#2e3347",
    cardBg:"#1a1d27", cardBorder:"#2e3347",
    cardBgDone:"#162318", cardBorderDone:"#2a6040",
    rowBorder:"#22253a", inputBg:"#12141e", inputBorder:"#2e3347",
    pickerBg:"#12141e", pickerBorder:"#22253a",
    subtleBorder:"#2e3347", checkBg:"#12141e",
    text:"#f0f2f8", textMuted:"#8892aa", textFaint:"#4a5270",
    accent:"#4db8d4", accentBg:"#1a3a45",
    tabActiveBg:"#2563eb", tabActiveText:"#ffffff", tabBorder:"#2e3347",
    doneText:"#4ade80",
    removeBtn:{ bg:"rgba(239,68,68,0.12)", border:"#7f1d1d", color:"#f87171" },
    editBtn:{ bg:"rgba(77,184,212,0.10)", border:"#2e3347", color:"#4db8d4" },
  },
  light: {
    bg:"#f4f6fb", bgGrad:"#f4f6fb",
    headerBg:"#ffffff", headerBorder:"#dde2f0",
    cardBg:"#ffffff", cardBorder:"#e2e8f4",
    cardBgDone:"#f0faf4", cardBorderDone:"#86efac",
    rowBorder:"#edf0f8", inputBg:"#f8faff", inputBorder:"#cbd5e8",
    pickerBg:"#f8faff", pickerBorder:"#e2e8f4",
    subtleBorder:"#dde2f0", checkBg:"#f4f6fb",
    text:"#111827", textMuted:"#6b7280", textFaint:"#9ca3af",
    accent:"#2563eb", accentBg:"#eff6ff",
    tabActiveBg:"#2563eb", tabActiveText:"#ffffff", tabBorder:"#dde2f0",
    doneText:"#16a34a",
    removeBtn:{ bg:"rgba(239,68,68,0.07)", border:"#fca5a5", color:"#dc2626" },
    editBtn:{ bg:"rgba(37,99,235,0.07)", border:"#cbd5e8", color:"#2563eb" },
  },
};
