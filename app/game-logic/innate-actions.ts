import type { InnateAction, GameConfig, ResourceType, GameState, PlayerState } from "../types"

/**
 * Generates the available innate actions for the game.
 * @param config Game configuration settings
 * @param resourceTypes Available resource types
 */
export const generateInnateActions = (
  config: GameConfig,
  resourceTypes: ResourceType[]
): InnateAction[] => {
  const actions: InnateAction[] = []
  const actionTypes = [
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