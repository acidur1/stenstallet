import { useState, useEffect } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { db, auth, saveDoc } from "./firebase";
import {
  THEMES, MEALS, DAYS, PERSON_COLORS, HORSE_COLORS,
  DEFAULT_PERSONS, DEFAULT_HORSES,
  getWeekDates, getISOWeek, getWeekKey, fmtDate,
  SV_MONTHS, VAPID_PUBLIC_KEY, urlBase64ToUint8Array,
} from "./constants";
import AuthScreen    from "./AuthScreen";
import WeekView      from "./views/WeekView";
import DayView       from "./views/DayView";
import HistoryView   from "./views/HistoryView";
import PersonManager from "./views/PersonManager";
import HorseManager  from "./views/HorseManager";

export default function App() {
  const [user, setUser]             = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [darkMode, setDarkMode]     = useState(true);
  const [persons, setPersons]       = useState([]);
  const [horses, setHorses]         = useState([]);
  const [assignments, setAssignments] = useState({});
  const [done, setDone]             = useState({});
  const [swapMap, setSwapMap]       = useState({});
  const [loading, setLoading]       = useState(true);
  const [history, setHistory]       = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tab, setTab]               = useState("vecka");
  const [activeDay, setActiveDay]   = useState("Mån");
  const [weekOffset, setWeekOffset] = useState(0);
  const [myPersonId, setMyPersonId] = useState(() => {
    const s = localStorage.getItem("stenPersonId");
    return s ? Number(s) : null;
  });
  const [showIdentity, setShowIdentity] = useState(false);

  const T = darkMode ? THEMES.dark : THEMES.light;

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => { setUser(u); setAuthLoading(false); });
  }, []);

  // ── Firestore: persons + horses (static) ──────────────────────────────────
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

  // ── Firestore: week data (changes with weekOffset) ────────────────────────
  useEffect(() => {
    const weekKey = getWeekKey(weekOffset);
    const unsubs = [
      onSnapshot(doc(db, "config", `assignments_${weekKey}`), snap => {
        setAssignments(snap.exists() ? (snap.data().map || {}) : {});
      }),
      onSnapshot(doc(db, "schedule", `done_${weekKey}`), snap => {
        setDone(snap.exists() ? (snap.data().map || {}) : {});
      }),
      onSnapshot(doc(db, "schedule", `swaps_${weekKey}`), snap => {
        setSwapMap(snap.exists() ? (snap.data().map || {}) : {});
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [weekOffset]);

  useEffect(() => {
    if (!loading) {
      const linked = user ? persons.find(p => p.userId === user.uid) : null;
      if (linked) {
        setMyPersonId(linked.id);
        localStorage.setItem("stenPersonId", String(linked.id));
      } else if (!myPersonId) {
        setShowIdentity(true);
      }
    }
  }, [loading]);

  // ── Push notifications ────────────────────────────────────────────────────
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
      if (!deviceId) { deviceId = crypto.randomUUID(); localStorage.setItem("stenDeviceId", deviceId); }
      await saveDoc(`push_subscriptions/${deviceId}`, { personId, subscription: JSON.stringify(sub) });
    } catch (err) {
      console.error("Push-registrering misslyckades:", err);
    }
  };

  const selectIdentity = async (personId) => {
    const list = persons.map(p => {
      if (p.userId === user.uid && p.id !== personId) return { ...p, userId: null };
      if (p.id === personId) return { ...p, userId: user.uid };
      return p;
    });
    setPersons(list);
    await saveDoc("config/persons", { list });
    localStorage.setItem("stenPersonId", String(personId));
    setMyPersonId(personId);
    setShowIdentity(false);
    await registerPush(personId);
  };

  // ── Person / horse actions ────────────────────────────────────────────────
  const addPerson = (name) => {
    const newP = { id: Date.now(), name, color: PERSON_COLORS[persons.length % PERSON_COLORS.length] };
    const list = [...persons, newP];
    setPersons(list);
    saveDoc("config/persons", { list });
  };
  const savePerson = (id, name, color) => {
    const list = persons.map(p => p.id === id ? { ...p, name, color } : p);
    setPersons(list);
    saveDoc("config/persons", { list });
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

  const addHorse = (name, note) => {
    const newH = { id: Date.now(), name, color: HORSE_COLORS[horses.length % HORSE_COLORS.length], note };
    const list = [...horses, newH];
    setHorses(list);
    saveDoc("config/horses", { list });
  };
  const saveHorse = (id, name, note) => {
    const list = horses.map(h => h.id === id ? { ...h, name, note } : h);
    setHorses(list);
    saveDoc("config/horses", { list });
  };
  const removeHorse = (id) => {
    const list = horses.filter(x => x.id !== id);
    setHorses(list);
    saveDoc("config/horses", { list });
  };

  // ── Schedule actions ──────────────────────────────────────────────────────
  const assignPerson = (day, mealId, personId) => {
    const map = { ...assignments, [`${day}-${mealId}`]: personId };
    setAssignments(map);
    saveDoc(`config/assignments_${getWeekKey(weekOffset)}`, { map });
  };
  const toggleDone = (day, mealId, horseId) => {
    const k = `${day}-${mealId}-${horseId}`;
    const map = { ...done, [k]: !done[k] };
    setDone(map);
    saveDoc(`schedule/done_${getWeekKey(weekOffset)}`, { map });
  };
  const copyToNextWeek = () =>
    saveDoc(`config/assignments_${getWeekKey(weekOffset + 1)}`, { map: { ...assignments } });

  // ── Swap actions ──────────────────────────────────────────────────────────
  const saveSwaps = (map) => saveDoc(`schedule/swaps_${getWeekKey(weekOffset)}`, { map });

  const requestSwap = (day, mealId) => {
    const map = { ...swapMap, [`${day}-${mealId}`]: { fromPersonId: myPersonId, requestedAt: Date.now() } };
    setSwapMap(map);
    saveSwaps(map);
  };
  const cancelSwap = (day, mealId) => {
    const map = { ...swapMap };
    delete map[`${day}-${mealId}`];
    setSwapMap(map);
    saveSwaps(map);
  };
  const acceptSwap = (day, mealId) => {
    const slotKey = `${day}-${mealId}`;
    const newAssignments = { ...assignments, [slotKey]: myPersonId };
    setAssignments(newAssignments);
    saveDoc(`config/assignments_${getWeekKey(weekOffset)}`, { map: newAssignments });
    const map = { ...swapMap };
    delete map[slotKey];
    setSwapMap(map);
    saveSwaps(map);
  };

  const pendingSwapsForOthers = Object.entries(swapMap).filter(
    ([, req]) => req.fromPersonId !== myPersonId
  );

  // ── History ───────────────────────────────────────────────────────────────
  const loadHistory = async () => {
    if (history !== null || historyLoading) return;
    setHistoryLoading(true);
    const weeks = [];
    for (let offset = -1; offset >= -8; offset--) {
      const weekKey = getWeekKey(offset);
      const dates   = getWeekDates(offset);
      const [assignSnap, doneSnap] = await Promise.all([
        getDoc(doc(db, "config", `assignments_${weekKey}`)),
        getDoc(doc(db, "schedule", `done_${weekKey}`)),
      ]);
      weeks.push({
        weekKey,
        weekNum:  getISOWeek(dates[0]),
        dates,
        assignments: assignSnap.exists() ? (assignSnap.data().map || {}) : {},
        done:        doneSnap.exists()   ? (doneSnap.data().map   || {}) : {},
        hasDoneData: doneSnap.exists(),
      });
    }
    setHistory(weeks);
    setHistoryLoading(false);
  };

  // ── Computed week values ──────────────────────────────────────────────────
  const weekDates    = getWeekDates(weekOffset);
  const weekNum      = getISOWeek(weekDates[0]);
  const dateRangeStr = `${fmtDate(weekDates[0])} – ${fmtDate(weekDates[6])} ${weekDates[6].getFullYear()}`;
  const todayStr     = new Date().toDateString();
  const todayDayIdx  = weekDates.findIndex(d => d.toDateString() === todayStr);

  // ── Guards ────────────────────────────────────────────────────────────────
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

  const navigateToDay = (day) => { setActiveDay(day); setTab("dag"); };

  return (
    <div style={{ minHeight:"100vh", background:T.bg, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color:T.text, transition:"background 0.25s, color 0.25s" }}>

      {/* Identity picker overlay */}
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
            <button onClick={() => {
              if (user) {
                const list = persons.map(p => p.userId === user.uid ? { ...p, userId: null } : p);
                setPersons(list);
                saveDoc("config/persons", { list });
              }
              localStorage.setItem("stenPersonId", "none");
              setMyPersonId("none");
              setShowIdentity(false);
            }} style={{
              padding:"14px 18px", borderRadius:14, cursor:"pointer", textAlign:"center",
              background:"transparent", border:`2px dashed ${T.cardBorder}`,
              color:T.textMuted, fontSize:15, fontWeight:"500",
            }}>
              Jag är inte med i schemat
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header style={{
        background: T.headerBg, borderBottom:`1px solid ${T.headerBorder}`,
        padding:"10px 16px", position:"sticky", top:0, zIndex:100,
        boxShadow: darkMode ? "0 1px 16px rgba(0,0,0,0.5)" : "0 1px 6px rgba(0,0,0,0.07)",
      }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22 }}>🐴</span>
            <div>
              <h1 style={{ margin:0, fontSize:16, fontWeight:"700", color:T.accent, letterSpacing:"0.04em" }}>Stenstallet</h1>
              <p style={{ margin:0, fontSize:8, color:T.textFaint, letterSpacing:"0.15em", textTransform:"uppercase" }}>Fodringsschema</p>
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <button onClick={() => setDarkMode(d => !d)} style={{
              background:"transparent", border:`1px solid ${T.cardBorder}`,
              borderRadius:8, padding:"6px 8px", cursor:"pointer",
              fontSize:15, color:T.textMuted, lineHeight:1,
            }}>
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={() => signOut(auth)} title={`Logga ut (${user.email})`} style={{
              background:"transparent", border:`1px solid ${T.cardBorder}`,
              borderRadius:8, padding:"5px 10px", cursor:"pointer",
              fontSize:11, color:T.textMuted, display:"flex", alignItems:"center", gap:5, lineHeight:1,
            }}>
              <span style={{ maxWidth:80, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.email.split("@")[0]}</span>
              <span style={{ fontSize:13 }}>↩</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom navigation */}
      <nav style={{
        position:"fixed", bottom:0, left:0, right:0, zIndex:100,
        background: T.headerBg, borderTop:`1px solid ${T.headerBorder}`,
        display:"flex", boxShadow: darkMode ? "0 -1px 16px rgba(0,0,0,0.5)" : "0 -1px 6px rgba(0,0,0,0.07)",
        paddingBottom:"env(safe-area-inset-bottom)",
      }}>
        {[["vecka","📅","Vecka"],["dag","🗓","Idag"],["historik","📋","Historik"],["personer","👤","Personal"]].map(([t, icon, label]) => (
          <button key={t} onClick={() => { setTab(t); if (t === "historik") loadHistory(); if (t === "dag") setActiveDay(["Mån","Tis","Ons","Tor","Fre","Lör","Sön"][new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] || "Mån"); }} style={{
            flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            padding:"8px 4px 10px",
            background: "transparent", border:"none", cursor:"pointer",
            borderTop: tab===t ? `2px solid ${T.accent}` : "2px solid transparent",
          }}>
            <span style={{ fontSize:18, lineHeight:1 }}>{icon}</span>
            <span style={{ fontSize:10, marginTop:3, color: tab===t ? T.accent : T.textMuted, fontWeight: tab===t ? "700":"400" }}>{label}</span>
          </button>
        ))}
      </nav>

      <main style={{ padding:"12px 8px 80px" }}>
        {tab === "vecka" && (
          <WeekView
            T={T} darkMode={darkMode}
            weekOffset={weekOffset} setWeekOffset={setWeekOffset}
            weekDates={weekDates} weekNum={weekNum} dateRangeStr={dateRangeStr} todayDayIdx={todayDayIdx}
            assignments={assignments} persons={persons}
            copyToNextWeek={copyToNextWeek}
            pendingSwapsForOthers={pendingSwapsForOthers}
            myPersonId={myPersonId}
            onAcceptSwap={acceptSwap}
            onNavigateToDay={navigateToDay}
          />
        )}

        {tab === "dag" && (
          <DayView
            T={T} darkMode={darkMode}
            activeDay={activeDay} setActiveDay={setActiveDay}
            weekDates={weekDates} todayDayIdx={todayDayIdx}
            assignments={assignments} persons={persons} horses={horses}
            done={done} swapMap={swapMap} myPersonId={myPersonId}
            onAssignPerson={assignPerson}
            onToggleDone={toggleDone}
            onRequestSwap={requestSwap}
            onCancelSwap={cancelSwap}
            onAcceptSwap={acceptSwap}
          />
        )}

        {tab === "historik" && (
          <HistoryView
            T={T} darkMode={darkMode}
            history={history} historyLoading={historyLoading}
            horses={horses} persons={persons}
          />
        )}

        {tab === "personer" && (
          <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
            <PersonManager
              T={T}
              persons={persons} assignments={assignments} myPersonId={myPersonId}
              user={user}
              onShowIdentity={() => setShowIdentity(true)}
              onAdd={addPerson} onRemove={removePerson} onSave={savePerson}
            />
            <HorseManager
              T={T}
              horses={horses}
              onAdd={addHorse} onRemove={removeHorse} onSave={saveHorse}
            />
          </div>
        )}
      </main>
    </div>
  );
}
