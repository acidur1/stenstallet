import { useState, useRef } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { DAYS, MEALS } from "../constants";

export default function WhiteboardSync({ T, darkMode, persons, horses, weekInfos, onApply, functionUrl }) {
  const [step, setStep]         = useState("idle"); // idle | analyzing | diff
  const [mealFilter, setMealFilter] = useState(null);
  const [diff, setDiff]         = useState(null);   // { [weekNum]: { [slotKey]: { from, to } } }
  const [allCurrentAssignments, setAllCurrentAssignments] = useState({});
  const [selected, setSelected] = useState({});     // { `${weekNum}-${slotKey}`: bool }
  const [error, setError]       = useState(null);
  const [notes, setNotes]       = useState("");
  const inputRef = useRef();

  const getPerson  = (id) => persons.find(p => p.id === id);
  const findPerson = (name) => {
    if (!name) return null;
    // Direct name match
    const direct = persons.find(p => p.name.toLowerCase() === name.toLowerCase());
    if (direct) return direct;
    // "Box: N" or "Box N" — resolve via horse owner
    const boxMatch = name.match(/box[:\s]+(\d+)/i);
    if (boxMatch) {
      const boxNum = Number(boxMatch[1]);
      const horse  = (horses || []).find(h => h.boxNumber === boxNum);
      if (horse?.ownerPersonId) return persons.find(p => p.id === horse.ownerPersonId) || null;
    }
    return null;
  };

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStep("analyzing");
    setError(null);

    // Load current assignments for all 4 weeks
    const current = {};
    await Promise.all(weekInfos.map(async ({ weekNum, weekKey }) => {
      const snap = await getDoc(doc(db, "config", `assignments_${weekKey}`));
      current[weekKey] = snap.exists() ? (snap.data().map || {}) : {};
    }));
    setAllCurrentAssignments(current);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result.split(",")[1];
      const activeMealIds = mealFilter === "morgon-kvall" ? ["morgon","kvall"] : ["lunch","middag"];
      const activeMeals   = MEALS.filter(m => activeMealIds.includes(m.id));

      try {
        const resp = await fetch(functionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
            persons,
            horses: horses || [],
            meals: activeMeals,
            weekNums: weekInfos.map(w => w.weekNum),
          }),
        });

        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        if (data.error) throw new Error(data.error);

        // Build diff per week
        const changes = {};
        const newSelected = {};
        for (const { weekNum, weekKey } of weekInfos) {
          const weekSchedule = (data.weeks || {})[String(weekNum)] || {};
          const weekCurrent  = current[weekKey] || {};
          changes[weekNum]   = {};
          for (const [slotKey, personName] of Object.entries(weekSchedule)) {
            const mealId = slotKey.split("-")[1];
            if (!activeMealIds.includes(mealId)) continue;
            const newId     = findPerson(personName)?.id ?? null;
            const currentId = weekCurrent[slotKey] ?? null;
            if (newId !== currentId) {
              changes[weekNum][slotKey] = { from: currentId, to: newId };
              newSelected[`${weekNum}-${slotKey}`] = true;
            }
          }
        }

        const totalChanges = Object.values(changes).reduce((s, w) => s + Object.keys(w).length, 0);
        if (totalChanges === 0) {
          setStep("idle");
          setError("Schemat matchar redan — inga ändringar hittades.");
          return;
        }

        setDiff(changes);
        setSelected(newSelected);
        setNotes(data.notes || "");
        setStep("diff");
      } catch (err) {
        setError("Kunde inte tolka bilden: " + err.message);
        setStep("idle");
      }
    };
    reader.readAsDataURL(file);
  };

  const apply = () => {
    const weeklyUpdates = {};
    for (const { weekNum, weekKey } of weekInfos) {
      const weekDiff   = diff[weekNum] || {};
      const hasChanges = Object.keys(weekDiff).some(k => selected[`${weekNum}-${k}`]);
      if (!hasChanges) continue;
      const merged = { ...allCurrentAssignments[weekKey] };
      for (const [slotKey, change] of Object.entries(weekDiff)) {
        if (selected[`${weekNum}-${slotKey}`]) merged[slotKey] = change.to;
      }
      weeklyUpdates[weekKey] = merged;
    }
    onApply(weeklyUpdates);
    setStep("idle");
    setDiff(null);
  };

  const totalSelected = Object.values(selected).filter(Boolean).length;
  const totalChanges  = diff ? Object.values(diff).reduce((s, w) => s + Object.keys(w).length, 0) : 0;
  const toggleAll     = (val) => setSelected(s => Object.fromEntries(Object.keys(s).map(k => [k, val])));
  const allSelected   = totalSelected === totalChanges;

  if (step === "analyzing") return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:T.textMuted }}>
      <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
      <div style={{ fontSize:15, fontWeight:"600", color:T.text }}>Analyserar whiteboard…</div>
      <div style={{ fontSize:13, marginTop:6 }}>Det tar några sekunder</div>
    </div>
  );

  if (step === "diff" && diff) {
    const activeMealIds = mealFilter === "morgon-kvall" ? ["morgon","kvall"] : ["lunch","middag"];
    const activeMeals   = MEALS.filter(m => activeMealIds.includes(m.id));

    const WeekBlock = ({ weekInfo }) => {
      const { weekNum, weekKey } = weekInfo;
      const weekDiff    = diff[weekNum] || {};
      const weekCurrent = allCurrentAssignments[weekKey] || {};

      return (
        <div style={{ flex:1, minWidth:0 }}>
          {/* Week header row */}
          <div style={{ display:"flex", borderBottom:`2px solid ${T.accent}`, marginBottom:2 }}>
            <div style={{ width:26, flexShrink:0, fontSize:11, fontWeight:"800", color:T.accent, padding:"3px 2px 3px 0" }}>
              v{weekNum}
            </div>
            {activeMeals.map(m => (
              <div key={m.id} style={{ flex:1, textAlign:"center", fontSize:10, fontWeight:"700", color:T.textMuted, padding:"3px 1px" }}>
                {m.icon} {m.label}
              </div>
            ))}
          </div>

          {/* Day rows */}
          {DAYS.map((day, di) => (
            <div key={day} style={{
              display:"flex", alignItems:"stretch",
              borderBottom: di < DAYS.length-1 ? `1px solid ${T.rowBorder}` : "none",
            }}>
              <div style={{ width:26, flexShrink:0, fontSize:10, fontWeight:"700", color:T.textMuted, display:"flex", alignItems:"center", paddingLeft:1 }}>
                {day}
              </div>
              {activeMeals.map(meal => {
                const slotKey  = `${day}-${meal.id}`;
                const change   = weekDiff[slotKey];
                const selKey   = `${weekNum}-${slotKey}`;
                const isSel    = selected[selKey];
                const currentId = weekCurrent[slotKey] ?? null;
                const currentP  = currentId ? getPerson(currentId) : null;

                if (!change) {
                  // No change — show current assignment for reference
                  return (
                    <div key={meal.id} style={{
                      flex:1, padding:"4px 2px", display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                      <span style={{ fontSize:10, color: currentP ? currentP.color+"99" : T.textFaint, fontWeight:"600" }}>
                        {currentP ? currentP.name : "—"}
                      </span>
                    </div>
                  );
                }

                const fromP = change.from ? getPerson(change.from) : null;
                const toP   = change.to   ? getPerson(change.to)   : null;

                return (
                  <div key={meal.id} onClick={() => setSelected(s => ({ ...s, [selKey]: !s[selKey] }))}
                    style={{
                      flex:1, padding:"3px 2px", cursor:"pointer", borderRadius:5, margin:"2px 1px",
                      background: isSel
                        ? (darkMode ? "rgba(77,184,212,0.15)" : "rgba(37,99,235,0.10)")
                        : (darkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
                      border:`1.5px solid ${isSel ? T.accent+"88" : T.cardBorder}`,
                      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:1,
                    }}>
                    <div style={{ width:12, height:12, borderRadius:3, flexShrink:0,
                      background: isSel ? T.accent : "transparent",
                      border:`1.5px solid ${isSel ? T.accent : T.cardBorder}`,
                      display:"flex", alignItems:"center", justifyContent:"center", marginBottom:1,
                    }}>
                      {isSel && <span style={{ color:"#fff", fontSize:7, lineHeight:1 }}>✓</span>}
                    </div>
                    <span style={{ fontSize:9, color: fromP ? fromP.color+"bb" : T.textFaint, lineHeight:1.1, textAlign:"center" }}>
                      {fromP ? fromP.name : "–"}
                    </span>
                    <span style={{ fontSize:8, color:T.textFaint, lineHeight:1 }}>↓</span>
                    <span style={{ fontSize:10, fontWeight:"700", color: toP ? toP.color : T.textFaint, lineHeight:1.1, textAlign:"center" }}>
                      {toP ? toP.name : "–"}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
          <div style={{ fontSize:14, fontWeight:"700", color:T.text }}>
            {totalChanges} ändringar hittades
          </div>
          <button onClick={() => toggleAll(!allSelected)} style={{
            background:"transparent", border:"none", cursor:"pointer",
            fontSize:12, color:T.accent, fontWeight:"600", padding:"2px 0",
          }}>{allSelected ? "Avmarkera alla" : "Markera alla"}</button>
        </div>
        {notes && (
          <div style={{ fontSize:12, color:"#f59e0b", marginBottom:10, padding:"8px 10px", background:"rgba(245,158,11,0.08)", borderRadius:8 }}>
            ⚠️ {notes}
          </div>
        )}

        {/* 2×2 grid of week blocks */}
        <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:16 }}>
          {[[0,1],[2,3]].map(([ia, ib]) => (
            <div key={ia} style={{ display:"flex", gap:10 }}>
              <WeekBlock weekInfo={weekInfos[ia]} />
              <div style={{ width:1, background:T.cardBorder, flexShrink:0 }} />
              <WeekBlock weekInfo={weekInfos[ib]} />
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:8 }}>
          <button onClick={apply} disabled={totalSelected === 0} style={{
            flex:1, padding:"11px", borderRadius:9, cursor: totalSelected ? "pointer" : "default",
            background: T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"700",
            opacity: totalSelected ? 1 : 0.5,
          }}>
            Uppdatera {totalSelected} pass
          </button>
          <button onClick={() => { setStep("idle"); setDiff(null); }} style={{
            padding:"11px 16px", borderRadius:9, cursor:"pointer",
            background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.textMuted, fontSize:14,
          }}>Avbryt</button>
        </div>
      </div>
    );
  }

  const pickAndShoot = (filter) => {
    setMealFilter(filter);
    setError(null);
    setTimeout(() => inputRef.current.click(), 50);
  };

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display:"none" }} />

      {error && (
        <div style={{ fontSize:13, color:"#f87171", marginBottom:12, padding:"8px 10px", background:"rgba(239,68,68,0.08)", borderRadius:8 }}>
          {error}
        </div>
      )}

      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {[
          { filter:"morgon-kvall", label:"Morgon & Kväll", icon:"🔆🌙" },
          { filter:"lunch-middag", label:"Lunch & Middag",  icon:"🌤☀️" },
        ].map(({ filter, label, icon }) => (
          <button key={filter} onClick={() => pickAndShoot(filter)} style={{
            width:"100%", padding:"14px 16px", borderRadius:12, cursor:"pointer",
            background: T.cardBg, border:`2px dashed ${T.accent}55`,
            display:"flex", alignItems:"center", gap:12,
          }}>
            <span style={{ fontSize:22 }}>📸</span>
            <span style={{ fontSize:14, fontWeight:"600", color:T.accent }}>{icon} {label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
