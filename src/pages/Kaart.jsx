import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import Map from "../components/Map";
import Landing from "./Landing";
import Onboarding from "../components/Onboarding";
import FilterModal from "../components/FilterModal";
import POIDetailModal from "../components/POIDetailModal";
import FavoritesPanel from "../components/FavoritesPanel";
import SettingsModal from "../components/SettingsModal";
import LoadingOverlay from "../components/LoadingOverlay";
import AuthModal from "../components/AuthModal";
import { useFavorites } from "../hooks/useFavorites";
import { useTheme } from "../hooks/useTheme";
import { evaluateOpenState } from "../lib/openingHours";
import { fetchAllPOIs, isInNetherlands } from "../lib/overpass";
import { initSession } from "../lib/session";
import { useAuth } from "../context/AuthContext";

// ── Translations (inline, same pattern as design) ──────────────────────────
export const COPY = {
  nl: {
    panelTitle: "Vanavond in de buurt",
    panelSub: "locaties · gesorteerd op afstand",
    openNow: "Nu open",
    closedNow: "Gesloten",
    closesAt: (t) => `Sluit om ${t}`,
    opensAt: (t) => `Open om ${t}`,
    walking: (m) => `${m} min lopen`,
    free: "Gratis",
    favorites: "Favorieten",
    directions: "Route",
    settings: "Instellingen",
    recenter: "Centreer op mij",
    darkMode: "Nachtmodus",
    noFavs: "Nog geen favorieten",
    noFavsSub: "Tik op het hartje om plekken hier te bewaren",
    advancedFilters: "Meer filters",
    filterRange: "Bereik",
    filterPrice: "Prijsklasse",
    filterRating: "Min. beoordeling",
    filterAny: "Alles",
    filterFree: "Gratis",
    filterReset: "Herstel",
    filterApply: "Toepassen",
    onlyOpen: "Alleen nu geopend",
    activeFilters: (n) => `${n} actief`,
    categories: {
      all: "Alles",
      food: "Eten & drinken",
      outdoor: "Buiten",
      culture: "Cultuur",
      activities: "Activiteiten",
    },
    distance: "Afstand",
    price: "Prijs",
    contact: "Contact",
    noResults: "Geen plekken gevonden. Pas je filters aan.",
    yourLocation: "Jouw locatie",
    refreshBanner: "Plekken vernieuwen…",
    filterHiddenBody: (n) =>
      `${n} plekken zijn geladen maar vallen weg door je filters.`,
    filterHiddenClear: "Filters wissen",
  },
  en: {
    panelTitle: "Tonight near you",
    panelSub: "spots · sorted by distance",
    openNow: "Open now",
    closedNow: "Closed",
    closesAt: (t) => `Closes at ${t}`,
    opensAt: (t) => `Opens at ${t}`,
    walking: (m) => `${m} min walk`,
    free: "Free",
    favorites: "Favorites",
    directions: "Route",
    settings: "Settings",
    recenter: "Re-center on me",
    darkMode: "Night mode",
    noFavs: "No favorites yet",
    noFavsSub: "Tap the heart to save places here",
    advancedFilters: "More filters",
    filterRange: "Range",
    filterPrice: "Price",
    filterRating: "Min. rating",
    filterAny: "Any",
    filterFree: "Free",
    filterReset: "Reset",
    filterApply: "Apply",
    onlyOpen: "Only places open now",
    activeFilters: (n) => `${n} active`,
    categories: {
      all: "All",
      food: "Food & drinks",
      outdoor: "Outdoors",
      culture: "Culture",
      activities: "Activities",
    },
    distance: "Distance",
    price: "Price",
    contact: "Contact",
    noResults: "No places found. Adjust your filters.",
    yourLocation: "Your location",
    refreshBanner: "Refreshing places…",
    filterHiddenBody: (n) =>
      `${n} places loaded but hidden by your filters.`,
    filterHiddenClear: "Clear filters",
  },
};

export const CAT_COLORS = {
  food: "oklch(0.72 0.18 30)",
  outdoor: "oklch(0.70 0.15 145)",
  culture: "oklch(0.70 0.15 300)",
  activities: "oklch(0.78 0.17 75)",
};

export const CATS = [
  { id: "all", nl: "Alles", en: "All" },
  { id: "food", nl: "Eten & drinken", en: "Food & drinks" },
  { id: "outdoor", nl: "Buiten", en: "Outdoors" },
  { id: "culture", nl: "Cultuur", en: "Culture" },
  { id: "activities", nl: "Activiteiten", en: "Activities" },
];

// ── Icon helpers ────────────────────────────────────────────────────────────
export function LogoMark({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C7.5 2 4 5.5 4 10c0 5.5 8 12 8 12s8-6.5 8-12c0-4.5-3.5-8-8-8z"
        fill="var(--accent)"
      />
      <circle cx="12" cy="10" r="3.2" fill="var(--bg-elev)" />
    </svg>
  );
}

export function IconBtn({
  onClick,
  children,
  ariaLabel,
  active = false,
  badge = 0,
  style = {},
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      style={{
        position: "relative",
        width: 42,
        height: 42,
        borderRadius: "var(--r-pill)",
        background: active ? "var(--accent)" : "var(--bg-elev)",
        color: active ? "var(--bg)" : "var(--ink)",
        border: "1px solid var(--line-soft)",
        boxShadow: "var(--shadow-pop)",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        padding: 0,
        ...style,
      }}
    >
      {children}
      {badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -4,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 9,
            background: "var(--accent)",
            color: "#fff",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            fontWeight: 600,
            display: "grid",
            placeItems: "center",
            border: "2px solid var(--bg)",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Cat icon SVGs ───────────────────────────────────────────────────────────
export function CatIcon({ cat, size = 16, color = "currentColor" }) {
  const s = { width: size, height: size };
  if (cat === "food")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 11l3-8 3 8" />
        <path d="M3 11h6" />
        <path d="M9 11v6" />
        <path d="M14 3v10" />
        <path d="M17 3c0 3.5-3 5-3 5s3 1.5 3 5" />
      </svg>
    );
  if (cat === "outdoor")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 18l5-8 3 5 2-3 5 6H3z" />
        <circle cx="17" cy="6" r="2" />
      </svg>
    );
  if (cat === "culture")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="18" height="3" rx="1" />
        <line x1="6" y1="6" x2="6" y2="20" />
        <line x1="10" y1="6" x2="10" y2="20" />
        <line x1="14" y1="6" x2="14" y2="20" />
        <line x1="18" y1="6" x2="18" y2="20" />
        <line x1="3" y1="20" x2="21" y2="20" />
      </svg>
    );
  if (cat === "activities")
    return (
      <svg
        {...s}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  return null;
}

// ── Top bar (mobile floating) ───────────────────────────────────────────────
function TopBar({
  lang,
  onOpenFavs,
  onOpenSettings,
  onOpenFilters,
  activeFilterCount,
  onHome,
}) {
  const t = COPY[lang];
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        padding: "16px 14px 12px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          pointerEvents: "auto",
        }}
      >
        {/* Brand chip */}
        <button
          onClick={onHome}
          aria-label="Hotspot home"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--bg-elev)",
            color: "var(--ink)",
            padding: "8px 14px 8px 10px",
            borderRadius: "var(--r-pill)",
            boxShadow: "var(--shadow-pop)",
            border: "1px solid var(--line-soft)",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 22,
            lineHeight: 1,
            cursor: "pointer",
            transition: "transform .15s ease",
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.96)")}
          onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <LogoMark />
          <span>Hotspot</span>
        </button>
        <div style={{ flex: 1 }} />
        <IconBtn
          onClick={onOpenFilters}
          ariaLabel={t.advancedFilters}
          badge={activeFilterCount}
        >
          <FilterIcon />
        </IconBtn>
        <IconBtn onClick={onOpenFavs} ariaLabel={t.favorites}>
          <HeartIcon />
        </IconBtn>
        <IconBtn onClick={onOpenSettings} ariaLabel={t.settings}>
          <MenuIcon />
        </IconBtn>
      </div>
    </div>
  );
}

