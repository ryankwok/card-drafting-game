import type { Achievement, Project, Award, ResourceType } from "../types"

/**
 * Generates the initial set of achievements for the game.
 * Includes both projects that can be completed and awards that can be sponsored.
 */
export const generateAchievements = (): Achievement => {
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