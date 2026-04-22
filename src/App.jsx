import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import AuthScreen from "./AuthScreen";

// ── Firebase ─────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBtjAmGe8DoIN3tfN2wIraSH5A_jruqh3o",
  authDomain: "stenstallet-cdf6c.firebaseapp.com",
  projectId: "stenstallet-cdf6c",
  storageBucket: "stenstallet-cdf6c.firebasestorage.app",
  messagingSenderId: "757891030329",
  appId: "1:757891030329:web:885a9db3fdc41688ba5ce8"
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);

const saveDoc = async (path, data) => {
  try { await setDoc(doc(db, ...path.split("/")), data, { merge: true }); }
  catch (e) { console.error("Firebase write error:", e); }
};

const VAPID_PUBLIC_KEY = "BNcRyxOvZ2UYo10fOVBuZ4N1sdWLCL_5X7eU6r_W0vZ2uBGaOMrXOrvB5-mjKwnrPb_WY-AnVOOiVvB7YdFSlZo";

function urlBase64ToUint8Array(b64) {
  const padding = "=".repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS       = ["Mån","Tis","Ons","Tor","Fre","Lör","Sön"];
const DAYS_SHORT = ["M","T","O","T","F","L","S"];
const SV_MONTHS      = ["jan","feb","mar","apr","maj","jun","jul","aug","sep","okt","nov","dec"];
const SV_MONTHS_FULL = ["Januari","Februari","Mars","April","Maj","Juni","Juli","Augusti","September","Oktober","November","December"];
const DAYS_FULL      = ["Måndag","Tisdag","Onsdag","Torsdag","Fredag","Lördag","Söndag"];
const MEALS = [
  { id: "morgon", label: "Morgon", icon: "🔆", time: "07:00" },
  { id: "lunch",  label: "Lunch",  icon: "🌤", time: "12:00" },
  { id: "middag", label: "Middag", icon: "☀️", time: "17:00" },
  { id: "kvall",  label: "Kväll",  icon: "🌙", time: "20:30" },
];
const PERSON_COLORS = [
  "#e8624a","#3b9edd","#2eaa6e","#b05cc8","#e8a32a","#e8607a","#4ab8c4","#7b9de8",
];
const HORSE_COLORS = ["#e8a32a","#7b9de8","#e8624a","#2eaa6e","#b05cc8","#4ab8c4"];

const DEFAULT_PERSONS = [
  { id: 1, name: "Anna", color: PERSON_COLORS[0] },
  { id: 2, name: "Erik", color: PERSON_COLORS[1] },
  { id: 3, name: "Sara", color: PERSON_COLORS[2] },
];
const DEFAULT_HORSES = [
  { id: 1, name: "Askungen",      color: HORSE_COLORS[0], note: "Låg energi, lite hö" },
  { id: 2, name: "Silverblixten", color: HORSE_COLORS[1], note: "Känslig mage" },
  { id: 3, name: "Röda Vinden",   color: HORSE_COLORS[2], note: "Extra kraftfoder" },
];
const buildDefaultAssignments = (persons) => {
  const a = {};
  const pids = persons.map(p => p.id);
  DAYS.forEach((d, di) => MEALS.forEach((m, mi) => {
    a[`${d}-${m.id}`] = pids[(di + mi) % pids.length];
  }));
  return a;
};

// ── Week helpers ──────────────────────────────────────────────────────────────
const getWeekDates = (offset) => {
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // 0=Mån … 6=Sön
  const monday = new Date(today);
  monday.setDate(today.getDate() - dayOfWeek + offset * 7);
  return DAYS.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};
const getISOWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};
const getWeekKey = (offset) => {
  const dates = getWeekDates(offset);
  const mon = dates[0];
  return `${mon.getFullYear()}-W${String(getISOWeek(mon)).padStart(2, "0")}`;
};
const fmtDate = (d) => `${d.getDate()} ${SV_MONTHS[d.getMonth()]}`;

