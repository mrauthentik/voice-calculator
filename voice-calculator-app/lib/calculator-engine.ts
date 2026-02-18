// ============================================================
// Voice Calculator Engine
// Parses natural language into math operations and evaluates
// ============================================================

export interface CalculationResult {
  input: string
  parsed: string
  result: string
  category: "arithmetic" | "scientific" | "conversion" | "measurement"
  error?: string
}

// ---- Unit conversion tables ----

const lengthConversions: Record<string, number> = {
  meter: 1,
  meters: 1,
  metre: 1,
  metres: 1,
  m: 1,
  kilometer: 1000,
  kilometers: 1000,
  kilometre: 1000,
  kilometres: 1000,
  km: 1000,
  centimeter: 0.01,
  centimeters: 0.01,
  centimetre: 0.01,
  centimetres: 0.01,
  cm: 0.01,
  millimeter: 0.001,
  millimeters: 0.001,
  millimetre: 0.001,
  millimetres: 0.001,
  mm: 0.001,
  mile: 1609.344,
  miles: 1609.344,
  yard: 0.9144,
  yards: 0.9144,
  foot: 0.3048,
  feet: 0.3048,
  inch: 0.0254,
  inches: 0.0254,
}

const weightConversions: Record<string, number> = {
  kilogram: 1,
  kilograms: 1,
  kg: 1,
  gram: 0.001,
  grams: 0.001,
  g: 0.001,
  milligram: 0.000001,
  milligrams: 0.000001,
  mg: 0.000001,
  pound: 0.453592,
  pounds: 0.453592,
  lb: 0.453592,
  lbs: 0.453592,
  ounce: 0.0283495,
  ounces: 0.0283495,
  oz: 0.0283495,
  ton: 907.185,
  tons: 907.185,
  tonne: 1000,
  tonnes: 1000,
  "metric ton": 1000,
  "metric tons": 1000,
  stone: 6.35029,
  stones: 6.35029,
}

const volumeConversions: Record<string, number> = {
  liter: 1,
  liters: 1,
  litre: 1,
  litres: 1,
  l: 1,
  milliliter: 0.001,
  milliliters: 0.001,
  millilitre: 0.001,
  millilitres: 0.001,
  ml: 0.001,
  gallon: 3.78541,
  gallons: 3.78541,
  quart: 0.946353,
  quarts: 0.946353,
  pint: 0.473176,
  pints: 0.473176,
  cup: 0.236588,
  cups: 0.236588,
  "fluid ounce": 0.0295735,
  "fluid ounces": 0.0295735,
  tablespoon: 0.0147868,
  tablespoons: 0.0147868,
  teaspoon: 0.00492892,
  teaspoons: 0.00492892,
}

const speedConversions: Record<string, number> = {
  "meter per second": 1,
  "meters per second": 1,
  "m/s": 1,
  "kilometer per hour": 0.277778,
  "kilometers per hour": 0.277778,
  "km/h": 0.277778,
  kph: 0.277778,
  "mile per hour": 0.44704,
  "miles per hour": 0.44704,
  mph: 0.44704,
  knot: 0.514444,
  knots: 0.514444,
}

const areaConversions: Record<string, number> = {
  "square meter": 1,
  "square meters": 1,
  "square metre": 1,
  "square metres": 1,
  sqm: 1,
  "square kilometer": 1000000,
  "square kilometers": 1000000,
  sqkm: 1000000,
  "square foot": 0.092903,
  "square feet": 0.092903,
  sqft: 0.092903,
  "square mile": 2590000,
  "square miles": 2590000,
  acre: 4046.86,
  acres: 4046.86,
  hectare: 10000,
  hectares: 10000,
}

const temperatureUnits = [
  "celsius",
  "fahrenheit",
  "kelvin",
  "c",
  "f",
  "k",
  "degrees celsius",
  "degrees fahrenheit",
  "degrees kelvin",
]

const allConversionTables: { name: string; table: Record<string, number> }[] = [
  { name: "length", table: lengthConversions },
  { name: "weight", table: weightConversions },
  { name: "volume", table: volumeConversions },
  { name: "speed", table: speedConversions },
  { name: "area", table: areaConversions },
]

// ---- Number word parsing ----

const numberWords: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  thousand: 1000,
  million: 1000000,
  billion: 1000000000,
}

