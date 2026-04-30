"use client"

import { getSupabaseBrowserClient } from "@/lib/supabase/client"

type LogEventInput = {
  eventType: string
  screen?: string
  team?: "A" | "B"
  payload?: Record<string, unknown>
}

export type LogEventResult =
  | { ok: true }
  | { ok: false; reason: string }

const SESSION_KEY = "basket_scoresheet_session_id"
let warnedOnce = false

function getSessionId(): string {
  if (typeof window === "undefined") return "server"

  const existing = window.localStorage.getItem(SESSION_KEY)
  if (existing) return existing

  const next =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(SESSION_KEY, next)
  return next
}

export async function logEvent({
  eventType,
  screen,
  team,
  payload = {},
}: LogEventInput): Promise<LogEventResult> {
  const supabase = getSupabaseBrowserClient()

  if (!supabase) {
    if (!warnedOnce) {
      warnedOnce = true
      console.warn(
        "[logEvent] Supabase環境変数が未設定です。NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。"
      )
    }
    return { ok: false, reason: "Supabaseクライアントを初期化できませんでした（env未設定の可能性）" }
  }

  const { error } = await supabase.from("logs").insert({
    event_type: eventType,
    screen: screen ?? null,
    team: team ?? null,
    payload,
    session_id: getSessionId(),
  })

  if (error) {
    console.error("[logEvent] insert failed:", error.message)
    return { ok: false, reason: error.message }
  }
  return { ok: true }
}
