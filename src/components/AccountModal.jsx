import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  deleteAccount,
  signOut,
  updateDisplayName,
  updateEmail,
  updatePassword,
} from "../lib/auth";

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function Spinner({ size = 14 }) {
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

function Field({ label, type = "text", value, onChange, placeholder, autoComplete }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-sans)" }}>{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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

function Section({ title, children }) {
  return (
    <section style={{ display: "grid", gap: 10, padding: "14px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink)", fontWeight: 700 }}>{title}</h3>
      {children}
    </section>
  );
}

export default function AccountModal({ isOpen, onClose, user }) {
  const [name, setName] = useState(user?.user_metadata?.full_name || "");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const displayName = useMemo(() => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Gebruiker";
  }, [user]);

  const clearMessages = () => {
    setError("");
    setInfo("");
  };

  const submitName = async (e) => {
    e.preventDefault();
    clearMessages();
    setBusyAction("name");
    try {
      await updateDisplayName(name.trim());
      setInfo("Naam bijgewerkt.");
    } catch (err) {
      setError(err?.message || "Naam wijzigen mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  const submitEmail = async (e) => {
    e.preventDefault();
    clearMessages();
    setBusyAction("email");
    try {
      await updateEmail(newEmail.trim());
      setInfo("Bevestig via je nieuwe inbox.");
      setNewEmail("");
    } catch (err) {
      setError(err?.message || "E-mail wijzigen mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  const submitPassword = async (e) => {
    e.preventDefault();
    clearMessages();
    if (newPassword !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen.");
      return;
    }
    setBusyAction("password");
    try {
      await updatePassword(newPassword);
      setInfo("Wachtwoord bijgewerkt.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err?.message || "Wachtwoord wijzigen mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  const handleSignOut = async () => {
    clearMessages();
    setBusyAction("signout");
    try {
      await signOut();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Uitloggen mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  const handleDelete = async () => {
    clearMessages();
    setBusyAction("delete");
    try {
      await deleteAccount();
      onClose?.();
    } catch (err) {
      setError(err?.message || "Account verwijderen mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 180,
        background: "rgba(0,0,0,.45)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: 560,
          margin: "0 auto",
          background: "var(--bg-elev)",
          borderRadius: "28px 28px 0 0",
          boxShadow: "var(--shadow-sheet)",
          border: "1px solid var(--line-soft)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 14px",
            borderBottom: "1px solid var(--line-soft)",
          }}
        >
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic" }}>Account</h2>
            <p style={{ marginTop: 2, fontSize: 12, color: "var(--ink-soft)" }}>{displayName}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--bg)",
              border: "1px solid var(--line-soft)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "var(--ink)",
            }}
          >
            <CloseIcon />
          </button>
        </div>

        <div style={{ padding: "0 20px 20px", maxHeight: "80vh", overflow: "auto" }}>
          <Section title="Profiel">
            <form onSubmit={submitName} style={{ display: "grid", gap: 10 }}>
              <Field label="Naam" value={name} onChange={setName} autoComplete="name" />
              <button type="submit" disabled={!!busyAction} style={secondaryBtnStyle}>
                {busyAction === "name" ? <Spinner /> : null}
                <span>Naam opslaan</span>
              </button>
            </form>
          </Section>

          <Section title="E-mail">
            <p style={{ fontSize: 12, color: "var(--ink-soft)", fontFamily: "var(--font-mono)" }}>{user?.email || "-"}</p>
            <form onSubmit={submitEmail} style={{ display: "grid", gap: 10 }}>
              <Field
                label="Nieuw e-mailadres"
                type="email"
                value={newEmail}
                onChange={setNewEmail}
                autoComplete="email"
                placeholder="nieuw@email.com"
              />
              <button type="submit" disabled={!!busyAction} style={secondaryBtnStyle}>
                {busyAction === "email" ? <Spinner /> : null}
                <span>E-mail wijzigen</span>
              </button>
            </form>
          </Section>

          <Section title="Wachtwoord">
            <form onSubmit={submitPassword} style={{ display: "grid", gap: 10 }}>
              <Field
                label="Nieuw wachtwoord"
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                autoComplete="new-password"
              />
              <Field
                label="Bevestig wachtwoord"
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                autoComplete="new-password"
              />
              <button type="submit" disabled={!!busyAction} style={secondaryBtnStyle}>
                {busyAction === "password" ? <Spinner /> : null}
                <span>Wachtwoord wijzigen</span>
              </button>
            </form>
          </Section>

          <Section title="Account verwijderen">
            {!confirmDelete ? (
              <button type="button" onClick={() => setConfirmDelete(true)} style={dangerBtnStyle}>
                Account verwijderen
              </button>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", fontFamily: "var(--font-sans)" }}>Weet je het zeker?</p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => setConfirmDelete(false)} style={secondaryBtnStyle}>
                    Annuleren
                  </button>
                  <button type="button" onClick={handleDelete} disabled={!!busyAction} style={dangerBtnStyle}>
                    {busyAction === "delete" ? <Spinner /> : null}
                    <span>Definitief verwijderen</span>
                  </button>
                </div>
              </div>
            )}
          </Section>

          <div style={{ paddingTop: 14 }}>
            <button type="button" onClick={handleSignOut} disabled={!!busyAction} style={primaryBtnStyle}>
              {busyAction === "signout" ? <Spinner /> : null}
              <span>Uitloggen</span>
            </button>
          </div>

          {info ? <p style={infoStyle}>{info}</p> : null}
          {error ? <p style={errorStyle}>{error}</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const primaryBtnStyle = {
  width: "100%",
  height: 42,
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

const secondaryBtnStyle = {
  minHeight: 40,
  border: "1px solid var(--line-soft)",
  borderRadius: "var(--r-pill)",
  background: "var(--bg)",
  color: "var(--ink)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: 600,
  padding: "0 14px",
};

const dangerBtnStyle = {
  minHeight: 40,
  border: "1px solid oklch(0.58 0.23 25 / .4)",
  borderRadius: "var(--r-pill)",
  background: "oklch(0.58 0.23 25 / .12)",
  color: "oklch(0.58 0.23 25)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: 700,
  padding: "0 14px",
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
