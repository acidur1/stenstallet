import { useState } from "react";
import { DAYS, MEALS } from "../constants";

export default function DayView({
  T, darkMode,
  activeDay, setActiveDay,
  weekDates, todayDayIdx,
  assignments, persons, horses, done, swapMap,
  meals,
  myPersonId,
  onAssignPerson, onToggleDone, onRequestSwap, onCancelSwap, onAcceptSwap,
}) {
  const [editingSlot, setEditingSlot] = useState(null);

  const getPerson = (id) => persons.find(p => p.id === id);

  const handleAssign = (day, mealId, personId) => {
    onAssignPerson(day, mealId, personId);
    setEditingSlot(null);
  };

  return (
    <>
      {/* Day tab pills */}
      <div style={{ display:"flex", gap:4, marginBottom:14 }}>
        {DAYS.map((d, i) => {
          const date    = weekDates[i];
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

      {/* Meal cards */}
      <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
        {meals.map(meal => {
          const slotKey    = `${activeDay}-${meal.id}`;
          const assignedId = assignments[slotKey];
          const person     = assignedId ? getPerson(assignedId) : null;
          const isEditing  = editingSlot === slotKey;
          return (
            <div key={meal.id} style={{
              background: T.cardBg,
              border:`1px solid ${T.cardBorder}`,
              borderRadius:12, overflow:"hidden",
              boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.3)" : "0 1px 4px rgba(0,0,0,0.06)",
            }}>
              {/* Header row */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:22 }}>{meal.icon}</span>
                  <div>
                    <div style={{ fontSize:15, fontWeight:"700", color:T.text, lineHeight:1.2 }}>{meal.label}</div>
                    <div style={{ fontSize:12, color:T.accent, fontWeight:"600", marginTop:1 }}>{meal.time}</div>
                  </div>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
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
              </div>

              {/* Person picker */}
              {isEditing && (
                <div style={{ padding:"10px 14px", display:"flex", flexWrap:"wrap", gap:7, alignItems:"center", background:T.pickerBg, borderTop:`1px solid ${T.pickerBorder}` }}>
                  <span style={{ fontSize:10, fontWeight:"600", color:T.textFaint, letterSpacing:"0.1em", width:"100%", marginBottom:2 }}>VÄLJ ANSVARIG</span>
                  {persons.map(p => (
                    <button key={p.id} onClick={() => handleAssign(activeDay, meal.id, p.id)} style={{
                      display:"flex", alignItems:"center", gap:6,
                      background: assignedId===p.id ? `${p.color}22` : "transparent",
                      border:`2px solid ${assignedId===p.id ? p.color : T.cardBorder}`,
                      borderRadius:22, padding:"5px 12px 5px 6px", cursor:"pointer",
                    }}>
                      <div style={{ width:22, height:22, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, color:"#fff", fontWeight:"700" }}>{p.name[0]}</div>
                      <span style={{ fontSize:13, color: assignedId===p.id ? p.color : T.text, fontWeight: assignedId===p.id ? "700":"400" }}>{p.name}</span>
                    </button>
                  ))}
                  <button onClick={() => handleAssign(activeDay, meal.id, null)} style={{ background:"transparent", border:`1px dashed ${T.cardBorder}`, borderRadius:22, padding:"5px 11px", cursor:"pointer", color:T.textMuted, fontSize:12 }}>✕ Ingen</button>
                </div>
              )}

              {/* Swap footer */}
              {(() => {
                const swap             = swapMap[slotKey];
                const isMySlot         = myPersonId && myPersonId !== "none" && assignedId === myPersonId;
                const isPendingByMe    = isMySlot && !!swap;
                const isPendingByOther = !isMySlot && !!swap && swap.fromPersonId !== myPersonId;
                const from             = swap ? getPerson(swap.fromPersonId) : null;

                if (isPendingByMe) return (
                  <div style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 14px", borderTop:`1px solid ${T.rowBorder}`,
                    background: darkMode ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)",
                  }}>
                    <span style={{ fontSize:13, color:"#f59e0b", fontWeight:"600" }}>🔄 Bytesförfrågan skickad</span>
                    <button onClick={() => onCancelSwap(activeDay, meal.id)} style={{
                      padding:"5px 10px", borderRadius:7, cursor:"pointer", fontSize:12,
                      background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.textMuted,
                    }}>Avbryt</button>
                  </div>
                );

                if (isPendingByOther && from) return (
                  <div style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 14px", borderTop:`1px solid ${T.rowBorder}`,
                    background: darkMode ? "rgba(245,158,11,0.06)" : "rgba(245,158,11,0.04)",
                  }}>
                    <span style={{ fontSize:13, color:T.textMuted }}>
                      <span style={{ display:"inline-block", width:16, height:16, borderRadius:"50%", background:from.color, color:"#fff", fontSize:9, fontWeight:"700", textAlign:"center", lineHeight:"16px", marginRight:5, verticalAlign:"middle" }}>{from.name[0]}</span>
                      {from.name} vill byta
                    </span>
                    {myPersonId && myPersonId !== "none" && (
                      <button onClick={() => onAcceptSwap(activeDay, meal.id)} style={{
                        padding:"5px 12px", borderRadius:7, cursor:"pointer", fontSize:12,
                        background:"#f59e0b", border:"none", color:"#1a1200", fontWeight:"700",
                      }}>Ta över</button>
                    )}
                  </div>
                );

                if (isMySlot && !swap) return (
                  <div style={{ padding:"8px 14px", borderTop:`1px solid ${T.rowBorder}` }}>
                    <button onClick={() => onRequestSwap(activeDay, meal.id)} style={{
                      padding:"6px 12px", borderRadius:7, cursor:"pointer", fontSize:12, fontWeight:"500",
                      background:"transparent", border:`1px dashed ${T.cardBorder}`, color:T.textMuted,
                      display:"flex", alignItems:"center", gap:6,
                    }}>
                      <span>🔄</span> Byt pass
                    </button>
                  </div>
                );

                return null;
              })()}
            </div>
          );
        })}
      </div>
    </>
  );
}
