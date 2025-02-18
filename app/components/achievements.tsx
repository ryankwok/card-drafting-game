"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Achievement, PlayerState, GameState, ResourceType } from "../types"
import { GameTooltip } from "./game-tooltip"

type AchievementsProps = {
  achievements: Achievement
  currentPlayer: PlayerState | null
  gameState: GameState | null
  onClaimProject: (projectId: number) => void
  onSponsorAward: (awardId: number) => void
  playerColors: string[]
  achievementClaimedThisRound: boolean
  gameResourceTypes: ResourceType[]
}

export function Achievements({
  achievements,
  currentPlayer,
  gameState,
  onClaimProject,
  onSponsorAward,
  playerColors,
  achievementClaimedThisRound,
  gameResourceTypes,
}: AchievementsProps) {
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false)
  const [isAwardDialogOpen, setIsAwardDialogOpen] = useState(false)

  if (!currentPlayer || !gameState) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Objectives</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading achievements...</p>
        </CardContent>
      </Card>
    )
  }

  const canClaimProject = achievements.projects.some((p) => !p.claimed && p.isCompleted(currentPlayer, gameState))

  const canSponsorAward = (cost: Achievement["sponsorCost"], player: PlayerState) => {
    if (cost.type === "discard") {
      return player.hand.length >= cost.amount
    } else if (cost.type === "resource") {
      return player.resources[cost.resourceType] >= cost.amount
    } else if (cost.type === "factory") {
      return player.factories[cost.resourceType] >= cost.amount
    }
    return false
  }

  const canSponsorAwardCheck =
    achievements.sponsoredAwards < 3 && canSponsorAward(achievements.sponsorCost, currentPlayer)

  const projectValue = achievements.claimedProjects === 0 ? 7 : achievements.claimedProjects === 1 ? 5 : 3

  const getProjectButtonStyle = (project, claimedByPlayer) => {
    if (project.claimed) {
      return `bg-${playerColors[claimedByPlayer]} text-black font-semibold`
    } else if (!project.isCompleted(currentPlayer, gameState)) {
      return "bg-gray-300 text-gray-700"
    }
    return "bg-white text-black hover:bg-gray-100"
  }

  const getAwardButtonStyle = (award, sponsoredByPlayer) => {
    if (award.sponsored) {
      return `bg-${playerColors[sponsoredByPlayer]} text-black font-semibold`
    } else if (!canSponsorAwardCheck) {
      return "bg-gray-300 text-gray-700"
    }
    return "bg-white text-black hover:bg-gray-100"
  }

  const getSponsorCostText = (cost: Achievement["sponsorCost"]) => {
    if (cost.type === "discard") {
      return `${cost.amount} card${cost.amount > 1 ? "s" : ""}`
    } else if (cost.type === "resource") {
      return `${cost.amount} ${cost.resourceType}`
    } else if (cost.type === "factory") {
      return `${cost.amount} ${cost.resourceType} factor${cost.amount > 1 ? "ies" : "y"}`
    }
    return ""
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objectives</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <GameTooltip content="Projects are one-time objectives that can be claimed by the first player to meet their conditions. They provide victory points.">
              <h3 className="font-semibold">Projects ({achievements.claimedProjects}/3 claimed)</h3>
            </GameTooltip>
            <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
              <DialogTrigger asChild>
                <Button>Claim Project ({projectValue} VP)</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Available Projects</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full">
                  {achievements.projects.map((project) => {
                    const claimedByPlayer = gameState.players.findIndex((p) =>
                      p.playedCards.some((card) => card.id === project.id),
                    )
                    return (
                      <Button
                        key={project.id}
                        onClick={() => {
                          onClaimProject(project.id)
                          setIsProjectDialogOpen(false)
                        }}
                        disabled={
                          project.claimed ||
                          !project.isCompleted(currentPlayer, gameState) ||
                          achievementClaimedThisRound ||
                          currentPlayer.actionPoints < 1
                        }
                        className={`w-full justify-start mb-2 ${getProjectButtonStyle(project, claimedByPlayer)}`}
                      >
                        {project.description}
                      </Button>
                    )
                  })}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
          <div>
            <GameTooltip content="Awards are end-game bonuses that players can sponsor. They are evaluated at the end of the game and provide victory points to the winning player.">
              <h3 className="font-semibold">Awards ({achievements.sponsoredAwards}/3 sponsored)</h3>
            </GameTooltip>
            <Dialog open={isAwardDialogOpen} onOpenChange={setIsAwardDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  Sponsor Award (5VP)
                  {canSponsorAwardCheck ? "" : ` - Cannot Afford ${getSponsorCostText(achievements.sponsorCost)}`}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Available Awards</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full">
                  {achievements.awards.map((award) => {
                    const sponsoredByPlayer = gameState.players.findIndex((p) => p.id === award.sponsoredBy)
                    return (
                      <Button
                        key={award.id}
                        onClick={() => {
                          if (canSponsorAwardCheck && !award.sponsored) {
                            onSponsorAward(award.id)
                            setIsAwardDialogOpen(false)
                          }
                        }}
                        disabled={
                          !canSponsorAwardCheck ||
                          award.sponsored ||
                          achievementClaimedThisRound ||
                          currentPlayer.actionPoints < 1
                        }
                        className={`w-full justify-start mb-2 ${getAwardButtonStyle(award, sponsoredByPlayer)}`}
                      >
                        <div className="flex justify-between w-full">
                          <span>{award.description}</span>
                          <span className="text-sm">(Cost: {getSponsorCostText(achievements.sponsorCost)})</span>
                        </div>
                      </Button>
                    )
                  })}
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

