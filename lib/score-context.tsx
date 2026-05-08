"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { normalizeQuarterMinutes } from "@/lib/timeout-sheet"
import { logEvent } from "@/lib/event-logger"

export type FoulType = "P" | "P1" | "P2" | "P3" | "T" | "T1" | "U" | "U1" | "U2" | "D" | "C" | "B" | "GD" | ""

export type { FoulRecord }

interface FoulRecord {
  type: FoulType
  quarter: number
}

export interface Player {
  number: string
  name: string
  isCaptain: boolean
  isPlaying: boolean
  fouls: FoulRecord[]
}

export interface TimeoutRecord {
  used: boolean
  cancelled: boolean // 使用しなかった場合（二重線表示）
  /** スコアシート記入用の経過分数（整数・分）。コロの残りから換算して保存 */
  time: string
  quarter: number // どのクォーターで使ったか
}

export interface TeamData {
  name: string
  combinationNumber: string
  coach: string
  assistantCoach: string
  players: Player[]
  score: number[][]
  teamFouls: number[][]
  timeouts: TimeoutRecord[][] // [前半][後半][OT]
}

export interface GameInfo {
  tournamentName: string
  date: string
  startTime: string
  endTime: string
  venue: string
  gameNumber: string
  programPage: string
  block: string
  quarterMinutes: number // 1クォーターの時間（分）：5 / 6 / 8 / 10 のいずれか（タイムアウト換算用）
}

export interface Officials {
  scorer: string
  assistantScorer: string
  timer: string
  shotClockOperator: string
  crewChief: string
  umpire1: string
  umpire2: string
}

export interface ScoreEntry {
  team: "A" | "B"
  quarter: number
  playerNumber: string
  points: number // 1, 2, or 3
  totalScore: number
  timestamp: number
  isThreePointer: boolean
  isFreeThrow?: boolean
}

export interface ScoreState {
  gameInfo: GameInfo
  teamA: TeamData
  teamB: TeamData
  officials: Officials
  scoreEntries: ScoreEntry[]
  currentQuarter: number
  winner: string
  finalScoreA: number
  finalScoreB: number
  quarterLines: number[] // ダブルタップで手動設定するQ区切り線（得点値）
}

const initialPlayer = (): Player => ({
  number: "",
  name: "",
  isCaptain: false,
  isPlaying: false,
  fouls: [],
})

const initialTimeoutRecord = (): TimeoutRecord => ({
  used: false,
  cancelled: false,
  time: "",
  quarter: 0,
})

const initialTeam = (): TeamData => ({
  name: "",
  combinationNumber: "",
  coach: "",
  assistantCoach: "",
  players: Array.from({ length: 18 }, () => initialPlayer()),
  score: [[], [], [], [], []], // Q1, Q2, Q3, Q4, OT
  teamFouls: [
    [0, 0, 0, 0], // Q1
    [0, 0, 0, 0], // Q2
    [0, 0, 0, 0], // Q3
    [0, 0, 0, 0], // Q4
    [0, 0, 0, 0], // OT
  ],
  timeouts: [
    [initialTimeoutRecord(), initialTimeoutRecord()], // 1Q (左上), 2Q (右上)
    [initialTimeoutRecord(), initialTimeoutRecord(), initialTimeoutRecord()], // 3Q (左下), 4Q (右下2つ)
    [initialTimeoutRecord()], // OT
  ],
})

const initialState: ScoreState = {
  gameInfo: {
    tournamentName: "",
    date: "",
    startTime: "",
    endTime: "",
    venue: "",
    gameNumber: "",
    programPage: "",
    block: "",
    quarterMinutes: normalizeQuarterMinutes(8),
  },
  teamA: initialTeam(),
  teamB: initialTeam(),
  officials: {
    scorer: "",
    assistantScorer: "",
    timer: "",
    shotClockOperator: "",
    crewChief: "",
    umpire1: "",
    umpire2: "",
  },
  scoreEntries: [],
  currentQuarter: 1,
  winner: "",
  finalScoreA: 0,
  finalScoreB: 0,
  quarterLines: [],
}

