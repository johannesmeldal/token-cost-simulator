// Prismodell basert på context_modeltokencost.json
// Oppdatert: 2026-06-30

export const CREDIT_TO_USD = 0.01
export const CREDIT_TO_NOK = 0.11   // USD/NOK-kurs: 1 USD = ~9.09 NOK → 0.01 USD = 0.11 NOK
export const USD_TO_NOK = 1 / CREDIT_TO_USD * CREDIT_TO_NOK  // ~9.09

// Antall inkluderte kreditter per bruker per måned (Business-plan kampanje jun–sep 2026)
export const INCLUDED_CREDITS_PER_USER = 3_900

// Organisasjonens overflow-budsjett i NOK (betales når brukere overskrider inkluderte kreditter)
export const ORG_OVERFLOW_BUDGET_NOK = 15_000

// Konvertere overflow-budsjettet til kreditter for intern beregning
export const ORG_OVERFLOW_BUDGET_CREDITS = Math.floor(ORG_OVERFLOW_BUDGET_NOK / CREDIT_TO_NOK) // ~136 363

export type ModelId =
  | 'claude_sonnet_4_6'
  | 'claude_opus_4_8'
  | 'claude_haiku_4_5'
  | 'gpt_5_mini'
  | 'gpt_4_1'
  | 'gpt_5_4'
  | 'gpt_5_5'
  | 'gemini_2_5_pro'

export type ModelTier = 'included' | 'lightweight' | 'standard' | 'frontier'

export interface ModelPricing {
  id: ModelId
  label: string
  vendor: 'anthropic' | 'openai' | 'google'
  tier: ModelTier
  /** USD per 1 million tokens */
  inputPerMillion: number
  outputPerMillion: number
  cachedInputPerMillion: number
  isFree: boolean
}

export const MODELS: Record<ModelId, ModelPricing> = {
  // ── Anthropic ──────────────────────────────────────────────
  claude_haiku_4_5: {
    id: 'claude_haiku_4_5',
    label: 'Claude Haiku 4.5',
    vendor: 'anthropic',
    tier: 'lightweight',
    inputPerMillion: 1.0,
    outputPerMillion: 5.0,
    cachedInputPerMillion: 0.1,
    isFree: false,
  },
  claude_sonnet_4_6: {
    id: 'claude_sonnet_4_6',
    label: 'Claude Sonnet 4.6',
    vendor: 'anthropic',
    tier: 'standard',
    inputPerMillion: 3.0,
    outputPerMillion: 15.0,
    cachedInputPerMillion: 0.3,
    isFree: false,
  },
  claude_opus_4_8: {
    id: 'claude_opus_4_8',
    label: 'Claude Opus 4.8',
    vendor: 'anthropic',
    tier: 'frontier',
    inputPerMillion: 5.0,
    outputPerMillion: 25.0,
    cachedInputPerMillion: 0.5,
    isFree: false,
  },

  // ── OpenAI ─────────────────────────────────────────────────
  gpt_5_mini: {
    id: 'gpt_5_mini',
    label: 'GPT-5 mini',
    vendor: 'openai',
    tier: 'included',
    inputPerMillion: 0,
    outputPerMillion: 0,
    cachedInputPerMillion: 0,
    isFree: true,
  },
  gpt_4_1: {
    id: 'gpt_4_1',
    label: 'GPT-4.1',
    vendor: 'openai',
    tier: 'included',
    inputPerMillion: 0,
    outputPerMillion: 0,
    cachedInputPerMillion: 0,
    isFree: true,
  },
  gpt_5_4: {
    id: 'gpt_5_4',
    label: 'GPT-5.4',
    vendor: 'openai',
    tier: 'standard',
    inputPerMillion: 2.5,
    outputPerMillion: 15.0,
    cachedInputPerMillion: 0.25,
    isFree: false,
  },
  gpt_5_5: {
    id: 'gpt_5_5',
    label: 'GPT-5.5',
    vendor: 'openai',
    tier: 'frontier',
    inputPerMillion: 5.0,
    outputPerMillion: 30.0,
    cachedInputPerMillion: 0.5,
    isFree: false,
  },

  // ── Google ─────────────────────────────────────────────────
  gemini_2_5_pro: {
    id: 'gemini_2_5_pro',
    label: 'Gemini 2.5 Pro',
    vendor: 'google',
    tier: 'standard',
    inputPerMillion: 1.25,
    outputPerMillion: 10.0,
    cachedInputPerMillion: 0.31,
    isFree: false,
  },
}

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
