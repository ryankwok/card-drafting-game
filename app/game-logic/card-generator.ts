import type { GameCard, GameConfig, ResourceType, PlayerState } from "../types"

/**
 * Generates a card for a specific tier.
 * @param tier The tier level of the card (0-2)
 * @param id Unique identifier for the card
 * @param config Game configuration settings
 * @param resourceTypes Available resource types
 */
const generateCardForTier = (
  tier: number, 
  id: number, 
  config: GameConfig, 
  resourceTypes: ResourceType[]
): GameCard => {
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

  // Add victory points based on tier
  const vpProbability = tier === 0 ? 0.1 : tier === 1 ? 0.2 : 0.3
  const maxVP = tier === 0 ? 1 : tier === 1 ? 3 : 5

  if (Math.random() < vpProbability) {
    card.reward.victoryPoints = Math.floor(Math.random() * maxVP) + 1
    totalReward = Math.max(0, totalReward - card.reward.victoryPoints * 2)
  }

  // Add innate action for high tier cards
  if (tier === 2 && Math.random() < 0.2 && card.reward.victoryPoints === 0) {
    card.reward.innateAction = {
      name: "Bonus Action",
      description: "Gain an extra action point this turn",
      effect: (player: PlayerState) => ({ 
        updatedPlayer: { ...player, actionPoints: player.actionPoints + 1 } 
      }),
    }
    totalReward = Math.max(0, totalReward - 3)
  }

  // Add basic resources
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
    card.reward.resources[factoryType] = factoryAmount
    card.reward.isFactory = true
  }

  return card
}

/**
 * Generates the initial deck of cards for the game.
 * @param config Game configuration settings
 * @param resourceTypes Available resource types
 */
export const generateCards = (config: GameConfig, resourceTypes: ResourceType[]): GameCard[] => {
  const cardsPerTier = Math.floor(config.totalCards / 3)
  const cards: GameCard[] = []

  // Generate cards for each tier
  for (let tier = 0; tier < 3; tier++) {
    for (let i = 0; i < cardsPerTier; i++) {
      cards.push(generateCardForTier(tier, tier * cardsPerTier + i, config, resourceTypes))
    }
  }

  // Add any remaining cards to the highest tier
  for (let i = cards.length; i < config.totalCards; i++) {
    cards.push(generateCardForTier(2, i, config, resourceTypes))
  }

  return cards
} 