function parseNumberWords(text: string): string {
  let result = text
  // Replace compound number words like "twenty three" -> "23"
  const compoundPattern =
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)\s+(one|two|three|four|five|six|seven|eight|nine)\b/gi
  result = result.replace(compoundPattern, (_, tens, ones) => {
    return String((numberWords[tens.toLowerCase()] || 0) + (numberWords[ones.toLowerCase()] || 0))
  })

  // Replace individual number words
  for (const [word, num] of Object.entries(numberWords)) {
    const regex = new RegExp(`\\b${word}\\b`, "gi")
    result = result.replace(regex, String(num))
  }

  return result
}

// ---- Temperature conversion ----

function normalizeTemperatureUnit(unit: string): string {
  const u = unit.toLowerCase().trim()
  if (u === "c" || u === "celsius" || u === "degrees celsius") return "celsius"
  if (u === "f" || u === "fahrenheit" || u === "degrees fahrenheit") return "fahrenheit"
  if (u === "k" || u === "kelvin" || u === "degrees kelvin") return "kelvin"
  return u
}

function convertTemperature(
  value: number,
  from: string,
  to: string
): number | null {
  const f = normalizeTemperatureUnit(from)
  const t = normalizeTemperatureUnit(to)

  if (f === t) return value

  // Convert to celsius first
  let celsius: number
  if (f === "celsius") celsius = value
  else if (f === "fahrenheit") celsius = (value - 32) * (5 / 9)
  else if (f === "kelvin") celsius = value - 273.15
  else return null

  // Convert from celsius to target
  if (t === "celsius") return celsius
  if (t === "fahrenheit") return celsius * (9 / 5) + 32
  if (t === "kelvin") return celsius + 273.15
  return null
}

// ---- Main parsing functions ----

function tryConversion(input: string): CalculationResult | null {
  const lower = input.toLowerCase().trim()

  // Temperature conversion
  const tempPattern =
    /(?:convert\s+)?(-?[\d.]+)\s*(degrees?\s*)?(?:celsius|fahrenheit|kelvin|c|f|k)\s+(?:to|in|into)\s+(degrees?\s*)?(?:celsius|fahrenheit|kelvin|c|f|k)/i
  const tempMatch = lower.match(tempPattern)
  if (tempMatch) {
    const value = parseFloat(tempMatch[1])
    // Extract units from the full match
    const fromUnit =
      lower
        .match(
          /(-?[\d.]+)\s*(degrees?\s*)?(celsius|fahrenheit|kelvin|c|f|k)/i
        )?.[3] || ""
    const toUnit =
      lower
        .match(
          /(?:to|in|into)\s+(degrees?\s*)?(celsius|fahrenheit|kelvin|c|f|k)/i
        )?.[2] || ""

    const result = convertTemperature(value, fromUnit, toUnit)
    if (result !== null) {
      return {
        input,
        parsed: `${value} ${normalizeTemperatureUnit(fromUnit)} to ${normalizeTemperatureUnit(toUnit)}`,
        result: `${formatNumber(result)} ${normalizeTemperatureUnit(toUnit)}`,
        category: "conversion",
      }
    }
  }

  // General unit conversion: "convert X unit to unit" or "X unit to unit" or "X unit in unit"
  for (const { table } of allConversionTables) {
    const unitNames = Object.keys(table).sort((a, b) => b.length - a.length)
    for (const fromUnit of unitNames) {
      for (const toUnit of unitNames) {
        if (fromUnit === toUnit) continue
        const patterns = [
          new RegExp(
            `(?:convert\\s+)?([-\\d.]+)\\s*${escapeRegex(fromUnit)}\\s+(?:to|in|into)\\s+${escapeRegex(toUnit)}`,
            "i"
          ),
          new RegExp(
            `(?:what\\s+is\\s+|what's\\s+)?([-\\d.]+)\\s*${escapeRegex(fromUnit)}\\s+in\\s+${escapeRegex(toUnit)}`,
            "i"
          ),
          new RegExp(
            `(?:how\\s+many\\s+)${escapeRegex(toUnit)}\\s+(?:in|are\\s+in)\\s+([-\\d.]+)\\s*${escapeRegex(fromUnit)}`,
            "i"
          ),
        ]

        for (const pattern of patterns) {
          const match = lower.match(pattern)
          if (match) {
            const value = parseFloat(match[1])
            const fromFactor = table[fromUnit]
            const toFactor = table[toUnit]
            const result = (value * fromFactor) / toFactor

            return {
              input,
              parsed: `${value} ${fromUnit} to ${toUnit}`,
              result: `${formatNumber(result)} ${toUnit}`,
              category: "conversion",
            }
          }
        }
      }
    }
  }

  return null
}

