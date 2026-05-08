import { NextResponse } from "next/server"
import { getSupabaseAdminClient } from "@/lib/supabase/admin"

type ReqBody = {
  state?: unknown
}

type JsonObject = Record<string, unknown>

function isObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function textOf(value: unknown): string {
  return typeof value === "string" ? value : ""
}

function numberOf(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function buildTitle(state: JsonObject) {
  const gameInfo = isObject(state.gameInfo) ? state.gameInfo : {}
  const teamA = isObject(state.teamA) ? state.teamA : {}
  const teamB = isObject(state.teamB) ? state.teamB : {}
  const date = textOf(gameInfo.date)
  const teamAName = textOf(teamA.name) || "チームA"
  const teamBName = textOf(teamB.name) || "チームB"

  return [date, `${teamAName} vs ${teamBName}`].filter(Boolean).join(" ")
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as ReqBody

  if (!isObject(body.state)) {
    return NextResponse.json({ error: "保存するスコアシートが不正です。" }, { status: 400 })
  }

  const { client: supabase, error: configError } = getSupabaseAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: configError }, { status: 500 })
  }

  const state = body.state
  const gameInfo = isObject(state.gameInfo) ? state.gameInfo : {}
  const teamA = isObject(state.teamA) ? state.teamA : {}
  const teamB = isObject(state.teamB) ? state.teamB : {}

  const { data, error } = await supabase
    .from("score_sheets")
    .insert({
      title: buildTitle(state),
      game_date: textOf(gameInfo.date) || null,
      team_a_name: textOf(teamA.name) || null,
      team_b_name: textOf(teamB.name) || null,
      score_a: numberOf(state.finalScoreA),
      score_b: numberOf(state.finalScoreB),
      sheet_state: state,
    })
    .select("id, created_at")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ sheet: data })
}
