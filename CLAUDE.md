# AI Governance Simulator — Prosjektstatus

**Sist oppdatert:** 2026-06-30  
**Utvikler:** Johannes Meldal  
**Formål:** Interaktivt simuleringsverktøy for å demonstrere konsekvenser av ulike GitHub Copilot governance-modeller. Brukes i workshops og beslutningsprosesser (Double Diamond Develop-fase).

---

## Teknisk stack

| Lag | Teknologi |
|-----|-----------|
| Framework | React 18 + TypeScript (Vite 5) |
| Styling | Tailwind CSS v3 (mørkt tema, GitHub-estetikk) |
| State | Zustand (tre stores: governance, org, simulation) |
| Charts | Recharts |
| Icons | Lucide React |
| Routing | React Router v6 |
| Backend | Supabase (PostgreSQL) |
| Dev-server | `npm run dev` → `http://localhost:5173` |

---

## Kjøre prosjektet

```bash
cd /Users/johannesmeldal/Documents/Avinor-code/Test-build/Copilot-app
npm run dev
```

Krever `.env` med:
```
VITE_SUPABASE_URL=https://gkwirqgbshfgxsslsrvw.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_aR2akTN2iouRCgg-ZS0kLw_GQY0e2Ml
```

---

## Arkitektur — viktige beslutninger

### Rollehierarki
Tre roller med hierarkisk scope (ikke ulik logikk, ulikt scope):
- `org_admin` — ser og administrerer hele organisasjonen
- `team_admin` — ser og administrerer eget team (utpekes av org_admin)
- `developer` — ser eget forbruk + begrenset teaminnsyn

Rollebytte skjer via dropdown i TopBar **uten autentisering** — dette er et demo-verktøy.

### Governance som fire kombinérbare lag
Ikke én modell, men fire uavhengige toggles:
1. **Budsjettstruktur** — Org-only / Teambudsjetter / Individuelle kvoter (flervalg)
2. **Håndhevelse** — Soft limits (advarsel) / Hard limits (blokkering)
3. **Chargeback** — Av / Team / Individuell
4. **Personvern** — 6 transparency-toggles (hvem ser hva om hvem)

Policy-endringer skrives umiddelbart til Supabase og er reaktive uten reload.

### To-lags budsjettmodell (GitHub Business-plan)
```
Fase 1: Inkluderte kreditter
  18 brukere × 3 900 kreditter/mnd = 70 200 kr inkludert
  Forhåndsbetalt i abonnementet — koster ikke ekstra

Fase 2: Overflow-pool
  15 000 NOK org-budsjett
  Brukes når én bruker overskrider sine 3 900 inkluderte kreditter
```

**Valutakonvertering:** 1 kreditt = $0.01 = 0.11 NOK

### Prismodell per modell
Simuleringsprofiler er koblet til faktiske GitHub Copilot-modeller:
| Profil | Modell | Tier |
|--------|--------|------|
| Normal Developer | Claude Sonnet 4.6 | Standard ($3/$15 per 1M in/out) |
| Power User | Claude Opus 4.8 | Frontier ($5/$25 per 1M in/out) |
| Intern | GPT-5 mini | Inkludert (gratis) |
| Experimental | Claude Opus 4.8 | Frontier |

Token → kreditt-konvertering bruker 75% input / 25% output-split.

### Data-skillet (kritisk)
- **Supabase** lagrer konfigurasjon: org, teams, brukere, kvoter, governance-policy
- **Zustand i minnet** akkumulerer simuleringsforbruk (tokens, kreditter, overflow)
- Simuleringsdata skrives **aldri** tilbake til Supabase — nullstilles ved Reset

---

## Mappestruktur

