"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import type { GameCard, ResourceType } from "../types"
import { GameTooltip } from "./game-tooltip"

type CardProps = {
  card: GameCard
  onClick?: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  isAffordable?: boolean
  isDiscard?: boolean
}

const resourceNames: Record<ResourceType, string> = {
  wood: "Wood",
  brick: "Brick",
  stone: "Stone",
  wheat: "Wheat",
  sheep: "Sheep",
  iron: "Iron",
  gold: "Gold",
  gem: "Gem",
  fish: "Fish",
  oil: "Oil",
}

const suitColors = [
  "rgba(255, 0, 0, 0.2)", // Red
  "rgba(0, 255, 0, 0.2)", // Green
  "rgba(0, 0, 255, 0.2)", // Blue
  "rgba(255, 255, 0, 0.2)", // Yellow
  "rgba(255, 0, 255, 0.2)", // Magenta
  "rgba(0, 255, 255, 0.2)", // Cyan
]

export default function CardComponent({ card, onClick, onContextMenu, isAffordable, isDiscard }: CardProps) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    setAnimate(true)
    const timer = setTimeout(() => setAnimate(false), 300)
    return () => clearTimeout(timer)
  }, [isAffordable])

  const cardVariants = {
    normal: { scale: 1 },
    hover: { scale: 1.05 },
  }

  const borderColor = isAffordable ? "border-green-500" : "border-gray-300"
  const textColor = isAffordable ? "text-gray-900" : "text-gray-400"
  const tintColor = card.suit !== null ? suitColors[card.suit % suitColors.length] : "transparent"

  return (
    <GameTooltip
      content={`Suit: ${card.suit !== null ? card.suit : "N/A"}. Cards are played to gain resources, build factories, and score victory points.`}
    >
      <motion.div
        className={`relative ${isDiscard ? "z-10" : ""}`}
        variants={cardVariants}
        initial="normal"
        whileHover="hover"
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <Card
          className={`w-40 h-56 cursor-pointer transition-all duration-300 ease-in-out ${borderColor} ${textColor} ${
            isDiscard ? "bg-opacity-100" : "bg-opacity-90"
          }`}
          style={{ backgroundColor: tintColor }}
          onClick={onClick}
          onContextMenu={onContextMenu}
        >
          <CardHeader>
            <CardTitle className="text-sm font-bold">{card.name}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <p>Suit: {card.suit !== null ? card.suit : "N/A"}</p>
            <p>
              Cost:{" "}
              {Object.entries(card.cost)
                .map(([type, amount]) => `${amount} ${resourceNames[type as ResourceType]}`)
                .join(", ")}
            </p>
            <p>Reward:</p>
            <ul className="list-disc list-inside">
              {Object.entries(card.reward.resources).map(([type, amount]) => (
                <li key={type}>
                  {resourceNames[type as ResourceType]}: {amount}
                </li>
              ))}
              <li>VP: {card.reward.victoryPoints}</li>
            </ul>
          </CardContent>
        </Card>
        {animate && (
          <motion.div
            className="absolute inset-0 border-4 rounded-lg"
            initial={{ opacity: 0, scale: 1.2 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ borderColor: "green" }}
          />
        )}
      </motion.div>
    </GameTooltip>
  )
}

