import type { SimulationProfile } from '../types/org'
import type { ModelId } from '../data/pricing'

interface ModelWeight {
  model: ModelId
  /** Relativ vekt — trenger ikke summere til 1 */
  weight: number
}

interface ProfileConfig {
  label: string
  /**
   * Vektet fordeling over modeller denne profilen kan trekke per hendelse.
   * Simulerer at Copilots "auto"-modellvelger sprer bruken over flere modeller
   * i stedet for at én bruker alltid treffer samme modell.
   */
  modelWeights: ModelWeight[]
  /** Token range per simulerings-tick */
  minTokens: number
  maxTokens: number
  /** Sannsynlighet for stor kontekstforespørsel (0–1) */
  largeContextChance: number
  /** Sannsynlighet for Agent Mode-sesjon (0–1) */
  agentModeChance: number
  /** Sannsynlighet for å ikke gjøre noe dette ticket (idle) */
  idleChance: number
  /** Beskrivelse til tooltip */
  description: string
}

export const PROFILES: Record<SimulationProfile, ProfileConfig> = {
  /**
   * Mest Claude Sonnet (standard-tier), med noe spredning til lettere/inkluderte
   * modeller via auto-velgeren. Moderat volum, typiske autocomplete-/kodegjennomgangsoppgaver.
   */
  normal_developer: {
    label: 'Normal Developer',
    modelWeights: [
      { model: 'claude_sonnet_4_6', weight: 70 },
      { model: 'claude_haiku_4_5', weight: 15 },
      { model: 'gpt_4_1', weight: 10 },
      { model: 'gemini_2_5_pro', weight: 5 },
    ],
    minTokens: 200,
    maxTokens: 1_200,
    largeContextChance: 0.05,
    agentModeChance: 0.02,
    idleChance: 0.30,
    description: 'Bruker mest Claude Sonnet, med noe spredning via auto-modellvelgeren. Moderat volum.',
  },

  /**
   * Mest Claude Opus (frontier-tier) — tyngste og dyreste modell — men trekker
   * også Sonnet/frontier-alternativer via auto-velgeren. Stor Agent Mode-bruk.
   */
  power_user: {
    label: 'Power User',
    modelWeights: [
      { model: 'claude_opus_4_8', weight: 55 },
      { model: 'claude_sonnet_4_6', weight: 25 },
      { model: 'gemini_2_5_pro', weight: 10 },
      { model: 'gpt_5_5', weight: 10 },
    ],
    minTokens: 1_500,
    maxTokens: 8_000,
    largeContextChance: 0.20,
    agentModeChance: 0.15,
    idleChance: 0.05,
    description: 'Bruker mest Claude Opus (frontier). Tung Agent Mode-bruk og store kontekstvinduer.',
  },

  /**
   * Mest inkluderte/gratis modeller — null kredittforbruk mesteparten av tiden.
   * Sporadisk bruk, enkle autocomplete-forespørsler.
   */
  intern: {
    label: 'Intern',
    modelWeights: [
      { model: 'gpt_5_mini', weight: 55 },
      { model: 'gpt_4_1', weight: 30 },
      { model: 'claude_haiku_4_5', weight: 10 },
      { model: 'claude_sonnet_4_6', weight: 5 },
    ],
    minTokens: 50,
    maxTokens: 300,
    largeContextChance: 0.01,
    agentModeChance: 0.00,
    idleChance: 0.60,
    description: 'Bruker mest inkluderte/gratis modeller. Svært lav og sporadisk bruk.',
  },

  /**
   * Veksler mye mellom modeller — store prompts, uforutsigbart forbruk.
   * Bred spredning over frontier- og standard-modeller via auto-velgeren.
   */
  experimental_user: {
    label: 'Experimental User',
    modelWeights: [
      { model: 'claude_opus_4_8', weight: 25 },
      { model: 'gpt_5_5', weight: 20 },
      { model: 'claude_sonnet_4_6', weight: 15 },
      { model: 'gemini_2_5_pro', weight: 15 },
      { model: 'claude_haiku_4_5', weight: 10 },
      { model: 'gpt_5_mini', weight: 10 },
      { model: 'gpt_4_1', weight: 5 },
    ],
    minTokens: 0,
    maxTokens: 15_000,
    largeContextChance: 0.25,
    agentModeChance: 0.10,
    idleChance: 0.20,
    description: 'Veksler mye mellom modeller. Hyppige forsøk, store prompts, uforutsigbart forbruk.',
  },
}

export function generateTokens(profile: SimulationProfile): number {
  const cfg = PROFILES[profile]
  if (Math.random() < cfg.idleChance) return 0

  const base = Math.floor(cfg.minTokens + Math.random() * (cfg.maxTokens - cfg.minTokens))
  if (Math.random() < cfg.agentModeChance) return base * 6   // Agent Mode: mange rundturer
  if (Math.random() < cfg.largeContextChance) return base * 3 // Stor kontekst: mye input
  return base
}

export function getEventType(
  profile: SimulationProfile,
  tokens: number
): 'prompt_submitted' | 'large_context' | 'agent_mode_session' {
  const cfg = PROFILES[profile]
  if (tokens > cfg.maxTokens * 4) return 'agent_mode_session'
  if (tokens > cfg.maxTokens * 2) return 'large_context'
  return 'prompt_submitted'
}

/**
 * Trekker en modell for én simulert hendelse, vektet etter profilens
 * modelWeights. Simulerer Copilots "auto"-modellvelger: samme bruker kan
 * treffe ulike modeller fra hendelse til hendelse.
 */
export function pickModel(profile: SimulationProfile): ModelId {
  const weights = PROFILES[profile].modelWeights
  const total = weights.reduce((sum, w) => sum + w.weight, 0)
  let roll = Math.random() * total
  for (const w of weights) {
    roll -= w.weight
    if (roll <= 0) return w.model
  }
  return weights[weights.length - 1].model
}
