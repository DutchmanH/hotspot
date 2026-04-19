import { useState } from "react";
import { createPortal } from "react-dom";
import { updatePassword } from "../lib/auth";

function Spinner({ size = 16 }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        border: "2px solid color-mix(in oklab, var(--ink) 22%, transparent)",
        borderTopColor: "var(--accent)",
        animation: "spin .8s linear infinite",
        display: "inline-block",
      }}
    />
  );
}

function Field({ label, value, onChange }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-sans)" }}>{label}</span>
      <input
        type="password"
        value={value}
        autoComplete="new-password"
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--line-soft)",
          background: "var(--bg)",
          color: "var(--ink)",
          padding: "11px 12px",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          outline: "none",
        }}
      />
    </label>
  );
}

export default function PasswordRecoveryOverlay({ isOpen }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!password || password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }

    setBusy(true);
    try {
      await updatePassword(password);
      setInfo("Wachtwoord bijgewerkt.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.message || "Wachtwoord updaten mislukt.");
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 320,
        background: "rgba(0,0,0,.52)",
        backdropFilter: "blur(2px)",
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "min(100%, 460px)",
          background: "var(--bg-elev)",
          borderRadius: "var(--r-lg)",
          border: "1px solid var(--line-soft)",
          boxShadow: "var(--shadow-sheet)",
          padding: "20px",
        }}
      >
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic", color: "var(--ink)" }}>
          Nieuw wachtwoord instellen
        </h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, marginTop: 14 }}>
          <Field label="Nieuw wachtwoord" value={password} onChange={setPassword} />
          <Field label="Bevestig wachtwoord" value={confirmPassword} onChange={setConfirmPassword} />
          <button type="submit" disabled={busy} style={primaryBtnStyle}>
            {busy ? <Spinner /> : null}
            <span>Wachtwoord opslaan</span>
          </button>
        </form>
        {info ? <p style={infoStyle}>{info}</p> : null}
        {error ? <p style={errorStyle}>{error}</p> : null}
      </div>
    </div>,
    document.body,
  );
}

const primaryBtnStyle = {
  marginTop: 4,
  minHeight: 42,
  border: "none",
  borderRadius: "var(--r-pill)",
  background: "var(--accent)",
  color: "var(--bg)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 600,
};

const infoStyle = {
  marginTop: 12,
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "oklch(0.52 0.13 150)",
};

const errorStyle = {
  marginTop: 10,
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "oklch(0.58 0.23 25)",
};
