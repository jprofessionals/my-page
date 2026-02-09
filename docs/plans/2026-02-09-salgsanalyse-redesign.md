# Salgsanalyse-side: Redesign med drill-down og evaluering

## Bakgrunn

Dagens analyseside (`/salgstavle-analytics`) viser overfladiske KPI-er og tellere uten mulighet til å grave dypere. Flere seksjoner (KPI-kort og periodesammenligning) forteller i stor grad det samme. Det mangler innsikt i hvorfor vi vinner/taper, hvordan enkeltpersoner presterer, hva konsulentbasen kan levere, og hvilke kunder vi lykkes hos.

## Overordnet design

Siden redesignes fra en flat scrollbar side til en **fane-basert** struktur med 5 faner:

| Fane | Formål |
|------|--------|
| Oversikt | KPI-er, trender, funnel (ryddet opp) |
| Evaluering | Hvorfor vi vinner og taper, match-kvalitet, kundeerfaring |
| Konsulenter | Per-konsulent drill-down med oppdragshistorikk |
| Konsulentbasen | Kapasitet, sektor-fordeling, skill gap-analyse |
| Kunder | Kundeanalyse med sektor, win rate, leverandøranalyse |

## Datamodell-endringer

### 1. Nytt felt: Customer.sector

Nytt enum-felt på Customer-entiteten.

```
enum CustomerSector {
  PUBLIC,    // Offentlig
  PRIVATE,   // Privat
  UNKNOWN    // Ikke klassifisert
}
```

- Liquibase-migrering: legg til `sector VARCHAR(20) DEFAULT 'UNKNOWN'` på `customer`-tabellen
- Oppdater Customer-entitet med feltet
- Oppdater OpenAPI-spec med sector-enum og felt på Customer-schema
- Legg til redigeringsmulighet i frontend (enkel dropdown)

### 2. Nye evalueringsfelt på SalesActivity

Legges direkte på SalesActivity-entiteten (ikke egen entitet - det er alltid 1:1):

```
matchRating: Int? (1-5)           -- Hvor godt traff CV mot krav
evaluationNotes: String? (TEXT)    -- Fritekst om hva som var avgjorende
evaluationDocumentUrl: String?     -- Lenke til tilbakemeldingsdokument
keyFactors: String? (TEXT)         -- Kommaseparerte enum-verdier
```

KeyFactors enum-verdier:
- `PRICE` - Pris var avgjorende
- `EXPERIENCE` - Relevant erfaring
- `AVAILABILITY` - Tilgjengelighet/oppstartstidspunkt
- `CUSTOMER_FIT` - God kundematch/kjemi
- `TECHNICAL_MATCH` - Teknisk kompetansematch
- `REFERENCES` - Referanser/tidligere oppdrag
- `OTHER` - Annet

Liquibase-migrering: 4 nye kolonner på `sales_activity`-tabellen.

### 3. Evalueringsskjema ved lukking

Utvide eksisterende `MarkAsWonModal` og `closeActivity`-flyten:
- Ved **vunnet**: vis evalueringsskjema med matchRating, keyFactors, evaluationNotes, documentUrl
- Ved **tapt**: vis eksisterende closedReason + nytt evalueringsskjema (matchRating, keyFactors, evaluationNotes, documentUrl)
- Evaluering fylles ut av den som lukker aktiviteten

## Fane 1: Oversikt

### Fjernes
- De 3 periodesammenligningskortene (måned/kvartal/år med vunnet/tapt/besvart) - overlapper med KPI-kort og trenddiagram

### Beholdes (forbedret)
- **4 KPI-kort**: Aktive prosesser, Vunnet i år (med vs forrige år), Besvart i år (med vs forrige år), Win Rate
- **Salgsaktivitet-linjediagram**: besvart/vunnet/tapt per måned
- **Lediggang-linjediagram**: ukeverk ledig per måned
- **Pipeline funnel**: horisontalt funnel-diagram med periodefilter

### Legges til
- **Nytt KPI-kort: Snitt dager til lukking** - `averageDaysToClose` finnes i backend men vises ikke
- **Aktiviteter per kilde** - bar chart med fordeling per JobPosting.source (Direkte, Mellomledd, Rammeavtale direkte, Rammeavtale underleverandør, Annet)

### Backend-endringer
- Utvid analytics-endepunktet med `activitiesBySource: Map<JobPostingSource, Int>`. Krever join mellom SalesActivity og JobPosting (via tittel/kunde-matching eller ny FK).

## Fane 2: Evaluering

### Seksjon 1: Tapsarsaker
- Horisontalt bar chart: fordeling av `closedReason` (alle 8 verdier)
- Filtrerbart pa tidsperiode (3/6/12 mnd, i ar, all tid)
- **Drill-down**: klikk pa en arsak → ekspanderer til liste med aktiviteter (konsulent, kunde, tittel, closedReasonNote)