interface ScoreContextType {
  state: ScoreState
  updateGameInfo: (info: Partial<GameInfo>) => void
  updateTeamA: (team: Partial<TeamData>) => void
  updateTeamB: (team: Partial<TeamData>) => void
  updateOfficials: (officials: Partial<Officials>) => void
  addScore: (team: "A" | "B", playerNumber: string, points: number, isThreePointer?: boolean, isFreeThrow?: boolean) => void
  removeLastScore: (team: "A" | "B") => void
  updateScoreEntryPlayer: (team: "A" | "B", point: number, newPlayerNumber: string) => void
  addFoul: (team: "A" | "B", playerIndex: number, foulType: FoulType) => void
  removeFoul: (team: "A" | "B", playerIndex: number) => void
  useTimeout: (team: "A" | "B", half: number, index: number, time: string, quarter: number) => void
  cancelTimeout: (team: "A" | "B", half: number, index: number) => void
  setCurrentQuarter: (quarter: number) => void
  updatePlayer: (team: "A" | "B", playerIndex: number, player: Partial<Player>) => void
  setWinner: (winner: string) => void
  resetState: () => void
  restoreState: (nextState: ScoreState) => void
  getQuarterScore: (team: "A" | "B", quarter: number) => number
  getTotalScore: (team: "A" | "B") => number
  toggleQuarterLine: (score: number) => void
}

const ScoreContext = createContext<ScoreContextType | undefined>(undefined)

