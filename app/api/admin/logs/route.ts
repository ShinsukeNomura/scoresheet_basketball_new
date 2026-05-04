import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

type ReqBody = {
  password?: string
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ReqBody
  const input = body.password ?? ""

  const adminPassword = process.env.ADMIN_VIEW_PASSWORD ?? ""
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

  if (!adminPassword || !supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { error: "サーバー側の管理者設定が未完了です（ADMIN_VIEW_PASSWORD / SUPABASE_SERVICE_ROLE_KEY）。" },
      { status: 500 }
    )
  }

  if (input !== adminPassword) {
    return NextResponse.json({ error: "管理者パスワードが正しくありません。" }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase
    .from("logs")
    .select("id, created_at, event_type, screen, team, payload, session_id")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [] })
}
