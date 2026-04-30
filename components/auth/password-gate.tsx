"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const UNLOCKED_KEY = "basket_scoresheet_password_unlocked"

export function PasswordGate({ children }: { children: ReactNode }) {
  const appPassword = process.env.NEXT_PUBLIC_APP_PASSWORD ?? ""
  const enabled = useMemo(() => appPassword.trim().length > 0, [appPassword])
  const [ready, setReady] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!enabled) {
      setUnlocked(true)
      setReady(true)
      return
    }
    const ok = window.localStorage.getItem(UNLOCKED_KEY) === "1"
    setUnlocked(ok)
    setReady(true)
  }, [enabled])

  const handleUnlock = () => {
    if (password === appPassword) {
      window.localStorage.setItem(UNLOCKED_KEY, "1")
      setUnlocked(true)
      setError("")
      setPassword("")
      return
    }
    setError("パスワードが違います。")
  }

  if (!ready) return null
  if (unlocked) return <>{children}</>

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>パスワード入力</CardTitle>
          <CardDescription>
            このアプリは簡易保護されています。設定されたパスワードを入力してください。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="パスワード"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleUnlock()
            }}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="button" className="w-full" onClick={handleUnlock}>
            入室
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
