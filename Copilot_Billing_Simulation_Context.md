# GitHub Copilot Token Billing Simulation — Prosjektkontekst

**Sist oppdatert:** 30. juni 2026  
**Prosjekt:** AI-styringsrammeverk for GitHub Copilot-kreditter  
**Fase:** Discover (kvalitativ forsking) + Develop (konsepttesting)

---

## Bakgrunn og problem

GitHub Copilot skiftet fra sitepris (engangsgebyr per bruker) til token-basert prising i 2026. Dette krever en ny governancemodell for hvordan kreditter fordeles, budsjetteres og kontrolleres i organisasjonen.

**Kjernespenning:** Team-basert vs. person-basert allokering.
- Team-basert: enkel administrasjon, men urettferdig for utviklere som jobber på tvers av prosjekter
- Person-basert: presist og rettferdig, men krever detaljert forvaltning og kan føles overvåkende

**Kontekst:** ~50 utviklere på tvers av flere divisjoner.

---

## Design-metodikk: Double Diamond

Prosessen følger **British Design Council Double Diamond** (formalisert 2005, oppdatert 2019) og ISO 9241-210 (human-centered design).

### Faser
1. **Discover** (nå) — kvalitativ og kvantitativ forsking
   - Sekundærforskning (GitHub-dokumentasjon, prising)
   - Dybdeintervjuer med 2 utviklere (semi-strukturert, 30 min)
   - Spørreundersøkelse til ~50 utviklere
   
2. **Define** (etter datainnsamling) — affinity mapping, stakeholder mapping, problem statement
   
3. **Develop** (Q3 2026) — konseptutvikling, ko-design workshops, iterasjon på feedback
   
4. **Deliver** (Q4 2026) — pilotimplementering, rammeverk-dokument, governance-prosess

---

## Tre temaer som driver rammeverket

### 1. Personlig driver
- Utviklerautonomi
- Opplevd rettferdighet
- Ikke føle seg overvåket
- Friksjonsfri tilgang
- Rollevariasjoner i behov

### 2. Organisatorisk driver
- Kostnadskontroll og synlighet
- Rettferdig fordeling
- Enkel forvaltning (skalerbarhet)
- Strategisk prioritering
- Governance-prosess

### 3. Teknisk driver
- GitHub Copilot ULB-pooling vs. per-person-grenser
- Cost center-granularitet (prosjekt vs. team vs. person)
- Enterprise budget-logikk
- Overvåkings- og rapporteringsverktøy
- Automatisk tilpasning eller manuell justering

---

## Intervju-mal og tilnærming

**Mål:** Få rik kvalitativ innsikt som former rammeverket, og teste hvilke termer/formuleringer som resonerer for surveyen.

**Struktur (30 min, semi-strukturert):**
1. Oppvarming (5 min) — kontekst, algemne holdninger
2. Bruksmønstre (10 min) — hvor bruker de Copilot, hva gjør dem effektive
3. **Styring og roller (10 min — kjernen)**
   - Hvem forstår best hva du trenger av verktøy? (ikke foreslå prosjektleder)
   - Hvem bør sette grense for bruk, og hvem bør se det?
   - Hvem har ansvar for Copilot-generert kode?
   - Tenker du på kostnad når du bruker det?
4. Gullspørsmål (5 min)
   - Hvis Copilot forsvant, hva ville du savnet?
   - Hva har organisasjonen misforstått om AI i utvikling?

**Etterfølgende:** Spørreundersøkelse til alle ~50 utviklere for kvantitativ bekrefting.

---

## Token-bruk case: Eksempel på simulering

Målet er å vise hvordan ulike allokeringsmodeller påvirker den samme gruppen.

### Team A (høyt bruk)
| Person | Token | Kostnad (1 mill = 100 NOK) | % av team |
|--------|-------|--------------------------|-----------|
| Per    | 1 mill | 100 000 NOK | 21% |
| Ole    | 3.2 mill | 320 000 NOK | 68% |
| Knut   | 0.5 mill | 50 000 NOK | 11% |
| **Totalt** | **4.7 mill** | **470 000 NOK** | **100%** |

### Team B (lavt bruk)
| Person | Token | Kostnad | % av team |
|--------|-------|---------|-----------|
| Per    | 10 k | 1 000 NOK | 3% |
| Ole    | 5 k | 500 NOK | 2% |
| Knut   | 300 k | 30 000 NOK | 95% |
| **Totalt** | **315 k** | **31 500 NOK** | **100%** |

**Observasjoner:**
- 15x kostnadsdifferanse mellom teamene
- Ulik fordeling innenfor hvert team (Ole er "power user" i A, Knut i B)
- Samme navn, helt annen rolle/oppgave — viser variasjonen i organisasjonen

---

## Mulige allokeringsmodeller å teste

