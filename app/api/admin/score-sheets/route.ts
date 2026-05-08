import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type ReqBody = {
  password?: string
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ReqBody
  const input = body.password ?? ""
  const adminPassword = process.env.ADMIN_VIEW_PASSWORD ?? ""

  if (!adminPassword) {
    return NextResponse.json(
      { error: "サーバー側の管理者設定が未完了です（ADMIN_VIEW_PASSWORD）。" },
      { status: 500 }
    )
  }

  if (input !== adminPassword) {
    return NextResponse.json({ error: "管理者パスワードが正しくありません。" }, { status: 401 })
  }

  const { client: supabase, error: configError } = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: configError }, { status: 500 })
  }

  const { data, error } = await supabase
    .from("score_sheets")
    .select(
      "id, created_at, updated_at, title, game_date, team_a_name, team_b_name, score_a, score_b, sheet_state"
    )
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ rows: data ?? [] })
}
