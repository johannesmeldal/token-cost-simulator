# AI Governance Simulator — Prosjektbeskrivelse

Fullstendig gjennomgang av logikk, skjermbilder/views og endepunkter i appen, generert fra faktisk kode (2026-07-01).

---

## 1. Hva er dette?

En interaktiv React-app som simulerer hvordan ulike **governance-modeller** for GitHub Copilot-forbruk (budsjett, håndhevelse, chargeback, personvern) slår ut i praksis — i sanntid, med syntetiske brukere som genererer tokens/kreditter/NOK-forbruk. Brukes i workshops for å vise beslutningstakere konsekvensene av policy-valg før de vedtas i virkeligheten.

Det finnes **ingen backend-API** i tradisjonell forstand. Appen er en Vite/React SPA som snakker direkte med Supabase (Postgres) via `@supabase/supabase-js` fra klienten, med en offline fallback til statisk mock-data. "Endepunktene" beskrevet i seksjon 5 er derfor Supabase-tabeller (via service-laget), ikke REST/GraphQL-ruter.

---

## 2. Ruter (React Router)

Appen har étt reelt visningsområde — `/dashboard` — og velger komponent basert på **aktiv rolle**, ikke URL:

| Path | Viser |
|------|-------|
| `/` | Redirect → `/dashboard` |
| `/dashboard` | `RoleRouter` → `OrgAdminView`, `TeamAdminView` eller `DeveloperView` avhengig av `activeIdentity.role` |
| `*` | Redirect → `/dashboard` |

`RoleRouter` (i `App.tsx`) leser `activeIdentity.role` fra `useGovernanceStore` og rendrer riktig view. Rollebytte skjer via `RoleSwitcher`-dropdown i TopBar — **ingen autentisering**, ren state-endring (`setActiveIdentity`), egnet kun for demo.

Ved appstart kjøres to bootstrap-effekter i `App.tsx`:
1. `useOrgStore.loadAll()` — henter organisasjon, teams og users
2. `useGovernanceStore.loadPolicy(organization.id)` — henter governance-policy for org-en

Mens dette pågår vises en enkel "Laster inn data…"-skjerm.

---

## 3. Datamodell og datadeling (kritisk arkitekturvalg)

To helt separate datalag som **aldri** blandes:

- **Supabase (persistent konfigurasjon)** — organisasjon, teams, brukere, kvoter, governance-policy. Alt som endres her via admin-UI skrives umiddelbart tilbake (upsert/update), og er reaktivt uten reload.
- **Zustand i minnet (runtime-simulering)** — akkumulert forbruk (tokens, kreditter, overflow, blokkeringsstatus, event-historikk, trend-historikk). Nullstilles fullstendig ved "Reset" i simuleringskontrollene. Skrives **aldri** til Supabase.

Tre Zustand-stores:

| Store | Ansvar |
|-------|--------|
| `useOrgStore` | Organisasjon/teams/users (persistent) + `teamUsage`/`userUsage` (runtime) + CRUD-mutasjoner |
| `useGovernanceStore` | `policy` (fire lag, persistent) + `activeIdentity` (rollebytte, runtime-only) |
| `useSimulationStore` | `isRunning`/`speed`/`tick`, `events` (siste 100), `history` (siste 2000 punkter til trendgraf) |

Hvis Supabase ikke er konfigurert (mangler env-vars) eller kallet feiler, faller alle service-funksjoner tilbake til statisk mock-data i `src/data/fallbackMock.ts` (18 brukere, 4 team, org "Avinor Digital").

---

## 4. Governance-logikk — fire kombinérbare lag

Styres fra **Governance-policyer**-fanen i OrgAdminView (`PolicyPanel.tsx`), skrevet til Supabase-tabellen `governance_policies`:

1. **Budsjettstruktur** (flervalg, ikke gjensidig utelukkende):
   - `orgBudgetOnly` — én felles pott
   - `teamBudgets` — org-budsjett fordeles til hvert team → aktiverer teambudsjett-kolonner i Teamoversikt og team-gauges i budsjettseksjonen
   - `individualQuotas` — hver bruker får personlig kvotegrense → aktiverer Kvote/Utnyttelse-kolonner i Brukeroversikt
2. **Håndhevelse**: `soft` (advarer, blokkerer ikke) eller `hard` (blokkerer bruker ved 100% av kvote)
3. **Chargeback**: `disabled` / `team` / `individual` (definert, foreløpig ikke visualisert i egen komponent)
4. **Personvern/transparency** — 6 toggles som styrer hvem som ser hva:
   - `showIndividualToOrgAdmin` — vis navn i org-dashbordet (av/på styrer "Anonymiser"-knappen i Brukeroversikt)
   - `showIndividualToTeamAdmin`, `anonymizationForTeamAdmin` — forberedt for TeamAdminView (ikke bygget ennå)
   - `showIndividualToDeveloper`, `showChargebackToDeveloper` — forberedt for DeveloperView (ikke bygget ennå)
   - `showForecast` — styrer prognose-modul (ikke bygget ennå)

