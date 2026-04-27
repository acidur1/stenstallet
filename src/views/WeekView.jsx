import { DAYS, DAYS_SHORT, DAYS_FULL, SV_MONTHS, SV_MONTHS_FULL, MEALS } from "../constants";

export default function WeekView({
  T, darkMode,
  weekOffset, setWeekOffset,
  weekDates, weekNum, dateRangeStr, todayDayIdx,
  assignments, persons,
  onSyncWhiteboard,
  pendingSwapsForOthers,
  myPersonId,
  onAcceptSwap,
  onNavigateToDay,
}) {
  const getPerson = (id) => persons.find(p => p.id === id);

  return (
    <div>
      {/* Week navigation */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14, gap:8 }}>
        <button onClick={() => setWeekOffset(w => Math.max(0, w - 1))} disabled={weekOffset === 0} style={{
          background:T.cardBg, border:`1px solid ${T.cardBorder}`,
          borderRadius:8, padding:"8px 14px", cursor: weekOffset === 0 ? "default" : "pointer",
          color: weekOffset === 0 ? T.textFaint : T.textMuted, fontSize:18, lineHeight:1, flexShrink:0,
        }}>‹</button>
        <div style={{ textAlign:"center", flex:1 }}>
          <div style={{ fontSize:15, fontWeight:"700", color:T.text }}>
            Vecka {weekNum}
            {weekOffset === 0 && <span style={{ marginLeft:7, fontSize:11, color:T.accent, fontWeight:"500" }}>denna vecka</span>}
            {weekOffset === 1 && <span style={{ marginLeft:7, fontSize:11, color:T.textMuted, fontWeight:"500" }}>nästa vecka</span>}
            {weekOffset === 2 && <span style={{ marginLeft:7, fontSize:11, color:T.textMuted, fontWeight:"500" }}>om 2 veckor</span>}
            {weekOffset === 3 && <span style={{ marginLeft:7, fontSize:11, color:T.textMuted, fontWeight:"500" }}>om 3 veckor</span>}
          </div>
          <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>{dateRangeStr}</div>
        </div>
        <button onClick={() => setWeekOffset(w => Math.min(3, w + 1))} disabled={weekOffset === 3} style={{
          background:T.cardBg, border:`1px solid ${T.cardBorder}`,
          borderRadius:8, padding:"8px 14px", cursor: weekOffset === 3 ? "default" : "pointer",
          color: weekOffset === 3 ? T.textFaint : T.textMuted, fontSize:18, lineHeight:1, flexShrink:0,
        }}>›</button>
      </div>

      {/* Swap notifications */}
      {pendingSwapsForOthers.length > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:"700", color:"#f59e0b", letterSpacing:"0.08em", marginBottom:8 }}>
            🔄 BYTESFÖRFRÅGNINGAR
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {pendingSwapsForOthers.map(([slotKey, req]) => {
              const parts  = slotKey.split("-");
              const day    = parts[0];
              const mealId = parts[1];
              const meal   = MEALS.find(m => m.id === mealId);
              const from   = getPerson(req.fromPersonId);
              if (!meal || !from) return null;
              return (
                <div key={slotKey} style={{
                  background: darkMode ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
                  border: `1px solid ${darkMode ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.4)"}`,
                  borderRadius:12, padding:"12px 14px",
                  display:"flex", alignItems:"center", gap:12,
                }}>
                  <span style={{ fontSize:20, flexShrink:0 }}>{meal.icon}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:"700", color:T.text }}>{day} · {meal.label}</div>
                    <div style={{ fontSize:12, color:T.textMuted, marginTop:2 }}>
                      <span style={{ display:"inline-block", width:16, height:16, borderRadius:"50%", background:from.color, color:"#fff", fontSize:9, fontWeight:"700", textAlign:"center", lineHeight:"16px", marginRight:5, verticalAlign:"middle" }}>{from.name[0]}</span>
                      {from.name} vill byta detta pass
                    </div>
                  </div>
                  {myPersonId && myPersonId !== "none" && (
                    <button onClick={() => onAcceptSwap(day, mealId)} style={{
                      padding:"8px 14px", borderRadius:8, cursor:"pointer", flexShrink:0,
                      background:"#f59e0b", border:"none", color:"#1a1200",
                      fontSize:13, fontWeight:"700",
                    }}>Ta över</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Today section */}
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
                <div key={meal.id} onClick={() => onNavigateToDay(DAYS[todayDayIdx])} style={{
                  flex:1, textAlign:"center", padding:"10px 4px 8px", borderRadius:10, cursor:"pointer",
                  background: p ? `${p.color}18` : (darkMode?"rgba(255,255,255,0.04)":"rgba(0,0,0,0.03)"),
                  border:`1.5px solid ${p ? p.color+"66" : T.cardBorder}`,
                }}>
                  <div style={{ fontSize:16, lineHeight:1 }}>{meal.icon}</div>
                  <div style={{ fontSize:9, fontWeight:"700", color:T.textMuted, marginTop:2, lineHeight:1 }}>{meal.label}</div>
                  <div style={{ fontSize:9, color:T.accent, fontWeight:"600", marginTop:1 }}>{meal.time}</div>
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

      {/* Week table */}
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
                  <th key={d} onClick={() => onNavigateToDay(d)} style={{ padding:"0 0 8px 0", textAlign:"center", borderBottom:`2px solid ${isToday ? T.accent : T.cardBorder}`, cursor:"pointer" }}>
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
                        <div onClick={() => onNavigateToDay(d)} style={{
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

      <div style={{ display:"flex", justifyContent:"center", gap:8, marginTop:16 }}>
        <button onClick={onSyncWhiteboard} style={{
          display:"flex", alignItems:"center", gap:6, padding:"10px 18px",
          background:T.cardBg, border:`1px solid ${T.cardBorder}`,
          borderRadius:10, cursor:"pointer", color:T.textMuted, fontSize:13, fontWeight:"500",
        }}>
          📸 Synka whiteboard
        </button>
      </div>
    </div>
  );
}
