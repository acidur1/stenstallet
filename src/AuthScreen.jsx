import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

const T = {
  bg: "#0f1117",
  cardBg: "#1a1d27",
  cardBorder: "#2e3347",
  inputBg: "#12141e",
  inputBorder: "#2e3347",
  text: "#f0f2f8",
  textMuted: "#8892aa",
  textFaint: "#4a5270",
  accent: "#4db8d4",
  accentBg: "#1a3a45",
  errorBg: "rgba(239,68,68,0.10)",
  errorBorder: "#7f1d1d",
  errorText: "#f87171",
};

const FIREBASE_ERRORS = {
  "auth/invalid-email": "Ogiltig e-postadress.",
  "auth/user-not-found": "Inget konto hittades med den e-postadressen.",
  "auth/wrong-password": "Fel lösenord.",
  "auth/invalid-credential": "Fel e-post eller lösenord.",
  "auth/email-already-in-use": "Det finns redan ett konto med den e-postadressen.",
  "auth/weak-password": "Lösenordet måste vara minst 6 tecken.",
  "auth/too-many-requests": "För många försök. Vänta en stund och försök igen.",
};

export default function AuthScreen({ auth }) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      setError(FIREBASE_ERRORS[err.code] || "Något gick fel. Försök igen.");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    background: T.inputBg,
    border: `1px solid ${T.inputBorder}`,
    borderRadius: 8,
    color: T.text,
    padding: "11px 13px",
    fontSize: 15,
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: T.bg,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      padding: "20px 16px",
    }}>
      <div style={{ width: "100%", maxWidth: 360 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 48 }}>🐴</span>
          <h1 style={{ margin: "10px 0 4px", fontSize: 24, fontWeight: "700", color: T.accent, letterSpacing: "0.04em" }}>
            Stenstallet
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: T.textFaint, letterSpacing: "0.15em", textTransform: "uppercase" }}>
            Fodringsschema
          </p>
        </div>

        <div style={{
          background: T.cardBg,
          border: `1px solid ${T.cardBorder}`,
          borderRadius: 16,
          padding: "28px 24px",
        }}>
          <h2 style={{ margin: "0 0 22px", fontSize: 17, fontWeight: "700", color: T.text }}>
            {mode === "signin" ? "Logga in" : "Skapa konto"}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: "600", color: T.textMuted, marginBottom: 5 }}>
                E-post
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="din@epost.se"
                required
                autoComplete="email"
                autoFocus
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: "600", color: T.textMuted, marginBottom: 5 }}>
                Lösenord
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Minst 6 tecken" : "Ditt lösenord"}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                style={inputStyle}
              />
            </div>

            {error && (
              <div style={{
                background: T.errorBg,
                border: `1px solid ${T.errorBorder}`,
                borderRadius: 8,
                padding: "10px 12px",
                fontSize: 13,
                color: T.errorText,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              style={{
                marginTop: 4,
                padding: "12px",
                borderRadius: 8,
                cursor: busy ? "not-allowed" : "pointer",
                background: busy ? T.accentBg : T.accent,
                border: "none",
                color: busy ? T.textMuted : "#0f1117",
                fontSize: 15,
                fontWeight: "700",
                transition: "background 0.15s",
              }}
            >
              {busy ? "Vänta…" : mode === "signin" ? "Logga in" : "Skapa konto"}
            </button>
          </form>

          <div style={{ marginTop: 20, textAlign: "center", fontSize: 13, color: T.textMuted }}>
            {mode === "signin" ? (
              <>Har du inget konto?{" "}
                <button onClick={() => { setMode("signup"); setError(""); }} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 13, fontWeight: "600", padding: 0 }}>
                  Registrera dig
                </button>
              </>
            ) : (
              <>Har du redan ett konto?{" "}
                <button onClick={() => { setMode("signin"); setError(""); }} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 13, fontWeight: "600", padding: 0 }}>
                  Logga in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
