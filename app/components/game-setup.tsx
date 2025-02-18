import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import type { GameConfig } from "../types"

type GameSetupProps = {
  onConfigSubmit: (config: GameConfig) => void
}

export default function GameSetup({ onConfigSubmit }: GameSetupProps) {
  const [config, setConfig] = useState<GameConfig>({
    resourceTypes: 4,
    players: 2,
    suits: 4,
    totalCards: 50,
    startingHand: 2,
    innateActionCount: 5,
    actionPointsPerTurn: 2,
    drawCardCount: 1,
    discardCardCount: 0,
    discardChoice: true,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({ ...prev, [name]: Number.parseInt(value, 10) }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfigSubmit(config)
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Game Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="resourceTypes">Resource Types</Label>
            <Input
              id="resourceTypes"
              name="resourceTypes"
              type="number"
              min="1"
              value={config.resourceTypes}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="players">Number of Players</Label>
            <Input
              id="players"
              name="players"
              type="number"
              min="1"
              value={config.players}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="suits">Number of Suits</Label>
            <Input
              id="suits"
              name="suits"
              type="number"
              min="1"
              value={config.suits}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="totalCards">Total Number of Cards</Label>
            <Input
              id="totalCards"
              name="totalCards"
              type="number"
              min="1"
              value={config.totalCards}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="startingHand">Starting Hand</Label>
            <Input
              id="startingHand"
              name="startingHand"
              type="number"
              min="1"
              value={config.startingHand}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="innateActionCount">Actions</Label>
            <Input
              id="innateActionCount"
              name="innateActionCount"
              type="number"
              min="1"
              value={config.innateActionCount}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="actionPointsPerTurn">Action Points per Turn</Label>
            <Input
              id="actionPointsPerTurn"
              name="actionPointsPerTurn"
              type="number"
              min="1"
              value={config.actionPointsPerTurn}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="drawCardCount">Cards Drawn per 'Draw Card' Action</Label>
            <Input
              id="drawCardCount"
              name="drawCardCount"
              type="number"
              min="1"
              value={config.drawCardCount}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="discardCardCount">Cards Discarded per 'Draw Card' Action</Label>
            <Input
              id="discardCardCount"
              name="discardCardCount"
              type="number"
              min="0"
              value={config.discardCardCount}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="discardChoice"
              checked={config.discardChoice}
              onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, discardChoice: checked === true }))}
            />
            <Label htmlFor="discardChoice">Allow discard choice</Label>
          </div>
          <Button type="submit" className="w-full">
            Start Game
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