// ── Category chip strip (mobile, on map) ────────────────────────────────────
function CategoryBar({ lang, activeCats, onToggle }) {
  return (
    <div
      style={{
        position: "absolute",
        top: 65,
        left: 0,
        right: 0,
        zIndex: 28,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          overflowX: "auto",
          scrollbarWidth: "none",
          padding: "4px 14px 10px",
          pointerEvents: "auto",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%)",
          maskImage:
            "linear-gradient(90deg, transparent 0, #000 16px, #000 calc(100% - 16px), transparent 100%)",
        }}
      >
        <div style={{ display: "flex", gap: 7, width: "max-content" }}>
          {CATS.map((c) => {
            const active =
              activeCats.includes(c.id) ||
              (c.id === "all" && activeCats.length === 0);
            const color = CAT_COLORS[c.id] || "var(--accent)";
            return (
              <button
                key={c.id}
                onClick={() => onToggle(c.id)}
                style={{
                  background: active ? "var(--ink)" : "var(--bg-elev)",
                  color: active ? "var(--bg)" : "var(--ink)",
                  border: `1px solid ${active ? "var(--ink)" : "var(--line-soft)"}`,
                  borderRadius: "var(--r-pill)",
                  padding: c.id === "all" ? "7px 14px" : "7px 14px 7px 8px",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow:
                    "0 2px 4px rgba(0,0,0,.06), 0 8px 20px rgba(0,0,0,.08)",
                  fontFamily: "var(--font-sans)",
                  fontSize: 13,
                  fontWeight: 500,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  transition: "all .25s var(--ease)",
                }}
              >
                {c.id !== "all" && (
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: color,
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CatIcon cat={c.id} size={10} color="#fff" />
                  </span>
                )}
                {lang === "nl" ? c.nl : c.en}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Map recenter button ─────────────────────────────────────────────────────
function MapControls({ lang, onRecenter, sheetH }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 14,
        bottom: (sheetH || 110) + 14,
        zIndex: 25,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "bottom .45s var(--ease)",
      }}
    >
      <IconBtn onClick={onRecenter} ariaLabel={COPY[lang].recenter}>
        <LocateIcon />
      </IconBtn>
    </div>
  );
}

function FilterEmptyHint({ lang, loadedCount, onClear }) {
  const t = COPY[lang];
  return (
    <div
      style={{
        padding: "28px 20px 32px",
        textAlign: "center",
        fontFamily: "var(--font-sans)",
      }}
    >
      <p
        style={{
          color: "var(--ink-soft)",
          fontSize: 14,
          lineHeight: 1.5,
          margin: "0 0 16px",
        }}
      >
        {t.filterHiddenBody(loadedCount)}
      </p>
      <button
        type="button"
        onClick={onClear}
        style={{
          padding: "10px 18px",
          borderRadius: "var(--r-pill)",
          border: "1px solid var(--line)",
          background: "var(--ink)",
          color: "var(--bg)",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        {t.filterHiddenClear}
      </button>
    </div>
  );
}

// ── Bottom sheet (mobile) ───────────────────────────────────────────────────
function BottomSheet({
  lang,
  pois,
  favorites,
  onToggleFav,
  onPickPoi,
  expanded,
  setExpanded,
  onHeight,
  loadedPoiCount,
  showFilterHint,
  onClearFilters,
}) {
  const t = COPY[lang];
  const collapsedH = 72;

  useEffect(() => {
    onHeight && onHeight(expanded ? null : collapsedH);
  }, [expanded]);

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 30,
        background: "var(--bg-elev)",
        borderTopLeftRadius: "var(--r-xl)",
        borderTopRightRadius: "var(--r-xl)",
        boxShadow: "var(--shadow-sheet)",
        height: expanded ? "72%" : collapsedH,
        transition: "height .45s var(--ease)",
        display: "flex",
        flexDirection: "column",
        borderTop: "1px solid var(--line-soft)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "inherit",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
        }}
      >
        {!expanded ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "10px 20px 18px",
            }}
          >
            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 3,
                background: "var(--line)",
                opacity: 0.6,
              }}
            />
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--ink-soft)",
              }}
            >
              <span
                style={{
                  transform: "rotate(180deg)",
                  color: "var(--ink-soft)",
                  display: "inline-flex",
                }}
              >
                <ChevUpIcon />
              </span>
              <span>
                <b style={{ color: "var(--ink)", fontWeight: 600 }}>
                  {showFilterHint ? 0 : pois.length}
                </b>
                {showFilterHint ? (
                  <>
                    {" "}
                    <span style={{ color: "var(--ink-faint)" }}>/ {loadedPoiCount}</span>{" "}
                  </>
                ) : (
                  " "
                )}
                {t.panelSub.split("·")[0].trim()}
              </span>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "8px 0 4px",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 4,
                  borderRadius: 3,
                  background: "var(--line)",
                }}
              />
            </div>
            <div
              style={{
                padding: "6px 20px 14px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--font-display)",
                    fontStyle: "italic",
                    fontSize: 24,
                    lineHeight: 1.05,
                    color: "var(--ink)",
                  }}
                >
                  {t.panelTitle}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    letterSpacing: ".06em",
                    color: "var(--ink-faint)",
                    marginTop: 3,
                    textTransform: "uppercase",
                  }}
                >
                  {showFilterHint
                    ? `0 / ${loadedPoiCount} ${t.panelSub.split("·")[1]?.trim() || "locaties"}`
                    : `${pois.length} ${t.panelSub.split("·")[1]?.trim() || "locaties"}`}
                </div>
              </div>
              <span
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--bg)",
                  border: "1px solid var(--line-soft)",
                  display: "grid",
                  placeItems: "center",
                  color: "var(--ink-soft)",
                  transform: "rotate(180deg)",
                  flexShrink: 0,
                }}
              >
                <ChevUpIcon />
              </span>
            </div>
          </>
        )}
      </button>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 0 40px",
          opacity: expanded ? 1 : 0,
          transition: "opacity .3s var(--ease) .1s",
        }}
      >
        {pois.length === 0 ? (
          showFilterHint ? (
            <FilterEmptyHint
              lang={lang}
              loadedCount={loadedPoiCount}
              onClear={onClearFilters}
            />
          ) : (
            <p
              style={{
                padding: "32px 20px",
                textAlign: "center",
                fontFamily: "var(--font-sans)",
                color: "var(--ink-faint)",
                fontSize: 14,
              }}
            >
              {t.noResults}
            </p>
          )
        ) : (
          pois.map((poi, i) => (
            <PlaceRow
              key={poi.id}
              poi={poi}
              lang={lang}
              favorite={favorites.includes(poi.id)}
              onToggleFav={() => onToggleFav(poi.id)}
              onClick={() => onPickPoi(poi)}
              divider={i < pois.length - 1}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Place row (shared mobile + desktop sidebar) ─────────────────────────────
export function PlaceRow({
  poi,
  lang,
  favorite,
  onToggleFav,
  onClick,
  divider,
}) {
  const t = COPY[lang];
  const c = CAT_COLORS[poi.category] || "var(--accent)";
  const dist = poi._dist != null ? poi._dist : null;
  const walk =
    dist != null ? Math.max(1, Math.round((dist * 1000) / 80)) : null;
  const open = poi._open;

  return (
    <div
      style={{
        padding: "12px 18px",
        display: "flex",
        gap: 12,
        alignItems: "center",
        borderBottom: divider ? "1px solid var(--line-soft)" : "none",
        cursor: "pointer",
      }}
      onClick={onClick}
    >
      {/* Category badge thumbnail */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "var(--r-md)",
          flexShrink: 0,
          background: `color-mix(in oklab, ${c} 18%, var(--bg))`,
          border: `1px solid color-mix(in oklab, ${c} 35%, transparent)`,
          display: "grid",
          placeItems: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <svg
          viewBox="0 0 52 52"
          width="52"
          height="52"
          style={{ position: "absolute", inset: 0, opacity: 0.35 }}
        >
          <defs>
            <pattern
              id={`hatch-${poi.id}`}
              width="4"
              height="4"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(45)"
            >
              <rect width="2" height="4" fill={c} opacity="0.4" />
            </pattern>
          </defs>
          <rect width="52" height="52" fill={`url(#hatch-${poi.id})`} />
        </svg>
        <span
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            color: c,
          }}
        >
          <CatIcon cat={poi.category} size={24} color={c} />
        </span>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontWeight: 600,
            fontSize: 16,
            color: "var(--ink)",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {poi.name || poi.tags?.name || "Onbekend"}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            color: "var(--ink-faint)",
            marginTop: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {poi.tags?.["addr:street"] || poi.tags?.["addr:city"] || poi.category}
        </div>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            marginTop: 8,
            flexWrap: "wrap",
          }}
        >
          {walk != null && (
            <span style={pillStyle}>
              <svg
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ opacity: 0.6 }}
              >
                <circle cx="13" cy="4" r="2" />
                <path d="M9 20l2-6-3-3V7l4-2 3 3 3 1" />
              </svg>
              {t.walking(walk)}
            </span>
          )}
          {open === true && (
            <span
              style={{
                ...pillStyle,
                color: "oklch(0.45 0.15 145)",
                background: "oklch(0.70 0.16 145 / .14)",
                border: "1px solid oklch(0.70 0.16 145 / .25)",
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "oklch(0.60 0.18 145)",
                  display: "inline-block",
                }}
              />
              {t.openNow}
            </span>
          )}
          {open === false && <span style={pillStyle}>{t.closedNow}</span>}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
        aria-label={favorite ? "unfav" : "fav"}
        style={{
          width: 38,
          height: 38,
          borderRadius: "var(--r-pill)",
          background: favorite
            ? "color-mix(in oklab, var(--heart) 15%, var(--bg))"
            : "transparent",
          border: "1px solid var(--line-soft)",
          color: favorite ? "var(--heart)" : "var(--ink-faint)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          padding: 0,
          transition: "all .2s var(--ease)",
        }}
      >
        <HeartIcon
          filled={favorite}
          color={favorite ? "var(--heart)" : "currentColor"}
        />
      </button>
    </div>
  );
}

