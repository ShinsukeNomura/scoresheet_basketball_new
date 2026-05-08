"use client"

import { useScore } from "@/lib/score-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface TeamInfoFormProps {
  team: "A" | "B"
}

export function TeamInfoForm({ team }: TeamInfoFormProps) {
  const { state, updateTeamA, updateTeamB } = useScore()
  const teamData = team === "A" ? state.teamA : state.teamB
  const updateTeam = team === "A" ? updateTeamA : updateTeamB

  return (
    <Card className={cn(
      "border-l-4",
      team === "A" ? "border-l-primary" : "border-l-accent"
    )}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <span className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-primary-foreground",
            team === "A" ? "bg-primary" : "bg-accent"
          )}>
            {team}
          </span>
          チーム{team}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2 space-y-2">
            <Label htmlFor={`teamName${team}`}>チーム名</Label>
            <Input
              id={`teamName${team}`}
              placeholder="例：○○中学校"
              value={teamData.name}
              onChange={(e) => updateTeam({ name: e.target.value })}
              className={cn(
                "border-2 shadow-sm transition-colors",
                team === "A"
                  ? "border-primary bg-primary/5 hover:bg-primary/10 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/35"
                  : "border-accent bg-accent/5 hover:bg-accent/10 focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/35"
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`combinationNumber${team}`}>組み合わせ番号</Label>
            <Input
              id={`combinationNumber${team}`}
              placeholder="例：15"
              value={teamData.combinationNumber}
              onChange={(e) => updateTeam({ combinationNumber: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor={`coach${team}`}>コーチ</Label>
            <Input
              id={`coach${team}`}
              placeholder="氏名"
              value={teamData.coach}
              onChange={(e) => updateTeam({ coach: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`assistantCoach${team}`}>Aコーチ</Label>
            <Input
              id={`assistantCoach${team}`}
              placeholder="氏名"
              value={teamData.assistantCoach}
              onChange={(e) => updateTeam({ assistantCoach: e.target.value })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
