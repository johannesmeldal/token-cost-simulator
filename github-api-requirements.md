# GitHub Copilot API — Krav og spørsmål til møte

**Dato:** 2026-07-01  
**Formål:** Avklare hvilke GitHub-endepunkter som er tilgjengelige for å erstatte eller supplere simulert data i AI Governance Simulator.

---

## Kontekst og forutsetninger

Simulatoren modellerer et to-lags budsjett:

- **Lag 1 – Inkluderte kreditter:** 18 brukere × 3 900 kreditter/mnd = 70 200 kr inkludert i abonnementet
- **Lag 2 – Overflow-pool:** 15 000 NOK org-budsjett som trekkes når én bruker overskrider sine inkluderte kreditter

GitHub Business støtter i dag **cost center-budsjetter med hard stop**. Simulatoren bygger på den samme logikken, men legger til:

- Visualisering av akkumulert forbruk løpende (ikke bare ved grense)
- Varsler ved 75 % og 90 % av budsjett før hard stop
- Individuell kvote per bruker (utover cost center-nivå)
- Historiske trender per team og bruker

---

## Data simulatoren trenger — prioritert

### Høy prioritet (kjernefunksjonalitet)

| # | Data | Granularitet | Brukes til |
|---|------|-------------|-----------|
| 1 | Akkumulert forbruk per bruker | Per dag (minimum) | Brukerkvote-gauge, brukertabell |
| 2 | Akkumulert forbruk per cost center | Per dag (minimum) | Team-budsjett-gauge, teamtabell |
| 3 | Totalt org-forbruk | Per dag (minimum) | Org-budsjett-oversikt, trend-graf |
| 4 | Budsjettgrense per cost center | Statisk konfig | Vise % brukt av tildelt budsjett |
| 5 | Liste over brukere og hvilket cost center de tilhører | Statisk | Bygge team/bruker-hierarki |

### Medium prioritet

| # | Data | Granularitet | Brukes til |
|---|------|-------------|-----------|
| 6 | Daglig forbrukshistorikk (siste 30 dager) | Per dag per bruker/team | Trend-graf |
| 7 | Om en bruker er blokkert (hard stop aktivert) | Statisk/event | Vise blokkeringsstatus i UI |
| 8 | Antall aktive seter (brukte vs. tildelte) | Per måned | Seat utilization |

### Lav prioritet

| # | Data | Granularitet | Brukes til |
|---|------|-------------|-----------|
| 9 | Forbruk per modell (Sonnet vs. Opus) | Per dag | Kostnadsfordeling per modelltype |
| 10 | Forbruk per editor (VS Code, JetBrains osv.) | Per dag | Editor-analyse |

---

## Kjente GitHub-endepunkter

Disse er dokumentert i GitHub REST API og bør være tilgjengelige på Business-plan:

### Org-nivå

```
GET /orgs/{org}/copilot/usage
```
Returnerer daglige bruksmetrikker for hele org: aktive brukere, antall forslag, tokens fordelt på modell og editor.

```
GET /orgs/{org}/copilot/billing
```
Returnerer seat-informasjon: totalt antall seter, aktive seter, plan-type.

---

### Team-nivå

```
GET /orgs/{org}/teams/{team_slug}/copilot/usage
```
Samme struktur som org-endepunktet, men filtrert til ett team. **Forutsetter at GitHub-teams tilsvarer cost centers** — dette må bekreftes.

---

### Bruker-nivå

```
GET /orgs/{org}/members/{username}/copilot
```
Returnerer seat-tilordning for én bruker: plan, status (aktiv/inaktiv), sist aktiv.

```
GET /orgs/{org}/copilot/billing/selected_users
```
Liste over alle brukere som har fått tildelt Copilot-tilgang i org.

---

### Seat management (enforcement)

```
DELETE /orgs/{org}/copilot/billing/selected_users
```
Fjerner Copilot-tilgang for én eller flere brukere. Dette er den eneste native "hard stop"-mekanismen GitHub eksponerer i dag utover cost center-grenser.

---

### Cost centers (ubekreftet — må avklares)

GitHub Business introduserte cost centers med budsjett og hard stop. Det er uklart om disse eksponeres via REST API eller kun administreres i GitHub-grensesnittet.

```
GET /orgs/{org}/settings/billing/cost-centers          (antatt)
GET /orgs/{org}/settings/billing/cost-centers/{id}/usage  (antatt)
```

---

## Spørsmål til GitHub-admin / billing owner

### Om tilgjengelighet — ja/nei

1. Er `GET /orgs/{org}/copilot/usage` aktivert for vår org i dag?
2. Er `GET /orgs/{org}/teams/{team_slug}/copilot/usage` tilgjengelig?
3. Finnes det et API-endepunkt for å lese cost center-budsjetter og forbruk, eller er dette kun tilgjengelig i GitHub-grensesnittet?
4. Returnerer bruks-API-et akkumulert forbruk per bruker, eller kun org/team-aggregater?

### Om dataformat og ferskhet

5. Hva er dataforsinkelsen på bruks-endepunktene — daglig aggregat (24t lag) eller near-real-time?
6. Returnerer API-et historikk (f.eks. siste 28 dager) eller kun inneværende periode?
7. Er forbruk eksponert i tokens, GitHub-kreditter, USD, eller alle tre?

### Om cost center-logikk

8. Kan én bruker tilhøre flere cost centers, eller er det én bruker → ett cost center?
9. Tilsvarer et GitHub-team ett cost center, eller er det separate konsepter som kan konfigureres uavhengig?
10. Sender GitHub varsler (webhook/e-post) når et cost center nærmer seg grensen, eller er hard stop eneste mekanisme?
11. Kan budsjettgrenser per cost center leses og settes via API, eller kun manuelt i UI?

### Om fremtidig retning

12. Har GitHub annonsert endepunkter for finer-grained enforcement (per bruker, per modell) på roadmapen?
13. Støtter planen webhook-notifikasjoner ved budsjettoverskridelse, eller må vi polle API-et?

---

## Oppsummering — hva simulatoren kan erstattes med

| Funksjon i simulator | Kan erstattes med ekte data | Forutsetning |
|---------------------|-----------------------------|-------------|
| Org-budsjett gauge | Ja — via `/copilot/usage` | API er aktivert |
| Team-budsjett gauge | Ja — via `/teams/{slug}/copilot/usage` | Teams = cost centers |
| Bruker-forbrukstabell | Delvis — daglig aggregat, ikke live | API returnerer per-bruker data |
| Historisk trend-graf | Ja — siste 28 dager | API returnerer historikk |
| Live event-feed | Nei — GitHub har ingen per-prompt event stream | N/A |
| 75%/90% varsler | Nei nativt — må bygges på toppen av polling | Krever egenutviklet logik |
| Hard stop per bruker | Delvis — via seat removal API | Manuell eller automatisert |
| Hard stop per cost center | Ja nativt i GitHub Business | Allerede tilgjengelig |

**Konklusjon:** Daglige bruksdata fra GitHub kan mate trend-grafene og budsjett-gaugesene med reelle tall. Live event-feed og graduated varsler (75%/90%) er tilleggslag som GitHub ikke leverer nativt — disse er den primære verdien av å bygge noe på toppen.