```
src/
├── App.tsx                          # Routing + rollebasert view-switching
├── main.tsx
├── index.css                        # Tailwind entry
├── vite-env.d.ts
│
├── data/
│   ├── pricing.ts                   # Prismodell fra context_modeltokencost.json
│   └── fallbackMock.ts              # Mock-data brukt om Supabase ikke er koblet til
│
├── lib/
│   └── supabase.ts                  # Supabase-klient + isSupabaseConfigured-flag
│
├── services/
│   ├── orgService.ts                # CRUD: organizations
│   ├── teamService.ts               # CRUD: teams
│   ├── userService.ts               # CRUD: users
│   └── policyService.ts             # Upsert/fetch: governance_policies
│
├── store/
│   ├── useGovernanceStore.ts        # Policy-state + activeIdentity (rollebytte)
│   ├── useOrgStore.ts               # Org/team/user-data + runtime usage
│   └── useSimulationStore.ts        # Simuleringsstatus, events, historikk
│
├── simulation/
│   └── profiles.ts                  # Brukerprofiler med modellvalg og token-ranges
│
├── hooks/
│   └── useSimulation.ts             # Simuleringsloop (setInterval, evt. emit)
│
├── utils/
│   └── cost.ts                      # tokens→kreditter→NOK, formatering, calcBudgetStatus
│
├── types/
│   ├── governance.ts                # GovernancePolicy, BudgetStructure, Transparency osv.
│   ├── org.ts                       # Organization, Team, User, RuntimeUsage osv.
│   └── simulation.ts                # SimulationEvent, HistoricalDataPoint osv.
│
├── components/
│   ├── layout/
│   │   ├── Shell.tsx                # App-wrapper med TopBar
│   │   ├── TopBar.tsx               # Header med SimulationControls + RoleSwitcher
│   │   └── RoleSwitcher.tsx         # Dropdown: bytt rolle/bruker live
│   │
│   ├── dashboard/
│   │   ├── QuotaGauge.tsx           # Lineær progress-bar med tooltip (tokens/kreditter/NOK)
│   │   ├── StatCard.tsx             # Tall-kort med valgfri tooltip
│   │   ├── SectionCard.tsx          # Kortcontainer med tittel og valgfri action
│   │   ├── UsageTrendChart.tsx      # Linjediagram (Recharts) med quota-referanselinje
│   │   ├── LiveEventFeed.tsx        # Scrollbar feed med fargekodede hendelser
│   │   └── Tooltip.tsx              # Gjenbrukbar hover-tooltip (auto-retning opp/ned)
│   │
│   └── simulation/
│       └── SimulationControls.tsx   # Play/Pause, Speed ×1/×5/×20, Reset
│
└── views/
    ├── OrgAdminView/
    │   ├── index.tsx                # Tab-nav: Dashboard | Policyer | Live hendelser
    │   ├── OrgBudgetSection.tsx     # To-lags budsjett, stat-kort, trend-graf
    │   ├── TeamOverviewSection.tsx  # Teamtabell med utnyttelses-bars
    │   ├── UserOverviewSection.tsx  # Brukertabell med anonym-toggle
    │   └── PolicyPanel.tsx          # Governance-toggles (skriver til Supabase)
    │
    ├── TeamAdminView.tsx            # PLACEHOLDER — ikke bygget ennå
    └── DeveloperView.tsx            # PLACEHOLDER — ikke bygget ennå
```

---

## Supabase-tabeller

```sql
organizations     -- id, name, total_budget_tokens, currency, tokens_per_nok
teams             -- id, organization_id, name, allocated_tokens, manager_user_id
users             -- id, organization_id, team_id, name, role, simulation_profile, quota_tokens, is_enabled
governance_policies -- id, organization_id, budget_structure (jsonb), enforcement, chargeback, transparency (jsonb)
```

Seed-script: `supabase_seed.sql` (kjøres i Supabase SQL Editor)  
RLS: deaktivert (demo-verktøy uten autentisering)

---

## Hva som er ferdig ✅

- [x] Prosjektscaffold (Vite + React + TS + Tailwind + Zustand + Recharts + Supabase)
- [x] Supabase-integrasjon med automatisk fallback til mock-data
- [x] Alle fire Supabase-tabeller med seed-data (18 brukere, 4 team)
- [x] Tre Zustand-stores med korrekt data-skille (persistent vs. runtime)
- [x] To-lags budsjettmodell (inkluderte kreditter + 15 000 NOK overflow)
- [x] Prismodell fra `context_modeltokencost.json` (alle modeller, korrekte USD-priser)
- [x] Token → kreditt → NOK-konvertering per modell
- [x] Simuleringsprofiler koblet til reelle GitHub Copilot-modeller
- [x] Simuleringsloop med Play/Pause/Speed/Reset
- [x] App-shell: TopBar, RoleSwitcher, SimulationControls
- [x] **OrgAdminView** (komplett):
  - Dashboard-tab: to-lags budsjett, stat-kort, trend-graf, teamtabell, brukertabell
  - Governance-policyer-tab: alle toggles med live Supabase-skriving
  - Live hendelser-tab: full event-feed
  - Tooltips på alle måleverdier (kreditter vs. tokens vs. NOK)
  - Anonymiseringstoggle på brukertabell

