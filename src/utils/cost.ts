import { MODELS, CREDIT_TO_NOK, CREDIT_TO_USD } from '../data/pricing'
import type { ModelId } from '../data/pricing'

/**
 * Typisk input/output-fordeling per modellbruk i Copilot.
 * Copilot er tungt input-vektet (lang kontekst sendes inn, kort svar ut).
 */
const INPUT_RATIO = 0.75
const OUTPUT_RATIO = 0.25

/**
 * Konverterer tokens → kreditter basert på modell og input/output-fordeling.
 * Returnerer 0 for gratis modeller.
 */
export function tokensToCredits(tokens: number, modelId: ModelId): number {
  const model = MODELS[modelId]
  if (model.isFree) return 0

  const inputTokens = tokens * INPUT_RATIO
  const outputTokens = tokens * OUTPUT_RATIO

  const usdCost =
    (inputTokens / 1_000_000) * model.inputPerMillion +
    (outputTokens / 1_000_000) * model.outputPerMillion

  return usdCost / CREDIT_TO_USD
}

/**
 * Konverterer kreditter → NOK.
 */
export function creditsToNok(credits: number): number {
  return credits * CREDIT_TO_NOK
}

/**
 * Konverterer tokens → NOK direkte (via kreditter).
 */
export function tokensToNok(tokens: number, modelId: ModelId): number {
  return creditsToNok(tokensToCredits(tokens, modelId))
}

/**
 * Effektiv pris per million tokens i NOK for en gitt modell.
 * Brukes til å estimere kostnad i tooltips.
 */
export function effectiveNokPerMillion(modelId: ModelId): number {
  const model = MODELS[modelId]
  if (model.isFree) return 0
  const usdPerMillion =
    model.inputPerMillion * INPUT_RATIO +
    model.outputPerMillion * OUTPUT_RATIO
  return (usdPerMillion / CREDIT_TO_USD) * CREDIT_TO_NOK
}

/**
 * Formatering
 */
export function formatCredits(credits: number): string {
  if (credits >= 10_000) return `${(credits / 1_000).toFixed(1)}k kr`
  if (credits >= 1_000) return `${(credits / 1_000).toFixed(2)}k kr`
  return `${credits.toFixed(1)} kr`
}

export function formatNok(nok: number): string {
  if (nok >= 10_000) return `${(nok / 1_000).toFixed(1)}k NOK`
  if (nok >= 1_000) return `${nok.toFixed(0)} NOK`
  return `${nok.toFixed(2)} NOK`
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return n.toString()
}

/**
 * To-lags budsjettberegning:
 *
 * Fase 1 — Inkluderte kreditter (3 900 per bruker per måned, forhåndsbetalt)
 *   Brukeren forbruker av sin inkluderte kvote. Koster ikke overflow-potten.
 *
 * Fase 2 — Overflow-pool (15 000 NOK for hele org)
 *   Når bruker overskrider 3 900 inkluderte kreditter, trekkes fra org-potten.
 */
export interface BudgetStatus {
  /** Kreditter brukt innenfor inkludert kvote */
  includedUsed: number
  /** Kreditter brukt utover inkludert kvote (trekker fra overflow) */
  overflowUsed: number
  /** NOK brukt fra overflow-potten */
  overflowNokUsed: number
  /** Er brukeren i overflow-fasen? */
  inOverflow: boolean
  /** Prosentandel av inkludert kvote brukt (0–1+) */
  includedPct: number
  /** Prosentandel av org overflow-potten brukt (0–1+) */
  overflowPct: number
}

export function calcBudgetStatus(
  creditsUsed: number,
  includedCredits: number,
  overflowBudgetNok: number
): BudgetStatus {
  const includedUsed = Math.min(creditsUsed, includedCredits)
  const overflowUsed = Math.max(0, creditsUsed - includedCredits)
  const overflowNokUsed = creditsToNok(overflowUsed)
  return {
    includedUsed,
    overflowUsed,
    overflowNokUsed,
    inOverflow: creditsUsed > includedCredits,
    includedPct: includedCredits > 0 ? creditsUsed / includedCredits : 0,
    overflowPct: overflowBudgetNok > 0 ? overflowNokUsed / overflowBudgetNok : 0,
  }
}
