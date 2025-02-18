import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GameTooltip } from "./game-tooltip"
import type { PlayerState, ResourceType } from "../types"

type PlayerResourcesProps = {
  player: PlayerState
  resourceTypes: ResourceType[]
}

export default function PlayerResources({ player, resourceTypes }: PlayerResourcesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {resourceTypes.map((type) => (
            <GameTooltip
              content={`${type.charAt(0).toUpperCase() + type.slice(1)} is a resource used to play cards and perform actions.`}
            >
              <div key={type} className="flex justify-between">
                <span className="font-semibold">{type.charAt(0).toUpperCase() + type.slice(1)}:</span>
                <span>{player.resources[type]}</span>
              </div>
            </GameTooltip>
          ))}
          {resourceTypes.map((type) => (
            <GameTooltip
              content={`${type.charAt(0).toUpperCase() + type.slice(1)} Factory produces 1 ${type} resource each round.`}
            >
              <div key={`factory-${type}`} className="flex justify-between">
                <span className="font-semibold">{type.charAt(0).toUpperCase() + type.slice(1)} Factory:</span>
                <span>{player.factories[type]}</span>
              </div>
            </GameTooltip>
          ))}
          <div className="flex justify-between col-span-2 mt-2 pt-2 border-t">
            <span className="font-semibold">Victory Points:</span>
            <span>{player.victoryPoints}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