---

## Hva som gjenstår ❌

### Høy prioritet (neste)
- [ ] **TeamAdminView** — dashboard for Team Admin:
  - Team-kvote gauge (tilpasset aktiv budsjettmodell)
  - Teammedlemmer med individuell bruk (med named/anonym-toggle arvet fra org-policy)
  - Live event-feed filtrert til eget team
  - Kvoteredigering for egne teammedlemmer (om individkvoter er aktivert)
- [ ] **DeveloperView** — dashboard for Developer:
  - Personlig kvote-gauge
  - Eget forbruk vs. inkludert kvote
  - Team-status (aggregert)
  - Org-status (trafikklys)
  - Varsler ved 75% / 90% / 100%

### Medium prioritet
- [ ] **Admin-panel for Org Admin** — mutasjonsfunksjonalitet:
  - Rediger org-budsjett (overflow-pool)
  - Opprett / slett team, tildel Team Admin
  - Opprett / rediger brukere, sett simuleringsprofil og kvote
  - Flytt brukere mellom team
- [ ] **SQL seed oppdatering** — oppdater `supabase_seed.sql` til å reflektere korrekt kreditt-basert budsjett (18 brukere × 3 900 kr = 70 200 inkludert + overflow-pool)

### Lav prioritet / polish
- [ ] Prognose-modul (lineær fremskriving av overflow-forbruk)
- [ ] Chargeback-visning (NOK-kostnad per team/bruker)
- [ ] Demo-scenario-veiviser (guidet gjennomgang av governance-endringer)
- [ ] Eksport (CSV / PDF av forbruksdata)
- [ ] Lysmodus (valgfritt)

---

## Kjente begrensninger / ting å være oppmerksom på

- `tokensPerNok` i Organization-typen er et legacy-felt fra første iterasjon. Reell konvertering gjøres nå via `src/utils/cost.ts` og `src/data/pricing.ts`.
- Simuleringsloopen emitterer hendelser per bruker per tick — ved høy hastighet (×20) og mange brukere kan event-feeden bli støyete. Vurder debouncing.
- `total_budget_tokens` i Supabase lagrer nå kreditter (ikke tokens) for konsistens — navnet er misvisende og bør vurderes endret til `total_budget_credits` i en fremtidig migrasjon.
- Ingen autentisering — appen er åpen for alle med URL + anon key. OK for intern demo, ikke for ekstern drift.

---

## Kontekstfiler i prosjektet

| Fil | Innhold |
|-----|---------|
| `Copilot_Billing_Simulation_Context.md` | Bakgrunn, Double Diamond-prosess, nøkkelspørsmål |
| `functional requirements.json` | Roller, governance-lag, dashboards, demo-scenario |
| `technical requirements.json` | Stack, mappestruktur, Supabase-tabeller, seed-data |
| `context_modeltokencost.json` | Prismodell per modell (Anthropic/OpenAI/Google), kreditt-konvertering, abonnementsplaner |

---

## Endringslogg

> Denne seksjonen appendes til — eksisterende linjer skal ikke redigeres.

- **2026-06-30** — Prosjekt scaffoldet (Vite + React + TS + Tailwind + Supabase)
- **2026-06-30** — Supabase-tabeller opprettet og seed-data kjørt
- **2026-06-30** — Tre Zustand stores, service-lag og TypeScript-typer på plass
- **2026-06-30** — App-shell: TopBar, RoleSwitcher, SimulationControls
- **2026-06-30** — Simuleringsmotor med brukerprofiler og event-emitting
- **2026-06-30** — OrgAdminView ferdig: dashboard, governance-panel, live feed, tooltips
- **2026-06-30** — Prismodell fra context_modeltokencost.json integrert (tokens→kreditter→NOK)
- **2026-06-30** — To-lags budsjettmodell: 3 900 inkl. kreditter/bruker + 15 000 NOK overflow