// ── Themes ────────────────────────────────────────────────────────────────────
const THEMES = {
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

// ── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser]                        = useState(null);
  const [authLoading, setAuthLoading]          = useState(true);
  const [darkMode, setDarkMode]               = useState(true);
  const [persons, setPersons]                 = useState([]);
  const [horses, setHorses]                   = useState([]);
  const [assignments, setAssignments]         = useState({});
  const [loading, setLoading]                 = useState(true);
  const [activeDay, setActiveDay]             = useState("Mån");
  const [tab, setTab]                         = useState("vecka");
  const [weekOffset, setWeekOffset]           = useState(0);
  const [editingSlot, setEditingSlot]         = useState(null);
  const [showAddPerson, setShowAddPerson]     = useState(false);
  const [showAddHorse, setShowAddHorse]       = useState(false);
  const [newPersonName, setNewPersonName]     = useState("");
  const [newHorseName, setNewHorseName]       = useState("");
  const [newHorseNote, setNewHorseNote]       = useState("");
  const [editingPersonId, setEditingPersonId] = useState(null);
  const [editPersonName, setEditPersonName]   = useState("");
  const [editPersonColor, setEditPersonColor] = useState("");
  const [editingHorseId, setEditingHorseId]   = useState(null);
  const [editHorseName, setEditHorseName]     = useState("");
  const [editHorseNote, setEditHorseNote]     = useState("");
  const [myPersonId, setMyPersonId]           = useState(() => {
    const s = localStorage.getItem("stenPersonId");
    return s ? Number(s) : null;
  });
  const [showIdentity, setShowIdentity]       = useState(false);

  const T = darkMode ? THEMES.dark : THEMES.light;

  // ── Firebase: auth ────────────────────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
  }, []);

  // ── Firebase: config (static listeners) ──────────────────────────────────
  useEffect(() => {
    const unsubs = [
      onSnapshot(doc(db, "config", "persons"), snap => {
        setPersons(snap.exists() ? (snap.data().list || []) : DEFAULT_PERSONS);
        setLoading(false);
      }),
      onSnapshot(doc(db, "config", "horses"), snap => {
        setHorses(snap.exists() ? (snap.data().list || []) : DEFAULT_HORSES);
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  // ── Firebase: assignments per vecka ──────────────────────────────────────
  useEffect(() => {
    const weekKey = getWeekKey(weekOffset);
    const unsub = onSnapshot(doc(db, "config", `assignments_${weekKey}`), snap => {
      setAssignments(snap.exists() ? (snap.data().map || {}) : {});
    });
    return () => unsub();
  }, [weekOffset]);

  // Visa identitetsval när appen laddats och ingen identitet är vald
  useEffect(() => {
    if (!loading && !myPersonId) setShowIdentity(true);
  }, [loading]);

  // ── Push-notiser ──────────────────────────────────────────────────────────
  const registerPush = async (personId) => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      const sub = existing || await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      let deviceId = localStorage.getItem("stenDeviceId");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("stenDeviceId", deviceId);
      }
      await saveDoc(`push_subscriptions/${deviceId}`, { personId, subscription: JSON.stringify(sub) });
    } catch (err) {
      console.error("Push-registrering misslyckades:", err);
    }
  };

  const selectIdentity = async (personId) => {
    localStorage.setItem("stenPersonId", String(personId));
    setMyPersonId(personId);
    setShowIdentity(false);
    await registerPush(personId);
  };

  // ── Actions ───────────────────────────────────────────────────────────────
  const getPerson    = (id) => persons.find(p => p.id === id);
  const assignPerson = (day, mealId, personId) => {
    const map = { ...assignments, [`${day}-${mealId}`]: personId };
    setAssignments(map);
    saveDoc(`config/assignments_${getWeekKey(weekOffset)}`, { map });
    setEditingSlot(null);
  };
  const addPerson = () => {
    if (!newPersonName.trim()) return;
    const newP = { id: Date.now(), name: newPersonName.trim(), color: PERSON_COLORS[persons.length % PERSON_COLORS.length] };
    const list = [...persons, newP];
    setPersons(list);
    saveDoc("config/persons", { list });
    setNewPersonName(""); setShowAddPerson(false);
  };
  const addHorse = () => {
    if (!newHorseName.trim()) return;
    const newH = { id: Date.now(), name: newHorseName.trim(), color: HORSE_COLORS[horses.length % HORSE_COLORS.length], note: newHorseNote.trim() };
    const list = [...horses, newH];
    setHorses(list);
    saveDoc("config/horses", { list });
    setNewHorseName(""); setNewHorseNote(""); setShowAddHorse(false);
  };
  const removePerson = (id) => {
    const list = persons.filter(x => x.id !== id);
    setPersons(list);
    saveDoc("config/persons", { list });
    const map = { ...assignments };
    Object.keys(map).forEach(k => { if (map[k] === id) map[k] = null; });
    setAssignments(map);
    saveDoc("config/assignments", { map });
  };
  const removeHorse = (id) => {
    const list = horses.filter(x => x.id !== id);
    setHorses(list);
    saveDoc("config/horses", { list });
  };
  const startEditPerson = (p) => { setEditingPersonId(p.id); setEditPersonName(p.name); setEditPersonColor(p.color); };
  const savePerson = (id) => {
    if (!editPersonName.trim()) return;
    const list = persons.map(p => p.id === id ? { ...p, name: editPersonName.trim(), color: editPersonColor } : p);
    setPersons(list); saveDoc("config/persons", { list }); setEditingPersonId(null);
  };
  const copyToNextWeek = async () => {
    const nextWeekKey = getWeekKey(weekOffset + 1);
    await saveDoc(`config/assignments_${nextWeekKey}`, { map: { ...assignments } });
  };

  const startEditHorse = (h) => { setEditingHorseId(h.id); setEditHorseName(h.name); setEditHorseNote(h.note || ""); };
  const saveHorse = (id) => {
    if (!editHorseName.trim()) return;
    const list = horses.map(h => h.id === id ? { ...h, name: editHorseName.trim(), note: editHorseNote.trim() } : h);
    setHorses(list); saveDoc("config/horses", { list }); setEditingHorseId(null);
  };

  // ── Week computed ─────────────────────────────────────────────────────────
  const weekDates    = getWeekDates(weekOffset);
  const weekNum      = getISOWeek(weekDates[0]);
  const dateRangeStr = `${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])} ${weekDates[6].getFullYear()}`;
  const todayStr     = new Date().toDateString();
  const todayDayIdx  = weekDates.findIndex(d => d.toDateString() === todayStr);

  // ── Styles ────────────────────────────────────────────────────────────────
  const inputStyle = {
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 6, color: T.text, padding: "9px 11px",
    fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none",
  };
  const formBox   = { background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 14 };
  const btnSmall  = (extra = {}) => ({ padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:"500", ...extra });

  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:THEMES.dark.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui", color:"#4db8d4", fontSize:16 }}>
      Laddar Stenstallet…
    </div>
  );

  if (!user) return <AuthScreen auth={auth} />;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:T.bg, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"system-ui", color:T.accent, fontSize:16 }}>
      Laddar Stenstallet…
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color:T.text, transition:"background 0.25s, color 0.25s" }}>

      {/* ── Identitetsval-overlay ── */}
      {showIdentity && (
        <div style={{ position:"fixed", inset:0, zIndex:200, background: darkMode ? "rgba(10,12,20,0.97)" : "rgba(244,246,251,0.97)", display:"flex", flexDirection:"column", alignItems:"center", overflowY:"auto", padding:"32px 24px 40px" }}>
          <span style={{ fontSize:40, marginBottom:16, flexShrink:0 }}>🐴</span>
          <h2 style={{ margin:"0 0 6px", fontSize:22, fontWeight:"800", color:T.text, flexShrink:0 }}>Vem är du?</h2>
          <p style={{ margin:"0 0 24px", fontSize:14, color:T.textMuted, textAlign:"center", flexShrink:0 }}>Välj ditt namn för att få påminnelser om dina fodringspass.</p>
          <div style={{ display:"flex", flexDirection:"column", gap:10, width:"100%", maxWidth:320 }}>
            {persons.map(p => (
              <button key={p.id} onClick={() => selectIdentity(p.id)} style={{
                display:"flex", alignItems:"center", gap:14, padding:"14px 18px",
                background: T.cardBg, border:`2px solid ${p.color}55`, borderRadius:14,
                cursor:"pointer", textAlign:"left",
              }}>
                <div style={{ width:38, height:38, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:17, color:"#fff", fontWeight:"800", flexShrink:0 }}>{p.name[0]}</div>
                <span style={{ fontSize:17, fontWeight:"600", color:T.text }}>{p.name}</span>
              </button>
            ))}
            <button onClick={() => { localStorage.setItem("stenPersonId", "none"); setMyPersonId("none"); setShowIdentity(false); }} style={{
              padding:"14px 18px", borderRadius:14, cursor:"pointer", textAlign:"center",
              background:"transparent", border:`2px dashed ${T.cardBorder}`,
              color:T.textMuted, fontSize:15, fontWeight:"500",
            }}>
              Jag är inte med i schemat
            </button>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <header style={{
        background: T.headerBg, borderBottom:`1px solid ${T.headerBorder}`,
        padding:"12px 16px", position:"sticky", top:0, zIndex:100,
        boxShadow: darkMode ? "0 1px 16px rgba(0,0,0,0.5)" : "0 1px 6px rgba(0,0,0,0.07)",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>🐴</span>
            <div>
              <h1 style={{ margin:0, fontSize:17, fontWeight:"700", color:T.accent, letterSpacing:"0.04em" }}>Stenstallet</h1>
              <p style={{ margin:0, fontSize:9, color:T.textFaint, letterSpacing:"0.15em", textTransform:"uppercase" }}>Fodringsschema</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={() => setDarkMode(d => !d)} style={{
              background:"transparent", border:`1px solid ${T.cardBorder}`,
              borderRadius:8, padding:"6px 10px", cursor:"pointer",
              fontSize:15, color:T.textMuted, display:"flex", alignItems:"center", gap:5,
            }}>
              {darkMode ? "☀️" : "🌙"}
              <span style={{ fontSize:11, color:T.textMuted }}>{darkMode ? "Ljust" : "Mörkt"}</span>
            </button>
            <button onClick={() => signOut(auth)} title={user.email} style={{
              background:"transparent", border:`1px solid ${T.cardBorder}`,
              borderRadius:8, padding:"6px 10px", cursor:"pointer",
              fontSize:13, color:T.textMuted, display:"flex", alignItems:"center", gap:5,
            }}>
              <span style={{ maxWidth:100, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontSize:11 }}>{user.email}</span>
              <span style={{ fontSize:11 }}>↩</span>
            </button>
            {[["vecka","📅 Vecka"],["personer","👤 Personal"]].map(([t, label]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                background: tab===t ? T.tabActiveBg : "transparent",
                border:`1px solid ${tab===t ? T.accent : T.tabBorder}`,
                borderRadius:8, padding:"6px 10px", cursor:"pointer",
                color: tab===t ? "#fff" : T.textMuted, fontSize:12, fontWeight: tab===t ? "600":"400",
                whiteSpace:"nowrap",
              }}>{label}</button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ padding:"12px 8px 60px" }}>

        {/* ══ VECKO-VY ══ */}
        {tab === "vecka" && (
          <div>
            {/* Veckonavigering */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, gap:8 }}>
              <button onClick={() => setWeekOffset(0)} disabled={weekOffset === 0} style={{
                background:T.cardBg, border:`1px solid ${T.cardBorder}`,
                borderRadius:8, padding:"8px 14px", cursor: weekOffset === 0 ? "default" : "pointer",
                color: weekOffset === 0 ? T.textFaint : T.textMuted, fontSize:18, lineHeight:1, flexShrink:0,
              }}>‹</button>
              <div style={{ textAlign:"center", flex:1 }}>
                <div style={{ fontSize:15, fontWeight:"700", color:T.text }}>
                  Vecka {weekNum}
                  {weekOffset === 0 && <span style={{ marginLeft:7, fontSize:11, color:T.accent, fontWeight:"500" }}>denna vecka</span>}
                  {weekOffset === 1 && <span style={{ marginLeft:7, fontSize:11, color:T.textMuted, fontWeight:"500" }}>nästa vecka</span>}
                </div>
                <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{dateRangeStr}</div>
              </div>
              <button onClick={() => setWeekOffset(1)} disabled={weekOffset === 1} style={{
                background:T.cardBg, border:`1px solid ${T.cardBorder}`,
                borderRadius:8, padding:"8px 14px", cursor: weekOffset === 1 ? "default" : "pointer",
                color: weekOffset === 1 ? T.textFaint : T.textMuted, fontSize:18, lineHeight:1, flexShrink:0,
              }}>›</button>
            </div>

            {weekOffset === 0 && Object.keys(assignments).length > 0 && (
              <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:10 }}>
                <button onClick={copyToNextWeek} style={{
                  display:"flex", alignItems:"center", gap:6, padding:"7px 12px",
                  background:T.cardBg, border:`1px solid ${T.cardBorder}`,
                  borderRadius:8, cursor:"pointer", color:T.textMuted, fontSize:12, fontWeight:"500",
                }}>
                  📋 Kopiera till nästa vecka
                </button>
              </div>
            )}

            {/* Idag-sektion */}
            {weekOffset === 0 && todayDayIdx >= 0 && (
              <div style={{ marginBottom:16, padding:"12px 14px", background:T.cardBg, border:`1px solid ${T.accent}55`, borderRadius:14, boxShadow: darkMode ? "0 0 0 1px #4db8d420" : "0 0 0 1px #2563eb15" }}>
                <div style={{ fontSize:11, fontWeight:"700", color:T.accent, letterSpacing:"0.08em", marginBottom:10 }}>
                  {DAYS_FULL[todayDayIdx]} {weekDates[todayDayIdx].getDate()} {SV_MONTHS_FULL[weekDates[todayDayIdx].getMonth()]}
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  {MEALS.map(meal => {
                    const pid = assignments[`${DAYS[todayDayIdx]}-${meal.id}`];
                    const p   = pid ? getPerson(pid) : null;
                    return (
                      <div key={meal.id} onClick={() => { setActiveDay(DAYS[todayDayIdx]); setTab("dag"); }} style={{
                        flex:1, textAlign:"center", padding:"10px 4px 8px", borderRadius:10, cursor:"pointer",
                        background: p ? `${p.color}18` : (darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"),
                        border:`1.5px solid ${p ? p.color+"66" : T.cardBorder}`,
                      }}>
                        <div style={{ fontSize:16, lineHeight:1 }}>{meal.icon}</div>
                        <div style={{ fontSize:9, color:T.accent, fontWeight:"600", marginTop:2 }}>{meal.time}</div>
                        <div style={{ width:26, height:26, borderRadius:"50%", background: p ? p.color : T.subtleBorder, margin:"6px auto 0", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, color:"#fff", fontWeight:"700" }}>
                          {p ? p.name[0] : "?"}
                        </div>
                        <div style={{ fontSize:10, color: p ? p.color : T.textFaint, fontWeight:"700", marginTop:4, lineHeight:1.2 }}>
                          {p ? p.name : "—"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Veckotabell */}
            <div style={{ width:"100%" }}>
              <table style={{ borderCollapse:"collapse", width:"100%", tableLayout:"fixed" }}>
                <colgroup>
                  <col style={{ width:"40px" }} />
                  {DAYS.map(d => <col key={d} />)}
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ padding:"0 0 8px 0", borderBottom:`2px solid ${T.cardBorder}` }} />
                    {DAYS.map((d, i) => {
                      const isToday = i === todayDayIdx;
                      return (
                        <th key={d} onClick={() => { setActiveDay(d); setTab("dag"); }} style={{ padding:"0 0 8px 0", textAlign:"center", borderBottom:`2px solid ${isToday ? T.accent : T.cardBorder}`, cursor:"pointer" }}>
                          <div style={{
                            display:"inline-block", fontSize:11, fontWeight:"700",
                            color: isToday ? "#fff" : T.textMuted,
                            background: isToday ? T.accent : "transparent",
                            borderRadius: isToday ? 20 : 0,
                            padding: isToday ? "2px 5px" : 0,
                          }}>{DAYS_SHORT[i]}</div>
                          <div style={{ fontSize:10, color: isToday ? T.accent : T.textFaint, marginTop:2 }}>{weekDates[i].getDate()}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {MEALS.map((meal, mealIdx) => {
                    const isLast = mealIdx === MEALS.length - 1;
                    return (
                      <tr key={meal.id}>
                        <td style={{ padding:"4px 4px 4px 0", borderBottom: isLast ? "none" : `1px solid ${T.rowBorder}`, verticalAlign:"middle" }}>
                          <div style={{ fontSize:16, lineHeight:1, textAlign:"center" }}>{meal.icon}</div>
                          <div style={{ fontSize:8, fontWeight:"600", color:T.textMuted, marginTop:2, lineHeight:1.2, textAlign:"center", wordBreak:"break-word" }}>{meal.label}</div>
                          <div style={{ fontSize:8, fontWeight:"600", color:T.accent, marginTop:1, textAlign:"center" }}>{meal.time}</div>
                        </td>
                        {DAYS.map((d, i) => {
                          const pid     = assignments[`${d}-${meal.id}`];
                          const p       = pid ? getPerson(pid) : null;
                          const isToday = i === todayDayIdx;
                          return (
                            <td key={d} style={{ padding:"3px 1px", borderBottom: isLast ? "none" : `1px solid ${T.rowBorder}`, verticalAlign:"middle" }}>
                              <div onClick={() => { setActiveDay(d); setTab("dag"); }} style={{
                                display:"flex", alignItems:"center", justifyContent:"center",
                                cursor:"pointer", padding:"6px 0", borderRadius:8,
                                background: isToday ? (p ? `${p.color}25` : (darkMode?"rgba(77,184,212,0.06)":"rgba(37,99,235,0.05)")) : (p ? `${p.color}15` : "transparent"),
                                border:`1.5px solid ${isToday ? (p ? p.color+"99" : T.accent+"66") : (p ? p.color+"44" : T.rowBorder)}`,
                                transition:"all 0.15s", minHeight:40,
                              }}>
                                {p ? (
                                  <div style={{ width:24, height:24, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", fontWeight:"700", flexShrink:0 }}>
                                    {p.name[0]}
                                  </div>
                                ) : (
                                  <span style={{ fontSize:14, color:T.textFaint }}>—</span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize:11, color:T.textFaint, marginTop:12, fontStyle:"italic" }}>Tryck på en cell för att öppna dagen.</p>
          </div>
        )}

        {/* ══ DAG-VY ══ */}
        {tab === "dag" && <>
          <div style={{ display:"flex", gap:4, marginBottom:14 }}>
            {DAYS.map((d, i) => {
              const date = weekDates[i];
              const isToday = i === todayDayIdx;
              return (
                <button key={d} onClick={() => setActiveDay(d)} style={{
                  background: activeDay===d ? T.tabActiveBg : T.cardBg,
                  border:`1px solid ${activeDay===d ? T.accent : isToday ? T.accent+"55" : T.cardBorder}`,
                  color: activeDay===d ? "#fff" : T.textMuted,
                  borderRadius:7, padding:"6px 0", cursor:"pointer",
                  flex:1, minWidth:0, textAlign:"center",
                  transition:"all 0.15s",
                }}>
                  <div style={{ fontSize:11, fontWeight: activeDay===d ? "700":"400" }}>{d}</div>
                  <div style={{ fontSize:10, marginTop:1, color: activeDay===d ? "rgba(255,255,255,0.75)" : isToday ? T.accent : T.textFaint }}>{date.getDate()}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {MEALS.map(meal => {
              const slotKey    = `${activeDay}-${meal.id}`;
              const assignedId = assignments[slotKey];
              const person     = assignedId ? getPerson(assignedId) : null;
              const isEditing  = editingSlot === slotKey;
              return (
                <div key={meal.id} style={{
                  background: T.cardBg, border:`1px solid ${T.cardBorder}`,
                  borderRadius:12, overflow:"hidden",
                  boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 14px" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ fontSize:22 }}>{meal.icon}</span>
                      <div>
                        <div style={{ fontSize:15, fontWeight:"700", color:T.text, lineHeight:1.2 }}>{meal.label}</div>
                        <div style={{ fontSize:12, color:T.accent, fontWeight:"600", marginTop:1 }}>{meal.time}</div>
                      </div>
                    </div>
                    <div onClick={() => setEditingSlot(isEditing ? null : slotKey)} style={{
                      display:"flex", alignItems:"center", gap:7,
                      background: person ? `${person.color}18` : (darkMode?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.04)"),
                      border:`2px solid ${person ? person.color : T.subtleBorder}`,
                      borderRadius:24, padding:"5px 12px 5px 5px",
                      cursor:"pointer", userSelect:"none",
                    }}>
                      <div style={{ width:28, height:28, borderRadius:"50%", background: person ? person.color : T.subtleBorder, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"#fff", fontWeight:"700", flexShrink:0 }}>
                        {person ? person.name[0] : "?"}
                      </div>
                      <span style={{ fontSize:14, fontWeight:"700", color: person ? person.color : T.textMuted }}>
                        {person ? person.name : "Ingen"}
                      </span>
                      <span style={{ fontSize:10, color:T.textFaint, marginLeft:2 }}>▼</span>
                    </div>
                  </div>

                  {isEditing && (
                    <div style={{ padding:"10px 14px", display:"flex", flexWrap:"wrap", gap:7, alignItems:"center", background:T.pickerBg, borderTop:`1px solid ${T.pickerBorder}` }}>
                      <span style={{ fontSize:10, fontWeight:"600", color:T.textFaint, letterSpacing:"0.1em", width:"100%", marginBottom:2 }}>VÄLJ ANSVARIG</span>
                      {persons.map(p => (
                        <button key={p.id} onClick={() => assignPerson(activeDay, meal.id, p.id)} style={{
                          display:"flex", alignItems:"center", gap:6,
                          background: assignedId===p.id ? `${p.color}22` : "transparent",
                          border:`2px solid ${assignedId===p.id ? p.color : T.cardBorder}`,
                          borderRadius:22, padding:"5px 12px 5px 6px", cursor:"pointer",
                        }}>
                          <div style={{ width:22, height:22, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", fontWeight:"700" }}>{p.name[0]}</div>
                          <span style={{ fontSize:13, color: assignedId===p.id ? p.color : T.text, fontWeight: assignedId===p.id ? "700":"400" }}>{p.name}</span>
                        </button>
                      ))}
                      <button onClick={() => assignPerson(activeDay, meal.id, null)} style={{ background:"transparent", border:`1px dashed ${T.cardBorder}`, borderRadius:22, padding:"5px 11px", cursor:"pointer", color:T.textMuted, fontSize:12 }}>✕ Ingen</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>}

        {/* ══ PERSONAL-VY ══ */}
        {tab === "personer" && (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>

            {/* Personal */}
            <div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                <h2 style={{ fontSize:14, fontWeight:"700", color:T.text, margin:0 }}>👤 Personal</h2>
                {myPersonId && (() => { const me = persons.find(p => p.id === myPersonId); return me ? (
                  <button onClick={() => setShowIdentity(true)} style={{ display:"flex", alignItems:"center", gap:6, background:T.editBtn.bg, border:`1px solid ${T.editBtn.border}`, borderRadius:20, padding:"4px 10px 4px 6px", cursor:"pointer" }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:me.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:"700" }}>{me.name[0]}</div>
                    <span style={{ fontSize:11, color:T.editBtn.color, fontWeight:"600" }}>Byt identitet</span>
                  </button>
                ) : null; })()}</div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {persons.map(p => {
                  const mySlots = Object.values(assignments).filter(pid => pid === p.id).length;
                  const isEditing = editingPersonId === p.id;
                  return (
                    <div key={p.id} style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderLeft:`4px solid ${p.color}`, borderRadius:10, overflow:"hidden" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:34, height:34, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#fff", fontWeight:"700" }}>{p.name[0]}</div>
                          <div>
                            <div style={{ fontSize:15, fontWeight:"600", color:T.text }}>{p.name}</div>
                            <div style={{ fontSize:11, color:T.textMuted }}>{mySlots} pass denna vecka</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => isEditing ? setEditingPersonId(null) : startEditPerson(p)} style={btnSmall({ background:T.editBtn.bg, border:`1px solid ${T.editBtn.border}`, color:T.editBtn.color })}>
                            {isEditing ? "Avbryt" : "Ändra"}
                          </button>
                          <button onClick={() => removePerson(p.id)} style={btnSmall({ background:T.removeBtn.bg, border:`1px solid ${T.removeBtn.border}`, color:T.removeBtn.color })}>Ta bort</button>
                        </div>
                      </div>
                      {isEditing && (
                        <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${T.rowBorder}`, paddingTop:12 }}>
                          <input
                            value={editPersonName}
                            onChange={e => setEditPersonName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && savePerson(p.id)}
                            autoFocus
                            style={{ ...inputStyle, marginBottom:10 }}
                            placeholder="Namn *"
                          />
                          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                            {PERSON_COLORS.map(c => (
                              <div key={c} onClick={() => setEditPersonColor(c)} style={{
                                width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer",
                                border: editPersonColor === c ? `3px solid ${T.text}` : "3px solid transparent",
                                boxSizing:"border-box", transition:"border 0.1s",
                              }} />
                            ))}
                          </div>
                          <button onClick={() => savePerson(p.id)} style={{ padding:"8px 16px", borderRadius:7, cursor:"pointer", background:T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"600" }}>Spara</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!showAddPerson
                  ? <button onClick={() => setShowAddPerson(true)} style={{ background:T.cardBg, border:`2px dashed ${T.cardBorder}`, borderRadius:10, padding:"13px", cursor:"pointer", color:T.textMuted, fontSize:13, fontWeight:"500" }}>+ Lägg till person</button>
                  : <div style={formBox}>
                      <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:"600", color:T.textMuted }}>Ny person</p>
                      <input value={newPersonName} onChange={e => setNewPersonName(e.target.value)} placeholder="Namn *" autoFocus onKeyDown={e => e.key==="Enter" && addPerson()} style={{ ...inputStyle, marginBottom:10 }} />
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={addPerson} style={{ flex:1, padding:"9px", borderRadius:7, cursor:"pointer", background:T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"600" }}>Lägg till</button>
                        <button onClick={() => setShowAddPerson(false)} style={{ padding:"9px 14px", borderRadius:7, cursor:"pointer", background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.textMuted, fontSize:14 }}>Avbryt</button>
                      </div>
                    </div>
                }
              </div>
            </div>

            {/* Hästar */}
            <div>
              <h2 style={{ fontSize:14, fontWeight:"700", color:T.text, marginBottom:12 }}>🐎 Hästar</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {horses.map(h => {
                  const isEditing = editingHorseId === h.id;
                  return (
                    <div key={h.id} style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderLeft:`4px solid ${h.color}`, borderRadius:10, overflow:"hidden" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <div style={{ width:10, height:10, borderRadius:"50%", background:h.color, flexShrink:0 }} />
                          <div>
                            <span style={{ fontSize:14, fontWeight:"600", color:T.text }}>{h.name}</span>
                            {h.note && <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{h.note}</div>}
                          </div>
                        </div>
                        <div style={{ display:"flex", gap:6 }}>
                          <button onClick={() => isEditing ? setEditingHorseId(null) : startEditHorse(h)} style={btnSmall({ background:T.editBtn.bg, border:`1px solid ${T.editBtn.border}`, color:T.editBtn.color })}>
                            {isEditing ? "Avbryt" : "Ändra"}
                          </button>
                          <button onClick={() => removeHorse(h.id)} style={btnSmall({ background:T.removeBtn.bg, border:`1px solid ${T.removeBtn.border}`, color:T.removeBtn.color })}>Ta bort</button>
                        </div>
                      </div>
                      {isEditing && (
                        <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${T.rowBorder}`, paddingTop:12 }}>
                          <input value={editHorseName} onChange={e => setEditHorseName(e.target.value)} onKeyDown={e => e.key==="Enter" && saveHorse(h.id)} autoFocus placeholder="Namn *" style={{ ...inputStyle, marginBottom:8 }} />
                          <input value={editHorseNote} onChange={e => setEditHorseNote(e.target.value)} placeholder="Anteckning (valfri)" style={{ ...inputStyle, marginBottom:8 }} />
                          <button onClick={() => saveHorse(h.id)} style={{ padding:"8px 16px", borderRadius:7, cursor:"pointer", background:T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"600" }}>Spara</button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!showAddHorse
                  ? <button onClick={() => setShowAddHorse(true)} style={{ background:T.cardBg, border:`2px dashed ${T.cardBorder}`, borderRadius:10, padding:"13px", cursor:"pointer", color:T.textMuted, fontSize:13, fontWeight:"500" }}>+ Lägg till häst</button>
                  : <div style={formBox}>
                      <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:"600", color:T.textMuted }}>Ny häst</p>
                      <input value={newHorseName} onChange={e => setNewHorseName(e.target.value)} placeholder="Namn *" autoFocus style={{ ...inputStyle, marginBottom:8 }} />
                      <input value={newHorseNote} onChange={e => setNewHorseNote(e.target.value)} placeholder="Anteckning (valfri)" style={{ ...inputStyle, marginBottom:10 }} />
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={addHorse} style={{ flex:1, padding:"9px", borderRadius:7, cursor:"pointer", background:T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"600" }}>Lägg till</button>
                        <button onClick={() => setShowAddHorse(false)} style={{ padding:"9px 14px", borderRadius:7, cursor:"pointer", background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.textMuted, fontSize:14 }}>Avbryt</button>
                      </div>
                    </div>
                }
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
