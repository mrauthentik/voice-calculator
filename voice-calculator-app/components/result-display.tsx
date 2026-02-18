"use client"

import type { CalculationResult } from "@/lib/calculator-engine"
import { Ruler, Calculator, ArrowRightLeft, Shapes } from "lucide-react"

const categoryConfig = {
  arithmetic: {
    label: "Arithmetic",
    icon: Calculator,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
  },
  scientific: {
    label: "Scientific",
    icon: Shapes,
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/20",
  },
  conversion: {
    label: "Conversion",
    icon: ArrowRightLeft,
    color: "text-chart-3",
    bg: "bg-chart-3/10",
    border: "border-chart-3/20",
  },
  measurement: {
    label: "Measurement",
    icon: Ruler,
    color: "text-chart-5",
    bg: "bg-chart-5/10",
    border: "border-chart-5/20",
  },
}

interface ResultDisplayProps {
  result: CalculationResult
  index: number
}

export function ResultDisplay({ result, index }: ResultDisplayProps) {
  const config = categoryConfig[result.category]
  const Icon = config.icon

  return (
    <div
      className={`animate-in fade-in slide-in-from-bottom-2 rounded-xl border ${config.border} ${config.bg} p-4 transition-all duration-300`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">
            {result.input}
          </p>
          {result.parsed && (
            <p className="mt-1 font-mono text-xs text-muted-foreground/70">
              {result.parsed}
            </p>
          )}
          {result.error ? (
            <p className="mt-2 text-sm text-destructive">{result.error}</p>
          ) : (
            <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              {result.result}
            </p>
          )}
        </div>
        <div
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 ${config.bg} ${config.color}`}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{config.label}</span>
        </div>
      </div>
    </div>
  )
}
