"use client"

import GameSetup from "./components/game-setup"
import Game from "./components/game"
import { useState } from "react"
import type { GameConfig } from "./types"

export default function Home() {
  const [gameConfig, setGameConfig] = useState<GameConfig | null>(null)

  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Card Drafting Game Prototype</h1>
      {!gameConfig ? <GameSetup onConfigSubmit={setGameConfig} /> : <Game config={gameConfig} />}
    </main>
  )
}

