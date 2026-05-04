"use client"

import { useState } from "react"
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

const NOTE_EVENT = "user_note"

export function AdminLogPanel() {
  const [password, setPassword] = useState("")
  const [rows, setRows] = useState<AdminLogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [authenticated, setAuthenticated] = useState(false)

  const load = async () => {
    if (!password.trim()) {
      setError("管理者パスワードを入力してください。")
      return
    }
    setLoading(true)
    setError(null)
    const res = await fetch("/api/admin/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
    const json = (await res.json().catch(() => ({}))) as { error?: string; rows?: AdminLogRow[] }
    setLoading(false)

    if (!res.ok) {
      setAuthenticated(false)
      setRows([])
      setError(json.error ?? "取得に失敗しました。")
      return
    }

    setAuthenticated(true)
    setRows(json.rows ?? [])
  }

  const noteOf = (row: AdminLogRow) => {
    if (row.event_type !== NOTE_EVENT) return ""
    const p = row.payload
    if (!p || typeof p.note !== "string") return ""
    return p.note
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">管理者ログ閲覧</CardTitle>
        <CardDescription>
          管理者パスワードで認証すると、保存済みログ（最大200件）を確認できます。
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
  )
}