### Seksjon 2: Vinn-/tapstrend over tid
- Linjediagram: tapsarsaker per maned
- Viser om arsaken til tap endrer seg over tid

### Seksjon 3: Match-kvalitet
- Gjennomsnittlig `matchRating` for vunnet vs tapt
- Bar chart / histogram: fordeling av match-rating for vunnet og tapt
- Innsikt: "Vinner vi nar vi matcher godt?"

### Seksjon 4: Kundeerfaring-effekt
- Automatisk utledet fra data: har konsulenten tidligere vunnede oppdrag hos samme kunde?
- Viser win rate **med** vs **uten** tidligere kundeerfaring
- Enkel tabell med to rader

### Seksjon 5: Drill-down tabell
- Alle avsluttede aktiviteter: Konsulent, Kunde, Utfall, Match-rating (stjerner), Tapsarsak, Nokkelfaktorer, Varighet
- Klikk for full evalueringsdetaljer (notes, dokumentlenke, nokkelfaktorer)
- Filtrerbart pa utfall (vunnet/tapt), tidsperiode, kunde

### Backend-endringer
- Nytt endepunkt eller utvid analytics: `GET /sales-pipeline/analytics/evaluations`
- Returnerer: closedReason-fordeling, match-rating-statistikk, kundeerfaring-korrelasjon
- Query: grupper avsluttede aktiviteter pa closedReason, beregn match-rating-snitt per utfall, sjekk tidligere oppdrag per konsulent-kunde-par

## Fane 3: Konsulenter

### Hovedvisning: Konsulent-tabell
- **Alle** konsulenter (ikke bare topp 10), soekbar og sorterbar
- Kolonner: Konsulent | Status (availability badge) | Aktive | Vunnet | Tapt | Win Rate | Snitt dager til lukking
- Default sortering: flest aktive foerst

### Drill-down: Ekspanderbar rad per konsulent

**Oppsummering (oeverst i drill-down)**:
- Win rate for denne konsulenten
- Gjennomsnittlig match-rating
- Mest vanlige tapsarsak
- Tidligere kunder (fra vunnede oppdrag)

**Aktive prosesser**:
- Tabell: Kunde | Tittel | Stage (fargede badges) | Dager i prosess | Tilbudt pris

**Historikk**:
- Alle avsluttede aktiviteter, nyeste foerst
- Kunde | Tittel | Utfall (vunnet/tapt ikon) | Tapsarsak | Match-rating (stjerner) | Varighet | Pris
- Vunnede: viser actualStartDate
- Tapte: viser closedReason som lesbar tekst, closedReasonNote som tooltip
- Klikk pa rad → full evalueringsdetaljer

### Backend-endringer
- Utvid `ConsultantActivityStats` med: winRate, avgMatchRating, avgDaysToClose, mostCommonLossReason, previousCustomers
- Eventuelt nytt endepunkt: `GET /sales-pipeline/consultants/{id}/history` som returnerer alle aktiviteter med evalueringsdata

## Fane 4: Konsulentbasen

### Seksjon 1: Kapasitetsoversikt
- 4 kort: Totalt ansatte | Ledig na | Blir ledige (neste 1/2/3 mnd) | Opptatt
- Under kortene: **liste over kommende ledige** med navn, dato ledig, navarende kunde
- Mest handlingsbar info for salg

### Seksjon 2: Sektor-fordeling
- Bruker nytt `sector`-felt pa Customer
- Donut chart: konsulenter hos offentlig vs privat (utledet fra availability.currentCustomer.sector)
- Tabell: Kunde | Sektor | Antall konsulenter

### Seksjon 3: Teknologi-fordeling
- Bar chart: opptatte konsulenter fordelt per techCategory
- Utledet fra vunnede oppdrag koblet til jobpostings med techCategory
- Viser hva vi faktisk leverer pa na

### Seksjon 4: Skill gap-analyse
Sammenligner to datasett:

| Datasett | Kilde | Gruppering |
|----------|-------|------------|
| Etterspørsel | Alle jobpostings (filtrerbar periode) | techCategory |
| Leveranse | Vunnede aktiviteter (samme periode) | techCategory fra tilhørende jobposting |

- **Grouped bar chart**: For hver techCategory, to søyler side ved side:
  - Blå: "Forespurt" (antall jobpostings)
  - Grønn: "Vunnet" (antall vunnede aktiviteter)
- Gap mellom blå og grønn = kompetanse- eller kapasitetsmangel
- Tabell under med tallene + beregnet "hit rate" per kategori
- Filtrerbart på tidsperiode (6/12/24 mnd)

### Seksjon 5: Tagg-analyse
- Samme prinsipp som skill gap, men på tag-nivå
- Topp 15 mest etterspurte tags fra jobpostings, med antall forespurt vs vunnet
- Identifiserer spesifikke teknologier vi mangler
- Filtrerbart på tidsperiode

