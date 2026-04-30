"use client"

import { useScore } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { QUARTER_LENGTH_OPTIONS, normalizeQuarterMinutes } from "@/lib/timeout-sheet"

export function GameInfoForm() {
  const { state, updateGameInfo } = useScore()
  const { gameInfo } = state

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary" />
          試合情報
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="tournamentName">大会名</Label>
          <Input
            id="tournamentName"
            placeholder="例：⚪︎⚪︎バスケットボール大会"
            value={gameInfo.tournamentName}
            onChange={(e) => updateGameInfo({ tournamentName: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="quarterMinutes" className="flex flex-wrap items-center gap-2">
            <span>1クォーターの時間（タイムアウトの経過分計算に使用）</span>
            <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-bold leading-none text-primary-foreground">
              必須
            </span>
          </Label>
          <Select
            value={String(normalizeQuarterMinutes(gameInfo.quarterMinutes))}
            onValueChange={(value) => updateGameInfo({ quarterMinutes: Number(value) })}
          >
            <SelectTrigger
              id="quarterMinutes"
              className="h-11 w-full border-[3px] border-primary bg-primary/5 font-semibold shadow-sm hover:bg-primary/10 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {QUARTER_LENGTH_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m}分
                  {m === 5 ? "（ミニバス等）" : m === 6 ? "（小学等）" : m === 8 ? "（中学等）" : "（高校・一般等）"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="date">日付</Label>
            <Input
              id="date"
              type="date"
              className="w-full min-w-0"
              value={gameInfo.date}
              onChange={(e) => updateGameInfo({ date: e.target.value })}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="venue">場所</Label>
            <Input
              id="venue"
              className="w-full min-w-0"
              placeholder="例：⚪︎⚪︎体育館"
              value={gameInfo.venue}
              onChange={(e) => updateGameInfo({ venue: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="startTime">開始時間</Label>
            <Input
              id="startTime"
              type="time"
              className="w-full min-w-0"
              value={gameInfo.startTime}
              onChange={(e) => updateGameInfo({ startTime: e.target.value })}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="endTime">終了時間</Label>
            <Input
              id="endTime"
              type="time"
              className="w-full min-w-0"
              value={gameInfo.endTime}
              onChange={(e) => updateGameInfo({ endTime: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="gameNumber">試合No.</Label>
            <Input
              id="gameNumber"
              className="w-full min-w-0"
              placeholder="例：C28"
              value={gameInfo.gameNumber}
              onChange={(e) => updateGameInfo({ gameNumber: e.target.value })}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="programPage">ページ</Label>
            <Input
              id="programPage"
              type="number"
              className="w-full min-w-0"
              placeholder="例：16"
              value={gameInfo.programPage}
              onChange={(e) => updateGameInfo({ programPage: e.target.value })}
            />
          </div>
          <div className="min-w-0 space-y-2">
            <Label htmlFor="block">ブロック</Label>
            <Input
              id="block"
              className="w-full min-w-0"
              placeholder="例：A"
              value={gameInfo.block}
              onChange={(e) => updateGameInfo({ block: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
