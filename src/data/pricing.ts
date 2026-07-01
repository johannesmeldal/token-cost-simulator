// Prismodell — lastes direkte fra context_modeltokencost.json.
// Rediger JSON-filen for å endre priser; denne filen leser den, den kopierer den ikke.
import rawPricing from '../../context_modeltokencost.json'

type Vendor = 'anthropic' | 'openai' | 'google'

interface RawModelEntry {
  tier: string
  pricing: {
    input_per_million: number
    output_per_million: number
    cached_input_per_million: number
    cache_write_per_million?: number
  }
  status?: string
  note?: string
}

type AnthropicKey = keyof typeof rawPricing.models.anthropic
type OpenAiKey = keyof typeof rawPricing.models.openai
type GoogleKey = keyof typeof rawPricing.models.google

/** Alle modellnøkler som finnes i context_modeltokencost.json. */
export type ModelKey = AnthropicKey | OpenAiKey | GoogleKey

/**
 * Modellene simuleringsprofilene faktisk kan trekke (se profiles.ts).
 * Bevisst smalere enn ModelKey: en ny modell i JSON-en skal ikke automatisk
 * begynne å bli brukt i live-simulering uten et bevisst valg i profiles.ts.
 */
export type ModelId = Extract<
  ModelKey,
  | 'claude_haiku_4_5'
  | 'claude_sonnet_4_6'
  | 'claude_opus_4_8'
  | 'gpt_5_mini'
  | 'gpt_4_1'
  | 'gpt_5_4'
  | 'gpt_5_5'
  | 'gemini_2_5_pro'
>

export type ModelTier = 'included' | 'lightweight' | 'standard' | 'frontier'

export interface ModelPricing {
  id: ModelKey
  label: string
  vendor: Vendor
  tier: ModelTier
  /** USD per 1 million tokens */
  inputPerMillion: number
  outputPerMillion: number
  cachedInputPerMillion: number
  cacheWritePerMillion?: number
  isFree: boolean
}

const VENDOR_MODELS: Record<Vendor, Record<string, RawModelEntry>> = {
  anthropic: rawPricing.models.anthropic,
  openai: rawPricing.models.openai,
  google: rawPricing.models.google,
}

// Menneskelesbare navn for modeller i JSON-en. Legg til her når en ny modell
// legges til i context_modeltokencost.json — ellers brukes titleCaseFallback.
const LABEL_OVERRIDES: Partial<Record<ModelKey, string>> = {
  claude_haiku_4_5: 'Claude Haiku 4.5',
  claude_sonnet_4_5: 'Claude Sonnet 4.5',
  claude_sonnet_4_6: 'Claude Sonnet 4.6',
  claude_opus_4_5: 'Claude Opus 4.5',
  claude_opus_4_6: 'Claude Opus 4.6',
  claude_opus_4_7: 'Claude Opus 4.7',
  claude_opus_4_8: 'Claude Opus 4.8',
  gpt_5_mini: 'GPT-5 mini',
  gpt_4_1: 'GPT-4.1',
  gpt_5_4_nano: 'GPT-5.4 nano',
  gpt_5_4: 'GPT-5.4',
  gpt_5_5: 'GPT-5.5',
  gemini_3_5_flash: 'Gemini 3.5 Flash',
  gemini_2_5_pro: 'Gemini 2.5 Pro',
}

function titleCaseFallback(key: string): string {
  return key
    .split('_')
    .map(part => (/^\d/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(' ')
}

function buildModels(): Record<ModelKey, ModelPricing> {
  const models = {} as Record<ModelKey, ModelPricing>
  ;(Object.keys(VENDOR_MODELS) as Vendor[]).forEach(vendor => {
    Object.entries(VENDOR_MODELS[vendor]).forEach(([key, entry]) => {
      const modelKey = key as ModelKey
      models[modelKey] = {
        id: modelKey,
        label: LABEL_OVERRIDES[modelKey] ?? titleCaseFallback(key),
        vendor,
        tier: entry.tier as ModelTier,
        inputPerMillion: entry.pricing.input_per_million,
        outputPerMillion: entry.pricing.output_per_million,
        cachedInputPerMillion: entry.pricing.cached_input_per_million,
        cacheWritePerMillion: entry.pricing.cache_write_per_million,
        isFree: entry.tier === 'included',
      }
    })
  })
  return models
}

/** Alle modeller fra context_modeltokencost.json (bredere enn ModelId). */
export const MODELS: Record<ModelKey, ModelPricing> = buildModels()

export const CREDIT_TO_USD = rawPricing.fundamentals.credit_to_usd
export const CREDIT_TO_NOK = rawPricing.fundamentals.credit_to_nok
export const USD_TO_NOK = (1 / CREDIT_TO_USD) * CREDIT_TO_NOK

// Antall inkluderte kreditter per bruker per måned (Business-plan kampanje jun–sep 2026)
export const INCLUDED_CREDITS_PER_USER =
  rawPricing.allocation_plans.organizational.business.promotional_credits_jun_sep_2026

// Organisasjonens overflow-budsjett i NOK. Ingen ekvivalent i context_modeltokencost.json
// (JSON-en dekker kun modellpriser og abonnementsplaner, ikke org-spesifikke overflow-tall).
export const ORG_OVERFLOW_BUDGET_NOK = 15_000

// Konvertere overflow-budsjettet til kreditter for intern beregning
export const ORG_OVERFLOW_BUDGET_CREDITS = Math.floor(ORG_OVERFLOW_BUDGET_NOK / CREDIT_TO_NOK) // ~136 363

// ── Periode 1 (før 2026-06-01): premium-prompt-basert prising ──────────────
// Ingen ekvivalent i context_modeltokencost.json (som kun dekker forbruksbasert
// prising) — disse er demo/illustrative tall for å modellere den gamle
// premium-prompt-modellen GitHub Copilot brukte før overgangen til token-basert billing.
export const PREMIUM_PROMPT_TIER_MULTIPLIER: Record<ModelTier, number> = {
  included: 0,
  lightweight: 0.33,
  standard: 1,
  frontier: 10,
}
export const PREMIUM_PROMPT_INCLUDED_PER_USER_PER_MONTH = 300
export const PREMIUM_PROMPT_OVERAGE_USD_PER_PROMPT = 0.04

// Tier-farger til UI
export const TIER_COLOR: Record<ModelTier, string> = {
  included: 'text-accent-green',
  lightweight: 'text-accent-blue',
  standard: 'text-accent-yellow',
  frontier: 'text-accent-purple',
}

export const TIER_LABEL: Record<ModelTier, string> = {
  included: 'Inkludert (gratis)',
  lightweight: 'Lett',
  standard: 'Standard',
  frontier: 'Frontier',
}
