"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useVoiceRecognition } from "@/hooks/use-voice-recognition"
import {
  processVoiceInput,
  type CalculationResult,
} from "@/lib/calculator-engine"
import { VoiceVisualizer } from "@/components/voice-visualizer"
import { ResultDisplay } from "@/components/result-display"
import { ExampleCommands } from "@/components/example-commands"
import { Button } from "@/components/ui/button"
import {
  Mic,
  MicOff,
  Trash2,
  ChevronDown,
  ChevronUp,
  Volume2,
  Calculator,
} from "lucide-react"
import { ManualCalculator } from "./manual-calculator"

export function VoiceCalculator() {
  const {
    transcript,
    isListening,
    isSupported,
    error: voiceError,
    startListening,
    stopListening,
    audioLevel,
  } = useVoiceRecognition()

  const [results, setResults] = useState<CalculationResult[]>([])
  const [currentTranscript, setCurrentTranscript] = useState("")
  const [showExamples, setShowExamples] = useState(false)
  const [lastProcessedTranscript, setLastProcessedTranscript] = useState("")
  const resultsEndRef = useRef<HTMLDivElement>(null)

  // Process voice input when transcript changes and listening stops
  useEffect(() => {
    setCurrentTranscript(transcript)
  }, [transcript])

  useEffect(() => {
    if (
      !isListening &&
      currentTranscript &&
      currentTranscript !== lastProcessedTranscript
    ) {
      const result = processVoiceInput(currentTranscript)
      setResults((prev) => [result, ...prev])
      setLastProcessedTranscript(currentTranscript)
      setCurrentTranscript("")
    }
  }, [isListening, currentTranscript, lastProcessedTranscript])

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  const handleClearHistory = useCallback(() => {
    setResults([])
    setCurrentTranscript("")
    setLastProcessedTranscript("")
  }, [])

  // Keyboard shortcut - hold space to talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !isListening &&
        e.target === document.body
      ) {
        e.preventDefault()
        startListening()
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && isListening && e.target === document.body) {
        e.preventDefault()
        stopListening()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [isListening, startListening, stopListening])

  if (!isSupported) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <MicOff className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 text-xl font-bold text-foreground">
            Voice Recognition Not Supported
          </h2>
          <p className="text-sm text-muted-foreground">
            Your browser does not support the Web Speech API. Please use Chrome,
            Edge, or Safari for voice recognition features.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6">
      {/* Header */}
      <header className="mb-6">
        <div className="mb-2 relative">
          <div className="flex items-center justify-center gap-2">
            <Volume2 className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Voice Calculator
            </h1>
          </div>
          <div className="absolute right-0 top-0">
            <ManualCalculator onAdd={(r) => setResults((prev) => [r, ...prev])} />
          </div>
        </div>
        <p className="text-center text-sm text-muted-foreground">
          Speak to calculate. Hold{" "}
          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
            Space
          </kbd>{" "}
          or tap the mic button.
        </p>
      </header>

      {/* Voice Input Area */}
      <div className="mb-6">
        <div
          className={`relative overflow-hidden rounded-2xl border transition-all duration-500 ${
            isListening
              ? "border-primary/50 bg-primary/5 shadow-lg shadow-primary/10"
              : "border-border bg-card"
          }`}
        >
          {/* Visualizer */}
          <div className="px-4 pt-4">
            <VoiceVisualizer
              isListening={isListening}
              audioLevel={audioLevel}
            />
          </div>

          {/* Transcript Display */}
          <div className="px-4 pb-2">
            <div className="flex min-h-[2.5rem] items-center justify-center">
              {isListening && currentTranscript ? (
                <p className="text-center text-lg font-medium text-foreground animate-in fade-in">
                  {currentTranscript}
                </p>
              ) : isListening ? (
                <p className="text-center text-sm text-muted-foreground animate-pulse">
                  Listening...
                </p>
              ) : (
                <p className="text-center text-sm text-muted-foreground">
                  Tap to start speaking
                </p>
              )}
            </div>
          </div>

          {/* Mic Button */}
          <div className="flex items-center justify-center pb-5 pt-1">
            <button
              onClick={handleToggleListening}
              className={`group relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 ${
                isListening
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              aria-label={isListening ? "Stop listening" : "Start listening"}
            >
              {/* Pulsing ring when active */}
              {isListening && (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
                  <span className="absolute -inset-1 animate-pulse rounded-full border-2 border-primary/40" />
                </>
              )}
              {isListening ? (
                <MicOff className="relative z-10 h-6 w-6" />
              ) : (
                <Mic className="relative z-10 h-6 w-6 transition-transform group-hover:scale-110" />
              )}
            </button>
          </div>

          {/* Error */}
          {voiceError && (
            <div className="border-t border-destructive/20 bg-destructive/5 px-4 py-2">
              <p className="text-center text-xs text-destructive">
                {voiceError === "not-allowed"
                  ? "Microphone access denied. Please enable it in your browser settings."
                  : `Error: ${voiceError}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Examples Toggle */}
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowExamples(!showExamples)}
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <span className="text-xs">Example voice commands</span>
          {showExamples ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        {showExamples && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2">
            <ExampleCommands />
          </div>
        )}
      </div>

      {/* Results History */}
      <div className="flex-1">
        {results.length > 0 && (
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              History
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({results.length}{" "}
                {results.length === 1 ? "calculation" : "calculations"})
              </span>
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearHistory}
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {results.map((result, index) => (
            <ResultDisplay
              key={`${result.input}-${index}`}
              result={result}
              index={index}
            />
          ))}
        </div>

        {results.length === 0 && !showExamples && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-sm font-medium text-foreground">
              No calculations yet
            </h3>
            <p className="max-w-xs text-xs text-muted-foreground">
              Start speaking to perform calculations. Try saying{" "}
              {'"what is 25 plus 17"'} or{" "}
              {'"convert 5 miles to kilometers"'}
            </p>
          </div>
        )}

        <div ref={resultsEndRef} />
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-border pt-4 text-center">
        <p className="text-xs text-muted-foreground">
          Supports arithmetic, scientific, unit conversions, and geometric
          measurements
        </p>
      </footer>
    </div>
  )
}


