import { useState } from "react";
import { HORSE_COLORS } from "../constants";

export default function HorseManager({ T, horses, onAdd, onRemove, onSave }) {
  const [editingId, setEditingId]   = useState(null);
  const [editName, setEditName]     = useState("");
  const [editNote, setEditNote]     = useState("");
  const [showAdd, setShowAdd]       = useState(false);
  const [newName, setNewName]       = useState("");
  const [newNote, setNewNote]       = useState("");

  const startEdit = (h) => { setEditingId(h.id); setEditName(h.name); setEditNote(h.note || ""); };
  const saveEdit  = (id) => { if (!editName.trim()) return; onSave(id, editName.trim(), editNote.trim()); setEditingId(null); };
  const handleAdd = () => { if (!newName.trim()) return; onAdd(newName.trim(), newNote.trim()); setNewName(""); setNewNote(""); setShowAdd(false); };

  const inputStyle = {
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 6, color: T.text, padding: "9px 11px",
    fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none",
  };
  const formBox  = { background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 14 };
  const btnSmall = (extra = {}) => ({ padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:"500", ...extra });

  return (
    <div>
      <h2 style={{ fontSize:14, fontWeight:"700", color:T.text, marginBottom:12 }}>🐎 Hästar</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {horses.map(h => {
          const isEditing = editingId === h.id;
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
                  <button onClick={() => isEditing ? setEditingId(null) : startEdit(h)} style={btnSmall({ background:T.editBtn.bg, border:`1px solid ${T.editBtn.border}`, color:T.editBtn.color })}>
                    {isEditing ? "Avbryt" : "Ändra"}
                  </button>
                  <button onClick={() => onRemove(h.id)} style={btnSmall({ background:T.removeBtn.bg, border:`1px solid ${T.removeBtn.border}`, color:T.removeBtn.color })}>Ta bort</button>
                </div>
              </div>
              {isEditing && (
                <div style={{ padding:"0 14px 14px", borderTop:`1px solid ${T.rowBorder}`, paddingTop:12 }}>
                  <input value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key==="Enter" && saveEdit(h.id)} autoFocus placeholder="Namn *" style={{ ...inputStyle, marginBottom:8 }} />
                  <input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Anteckning (valfri)" style={{ ...inputStyle, marginBottom:8 }} />
                  <button onClick={() => saveEdit(h.id)} style={{ padding:"8px 16px", borderRadius:7, cursor:"pointer", background:T.tabActiveBg, border:"none", color:"#fff", fontSize:14, fontWeight:"600" }}>Spara</button>
                </div>
              )}
            </div>
          );
        })}

        {!showAdd
          ? <button onClick={() => setShowAdd(true)} style={{ background:T.cardBg, border:`2px dashed ${T.cardBorder}`, borderRadius:10, padding:"13px", cursor:"pointer", color:T.textMuted, fontSize:13, fontWeight:"500" }}>+ Lägg till häst</button>
          : <div style={formBox}>
              <p style={{ margin:"0 0 10px", fontSize:13, fontWeight:"600", color:T.textMuted }}>Ny häst</p>
              <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Namn *" autoFocus style={{ ...inputStyle, marginBottom:8 }} />
              <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Anteckning (valfri)" style={{ ...inputStyle, marginBottom:10 }} />
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