const pillStyle = {
  fontFamily: "var(--font-mono)",
  fontSize: 10.5,
  color: "var(--ink-soft)",
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "3px 8px",
  borderRadius: "var(--r-pill)",
  background: "var(--bg)",
  border: "1px solid var(--line-soft)",
};

// ── Desktop 2-col app ───────────────────────────────────────────────────────
function DesktopApp({
  lang,
  setLang,
  theme,
  setTheme,
  pois,
  userLocation,
  radius,
  activeCats,
  onToggleCat,
  favorites,
  onToggleFav,
  filters,
  setFilters,
  onApplyFilters,
  selected,
  setSelected,
  showFilters,
  setShowFilters,
  showFavs,
  setShowFavs,
  showSettings,
  setShowSettings,
  activeFilterCount,
  onHome,
  onRecenter,
  user,
  isAdmin,
  onOpenAuth,
  onOpenAccount,
  accountMenuLabel,
  mapRef,
  manualMode,
  onLocationSet,
  pinDropCycle,
  onBoundsChange,
  loadedPoiCount,
  showFilterHint,
  onClearFilters,
  adminLoaderDebug,
  setAdminLoaderDebug,
  debugSource,
  mapExtraFavoritePois = [],
  favoritePoisForList = [],
}) {
  const t = COPY[lang];
  const mapDebugProps = /** @type {any} */ ({
    debugEnabled: isAdmin && adminLoaderDebug,
    debugSource,
  });

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: "var(--ink)",
      }}
    >
      {/* Top nav */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 20px",
          borderBottom: "1px solid var(--line-soft)",
          background: "var(--bg)",
          zIndex: 20,
          flexShrink: 0,
        }}
      >
        <button
          onClick={onHome}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-display)",
            fontStyle: "italic",
            fontSize: 20,
            color: "var(--ink)",
            padding: 0,
            lineHeight: 1,
          }}
        >
          <LogoMark size={18} />
          <span>Hotspot</span>
        </button>

        <div
          style={{
            width: 1,
            height: 20,
            background: "var(--line-soft)",
            marginLeft: 4,
            marginRight: 2,
          }}
        />

        {/* Inline category chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {CATS.map((c) => {
            const active =
              activeCats.includes(c.id) ||
              (c.id === "all" && activeCats.length === 0);
            const color = CAT_COLORS[c.id];
            return (
              <button
                key={c.id}
                onClick={() => onToggleCat(c.id)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: "var(--r-pill)",
                  background:
                    active && c.id !== "all"
                      ? `color-mix(in oklab, ${color} 18%, var(--bg))`
                      : active
                        ? "var(--ink)"
                        : "transparent",
                  color:
                    active && c.id !== "all"
                      ? color
                      : active
                        ? "var(--bg)"
                        : "var(--ink-soft)",
                  border:
                    active && c.id !== "all"
                      ? `1px solid color-mix(in oklab, ${color} 50%, transparent)`
                      : active
                        ? "1px solid var(--ink)"
                        : "1px solid transparent",
                  fontFamily: "var(--font-sans)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all .12s",
                }}
              >
                {c.id !== "all" && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: color,
                      opacity: active ? 1 : 0.5,
                    }}
                  />
                )}
                {lang === "nl" ? c.nl : c.en}
              </button>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Filter + Favs buttons */}
        <button
          onClick={() => setShowFilters(true)}
          style={dtNavBtnStyle(activeFilterCount > 0)}
        >
          <FilterIcon size={14} />
          <span>{lang === "nl" ? "Filters" : "Filters"}</span>
          {activeFilterCount > 0 && (
            <span
              style={{
                background: "var(--accent)",
                color: "#fff",
                borderRadius: 9,
                padding: "1px 6px",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>

        <button onClick={() => setShowFavs(true)} style={dtNavBtnStyle(false)}>
          <HeartIcon size={14} />
          <span>{t.favorites}</span>
          {favorites.length > 0 && (
            <span
              style={{
                background: "var(--accent)",
                color: "#fff",
                borderRadius: 9,
                padding: "1px 6px",
                fontSize: 10,
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
              }}
            >
              {favorites.length}
            </span>
          )}
        </button>

        <div style={{ width: 1, height: 20, background: "var(--line-soft)" }} />

        {/* Lang pill */}
        <div
          style={{
            display: "inline-flex",
            padding: 2,
            gap: 0,
            background: "var(--ink)",
            borderRadius: "var(--r-pill)",
          }}
        >
          {["nl", "en"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              style={{
                padding: "4px 10px",
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                letterSpacing: ".12em",
                textTransform: "uppercase",
                fontWeight: 700,
                background: lang === l ? "var(--bg-elev)" : "transparent",
                color: lang === l ? "var(--ink)" : "var(--bg-elev)",
                border: "none",
                borderRadius: "var(--r-pill)",
                cursor: "pointer",
              }}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            border: "1px solid var(--line-soft)",
            background: "var(--bg-elev)",
            color: "var(--ink)",
            cursor: "pointer",
            display: "grid",
            placeItems: "center",
            padding: 0,
          }}
        >
          {theme === "dark" ? <SunIcon size={14} /> : <MoonIcon size={14} />}
        </button>

        {/* Settings */}
        <button
          onClick={() => setShowSettings(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            borderRadius: "var(--r-pill)",
            background: "var(--ink)",
            color: "var(--bg)",
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--font-sans)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <MenuIcon size={14} />
          <span>{lang === "nl" ? "Menu" : "Menu"}</span>
        </button>

      </div>

      {/* Active filter strip */}
      {(activeCats.length > 0 || activeFilterCount > 0) && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            padding: "8px 20px",
            borderBottom: "1px solid var(--line-soft)",
            background: "var(--bg-elev)",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: ".14em",
              color: "var(--ink-faint)",
              textTransform: "uppercase",
            }}
          >
            {lang === "nl" ? "Actief" : "Active"}
          </span>
          {activeCats.map((cid) => {
            const c = CATS.find((x) => x.id === cid);
            if (!c) return null;
            const color = CAT_COLORS[c.id];
            return (
              <button
                key={cid}
                onClick={() => onToggleCat(cid)}
                style={activeChipStyle(color)}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: color,
                    display: "inline-block",
                  }}
                />
                {lang === "nl" ? c.nl : c.en}
                <span style={{ opacity: 0.6, fontSize: 13, lineHeight: 1 }}>
                  ×
                </span>
              </button>
            );
          })}
          {filters.openOnly && (
            <button
              onClick={() => setFilters({ ...filters, openOnly: false })}
              style={activeChipStyle()}
            >
              {lang === "nl" ? "Nu open" : "Open now"}
              <span style={{ opacity: 0.6, fontSize: 13 }}>×</span>
            </button>
          )}
          {filters.price !== "any" && (
            <button
              onClick={() => setFilters({ ...filters, price: "any" })}
              style={activeChipStyle()}
            >
              {filters.price === "free"
                ? lang === "nl"
                  ? "Gratis"
                  : "Free"
                : filters.price}
              <span style={{ opacity: 0.6, fontSize: 13 }}>×</span>
            </button>
          )}
          {filters.minRating > 0 && (
            <button
              onClick={() => setFilters({ ...filters, minRating: 0 })}
              style={activeChipStyle()}
            >
              ★ {filters.minRating}+
              <span style={{ opacity: 0.6, fontSize: 13 }}>×</span>
            </button>
          )}
          {filters.radius < 99999 && (
            <button
              onClick={() => setFilters({ ...filters, radius: 99999 })}
              style={activeChipStyle()}
            >
              {filters.radius >= 1000
                ? filters.radius / 1000 + " km"
                : filters.radius + " m"}
              <span style={{ opacity: 0.6, fontSize: 13 }}>×</span>
            </button>
          )}
          <button
            onClick={() => {
              onToggleCat("all");
              setFilters({
                radius: 99999,
                price: "any",
                openOnly: false,
                minRating: 0,
              });
            }}
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: ".14em",
              color: "var(--ink-soft)",
              textTransform: "uppercase",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
          >
            {lang === "nl" ? "Alles wissen" : "Clear all"} →
          </button>
        </div>
      )}

      {/* Main: list + map */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* Left: list */}
        <div
          style={{
            borderRight: "1px solid var(--line-soft)",
            background: "var(--bg-elev)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid var(--line-soft)",
              display: "flex",
              alignItems: "baseline",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontSize: 30,
                lineHeight: 1,
              }}
            >
              {lang === "nl" ? "Dichtbij" : "Nearby"}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: ".14em",
                color: "var(--ink-faint)",
                textTransform: "uppercase",
                marginLeft: "auto",
              }}
            >
              {showFilterHint
                ? `0 / ${loadedPoiCount} ${lang === "nl" ? "plekken" : "places"}`
                : `${pois.length} ${lang === "nl" ? "plekken" : "places"}`}
            </div>
          </div>
          <div style={{ overflow: "auto", flex: 1 }}>
            {pois.length === 0 ? (
              showFilterHint ? (
                <FilterEmptyHint
                  lang={lang}
                  loadedCount={loadedPoiCount}
                  onClear={onClearFilters}
                />
              ) : (
                <p
                  style={{
                    padding: "32px 20px",
                    textAlign: "center",
                    fontFamily: "var(--font-sans)",
                    color: "var(--ink-faint)",
                    fontSize: 14,
                  }}
                >
                  {t.noResults}
                </p>
              )
            ) : (
              pois.map((poi, i) => (
                <div
                  key={poi.id}
                  style={{
                    background:
                      selected?.id === poi.id
                        ? "var(--accent-wash)"
                        : "transparent",
                    borderRadius: selected?.id === poi.id ? "var(--r-md)" : 0,
                    transition: "background .15s",
                    margin: selected?.id === poi.id ? "4px 8px" : 0,
                  }}
                >
                  <PlaceRow
                    poi={poi}
                    lang={lang}
                    favorite={favorites.includes(poi.id)}
                    onToggleFav={() => onToggleFav(poi.id)}
                    onClick={() => setSelected(poi)}
                    divider={i < pois.length - 1}
                  />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: map */}
        <div style={{ position: "relative", overflow: "hidden" }}>
          <Map
            pois={pois}
            extraFavoritePois={mapExtraFavoritePois}
            favoriteIds={favorites}
            onBoundsChange={onBoundsChange}
            onSelectPoi={setSelected}
            mapRef={mapRef}
            userLocation={userLocation}
            radius={radius}
            manualMode={manualMode}
            onLocationSet={onLocationSet}
            theme={theme}
            selectedId={selected?.id}
            pinDropCycle={pinDropCycle}
            {...mapDebugProps}
          />
          {/* Recenter + zoom */}
          <div
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              zIndex: 10,
            }}
          >
            <button
              onClick={onRecenter}
              style={dtMapBtnStyle}
              aria-label={t.recenter}
            >
              <LocateIcon size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop modals (centered overlays) */}
      {selected && (
        <DtModal width={560} onClose={() => setSelected(null)}>
          <POIDetailModal
            poi={selected}
            lang={lang}
            isFavorite={() => favorites.includes(selected.id)}
            onToggleFav={() => onToggleFav(selected.id)}
            onClose={() => setSelected(null)}
            embedded
          />
        </DtModal>
      )}
      {showFilters && (
        <DtModal width={480} onClose={() => setShowFilters(false)}>
          <FilterModal
            lang={lang}
            filters={filters}
            setFilters={setFilters}
            onApply={onApplyFilters}
            activeCats={activeCats}
            onToggleCat={onToggleCat}
            onClose={() => setShowFilters(false)}
            embedded
          />
        </DtModal>
      )}
      {showFavs && (
        <DtModal width={560} onClose={() => setShowFavs(false)}>
          <FavoritesPanel
            lang={lang}
            favorites={favoritePoisForList}
            onClose={() => setShowFavs(false)}
            onPickPoi={(poi) => {
              setShowFavs(false);
              setSelected(poi);
            }}
            onToggleFav={onToggleFav}
            embedded
          />
        </DtModal>
      )}
      {showSettings && (
        <DtModal width={440} onClose={() => setShowSettings(false)}>
          <SettingsModal
            lang={lang}
            setLang={setLang}
            theme={theme}
            setTheme={setTheme}
            user={user}
            isAdmin={isAdmin}
            adminLoaderDebug={adminLoaderDebug}
            setAdminLoaderDebug={setAdminLoaderDebug}
            onClose={() => setShowSettings(false)}
            onOpenAdmin={() => {
              setShowSettings(false);
              if (user) {
                onOpenAccount();
                return;
              }
              onOpenAuth();
            }}
            adminLabel={accountMenuLabel}
            embedded
          />
        </DtModal>
      )}
    </div>
  );
}

