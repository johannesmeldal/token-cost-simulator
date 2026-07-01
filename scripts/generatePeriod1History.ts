// Engangsscript: genererer periode 1-historikk (2026-01-01 → 2026-05-31), da
// GitHub Copilot fortsatt brukte premium-prompt-basert prising (ikke forbruksbasert).
// Kjøres manuelt med `npm run generate:period1` — outputen committes som statisk fil,
// aldri lest fra eller skrevet til Supabase (se data-skille i CLAUDE.md).
//
// Gjenbruker ekte pickModel()/PROFILES-logikk fra profiles.ts og prisdata fra
// pricing.ts, slik at periode 1 og periode 2 aldri kan drifte fra hverandre.
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { fallbackUsers, fallbackTeams } from '../src/data/fallbackMock'
import { pickModel, PROFILES } from '../src/simulation/profiles'
import {
  MODELS,
  PREMIUM_PROMPT_TIER_MULTIPLIER,
  PREMIUM_PROMPT_INCLUDED_PER_USER_PER_MONTH,
  PREMIUM_PROMPT_OVERAGE_USD_PER_PROMPT,
  USD_TO_NOK,
} from '../src/data/pricing'
import type { Period1DailyPoint } from '../src/types/simulation'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_PATH = resolve(__dirname, '../src/data/period1History.json')

const PERIOD_START = Date.UTC(2026, 0, 1) // 2026-01-01
const PERIOD_END_EXCLUSIVE = Date.UTC(2026, 5, 1) // 2026-06-01 (periode 2 starter her)
const HOURS_PER_DAY = 24

function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10)
}

// Månedlig premium-prompt-teller per bruker, nullstilles ved hver måneds-overgang
const monthlyUnitsUsed = new Map<string, number>()
let currentMonthKey = ''

function monthKeyFor(ms: number): string {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}`
}

function resetMonthlyCountersIfNeeded(ms: number) {
  const key = monthKeyFor(ms)
  if (key !== currentMonthKey) {
    currentMonthKey = key
    monthlyUnitsUsed.clear()
  }
}

function simulateUserDay(userId: string, profile: keyof typeof PROFILES): number {
  const cfg = PROFILES[profile]
  let unitsToday = 0

  for (let hour = 0; hour < HOURS_PER_DAY; hour++) {
    if (Math.random() < cfg.idleChance) continue // ingen aktivitet denne timen

    const model = pickModel(profile)
    const tier = MODELS[model].tier
    unitsToday += PREMIUM_PROMPT_TIER_MULTIPLIER[tier]
  }

  // Konverter dagens enheter til NOK, med tanke på gjenstående inkludert kvote denne måneden
  const usedSoFar = monthlyUnitsUsed.get(userId) ?? 0
  const remainingIncluded = Math.max(0, PREMIUM_PROMPT_INCLUDED_PER_USER_PER_MONTH - usedSoFar)
  const unitsWithinIncluded = Math.min(unitsToday, remainingIncluded)
  const unitsOverage = Math.max(0, unitsToday - unitsWithinIncluded)

  monthlyUnitsUsed.set(userId, usedSoFar + unitsToday)

  return unitsOverage * PREMIUM_PROMPT_OVERAGE_USD_PER_PROMPT * USD_TO_NOK
}

function generate(): Period1DailyPoint[] {
  const points: Period1DailyPoint[] = []
  const teamByUserId = new Map(fallbackUsers.map(u => [u.id, u.teamId]))

  for (let day = PERIOD_START; day < PERIOD_END_EXCLUSIVE; day += 24 * 60 * 60 * 1000) {
    resetMonthlyCountersIfNeeded(day)

    const userNok: Record<string, number> = {}
    const teamNok: Record<string, number> = {}
    let orgNok = 0

    for (const user of fallbackUsers) {
      const nok = simulateUserDay(user.id, user.simulationProfile)
      userNok[user.id] = nok
      orgNok += nok
      const teamId = teamByUserId.get(user.id)
      if (teamId) teamNok[teamId] = (teamNok[teamId] ?? 0) + nok
    }

    points.push({ date: isoDate(day), orgNok, teamNok, userNok })
  }

  return points
}

const data = generate()
writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + '\n')
console.log(`Skrev ${data.length} dager med periode 1-historikk til ${OUTPUT_PATH}`)
console.log(`Team: ${fallbackTeams.map(t => t.name).join(', ')}`)