### 1. Rollebasert tildeling
Kreditter tildeles etter stilling (seniorutvikler > junior > designer).
- ✓ Enkel å forsvare politisk
- ✗ Ignorerer faktisk bruksmønster

### 2. Bruksbasert justering (kvartalsvis)
Start med standard nivå, juster basert på historisk forbruk.
- ✓ Rettferdig over tid
- ✗ Krever god observerbarhet

### 3. Delt pool med overvåking
Alle trekker fra felles enterprise-pool. Ingen individuelle grenser, men dashbord viser forbruk per person/team.
- ✓ Friksjonsfritt for bruk
- ✗ Kostnadskontroll avhenger av kultur

### 4. Prosjektbasert allokering
Budsjett kobles til prosjekt, ikke person. Person trekker fra det prosjektet de jobber med nå.
- ✓ Rettferdig for kryssprosjekt-arbeid
- ✗ Mer administrativ kompleksitet

---

## Nøkkelspørsmål for rammeverket

Disse må besvares før Du velger modell:

1. **Hvem eier AI-kostnadene?** IT sentralt, teamleder, prosjektleder, eller den enkelte?
2. **Hvor transparent skal forbruket være?** Hvem kan se hverandres tall?
3. **Hva skjer ved kryssprosjekt-arbeid?** Hvem betaler når Per jobber på både Prosjekt X og Y?
4. **Er blokkering (hard limit) akseptabel?** Eller må det alltid være fallback?
5. **Hvordan håndteres nye mennesker?** Estimat eller baseline?
6. **Hvordan signaliserer vi at dette er en ressurs som skal brukes ansvarlig?** Uten å gjøre det overvåkende.

---

## Terminologi (bruk i surveyer og dokumenter)

**Kreditter** — det mennesker tildeles og bruker  
**Tokens** — det som faktisk konsumeres i GitHub sin system  
**Allokering** — hvordan kreditter fordeles (rolle, historisk bruk, prosjekt)  
**Pooling** — felles reserve som flere kan trekke fra  
**ULB** — Unit-Level Billing (GitHub sitt term for hvor grensene settes)  
**Enterprise budget** — sentralt budsjett som Cost Centers skal følge  
**Cost Center** — organisatorisk enhet som står for kostnader (team, divisjon, prosjekt)

---

## Artefakter og leveranser

### I Discover/Define
- ✓ Intervjumal (Word-dokument)
- ✓ Spørreundersøkelse (Google Forms eller lignende)
- ✓ Affinity map (fra intervju + survey data)
- ✓ Stakeholder map (roller som påvirkes)
- ✓ Problem statement (én setning som definerer det vi skal løse)

### I Develop
- Konseptdokument (3–5 allokeringsmodeller, detaljert)
- Simuleringsverktøy (interaktivt, testet med ledelse)
- Ko-design workshop-plan (involv interessenter)

### I Deliver
- Governance-rammeverk (fulldokument)
- Implementeringsplan (pilot + rollout)
- Kommunikasjonsplan (for alle utviklere)
- KPI-set (hvordan måler vi at det fungerer)

---

## Tekniske notater for simulering

**Simuleringsverktøy skal:**
1. Akseptere input: team-størrelse, estimert tokenbruk per person, allokeringsmodell
2. Beregne: total kostnad, kostnad per person, fordeling (%)
3. Visualisere: sammenligning mellom modeller, trendanalyse
4. Eksportere: CSV eller PDF-rapport

**Ikke** bygge et fullt accounting-system — dette er en test-og-lærings-simulering.

---

## Møter og milepæler

- **8. juli 2026:** Dybdeintervjuer (2x utviklere, 30 min hver)
- **15. juli 2026:** Spørreundersøkelse sendt ut til alle ~50 utviklere
- **1. august 2026:** Data-analyse, affinity mapping, problem statement klar
- **15. august 2026:** Konsepter klar, første workshop
- **1. september 2026:** Rammeverk-dokument til ledelsesgjennomgang
- **1. oktober 2026:** Pilot med 1–2 team
- **1. november 2026:** Full rollout (planlagt)

---

## Kontakter og roller

**Johannes** — AI-styring, forskning, rammeverk-design  
**[Ledelse]** — prioritering, budsjettbeslutninger  
**[Teknikk/GitHub-admin]** — implementering, konfigurering av ULB  
**[Interessenter fra intervjuene]** — sparring og validering underveis

---

## Kilder og referanser

- British Design Council Double Diamond (2005, oppdatert 2019)
- ISO 9241-210:2019 (human-centered design)
- GitHub Copilot billing dokumentasjon (juni 2026)
- Interne data: tokenbruk per utvikler (Case A og B)

---

**Hensikt med kontekstfilen:** Denne skal legges ved når du starter på simuleringsverktøyet, slik at hele teamet ditt (og eventuelt eksterne, som GitHub TAMs) har samme forståelse av problemet, prosessen og målene.
