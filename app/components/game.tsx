"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { GameConfig, GameState, ResourceType } from "../types"
import CardComponent from "./card"
import PlayerResources from "./player-resources"
import InnateActions from "./innate-actions"
import { Achievements } from "./achievements"
import { GameTooltip } from "./game-tooltip"
import { createInitialGameState, nextTurn } from "../game-logic/game-state"
import { playCard, discardCard, drawCards } from "../game-logic/card-actions"

/** Colors assigned to players for visual distinction */
const PLAYER_COLORS = [
  "bg-red-100",
  "bg-blue-100", 
  "bg-green-100", 
  "bg-yellow-100", 
  "bg-purple-100", 
  "bg-pink-100"
]

interface GameProps {
  /** Configuration settings for the game */
  config: GameConfig
}

export default function Game({ config }: GameProps) {
  /** Core game state including players, cards, and achievements */
  const [gameState, setGameState] = useState<GameState>({
    cardPool: [],
    players: [],
    currentPlayer: 0,
    round: 1,
    innateActions: [],
    winner: null,
    achievements: {
      projects: [],
      awards: [],
      sponsorCost: { type: "discard", amount: 0 },
      claimedProjects: 0,
      sponsoredAwards: 0,
    },
  })

  /** Tracks whether the player is in discard mode */
  const [isDiscardMode, setIsDiscardMode] = useState(false)
  
  /** Number of cards that need to be discarded */
  const [discardActionAmount, setDiscardActionAmount] = useState(0)
  
  /** Available resource types in the current game */
  const [gameResourceTypes, setGameResourceTypes] = useState<ResourceType[]>([])
  
  /** Position of the context menu for card actions */
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number; y: number } | null>(null)
  
  /** Tracks if an achievement has been claimed this round */
  const [achievementClaimedThisRound, setAchievementClaimedThisRound] = useState(false)

  useEffect(() => {
    // Initialize the game
    const allResourceTypes: ResourceType[] = [
      "wood",
      "brick",
      "stone",
      "wheat",
      "sheep",
      "iron",
      "gold",
      "gem",
      "fish",
      "oil",
    ]
    const initialGameResourceTypes = allResourceTypes.slice(0, config.resourceTypes)
    setGameResourceTypes(initialGameResourceTypes)

    // Create initial game state
    const initialState = createInitialGameState(config, initialGameResourceTypes)
    setGameState(initialState)
  }, [config])

  // =========================================
  // UI Event Handlers
  // =========================================

  /**
   * Handles clicking on a card in the player's hand.
   * Either plays or discards the card based on current game mode.
   */
  const handleCardClick = (cardId: number) => {
    if (isDiscardMode) {
      setGameState((prev) => discardCard(prev, cardId))
      setDiscardActionAmount((prev) => {
        const newAmount = prev - 1
        if (newAmount === 0) {
          setIsDiscardMode(false)
        }
        return newAmount
      })
    } else {
      setGameState((prev) => playCard(prev, cardId))
    }
  }

  /**
   * Handles right-click context menu for cards.
   * Currently disabled but structure kept for future functionality.
   */
  const handleCardContextMenu = (e: React.MouseEvent, cardId: number) => {
    e.preventDefault()
    setContextMenuPosition({ x: e.clientX, y: e.clientY })
  }

  /**
   * Handles actions selected from the card context menu.
   * Currently disabled but structure kept for future functionality.
   */
  const handleContextMenuAction = (action: string) => {
    switch (action) {
      case "play":
        console.warn("Context menu play action is deprecated")
        break
      case "discard":
        console.warn("Context menu discard action is deprecated")
        break
    }
    setContextMenuPosition(null)
  }

  /**
   * Handles drawing cards for the current player.
   */
  const handleDrawCard = () => {
    setGameState((prev) => {
      const { updatedState, drawnCards } = drawCards(prev, config.drawCardCount)

      if (config.discardCardCount > 0 && config.discardChoice) {
        setIsDiscardMode(true)
        setDiscardActionAmount(config.discardCardCount)
        return updatedState
      } else if (config.discardCardCount > 0) {
        // Automatically discard if discard choice is not enabled
        let state = updatedState
        for (let i = 0; i < config.discardCardCount; i++) {
          const cardToDiscard = state.players[state.currentPlayer].hand[0]
          if (cardToDiscard) {
            state = discardCard(state, cardToDiscard.id)
          }
        }
        return state
      }

      return updatedState
    })
  }

  /**
   * Handles claiming a project achievement.
   */
  const handleClaimProject = (projectId: number) => {
    if (achievementClaimedThisRound) return
    setGameState((prev) => {
      const updatedAchievements = { ...prev.achievements }
      const projectIndex = updatedAchievements.projects.findIndex((p) => p.id === projectId)
      
      if (projectIndex !== -1 && !updatedAchievements.projects[projectIndex].claimed) {
        updatedAchievements.projects[projectIndex].claimed = true
        updatedAchievements.projects[projectIndex].claimedBy = prev.currentPlayer
        updatedAchievements.claimedProjects++
        
        const projectValue =
          updatedAchievements.claimedProjects === 1 ? 7 : 
          updatedAchievements.claimedProjects === 2 ? 5 : 3
        
        const updatedPlayers = [...prev.players]
        updatedPlayers[prev.currentPlayer].achievementPoints += projectValue
        updatedPlayers[prev.currentPlayer].actionPoints -= 1
        
        return {
          ...prev,
          achievements: updatedAchievements,
          players: updatedPlayers,
        }
      }
      return prev
    })
    setAchievementClaimedThisRound(true)
  }

  /**
   * Handles sponsoring an award.
   */
  const handleSponsorAward = (awardId: number) => {
    if (achievementClaimedThisRound) return
    setGameState((prev) => {
      const updatedAchievements = { ...prev.achievements }
      const awardIndex = updatedAchievements.awards.findIndex((a) => a.id === awardId)
      
      if (
        awardIndex !== -1 &&
        !updatedAchievements.awards[awardIndex].sponsored &&
        updatedAchievements.sponsoredAwards < 3
      ) {
        updatedAchievements.awards[awardIndex].sponsored = true
        updatedAchievements.awards[awardIndex].sponsoredBy = prev.currentPlayer
        updatedAchievements.sponsoredAwards++
        
        const updatedPlayers = [...prev.players]
        const currentPlayer = updatedPlayers[prev.currentPlayer]

        const cost = updatedAchievements.sponsorCost
        if (cost.type === "discard") {
          for (let i = 0; i < cost.amount; i++) {
            if (currentPlayer.hand.length > 0) {
              const randomIndex = Math.floor(Math.random() * currentPlayer.hand.length)
              currentPlayer.hand.splice(randomIndex, 1)
            }
          }
        } else if (cost.type === "resource" && cost.resourceType) {
          if (currentPlayer.resources[cost.resourceType] >= cost.amount) {
            currentPlayer.resources[cost.resourceType] -= cost.amount
          } else {
            return prev
          }
        } else if (cost.type === "factory" && cost.resourceType) {
          if (currentPlayer.factories[cost.resourceType] >= cost.amount) {
            currentPlayer.factories[cost.resourceType] -= cost.amount
          } else {
            return prev
          }
        }
        
        currentPlayer.actionPoints -= 1
        return {
          ...prev,
          achievements: updatedAchievements,
          players: updatedPlayers,
        }
      }
      return prev
    })
    setAchievementClaimedThisRound(true)
  }

  /**
   * Handles advancing to the next turn.
   */
  const handleNextTurn = () => {
    setGameState((prev) => nextTurn(prev, config))
    setAchievementClaimedThisRound(false)
  }

  // Get current player for UI rendering
  const currentPlayer = gameState.players[gameState.currentPlayer]

  // =========================================
  // Render Game UI
  // =========================================

  // Show game over screen if there's a winner
  if (gameState.winner !== null) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Game Over!</AlertTitle>
        <AlertDescription>
          Player {gameState.winner + 1} has won the game by reaching 10 or more points! Final Scores:
          {gameState.players.map((player, index) => (
            <div key={index}>
              Player {index + 1}: {player.victoryPoints} VP + {player.achievementPoints} AP {`=`}{" "}
              {player.victoryPoints + player.achievementPoints} Total
            </div>
          ))}
        </AlertDescription>
      </Alert>
    )
  }

  // Render main game UI
  return (
    <div className={`space-y-4 p-4 min-h-screen ${currentPlayer?.color}`}>
      <Achievements
        achievements={gameState.achievements}
        currentPlayer={currentPlayer}
        gameState={gameState}
        onClaimProject={handleClaimProject}
        onSponsorAward={handleSponsorAward}
        playerColors={gameState.players.map((p) => p.color)}
        achievementClaimedThisRound={achievementClaimedThisRound}
        gameResourceTypes={gameResourceTypes}
      />
      <Card>
        <CardHeader>
          <CardTitle>Game Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Round: {gameState.round}</p>
          <p>Current Player: {gameState.currentPlayer + 1}</p>
          <p>Cards in Pool: {gameState.cardPool.length}</p>
          <p>Action Points: {currentPlayer?.actionPoints}</p>
          <GameTooltip content="Suits are categories of cards. Some achievements and awards are based on suits played.">
            <p>Number of Suits: {config.suits}</p>
          </GameTooltip>
        </CardContent>
      </Card>

      <InnateActions
        actions={gameState.innateActions}
        onActionSelect={(action) => setGameState((prev) => {
          const { updatedPlayer, updatedGameState } = action.effect(
            prev.players[prev.currentPlayer],
            prev
          )
          const updatedPlayers = prev.players.map((player) => 
            player.id === updatedPlayer.id ? updatedPlayer : player
          )
          return { ...updatedGameState, players: updatedPlayers }
        })}
        currentPlayer={currentPlayer}
        gameState={gameState}
      />

      {currentPlayer && <PlayerResources player={currentPlayer} resourceTypes={gameResourceTypes} />}

      <Card>
        <CardHeader>
          <CardTitle>Current Player</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button onClick={handleDrawCard} disabled={currentPlayer?.actionPoints < 1}>
              Draw {config.drawCardCount} Card{config.drawCardCount > 1 ? "s" : ""}
              {config.discardCardCount > 0 && `, Discard ${config.discardCardCount}`}
            </Button>
            <Button onClick={handleNextTurn}>End Turn</Button>
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Hand:</h3>
            <motion.div
              className={`flex flex-wrap gap-2 mt-2 ${isDiscardMode ? "bg-red-500 bg-opacity-20 p-4 rounded-lg" : ""}`}
              animate={isDiscardMode ? { scale: 1.05 } : { scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {currentPlayer?.hand.map((card) => (
                  <CardComponent
                    key={card.id}
                    card={card}
                    onClick={() => handleCardClick(card.id)}
                    onContextMenu={(e) => handleCardContextMenu(e, card.id)}
                    isAffordable={
                      Object.entries(card.cost).every(([type, amount]) => {
                        const resourceType = type as ResourceType
                        return currentPlayer.resources[resourceType] >= (amount || 0)
                      }) &&
                      currentPlayer.actionPoints > 0
                    }
                    isDiscard={isDiscardMode}
                  />
                ))}
              </AnimatePresence>
            </motion.div>
            {isDiscardMode && (
              <div className="mt-2">
                <p>
                  Select {discardActionAmount} card{discardActionAmount > 1 ? "s" : ""} to discard
                </p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Played Cards:</h3>
            <div className="flex flex-wrap gap-2">
              {currentPlayer?.playedCards.map((card) => (
                <CardComponent key={card.id} card={card} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {contextMenuPosition && (
        <DropdownMenu open={true} onOpenChange={() => setContextMenuPosition(null)}>
          <DropdownMenuContent
            className="w-56"
            style={{ position: "absolute", left: contextMenuPosition.x, top: contextMenuPosition.y }}
          >
            <DropdownMenuItem onSelect={() => handleContextMenuAction("play")}>Play Card</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => handleContextMenuAction("discard")}>Discard Card</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