### Backend-endringer
- Nytt endepunkt: `GET /sales-pipeline/analytics/competency-base`
- Returnerer:
  - Kapasitetsfordeling (ledig/opptatt/kommende, med detaljer)
  - Sektor-fordeling (offentlig/privat med konsulentliste)
  - TechCategory-fordeling for opptatte konsulenter
  - Skill gap: techCategory med forespurt-count og vunnet-count
  - Tag-analyse: topp tags med forespurt-count og vunnet-count

Merk: Denne fanen er designet for å kunne utvides i fase 2 med Flowcase CV-data. Da kan en tredje søyle ("Kompetanse iflg. CV") legges til i skill gap-grafen.

## Fane 5: Kunder

### Seksjon 1: Kunde-tabell
- Alle kunder, soekbar og sorterbar
- Kolonner: Kunde | Sektor | Konsulenter na | Aktive prosesser | Vunnet | Tapt | Win Rate
- "Konsulenter na" = antall med currentCustomer hos denne kunden
- Default sortering: flest konsulenter forst

### Drill-down: Ekspanderbar rad per kunde
- **Navarende konsulenter**: hvem sitter der, med startdato
- **Aktivitetshistorikk**: alle aktiviteter for kunden (aktive + avsluttede), med konsulent, utfall, tapsarsak, match-rating
- **Win rate-utvikling**: trend over tid (om nok datapunkter)
- **Vanligste tapsarsak**: hos akkurat denne kunden

### Seksjon 2: Sektor-analyse
- Sammenligning offentlig vs privat (enkel tabell, to rader):
  - Sektor | Antall kunder | Utlysninger | Vunnet | Tapt | Win Rate

### Seksjon 3: Leverandor/mellomledd-analyse
- Data fra `supplierName` pa SalesActivity
- Tabell: Leverandor | Prosesser | Vunnet | Tapt | Win Rate
- Identifiserer hvilke mellomledd som gir best uttelling
- Klikk for drill-down til enkeltaktiviteter

### Seksjon 4: Kilde-analyse
- Fra `source` pa JobPosting
- Bar chart: volum og win rate per kilde (Direkte, Mellomledd, Rammeavtale direkte, Rammeavtale underleverandor)
- Svarer pa: "Vinner vi oftere pa direkte foresporsler eller via mellomledd?"

### Backend-endringer
- Utvid `CustomerActivityStats` med: sector, currentConsultantCount, winRate, mostCommonLossReason
- Nytt endepunkt eller utvid analytics: leverandor-statistikk fra supplierName-feltet
- Kilde-analyse: join mellom aktiviteter og jobpostings pa source-felt

## Kobling mellom SalesActivity og JobPosting

En forutsetning for kilde-analyse og skill gap er at vi kan koble en SalesActivity til en JobPosting. I dag finnes ingen direkte FK mellom disse.

### Tilnærming
Legg til et nullable felt `jobPosting` (FK) på SalesActivity:
- Liquibase: `job_posting_id BIGINT NULL` + foreign key
- Når en aktivitet opprettes fra en jobposting, settes koblingen
- Eksisterende aktiviteter forblir NULL (historisk data uten kobling)
- Gjor kilde- og skill gap-analyse mulig for nye data

## Teknisk oppsummering

### Nye Liquibase-migreringer
1. `customer` + `sector` kolonne (VARCHAR, default UNKNOWN)
2. `sales_activity` + `match_rating` (INT NULL)
3. `sales_activity` + `evaluation_notes` (TEXT NULL)
4. `sales_activity` + `evaluation_document_url` (VARCHAR NULL)
5. `sales_activity` + `key_factors` (TEXT NULL, kommaseparerte enum-verdier)
6. `sales_activity` + `job_posting_id` (BIGINT NULL, FK)

### OpenAPI-spec endringer
- CustomerSector enum
- Customer schema: + sector felt
- SalesActivity schema: + matchRating, evaluationNotes, evaluationDocumentUrl, keyFactors
- SalesActivity schema: + jobPostingId (nullable)
- KeyFactor enum
- Nye/utvidede analytics-respons-schemas for evaluering, konsulentbase, kundeanalyse
- Nye endepunkter for detaljert analytics

### Frontend-endringer
- Erstatt SalesPipelineAnalytics.tsx med fane-basert komponent
- Nye komponenter per fane
- Utvid MarkAsWonModal og close-flyten med evalueringsskjema
- Legg til sector-dropdown pa Customer-redigering
- Legg til jobPosting-kobling ved oppretting av SalesActivity

### Backend-endringer
- Customer entity + sector felt
- SalesActivity entity + evalueringsfelt + jobPosting FK
- KeyFactor enum
- Utvide SalesPipelineService med nye analytics-beregninger
- Nye/utvidede controller-endepunkter

## Fase 2 (senere, ikke del av denne planen)
- Flowcase CV-integrasjon: hent skills/teknologier fra konsulent-CVer
- Utvid skill gap-analyse med "kompetanse iflg. CV" som tredje dimensjon
- Kompetanseoversikt per konsulent basert pa CV-data
