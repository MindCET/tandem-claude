"use client"

import { createContext, useContext, useEffect, useState } from "react"
import type { Lang } from "@/lib/i18n/nav"

interface LanguageContextValue {
  lang: Lang
  toggle: () => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "he",
  toggle: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("he")

  useEffect(() => {
    const saved = localStorage.getItem("tandem-lang") as Lang | null
    if (saved === "he" || saved === "en") setLang(saved)
  }, [])

  function toggle() {
    const next: Lang = lang === "he" ? "en" : "he"
    setLang(next)
    localStorage.setItem("tandem-lang", next)
  }

  return (
    <LanguageContext.Provider value={{ lang, toggle }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