function tryScientific(input: string): CalculationResult | null {
  const lower = input.toLowerCase().trim()

  // Square root
  const sqrtPatterns = [
    /(?:square\s+root\s+of|sqrt\s+of?|sqrt)\s+([\d.]+)/i,
    /(?:what\s+is\s+the\s+)?square\s+root\s+of\s+([\d.]+)/i,
  ]
  for (const pattern of sqrtPatterns) {
    const match = lower.match(pattern)
    if (match) {
      const num = parseFloat(match[1])
      return {
        input,
        parsed: `sqrt(${num})`,
        result: formatNumber(Math.sqrt(num)),
        category: "scientific",
      }
    }
  }

  // Cube root
  const cubeRootMatch = lower.match(
    /(?:cube\s+root\s+of|cbrt)\s+([\d.]+)/i
  )
  if (cubeRootMatch) {
    const num = parseFloat(cubeRootMatch[1])
    return {
      input,
      parsed: `cbrt(${num})`,
      result: formatNumber(Math.cbrt(num)),
      category: "scientific",
    }
  }

  // Power / exponent
  const powerPatterns = [
    /([\d.]+)\s+(?:to\s+the\s+power\s+of|raised\s+to|power)\s+([\d.]+)/i,
    /([\d.]+)\s+(?:squared|square)/i,
    /([\d.]+)\s+cubed/i,
  ]
  const powerMatch = lower.match(powerPatterns[0])
  if (powerMatch) {
    const base = parseFloat(powerMatch[1])
    const exp = parseFloat(powerMatch[2])
    return {
      input,
      parsed: `${base}^${exp}`,
      result: formatNumber(Math.pow(base, exp)),
      category: "scientific",
    }
  }
  const squaredMatch = lower.match(powerPatterns[1])
  if (squaredMatch) {
    const base = parseFloat(squaredMatch[1])
    return {
      input,
      parsed: `${base}^2`,
      result: formatNumber(Math.pow(base, 2)),
      category: "scientific",
    }
  }
  const cubedMatch = lower.match(powerPatterns[2])
  if (cubedMatch) {
    const base = parseFloat(cubedMatch[1])
    return {
      input,
      parsed: `${base}^3`,
      result: formatNumber(Math.pow(base, 3)),
      category: "scientific",
    }
  }

  // Logarithm
  const logPatterns = [
    /(?:log\s+of|log|logarithm\s+of|logarithm)\s+([\d.]+)/i,
    /(?:natural\s+log\s+of|ln\s+of?|ln)\s+([\d.]+)/i,
    /(?:log\s+base)\s+([\d.]+)\s+(?:of)\s+([\d.]+)/i,
  ]
  const logBaseMatch = lower.match(logPatterns[2])
  if (logBaseMatch) {
    const base = parseFloat(logBaseMatch[1])
    const num = parseFloat(logBaseMatch[2])
    return {
      input,
      parsed: `log_${base}(${num})`,
      result: formatNumber(Math.log(num) / Math.log(base)),
      category: "scientific",
    }
  }
  const lnMatch = lower.match(logPatterns[1])
  if (lnMatch) {
    const num = parseFloat(lnMatch[1])
    return {
      input,
      parsed: `ln(${num})`,
      result: formatNumber(Math.log(num)),
      category: "scientific",
    }
  }
  const log10Match = lower.match(logPatterns[0])
  if (log10Match) {
    const num = parseFloat(log10Match[1])
    return {
      input,
      parsed: `log(${num})`,
      result: formatNumber(Math.log10(num)),
      category: "scientific",
    }
  }

  // Trigonometric
  const trigPatterns = [
    /(?:sine|sin)\s+(?:of\s+)?([\d.]+)\s*(?:degrees|deg)?/i,
    /(?:cosine|cos)\s+(?:of\s+)?([\d.]+)\s*(?:degrees|deg)?/i,
    /(?:tangent|tan)\s+(?:of\s+)?([\d.]+)\s*(?:degrees|deg)?/i,
  ]
  const sinMatch = lower.match(trigPatterns[0])
  if (sinMatch) {
    const deg = parseFloat(sinMatch[1])
    const rad = (deg * Math.PI) / 180
    return {
      input,
      parsed: `sin(${deg}deg)`,
      result: formatNumber(Math.sin(rad)),
      category: "scientific",
    }
  }
  const cosMatch = lower.match(trigPatterns[1])
  if (cosMatch) {
    const deg = parseFloat(cosMatch[1])
    const rad = (deg * Math.PI) / 180
    return {
      input,
      parsed: `cos(${deg}deg)`,
      result: formatNumber(Math.cos(rad)),
      category: "scientific",
    }
  }
  const tanMatch = lower.match(trigPatterns[2])
  if (tanMatch) {
    const deg = parseFloat(tanMatch[1])
    const rad = (deg * Math.PI) / 180
    return {
      input,
      parsed: `tan(${deg}deg)`,
      result: formatNumber(Math.tan(rad)),
      category: "scientific",
    }
  }

  // Factorial
  const factorialMatch = lower.match(
    /(?:factorial\s+of|factorial)\s+([\d]+)/i
  )
  if (factorialMatch) {
    const n = parseInt(factorialMatch[1])
    if (n > 170) {
      return {
        input,
        parsed: `${n}!`,
        result: "Infinity",
        category: "scientific",
      }
    }
    let result = 1
    for (let i = 2; i <= n; i++) result *= i
    return {
      input,
      parsed: `${n}!`,
      result: formatNumber(result),
      category: "scientific",
    }
  }

  // Pi
  if (/\bpi\b/i.test(lower) && !/\bplus\b|\bminus\b|\btimes\b|\bdivided\b/i.test(lower)) {
    return {
      input,
      parsed: "pi",
      result: formatNumber(Math.PI),
      category: "scientific",
    }
  }

  // Absolute value
  const absMatch = lower.match(
    /(?:absolute\s+value\s+of|abs)\s+(-?[\d.]+)/i
  )
  if (absMatch) {
    const num = parseFloat(absMatch[1])
    return {
      input,
      parsed: `|${num}|`,
      result: formatNumber(Math.abs(num)),
      category: "scientific",
    }
  }

  // Percentage
  const percentOfMatch = lower.match(
    /(?:what\s+is\s+)?([\d.]+)\s*(?:percent|%)\s+of\s+([\d.]+)/i
  )
  if (percentOfMatch) {
    const pct = parseFloat(percentOfMatch[1])
    const num = parseFloat(percentOfMatch[2])
    return {
      input,
      parsed: `${pct}% of ${num}`,
      result: formatNumber((pct / 100) * num),
      category: "scientific",
    }
  }

  return null
}