function DtModal({ children, onClose, width = 480 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(0,0,0,.5)",
        backdropFilter: "blur(2px)",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width,
          maxHeight: "88vh",
          overflow: "auto",
          background: "var(--bg-elev)",
          borderRadius: "var(--r-xl)",
          boxShadow: "0 40px 80px rgba(0,0,0,.4)",
          border: "1px solid var(--line-soft)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function dtNavBtnStyle(active) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "6px 11px",
    background: "transparent",
    color: "var(--ink)",
    border: `1px solid ${active ? "var(--line)" : "var(--line-soft)"}`,
    borderRadius: "var(--r-pill)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: 12,
    fontWeight: 500,
  };
}

const dtMapBtnStyle = {
  width: 42,
  height: 42,
  borderRadius: "var(--r-pill)",
  background: "var(--bg-elev)",
  color: "var(--ink)",
  border: "1px solid var(--line-soft)",
  boxShadow: "var(--shadow-pop)",
  cursor: "pointer",
  display: "grid",
  placeItems: "center",
  padding: 0,
};

function activeChipStyle(color) {
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 10px 5px 9px",
    borderRadius: "var(--r-pill)",
    background: "var(--bg)",
    color: "var(--ink)",
    border: `1px solid ${color ? color + "55" : "var(--line-soft)"}`,
    fontFamily: "var(--font-sans)",
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
  };
}

