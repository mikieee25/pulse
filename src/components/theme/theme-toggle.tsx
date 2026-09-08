"use client"

import { Moon, Sun } from "lucide-react"
import { startTransition, useEffect, useState } from "react"

const STORAGE_KEY = "pulse-theme"
type Theme = "dark" | "light"

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
  document.documentElement.classList.toggle("light", theme === "light")
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark")

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY)
      if (saved === "light" || saved === "dark") {
        startTransition(() => setTheme(saved))
        applyTheme(saved)
      }
    } catch {
      // The toggle still works for this session when storage is unavailable.
    }
  }, [])

  const nextTheme = theme === "dark" ? "light" : "dark"

  function handleToggle() {
    setTheme(nextTheme)
    applyTheme(nextTheme)
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme)
    } catch {
      // Persistence is optional when storage is unavailable.
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      className="grid size-9 place-items-center rounded-full border border-line bg-canvas-deep text-slate transition-colors hover:border-pulse/40 hover:text-pulse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse/40"
    >
      {theme === "dark" ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </button>
  )
}
