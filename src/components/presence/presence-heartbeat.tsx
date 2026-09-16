"use client"

import { useEffect } from "react"
import { touchPresence } from "@/app/actions/presence"

export function PresenceHeartbeat() {
  useEffect(() => {
    void touchPresence()
    let interval: ReturnType<typeof setInterval> | undefined
    const stop = () => {
      if (interval) clearInterval(interval)
      interval = undefined
    }
    const start = () => {
      stop()
      if (document.visibilityState !== "visible") return
      interval = setInterval(() => void touchPresence(), 60000)
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void touchPresence()
      start()
    }
    start()
    document.addEventListener("visibilitychange", onVisibilityChange)
    return () => {
      stop()
      document.removeEventListener("visibilitychange", onVisibilityChange)
    }
  }, [])
  return null
}
