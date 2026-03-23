// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { theme as antdTheme } from "antd";

const LS_KEY = "app_theme_session"; // sessionStorage key

const DEFAULT_THEME = {
  mode: "light",
  id: "ocean",
  accent: "#0b66ff",
};

const THEMES = {
  light: [
    { id: "ocean", name: "Ocean", accent: "#0b66ff" },
    { id: "sky", name: "Sky", accent: "#3b82f6" },
    { id: "slate", name: "Slate", accent: "#64748b" },
    { id: "mint", name: "Mint", accent: "#10b981" },
    { id: "forest", name: "Forest", accent: "#166534" },
    { id: "sun", name: "Sun", accent: "#f59e0b" },
    { id: "rose", name: "Rose", accent: "#e11d48" },
    { id: "grape", name: "Grape", accent: "#7c3aed" },
  ],
  dark: [
    { id: "midnight", name: "Midnight", accent: "#60a5fa" },
    { id: "carbon", name: "Carbon", accent: "#94a3b8" },
    { id: "aurora", name: "Aurora", accent: "#34d399" },
    { id: "ember", name: "Ember", accent: "#fb7185" },
    { id: "violet", name: "Violet", accent: "#a78bfa" },
  ],
};

function safeParse(v) {
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

/** Optional helper: make --primary-soft match any accent */
function hexToRgba(hex, alpha = 0.12) {
  const h = String(hex || "").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(11, 102, 255, ${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function applyCssVars(themeObj) {
  const root = document.documentElement;

  // ✅ matches your index.css selector: html[data-theme="dark"] { ... }
  root.setAttribute("data-theme", themeObj.mode);

  // ✅ variables used by your index.css + you can reuse in inline styles
  root.style.setProperty("--primary-color", themeObj.accent);

  // ✅ dynamic soft glow based on accent (recommended)
  root.style.setProperty(
    "--primary-soft",
    hexToRgba(themeObj.accent, themeObj.mode === "dark" ? 0.18 : 0.12)
  );
}

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeState, setThemeState] = useState(DEFAULT_THEME);

  // Load once (session only)
  useEffect(() => {
    const saved = safeParse(sessionStorage.getItem(LS_KEY));
    if (saved?.mode && saved?.id && saved?.accent) {
      setThemeState(saved);
    }
  }, []);

  // Apply to DOM + persist
  useEffect(() => {
    applyCssVars(themeState);
    sessionStorage.setItem(LS_KEY, JSON.stringify(themeState));
  }, [themeState]);

  const setTheme = (mode, id) => {
    const found = (THEMES[mode] || []).find((t) => t.id === id);
    const next = found
      ? { mode, id: found.id, accent: found.accent }
      : DEFAULT_THEME;
    setThemeState(next);
  };

  const resetTheme = () => {
    sessionStorage.removeItem(LS_KEY);
    setThemeState(DEFAULT_THEME);
  };

  // AntD theme config derived from themeState
  const antdConfig = useMemo(() => {
    const algorithm =
      themeState.mode === "dark"
        ? antdTheme.darkAlgorithm
        : antdTheme.defaultAlgorithm;

    return {
      algorithm,
      token: {
        colorPrimary: themeState.accent,
        fontFamily: "var(--app-font-family)",
      },
    };
  }, [themeState]);

  const value = useMemo(
    () => ({
      themeState,
      THEMES,
      setTheme,
      resetTheme,
      antdConfig,
    }),
    [themeState, antdConfig]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
