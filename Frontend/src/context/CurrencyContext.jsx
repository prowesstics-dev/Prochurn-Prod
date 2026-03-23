import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

const CurrencyContext = createContext(null);

const STORAGE_KEY = "app_currency_code"; // cleared on logout
const RATE_KEY = "app_currency_rates_inrPer1"; // optional cache

// fallback symbols
const SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  JPY: "¥",
  AED: "د.إ",
  CHF: "CHF",
  RUB: "₽",
  KZT: "₸",
};

export function clearCurrencyStorage() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(RATE_KEY);
}

export function CurrencyProvider({ children }) {
  const [code, setCode] = useState(() => localStorage.getItem(STORAGE_KEY) || "INR");

  // store "INR per 1 currency" map like: { USD: 83.1, EUR: 90.2, ... }
  const [inrPer1, setInrPer1] = useState(() => {
    try {
      const raw = localStorage.getItem(RATE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

 useEffect(() => {
  if (code === "INR") {
    localStorage.removeItem(STORAGE_KEY); // ✅ clear selection when INR
  } else {
    localStorage.setItem(STORAGE_KEY, code);
  }
}, [code]);

  useEffect(() => {
    localStorage.setItem(RATE_KEY, JSON.stringify(inrPer1 || {}));
  }, [inrPer1]);

  // Convert from INR base -> selected currency
  const convertFromINR = (amountInINR, targetCode = code) => {
    const n = Number(amountInINR);
    if (!Number.isFinite(n)) return null;

    if (targetCode === "INR") return n;

    const rate = Number(inrPer1?.[targetCode]); // INR per 1 target currency
    if (!Number.isFinite(rate) || rate <= 0) return null;

    // INR -> target currency
    return n / rate;
  };

  const symbol = SYMBOLS[code] || "";

  const value = useMemo(
    () => ({
      code,
      symbol,
      inrPer1,
      setInrPer1,
      setCurrency: setCode,
      resetCurrency: () => {
  localStorage.removeItem(STORAGE_KEY); // ✅ clear saved selection
  setCode("INR");
},
      convertFromINR,
    }),
    [code, symbol, inrPer1]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside CurrencyProvider");
  return ctx;
}
