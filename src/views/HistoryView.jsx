import { useState } from "react";
import { DAYS, DAYS_FULL, SV_MONTHS, MEALS, fmtDate } from "../constants";

export default function HistoryView({ T, darkMode, history, historyLoading, horses, persons }) {
  const [expandedWeeks, setExpandedWeeks] = useState(() =>
    history && history.length > 0 ? new Set([history[0].weekKey]) : new Set()
  );

  const toggleExpand = (weekKey) => setExpandedWeeks(prev => {
    const next = new Set(prev);
    if (next.has(weekKey)) next.delete(weekKey); else next.add(weekKey);
    return next;
  });

  if (historyLoading) return (
    <div style={{ textAlign:"center", padding:"40px 0", color:T.textMuted, fontSize:14 }}>
      Laddar historik…
    </div>
  );

  if (history && history.length === 0) return (
    <p style={{ textAlign:"center", color:T.textFaint, fontSize:14, fontStyle:"italic", marginTop:40 }}>
      Ingen historik att visa ännu.
    </p>
  );

  if (!history) return null;

  return (
    <div>
      {history.map(week => {
        const isExpanded = expandedWeeks.has(week.weekKey);
        const doneCount  = Object.values(week.done).filter(Boolean).length;
        const totalSlots = DAYS.length * MEALS.length * horses.length;

        return (
          <div key={week.weekKey} style={{ marginBottom:10 }}>
            <button onClick={() => toggleExpand(week.weekKey)} style={{
              width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between",
              background:T.cardBg, border:`1px solid ${T.cardBorder}`,
              borderRadius: isExpanded ? "12px 12px 0 0" : 12,
              padding:"13px 16px", cursor:"pointer", textAlign:"left",
            }}>
              <div>
                <span style={{ fontSize:14, fontWeight:"700", color:T.text }}>Vecka {week.weekNum}</span>
                <span style={{ fontSize:12, color:T.textMuted, marginLeft:10 }}>
                  {fmtDate(week.dates[0])} – {fmtDate(week.dates[6])} {week.dates[6].getFullYear()}
                </span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {week.hasDoneData && horses.length > 0 && (
                  <span style={{
                    fontSize:12, fontWeight:"600", padding:"2px 8px", borderRadius:20,
                    background: darkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    color: T.textMuted,
                  }}>{doneCount}/{totalSlots}</span>
                )}
                <span style={{ fontSize:14, color:T.textFaint }}>{isExpanded ? "▾" : "▸"}</span>
              </div>
            </button>

            {isExpanded && (
              <div style={{ border:`1px solid ${T.cardBorder}`, borderTop:"none", borderRadius:"0 0 12px 12px", overflow:"hidden" }}>
                {DAYS.map((day, dayIdx) => {
                  const date        = week.dates[dayIdx];
                  const hasActivity = MEALS.some(m =>
                    week.assignments[`${day}-${m.id}`] ||
                    horses.some(h => week.done[`${day}-${m.id}-${h.id}`])
                  );
                  return (
                    <div key={day} style={{ borderBottom:`1px solid ${T.rowBorder}` }}>
                      <div style={{ padding:"8px 14px 4px", background: darkMode?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.02)" }}>
                        <span style={{ fontSize:11, fontWeight:"700", color: hasActivity ? T.accent : T.textFaint, letterSpacing:"0.06em" }}>
                          {DAYS_FULL[dayIdx].toUpperCase()} {date.getDate()} {SV_MONTHS[date.getMonth()].toUpperCase()}
                        </span>
                      </div>
                      {MEALS.map((meal, mealIdx) => {
                        const pid    = week.assignments[`${day}-${meal.id}`];
                        const person = pid ? persons.find(p => p.id === pid) : null;
                        const isLast = mealIdx === MEALS.length - 1;
                        return (
                          <div key={meal.id} style={{
                            display:"flex", alignItems:"center", gap:10, padding:"9px 14px",
                            borderBottom: !isLast ? `1px solid ${T.rowBorder}` : "none",
                          }}>
                            <span style={{ fontSize:16, width:22, textAlign:"center", flexShrink:0 }}>{meal.icon}</span>
                            <div style={{ width:38, flexShrink:0 }}>
                              <div style={{ fontSize:10, fontWeight:"600", color:T.textMuted }}>{meal.label}</div>
                              <div style={{ fontSize:9, color:T.textFaint }}>{meal.time}</div>
                            </div>
                            {person ? (
                              <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0 }}>
                                <div style={{ width:20, height:20, borderRadius:"50%", background:person.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:"#fff", fontWeight:"700" }}>{person.name[0]}</div>
                                <span style={{ fontSize:12, color:T.textMuted, fontWeight:"500" }}>{person.name}</span>
                              </div>
                            ) : (
                              <span style={{ fontSize:12, color:T.textFaint, flexShrink:0 }}>—</span>
                            )}
                            <div style={{ display:"flex", gap:4, flexWrap:"wrap", flex:1, justifyContent:"flex-end" }}>
                              {horses.map(horse => {
                                const fed     = week.done[`${day}-${meal.id}-${horse.id}`];
                                const hasData = week.hasDoneData;
                                return (
                                  <div key={horse.id} title={horse.name} style={{
                                    width:10, height:10, borderRadius:"50%", flexShrink:0,
                                    background: !hasData ? T.textFaint : fed ? horse.color : (darkMode?"rgba(239,68,68,0.4)":"rgba(239,68,68,0.3)"),
                                    border: !hasData ? `1px solid ${T.textFaint}` : fed ? "none" : `1px solid ${darkMode?"#7f1d1d":"#fca5a5"}`,
                                    opacity: !hasData ? 0.35 : 1,
                                  }} />
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
