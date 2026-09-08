"use client"

import { startTransition, useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, Bell, CheckCheck, Clock3, UserRound } from "lucide-react"
import Link from "next/link"
import type { NotificationItem, NotificationKind } from "@/lib/notifications"

const STORAGE_KEY = "pulse-read-notifications"
const MENU_ID = "pulse-notification-menu"

function readStoredIds() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]")
    return Array.isArray(stored) ? stored.filter((id): id is string => typeof id === "string") : []
  } catch {
    return []
  }
}

function iconFor(kind: NotificationKind) {
  if (kind === "replacement") return <AlertTriangle className="size-4" aria-hidden="true" />
  if (kind === "expiring") return <Clock3 className="size-4" aria-hidden="true" />
  if (kind === "unassigned") return <UserRound className="size-4" aria-hidden="true" />
  return <Activity className="size-4" aria-hidden="true" />
}

function toneClass(tone: NotificationItem["tone"]) {
  if (tone === "alert") return "text-alert bg-alert/10"
  if (tone === "warning") return "text-amber-500 bg-amber-500/10"
  if (tone === "pulse") return "text-pulse bg-pulse/10"
  return "text-slate bg-slate/10"
}

export function NotificationBell({
  notifications,
  unavailable = false,
}: {
  notifications: NotificationItem[]
  unavailable?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<string[]>([])

  useEffect(() => {
    startTransition(() => setReadIds(readStoredIds()))
  }, [])

  const unreadIds = useMemo(
    () => notifications.map((notification) => notification.id).filter((id) => !readIds.includes(id)),
    [notifications, readIds],
  )

  function markAllAsRead() {
    const ids = notifications.map((notification) => notification.id)
    setReadIds(ids)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // React state still keeps the current session usable when storage is unavailable.
    }
  }

  function markAsRead(id: string) {
    if (readIds.includes(id)) return
    const nextReadIds = [...readIds, id]
    setReadIds(nextReadIds)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextReadIds))
    } catch {
      // React state still keeps the current session usable when storage is unavailable.
    }
  }

  return (
    <div className="relative">
      <button
        className="relative rounded-md p-1.5 text-slate transition-colors hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse"
        aria-label="Notifications"
        aria-expanded={open}
        aria-controls={MENU_ID}
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadIds.length > 0 && (
          <span className="absolute -right-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-alert px-1 text-[10px] font-semibold leading-4 text-paper">
            {unreadIds.length > 9 ? "9+" : unreadIds.length}
          </span>
        )}
      </button>

      {open && (
        <div id={MENU_ID} className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-line bg-canvas-deep shadow-2xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-medium text-paper">Notifications</p>
              <p className="mt-0.5 text-xs text-slate">Live equipment signals</p>
            </div>
            <button
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate transition-colors hover:bg-paper/[0.05] hover:text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              onClick={markAllAsRead}
              disabled={!unreadIds.length}
            >
              <CheckCheck className="size-3.5" aria-hidden="true" />
              Mark all as read
            </button>
          </div>

          {unavailable ? (
            <p className="px-4 py-6 text-center text-sm text-slate">Notifications are temporarily unavailable.</p>
          ) : notifications.length === 0 || unreadIds.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate">No new notifications</p>
          ) : (
            <div className="divide-y divide-line/70">
              {notifications.filter((notification) => !readIds.includes(notification.id)).map((notification) => (
                <Link
                  key={notification.id}
                  href={notification.href}
                  className="flex gap-3 px-4 py-3 transition-colors hover:bg-paper/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pulse"
                  onClick={() => {
                    markAsRead(notification.id)
                    setOpen(false)
                  }}
                >
                  <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${toneClass(notification.tone)}`}>
                    {iconFor(notification.kind)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-paper">{notification.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-slate">{notification.description}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
