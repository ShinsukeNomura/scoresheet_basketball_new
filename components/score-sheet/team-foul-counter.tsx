"use client"

import { useScore } from "@/lib/score-context"
import { countTeamFoulsForQuarter } from "@/lib/team-fouls"
import { cn } from "@/lib/utils"

interface TeamFoulCounterProps {
  team: "A" | "B"
}

export function TeamFoulCounter({ team }: TeamFoulCounterProps) {
  const { state } = useScore()
  const teamData = team === "A" ? state.teamA : state.teamB
  const currentFoulCount = countTeamFoulsForQuarter(teamData, state.currentQuarter)

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 px-2 py-1.5 rounded-lg border",
        team === "A" ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium whitespace-nowrap">
          TF Q{state.currentQuarter}
        </span>
        <span className="text-[10px] text-muted-foreground leading-tight">
          選手ファウルから自動
        </span>
      </div>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((num) => (
          <div
            key={num}
            className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border",
              num <= currentFoulCount
                ? team === "A"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-accent text-accent-foreground border-accent"
                : "border-muted-foreground/30 text-muted-foreground/50",
              num === 5 && num <= currentFoulCount && "bg-destructive border-destructive"
            )}
          >
            {num}
          </div>
        ))}
      </div>
    </div>
  )
}
