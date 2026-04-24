import { useState, useRef } from "react";
import { DAYS, MEALS, SV_MONTHS } from "../constants";

export default function WhiteboardSync({ T, darkMode, persons, assignments, weekOffset, weekDates, weekNum, onApply, functionUrl }) {
  const [step, setStep]       = useState("idle"); // idle | analyzing | diff | applying
  const [diff, setDiff]       = useState(null);
  const [selected, setSelected] = useState({});
  const [error, setError]     = useState(null);
  const [notes, setNotes]     = useState("");
  const inputRef = useRef();

  const getPerson  = (id) => persons.find(p => p.id === id);
  const findPerson = (name) => name ? persons.find(p => p.name.toLowerCase() === name.toLowerCase()) : null;

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStep("analyzing");
    setError(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      const base64  = dataUrl.split(",")[1];

      try {
        const resp = await fetch(functionUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: file.type,
            persons,
            meals: MEALS,
            weekOffset,
          }),
        });

        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();

        if (data.error) throw new Error(data.error);

        // Build diff — only slots that differ from current assignments
        const changes = {};
        for (const [slotKey, personName] of Object.entries(data.schedule || {})) {
          const newPerson  = findPerson(personName);
          const newId      = newPerson ? newPerson.id : null;
          const currentId  = assignments[slotKey] ?? null;
          if (newId !== currentId) {
            changes[slotKey] = { from: currentId, to: newId };
          }
        }

        if (Object.keys(changes).length === 0) {
          setStep("idle");
          setError("Schemat matchar redan — inga ändringar hittades.");
          return;
        }

        setDiff(changes);
        setSelected(Object.fromEntries(Object.keys(changes).map(k => [k, true])));
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
    const updates = {};
    for (const [slotKey, change] of Object.entries(diff)) {
      if (selected[slotKey]) updates[slotKey] = change.to;
    }
    onApply(updates);
    setStep("idle");
    setDiff(null);
  };

  const slotLabel = (slotKey) => {
    const [day, mealId] = slotKey.split("-");
    const meal    = MEALS.find(m => m.id === mealId);
    const dayIdx  = DAYS.indexOf(day);
    const date    = weekDates?.[dayIdx];
    const datePart = date ? ` ${date.getDate()} ${SV_MONTHS[date.getMonth()]}` : "";
    return `${day}${datePart} · ${meal?.label ?? mealId}`;
  };

  if (step === "analyzing") return (
    <div style={{ textAlign:"center", padding:"40px 20px", color:T.textMuted }}>
      <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
      <div style={{ fontSize:15, fontWeight:"600", color:T.text }}>Analyserar whiteboard…</div>
      <div style={{ fontSize:13, marginTop:6 }}>Det tar några sekunder</div>
    </div>
  );

  if (step === "diff" && diff) return (
    <div>
      <div style={{ fontSize:14, fontWeight:"700", color:T.text, marginBottom:4 }}>
        {Object.keys(diff).length} ändringar hittades
      </div>
      {notes && (
        <div style={{ fontSize:12, color:"#f59e0b", marginBottom:12, padding:"8px 10px", background:"rgba(245,158,11,0.08)", borderRadius:8 }}>
          ⚠️ {notes}
        </div>
      )}
      <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:16 }}>
        {Object.entries(diff).map(([slotKey, { from, to }]) => {
          const fromP = from ? getPerson(from) : null;
          const toP   = to   ? getPerson(to)   : null;
          return (
            <div key={slotKey} onClick={() => setSelected(s => ({ ...s, [slotKey]: !s[slotKey] }))} style={{
              display:"flex", alignItems:"center", gap:10, padding:"10px 12px",
              background: selected[slotKey] ? (darkMode?"rgba(77,184,212,0.08)":"rgba(37,99,235,0.06)") : T.cardBg,
              border:`1px solid ${selected[slotKey] ? T.accent+"55" : T.cardBorder}`,
              borderRadius:10, cursor:"pointer",
            }}>
              <div style={{ width:20, height:20, borderRadius:5, flexShrink:0,
                background: selected[slotKey] ? T.accent : "transparent",
                border:`2px solid ${selected[slotKey] ? T.accent : T.cardBorder}`,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>
                {selected[slotKey] && <span style={{ color:"#fff", fontSize:11 }}>✓</span>}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:12, fontWeight:"600", color:T.text }}>{slotLabel(slotKey)}</div>
                <div style={{ fontSize:11, color:T.textMuted, marginTop:2, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ color: fromP ? fromP.color : T.textFaint }}>{fromP ? fromP.name : "Ingen"}</span>
                  <span>→</span>
                  <span style={{ color: toP ? toP.color : T.textFaint, fontWeight:"600" }}>{toP ? toP.name : "Ingen"}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={apply} disabled={!Object.values(selected).some(Boolean)} style={{
          flex:1, padding:"11px", borderRadius:9, cursor:"pointer",
          background: T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"700",
        }}>
          Uppdatera {Object.values(selected).filter(Boolean).length} pass
        </button>
        <button onClick={() => { setStep("idle"); setDiff(null); }} style={{
          padding:"11px 16px", borderRadius:9, cursor:"pointer",
          background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.textMuted, fontSize:14,
        }}>Avbryt</button>
      </div>
    </div>
  );

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleImage} style={{ display:"none" }} />

      {error && (
        <div style={{ fontSize:13, color:"#f87171", marginBottom:12, padding:"8px 10px", background:"rgba(239,68,68,0.08)", borderRadius:8 }}>
          {error}
        </div>
      )}
      <button onClick={() => inputRef.current.click()} style={{
        width:"100%", padding:"14px", borderRadius:12, cursor:"pointer",
        background: T.cardBg, border:`2px dashed ${T.accent}55`,
        color:T.accent, fontSize:14, fontWeight:"600",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8,
      }}>
        <span style={{ fontSize:20 }}>📸</span> Ta bild på whiteboard
      </button>
    </div>
  );
}
