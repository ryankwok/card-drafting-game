import type { GameState, PlayerState, GameCard, ResourceType } from "../types"

/**
 * Handles playing a card from a player's hand.
 * @param gameState Current game state
 * @param cardId ID of the card to play
 * @returns Updated game state
 */
export const playCard = (gameState: GameState, cardId: number): GameState => {
  const currentPlayer = gameState.players[gameState.currentPlayer]
  const updatedPlayer = { ...currentPlayer }
  const updatedCardPool = [...gameState.cardPool]

  const cardToPlay = updatedPlayer.hand.find((card) => card.id === cardId)
  if (!cardToPlay || updatedPlayer.actionPoints <= 0) {
    return gameState
  }

  // Check if player has enough resources
  const canAfford = Object.entries(cardToPlay.cost).every(([type, amount]) => {
    const resourceType = type as ResourceType
    return updatedPlayer.resources[resourceType] >= (amount || 0)
  })

  if (!canAfford) {
    return gameState
  }

  // Remove card from hand and add to played cards
  updatedPlayer.hand = updatedPlayer.hand.filter((card) => card.id !== cardId)
  updatedPlayer.playedCards.push(cardToPlay)

  // Deduct costs
  Object.entries(cardToPlay.cost).forEach(([type, amount]) => {
    const resourceType = type as ResourceType
    updatedPlayer.resources[resourceType] -= (amount || 0)
  })

  // Apply rewards based on card type
  applyCardRewards(updatedPlayer, cardToPlay)

  const updatedPlayers = gameState.players.map((player) => 
    player.id === updatedPlayer.id ? updatedPlayer : player
  )

  // Check for win condition
  if (updatedPlayer.victoryPoints + updatedPlayer.achievementPoints >= 10) {
    return {
      ...gameState,
      players: updatedPlayers,
      cardPool: updatedCardPool,
      winner: updatedPlayer.id
    }
  }

  return {
    ...gameState,
    players: updatedPlayers,
    cardPool: updatedCardPool
  }
}

/**
 * Applies the rewards from a card to a player.
 * @param player Player to receive rewards
 * @param card Card providing the rewards
 */
const applyCardRewards = (player: PlayerState, card: GameCard): void => {
  // Handle factory rewards
  if (card.reward.isFactory) {
    Object.entries(card.reward.resources).forEach(([type, amount]) => {
      const resourceType = type as ResourceType
      if (amount !== undefined) {
        player.factories[resourceType] = 
          (player.factories[resourceType] || 0) + amount
      }
    })
  } else {
    // Handle regular resource rewards
    Object.entries(card.reward.resources).forEach(([type, amount]) => {
      const resourceType = type as ResourceType
      if (amount !== undefined) {
        player.resources[resourceType] = 
          (player.resources[resourceType] || 0) + amount
      }
    })
  }

  // Add victory points
  player.victoryPoints += card.reward.victoryPoints
  player.actionPoints -= 1

  // Apply innate action if present
  if (card.reward.innateAction) {
    const result = card.reward.innateAction.effect(player)
    player.actionPoints = result.updatedPlayer.actionPoints
  }
}

/**
 * Discards a card from a player's hand.
 * @param gameState Current game state
 * @param cardId ID of the card to discard
 * @returns Updated game state
 */
export const discardCard = (gameState: GameState, cardId: number): GameState => {
  const currentPlayer = gameState.players[gameState.currentPlayer]
  const updatedPlayer = { ...currentPlayer }
  const updatedCardPool = [...gameState.cardPool]

  const cardIndex = updatedPlayer.hand.findIndex((card) => card.id === cardId)
  if (cardIndex === -1) {
    return gameState
  }

  const [discardedCard] = updatedPlayer.hand.splice(cardIndex, 1)
  discardedCard.lastOwnerId = currentPlayer.id
  updatedCardPool.push(discardedCard)

  const updatedPlayers = gameState.players.map((player) => 
    player.id === updatedPlayer.id ? updatedPlayer : player
  )

  return {
    ...gameState,
    cardPool: updatedCardPool,
    players: updatedPlayers,
  }
}

/**
 * Draws cards for the current player.
 * @param gameState Current game state
 * @param drawCount Number of cards to draw
 * @returns Updated game state and drawn cards
 */
export const drawCards = (
  gameState: GameState, 
  drawCount: number
): { updatedState: GameState; drawnCards: GameCard[] } => {
  if (gameState.cardPool.length === 0) {
    return { updatedState: gameState, drawnCards: [] }
  }

  const currentPlayer = gameState.players[gameState.currentPlayer]
  const updatedPlayer = { ...currentPlayer }
  const updatedCardPool = [...gameState.cardPool]
  const drawnCards: GameCard[] = []

  // Draw cards
  for (let i = 0; i < drawCount; i++) {
    if (updatedCardPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * updatedCardPool.length)
      const drawnCard = updatedCardPool[randomIndex]
      drawnCards.push(drawnCard)
      updatedPlayer.hand.push(drawnCard)
      updatedCardPool.splice(randomIndex, 1)
    }
  }

  updatedPlayer.actionPoints -= 1

  const updatedPlayers = gameState.players.map((player) => 
    player.id === updatedPlayer.id ? updatedPlayer : player
  )

  return {
    updatedState: {
      ...gameState,
      cardPool: updatedCardPool,
      players: updatedPlayers,
    },
    drawnCards
  }
} 