// ── Inline SVG icons ────────────────────────────────────────────────────────
function FilterIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="7" y1="12" x2="20" y2="12" />
      <line x1="10" y1="18" x2="20" y2="18" />
      <circle cx="8" cy="6" r="2" fill="var(--bg-elev)" />
      <circle cx="14" cy="12" r="2" fill="var(--bg-elev)" />
      <circle cx="17" cy="18" r="2" fill="var(--bg-elev)" />
    </svg>
  );
}
function HeartIcon({ size = 18, filled = false, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : "none"}
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function MenuIcon({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}
function LocateIcon({ size = 18 } = {}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="1" x2="12" y2="4" />
      <line x1="12" y1="20" x2="12" y2="23" />
      <line x1="1" y1="12" x2="4" y2="12" />
      <line x1="20" y1="12" x2="23" y2="12" />
    </svg>
  );
}
function ChevUpIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
function SunIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <circle cx="12" cy="12" r="4" />
      <line x1="12" y1="2" x2="12" y2="5" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="2" y1="12" x2="5" y2="12" />
      <line x1="19" y1="12" x2="22" y2="12" />
      <line x1="4.6" y1="4.6" x2="6.7" y2="6.7" />
      <line x1="17.3" y1="17.3" x2="19.4" y2="19.4" />
      <line x1="4.6" y1="19.4" x2="6.7" y2="17.3" />
      <line x1="17.3" y1="6.7" x2="19.4" y2="4.6" />
    </svg>
  );
}
function MoonIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Media query hook ────────────────────────────────────────────────────────
function useIsDesktop(breakpoint = 900) {
  const [isDesktop, setIsDesktop] = useState(
    () => window.innerWidth >= breakpoint,
  );
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isDesktop;
}