function tryMeasurement(input: string): CalculationResult | null {
  const lower = input.toLowerCase().trim()

  // Area of a circle
  const circleAreaMatch = lower.match(
    /(?:area\s+of\s+(?:a\s+)?circle\s+(?:with\s+)?(?:radius|r)\s+)([\d.]+)/i
  )
  if (circleAreaMatch) {
    const r = parseFloat(circleAreaMatch[1])
    return {
      input,
      parsed: `pi * ${r}^2`,
      result: `${formatNumber(Math.PI * r * r)} sq units`,
      category: "measurement",
    }
  }

  // Circumference
  const circumferenceMatch = lower.match(
    /(?:circumference\s+of\s+(?:a\s+)?circle\s+(?:with\s+)?(?:radius|r)\s+)([\d.]+)/i
  )
  if (circumferenceMatch) {
    const r = parseFloat(circumferenceMatch[1])
    return {
      input,
      parsed: `2 * pi * ${r}`,
      result: `${formatNumber(2 * Math.PI * r)} units`,
      category: "measurement",
    }
  }

  // Area of a rectangle
  const rectAreaMatch = lower.match(
    /(?:area\s+of\s+(?:a\s+)?rectangle)\s+([\d.]+)\s+(?:by|x|times)\s+([\d.]+)/i
  )
  if (rectAreaMatch) {
    const l = parseFloat(rectAreaMatch[1])
    const w = parseFloat(rectAreaMatch[2])
    return {
      input,
      parsed: `${l} x ${w}`,
      result: `${formatNumber(l * w)} sq units`,
      category: "measurement",
    }
  }

  // Area of a triangle
  const triAreaMatch = lower.match(
    /(?:area\s+of\s+(?:a\s+)?triangle)\s+(?:(?:with\s+)?base\s+)?([\d.]+)\s+(?:(?:and\s+)?height\s+|(?:by|x)\s+)([\d.]+)/i
  )
  if (triAreaMatch) {
    const b = parseFloat(triAreaMatch[1])
    const h = parseFloat(triAreaMatch[2])
    return {
      input,
      parsed: `0.5 * ${b} * ${h}`,
      result: `${formatNumber(0.5 * b * h)} sq units`,
      category: "measurement",
    }
  }

  // Volume of a sphere
  const sphereVolMatch = lower.match(
    /(?:volume\s+of\s+(?:a\s+)?sphere\s+(?:with\s+)?(?:radius|r)\s+)([\d.]+)/i
  )
  if (sphereVolMatch) {
    const r = parseFloat(sphereVolMatch[1])
    return {
      input,
      parsed: `(4/3) * pi * ${r}^3`,
      result: `${formatNumber((4 / 3) * Math.PI * Math.pow(r, 3))} cubic units`,
      category: "measurement",
    }
  }

  // Volume of a cylinder
  const cylVolMatch = lower.match(
    /(?:volume\s+of\s+(?:a\s+)?cylinder)\s+(?:(?:with\s+)?radius\s+)?([\d.]+)\s+(?:(?:and\s+)?height\s+|(?:by|x)\s+)([\d.]+)/i
  )
  if (cylVolMatch) {
    const r = parseFloat(cylVolMatch[1])
    const h = parseFloat(cylVolMatch[2])
    return {
      input,
      parsed: `pi * ${r}^2 * ${h}`,
      result: `${formatNumber(Math.PI * r * r * h)} cubic units`,
      category: "measurement",
    }
  }

  // Perimeter of a rectangle
  const rectPerimMatch = lower.match(
    /(?:perimeter\s+of\s+(?:a\s+)?rectangle)\s+([\d.]+)\s+(?:by|x|times)\s+([\d.]+)/i
  )
  if (rectPerimMatch) {
    const l = parseFloat(rectPerimMatch[1])
    const w = parseFloat(rectPerimMatch[2])
    return {
      input,
      parsed: `2 * (${l} + ${w})`,
      result: `${formatNumber(2 * (l + w))} units`,
      category: "measurement",
    }
  }

  // Hypotenuse
  const hypotMatch = lower.match(
    /(?:hypotenuse|hyp)\s+([\d.]+)\s+(?:and|by)\s+([\d.]+)/i
  )
  if (hypotMatch) {
    const a = parseFloat(hypotMatch[1])
    const b = parseFloat(hypotMatch[2])
    return {
      input,
      parsed: `sqrt(${a}^2 + ${b}^2)`,
      result: `${formatNumber(Math.sqrt(a * a + b * b))} units`,
      category: "measurement",
    }
  }

  // BMI Calculator
  const bmiMatch = lower.match(
    /(?:bmi|body\s+mass\s+index)\s+([\d.]+)\s*(?:kg|kilograms?)?\s+(?:and|height)?\s*([\d.]+)\s*(?:m|meters?|metres?)?/i
  )
  if (bmiMatch) {
    const weight = parseFloat(bmiMatch[1])
    const height = parseFloat(bmiMatch[2])
    const bmi = weight / (height * height)
    let category = ""
    if (bmi < 18.5) category = " (Underweight)"
    else if (bmi < 25) category = " (Normal)"
    else if (bmi < 30) category = " (Overweight)"
    else category = " (Obese)"
    return {
      input,
      parsed: `${weight}kg / (${height}m)^2`,
      result: `${formatNumber(bmi)}${category}`,
      category: "measurement",
    }
  }

  return null
}

