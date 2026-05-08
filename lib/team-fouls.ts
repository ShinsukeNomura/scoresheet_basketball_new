/** 選手1人分（TF 集計に必要な最小形） */
export interface TeamFoulsPlayerSlice {
  fouls: { type: string; quarter: number }[]
}

export interface TeamFoulsTeamSlice {
  players: TeamFoulsPlayerSlice[]
}

/** スコアシート上でチームファウル（TF）に数えるファウル種別（空は未使用スロット） */
export function foulTypeCountsTowardTeamFoul(type: string): boolean {
  return Boolean(type && type !== "")
}

/** 指定クォーターにチームファウルとして数える選手ファウル件数 */
export function countTeamFoulsForQuarter(teamData: TeamFoulsTeamSlice, quarter: number): number {
  return teamData.players.reduce((sum, p) => {
    const n = p.fouls.filter(
      (f) => f.quarter === quarter && foulTypeCountsTowardTeamFoul(f.type)
    ).length
    return sum + n
  }, 0)
}

const MAX_TF_SLOTS = 5
const QUARTERS = 5

/** 印刷・保存互換用: 各Qの TF を 0/1 スロット行に展開 */
export function teamFoulsMatrixFromPlayers(teamData: TeamFoulsTeamSlice): number[][] {
  return Array.from({ length: QUARTERS }, (_, qi) => {
    const q = qi + 1
    const n = Math.min(countTeamFoulsForQuarter(teamData, q), MAX_TF_SLOTS)
    return Array.from({ length: MAX_TF_SLOTS }, (_, i) => (i < n ? 1 : 0))
  })
}
