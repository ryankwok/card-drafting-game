export type ResourceType = "wood" | "brick" | "stone" | "wheat" | "sheep" | "iron" | "gold" | "gem" | "fish" | "oil"

export type GameConfig = {
  resourceTypes: number
  players: number
  suits: number
  totalCards: number
  startingHand: number
  innateActionCount: number
  actionPointsPerTurn: number
  drawCardCount: number
  discardCardCount: number
  discardChoice: boolean
}

export type Resources = {
  [key in ResourceType]: number
}

export type Factories = {
  [key in ResourceType]: number
}

export type Resource = {
  type: ResourceType
  amount: number
}

export type Factory = Resource & {
  isFactory: true
}

export type GameCard = {
  id: number
  name: string
  suit: number | null
  cost: { [key in ResourceType]?: number }
  reward: {
    resources: { [key in ResourceType]?: number }
    victoryPoints: number
  }
}

export type InnateActionType = "burn" | "skip" | "draw" | "buyVictoryPoints" | "swapCards" | "discard" | "convert" | "buildFactory" | "exchange"
export type ActionCost = {
  type: "resource" | "card" | "factory" | "actionPoints"
  amount: number
  resourceType?: ResourceType
}

export type ActionBenefit = {
  type: "resource" | "card" | "factory" | "victoryPoints"
  resourceType?: ResourceType
  amount: number
}

export interface InnateAction {
  id: number
  type: InnateActionType
  name: string
  description: string
  cost: ActionCost
  benefit: ActionBenefit
  effect: (player: PlayerState, gameState: GameState) => { updatedPlayer: PlayerState; updatedGameState: GameState }
}

export type PlayerState = {
  id: number
  hand: GameCard[]
  playedCards: GameCard[]
  resources: Resources
  factories: Factories
  victoryPoints: number
  actionPoints: number
  achievementPoints: number
  color: string
}

export type GameState = {
  cardPool: GameCard[]
  players: PlayerState[]
  currentPlayer: number
  round: number
  innateActions: InnateAction[]
  winner: number | null
  achievements: Achievement
}

export type Project = {
  id: number
  description: string
  isCompleted: (player: PlayerState, gameState: GameState) => boolean
  claimed: boolean
  claimedBy?: number
}

export type Award = {
  id: number
  description: string
  evaluate: (players: PlayerState[]) => number // Returns the index of the winning player
  sponsored: boolean
  sponsoredBy?: number
}

export type Achievement = {
  projects: Project[]
  awards: Award[]
  sponsorCost: {
    type: "discard" | "resource" | "factory"
    amount: number
    resourceType?: ResourceType
  }
  claimedProjects: number
  sponsoredAwards: number
}

