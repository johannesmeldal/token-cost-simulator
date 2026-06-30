import type { SimulationProfile } from '../types/org'
import type { ModelId } from '../data/pricing'

interface ProfileConfig {
  label: string
  /** Primær modell denne profilen bruker */
  primaryModel: ModelId
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
   * Bruker Claude Sonnet (standard-tier) for det meste.
   * Moderat volum, typiske autocomplete- og kodegjennomgangsoppgaver.
   */
  normal_developer: {
    label: 'Normal Developer',
    primaryModel: 'claude_sonnet_4_6',
    minTokens: 200,
    maxTokens: 1_200,
    largeContextChance: 0.05,
    agentModeChance: 0.02,
    idleChance: 0.30,
    description: 'Bruker Claude Sonnet. Moderat volum — autocomplete og kodegjennomgang.',
  },

  /**
   * Bruker Claude Opus (frontier-tier) — tyngste og dyreste modell.
   * Stor Agent Mode-bruk, lange kontekstvinduer, tung refaktorering.
   */
  power_user: {
    label: 'Power User',
    primaryModel: 'claude_opus_4_8',
    minTokens: 1_500,
    maxTokens: 8_000,
    largeContextChance: 0.20,
    agentModeChance: 0.15,
    idleChance: 0.05,
    description: 'Bruker Claude Opus (frontier). Tung Agent Mode-bruk og store kontekstvinduer.',
  },

  /**
   * Bruker GPT-5 mini — inkludert/gratis, null kredittforbruk.
   * Sporadisk bruk, enkle autocomplete-forespørsler.
   */
  intern: {
    label: 'Intern',
    primaryModel: 'gpt_5_mini',
    minTokens: 50,
    maxTokens: 300,
    largeContextChance: 0.01,
    agentModeChance: 0.00,
    idleChance: 0.60,
    description: 'Bruker GPT-5 mini (inkludert — gratis). Svært lav og sporadisk bruk.',
  },

  /**
   * Veksler mellom modeller, store prompts, uforutsigbart forbruk.
   * Bruker Opus for eksperimentelle Agent Mode-kjøringer.
   */
  experimental_user: {
    label: 'Experimental User',
    primaryModel: 'claude_opus_4_8',
    minTokens: 0,
    maxTokens: 15_000,
    largeContextChance: 0.25,
    agentModeChance: 0.10,
    idleChance: 0.20,
    description: 'Bruker Claude Opus. Hyppige forsøk, store prompts, uforutsigbart forbruk.',
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

export function getPrimaryModel(profile: SimulationProfile): ModelId {
  return PROFILES[profile].primaryModel
}
