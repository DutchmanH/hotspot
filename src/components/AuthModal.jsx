import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { sendPasswordReset, signIn, signInWithGoogle, signUp } from "../lib/auth";
import { useAuth } from "../context/AuthContext";

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

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { refreshRole } = useAuth();
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [showResetForm, setShowResetForm] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busyAction, setBusyAction] = useState("");

  const signingIn = busyAction === "signin";
  const signingUp = busyAction === "signup";
  const googleBusy = busyAction === "google";
  const resetBusy = busyAction === "reset";

  const tabTitle = useMemo(() => {
    return tab === "signin" ? "Inloggen" : "Registreren";
  }, [tab]);

  const clearMessages = () => {
    setError("");
    setInfo("");
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    clearMessages();
    setBusyAction("signin");
    try {
      const data = await signIn({ email, password });
      const u = data?.user;
      const nextRole = await refreshRole(u?.id);
      onClose?.();
      if (u && nextRole === "admin") {
        navigate("/admin", { replace: true });
      } else if (u) {
        navigate("/account", { replace: true });
      }
    } catch (err) {
      setError(err?.message || "Inloggen mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    clearMessages();
    setBusyAction("signup");
    try {
      await signUp({ email, password, displayName: name });
      setInfo("Bevestig je e-mail via de link in je inbox.");
    } catch (err) {
      setError(err?.message || "Registreren mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  const handleGoogle = async () => {
    clearMessages();
    setBusyAction("google");
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err?.message || "Inloggen met Google mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  const handlePasswordReset = async () => {
    clearMessages();
    setBusyAction("reset");
    try {
      await sendPasswordReset(resetEmail);
      setInfo("Check je mail.");
    } catch (err) {
      setError(err?.message || "Reset link versturen mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  const openResetForm = () => {
    clearMessages();
    setShowResetForm(true);
    setResetEmail(email);
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
          maxWidth: 520,
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
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontStyle: "italic" }}>{tabTitle}</h2>
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

        <div style={{ padding: "14px 20px 20px" }}>
          <div
            style={{
              display: "inline-flex",
              padding: 3,
              background: "var(--line-soft)",
              borderRadius: "var(--r-pill)",
              gap: 2,
              marginBottom: 14,
            }}
          >
            <button onClick={() => setTab("signin")} style={tabBtnStyle(tab === "signin")}>
              Inloggen
            </button>
            <button onClick={() => setTab("signup")} style={tabBtnStyle(tab === "signup")}>
              Registreren
            </button>
          </div>

          {tab === "signin" ? (
            <form onSubmit={handleSignIn} style={{ display: "grid", gap: 10 }}>
              <Field
                label="E-mail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                placeholder="jij@email.com"
              />
              <Field
                label="Wachtwoord"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={setPassword}
                placeholder="••••••••"
              />

              <button type="submit" disabled={!!busyAction} style={primaryBtnStyle}>
                {signingIn ? <Spinner /> : null}
                <span>Inloggen</span>
              </button>

              <button type="button" onClick={handleGoogle} disabled={!!busyAction} style={secondaryBtnStyle}>
                {googleBusy ? <Spinner /> : null}
                <span>Inloggen met Google</span>
              </button>

              {!showResetForm && (
                <button type="button" onClick={openResetForm} style={linkBtnStyle}>
                  Wachtwoord vergeten?
                </button>
              )}

              {showResetForm && (
                <div style={miniFormStyle}>
                  <Field
                    label="E-mail voor reset"
                    type="email"
                    autoComplete="email"
                    value={resetEmail}
                    onChange={setResetEmail}
                    placeholder="jij@email.com"
                  />
                  <button type="button" onClick={handlePasswordReset} disabled={!!busyAction} style={secondaryBtnStyle}>
                    {resetBusy ? <Spinner /> : null}
                    <span>Verstuur reset-link</span>
                  </button>
                </div>
              )}
            </form>
          ) : (
            <form onSubmit={handleSignUp} style={{ display: "grid", gap: 10 }}>
              <Field
                label="Naam"
                autoComplete="name"
                value={name}
                onChange={setName}
                placeholder="Jouw naam"
              />
              <Field
                label="E-mail"
                type="email"
                autoComplete="email"
                value={email}
                onChange={setEmail}
                placeholder="jij@email.com"
              />
              <Field
                label="Wachtwoord"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
                placeholder="Kies een wachtwoord"
              />

              <button type="submit" disabled={!!busyAction} style={primaryBtnStyle}>
                {signingUp ? <Spinner /> : null}
                <span>Account aanmaken</span>
              </button>

              <button type="button" onClick={handleGoogle} disabled={!!busyAction} style={secondaryBtnStyle}>
                {googleBusy ? <Spinner /> : null}
                <span>Registreren met Google</span>
              </button>
            </form>
          )}

          {info ? <p style={infoStyle}>{info}</p> : null}
          {error ? <p style={errorStyle}>{error}</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

const primaryBtnStyle = {
  marginTop: 4,
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
  height: 42,
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
  fontSize: 14,
  fontWeight: 600,
};

const linkBtnStyle = {
  border: "none",
  background: "transparent",
  color: "var(--accent)",
  cursor: "pointer",
  justifySelf: "start",
  padding: "2px 0",
  fontFamily: "var(--font-sans)",
  fontSize: 13,
};

const miniFormStyle = {
  display: "grid",
  gap: 10,
  marginTop: 6,
  padding: "10px",
  border: "1px solid var(--line-soft)",
  borderRadius: "var(--r-lg)",
  background: "var(--bg)",
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

function tabBtnStyle(active) {
  return {
    border: "none",
    borderRadius: "var(--r-pill)",
    padding: "7px 14px",
    background: active ? "var(--bg-elev)" : "transparent",
    color: active ? "var(--ink)" : "var(--ink-soft)",
    boxShadow: active ? "var(--shadow-pop)" : "none",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    fontWeight: active ? 600 : 500,
  };
}
