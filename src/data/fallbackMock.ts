import type { Organization, Team, User } from "../types/org";
import type { GovernancePolicy } from "../types/governance";
import { DEFAULT_POLICY } from "../types/governance";
import {
  INCLUDED_CREDITS_PER_USER,
  ORG_OVERFLOW_BUDGET_CREDITS,
  CREDIT_TO_NOK,
} from "./pricing";

const ORG_ID = "mock-org-1";

// 18 betalende brukere (unntatt org admin) × 3 900 inkluderte kreditter
const PAYING_USERS = 18;
const TOTAL_INCLUDED_CREDITS = PAYING_USERS * INCLUDED_CREDITS_PER_USER; // 70 200

export const fallbackOrg: Organization = {
  id: ORG_ID,
  name: "Digital Services",
  /**
   * Totalbudsjettet = inkluderte kreditter + overflow-pool uttrykt i tokens.
   * Brukes kun som referanse — den faktiske styringslogikken bruker kreditter.
   * Vi lagrer dette som kreditter for konsistens med Supabase-modellen.
   */
  totalBudgetTokens: TOTAL_INCLUDED_CREDITS + ORG_OVERFLOW_BUDGET_CREDITS, // ~206 563 kreditter totalt
  currency: "NOK",
  tokensPerNok: Math.round(1 / CREDIT_TO_NOK), // ~9 (1 NOK ≈ 9 kreditter)
};

export const fallbackTeams: Team[] = [
  {
    id: "team-1",
    organizationId: ORG_ID,
    name: "Platform Team",
    allocatedTokens: 3_000_000,
    managerUserId: "user-2",
  },
  {
    id: "team-2",
    organizationId: ORG_ID,
    name: "Passenger Experience",
    allocatedTokens: 4_000_000,
    managerUserId: "user-7",
  },
  {
    id: "team-3",
    organizationId: ORG_ID,
    name: "Ops & Infrastructure",
    allocatedTokens: 2_000_000,
    managerUserId: "user-12",
  },
  {
    id: "team-4",
    organizationId: ORG_ID,
    name: "Data & Analytics",
    allocatedTokens: 1_000_000,
    managerUserId: "user-16",
  },
];

export const fallbackUsers: User[] = [
  // Org Admin
  {
    id: "user-1",
    organizationId: ORG_ID,
    teamId: null,
    name: "Johannes M.",
    role: "org_admin",
    simulationProfile: "normal_developer",
    quotaTokens: 0,
    isEnabled: true,
  },

  // Platform Team (team-1) — manager: user-2
  {
    id: "user-2",
    organizationId: ORG_ID,
    teamId: "team-1",
    name: "Kari L.",
    role: "team_admin",
    simulationProfile: "normal_developer",
    quotaTokens: 500_000,
    isEnabled: true,
  },
  {
    id: "user-3",
    organizationId: ORG_ID,
    teamId: "team-1",
    name: "Per H.",
    role: "developer",
    simulationProfile: "power_user",
    quotaTokens: 800_000,
    isEnabled: true,
  },
  {
    id: "user-4",
    organizationId: ORG_ID,
    teamId: "team-1",
    name: "Anna S.",
    role: "developer",
    simulationProfile: "normal_developer",
    quotaTokens: 500_000,
    isEnabled: true,
  },
  {
    id: "user-5",
    organizationId: ORG_ID,
    teamId: "team-1",
    name: "Ole T.",
    role: "developer",
    simulationProfile: "experimental_user",
    quotaTokens: 600_000,
    isEnabled: true,
  },
  {
    id: "user-6",
    organizationId: ORG_ID,
    teamId: "team-1",
    name: "Ida K.",
    role: "developer",
    simulationProfile: "intern",
    quotaTokens: 200_000,
    isEnabled: true,
  },

  // Passenger Experience (team-2) — manager: user-7
  {
    id: "user-7",
    organizationId: ORG_ID,
    teamId: "team-2",
    name: "Mats B.",
    role: "team_admin",
    simulationProfile: "normal_developer",
    quotaTokens: 400_000,
    isEnabled: true,
  },
  {
    id: "user-8",
    organizationId: ORG_ID,
    teamId: "team-2",
    name: "Sara N.",
    role: "developer",
    simulationProfile: "power_user",
    quotaTokens: 700_000,
    isEnabled: true,
  },
  {
    id: "user-9",
    organizationId: ORG_ID,
    teamId: "team-2",
    name: "Lars E.",
    role: "developer",
    simulationProfile: "normal_developer",
    quotaTokens: 400_000,
    isEnabled: true,
  },
  {
    id: "user-10",
    organizationId: ORG_ID,
    teamId: "team-2",
    name: "Nina R.",
    role: "developer",
    simulationProfile: "normal_developer",
    quotaTokens: 400_000,
    isEnabled: true,
  },
  {
    id: "user-11",
    organizationId: ORG_ID,
    teamId: "team-2",
    name: "Erik V.",
    role: "developer",
    simulationProfile: "intern",
    quotaTokens: 150_000,
    isEnabled: true,
  },

  // Ops & Infrastructure (team-3) — manager: user-12
  {
    id: "user-12",
    organizationId: ORG_ID,
    teamId: "team-3",
    name: "Hanne G.",
    role: "team_admin",
    simulationProfile: "normal_developer",
    quotaTokens: 400_000,
    isEnabled: true,
  },
  {
    id: "user-13",
    organizationId: ORG_ID,
    teamId: "team-3",
    name: "Tor A.",
    role: "developer",
    simulationProfile: "experimental_user",
    quotaTokens: 600_000,
    isEnabled: true,
  },
  {
    id: "user-14",
    organizationId: ORG_ID,
    teamId: "team-3",
    name: "Frida M.",
    role: "developer",
    simulationProfile: "normal_developer",
    quotaTokens: 400_000,
    isEnabled: true,
  },
  {
    id: "user-15",
    organizationId: ORG_ID,
    teamId: "team-3",
    name: "Bjørn C.",
    role: "developer",
    simulationProfile: "power_user",
    quotaTokens: 600_000,
    isEnabled: true,
  },

  // Data & Analytics (team-4) — manager: user-16
  {
    id: "user-16",
    organizationId: ORG_ID,
    teamId: "team-4",
    name: "Line D.",
    role: "team_admin",
    simulationProfile: "normal_developer",
    quotaTokens: 300_000,
    isEnabled: true,
  },
  {
    id: "user-17",
    organizationId: ORG_ID,
    teamId: "team-4",
    name: "Stian F.",
    role: "developer",
    simulationProfile: "power_user",
    quotaTokens: 500_000,
    isEnabled: true,
  },
  {
    id: "user-18",
    organizationId: ORG_ID,
    teamId: "team-4",
    name: "Camilla W.",
    role: "developer",
    simulationProfile: "normal_developer",
    quotaTokens: 200_000,
    isEnabled: true,
  },
];

export const fallbackPolicy: GovernancePolicy = DEFAULT_POLICY;
