import { useState } from "react";
import { PERSON_COLORS } from "../constants";

export default function PersonManager({ T, persons, horses, assignments, myPersonId, user, onShowIdentity, onAdd, onRemove, onSave }) {
  const [editingId, setEditingId]     = useState(null);
  const [editName, setEditName]       = useState("");
  const [editColor, setEditColor]     = useState("");
  const [showAdd, setShowAdd]         = useState(false);
  const [newName, setNewName]         = useState("");

  const startEdit = (p) => { setEditingId(p.id); setEditName(p.name); setEditColor(p.color); };
  const saveEdit  = (id) => { if (!editName.trim()) return; onSave(id, editName.trim(), editColor); setEditingId(null); };
  const handleAdd = () => { if (!newName.trim()) return; onAdd(newName.trim()); setNewName(""); setShowAdd(false); };

  const inputStyle = {
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 6, color: T.text, padding: "9px 11px",
    fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none",
  };
  const formBox  = { background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 14 };
  const btnSmall = (extra = {}) => ({ padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:"500", ...extra });

  const me = persons.find(p => p.id === myPersonId);

  return (
    <div>
      <button onClick={onShowIdentity} style={{ display:"flex", alignItems:"center", gap:6, background:T.editBtn.bg, border:`1px solid ${T.editBtn.border}`, borderRadius:20, padding:"4px 10px 4px 6px", cursor:"pointer", marginBottom:8 }}>
        {me
          ? <><div style={{ width:18, height:18, borderRadius:"50%", background:me.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:"700" }}>{me.name[0]}</div>
              <span style={{ fontSize:11, color:T.editBtn.color, fontWeight:"600" }}>Byt identitet</span></>
          : <span style={{ fontSize:11, color:T.editBtn.color, fontWeight:"600" }}>👤 Välj identitet</span>
        }
      </button>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {persons.map(p => {
          const mySlots   = Object.values(assignments).filter(pid => pid === p.id).length;
          const myHorses  = horses.filter(h => h.ownerPersonId === p.id);
          const isEditing = editingId === p.id;
          return (
            <div key={p.id} style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderLeft:`4px solid ${p.color}`, borderRadius:10, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, color:"#fff", fontWeight:"700" }}>{p.name[0]}</div>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                      <span style={{ fontSize:15, fontWeight:"600", color:T.text }}>{p.name}</span>
                      {p.userId && (
                        <span style={{
                          fontSize:10, fontWeight:"600", padding:"1px 6px", borderRadius:10,
                          background: p.userId === user?.uid ? `${p.color}33` : "rgba(120,120,140,0.15)",
                          color: p.userId === user?.uid ? p.color : T.textMuted,
                        }}>
                          {p.userId === user?.uid ? "Du" : "Länkad"}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:11, color:T.textMuted }}>{mySlots} pass denna vecka</div>
                    {myHorses.length > 0 && (
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3, flexWrap:"wrap" }}>
                        {myHorses.map(h => (
                          <span key={h.id} style={{ display:"flex", alignItems:"center", gap:3, fontSize:11, color:T.textMuted }}>
                            <div style={{ width:8, height:8, borderRadius:"50%", background:h.color, flexShrink:0 }} />
                            {h.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6 }}>
                  <button onClick={() => isEditing ? setEditingId(null) : startEdit(p)} style={btnSmall({ background:T.editBtn.bg, border:`1px solid ${T.editBtn.border}`, color:T.editBtn.color })}>
                    {isEditing ? "Avbryt" : "Ändra"}
                  </button>
                  <button onClick={() => onRemove(p.id)} style={btnSmall({ background:T.removeBtn.bg, border:`1px solid ${T.removeBtn.border}`, color:T.removeBtn.color })}>Ta bort</button>
                </div>
              </div>
              {isEditing && (
                <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${T.rowBorder}`, paddingTop:12 }}>
                  <input
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && saveEdit(p.id)}
                    autoFocus
                    style={{ ...inputStyle, marginBottom:10 }}
                    placeholder="Namn *"
                  />
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
                    {PERSON_COLORS.map(c => (
                      <div key={c} onClick={() => setEditColor(c)} style={{
                        width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer",
                        border: editColor === c ? `3px solid ${T.text}` : "3px solid transparent",
                        boxSizing:"border-box", transition:"border 0.1s",
                      }} />
                    ))}
                  </div>
                  <button onClick={() => saveEdit(p.id)} style={{ padding:"8px 16px", borderRadius:7, cursor:"pointer", background:T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"600" }}>Spara</button>
                </div>
              )}
            </div>
          );
        })}

        {!showAdd
          ? <button onClick={() => setShowAdd(true)} style={{ background:T.cardBg, border:`2px dashed ${T.cardBorder}`, borderRadius:10, padding:"13px", cursor:"pointer", color:T.textMuted, fontSize:13, fontWeight:"500" }}>+ Lägg till person</button>
          : <div style={formBox}>
              <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:"600", color:T.textMuted }}>Ny person</p>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Namn *" autoFocus onKeyDown={e => e.key==="Enter" && handleAdd()} style={{ ...inputStyle, marginBottom:10 }} />
              <div style={{ display:"flex", gap:8 }}>
                <button onClick={handleAdd} style={{ flex:1, padding:"9px", borderRadius:7, cursor:"pointer", background:T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"600" }}>Lägg till</button>
                <button onClick={() => setShowAdd(false)} style={{ padding:"9px 14px", borderRadius:7, cursor:"pointer", background:"transparent", border:`1px solid ${T.cardBorder}`, color:T.textMuted, fontSize:14 }}>Avbryt</button>
              </div>
            </div>
        }
      </div>
    </div>
  );
}
