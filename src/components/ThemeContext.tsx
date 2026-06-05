"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = "light" | "dark";
type ThemeCtx = { theme: Theme; toggle: () => void };

const ThemeContext = createContext<ThemeCtx>({ theme: "light", toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const saved = (localStorage.getItem("sc-theme") as Theme) ?? "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved === "dark" ? "dark" : "");
  }, []);

  function toggle() {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next === "dark" ? "dark" : "");
      localStorage.setItem("sc-theme", next);
      return next;
    });
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
