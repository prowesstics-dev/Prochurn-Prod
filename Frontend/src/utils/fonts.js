export function applyFontFamily(fontFamily) {
  document.documentElement.style.setProperty("--app-font-family", fontFamily);

  // Make it the real font for the whole app
  document.documentElement.style.fontFamily = fontFamily;
  document.body.style.fontFamily = fontFamily;

  localStorage.setItem("app_font_family", fontFamily);
}

export function ensureGoogleFontLoaded(fontName) {
  const id = `gf-${fontName.replace(/\s+/g, "-")}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    fontName
  )}:wght@300;400;500;600;700&display=swap`;
  document.head.appendChild(link);
}
