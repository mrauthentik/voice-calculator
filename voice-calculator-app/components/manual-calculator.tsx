"use client"

import React, { useEffect, useRef, useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calculator } from "lucide-react"
import { processVoiceInput, type CalculationResult } from "@/lib/calculator-engine"

type Props = {
  onAdd?: (r: CalculationResult) => void
}

function extractNumeric(resultStr?: string): number | null {
  if (!resultStr) return null
  const m = resultStr.match(/-?\d+(?:[.,]\d+)?/)
  if (!m) return null
  return parseFloat(m[0].replace(',', '.'))
}

export function ManualCalculator({ onAdd }: Props) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [lastResult, setLastResult] = useState<CalculationResult | null>(null)
  const [history, setHistory] = useState<CalculationResult[]>([])
  const [memory, setMemory] = useState<number | null>(null)
  const keypadRef = useRef<HTMLDivElement | null>(null)
  const HISTORY_LIMIT = 50

  // Load persisted memory/history
  useEffect(() => {
    try {
      const m = localStorage.getItem("manualCalculator_memory")
      if (m !== null) setMemory(Number(m))
      const h = localStorage.getItem("manualCalculator_history")
      if (h) setHistory(JSON.parse(h))
    } catch {
      // ignore
    }
  }, [])

  // Persist memory
  useEffect(() => {
    try {
      if (memory == null) localStorage.removeItem("manualCalculator_memory")
      else localStorage.setItem("manualCalculator_memory", String(memory))
    } catch {}
  }, [memory])

  // Persist history
  useEffect(() => {
    try {
      if (history.length === 0) localStorage.removeItem("manualCalculator_history")
      else localStorage.setItem("manualCalculator_history", JSON.stringify(history))
    } catch {}
  }, [history])

  const handleCalculate = () => {
    if (!value.trim()) return
    const res = processVoiceInput(value)
    setLastResult(res)
    setHistory((h) => {
      const next = [res, ...h]
      return next.slice(0, HISTORY_LIMIT)
    })
    if (onAdd) onAdd(res)
    // keep dialog open (user requested behavior)
    // populate input with result number if available for quick chaining
    const num = extractNumeric(res.result)
    if (num !== null) setValue(String(num))
    else setValue("")
  }

  const append = (s: string) => setValue((v) => v + s)
  const backspace = () => setValue((v) => v.slice(0, -1))
  const clear = () => setValue("")

  // Keyboard navigation within keypad (arrow keys)
  const handleKeypadNav = (e: React.KeyboardEvent) => {
    const node = keypadRef.current
    if (!node) return
    const buttons = Array.from(node.querySelectorAll<HTMLButtonElement>('button[data-keypad]'))
    if (buttons.length === 0) return

    const cols = 4
    const active = document.activeElement as HTMLElement | null
    let idx = buttons.indexOf(active as HTMLButtonElement)
    if (idx === -1) {
      // focus first on any arrow press
      if (e.key.startsWith('Arrow')) {
        buttons[0].focus()
        e.preventDefault()
      }
      return
    }

    let next = idx
    if (e.key === 'ArrowLeft') next = Math.max(0, idx - 1)
    else if (e.key === 'ArrowRight') next = Math.min(buttons.length - 1, idx + 1)
    else if (e.key === 'ArrowUp') next = Math.max(0, idx - cols)
    else if (e.key === 'ArrowDown') next = Math.min(buttons.length - 1, idx + cols)
    if (next !== idx) {
      buttons[next].focus()
      e.preventDefault()
    }
  }

  // Memory controls
  const memoryAdd = () => {
    const num = extractNumeric(lastResult?.result) ?? extractNumeric(value)
    if (num == null) return
    setMemory((m) => (m == null ? num : m + num))
  }
  const memorySubtract = () => {
    const num = extractNumeric(lastResult?.result) ?? extractNumeric(value)
    if (num == null) return
    setMemory((m) => (m == null ? -num : m - num))
  }
  const memoryRecall = () => {
    if (memory == null) return
    setValue(String(memory))
  }
  const memoryClear = () => setMemory(null)
  const clearHistory = () => {
    setHistory([])
    try {
      localStorage.removeItem("manualCalculator_history")
    } catch {}
  }

  const useHistoryItem = (r: CalculationResult) => {
    setValue(r.result || r.input)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open manual calculator">
          <Calculator className="h-4 w-4" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manual Calculator</DialogTitle>
          <DialogDescription>Use the keypad, memory, or enter an expression. Dialog stays open after calculate.</DialogDescription>
        </DialogHeader>

        <div className="mt-3 grid grid-cols-1 gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                placeholder="e.g. 25 + 17 or convert 5 miles to km"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleCalculate()
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={memoryRecall}>MR</Button>
                <Button size="icon" variant="ghost" onClick={memoryClear}>MC</Button>
              </div>
              <div className="flex gap-2">
                <Button size="icon" variant="ghost" onClick={memoryAdd}>M+</Button>
                <Button size="icon" variant="ghost" onClick={memorySubtract}>M-</Button>
              </div>
            </div>
          </div>

          {lastResult && (
            <div className="rounded-md border bg-card p-3 text-sm">
              <div className="mb-1 text-xs text-muted-foreground">Parsed</div>
              <div className="mb-2 font-medium text-foreground">{lastResult.parsed || lastResult.input}</div>
              <div className="text-sm text-muted-foreground">Result: <span className="font-semibold text-foreground">{lastResult.result || lastResult.error}</span></div>
            </div>
          )}

          <div ref={keypadRef} tabIndex={0} onKeyDown={handleKeypadNav} className="grid grid-cols-4 gap-2">
            {[
              ["7", "8", "9", "/"],
              ["4", "5", "6", "*"],
              ["1", "2", "3", "-"],
              ["0", ".", "%", "+"],
            ].map((row, rIdx) => (
              <React.Fragment key={rIdx}>
                {row.map((label) => (
                  <Button
                    key={label}
                    data-keypad
                    aria-label={`Key ${label}`}
                    onClick={() => append(label)}
                    className="active:scale-95 transition-transform hover:scale-105"
                  >
                    {label}
                  </Button>
                ))}
              </React.Fragment>
            ))}

            <Button data-keypad aria-label="Clear input" onClick={clear} variant="ghost" className="active:scale-95 transition-transform">C</Button>
            <Button data-keypad aria-label="Backspace" onClick={backspace} variant="ghost" className="active:scale-95 transition-transform">⌫</Button>
            <Button data-keypad aria-label="Open parenthesis" onClick={() => append("(")} variant="ghost" className="active:scale-95 transition-transform">(</Button>
            <Button data-keypad aria-label="Close parenthesis" onClick={() => append(")")} variant="ghost" className="active:scale-95 transition-transform">)</Button>

            <div className="col-span-2">
              <Button className="w-full" onClick={() => append(" ** ")}>^</Button>
            </div>
            <div className="col-span-2">
              <Button className="w-full" onClick={handleCalculate}>
                =
              </Button>
            </div>
          </div>

          <div className="mt-2 flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <div className="mb-1 text-xs text-muted-foreground">Memory</div>
              <div className="rounded-md border bg-card p-2 text-sm">{memory ?? "—"}</div>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-muted-foreground">History</div>
                <Button size="sm" variant="ghost" onClick={clearHistory} aria-label="Clear history">Clear</Button>
              </div>
              <div className="max-h-40 overflow-auto rounded-md border bg-card p-2 text-sm">
                {history.length === 0 ? (
                  <div className="text-xs text-muted-foreground">No history yet</div>
                ) : (
                  history.map((h, i) => (
                    <button
                      key={`${h.input}-${i}`}
                      role="button"
                      aria-label={`Use history item ${i + 1}`}
                      tabIndex={0}
                      className="mb-2 w-full text-left text-sm hover:underline animate-in slide-in-from-left-2"
                      onClick={() => useHistoryItem(h)}
                    >
                      <div className="font-medium text-foreground">{h.result || h.error}</div>
                      <div className="text-xs text-muted-foreground">{h.parsed || h.input}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <div className="flex w-full gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            <div className="ml-auto" />
            <Button onClick={handleCalculate}>Calculate</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ManualCalculator
