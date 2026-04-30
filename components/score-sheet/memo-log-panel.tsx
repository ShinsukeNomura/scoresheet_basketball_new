"use client"

import { useCallback, useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RefreshCw } from "lucide-react"

type LogRow = {
  id: string
  created_at: string
  event_type: string
  screen: string | null
  payload: Record<string, unknown> | null
  session_id: string | null
}

function payloadNote(payload: Record<string, unknown> | null): string {
  if (!payload || typeof payload.note !== "string") return ""
  return payload.note
}

function payloadSummary(payload: Record<string, unknown> | null): string {
  if (!payload || typeof payload.game !== "object" || payload.game === null) return ""
  const g = payload.game as Record<string, unknown>
  const parts = [
    typeof g.tournamentName === "string" && g.tournamentName ? g.tournamentName : null,
    typeof g.date === "string" && g.date ? g.date : null,
    typeof g.gameNumber === "string" && g.gameNumber ? `No.${g.gameNumber}` : null,
  ].filter(Boolean)
  const teams =
    typeof g.teamA === "string" || typeof g.teamB === "string"
      ? `${g.teamA || "A"} vs ${g.teamB || "B"}`
      : null
  return [parts.join(" / "), teams].filter(Boolean).join(" — ")
}

function payloadScores(payload: Record<string, unknown> | null): string {
  if (!payload || typeof payload.scores !== "object" || payload.scores === null) return ""
  const s = payload.scores as Record<string, unknown>
  const a = s.A
  const b = s.B
  if (typeof a !== "number" && typeof b !== "number") return ""
  return `${a ?? 0} - ${b ?? 0}`
}

interface MemoLogPanelProps {
  /** タブがアクティブなときだけ再取得したい場合 */
  active?: boolean
}

export function MemoLogPanel({ active = true }: MemoLogPanelProps) {
  const [rows, setRows] = useState<LogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Supabase が設定されていません。.env.local を確認してください。")
      setRows([])
      return
    }
    setLoading(true)
    setError(null)
    const { data, error: qErr } = await supabase
      .from("logs")
      .select("id, created_at, event_type, screen, payload, session_id")
      .eq("event_type", "user_note")
      .order("created_at", { ascending: false })
      .limit(100)

    setLoading(false)
    if (qErr) {
      setError(qErr.message)
      setRows([])
      return
    }
    setRows((data ?? []) as LogRow[])
  }, [])

  useEffect(() => {
    if (active) void load()
  }, [active, load])

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg">メモ記録一覧</CardTitle>
          <CardDescription>
            ヘッダーの「メモ記録」から保存した内容が新しい順に表示されます（最大100件）。
          </CardDescription>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw className={cn("mr-1 h-4 w-4", loading && "animate-spin")} />
          再読み込み
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
            <span className="mt-2 block text-xs text-muted-foreground">
              Supabase の SQL で <code className="rounded bg-muted px-1">logs</code> の SELECT 許可ポリシーを有効にしてください（
              <code className="rounded bg-muted px-1">supabase/logs.sql</code> 更新済み）。
            </span>
          </p>
        ) : null}

        {!error && !loading && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだメモがありません。</p>
        ) : null}

        <ul className="space-y-3">
          {rows.map((row) => {
            const note = payloadNote(row.payload)
            const summary = payloadSummary(row.payload)
            const scores = payloadScores(row.payload)
            const when = new Date(row.created_at).toLocaleString("ja-JP", {
              dateStyle: "short",
              timeStyle: "short",
            })
            return (
              <li
                key={row.id}
                className="rounded-lg border bg-card p-3 text-sm shadow-sm"
              >
                <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>{when}</span>
                  {row.screen ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium text-foreground">タブ: {row.screen}</span>
                  ) : null}
                  {scores ? (
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{scores}</span>
                  ) : null}
                </div>
                {summary ? <p className="mb-2 text-xs text-muted-foreground">{summary}</p> : null}
                <p className="whitespace-pre-wrap text-foreground">{note || "（本文なし）"}</p>
              </li>
            )
          })}
        </ul>
      </CardContent>
    </Card>
  )
}
