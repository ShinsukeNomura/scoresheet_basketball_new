"use client"

import { useState } from "react"
import { ScoreProvider, useScore } from "@/lib/score-context"
import { GameInfoForm } from "./game-info-form"
import { TeamInfoForm } from "./team-info-form"
import { PlayerRosterForm } from "./player-roster-form"
import { RunningScore } from "./running-score"
import { CombinedScoreGrid } from "./combined-score-grid"
import { QuarterControl } from "./quarter-control"
import { TimeoutBar } from "./timeout-bar"
import { OfficialsForm } from "./officials-form"
import { FinalResultPanel } from "./final-result-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { logEvent } from "@/lib/event-logger"
import { isSupabaseConfigured } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  ClipboardList,
  Timer,
  Trophy,
  RotateCcw,
  Info,
  User,
  NotebookPen,
} from "lucide-react"

function ScoreSheetContent() {
  const { resetState, state, getTotalScore } = useScore()
  const [activeTab, setActiveTab] = useState("score")
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState("")
  const [noteBusy, setNoteBusy] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)

  const supabaseOk = isSupabaseConfigured()

  const handleSaveNote = async () => {
    const text = noteText.trim()
    if (!text) return
    if (!supabaseOk) {
      const message = "Supabase設定が未反映です。.env.local を保存後、開発サーバーを再起動してください。"
      setNoteError(message)
      toast.error(message)
      return
    }
    setNoteBusy(true)
    setNoteError(null)
    const ok = await logEvent({
      eventType: "user_note",
      screen: activeTab,
      payload: {
        note: text,
        game: {
          tournamentName: state.gameInfo.tournamentName,
          date: state.gameInfo.date,
          gameNumber: state.gameInfo.gameNumber,
          teamA: state.teamA.name,
          teamB: state.teamB.name,
        },
        scores: { A: getTotalScore("A"), B: getTotalScore("B") },
        quarter: state.currentQuarter,
      },
    })
    setNoteBusy(false)
    if (ok) {
      setNoteText("")
      setNoteOpen(false)
      toast.success("メモを記録しました。")
    } else {
      const message = "送信に失敗しました。ネットワークと Supabase の設定を確認してください。"
      setNoteError(message)
      toast.error(message)
    }
  }
  
  const jumpToFoulSelection = (team: "A" | "B") => {
    setActiveTab("players")
    window.setTimeout(() => {
      document.getElementById(`players-team-${team}`)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 120)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-card border-b px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <ClipboardList className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold">バスケスコアシート</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Dialog
              open={noteOpen}
              onOpenChange={(open) => {
                setNoteOpen(open)
                if (!open) {
                  setNoteError(null)
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-primary/40"
                  title={
                    supabaseOk
                      ? "試合中のメモを Supabase に残します"
                      : ".env.local に NEXT_PUBLIC_SUPABASE_URL / ANON_KEY を設定してください"
                  }
                >
                  <NotebookPen className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">メモ記録</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md" showCloseButton>
                <DialogHeader>
                  <DialogTitle>メモを記録</DialogTitle>
                  <DialogDescription>
                    審判・トラブル・備考など、あとから振り返りたい内容を残せます。現在のタブ・スコア概要も一緒に保存されます。
                  </DialogDescription>
                </DialogHeader>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="例: 3Q 〇〇の判定について記録…"
                  className="min-h-[100px] resize-y"
                  maxLength={2000}
                  disabled={noteBusy}
                />
                {!supabaseOk ? (
                  <p className="text-sm text-amber-600">
                    Supabase設定が未反映です。.env.local を保存後、`npm run dev` を再起動してください。
                  </p>
                ) : null}
                {noteError ? (
                  <p className="text-sm text-destructive">{noteError}</p>
                ) : null}
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setNoteOpen(false)}
                    disabled={noteBusy}
                  >
                    キャンセル
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleSaveNote()}
                    disabled={noteBusy || !noteText.trim()}
                  >
                    {noteBusy ? "送信中…" : "Supabase に保存"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  リセット
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>データをリセットしますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    すべての入力データが削除されます。この操作は取り消せません。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={resetState}>リセット</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="info" className="mt-0 space-y-4 p-4">
            <GameInfoForm />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TeamInfoForm team="A" />
              <TeamInfoForm team="B" />
            </div>
            <OfficialsForm />
          </TabsContent>

          <TabsContent value="players" className="mt-0 space-y-4 p-4">
            <PlayerRosterForm team="A" />
            <PlayerRosterForm team="B" />
          </TabsContent>

          <TabsContent value="score" className="mt-0 space-y-4 p-4">
            <QuarterControl />
            {/* タイムアウトバー */}
            <TimeoutBar />
            {/* TO とランニングスコアの間：ファウル入力（選手画面）へのショートカット */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => jumpToFoulSelection("A")}
                className="h-11 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
              >
                A ファウル入力
              </Button>
              <Button
                type="button"
                onClick={() => jumpToFoulSelection("B")}
                className="h-11 rounded-md bg-accent text-accent-foreground hover:bg-accent/90"
              >
                B ファウル入力
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <RunningScore team="A" />
              <RunningScore team="B" />
            </div>
            {/* ランニングスコア表（1〜160点） - 両チーム統合 */}
            <CombinedScoreGrid />
          </TabsContent>

          <TabsContent value="result" className="mt-0 space-y-4 p-4">
            <FinalResultPanel />
          </TabsContent>

          {/* ボトムナビ: 試合情報, 選手, スコア, 結果（TOはスコア画面のバーで操作） */}
          <TabsList className="fixed bottom-0 left-0 right-0 z-20 grid h-auto grid-cols-4 gap-1 rounded-none border-t bg-card p-2">
            <TabsTrigger
              value="info"
              className="flex h-14 flex-col gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Info className="h-5 w-5" />
              <span className="text-[10px] font-bold">試合情報</span>
            </TabsTrigger>
            <TabsTrigger
              value="players"
              className="flex h-14 flex-col gap-1 bg-blue-500 text-white hover:bg-blue-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <User className="h-5 w-5" />
              <span className="text-[10px] font-bold">選手</span>
            </TabsTrigger>
            <TabsTrigger
              value="score"
              className="flex h-14 flex-col gap-1 bg-orange-500 text-white hover:bg-orange-600 data-[state=active]:bg-orange-600 data-[state=active]:text-white"
            >
              <Timer className="h-5 w-5" />
              <span className="text-[10px] font-bold">スコア</span>
            </TabsTrigger>
            <TabsTrigger
              value="result"
              className="flex h-14 flex-col gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Trophy className="h-5 w-5" />
              <span className="text-[10px] font-bold">結果</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </main>
    </div>
  )
}

export function ScoreSheet() {
  return (
    <ScoreProvider>
      <ScoreSheetContent />
    </ScoreProvider>
  )
}
