import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteAccount,
  signOut,
  updateDisplayName,
  updateEmail,
  updatePassword,
} from "../lib/auth";
import { useAuth } from "../context/AuthContext";

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

function Section({ title, sub, tone = "default", children }) {
  const isDanger = tone === "danger";
  return (
    <section
      style={{
        display: "grid",
        gap: 12,
        padding: "16px",
        border: `1px solid ${isDanger ? "oklch(0.58 0.23 25 / .3)" : "var(--line-soft)"}`,
        borderRadius: "var(--r-lg)",
        background: isDanger ? "oklch(0.58 0.23 25 / .06)" : "var(--bg)",
      }}
    >
      <div style={{ display: "grid", gap: 4 }}>
        <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 15, color: "var(--ink)", fontWeight: 700 }}>{title}</h3>
        {sub ? <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>{sub}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();

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

  useEffect(() => {
    if (loading) return;
    if (user && isAdmin) {
      navigate("/admin", { replace: true });
    }
  }, [isAdmin, loading, navigate, user]);

  const clearMessages = () => {
    setError("");
    setInfo("");
  };

  const initials = useMemo(() => {
    const source = user?.user_metadata?.full_name || user?.email || "?";
    return source.trim().charAt(0).toUpperCase();
  }, [user]);

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
      navigate("/", { replace: true });
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
      navigate("/", { replace: true });
    } catch (err) {
      setError(err?.message || "Account verwijderen mislukt.");
    } finally {
      setBusyAction("");
    }
  };

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "var(--bg)" }} />;
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", padding: 20 }}>
        <p style={{ fontFamily: "var(--font-sans)" }}>Je bent niet ingelogd.</p>
        <button type="button" onClick={() => navigate("/")} style={primaryBtnStyle}>
          Terug naar kaart
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--ink)", padding: "16px 14px 28px" }}>
      <div
        style={{
          width: "min(100%, 760px)",
          margin: "0 auto",
          background: "var(--bg-elev)",
          border: "1px solid var(--line-soft)",
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow-pop)",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 20px 14px", borderBottom: "1px solid var(--line-soft)" }}>
          <button
            type="button"
            onClick={() => navigate("/")}
            style={{ ...secondaryBtnStyle, minHeight: 34, marginBottom: 10 }}
          >
            Terug
          </button>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontStyle: "italic" }}>Account</h1>
          <p style={{ marginTop: 2, fontSize: 12, color: "var(--ink-soft)" }}>Beheer je profiel en beveiliging</p>
        </div>

        <div style={{ padding: "16px 20px 20px", display: "grid", gap: 14 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px",
              borderRadius: "var(--r-lg)",
              border: "1px solid var(--line-soft)",
              background: "var(--bg)",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "var(--accent)",
                color: "var(--bg)",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {initials}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700 }}>{displayName}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--ink-soft)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {user?.email}
              </div>
            </div>
          </div>

          {info ? <p style={infoStyle}>{info}</p> : null}
          {error ? <p style={errorStyle}>{error}</p> : null}

          <Section title="Profiel" sub="Pas je zichtbare naam aan.">
            <form onSubmit={submitName} style={{ display: "grid", gap: 10 }}>
              <Field label="Naam" value={name} onChange={setName} autoComplete="name" />
              <button type="submit" disabled={!!busyAction} style={secondaryBtnStyle}>
                {busyAction === "name" ? <Spinner /> : null}
                <span>Naam opslaan</span>
              </button>
            </form>
          </Section>

          <Section title="E-mail" sub="Na wijzigen moet je het nieuwe adres bevestigen.">
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

          <Section title="Wachtwoord" sub="Kies een sterk wachtwoord dat je nog niet gebruikt.">
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

          <Section title="Gevaarzone" sub="Deze actie kan niet ongedaan worden gemaakt." tone="danger">
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

          <div style={{ paddingTop: 4 }}>
            <button type="button" onClick={handleSignOut} disabled={!!busyAction} style={primaryBtnStyle}>
              {busyAction === "signout" ? <Spinner /> : null}
              <span>Uitloggen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
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
  padding: "0 14px",
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
  margin: 0,
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: "var(--r-lg)",
  border: "1px solid oklch(0.52 0.13 150 / .35)",
  background: "oklch(0.52 0.13 150 / .08)",
  color: "oklch(0.52 0.13 150)",
};

const errorStyle = {
  margin: 0,
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  padding: "10px 12px",
  borderRadius: "var(--r-lg)",
  border: "1px solid oklch(0.58 0.23 25 / .35)",
  background: "oklch(0.58 0.23 25 / .1)",
  color: "oklch(0.58 0.23 25)",
};
