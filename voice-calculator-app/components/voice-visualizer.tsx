"use client"

import { useEffect, useRef } from "react"

interface VoiceVisualizerProps {
  isListening: boolean
  audioLevel: number
}

export function VoiceVisualizer({
  isListening,
  audioLevel,
}: VoiceVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const phaseRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const width = rect.width
    const height = rect.height

    const draw = () => {
      ctx.clearRect(0, 0, width, height)

      const centerY = height / 2
      const bars = 48
      const barWidth = width / bars - 2
      const gap = 2

      phaseRef.current += 0.04

      for (let i = 0; i < bars; i++) {
        const x = i * (barWidth + gap)

        let barHeight: number
        if (isListening) {
          const wave = Math.sin(phaseRef.current + i * 0.3) * 0.5 + 0.5
          const noise = Math.random() * 0.2
          const level = Math.max(audioLevel, 0.05)
          barHeight = (wave * level + noise * level) * height * 0.8
          barHeight = Math.max(barHeight, 3)
        } else {
          const wave =
            Math.sin(phaseRef.current * 0.5 + i * 0.2) * 0.15 + 0.15
          barHeight = wave * height * 0.3
          barHeight = Math.max(barHeight, 2)
        }

        const gradient = ctx.createLinearGradient(
          x,
          centerY - barHeight / 2,
          x,
          centerY + barHeight / 2
        )

        if (isListening) {
          gradient.addColorStop(0, "rgba(0, 220, 130, 0.9)")
          gradient.addColorStop(0.5, "rgba(0, 220, 130, 0.6)")
          gradient.addColorStop(1, "rgba(0, 180, 200, 0.3)")
        } else {
          gradient.addColorStop(0, "rgba(100, 160, 200, 0.4)")
          gradient.addColorStop(1, "rgba(100, 160, 200, 0.1)")
        }

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.roundRect(
          x,
          centerY - barHeight / 2,
          barWidth,
          barHeight,
          barWidth / 2
        )
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [isListening, audioLevel])

  return (
    <canvas
      ref={canvasRef}
      className="h-20 w-full"
      style={{ display: "block" }}
    />
  )
}
