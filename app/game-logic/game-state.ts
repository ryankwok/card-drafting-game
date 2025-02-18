import type { GameState, GameConfig, PlayerState, ResourceType, Resources, Factories, GameCard } from "../types"
import { generateCards } from "./card-generator"
import { generateInnateActions } from "./innate-actions"
import { generateAchievements } from "./achievements"

/** Colors assigned to players for visual distinction */
export const PLAYER_COLORS = [
  "bg-red-100",
  "bg-blue-100", 
  "bg-green-100", 
  "bg-yellow-100", 
  "bg-purple-100", 
  "bg-pink-100"
]

/**
 * Creates the initial game state based on configuration.
 * @param config Game configuration settings
 * @param resourceTypes Available resource types
 */
export const createInitialGameState = (
  config: GameConfig,
  resourceTypes: ResourceType[]
): GameState => {
  const cardPool = generateCards(config, resourceTypes)
  const players = createInitialPlayers(config, resourceTypes)
  const innateActions = generateInnateActions(config, resourceTypes)
  const { updatedCardPool, updatedPlayers } = dealStartingHands(cardPool, players, config.startingHand)

  return {
    cardPool: updatedCardPool,
    players: updatedPlayers,
    currentPlayer: 0,
    round: 1,
    innateActions,
    winner: null,
    achievements: generateAchievements(),
  }
}

/**
 * Creates the initial player states.
 * @param config Game configuration
 * @param resourceTypes Available resource types
 */
const createInitialPlayers = (
  config: GameConfig,
  resourceTypes: ResourceType[]
): PlayerState[] => {
  return Array.from({ length: config.players }, (_, i) => ({
    id: i,
    hand: [],
    playedCards: [],
    resources: Object.fromEntries(
      resourceTypes.map((type) => [type, 0])
    ) as Resources,
    factories: Object.fromEntries(
      resourceTypes.map((type) => [type, 0])
    ) as Factories,
    victoryPoints: 0,
    actionPoints: config.actionPointsPerTurn,
    achievementPoints: 0,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
  }))
}

/**
 * Deals starting hands to all players.
 * @param cardPool Available cards
 * @param players Player states
 * @param startingHandSize Number of cards each player should receive
 */
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

/**
 * Advances the game to the next player's turn.
 * @param gameState Current game state
 * @param config Game configuration
 */
export const nextTurn = (gameState: GameState, config: GameConfig): GameState => {
  const nextPlayer = (gameState.currentPlayer + 1) % config.players
  let nextRound = gameState.round

  if (nextPlayer === 0) {
    nextRound++
  }

  // Reset action points for next player
  let updatedPlayers = gameState.players.map((player, index) =>
    index === nextPlayer ? { ...player, actionPoints: config.actionPointsPerTurn } : player
  )

  // Generate resources from factories at the start of each round
  if (nextPlayer === 0) {
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
  }

  return {
    ...gameState,
    players: updatedPlayers,
    currentPlayer: nextPlayer,
    round: nextRound,
  }
} 