// =========================================
// Resource Types and Management
// =========================================

/**
 * Available resource types in the game.
 * These are the basic building blocks used for card costs and rewards.
 */
export type ResourceType = "wood" | "brick" | "stone" | "wheat" | "sheep" | "iron" | "gold" | "gem" | "fish" | "oil"

/**
 * Tracks the quantity of each resource type.
 * All resource types must have a value, even if it's 0.
 */
export type Resources = {
  [key in ResourceType]: number
}

/**
 * Tracks the number of factories owned for each resource type.
 * Factories generate one resource of their type each round.
 */
export type Factories = {
  [key in ResourceType]: number
}

/**
 * Represents a single resource with its type and amount.
 * Used for individual resource transactions.
 */
export type Resource = {
  type: ResourceType
  amount: number
}

/**
 * Extends Resource to represent a factory.
 * Factories are special resources that generate income each round.
 */
export type Factory = Resource & {
  isFactory: true
}

// =========================================
// Card System
// =========================================

/**
 * Represents a playable card in the game.
 * Cards are the primary means of gaining resources, victory points, and special actions.
 */
export type GameCard = {
  /** Unique identifier for the card */
  id: number
  /** Display name of the card */
  name: string
  /** Card's suit (category), null if card has no suit */
  suit: number | null
  /** Resources required to play this card */
  cost: { [key in ResourceType]?: number }
  /** Benefits gained when playing this card */
  reward: {
    /** Resources gained from playing the card */
    resources: { [key in ResourceType]?: number }
    /** Victory points earned from playing the card */
    victoryPoints: number
    /** Optional special action granted by the card */
    innateAction?: {
      name: string
      description: string
      effect: (player: PlayerState) => { updatedPlayer: PlayerState }
    }
    /** Indicates if this card grants a factory */
    isFactory?: boolean
  }
  /** Tracks the last player who owned this card (used for discard mechanics) */
  lastOwnerId?: number
}

// =========================================
// Action System
// =========================================

/**
 * Types of actions that can be performed in the game.
 * Each type has a specific implementation and effect.
 */
export type InnateActionType = 
  | "burn"        // Remove cards from the game to gain Victory Points
  | "draw"        // Draw additional cards
  | "swapCards"   // Exchange cards with another player
  | "discard"     // Discard cards to gain resources
  | "convert"     // Transform one resource type into another
  | "buildFactory"// Construct a resource-producing factory
  | "exchange"    // Trade resources or cards

/**
 * Represents the cost of performing an action.
 * Actions can cost resources, cards, or action points.
 */
export type ActionCost = {
  /** The type of cost required */
  type: "resource" | "card" | "factory" | "actionPoints"
  /** How many of the cost type are required */
  amount: number
  /** Specific resource type required (if type is "resource") */
  resourceType?: ResourceType
}

/**
 * Represents the benefit gained from an action.
 * Used for tracking what players gain from actions.
 */
export type ActionBenefit = {
  /** The type of benefit received */
  type: "resource" | "card" | "factory" | "victoryPoints"
  /** Specific resource type gained (if type is "resource") */
  resourceType?: ResourceType
  /** Amount of the benefit received */
  amount: number
}

/**
 * Defines an action that can be performed in the game.
 * Actions are available to all players and have various effects.
 */
export interface InnateAction {
  /** Unique identifier for the action */
  id: number
  /** The category of action */
  type: InnateActionType
  /** Display name of the action */
  name: string
  /** Description of what the action does */
  description: string
  /** What must be paid to perform the action */
  cost: ActionCost
  /** Function that implements the action's effect */
  effect: (player: PlayerState, gameState: GameState) => { 
    updatedPlayer: PlayerState
    updatedGameState: GameState 
  }
}

// =========================================
// Player and Game State
// =========================================

/**
 * Represents a player's current state in the game.
 * Tracks all resources, cards, and points owned by the player.
 */
export type PlayerState = {
  /** Unique identifier for the player */
  id: number
  /** Cards in the player's hand */
  hand: GameCard[]
  /** Cards the player has played */
  playedCards: GameCard[]
  /** Current resource quantities */
  resources: Resources
  /** Owned factories */
  factories: Factories
  /** Current victory points */
  victoryPoints: number
  /** Available action points this turn */
  actionPoints: number
  /** Points earned from achievements */
  achievementPoints: number
  /** Player's display color */
  color: string
}

/**
 * Represents the current state of the game.
 * Contains all information needed to render the game state.
 */
export type GameState = {
  /** Cards available to be drawn */
  cardPool: GameCard[]
  /** All players' states */
  players: PlayerState[]
  /** Index of the active player */
  currentPlayer: number
  /** Current round number */
  round: number
  /** Available actions */
  innateActions: InnateAction[]
  /** ID of winning player, null if game is ongoing */
  winner: number | null
  /** Achievement tracking */
  achievements: Achievement
}

// =========================================
// Achievement System
// =========================================

/**
 * Represents a completable project that awards points.
 * Projects can be claimed once their conditions are met.
 */
export type Project = {
  /** Unique identifier for the project */
  id: number
  /** Description of the project's requirements */
  description: string
  /** Function that checks if a player has completed the project */
  isCompleted: (player: PlayerState, gameState: GameState) => boolean
  /** Whether the project has been claimed */
  claimed: boolean
  /** ID of the player who claimed this project */
  claimedBy?: number
}

/**
 * Represents an award that can be sponsored and claimed.
 * Awards are given to players who best meet certain criteria.
 */
export type Award = {
  /** Unique identifier for the award */
  id: number
  /** Description of what the award is for */
  description: string
  /** Function that determines which player wins the award */
  evaluate: (players: PlayerState[]) => number
  /** Whether the award has been sponsored */
  sponsored: boolean
  /** ID of the player who sponsored this award */
  sponsoredBy?: number
}

/**
 * Tracks all achievements, projects, and awards in the game.
 * Part of the game's scoring system.
 */
export type Achievement = {
  /** Available projects */
  projects: Project[]
  /** Available awards */
  awards: Award[]
  /** Cost to sponsor an award */
  sponsorCost: {
    /** Type of cost required */
    type: "discard" | "resource" | "factory"
    /** Amount required */
    amount: number
    /** Specific resource type needed (if type is "resource") */
    resourceType?: ResourceType
  }
  /** Number of projects that have been claimed */
  claimedProjects: number
  /** Number of awards that have been sponsored */
  sponsoredAwards: number
}

// =========================================
// Game Configuration
// =========================================

/**
 * Configuration options for setting up a new game.
 * Defines the rules and parameters for the game session.
 */
export type GameConfig = {
  /** Number of different resource types in play */
  resourceTypes: number
  /** Number of players in the game */
  players: number
  /** Number of card suits (categories) */
  suits: number
  /** Total number of cards in the deck */
  totalCards: number
  /** Initial number of cards each player receives */
  startingHand: number
  /** Number of available actions */
  innateActionCount: number
  /** Action points given each turn */
  actionPointsPerTurn: number
  /** Cards drawn when using the draw action */
  drawCardCount: number
  /** Cards that must be discarded after drawing */
  discardCardCount: number
  /** Whether players can choose which cards to discard */
  discardChoice: boolean
}