Alle setters (`setBudgetStructure`, `setEnforcement`, `setChargeback`, `setTransparency`) oppdaterer Zustand-state optimistisk og upserter deretter til Supabase i samme kall.

---

## 5. Supabase-tabeller ("endepunktene")

Alle kall går gjennom `src/services/*.ts`, som mapper snake_case (DB) ↔ camelCase (app) og faller tilbake til mock ved feil/manglende config.

| Tabell | Service | Operasjoner | Nøkkelfelt |
|--------|---------|-------------|------------|
| `organizations` | `orgService.ts` | `fetchOrganization()` (limit 1, single), `updateOrganizationBudget(id, credits)` | `total_budget_credits`, `currency`, `tokens_per_nok` |
| `teams` | `teamService.ts` | `fetchTeams(orgId)`, `createTeam`, `updateTeam`, `deleteTeam` | `allocated_credits`, `manager_user_id` |
| `users` | `userService.ts` | `fetchUsers(orgId)`, `createUser`, `updateUser`, `deleteUser` | `team_id`, `role`, `simulation_profile`, `quota_credits`, `is_enabled` |
| `governance_policies` | `policyService.ts` | `fetchPolicy(orgId)` (maybeSingle), `upsertPolicy(orgId, policy)` (onConflict: `organization_id`) | `budget_structure`, `enforcement`, `chargeback`, `transparency` (alle jsonb) |

RLS er deaktivert — appen bruker anon key direkte fra klienten uten autentisering (bevisst valg for internt demo-verktøy, ikke egnet for ekstern drift).

Org-mutasjoner, team-mutasjoner og bruker-mutasjoner (`addTeam`/`editTeam`/`removeTeam`, `addUser`/`editUser`/`removeUser`, `setOrgBudget`) finnes allerede i `useOrgStore`, men **ingen UI kaller dem ennå** — admin-panel for CRUD er i "gjenstår"-lista.

---

## 6. Prismodell og kredittkonvertering

Kildedata: `context_modeltokencost.json` (lastet direkte av `src/data/pricing.ts` — redigeres i JSON-en, ikke i TS-filen).

- **1 kreditt = $0.01 = 0.11 NOK** (fra `fundamentals.credit_to_usd` / `credit_to_nok` i JSON-en)
- **Token → kreditt**: 75% av tokens regnes som input, 25% som output (`tokensToCredits` i `src/utils/cost.ts`), kostnad slås opp per modell (`inputPerMillion`/`outputPerMillion` i USD), konverteres til kreditter
- Modeller med `tier === 'included'` (f.eks. GPT-5 mini) er gratis — `tokensToCredits` returnerer 0
- **To-lags budsjettmodell** (`calcBudgetStatus` i `cost.ts`):
  - Fase 1: hver betalende bruker (alle unntatt org_admin) har `INCLUDED_CREDITS_PER_USER` (3 900 kr/mnd) forhåndsbetalt i abonnementet
  - Fase 2: når en bruker overskrider sine 3 900, trekkes overskuddet (`overflowCredits`) fra en felles org-pott på `ORG_OVERFLOW_BUDGET_NOK` (15 000 NOK)

---

## 7. Simuleringsmotor

`useSimulation()`-hooken (kjørt inne i `OrgAdminView`) driver en `setInterval`-loop med intervall styrt av hastighet (×1 = 1000ms, ×5 = 200ms, ×20 = 50ms). Per tick, for hver aktiv (ikke-blokkert) bruker:

1. `generateTokens(profile)` — trekker et tokenbeløp basert på brukerens simuleringsprofil (kan returnere 0 = idle denne ticken)
2. `pickModel(profile)` — vekter en tilfeldig modell basert på profilens `modelWeights` (simulerer Copilots "auto"-modellvelger — samme bruker kan treffe ulike modeller fra hendelse til hendelse)
3. `addUsage(userId, tokens, modelId)` — konverterer til kreditter og akkumulerer i `useOrgStore` (bruker- og teamnivå)
4. Kvote-/budsjettsjekk mot aktive governance-lag:
   - Individuell kvote → `quota_warning_75/90` / `quota_exceeded` (blokkerer bruker hvis `enforcement === 'hard'`)
   - Teambudsjett → `budget_exhausted` (critical) hvis teambudsjetter er aktivert
   - Org-budsjett → `org_budget_critical` hvis total org-bruk ≥ 90%
