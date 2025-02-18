import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { InnateAction, PlayerState, GameState } from "../types"
import { GameTooltip } from "./game-tooltip"

type ActionsProps = {
  actions: InnateAction[]
  onActionSelect: (action: InnateAction) => void
  currentPlayer: PlayerState
  gameState: GameState
}

export default function Actions({ actions, onActionSelect, currentPlayer, gameState }: ActionsProps) {
  const isActionAffordable = (action: InnateAction): boolean => {
    if (currentPlayer.actionPoints < 1) return false

    switch (action.cost.type) {
      case "actionPoints":
        return currentPlayer.actionPoints >= action.cost.amount
      case "card":
        return currentPlayer.hand.length >= action.cost.amount
      case "resource":
        return action.cost.resourceType
          ? currentPlayer.resources[action.cost.resourceType] >= action.cost.amount
          : Object.values(currentPlayer.resources).some((amount) => amount >= action.cost.amount)
      default:
        return false
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action) => {
            const affordable = isActionAffordable(action)
            return (
              <GameTooltip content={`${action.description}. Cost: ${action.cost.amount} ${action.cost.type}`}>
                <Button
                  key={action.id}
                  onClick={() => {
                    onActionSelect(action)
                    currentPlayer.actionPoints -= 1
                  }}
                  disabled={!affordable}
                  className={`w-full text-left justify-start ${
                    affordable ? "border-green-500" : "border-gray-300 text-gray-400"
                  }`}
                >
                  {action.name}
                </Button>
              </GameTooltip>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

