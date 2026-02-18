"use client"

import { getExampleCommands } from "@/lib/calculator-engine"
import {
  Calculator,
  Shapes,
  ArrowRightLeft,
  Ruler,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

const categoryIcons: Record<string, LucideIcon> = {
  Arithmetic: Calculator,
  Scientific: Shapes,
  Conversions: ArrowRightLeft,
  Measurements: Ruler,
}

const categoryColors: Record<string, string> = {
  Arithmetic: "text-primary border-primary/20",
  Scientific: "text-accent border-accent/20",
  Conversions: "text-chart-3 border-chart-3/20",
  Measurements: "text-chart-5 border-chart-5/20",
}

export function ExampleCommands() {
  const commands = getExampleCommands()

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {commands.map((group) => {
        const Icon = categoryIcons[group.category] || Calculator
        const colorClass =
          categoryColors[group.category] || "text-primary border-primary/20"

        return (
          <div
            key={group.category}
            className={`rounded-xl border ${colorClass.split(" ").slice(1).join(" ")} bg-card/50 p-4`}
          >
            <div className="mb-3 flex items-center gap-2">
              <Icon
                className={`h-4 w-4 ${colorClass.split(" ")[0]}`}
              />
              <h3
                className={`text-sm font-semibold ${colorClass.split(" ")[0]}`}
              >
                {group.category}
              </h3>
            </div>
            <ul className="space-y-1.5">
              {group.examples.map((example) => (
                <li
                  key={example}
                  className="text-xs leading-relaxed text-muted-foreground"
                >
                  {`"${example}"`}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