5. Pusher en `SimulationEvent` til event-feeden (maks 100 lagres, nyeste først)
6. Akkumulerer NOK-delta i en ref; hver 10. tick (`HISTORY_INTERVAL`) skrives et `HistoricalDataPoint` (org/team/bruker NOK-delta) til `history` (maks 2000 punkter) til bruk i trendgrafen

**Simulert kalender** (`simulation/clock.ts`): uavhengig av wall-clock. Simuleringen starter 2026-06-01, og én tick = én simulert time, uansett avspillingshastighet. Dette gjør at trendgrafens dag/uke/måned/år-bøtting alltid er meningsfull uavhengig av hvor lenge simuleringen faktisk har kjørt i sanntid.

**Fire simuleringsprofiler** (`simulation/profiles.ts`), hver koblet til reelle Copilot/modell-vekter:
- **Normal Developer** — mest Claude Sonnet 4.6, moderat volum, 30% idle-sjanse
- **Power User** — mest Claude Opus 4.8, mye Agent Mode (15%) og store kontekstvinduer
- **Intern** — mest gratis/inkluderte modeller, svært lavt volum, 60% idle-sjanse
- **Experimental User** — bred spredning over alle modeller, uforutsigbart, opptil 15k tokens per hendelse

---

## 8. Views — hva som faktisk vises

### OrgAdminView (ferdig, tre faner)

Trigger `useSimulation()` — simuleringen kjører kun mens denne viewen er aktiv (dvs. kun som org_admin).

- **Dashboard-fane**:
  - `OrgBudgetSection` — alert-banner (overflow >90%, blokkerte brukere, brukere i overflow, team over 90%), forklaringsboks for to-lags modellen, 4 stat-kort (inkludert kvote brukt, overflow brukt, total kostnad, aktive brukere — alle med detaljerte tooltips), to `QuotaGauge`-er (Fase 1 inkludert / Fase 2 overflow) + team-gauges hvis teambudsjetter er aktivert, og `UsageTrendChart` (NOK over tid, dag/uke/måned/år, med referanselinje ved prismodell-overgangen 2026-06-01)
  - `TeamOverviewSection` — tabell: team, leder, medlemmer, forbruk (NOK, med hover-tooltip for rå tokens/kreditter og fordeling per modell), tildelt budsjett + utnyttelsesbar (kun hvis teambudsjetter aktivert), sortert etter forbruk
  - `UserOverviewSection` — tabell: bruker (kan anonymiseres til "Bruker A/B/C" via toggle, styrt av transparency-policy), team, profil, forbruk (med samme modell-breakdown-tooltip), kvote + utnyttelsesbar (kun hvis individuelle kvoter aktivert), blokkert-status
- **Governance-policyer-fane**: `PolicyPanel` — alle fire lag som toggles/knapper, skriver direkte til Supabase ved hver endring
- **Live hendelser-fane**: full `LiveEventFeed` med siste 100 hendelser, fargekodet etter alvorlighetsgrad

### TeamAdminView — placeholder

Viser kun team-navn og "Team-dashboard lastes inn her." Ingen simulering trigges (siden `useSimulation()` kun kalles fra OrgAdminView). Planlagt: team-kvote-gauge, teammedlemmer med individuell bruk (arver anonymiseringspolicy), team-filtrert event-feed, kvoteredigering for egne medlemmer.

### DeveloperView — placeholder

Viser kun brukernavn og "Developer-dashboard lastes inn her." Planlagt: personlig kvote-gauge, eget forbruk vs. inkludert kvote, aggregert team-status, org-status (trafikklys), varsler ved 75/90/100%.

### Delt UI (TopBar, alltid synlig)

- **SimulationControls** — Play/Pause, hastighetsvalg ×1/×5/×20, Reset (nullstiller både `useSimulationStore` og `useOrgStore.resetUsage()` — persistent Supabase-data berøres ikke)
- **RoleSwitcher** — dropdown gruppert på rolle (org_admin/team_admin/developer), bygget dynamisk fra faktiske brukere i `useOrgStore`. Bytte av identitet er ren client-state, ingen autentisering.

---

## 9. Kjent teknisk gjeld

Se `CLAUDE.md` for oppdatert liste — kort oppsummert: `tokensPerNok`-feltet på Organization er legacy og ubrukt (reell konvertering går via `cost.ts`/`pricing.ts`), event-feeden kan bli støyete ved ×20 med mange brukere (ingen debouncing ennå), `total_budget_credits` i Supabase het opprinnelig `total_budget_tokens` (nå korrigert), og appen har ingen autentisering — kun egnet for intern demobruk.
