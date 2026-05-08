"use client"

import { useState } from "react"
import type { ScoreState } from "@/lib/score-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

type AdminLogRow = {
  id: string
  created_at: string
  event_type: string
  screen: string | null
  team: string | null
  payload: Record<string, unknown> | null
  session_id: string | null
}

type AdminScoreSheetRow = {
  id: string
  created_at: string
  updated_at: string
  title: string
  game_date: string | null
  team_a_name: string | null
  team_b_name: string | null
  score_a: number
  score_b: number
  sheet_state: ScoreState
}

type AdminLogPanelProps = {
  onRestoreScoreSheet?: (state: ScoreState) => void
}

const NOTE_EVENT = "user_note"

export function AdminLogPanel({ onRestoreScoreSheet }: AdminLogPanelProps) {
  const [password, setPassword] = useState("")
  const [rows, setRows] = useState<AdminLogRow[]>([])
  const [scoreSheets, setScoreSheets] = useState<AdminScoreSheetRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scoreSheetError, setScoreSheetError] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  const load = async () => {
    if (!password.trim()) {
      setError("管理者パスワードを入力してください。")
      return
    }
    setLoading(true)
    setError(null)
    setScoreSheetError(null)
    const [logsRes, sheetsRes] = await Promise.all([
      fetch("/api/admin/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }),
      fetch("/api/admin/score-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }),
    ])
    const logsJson = (await logsRes.json().catch(() => ({}))) as {
      error?: string
      rows?: AdminLogRow[]
    }
    const sheetsJson = (await sheetsRes.json().catch(() => ({}))) as {
      error?: string
      rows?: AdminScoreSheetRow[]
    }
    setLoading(false)

    if (!logsRes.ok) {
      setAuthenticated(false)
      setRows([])
      setScoreSheets([])
      setError(logsJson.error ?? "取得に失敗しました。")
      return
    }

    setAuthenticated(true)
    setRows(logsJson.rows ?? [])
    if (!sheetsRes.ok) {
      setScoreSheets([])
      setScoreSheetError(sheetsJson.error ?? "保存済みスコアシートの取得に失敗しました。")
      return
    }
    setScoreSheets(sheetsJson.rows ?? [])
  }

  const restoreScoreSheet = (sheet: AdminScoreSheetRow) => {
    if (!onRestoreScoreSheet) return
    const ok = window.confirm(
      `「${sheet.title}」を開きます。現在入力中の内容は置き換わります。よろしいですか？`
    )
    if (!ok) return
    onRestoreScoreSheet(sheet.sheet_state)
  }

  const noteOf = (row: AdminLogRow) => {
    if (row.event_type !== NOTE_EVENT) return ""
    const p = row.payload
    if (!p || typeof p.note !== "string") return ""
    return p.note
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">管理者ログ閲覧</CardTitle>
          <CardDescription>
            管理者パスワードで認証すると、保存済みスコアシートとログを確認できます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="password"
              placeholder="管理者パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void load()
              }}
            />
            <Button type="button" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("mr-1 h-4 w-4", loading && "animate-spin")} />
              {authenticated ? "再読み込み" : "認証して表示"}
            </Button>
          </div>

          {error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>

      {authenticated ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">保存済みスコアシート</CardTitle>
            <CardDescription>保存ボタンでSupabaseに保存したスコアシートを開けます。</CardDescription>
          </CardHeader>
          <CardContent>
            {scoreSheetError ? (
              <p className="mb-3 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
                {scoreSheetError}
              </p>
            ) : null}
            {scoreSheets.length > 0 ? (
              <ul className="space-y-2">
                {scoreSheets.map((sheet) => (
                  <li key={sheet.id} className="rounded-md border bg-card p-3 text-sm">
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {new Date(sheet.created_at).toLocaleString("ja-JP", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </span>
                      {sheet.game_date ? <Badge variant="outline">{sheet.game_date}</Badge> : null}
                      <Badge variant="secondary">
                        {sheet.score_a} - {sheet.score_b}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium">{sheet.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {sheet.team_a_name || "チームA"} vs {sheet.team_b_name || "チームB"}
                        </p>
                      </div>
                      <Button type="button" size="sm" onClick={() => restoreScoreSheet(sheet)}>
                        このシートを開く
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">保存済みスコアシートはまだありません。</p>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">操作ログ</CardTitle>
          <CardDescription>保存済みログ（最大200件）を確認できます。</CardDescription>
        </CardHeader>
        <CardContent>
          {authenticated ? (
            <ul className="space-y-2">
              {rows.map((row) => (
                <li key={row.id} className="rounded-md border bg-card p-3 text-sm">
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      {new Date(row.created_at).toLocaleString("ja-JP", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </span>
                    <Badge variant="secondary">{row.event_type}</Badge>
                    {row.screen ? <Badge variant="outline">{row.screen}</Badge> : null}
                    {row.team ? <Badge variant="outline">Team {row.team}</Badge> : null}
                  </div>
                  {noteOf(row) ? (
                    <p className="whitespace-pre-wrap">{noteOf(row)}</p>
                  ) : (
                    <pre className="overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">
                      {JSON.stringify(row.payload ?? {}, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">認証後にログ一覧が表示されます。</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
