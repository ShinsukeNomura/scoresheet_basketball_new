"use client"

import { useMemo } from "react"
import { useScore, type FoulRecord } from "@/lib/score-context"
import { foulBadgeClassListPrint, foulQuarterGapBefore } from "@/lib/foul-display"
import {
  RUNNING_SCORE_TEAM_B_BG,
  getRunningCellMeta,
  lastRunningScoreByQuarter,
  quarterSeparatorBottomClassPrint,
  quarterSeparatorLineStylesForTeam,
} from "@/lib/running-score-helpers"
import { normalizeQuarterMinutes } from "@/lib/timeout-sheet"
import { countTeamFoulsForQuarter } from "@/lib/team-fouls"
import { cn } from "@/lib/utils"

export function PrintScoreSheet() {
  const { state, getTotalScore, getQuarterScore } = useScore()
  const totalScoreA = getTotalScore("A")
  const totalScoreB = getTotalScore("B")

  const runningBlocks = useMemo(
    () => [
      Array.from({ length: 40 }, (_, i) => i + 1),
      Array.from({ length: 40 }, (_, i) => i + 41),
      Array.from({ length: 40 }, (_, i) => i + 81),
      Array.from({ length: 40 }, (_, i) => i + 121),
    ],
    []
  )

  const quarterLineStylesA = useMemo(
    () => quarterSeparatorLineStylesForTeam(state.scoreEntries, "A", state.quarterLines),
    [state.scoreEntries, state.quarterLines]
  )
  const quarterLineStylesB = useMemo(
    () => quarterSeparatorLineStylesForTeam(state.scoreEntries, "B", state.quarterLines),
    [state.scoreEntries, state.quarterLines]
  )
  const qEndA = useMemo(
    () => new Set(lastRunningScoreByQuarter(state.scoreEntries, "A").values()),
    [state.scoreEntries]
  )
  const qEndB = useMemo(
    () => new Set(lastRunningScoreByQuarter(state.scoreEntries, "B").values()),
    [state.scoreEntries]
  )

  const getQuarterColor = (quarter: number) => {
    return quarter === 1 || quarter === 3 ? "text-red-600" : "text-black"
  }

  const toDisplay = (value?: string) => (value && value.trim() ? value : " ")

  const getPlayerRows = (team: "A" | "B") => {
    const players = team === "A" ? state.teamA.players : state.teamB.players
    const active = players.filter((p) => p.number || p.name).slice(0, 18)
    const blanks = Array.from({ length: Math.max(0, 18 - active.length) }, () => ({
      number: "",
      name: "",
      isCaptain: false,
      fouls: [] as FoulRecord[],
    }))
    return [...active, ...blanks]
  }

  const getTeamFoulValue = (team: "A" | "B", quarter: number) => {
    const teamData = team === "A" ? state.teamA : state.teamB
    return countTeamFoulsForQuarter(teamData, quarter)
  }

  const getTimeoutStamp = (team: "A" | "B", half: 0 | 1, index: number) => {
    const teamData = team === "A" ? state.teamA : state.teamB
    const row = teamData.timeouts[half]?.[index]
    if (!row) return ""
    if (row.used) {
      return `${row.quarter}Q ${row.time}`
    }
    if (row.cancelled) {
      return "×"
    }
    return ""
  }

  const timeoutCellClass =
    "flex h-[3.4mm] max-h-[3.4mm] shrink-0 items-center justify-center border border-black font-mono text-[7px] leading-none"
  const foulCellClass =
    "flex h-[3.4mm] max-h-[3.4mm] shrink-0 items-center justify-center border border-black text-[7px] leading-none"

  const renderTeamFoulCells = (count: number) =>
    Array.from({ length: 4 }, (_, i) => {
      const slot = i + 1
      return (
        <span key={slot} className={foulCellClass}>
          {count >= slot ? "●" : slot}
        </span>
      )
    })

  const renderFoulsPrint = (fouls: FoulRecord[]) => (
    <span className="inline-flex flex-wrap items-center justify-center gap-y-0.5 leading-none">
      {fouls.map((f, i) => (
        <span key={i} className="inline-flex items-center align-middle">
          {(() => {
            const g = foulQuarterGapBefore(fouls, i)
            if (g === "thick-black") {
              return (
                <span
                  className="mx-px inline-block h-[10px] w-[2px] shrink-0 bg-black align-middle"
                  aria-hidden
                />
              )
            }
            if (g === "thin") {
              return (
                <span
                  className="mx-0.5 inline-block h-[10px] w-px shrink-0 bg-neutral-600 align-middle"
                  aria-hidden
                />
              )
            }
            return null
          })()}
          <span className={cn(foulBadgeClassListPrint(f.quarter, f.type), "align-middle text-[7px]")}>
            {f.type}
          </span>
        </span>
      ))}
    </span>
  )

  const renderTeamPanel = (team: "A" | "B") => {
    const teamData = team === "A" ? state.teamA : state.teamB
    const rows = getPlayerRows(team)

    return (
      <div className="border-x border-b border-black">
        <div className="border-b border-black px-1 py-0.5 text-[10px] font-bold">チーム{team}：</div>

        <div className="border-b border-black px-1 py-0.5 text-[8px]">
          <div className="grid grid-cols-[56px_1fr] items-center gap-x-1">
            <div className="font-bold">タイムアウト</div>
            <div className="grid grid-cols-[16px_repeat(2,1fr)_16px_repeat(3,1fr)] gap-x-0.5 text-center">
              <span className="text-[7px] font-bold">1P</span>
              <span className={timeoutCellClass}>{getTimeoutStamp(team, 0, 0)}</span>
              <span className={timeoutCellClass}>{getTimeoutStamp(team, 0, 1)}</span>
              <span className="text-[7px] font-bold">3P</span>
              <span className={timeoutCellClass}>{getTimeoutStamp(team, 1, 0)}</span>
              <span className={timeoutCellClass}>{getTimeoutStamp(team, 1, 1)}</span>
              <span className={timeoutCellClass}>{getTimeoutStamp(team, 1, 2)}</span>
            </div>
          </div>
        </div>

        <div className="border-b border-black px-1 py-0.5 text-[8px]">
          <div className="grid grid-cols-[56px_1fr] items-start gap-x-1">
            <div className="pt-[1px] font-bold">チームファウル</div>
            <div className="space-y-0.5">
              <div className="grid grid-cols-[16px_repeat(4,1fr)_16px_repeat(4,1fr)] gap-x-0.5 text-center">
                <span className="text-[7px] font-bold">1P</span>
                {renderTeamFoulCells(getTeamFoulValue(team, 1))}
                <span className="text-[7px] font-bold">2P</span>
                {renderTeamFoulCells(getTeamFoulValue(team, 2))}
              </div>
              <div className="grid grid-cols-[16px_repeat(4,1fr)_16px_repeat(4,1fr)] gap-x-0.5 text-center">
                <span className="text-[7px] font-bold">3P</span>
                {renderTeamFoulCells(getTeamFoulValue(team, 3))}
                <span className="text-[7px] font-bold">4P</span>
                {renderTeamFoulCells(getTeamFoulValue(team, 4))}
              </div>
            </div>
          </div>
        </div>

        <table className="w-full table-fixed border-collapse text-[7px] leading-none">
          <thead>
            <tr className="border-b border-black">
              <th className="w-[22px] border-r border-black px-0.5 py-0">選</th>
              <th className="border-r border-black px-0.5 py-0">手 氏 名</th>
              <th className="w-[22px] border-r border-black px-0.5 py-0">No</th>
              <th className="w-[18px] border-r border-black px-0.5 py-0">C</th>
              <th className="w-[76px] px-0.5 py-0">ファウル</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((player, idx) => (
              <tr key={`${team}-${idx}`} className="border-b border-black">
                <td className="h-[3.1mm] max-h-[3.1mm] border-r border-black px-0.5 py-0 text-center align-middle">
                  {idx + 1}
                </td>
                <td className="h-[3.1mm] max-h-[3.1mm] border-r border-black px-0.5 py-0 align-middle">
                  {toDisplay(player.name)}
                </td>
                <td className="h-[3.1mm] max-h-[3.1mm] border-r border-black px-0.5 py-0 text-center align-middle font-mono">
                  {toDisplay(player.number)}
                </td>
                <td className="h-[3.1mm] max-h-[3.1mm] border-r border-black px-0.5 py-0 text-center align-middle">
                  {player.isCaptain ? "●" : ""}
                </td>
                <td className="h-[3.1mm] max-h-[3.1mm] px-0.5 py-0 text-center align-middle">
                  {renderFoulsPrint(player.fouls)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-[1fr_64px] border-b border-black text-[8px]">
          <div className="border-r border-black px-1 py-0.5">
            コーチ：{toDisplay(teamData.coach)}
            <br />
            Aコーチ：{toDisplay(teamData.assistantCoach)}
          </div>
          <div className="px-1 py-0.5">サイン</div>
        </div>
      </div>
    )
  }

  return (
    <div className="print-score-sheet bg-white p-0 text-black text-[9px] leading-tight">
      <div className="border border-black">
        <div className="px-2 pt-1 text-center text-[11px] font-bold italic tracking-widest">
          OFFICIAL SCORE SHEET
        </div>
        <div className="grid grid-cols-[1fr_1fr] gap-x-2 border-b border-black px-2 pb-1 pt-0.5 text-[10px]">
          <div>チーム A：{toDisplay(state.teamA.name)}</div>
          <div>チーム B：{toDisplay(state.teamB.name)}</div>
        </div>

        <div className="grid grid-cols-[1fr_1fr] items-start border-b border-black">
          <div className="border-r border-black">
            <div className="grid grid-cols-[66px_1fr_54px_54px] border-b border-black text-[9px]">
              <div className="border-r border-black px-1 py-0.5 font-bold">大会名</div>
              <div className="border-r border-black px-1 py-0.5">{toDisplay(state.gameInfo.tournamentName)}</div>
              <div className="border-r border-black px-1 py-0.5 text-center font-bold">場所</div>
              <div className="px-1 py-0.5">{toDisplay(state.gameInfo.venue)}</div>
            </div>
            <div className="grid grid-cols-[66px_1fr_54px_54px_54px] text-[9px]">
              <div className="border-r border-black px-1 py-0.5 font-bold">ゲーム No.</div>
              <div className="border-r border-black px-1 py-0.5">{toDisplay(state.gameInfo.gameNumber)}</div>
              <div className="border-r border-black px-1 py-0.5 text-center font-bold">日付</div>
              <div className="border-r border-black px-1 py-0.5 text-center">{toDisplay(state.gameInfo.date)}</div>
              <div className="px-1 py-0.5 text-center">
                時間 {normalizeQuarterMinutes(state.gameInfo.quarterMinutes)}
              </div>
            </div>
          </div>

          <div className="text-[9px]">
            <div className="border-b border-black px-1 py-0.5 text-center font-bold tracking-[0.3em]">
              ランニング・スコア
            </div>
            <div className="grid grid-cols-4 items-start">
              {runningBlocks.map((block, idx) => (
                <div
                  key={`running-head-${idx}`}
                  className={cn("self-start border-black", idx < 3 && "border-r")}
                >
                  <div className="grid grid-cols-3 border-b border-black text-center text-[8px] font-bold">
                    <div className="border-r border-black">A</div>
                    <div className="border-r border-black">B</div>
                    <div>{block[0]}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr] items-start">
          <div className="border-r border-black">
            {renderTeamPanel("A")}
            {renderTeamPanel("B")}
          </div>

          <div className="border-b border-black self-start">
            <div className="grid grid-cols-4 items-start text-[7px]">
              {runningBlocks.map((colPoints, blockIdx) => (
                <div
                  key={`running-${blockIdx}`}
                  className={cn(
                    "min-w-0 self-start border-black",
                    blockIdx < 3 && "border-r"
                  )}
                >
                  <div className="grid grid-cols-[1fr_1fr_1fr_1fr] border-b border-black text-center font-bold">
                    <div className="border-r border-black py-[1px]">A</div>
                    <div className="border-r border-black py-[1px]">点</div>
                    <div className="border-r border-black py-[1px]">B</div>
                    <div className="py-[1px]">点</div>
                  </div>

                  {colPoints.map((point) => {
                    const metaA = getRunningCellMeta(state.scoreEntries, "A", point)
                    const metaB = getRunningCellMeta(state.scoreEntries, "B", point)
                    const sepStyleA = quarterLineStylesA.get(point)
                    const sepStyleB = quarterLineStylesB.get(point)
                    const gameDone = Boolean(state.winner)
                    const endA = gameDone && point === totalScoreA && totalScoreA + totalScoreB > 0
                    const endB = gameDone && point === totalScoreB && totalScoreA + totalScoreB > 0
                    const bottomA = endA
                      ? "border-b-2 border-double border-black"
                      : sepStyleA
                        ? quarterSeparatorBottomClassPrint(sepStyleA)
                        : "border-b border-black"
                    const bottomB = endB
                      ? "border-b-2 border-double border-black"
                      : sepStyleB
                        ? quarterSeparatorBottomClassPrint(sepStyleB)
                        : "border-b border-black"

                    const hideScoreMidVertical = Boolean(sepStyleA || sepStyleB) || endA || endB

                    const renderScore = (meta: ReturnType<typeof getRunningCellMeta>, qEnd: boolean) => {
                      if (!meta) {
                        return <span className="text-gray-400">{point}</span>
                      }
                      if (meta.hideJerseyAndScore) {
                        return (
                          <span className={cn("font-mono text-[7px] leading-none", getQuarterColor(meta.quarter))}>
                            {point}
                          </span>
                        )
                      }
                      const fillBg = meta.quarter === 1 || meta.quarter === 3 ? "bg-red-600" : "bg-black"
                      if (meta.showSlash) {
                        return (
                          <span
                            className={cn(
                              "relative inline-flex min-h-[0.65rem] min-w-[0.65rem] items-center justify-center overflow-visible font-mono font-semibold",
                              getQuarterColor(meta.quarter),
                              qEnd && "rounded-full border-[1.5px] border-current px-[1px]"
                            )}
                          >
                            <svg
                              className="pointer-events-none absolute left-1/2 top-1/2 z-[5] h-[10px] w-[10px] -translate-x-1/2 -translate-y-1/2 text-current"
                              viewBox="0 0 32 32"
                              aria-hidden
                            >
                              <line
                                x1="4"
                                y1="28"
                                x2="28"
                                y2="4"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="square"
                              />
                            </svg>
                            <span className="relative z-10">{point}</span>
                          </span>
                        )
                      }
                      if (meta.showFilledCircle) {
                        return (
                          <span
                            className={cn(
                              "inline-flex rounded-full",
                              getQuarterColor(meta.quarter),
                              qEnd && "border-[1.5px] border-current p-[0.5px]"
                            )}
                          >
                            <span
                              className={cn(
                                "inline-flex min-h-[10px] min-w-[10px] items-center justify-center rounded-full font-mono text-[6px] font-bold leading-none text-white",
                                fillBg
                              )}
                            >
                              {point}
                            </span>
                          </span>
                        )
                      }
                      return <span className="select-none" />
                    }

                    return (
                      <div
                        key={`p-${point}`}
                        className="grid h-[4mm] max-h-[4mm] shrink-0 grid-cols-[1fr_1fr_1fr_1fr] text-center leading-none"
                      >
                        <div className={cn("flex items-center justify-center border-r border-black font-mono", bottomA)}>
                          {metaA?.hideJerseyAndScore ? (
                            <span className="select-none" />
                          ) : metaA?.circleJersey ? (
                            <span
                              className={cn(
                                "inline-flex min-h-[9px] min-w-[9px] items-center justify-center rounded-full border border-current font-mono text-[6px] font-bold",
                                getQuarterColor(metaA.quarter)
                              )}
                            >
                              {metaA.playerNumber}
                            </span>
                          ) : metaA ? (
                            <span className={cn("text-[6px]", getQuarterColor(metaA.quarter))}>{metaA.playerNumber}</span>
                          ) : (
                            <span className="text-transparent">.</span>
                          )}
                        </div>
                        <div
                          className={cn(
                            "flex items-center justify-center",
                            !hideScoreMidVertical && "border-r border-black",
                            bottomA
                          )}
                        >
                          {renderScore(metaA, qEndA.has(point))}
                        </div>
                        <div className={cn("flex items-center justify-center border-r border-black", bottomB)}>
                          {renderScore(metaB, qEndB.has(point))}
                        </div>
                        <div className={cn("flex items-center justify-center font-mono", bottomB)}>
                          {metaB?.hideJerseyAndScore ? (
                            <span className="select-none" />
                          ) : metaB?.circleJersey ? (
                            <span
                              className={cn(
                                "inline-flex min-h-[9px] min-w-[9px] items-center justify-center rounded-full border border-current font-mono text-[6px] font-bold",
                                getQuarterColor(metaB.quarter)
                              )}
                            >
                              {metaB.playerNumber}
                            </span>
                          ) : metaB ? (
                            <span className={cn("text-[6px]", getQuarterColor(metaB.quarter))}>{metaB.playerNumber}</span>
                          ) : (
                            <span className="text-transparent">.</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr] items-start border-b border-black text-[9px]">
          <div className="border-r border-black">
            <div className="grid grid-cols-[120px_1fr] border-b border-black">
              <div className="border-r border-black px-1 py-0.5">スコアラー</div>
              <div className="px-1 py-0.5">{toDisplay(state.officials.scorer)}</div>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-black">
              <div className="border-r border-black px-1 py-0.5">A スコアラー</div>
              <div className="px-1 py-0.5">{toDisplay(state.officials.assistantScorer)}</div>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-black">
              <div className="border-r border-black px-1 py-0.5">タイマー</div>
              <div className="px-1 py-0.5">{toDisplay(state.officials.timer)}</div>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-black">
              <div className="border-r border-black px-1 py-0.5">24 秒オペレイター</div>
              <div className="px-1 py-0.5">{toDisplay(state.officials.shotClockOperator)}</div>
            </div>
            <div className="grid grid-cols-[120px_1fr] border-b border-black">
              <div className="border-r border-black px-1 py-0.5">主 審</div>
              <div className="px-1 py-0.5">{toDisplay(state.officials.crewChief)}</div>
            </div>
            <div className="grid grid-cols-[120px_1fr]">
              <div className="border-r border-black px-1 py-0.5">副 審</div>
              <div className="px-1 py-0.5">
                {toDisplay(state.officials.umpire1)}
                {state.officials.umpire2 ? ` / ${state.officials.umpire2}` : ""}
              </div>
            </div>
          </div>

          <div>
            <table className="w-full table-fixed text-center text-[9px]">
              <tbody>
                <tr className="border-b border-black">
                  <td className="w-[90px] border-r border-black px-1 py-0.5">第 1 ピリオド</td>
                  <td className="border-r border-black px-1 py-0.5">A</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("A", 1)}</td>
                  <td className="border-r border-black px-1 py-0.5">-</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("B", 1)}</td>
                  <td className="px-1 py-0.5">B</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black px-1 py-0.5">第 2 ピリオド</td>
                  <td className="border-r border-black px-1 py-0.5">A</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("A", 2)}</td>
                  <td className="border-r border-black px-1 py-0.5">-</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("B", 2)}</td>
                  <td className="px-1 py-0.5">B</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black px-1 py-0.5">第 3 ピリオド</td>
                  <td className="border-r border-black px-1 py-0.5">A</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("A", 3)}</td>
                  <td className="border-r border-black px-1 py-0.5">-</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("B", 3)}</td>
                  <td className="px-1 py-0.5">B</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black px-1 py-0.5">第 4 ピリオド</td>
                  <td className="border-r border-black px-1 py-0.5">A</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("A", 4)}</td>
                  <td className="border-r border-black px-1 py-0.5">-</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("B", 4)}</td>
                  <td className="px-1 py-0.5">B</td>
                </tr>
                <tr className="border-b border-black">
                  <td className="border-r border-black px-1 py-0.5">延 長</td>
                  <td className="border-r border-black px-1 py-0.5">A</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("A", 5)}</td>
                  <td className="border-r border-black px-1 py-0.5">-</td>
                  <td className="border-r border-black px-1 py-0.5">{getQuarterScore("B", 5)}</td>
                  <td className="px-1 py-0.5">B</td>
                </tr>
                <tr>
                  <td className="border-r border-black px-1 py-0.5 font-bold">最終スコア 勝者</td>
                  <td className="border-r border-black px-1 py-0.5 font-bold">A</td>
                  <td className="border-r border-black px-1 py-0.5 font-bold">{totalScoreA}</td>
                  <td className="border-r border-black px-1 py-0.5 font-bold">-</td>
                  <td className="border-r border-black px-1 py-0.5 font-bold">{totalScoreB}</td>
                  <td className="px-1 py-0.5 font-bold">B</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