function tryArithmetic(input: string): CalculationResult | null {
  let lower = input.toLowerCase().trim()

  // Parse number words
  lower = parseNumberWords(lower)

  // Replace spoken math operators
  lower = lower
    .replace(/\bplus\b/gi, "+")
    .replace(/\badd\b/gi, "+")
    .replace(/\baddition\b/gi, "+")
    .replace(/\bminus\b/gi, "-")
    .replace(/\bsubtract\b/gi, "-")
    .replace(/\bsubtraction\b/gi, "-")
    .replace(/\btake\s+away\b/gi, "-")
    .replace(/\btimes\b/gi, "*")
    .replace(/\bmultiply\b/gi, "*")
    .replace(/\bmultiplied\s+by\b/gi, "*")
    .replace(/\bmultiplication\b/gi, "*")
    .replace(/\bx\b/gi, "*")
    .replace(/\bdivided\s+by\b/gi, "/")
    .replace(/\bdivide\b/gi, "/")
    .replace(/\bdivision\b/gi, "/")
    .replace(/\bover\b/gi, "/")
    .replace(/\bmodulo\b/gi, "%")
    .replace(/\bmod\b/gi, "%")
    .replace(/\bremainder\s+of\b/gi, "%")

  // Remove common prefixes
  lower = lower
    .replace(/^what\s+is\s+/i, "")
    .replace(/^calculate\s+/i, "")
    .replace(/^compute\s+/i, "")
    .replace(/^what's\s+/i, "")
    .replace(/^how\s+much\s+is\s+/i, "")
    .replace(/\?$/g, "")
    .trim()

  // Extract math expression
  const expression = lower.replace(/[^0-9+\-*/.%() ]/g, "").trim()

  if (!expression || !/[\d]/.test(expression)) return null

  try {
    // Safe evaluation - no eval, use Function with restrictions
    const sanitized = expression.replace(/[^0-9+\-*/.%() ]/g, "")
    if (!sanitized) return null

    // Use Function constructor for safe math evaluation
    const fn = new Function(`"use strict"; return (${sanitized})`)
    const result = fn()

    if (typeof result === "number" && isFinite(result)) {
      return {
        input,
        parsed: sanitized,
        result: formatNumber(result),
        category: "arithmetic",
      }
    }
  } catch {
    // Failed to evaluate
  }

  return null
}

function formatNumber(n: number): string {
  if (Number.isInteger(n)) return n.toLocaleString()
  // Limit decimal places but remove trailing zeros
  const fixed = n.toFixed(8)
  return parseFloat(fixed).toLocaleString(undefined, {
    maximumFractionDigits: 8,
  })
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

// ---- Main exported function ----

export function processVoiceInput(input: string): CalculationResult {
  if (!input || !input.trim()) {
    return {
      input,
      parsed: "",
      result: "",
      category: "arithmetic",
      error: "No input received",
    }
  }

  // Try each category in order of specificity
  const conversion = tryConversion(input)
  if (conversion) return conversion

  const measurement = tryMeasurement(input)
  if (measurement) return measurement

  const scientific = tryScientific(input)
  if (scientific) return scientific

  const arithmetic = tryArithmetic(input)
  if (arithmetic) return arithmetic

  return {
    input,
    parsed: input,
    result: "",
    category: "arithmetic",
    error: `Could not understand: "${input}". Try saying something like "5 plus 3", "convert 10 miles to kilometers", or "square root of 144".`,
  }
}

export function getExampleCommands(): {
  category: string
  examples: string[]
}[] {
  return [
    {
      category: "Arithmetic",
      examples: [
        "What is 25 plus 17?",
        "125 divided by 5",
        "48 times 12",
        "1000 minus 347",
        "15 percent of 200",
      ],
    },
    {
      category: "Scientific",
      examples: [
        "Square root of 144",
        "5 to the power of 3",
        "Sine of 45 degrees",
        "Log of 1000",
        "Factorial of 6",
      ],
    },
    {
      category: "Conversions",
      examples: [
        "Convert 5 miles to kilometers",
        "100 fahrenheit to celsius",
        "Convert 10 pounds to kilograms",
        "50 gallons to liters",
        "Convert 3 feet to centimeters",
      ],
    },
    {
      category: "Measurements",
      examples: [
        "Area of a circle radius 5",
        "Volume of a sphere radius 3",
        "Area of a rectangle 10 by 5",
        "Hypotenuse 3 and 4",
        "BMI 70 1.75",
      ],
    },
  ]
}

// Suppress unused warnings for values used only internally
void temperatureUnits