export function ScoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScoreState>(initialState)

  const updateGameInfo = (info: Partial<GameInfo>) => {
    setState((prev) => {
      const gameInfo = { ...prev.gameInfo, ...info }
      if (info.quarterMinutes !== undefined) {
        gameInfo.quarterMinutes = normalizeQuarterMinutes(info.quarterMinutes)
      }
      return { ...prev, gameInfo }
    })
  }

  const updateTeamA = (team: Partial<TeamData>) => {
    setState((prev) => ({
      ...prev,
      teamA: { ...prev.teamA, ...team },
    }))
  }

  const updateTeamB = (team: Partial<TeamData>) => {
    setState((prev) => ({
      ...prev,
      teamB: { ...prev.teamB, ...team },
    }))
  }

  const updateOfficials = (officials: Partial<Officials>) => {
    setState((prev) => ({
      ...prev,
      officials: { ...prev.officials, ...officials },
    }))
  }

  const addScore = (team: "A" | "B", playerNumber: string, points: number, isThreePointer?: boolean, isFreeThrow?: boolean) => {
    const quarter = state.currentQuarter
    void logEvent({
      eventType: "add_score",
      screen: "score",
      team,
      payload: {
        quarter,
        playerNumber,
        points,
        isThreePointer: isThreePointer ?? points === 3,
        isFreeThrow: isFreeThrow ?? false,
      },
    })

    setState((prev) => {
      const currentEntries = prev.scoreEntries.filter(
        (e) => e.team === team && e.quarter === prev.currentQuarter
      )
      const lastTotal = currentEntries.length > 0 
        ? currentEntries[currentEntries.length - 1].totalScore 
        : (team === "A" 
          ? prev.scoreEntries.filter(e => e.team === "A" && e.quarter < prev.currentQuarter).reduce((sum, e) => Math.max(sum, e.totalScore), 0)
          : prev.scoreEntries.filter(e => e.team === "B" && e.quarter < prev.currentQuarter).reduce((sum, e) => Math.max(sum, e.totalScore), 0))
      
      const newEntry: ScoreEntry = {
        team,
        quarter: prev.currentQuarter,
        playerNumber,
        points,
        totalScore: lastTotal + points,
        timestamp: Date.now(),
        isThreePointer: isThreePointer ?? (points === 3),
        isFreeThrow: isFreeThrow ?? false,
      }
      
      return {
        ...prev,
        scoreEntries: [...prev.scoreEntries, newEntry],
        finalScoreA: team === "A" ? newEntry.totalScore : prev.finalScoreA,
        finalScoreB: team === "B" ? newEntry.totalScore : prev.finalScoreB,
      }
    })
  }

  const updateScoreEntryPlayer = (team: "A" | "B", point: number, newPlayerNumber: string) => {
    setState((prev) => ({
      ...prev,
      scoreEntries: prev.scoreEntries.map((entry) => {
        if (entry.team !== team) return entry
        const start = entry.totalScore - entry.points + 1
        if (point >= start && point <= entry.totalScore) {
          return { ...entry, playerNumber: newPlayerNumber }
        }
        return entry
      }),
    }))
  }

  const removeLastScore = (team: "A" | "B") => {
    const quarter = state.currentQuarter
    void logEvent({
      eventType: "remove_last_score",
      screen: "score",
      team,
      payload: { quarter },
    })

    setState((prev) => {
      const entries = [...prev.scoreEntries]
      const lastIndex = entries.findLastIndex(
        (e) => e.team === team && e.quarter === prev.currentQuarter
      )
      if (lastIndex === -1) return prev
      entries.splice(lastIndex, 1)
      
      const lastEntry = entries.filter(e => e.team === team).pop()
      return {
        ...prev,
        scoreEntries: entries,
        finalScoreA: team === "A" ? (lastEntry?.totalScore ?? 0) : prev.finalScoreA,
        finalScoreB: team === "B" ? (lastEntry?.totalScore ?? 0) : prev.finalScoreB,
      }
    })
  }

  const addFoul = (team: "A" | "B", playerIndex: number, foulType: FoulType) => {
    const quarter = state.currentQuarter
    void logEvent({
      eventType: "add_foul",
      screen: "players",
      team,
      payload: { quarter, playerIndex, foulType },
    })

    setState((prev) => {
      const teamKey = team === "A" ? "teamA" : "teamB"
      const newPlayers = [...prev[teamKey].players]
      const player = { ...newPlayers[playerIndex] }
      player.fouls = [...player.fouls, { type: foulType, quarter: prev.currentQuarter }]
      newPlayers[playerIndex] = player
      return {
        ...prev,
        [teamKey]: { ...prev[teamKey], players: newPlayers },
      }
    })
  }

  const removeFoul = (team: "A" | "B", playerIndex: number) => {
    const quarter = state.currentQuarter
    void logEvent({
      eventType: "remove_foul",
      screen: "players",
      team,
      payload: { quarter, playerIndex },
    })

    setState((prev) => {
      const teamKey = team === "A" ? "teamA" : "teamB"
      const newPlayers = [...prev[teamKey].players]
      const player = { ...newPlayers[playerIndex] }
      player.fouls = player.fouls.slice(0, -1)
      newPlayers[playerIndex] = player
      return {
        ...prev,
        [teamKey]: { ...prev[teamKey], players: newPlayers },
      }
    })
  }

  const useTimeout = (team: "A" | "B", half: number, index: number, time: string, quarter: number) => {
    void logEvent({
      eventType: "use_timeout",
      screen: "score",
      team,
      payload: { half, index, time, quarter },
    })

    setState((prev) => {
      const teamKey = team === "A" ? "teamA" : "teamB"
      const newTimeouts = [...prev[teamKey].timeouts]
      newTimeouts[half] = [...newTimeouts[half]]
      const currentRecord = newTimeouts[half][index]
      // 既に使用済みで同じ時間なら取り消し、そうでなければ記録
      if ((currentRecord.used || currentRecord.cancelled) && time === "") {
        newTimeouts[half][index] = initialTimeoutRecord()
      } else {
        newTimeouts[half][index] = {
          used: true,
          cancelled: false,
          time: time,
          quarter: quarter, // セルに対応するクォーター番号を使用
        }
      }
      return {
        ...prev,
        [teamKey]: { ...prev[teamKey], timeouts: newTimeouts },
      }
    })
  }

  const cancelTimeout = (team: "A" | "B", half: number, index: number) => {
    void logEvent({
      eventType: "cancel_timeout",
      screen: "score",
      team,
      payload: { half, index },
    })

    setState((prev) => {
      const teamKey = team === "A" ? "teamA" : "teamB"
      const newTimeouts = [...prev[teamKey].timeouts]
      newTimeouts[half] = [...newTimeouts[half]]
      const currentRecord = newTimeouts[half][index]
      // 既にキャンセル済みなら元に戻す、そうでなければキャンセル
      if (currentRecord.cancelled) {
        newTimeouts[half][index] = initialTimeoutRecord()
      } else {
        newTimeouts[half][index] = {
          used: false,
          cancelled: true,
          time: "",
          quarter: 0,
        }
      }
      return {
        ...prev,
        [teamKey]: { ...prev[teamKey], timeouts: newTimeouts },
      }
    })
  }

  const setCurrentQuarter = (quarter: number) => {
    void logEvent({
      eventType: "set_current_quarter",
      screen: "score",
      payload: { quarter },
    })

    setState((prev) => ({ ...prev, currentQuarter: quarter }))
  }

  const updatePlayer = (team: "A" | "B", playerIndex: number, player: Partial<Player>) => {
    setState((prev) => {
      const teamKey = team === "A" ? "teamA" : "teamB"
      const newPlayers = [...prev[teamKey].players]
      newPlayers[playerIndex] = { ...newPlayers[playerIndex], ...player }
      return {
        ...prev,
        [teamKey]: { ...prev[teamKey], players: newPlayers },
      }
    })
  }

  const setWinner = (winner: string) => {
    void logEvent({
      eventType: "set_winner",
      screen: "result",
      payload: { winner },
    })

    setState((prev) => ({ ...prev, winner }))
  }

  const resetState = () => {
    setState(initialState)
  }

  const restoreState = (nextState: ScoreState) => {
    setState(nextState)
  }

  const toggleQuarterLine = (score: number) => {
    setState((prev) => ({
      ...prev,
      quarterLines: prev.quarterLines.includes(score)
        ? prev.quarterLines.filter((s) => s !== score)
        : [...prev.quarterLines, score].sort((a, b) => a - b),
    }))
  }

  const getQuarterScore = (team: "A" | "B", quarter: number): number => {
    const entries = state.scoreEntries.filter(
      (e) => e.team === team && e.quarter === quarter
    )
    if (entries.length === 0) return 0
    const prevQuarterEntries = state.scoreEntries.filter(
      (e) => e.team === team && e.quarter < quarter
    )
    const prevTotal = prevQuarterEntries.length > 0 
      ? Math.max(...prevQuarterEntries.map(e => e.totalScore))
      : 0
    return entries[entries.length - 1].totalScore - prevTotal
  }

  const getTotalScore = (team: "A" | "B"): number => {
    const entries = state.scoreEntries.filter((e) => e.team === team)
    if (entries.length === 0) return 0
    return Math.max(...entries.map(e => e.totalScore))
  }

  return (
    <ScoreContext.Provider
      value={{
        state,
        updateGameInfo,
        updateTeamA,
        updateTeamB,
        updateOfficials,
        addScore,
        removeLastScore,
        updateScoreEntryPlayer,
        addFoul,
        removeFoul,
        useTimeout,
        cancelTimeout,
        setCurrentQuarter,
        updatePlayer,
        setWinner,
        resetState,
        restoreState,
        getQuarterScore,
        getTotalScore,
        toggleQuarterLine,
      }}
    >
      {children}
    </ScoreContext.Provider>
  )
}

export function useScore() {
  const context = useContext(ScoreContext)
  if (context === undefined) {
    throw new Error("useScore must be used within a ScoreProvider")
  }
  return context
}
