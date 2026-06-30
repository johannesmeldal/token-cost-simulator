export interface BudgetStructure {
  orgBudgetOnly: boolean
  teamBudgets: boolean
  individualQuotas: boolean
}

export type Enforcement = 'soft' | 'hard'

export type Chargeback = 'disabled' | 'team' | 'individual'

export interface Transparency {
  showIndividualToOrgAdmin: boolean
  showIndividualToTeamAdmin: boolean
  anonymizationForTeamAdmin: boolean
  showIndividualToDeveloper: boolean
  showChargebackToDeveloper: boolean
  showForecast: boolean
}

export interface GovernancePolicy {
  budgetStructure: BudgetStructure
  enforcement: Enforcement
  chargeback: Chargeback
  transparency: Transparency
}

export const DEFAULT_POLICY: GovernancePolicy = {
  budgetStructure: {
    orgBudgetOnly: true,
    teamBudgets: false,
    individualQuotas: false,
  },
  enforcement: 'soft',
  chargeback: 'disabled',
  transparency: {
    showIndividualToOrgAdmin: true,
    showIndividualToTeamAdmin: true,
    anonymizationForTeamAdmin: false,
    showIndividualToDeveloper: false,
    showChargebackToDeveloper: false,
    showForecast: true,
  },
}