// ── Main Kaart component ────────────────────────────────────────────────────
export default function Kaart() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const [themeState, setThemeState] = useState(theme);
  const {
    addFavorite,
    removeFavorite,
    isFavorite,
    favorites,
    favoriteEntries,
    mergeCoordsFromPois,
  } = useFavorites();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();

  // Stage: landing → onboarding → app
  const [stage, setStage] = useState("landing");
  const [lang, setLang] = useState("nl");

  const openAccountHome = useCallback(() => {
    if (user && isAdmin) {
      navigate("/admin");
      return;
    }
    navigate("/account");
  }, [isAdmin, navigate, user]);

  const accountMenuLabel = useMemo(() => {
    if (!user) return lang === "nl" ? "Inloggen" : "Login";
    if (isAdmin) return "Dashboard";
    return lang === "nl" ? "Account" : "Account";
  }, [isAdmin, lang, user]);

  // Location + data
  const [userLocation, setUserLocation] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [allPois, setAllPois] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Filters
  const [activeCats, setActiveCats] = useState([]);
  const [filters, setFilters] = useState({
    radius: 99999,
    price: "any",
    openOnly: false,
    minRating: 0,
  });

  // UI state
  const [selected, setSelected] = useState(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [sheetH, setSheetH] = useState(72);
  const [showFilters, setShowFilters] = useState(false);
  const [showFavs, setShowFavs] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [pinDropCycle, setPinDropCycle] = useState(0);
  const [lastSearch, setLastSearch] = useState(null);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);
  const [adminLoaderDebug, setAdminLoaderDebug] = useState(
    () => localStorage.getItem("hotspot_admin_loader_debug") === "1",
  );
  /** Last completed fetch; drives admin loader debug (source, timing, steps). */
  const [poiFetchMeta, setPoiFetchMeta] = useState(null);
  /** 'fetch' | 'enrich' | 'idle' — client pipeline after network returns. */
  const [loadPipelinePhase, setLoadPipelinePhase] = useState("idle");
  const [loadDebugElapsedMs, setLoadDebugElapsedMs] = useState(0);

  const mapRef = useRef(null);
  const requestSeqRef = useRef(0);
  const poiFetchAbortRef = useRef(null);
  const fetchedContextRef = useRef(null);
  const loadClockStartRef = useRef(0);
  const isFetchingRef = useRef(false);

  const clearVisibilityFilters = useCallback(() => {
    setActiveCats([]);
    setFilters({
      radius: 99999,
      price: "any",
      openOnly: false,
      minRating: 0,
    });
  }, []);

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    localStorage.setItem("hotspot_admin_loader_debug", adminLoaderDebug ? "1" : "0");
  }, [adminLoaderDebug]);

  useEffect(() => {
    return () => {
      if (boundsFetchDebounceRef.current) {
        clearTimeout(boundsFetchDebounceRef.current);
      }
    };
  }, []);

  /** Live elapsed for admin loader debug only (drives re-renders while overlay is up). */
  useEffect(() => {
    if (!isAdmin || !adminLoaderDebug) return undefined;
    if (!loading && !isApplyingFilters) return undefined;
    if (loadError) return undefined;
    const id = setInterval(() => {
      setLoadDebugElapsedMs(
        Math.round(performance.now() - loadClockStartRef.current),
      );
    }, 100);
    return () => {
      clearInterval(id);
    };
  }, [isAdmin, adminLoaderDebug, loading, isApplyingFilters, loadError]);

  useEffect(() => {
    if (isDesktop || stage === "landing") return undefined;

    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.overscrollBehavior = "none";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
    };
  }, [isDesktop, stage]);

  // Sync theme state with hook
  const setTheme = (t) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem("hotspot_theme", t);
  };

  const loadPOIs = async (lat, lng, r, options = {}) => {
    const { merge = false, onSettled } = options;
    const reqId = ++requestSeqRef.current;
    poiFetchAbortRef.current?.abort();
    const ac = new AbortController();
    poiFetchAbortRef.current = ac;

    isFetchingRef.current = true;
    setLastSearch({ lat, lng, r });
    setLoadError(null);
    loadClockStartRef.current = performance.now();
    setLoadDebugElapsedMs(0);
    setPoiFetchMeta(null);
    setLoadPipelinePhase("fetch");
    setLoading(true);
    try {
      const { pois: raw, meta: fetchMeta } = await fetchAllPOIs(
        lat,
        lng,
        r / 1000,
        ac.signal,
      );
      if (reqId !== requestSeqRef.current) return;

      // Force a paint with the real data source before enrich; otherwise React
      // batches meta + setLoading(false) and the overlay never shows DB/Overpass.
      flushSync(() => {
        setPoiFetchMeta(fetchMeta ?? null);
        setLoadPipelinePhase("enrich");
      });

      if (!raw?.length) {
        setAllPois([]);
        if (!merge) setLoadError({ code: "general" });
        fetchedContextRef.current = { lat, lng, maxRadius: r };
        return;
      }

      // Verrijk afstand eerst (goedkoop) zodat markers meteen verschijnen
      const withDist = raw
        .map((p) => ({
          ...p,
          _dist: calcDistance(lat, lng, p.lat, p.lng),
          _open: null, // nog niet berekend
        }))
        .sort((a, b) => a._dist - b._dist);

      setAllPois(withDist);
      fetchedContextRef.current = { lat, lng, maxRadius: r };

      // Bereken opening hours asynchroon zodat de UI niet blokkeert
      setTimeout(() => {
        if (reqId !== requestSeqRef.current) return;
        setAllPois((prev) =>
          prev.map((p) =>
            p._open === null
              ? { ...p, _open: evaluateOpenState(p.tags?.opening_hours) }
              : p,
          ),
        );
      }, 0);
    } catch (err) {
      if (reqId !== requestSeqRef.current) return;
      if (err?.name === "AbortError") return;
      setPoiFetchMeta(null);
      if (!merge) setAllPois([]);
      const code = err?.code === "rateLimited" || err?.code === "timeout" ? err.code : "general";
      setLoadError({ code });
    } finally {
      if (reqId === requestSeqRef.current) {
        isFetchingRef.current = false;
        setLoadPipelinePhase("idle");
        loadClockStartRef.current = 0;
        setLoading(false);
        setPinDropCycle((c) => c + 1);
        onSettled?.();
      }
    }
  };

  function handleOnboardingDone(result) {
    if (result.cats?.length > 0) setActiveCats(result.cats);
    if (result.openOnly) setFilters((f) => ({ ...f, openOnly: true }));
    if (result.radius && result.radius < 99999) {
      setRadius(result.radius);
      setFilters((f) => ({ ...f, radius: result.radius }));
    }
    if (result.userLocation) {
      setUserLocation(result.userLocation);
      loadPOIs(
        result.userLocation.lat,
        result.userLocation.lng,
        result.radius || 2000,
      );
    }
    setStage("app");
  }

  function handleManualPin(loc) {
    setUserLocation({ lat: loc.lat, lng: loc.lng });
    setManualMode(false);
    const targetRadius = filters.radius < 99999 ? filters.radius : radius;
    loadPOIs(loc.lat, loc.lng, targetRadius);
  }

  function toggleCat(id) {
    if (id === "all") {
      setActiveCats([]);
      return;
    }
    setActiveCats((cs) =>
      cs.includes(id) ? cs.filter((c) => c !== id) : [...cs, id],
    );
  }

  function toggleFav(poi) {
    if (typeof poi === "string") {
      // called with id
      const existing = allPois.find((p) => p.id === poi);
      isFavorite(poi) ? removeFavorite(poi) : existing && addFavorite(existing);
    } else {
      isFavorite(poi.id) ? removeFavorite(poi.id) : addFavorite(poi);
    }
  }

  function recenter() {
    if (userLocation?.lat) {
      mapRef.current?.flyTo([userLocation.lat, userLocation.lng], 15, {
        duration: 1,
      });
    }
  }

  function retryLoad() {
    if (lastSearch) {
      loadPOIs(lastSearch.lat, lastSearch.lng, lastSearch.r);
      return;
    }
    if (userLocation?.lat && userLocation?.lng) {
      const targetRadius = filters.radius < 99999 ? filters.radius : radius;
      loadPOIs(userLocation.lat, userLocation.lng, targetRadius);
    }
  }

  // Kaartbewegingen (pan/zoom) triggeren geen nieuwe fetch.
  // Data wordt alleen geladen bij locatiewijziging of filterwijziging.
  const handleBoundsChange = useCallback(() => {}, []);

  const applyFilters = useCallback(
    async (nextFilters) => {
      const nextRadius = nextFilters.radius ?? 99999;
      const prevRadius = filters.radius ?? 99999;
      const hasLocation = !!userLocation?.lat && !!userLocation?.lng;

      if (!hasLocation || nextRadius >= 99999) {
        setFilters(nextFilters);
        setShowFilters(false);
        return;
      }

      const currentContext = fetchedContextRef.current;
      const sameCenter =
        currentContext &&
        Math.abs(currentContext.lat - userLocation.lat) < 0.0001 &&
        Math.abs(currentContext.lng - userLocation.lng) < 0.0001;
      const maxRadius = sameCenter ? currentContext.maxRadius : 0;
      const radiusChanged = nextRadius !== prevRadius;
      // Filter changes should always sync backing data for that radius, not only when heuristics say so.
      const needsFetch = radiusChanged || nextRadius > maxRadius;

      if (needsFetch) {
        setIsApplyingFilters(true);
        await loadPOIs(userLocation.lat, userLocation.lng, nextRadius, {
          merge: false,
        });
        setIsApplyingFilters(false);
      }

      setFilters(nextFilters);
      setShowFilters(false);
    },
    [filters.radius, radius, userLocation?.lat, userLocation?.lng],
  );

  const filteredPois = useMemo(() => {
    let list = allPois;
    if (activeCats.length > 0)
      list = list.filter((p) => activeCats.includes(p.category));
    if (filters.openOnly) list = list.filter((p) => p._open === true);
    if (filters.radius < 99999)
      list = list.filter((p) => (p._dist || 0) * 1000 <= filters.radius);
    if (filters.price === "free")
      list = list.filter((p) => !p.tags?.fee || p.tags.fee === "no");
    return list;
  }, [allPois, activeCats, filters]);

  useEffect(() => {
    if (allPois.length) mergeCoordsFromPois(allPois);
  }, [allPois, mergeCoordsFromPois]);

  /** All saved favorites for the panel — merged with loaded POIs when available. */
  const favoritePoisForList = useMemo(() => {
    return favoriteEntries.map((e) => {
      const rich = allPois.find((p) => String(p.id) === e.id);
      if (rich) {
        const d =
          userLocation?.lat != null
            ? calcDistance(
                userLocation.lat,
                userLocation.lng,
                rich.lat,
                rich.lng,
              )
            : rich._dist;
        return { ...rich, _dist: d };
      }
      if (e.lat == null || e.lng == null) {
        return {
          id: e.id,
          lat: 0,
          lng: 0,
          name: e.name || e.id,
          category: e.category || "activities",
          tags: {},
          _dist: undefined,
        };
      }
      const d =
        userLocation?.lat != null
          ? calcDistance(userLocation.lat, userLocation.lng, e.lat, e.lng)
          : undefined;
      return {
        id: e.id,
        lat: e.lat,
        lng: e.lng,
        name: e.name || e.id,
        category: e.category || "activities",
        tags: {},
        _dist: d,
      };
    });
  }, [favoriteEntries, allPois, userLocation]);

  /**
   * Favorites with valid coords that are not in the current filtered set — show as heart-only on map.
   */
  const mapExtraFavoritePois = useMemo(() => {
    const inCurrent = new Set(filteredPois.map((p) => String(p.id)));
    return favoriteEntries
      .filter(
        (e) =>
          e.lat != null && e.lng != null && !inCurrent.has(String(e.id)),
      )
      .map((e) => {
        const rich = allPois.find((p) => String(p.id) === e.id);
        if (rich) return { ...rich };
        return {
          id: e.id,
          lat: e.lat,
          lng: e.lng,
          name: e.name || e.id,
          category: e.category || "activities",
          tags: {},
        };
      });
  }, [favoriteEntries, filteredPois, allPois]);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filters.radius < 99999) n++;
    if (filters.price !== "any") n++;
    if (filters.openOnly) n++;
    if (filters.minRating > 0) n++;
    return n;
  }, [filters]);

  const filterHint = allPois.length > 0 && filteredPois.length === 0;
  const showBlockingOverlay = loadError != null || loading || isApplyingFilters;
  const loadingVariant = isApplyingFilters || loading
    ? "radiusExpand"
    : "default";
  const effectiveRadius = filters.radius < 99999 ? filters.radius : radius;
  /** Admin debug card: single source tag, fallback hint, elapsed (see LoadingOverlay). */
  const loaderDebugData = useMemo(() => {
    const m = poiFetchMeta;
    let source = "pending";
    if (m) {
      if (m.dataSource === "client-cache") source = "cache";
      else if (m.dataSource === "supabase") source = "own";
      else source = "overpass";
    }
    const inNl =
      userLocation?.lat != null && userLocation?.lng != null
        ? isInNetherlands(userLocation.lat, userLocation.lng)
        : null;
    return {
      source,
      elapsedSec: loadDebugElapsedMs / 1000,
      pendingInNl: inNl,
    };
  }, [loadDebugElapsedMs, poiFetchMeta, userLocation?.lat, userLocation?.lng]);
  const mapDebugProps = /** @type {any} */ ({
    debugEnabled: isAdmin && adminLoaderDebug,
    debugSource: loaderDebugData?.source,
  });

  useEffect(() => {
    if (stage !== "app") return;
    if (!userLocation?.lat || !userLocation?.lng) return;
    if (effectiveRadius >= 99999) return;
    const map = mapRef.current;
    if (!map?.fitBounds) return;

    const latDelta = effectiveRadius / 111320;
    const lngFactor = Math.max(Math.cos((userLocation.lat * Math.PI) / 180), 0.01);
    const lngDelta = effectiveRadius / (111320 * lngFactor);
    const bounds = [
      [userLocation.lat - latDelta, userLocation.lng - lngDelta],
      [userLocation.lat + latDelta, userLocation.lng + lngDelta],
    ];

    map.fitBounds(bounds, {
      padding: [32, 32],
      animate: true,
      duration: 0.7,
    });
  }, [effectiveRadius, stage, userLocation?.lat, userLocation?.lng]);

  // ── Render landing ────────────────────────────────────────────────────────
  if (stage === "landing") {
    return (
      <div
        data-theme={themeState}
        style={{
          minHeight: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          position: "relative",
          width: "100%",
        }}
      >
        <Landing
          lang={lang}
          setLang={setLang}
          theme={themeState}
          setTheme={setTheme}
          isDesktop={isDesktop}
          onStart={() => setStage("onboarding")}
        />
      </div>
    );
  }

  // ── Render onboarding ─────────────────────────────────────────────────────
  if (stage === "onboarding") {
    return (
      <div
        data-theme={themeState}
        style={{ position: "fixed", inset: 0, zIndex: 100 }}
      >
        <Onboarding
          lang={lang}
          isDesktop={isDesktop}
          theme={themeState}
          onDone={handleOnboardingDone}
          onBack={() => setStage("landing")}
        />
      </div>
    );
  }

  // ── Render app ────────────────────────────────────────────────────────────
  return (
    <div
      data-theme={themeState}
      style={{ height: "100vh", overflow: "hidden" }}
    >
      {isDesktop ? (
        <DesktopApp
          lang={lang}
          setLang={setLang}
          theme={themeState}
          setTheme={setTheme}
          pois={filteredPois}
          userLocation={userLocation}
          radius={effectiveRadius}
          activeCats={activeCats}
          onToggleCat={toggleCat}
          favorites={favorites}
          mapExtraFavoritePois={mapExtraFavoritePois}
          onToggleFav={toggleFav}
          filters={filters}
          setFilters={setFilters}
          onApplyFilters={applyFilters}
          selected={selected}
          setSelected={setSelected}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          showFavs={showFavs}
          setShowFavs={setShowFavs}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          activeFilterCount={activeFilterCount}
          onHome={() => setStage("landing")}
          onRecenter={recenter}
          user={user}
          isAdmin={isAdmin}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenAccount={openAccountHome}
          accountMenuLabel={accountMenuLabel}
          mapRef={mapRef}
          manualMode={manualMode}
          onLocationSet={handleManualPin}
          pinDropCycle={pinDropCycle}
          onBoundsChange={handleBoundsChange}
          loadedPoiCount={allPois.length}
          showFilterHint={filterHint}
          onClearFilters={clearVisibilityFilters}
          adminLoaderDebug={adminLoaderDebug}
          setAdminLoaderDebug={setAdminLoaderDebug}
          debugSource={loaderDebugData?.source}
          favoritePoisForList={favoritePoisForList}
        />
      ) : (
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background: "var(--bg)",
          }}
        >
          <Map
            pois={filteredPois}
            extraFavoritePois={mapExtraFavoritePois}
            favoriteIds={favorites}
            onBoundsChange={handleBoundsChange}
            onSelectPoi={(p) => {
              setSelected(p);
              setSheetExpanded(false);
            }}
            mapRef={mapRef}
            userLocation={userLocation}
            radius={effectiveRadius}
            manualMode={manualMode}
            onLocationSet={handleManualPin}
            theme={themeState}
            selectedId={selected?.id}
            pinDropCycle={pinDropCycle}
            {...mapDebugProps}
          />

          <TopBar
            lang={lang}
            onOpenFavs={() => setShowFavs(true)}
            onOpenSettings={() => setShowSettings(true)}
            onOpenFilters={() => setShowFilters(true)}
            onHome={() => setStage("landing")}
            activeFilterCount={activeFilterCount}
          />

          <CategoryBar
            lang={lang}
            activeCats={activeCats}
            onToggle={toggleCat}
          />

          <MapControls
            lang={lang}
            onRecenter={recenter}
            sheetH={sheetExpanded ? null : 72}
          />

          <BottomSheet
            lang={lang}
            pois={filteredPois}
            favorites={favorites}
            onToggleFav={toggleFav}
            onPickPoi={(p) => {
              setSelected(p);
              setSheetExpanded(false);
            }}
            expanded={sheetExpanded}
            setExpanded={setSheetExpanded}
            onHeight={setSheetH}
            loadedPoiCount={allPois.length}
            showFilterHint={filterHint}
            onClearFilters={clearVisibilityFilters}
          />

          {selected && (
            <POIDetailModal
              poi={selected}
              lang={lang}
              isFavorite={() => isFavorite(selected.id)}
              onToggleFav={() => toggleFav(selected)}
              onClose={() => setSelected(null)}
            />
          )}

          {showFavs && (
            <FavoritesPanel
              lang={lang}
              favorites={favoritePoisForList}
              onClose={() => setShowFavs(false)}
              onPickPoi={(p) => {
                setShowFavs(false);
                setSelected(p);
              }}
              onToggleFav={toggleFav}
            />
          )}

          {showFilters && (
            <FilterModal
              lang={lang}
              filters={filters}
              setFilters={setFilters}
              onApply={applyFilters}
              activeCats={activeCats}
              onToggleCat={toggleCat}
              onClose={() => setShowFilters(false)}
            />
          )}

          {showSettings && (
            <SettingsModal
              lang={lang}
              setLang={setLang}
              theme={themeState}
              setTheme={setTheme}
              user={user}
              isAdmin={isAdmin}
              adminLoaderDebug={adminLoaderDebug}
              setAdminLoaderDebug={setAdminLoaderDebug}
              onClose={() => setShowSettings(false)}
              onOpenAdmin={() => {
                setShowSettings(false);
                if (user) {
                  openAccountHome();
                  return;
                }
                setShowAuthModal(true);
              }}
              adminLabel={accountMenuLabel}
            />
          )}
        </div>
      )}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      {showBlockingOverlay && (
        <LoadingOverlay
          error={loadError}
          onRetry={loadError ? retryLoad : null}
          variant={loadingVariant}
          debugEnabled={isAdmin && adminLoaderDebug}
          debugData={loaderDebugData}
        />
      )}
    </div>
  );
}

