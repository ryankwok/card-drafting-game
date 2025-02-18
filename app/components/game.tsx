"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type {
  GameConfig,
  GameCard,
  InnateAction,
  InnateActionType,
  GameState,
  PlayerState,
  ResourceType,
  Resources,
  Factories,
  Achievement,
  Project,
  Award,
} from "../types"
import CardComponent from "./card"
import PlayerResources from "./player-resources"
import InnateActions from "./innate-actions"
import { Achievements } from "./achievements"
import { GameTooltip } from "./game-tooltip"

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
      sponsorCost: { type: "discard", amount: 0 }, // Initialize with valid type
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

    const initialCardPool = generateCards(config, initialGameResourceTypes)
    const initialPlayers = Array.from({ length: config.players }, (_, i) => ({
      id: i,
      hand: [],
      playedCards: [],
      resources: Object.fromEntries(initialGameResourceTypes.map((type) => [type, 0])) as Resources,
      factories: Object.fromEntries(initialGameResourceTypes.map((type) => [type, 0])) as Factories,
      victoryPoints: 0,
      actionPoints: config.actionPointsPerTurn,
      achievementPoints: 0,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length], // Assign color to each player
    }))
    const initialInnateActions = generateInnateActions(config, initialGameResourceTypes)

    // Deal starting hands
    const { updatedCardPool, updatedPlayers } = dealStartingHands(initialCardPool, initialPlayers, config.startingHand)

    setGameState({
      cardPool: updatedCardPool,
      players: updatedPlayers,
      currentPlayer: 0,
      round: 1,
      innateActions: initialInnateActions,
      winner: null,
      achievements: generateAchievements(),
    })
  }, [config])

  const generateCards = (config: GameConfig, resourceTypes: ResourceType[]): GameCard[] => {
    const cardsPerTier = Math.floor(config.totalCards / 3)
    const cards: GameCard[] = []

    const generateCardForTier = (tier: number, id: number): GameCard => {
      let totalReward: number
      const card: GameCard = {
        id,
        name: `Tier ${tier} Card ${id + 1}`,
        suit: config.suits > 0 ? Math.floor(Math.random() * config.suits) : null,
        cost: {},
        reward: {
          resources: {},
          victoryPoints: 0,
          innateAction: undefined
        }
      }

      // Generate cost based on tier
      const costRange = tier === 0 ? [0, 2] : tier === 1 ? [3, 11] : [12, 20]
      totalReward = Math.floor(Math.random() * (costRange[1] - costRange[0] + 1)) + costRange[0]

      for (let i = 0; i < totalReward; i++) {
        const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
        card.cost[resourceType] = (card.cost[resourceType] || 0) + 1
      }

      // Generate reward based on tier
      const rewardRange = tier === 0 ? [1, 5] : tier === 1 ? [4, 10] : [8, 15]
      totalReward = Math.floor(Math.random() * (rewardRange[1] - rewardRange[0] + 1)) + rewardRange[0]

      // Adjust VP probabilities and amounts based on tier
      const vpProbability = tier === 0 ? 0.1 : tier === 1 ? 0.2 : 0.3
      const maxVP = tier === 0 ? 1 : tier === 1 ? 3 : 5

      if (Math.random() < vpProbability) {
        card.reward.victoryPoints = Math.floor(Math.random() * maxVP) + 1
        totalReward = Math.max(0, totalReward - card.reward.victoryPoints * 2)
      }

      // Adjust the innate action probability for Tier 2 cards
      if (tier === 2 && Math.random() < 0.2 && card.reward.victoryPoints === 0) {
        card.reward.innateAction = {
          name: "Bonus Action",
          description: "Gain an extra action point this turn",
          effect: (player: PlayerState) => ({ updatedPlayer: { ...player, actionPoints: player.actionPoints + 1 } }),
        }
        totalReward = Math.max(0, totalReward - 3)
      }

      // Distribute remaining reward as resources
      if (totalReward > 0) {
        for (let i = 0; i < totalReward; i++) {
          const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
          card.reward.resources[resourceType] = (card.reward.resources[resourceType] || 0) + 1
        }
      }

      // Add factory rewards for higher tier cards
      if (tier > 0 && Math.random() < 0.4) {
        const factoryType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
        const factoryAmount = tier === 1 ? 1 : Math.random() < 0.5 ? 2 : 3
        // Add to factories instead of resources for factory cards
        card.reward.resources[factoryType] = factoryAmount
        card.reward.isFactory = true
      }

      return card
    }

    // Generate cards for each tier
    for (let tier = 0; tier < 3; tier++) {
      for (let i = 0; i < cardsPerTier; i++) {
        cards.push(generateCardForTier(tier, tier * cardsPerTier + i))
      }
    }

    // Add any remaining cards to the highest tier
    for (let i = cards.length; i < config.totalCards; i++) {
      cards.push(generateCardForTier(2, i))
    }

    return cards
  }

  const dealStartingHands = (
    cardPool: GameCard[],
    players: PlayerState[],
    startingHandSize: number
  ): { updatedCardPool: GameCard[]; updatedPlayers: PlayerState[] } => {
    const updatedCardPool = [...cardPool]
    const updatedPlayers = players.map((player) => {
      const hand: GameCard[] = []
      for (let i = 0; i < startingHandSize; i++) {
        if (updatedCardPool.length > 0) {
          const randomIndex = Math.floor(Math.random() * updatedCardPool.length)
          const drawnCard = updatedCardPool[randomIndex]
          hand.push(drawnCard)
          updatedCardPool.splice(randomIndex, 1)
        }
      }
      return { ...player, hand }
    })

    return { updatedCardPool, updatedPlayers }
  }

  const generateInnateActions = (config: GameConfig, resourceTypes: ResourceType[]): InnateAction[] => {
    const actions: InnateAction[] = []
    const actionTypes: InnateActionType[] = [
      "draw", "discard", "burn", "swapCards",
      "convert", "buildFactory", "exchange"
    ]

    for (let i = 0; i < config.innateActionCount; i++) {
      const actionType = actionTypes[Math.floor(Math.random() * actionTypes.length)]
      let action: InnateAction

      switch (actionType) {
        case "draw":
          action = generateDrawAction(i + 1)
          break
        case "discard":
          action = generateDiscardAction(i + 1, resourceTypes)
          break
        case "burn":
          action = generateBurnAction(i + 1)
          break
        case "swapCards":
          action = generateSwapCardsAction(i + 1)
          break
        case "convert":
          action = generateConvertAction(i + 1, resourceTypes)
          break
        case "buildFactory":
          action = generateBuildFactoryAction(i + 1, resourceTypes)
          break
        case "exchange":
          action = generateExchangeAction(i + 1, resourceTypes)
          break
        default:
          action = generateDrawAction(i + 1) // Fallback to draw action
      }

      actions.push(action)
    }

    return actions
  }

  const generateDrawAction = (id: number): InnateAction => {
    const drawCount = Math.floor(Math.random() * 2) + 2
    return {
      id,
      type: "draw",
      name: `Draw ${drawCount} Cards`,
      description: "Draw cards from the deck",
      cost: { type: "actionPoints", amount: 1 },
      effect: (player, gameState) => {
        const updatedPlayer = { ...player }
        const updatedGameState = { ...gameState }

        for (let i = 0; i < drawCount; i++) {
          if (updatedGameState.cardPool.length > 0) {
            const randomIndex = Math.floor(Math.random() * updatedGameState.cardPool.length)
            const drawnCard = updatedGameState.cardPool[randomIndex]
            updatedPlayer.hand.push(drawnCard)
            updatedGameState.cardPool.splice(randomIndex, 1)
          }
        }

        return { updatedPlayer, updatedGameState }
      },
    }
  }

  const generateDiscardAction = (id: number, resourceTypes: ResourceType[]): InnateAction => {
    const discardCount = Math.floor(Math.random() * 2) + 2
    const resourceCount = Math.floor(Math.random() * 3) + 2
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]

    return {
      id,
      type: "discard",
      name: `Discard ${discardCount} Cards for ${resourceCount} ${resourceType}`,
      description: `Discard cards to gain resources`,
      cost: { type: "card", amount: discardCount },
      effect: (player, gameState) => {
        const updatedPlayer = { ...player }
        const updatedGameState = { ...gameState }

        // Discard random cards
        for (let i = 0; i < discardCount; i++) {
          if (updatedPlayer.hand.length > 0) {
            const randomIndex = Math.floor(Math.random() * updatedPlayer.hand.length)
            const discardedCard = updatedPlayer.hand.splice(randomIndex, 1)[0]
            updatedGameState.cardPool.push(discardedCard)
          }
        }

        // Gain resources
        updatedPlayer.resources[resourceType] += resourceCount

        return { updatedPlayer, updatedGameState }
      },
    }
  }

  const generateBurnAction = (id: number): InnateAction => {
    const burnCount = Math.floor(Math.random() * 2) + 2
    const vpGain = Math.floor(Math.random() * 2) + 1

    return {
      id,
      type: "burn",
      name: `Burn ${burnCount} Cards for ${vpGain} Victory Points`,
      description: "Remove cards from the game to gain Victory Points",
      cost: { type: "card", amount: burnCount },
      effect: (player, gameState) => {
        const updatedPlayer = { ...player }

        // Burn (remove) random cards
        for (let i = 0; i < burnCount; i++) {
          if (updatedPlayer.hand.length > 0) {
            const randomIndex = Math.floor(Math.random() * updatedPlayer.hand.length)
            updatedPlayer.hand.splice(randomIndex, 1)
          }
        }

        // Gain Victory Points
        updatedPlayer.victoryPoints += vpGain

        return { updatedPlayer, updatedGameState: gameState }
      },
    }
  }

  const generateSwapCardsAction = (id: number): InnateAction => {
    const swapCount = Math.floor(Math.random() * 2) + 1

    return {
      id,
      type: "swapCards",
      name: `Swap ${swapCount} Cards with Next Player`,
      description: "Exchange cards with the next player",
      cost: { type: "actionPoints", amount: 1 },
      effect: (player, gameState) => {
        const updatedGameState = { ...gameState }
        const currentPlayerIndex = updatedGameState.players.findIndex((p) => p.id === player.id)
        const nextPlayerIndex = (currentPlayerIndex + 1) % updatedGameState.players.length

        const currentPlayer = { ...updatedGameState.players[currentPlayerIndex] }
        const nextPlayer = { ...updatedGameState.players[nextPlayerIndex] }

        // Swap random cards
        for (let i = 0; i < swapCount; i++) {
          if (currentPlayer.hand.length > 0 && nextPlayer.hand.length > 0) {
            const currentRandomIndex = Math.floor(Math.random() * currentPlayer.hand.length)
            const nextRandomIndex = Math.floor(Math.random() * nextPlayer.hand.length)

            const tempCard = currentPlayer.hand[currentRandomIndex]
            currentPlayer.hand[currentRandomIndex] = nextPlayer.hand[nextRandomIndex]
            nextPlayer.hand[nextRandomIndex] = tempCard
          }
        }

        updatedGameState.players[currentPlayerIndex] = currentPlayer
        updatedGameState.players[nextPlayerIndex] = nextPlayer

        return { updatedPlayer: currentPlayer, updatedGameState }
      },
    }
  }

  /**
   * Creates a convert action that transforms one resource type into another.
   */
  const generateConvertAction = (id: number, resourceTypes: ResourceType[]): InnateAction => {
    const sourceResourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
    let targetResourceType: ResourceType
    do {
      targetResourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
    } while (targetResourceType === sourceResourceType)

    const sourceAmount = Math.floor(Math.random() * 2) + 2
    const targetAmount = Math.floor(Math.random() * 2) + 1

    return {
      id,
      type: "convert",
      name: `Convert ${sourceAmount} ${sourceResourceType} to ${targetAmount} ${targetResourceType}`,
      description: "Convert one type of resource into another",
      cost: { type: "resource", resourceType: sourceResourceType, amount: sourceAmount },
      effect: (player, gameState) => {
        const updatedPlayer = { ...player }

        if (updatedPlayer.resources[sourceResourceType] >= sourceAmount) {
          updatedPlayer.resources[sourceResourceType] -= sourceAmount
          updatedPlayer.resources[targetResourceType] += targetAmount
        }

        return { updatedPlayer, updatedGameState: gameState }
      },
    }
  }

  /**
   * Creates a build factory action that constructs resource-producing buildings.
   */
  const generateBuildFactoryAction = (id: number, resourceTypes: ResourceType[]): InnateAction => {
    const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
    return {
      id,
      type: "buildFactory",
      name: `Build ${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} Factory -5(+1) ${resourceType}`,
      description: `Build a factory to produce ${resourceType}`,
      cost: { type: "resource", resourceType, amount: 5 },
      effect: (player, gameState) => {
        const updatedPlayer = { ...player }
        if (updatedPlayer.resources[resourceType] >= 5) {
          updatedPlayer.resources[resourceType] -= 5
          updatedPlayer.factories[resourceType] = (updatedPlayer.factories[resourceType] || 0) + 1
        }
        return { updatedPlayer, updatedGameState: gameState }
      },
    }
  }

  /**
   * Creates an exchange action that trades resources or cards.
   */
  const generateExchangeAction = (id: number, resourceTypes: ResourceType[]): InnateAction => {
    type ExchangeType = "resource" | "card"
    const giveType: ExchangeType = Math.random() < 0.5 ? "resource" : "card"
    const receiveType: ExchangeType = Math.random() < 0.5 ? "resource" : "card"
    const giveAmount = Math.floor(Math.random() * 3) + 1
    const receiveAmount = Math.floor(Math.random() * 3) + 1

    let giveName: string
    let receiveName: string
    let giveResourceType: ResourceType | undefined
    let receiveResourceType: ResourceType | undefined

    if (giveType === "resource") {
      giveResourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
      giveName = `${giveAmount} ${giveResourceType}`
    } else {
      giveName = `${giveAmount} card${giveAmount > 1 ? "s" : ""}`
    }

    if (receiveType === "resource") {
      receiveResourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)]
      receiveName = `${receiveAmount} ${receiveResourceType}`
    } else {
      receiveName = `${receiveAmount} card${receiveAmount > 1 ? "s" : ""}`
    }

    return {
      id,
      type: "exchange",
      name: `Exchange: Give ${giveName} to receive ${receiveName}`,
      description: `Exchange resources or cards`,
      cost: { type: giveType, resourceType: giveResourceType, amount: giveAmount },
      effect: (player, gameState) => {
        const updatedPlayer = { ...player }
        const updatedGameState = { ...gameState }

        // Handle giving
        if (giveType === "resource" && giveResourceType) {
          updatedPlayer.resources[giveResourceType] -= giveAmount
        } else if (giveType === "card") {
          for (let i = 0; i < giveAmount; i++) {
            if (updatedPlayer.hand.length > 0) {
              const randomIndex = Math.floor(Math.random() * updatedPlayer.hand.length)
              const discardedCard = updatedPlayer.hand.splice(randomIndex, 1)[0]
              updatedGameState.cardPool.push(discardedCard)
            }
          }
        }

        // Handle receiving
        if (receiveType === "resource" && receiveResourceType) {
          updatedPlayer.resources[receiveResourceType] += receiveAmount
        } else if (receiveType === "card") {
          for (let i = 0; i < receiveAmount; i++) {
            if (updatedGameState.cardPool.length > 0) {
              const randomIndex = Math.floor(Math.random() * updatedGameState.cardPool.length)
              const drawnCard = updatedGameState.cardPool.splice(randomIndex, 1)[0]
              updatedPlayer.hand.push(drawnCard)
            }
          }
        }

        return { updatedPlayer, updatedGameState }
      },
    }
  }

  // =========================================
  // Card Management
  // =========================================

  /**
   * Discards a card from the current player's hand.
   * The card is returned to the card pool.
   */
  const discardCard = (cardId: number) => {
    setGameState((prev) => {
      const currentPlayer = prev.players[prev.currentPlayer]
      const updatedPlayer = { ...currentPlayer }
      const updatedCardPool = [...prev.cardPool]

      const cardIndex = updatedPlayer.hand.findIndex((card) => card.id === cardId)
      if (cardIndex !== -1) {
        const [discardedCard] = updatedPlayer.hand.splice(cardIndex, 1)
        discardedCard.lastOwnerId = currentPlayer.id
        updatedCardPool.push(discardedCard)
      }

      const updatedPlayers = prev.players.map((player) => 
        player.id === updatedPlayer.id ? updatedPlayer : player
      )

      return {
        ...prev,
        cardPool: updatedCardPool,
        players: updatedPlayers,
      }
    })

    setDiscardActionAmount((prev) => {
      const newAmount = prev - 1
      if (newAmount === 0) {
        setIsDiscardMode(false)
      }
      return newAmount
    })
  }

  /**
   * Draws cards for the current player.
   * May trigger discard mode if required by game config.
   */
  const drawCard = () => {
    if (gameState.cardPool.length === 0) return

    setGameState((prev) => {
      const currentPlayer = prev.players[prev.currentPlayer]
      const updatedPlayer = { ...currentPlayer }
      const updatedCardPool = [...prev.cardPool]
      const drawnCards: GameCard[] = []

      // Draw cards
      for (let i = 0; i < config.drawCardCount; i++) {
        if (updatedCardPool.length > 0) {
          const randomIndex = Math.floor(Math.random() * updatedCardPool.length)
          const drawnCard = updatedCardPool[randomIndex]
          drawnCards.push(drawnCard)
          updatedPlayer.hand.push(drawnCard)
          updatedCardPool.splice(randomIndex, 1)
        }
      }

      updatedPlayer.actionPoints -= 1

      const updatedPlayers = prev.players.map((player) => 
        player.id === updatedPlayer.id ? updatedPlayer : player
      )

      // Activate discard mode if necessary
      if (config.discardCardCount > 0 && config.discardChoice) {
        setIsDiscardMode(true)
        setDiscardActionAmount(config.discardCardCount)
      } else if (config.discardCardCount > 0) {
        // Automatically discard if discard choice is not enabled
        for (let i = 0; i < config.discardCardCount; i++) {
          if (updatedPlayer.hand.length > 0) {
            const randomIndex = Math.floor(Math.random() * updatedPlayer.hand.length)
            const discardedCard = updatedPlayer.hand[randomIndex]
            discardedCard.lastOwnerId = currentPlayer.id
            updatedCardPool.push(discardedCard)
            updatedPlayer.hand.splice(randomIndex, 1)
          }
        }
      }

      return {
        ...prev,
        cardPool: updatedCardPool,
        players: updatedPlayers,
      }
    })
  }

  /**
   * Plays a card from the current player's hand.
   * Applies costs and rewards, including resource generation and factory building.
   */
  const playCard = (cardId: number) => {
    setGameState((prev) => {
      const currentPlayer = prev.players[prev.currentPlayer]
      const updatedPlayer = { ...currentPlayer }
      const updatedCardPool = [...prev.cardPool]

      const cardToPlay = updatedPlayer.hand.find((card) => card.id === cardId)
      if (cardToPlay && updatedPlayer.actionPoints > 0) {
        // Check if player has enough resources
        const canAfford = Object.entries(cardToPlay.cost).every(([type, amount]) => {
          const resourceType = type as ResourceType
          return updatedPlayer.resources[resourceType] >= (amount || 0)
        })

        if (canAfford) {
          // Remove card from hand and add to played cards
          updatedPlayer.hand = updatedPlayer.hand.filter((card) => card.id !== cardId)
          updatedPlayer.playedCards.push(cardToPlay)

          // Deduct costs
          Object.entries(cardToPlay.cost).forEach(([type, amount]) => {
            const resourceType = type as ResourceType
            updatedPlayer.resources[resourceType] -= (amount || 0)
          })

          // Add rewards
          if (cardToPlay.reward.isFactory) {
            // Handle factory rewards by adding to factories
            Object.entries(cardToPlay.reward.resources).forEach(([type, amount]) => {
              const resourceType = type as ResourceType
              if (amount !== undefined) {
                updatedPlayer.factories[resourceType] = 
                  (updatedPlayer.factories[resourceType] || 0) + amount
              }
            })
          } else {
            // Handle regular resource rewards
            Object.entries(cardToPlay.reward.resources).forEach(([type, amount]) => {
              const resourceType = type as ResourceType
              if (amount !== undefined) {
                updatedPlayer.resources[resourceType] = 
                  (updatedPlayer.resources[resourceType] || 0) + amount
              }
            })
          }

          updatedPlayer.victoryPoints += cardToPlay.reward.victoryPoints
          updatedPlayer.actionPoints -= 1

          // Apply innate action reward if any
          if (cardToPlay.reward.innateAction) {
            const result = cardToPlay.reward.innateAction.effect(updatedPlayer)
            updatedPlayer.actionPoints = result.updatedPlayer.actionPoints
          }
        }
      }

      const updatedPlayers = prev.players.map((player) => 
        player.id === updatedPlayer.id ? updatedPlayer : player
      )

      // Check for win condition
      if (updatedPlayer.victoryPoints + updatedPlayer.achievementPoints >= 10) {
        return { ...prev, players: updatedPlayers, winner: updatedPlayer.id }
      }

      return { ...prev, players: updatedPlayers, cardPool: updatedCardPool }
    })
  }

  // =========================================
  // UI Event Handlers
  // =========================================

  /**
   * Handles clicking on a card in the player's hand.
   * Either plays or discards the card based on current game mode.
   */
  const handleCardClick = (cardId: number) => {
    if (isDiscardMode) {
      discardCard(cardId)
    } else {
      playCard(cardId)
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

  // =========================================
  // Game Flow Control
  // =========================================

  /**
   * Performs an innate action selected by the player.
   * Checks if the action is affordable before executing.
   */
  const performInnateAction = (action: InnateAction) => {
    setGameState((prev) => {
      const currentPlayer = prev.players[prev.currentPlayer]

      // Check if the action is affordable
      const isAffordable = (() => {
        switch (action.cost.type) {
          case "actionPoints":
            return currentPlayer.actionPoints >= action.cost.amount
          case "card":
            return currentPlayer.hand.length >= action.cost.amount
          case "resource":
            if (!action.cost.resourceType) return false
            return currentPlayer.resources[action.cost.resourceType] >= action.cost.amount
          default:
            return false
        }
      })()

      if (!isAffordable) {
        return prev
      }

      const { updatedPlayer, updatedGameState } = action.effect(currentPlayer, prev)

      // Deduct action points
      updatedPlayer.actionPoints -= 1

      const updatedPlayers = prev.players.map((player) => 
        player.id === updatedPlayer.id ? updatedPlayer : player
      )

      // Check for win condition
      if (updatedPlayer.victoryPoints >= 10) {
        return { ...updatedGameState, players: updatedPlayers, winner: updatedPlayer.id }
      }

      return {
        ...updatedGameState,
        players: updatedPlayers,
      }
    })
  }

  /**
   * Advances the game to the next player's turn.
   * Generates resources from factories at the start of each round.
   */
  const nextTurn = () => {
    setGameState((prev) => {
      const nextPlayer = (prev.currentPlayer + 1) % config.players
      let nextRound = prev.round

      if (nextPlayer === 0) {
        nextRound++
      }

      let updatedPlayers = prev.players.map((player, index) =>
        index === nextPlayer ? { ...player, actionPoints: config.actionPointsPerTurn } : player
      )

      // Generate resources from factories
      updatedPlayers = updatedPlayers.map((player) => ({
        ...player,
        resources: Object.fromEntries(
          Object.entries(player.resources).map(([type, amount]) => {
            const resourceType = type as ResourceType
            return [
              resourceType,
              amount + (player.factories[resourceType] || 0)
            ]
          })
        ) as Resources
      }))

      return {
        ...prev,
        players: updatedPlayers,
        currentPlayer: nextPlayer,
        round: nextRound,
      }
    })
    setAchievementClaimedThisRound(false)
  }

  // =========================================
  // Achievement System
  // =========================================

  /**
   * Generates the initial set of achievements for the game.
   * Includes both projects that can be completed and awards that can be sponsored.
   */
  const generateAchievements = (): Achievement => {
    const projects: Project[] = [
      {
        id: 1,
        description: "First player to play 6 cards",
        isCompleted: (player) => player.playedCards.length >= 6,
        claimed: false,
      },
      {
        id: 2,
        description: "First player to play 3 unique suits",
        isCompleted: (player) => new Set(player.playedCards.map((c) => c.suit)).size >= 3,
        claimed: false,
      },
      {
        id: 3,
        description: "First player to accumulate 10 stone",
        isCompleted: (player) => player.resources.stone >= 10,
        claimed: false,
      },
      {
        id: 4,
        description: "First player to reach 3 wood factories",
        isCompleted: (player) => player.factories.wood >= 3,
        claimed: false,
      },
      {
        id: 5,
        description: "First player to discard 8 cards",
        isCompleted: (player, gameState) => 
          gameState.cardPool.filter((c) => c.lastOwnerId === player.id).length >= 8,
        claimed: false,
      },
    ]

    const awards: Award[] = [
      {
        id: 1,
        description: "Player with bigger hand than any other player",
        evaluate: (players) => 
          players.indexOf(players.reduce((a, b) => (a.hand.length > b.hand.length ? a : b))),
        sponsored: false,
      },
      {
        id: 2,
        description: "Player with most of a single suit than any other",
        evaluate: (players) =>
          players.indexOf(
            players.reduce((a, b) =>
              Math.max(...a.playedCards.map((c) => c.suit ?? -1)) > 
              Math.max(...b.playedCards.map((c) => c.suit ?? -1)) ? a : b,
            ),
          ),
        sponsored: false,
      },
      {
        id: 3,
        description: "Player with the most resources total",
        evaluate: (players) =>
          players.indexOf(
            players.reduce((a, b) =>
              Object.values(a.resources).reduce((c, d) => c + d, 0) >
              Object.values(b.resources).reduce((c, d) => c + d, 0)
                ? a
                : b,
            ),
          ),
        sponsored: false,
      },
      {
        id: 4,
        description: "Player with the most factories",
        evaluate: (players) =>
          players.indexOf(
            players.reduce((a, b) =>
              Object.values(a.factories).reduce((c, d) => c + d, 0) >
              Object.values(b.factories).reduce((c, d) => c + d, 0)
                ? a
                : b,
            ),
          ),
        sponsored: false,
      },
      {
        id: 5,
        description: "Player with the most played cards",
        evaluate: (players) =>
          players.indexOf(players.reduce((a, b) => (a.playedCards.length > b.playedCards.length ? a : b))),
        sponsored: false,
      },
    ]

    type SponsorCost = {
      type: "resource" | "discard" | "factory"
      amount: number
      resourceType?: ResourceType
    }

    const sponsorCosts: SponsorCost[] = [
      { type: "resource", amount: 10, resourceType: "wood" },
      { type: "resource", amount: 8, resourceType: "stone" },
      { type: "resource", amount: 6, resourceType: "brick" },
      { type: "factory", amount: 3, resourceType: "wood" },
      { type: "factory", amount: 2, resourceType: "stone" },
      { type: "factory", amount: 2, resourceType: "brick" },
      { type: "discard", amount: 3 },
      { type: "discard", amount: 4 },
    ]

    return {
      projects,
      awards,
      sponsorCost: sponsorCosts[Math.floor(Math.random() * sponsorCosts.length)],
      claimedProjects: 0,
      sponsoredAwards: 0,
    }
  }

  /**
   * Claims a project achievement for the current player.
   * Can only be done once per turn and if the project is unclaimed.
   */
  const claimProject = (projectId: number) => {
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
   * Sponsors an award for the current player.
   * Requires paying a cost and can only be done once per turn.
   */
  const sponsorAward = (awardId: number) => {
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

        // Update sponsor cost for next time
        updatedAchievements.sponsorCost = generateAchievements().sponsorCost

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
        onClaimProject={claimProject}
        onSponsorAward={sponsorAward}
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
        onActionSelect={performInnateAction}
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
            <Button onClick={drawCard} disabled={currentPlayer?.actionPoints < 1}>
              Draw {config.drawCardCount} Card{config.drawCardCount > 1 ? "s" : ""}
              {config.discardCardCount > 0 && `, Discard ${config.discardCardCount}`}
            </Button>
            <Button onClick={nextTurn}>End Turn</Button>
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

