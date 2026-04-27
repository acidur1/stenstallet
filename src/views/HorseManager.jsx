import { useState } from "react";
import { HORSE_COLORS } from "../constants";

export default function HorseManager({ T, horses, persons, onAdd, onRemove, onSave }) {
  const [editingId, setEditingId]   = useState(null);
  const [editName, setEditName]     = useState("");
  const [editNote, setEditNote]     = useState("");
  const [editOwner, setEditOwner]   = useState(null);
  const [editBox, setEditBox]       = useState(null);
  const [showAdd, setShowAdd]       = useState(false);
  const [newName, setNewName]       = useState("");
  const [newNote, setNewNote]       = useState("");
  const [newOwner, setNewOwner]     = useState(null);
  const [newBox, setNewBox]         = useState(null);

  const startEdit = (h) => { setEditingId(h.id); setEditName(h.name); setEditNote(h.note || ""); setEditOwner(h.ownerPersonId || null); setEditBox(h.boxNumber || null); };
  const saveEdit  = (id) => { if (!editName.trim()) return; onSave(id, editName.trim(), editNote.trim(), editOwner, editBox); setEditingId(null); };
  const handleAdd = () => { if (!newName.trim()) return; onAdd(newName.trim(), newNote.trim(), newOwner, newBox); setNewName(""); setNewNote(""); setNewOwner(null); setNewBox(null); setShowAdd(false); };

  const inputStyle = {
    background: T.inputBg, border: `1px solid ${T.inputBorder}`,
    borderRadius: 6, color: T.text, padding: "9px 11px",
    fontSize: 14, width: "100%", boxSizing: "border-box", outline: "none",
  };
  const formBox  = { background: T.cardBg, border: `1px solid ${T.cardBorder}`, borderRadius: 10, padding: 14 };
  const btnSmall = (extra = {}) => ({ padding:"5px 10px", borderRadius:6, cursor:"pointer", fontSize:12, fontWeight:"500", ...extra });

  const PersonPicker = ({ selectedId, onChange }) => (
    <div>
      <p style={{ margin:"0 0 6px", fontSize:11, color:T.textMuted, fontWeight:"600" }}>Ägare</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 }}>
        {persons.map(p => {
          const selected = p.id === selectedId;
          return (
            <button key={p.id} onClick={() => onChange(selected ? null : p.id)} style={{
              display:"flex", alignItems:"center", gap:5, padding:"4px 10px 4px 6px",
              borderRadius:20, cursor:"pointer",
              background: selected ? `${p.color}33` : T.inputBg,
              border: selected ? `2px solid ${p.color}` : `2px solid ${T.inputBorder}`,
              color: selected ? p.color : T.textMuted,
              fontWeight: selected ? "700" : "400", fontSize:12, transition:"all 0.1s",
            }}>
              <div style={{ width:16, height:16, borderRadius:"50%", background:p.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, color:"#fff", fontWeight:"700", flexShrink:0 }}>{p.name[0]}</div>
              {p.name}
            </button>
          );
        })}
        {persons.length === 0 && <span style={{ fontSize:12, color:T.textMuted }}>Inga personer tillagda</span>}
      </div>
    </div>
  );

  const BoxPicker = ({ value, onChange }) => (
    <div style={{ marginBottom:12 }}>
      <p style={{ margin:"0 0 6px", fontSize:11, color:T.textMuted, fontWeight:"600" }}>Box nr</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => {
          const sel = value === n;
          return (
            <button key={n} onClick={() => onChange(sel ? null : n)} style={{
              width:34, height:34, borderRadius:7, cursor:"pointer", fontWeight:"700", fontSize:13,
              background: sel ? T.accent : T.inputBg,
              border: `2px solid ${sel ? T.accent : T.inputBorder}`,
              color: sel ? "#fff" : T.textMuted,
              transition:"all 0.1s",
            }}>{n}</button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {[...horses].sort((a, b) => {
          const ai = persons.findIndex(p => p.id === a.ownerPersonId);
          const bi = persons.findIndex(p => p.id === b.ownerPersonId);
          const an = ai === -1 ? Infinity : ai;
          const bn = bi === -1 ? Infinity : bi;
          return an !== bn ? an - bn : a.name.localeCompare(b.name, "sv");
        }).map(h => {
          const isEditing = editingId === h.id;
          const owner = persons.find(p => p.id === h.ownerPersonId);
          return (
            <div key={h.id} style={{ background:T.cardBg, border:`1px solid ${T.cardBorder}`, borderLeft:`4px solid ${h.color}`, borderRadius:10, overflow:"hidden" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:h.color, flexShrink:0 }} />
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:14, fontWeight:"600", color:T.text }}>{h.name}</span>
                      {h.boxNumber && <span style={{ fontSize:11, fontWeight:"700", color:T.textMuted, background:T.subtleBorder, borderRadius:5, padding:"1px 6px" }}>Box {h.boxNumber}</span>}
                    </div>
                    {h.note && <div style={{ fontSize:11, color:T.textMuted, marginTop:1 }}>{h.note}</div>}
                    {owner && (
                      <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
                        <div style={{ width:12, height:12, borderRadius:"50%", background:owner.color, flexShrink:0 }} />
                        <span style={{ fontSize:11, color:owner.color, fontWeight:"600" }}>{owner.name}</span>
                      </div>
                    )}
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
                  <input value={editNote} onChange={e => setEditNote(e.target.value)} placeholder="Anteckning (valfri)" style={{ ...inputStyle, marginBottom:12 }} />
                  <PersonPicker selectedId={editOwner} onChange={setEditOwner} />
                  <BoxPicker value={editBox} onChange={setEditBox} />
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
              <input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Anteckning (valfri)" style={{ ...inputStyle, marginBottom:12 }} />
              <PersonPicker selectedId={newOwner} onChange={setNewOwner} />
              <BoxPicker value={newBox} onChange={setNewBox} />
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
