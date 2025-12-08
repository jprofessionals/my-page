# Sales Pipeline (Salgstavle) - Implementeringsplan

## Prosjektoversikt

En digital versjon av whiteboardet for salgsaktiviteter som tracker konsulenter gjennom salgsprosessen. Løser problemet med manglende historikk og data fra det fysiske whiteboardet.

---

## Forretningskrav

### Kjernefunksjonalitet
- **Kanban-tavle**: Visualisere konsulenter i kolonner (Ledig → Interessert → Sendt til leverandør → Sendt til kunde → Tapt)
- **Drag-and-drop**: Flytte konsulenter mellom kolonner (som post-it lapper)
- **Parallelle prosesser**: Én konsulent kan ha mange aktive salgsprosesser samtidig
- **Automatisk fjerning**: Når en konsulent vinner oppdrag, fjernes den prosessen fra aktiv tavle
- **Historikk**: Lagre all bevegelse mellom steg med tidsstempler
- **Flere views**: Aktiv tavle, avsluttede salg (vunnet), tapte prosesser

### Datasporing (Analytics)
- Tid i hvert steg (dager fra Ledig → Interessert, etc.)
- Tid fra ansettelse til første salgsaktivitet
- Konverteringsrate per steg
- Gjennomsnittlig tid til plassering
- Historikk over tapte muligheter
- Antall parallelle prosesser per konsulent

### Brukerroller
- **Admin/Salgsleder**: Full tilgang, kan opprette/redigere/slette/flytte
- **Alle innloggede**: Kan se tavla (men ikke redigere)

---

## Datamodell

### Konsepter

**Konsulent-sentrert modell:**
- **Konsulenten** er hovedfokus - vi selger konsulenter
- Hver konsulent har én **tilgjengelighetsstatus** (ledig nå, blir ledig dato X, opptatt)
- Hver konsulent kan ha **flere parallelle salgsprosesser** mot ulike kunder
- En salgsprosess = én konsulent mot én kunde/oppdrag
- Vi begynner ofte å selge konsulenter FØR de faktisk blir ledige

**Merk:** Hvis flere konsulenter sendes til samme kunde, er det separate salgsprosesser (én per konsulent).

### Entiteter

#### 1. `ConsultantAvailability` (Tilgjengelighet)
| Felt | Type | Beskrivelse |
|------|------|-------------|
| id | Long (PK) | Primærnøkkel |
| consultant | User (FK, unique) | Konsulenten |
| status | AvailabilityStatus | AVAILABLE, AVAILABLE_SOON, OCCUPIED |
| availableFrom | LocalDate (nullable) | Dato konsulenten blir ledig |
| currentCustomer | Customer (FK, nullable) | Nåværende kunde (hvis OCCUPIED) |
| notes | String (nullable) | Notater om tilgjengelighet |
| updatedAt | LocalDateTime | Sist oppdatert |
| updatedBy | User (FK) | Hvem som oppdaterte |

#### 2. `AvailabilityStatus` (Enum)
| Verdi | Beskrivelse |
|-------|-------------|
| AVAILABLE | Ledig nå |
| AVAILABLE_SOON | Blir ledig på en gitt dato |
| OCCUPIED | Opptatt |

#### 3. `SalesActivity` (Salgsprosess for én konsulent)
| Felt | Type | Beskrivelse |
|------|------|-------------|
| id | Long (PK) | Primærnøkkel |
| consultant | User (FK) | **Konsulenten vi selger** |
| customer | Customer (FK, nullable) | Potensiell kunde |
| title | String | Beskrivelse av muligheten |
| currentStage | SalesStage | Hvor langt i prosessen |
| notes | String (nullable) | Notater |
| createdAt | LocalDateTime | Opprettet |
| updatedAt | LocalDateTime | Sist oppdatert |
| createdBy | User (FK) | Hvem som opprettet |
| status | ActivityStatus | ACTIVE, WON, LOST, WITHDRAWN |
| closedAt | LocalDateTime (nullable) | Når prosessen ble avsluttet |
| expectedStartDate | LocalDate (nullable) | Forventet oppstart |

#### 4. `ActivityStatus` (Enum)
| Verdi | Beskrivelse |
|-------|-------------|
| ACTIVE | Pågående salgsprosess |
| WON | Konsulenten fikk oppdraget |
| CLOSED_OTHER_WON | Auto-lukket - konsulenten vant et annet oppdrag |

#### 4b. `ClosedReason` (Enum - hvorfor prosessen ikke førte frem)
Brukes når status != ACTIVE og status != WON. Nullable felt på `SalesActivity`.

| Verdi | Beskrivelse | Typisk steg |
|-------|-------------|-------------|
| REJECTED_BY_SUPPLIER | Ble ikke valgt å sendes inn av leverandør | Sendt til leverandør |
| REJECTED_BY_CUSTOMER | Ble ikke valgt av kunde | Sendt til kunde |
| MISSING_REQUIREMENTS | Avvist pga. manglende må-krav | Alle steg |
| OTHER_CANDIDATE_CHOSEN | En annen kandidat ble valgt | Sendt til kunde |
| ASSIGNMENT_CANCELLED | Oppdraget ble kansellert | Alle steg |
| CONSULTANT_UNAVAILABLE | Konsulenten ble utilgjengelig | Alle steg |
| CONSULTANT_WON_OTHER | Konsulenten vant et annet oppdrag | Alle steg (auto) |
| OTHER | Annen grunn (se notater) | Alle steg |

**Oppdatert `SalesActivity` entitet:**
| Felt | Type | Beskrivelse |
|------|------|-------------|
| ... | ... | (eksisterende felt) |
| closedReason | ClosedReason (nullable) | Hvorfor prosessen ble avsluttet |
| closedReasonNote | String (nullable) | Utfyllende forklaring |

**Automatisk lukking:** Når en prosess markeres som `WON`, lukkes alle andre aktive prosesser for samme konsulent automatisk med `status = CLOSED_OTHER_WON` og `closedReason = CONSULTANT_WON_OTHER`.

#### 5. `SalesStage` (Enum - steg i salgsprosessen)
| Verdi | Visningsnavn | Beskrivelse |
|-------|--------------|-------------|
| PROSPECTING | Prospektering | Identifisert mulighet |
| INTERESTED | Interessert | Kunde har vist interesse |
| SENT_TO_SUPPLIER | Sendt til leverandør | CV sendt til mellomledd |
| SENT_TO_CUSTOMER | Sendt til kunde | CV sendt til sluttkunde |

#### 6. `SalesStageHistory` (Historikk)
| Felt | Type | Beskrivelse |
|------|------|-------------|
| id | Long (PK) | Primærnøkkel |
| activity | SalesActivity (FK) | Salgsprosessen |
| fromStage | SalesStage (nullable) | Forrige steg |
| toStage | SalesStage | Nytt steg |
| changedAt | LocalDateTime | Tidspunkt |
| changedBy | User (FK) | Hvem |
| daysInPreviousStage | Int (nullable) | Dager i forrige steg |

### Relasjoner
```
User 1:1 ConsultantAvailability (én tilgjengelighetsstatus)
User 1:N SalesActivity (en konsulent kan ha mange salgsprosesser)
SalesActivity 1:N SalesStageHistory (historikk per prosess)
Customer 1:N SalesActivity (flere konsulenter kan selges til samme kunde)
```

### Visualisering av tavla

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                            SALGSTAVLE                                         │
│                     (Fokus: Konsulenten vi selger)                            │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ KONSULENT          │ Prospektering │ Interessert │ Sendt lev. │ Sendt kunde  │
│ ═══════════════════╪═══════════════╪═════════════╪════════════╪══════════════│
│                    │               │             │            │              │
│ Ola                │               │ ┌─────────┐ │            │              │
│ 🟢 Ledig nå        │               │ │ Kunde A │ │            │              │
│                    │               │ └─────────┘ │            │              │
│ ───────────────────┼───────────────┼─────────────┼────────────┼──────────────│
│                    │               │             │            │              │
│ Kari               │ ┌─────────┐   │ ┌─────────┐ │ ┌─────────┐│              │
│ 🟡 Ledig 1/3       │ │ Kunde E │   │ │ Kunde C │ │ │ Kunde A ││              │
│                    │ └─────────┘   │ └─────────┘ │ │ Kunde B ││              │
│                    │               │             │ │ Kunde D ││              │
│                    │               │             │ └─────────┘│              │
│ ───────────────────┼───────────────┼─────────────┼────────────┼──────────────│
│                    │               │             │            │              │
│ Per                │               │ ┌─────────┐ │            │ ┌─────────┐  │
│ 🔴 Opptatt         │               │ │ Kunde A │ │            │ │ Kunde F │  │
│                    │               │ └─────────┘ │            │ └─────────┘  │
└───────────────────────────────────────────────────────────────────────────────┘

• Kari har 5 parallelle prosesser - 3 av dem i samme steg (Sendt til leverandør)!
  - Kunde E: Prospektering
  - Kunde C: Interessert
  - Kunde A, B, D: Alle sendt til leverandør
• Ola, Kari og Per selges alle til Kunde A (3 separate prosesser, ulikt steg)
• Kari blir ledig 1. mars, men vi selger henne allerede nå
• Per er opptatt, men vi selger ham til nye oppdrag likevel1
```

---

## API-endepunkter (OpenAPI)

### Consultant Availability (Tilgjengelighet)
| Metode | Endepunkt | Beskrivelse | Tilgang |
|--------|-----------|-------------|---------|
| GET | /consultants/availability | Alle konsulenter med tilgjengelighet | Alle |
| GET | /consultants/{userId}/availability | Tilgjengelighet for én konsulent | Alle |
| PUT | /consultants/{userId}/availability | Oppdater tilgjengelighet | Admin |

### Sales Activities (Salgsprosesser - konsulent-sentrert)
| Metode | Endepunkt | Beskrivelse | Tilgang |
|--------|-----------|-------------|---------|
| GET | /sales-activities | Alle aktive salgsprosesser | Alle |
| GET | /sales-activities/{id} | Én prosess med historikk | Alle |
| POST | /sales-activities | Opprett ny salgsprosess for en konsulent | Admin |
| PUT | /sales-activities/{id} | Oppdater prosess | Admin |
| PUT | /sales-activities/{id}/stage | Flytt til nytt steg | Admin |
| PUT | /sales-activities/{id}/won | Marker som vunnet | Admin |
| PUT | /sales-activities/{id}/lost | Marker som tapt | Admin |
| DELETE | /sales-activities/{id} | Slett prosess | Admin |

### Queries (konsulent-fokusert)
| Metode | Endepunkt | Beskrivelse | Tilgang |
|--------|-----------|-------------|---------|
| GET | /sales-activities/by-consultant/{userId} | Alle prosesser for én konsulent | Alle |
| GET | /sales-activities/by-customer/{customerId} | Alle konsulenter sendt til én kunde | Alle |
| GET | /sales-activities/won | Vunnede (arkiv) | Alle |
| GET | /sales-activities/lost | Tapte (arkiv) | Alle |

### Analytics (konsulent-fokusert)
| Metode | Endepunkt | Beskrivelse |
|--------|-----------|-------------|
| GET | /sales-activities/analytics/overview | Oppsummering |
| GET | /sales-activities/analytics/time-in-stage | Tid per steg |
| GET | /sales-activities/analytics/conversion | Konverteringsrater |
| GET | /sales-activities/analytics/by-consultant/{userId} | Statistikk for én konsulent |

---

## Frontend-komponenter

### Sider
| Rute | Beskrivelse |
|------|-------------|
| `/salgstavle` | Hovedvisning (Kanban-tavle) |
| `/salgstavle/vunnet` | Arkiv over vunnede salg |
| `/salgstavle/tapt` | Arkiv over tapte prosesser |
| `/salgstavle/analytics` | Dashbord med statistikk |
| `/salgstavle/historikk` | Tabell med all historikk |

### Komponentstruktur
```
components/sales-pipeline/
├── SalesPipelineBoard.tsx      - Kanban-tavle med kolonner
├── SalesPipelineColumn.tsx     - Én kolonne (steg)
├── SalesPipelineCard.tsx       - Ett kort (konsulent/mulighet)
├── SalesPipelineModal.tsx      - Opprett/rediger entry
├── SalesPipelineHistory.tsx    - Historikkvisning
├── SalesPipelineAnalytics.tsx  - Analytics dashbord
├── SalesPipelineFilters.tsx    - Filtrering (kunde, dato, etc.)
└── SalesPipelineArchive.tsx    - Arkiv-visning (vunnet/tapt)
```

### UI/UX
- Bruk `@dnd-kit/core` for drag-and-drop
- Radix UI komponenter for konsistens med resten av appen
- Kort viser: Konsulent-navn, kunde, dager i nåværende steg
- Fargekoding basert på tid i steg (grønn → gul → rød)

---

## Tekniske beslutninger

### Gjenbruk fra eksisterende kode
- `Customer` entitet brukes direkte (allerede finnes)
- `User` entitet utvides ikke, refereres via FK
- Følger samme mapper-mønster som `BudgetMapper`
- Bruker `@RequiresAdmin` for admin-operasjoner
- Følger OpenAPI-delegate pattern fra `JobPostingController`

### Nye avhengigheter (frontend)
- `@dnd-kit/core` - Drag-and-drop
- `@dnd-kit/sortable` - Sortering innenfor kolonner

### Database
- MySQL-kompatible typer
- Indekser på `consultant_id`, `customer_id`, `current_stage`, `is_active`
- Soft-delete via `is_active` flag (bevarer historikk)

---

## Avklarte spørsmål

| Spørsmål | Svar |
|----------|------|
| Tilgangskontroll | Alle kan SE, kun admin/salgsledere kan REDIGERE |
| Flere muligheter | JA - én konsulent kan ha mange parallelle prosesser |
| Slack-integrasjon | JA, men events avklares senere |
| Arkiv | JA - flere views inkludert vunnet og tapt |

---

## Implementeringsrekkefølge

### Fase 1: Backend Grunnlag ✅ FERDIG
- [x] 1.1 Liquibase changeset for nye tabeller (`db.changelog-200.016.xml`)
- [x] 1.2 Entity-klasser (ConsultantAvailability, SalesActivity, SalesStageHistory, enums)
- [x] 1.3 Repository-interfaces
- [x] 1.4 OpenAPI spec for alle endepunkter
- [x] 1.5 Service-lag med forretningslogikk (`SalesPipelineService.kt`)
- [x] 1.6 Controller/Delegate implementasjon (`SalesPipelineApiDelegateImpl.kt`)
- [x] 1.7 Integrasjonstester (`SalesPipelineTest.kt` - 6 tester)

### Fase 2: Frontend Grunnlag ✅ FERDIG
- [x] 2.1 Generere TypeScript-typer fra OpenAPI
- [x] 2.2 API-service funksjoner (`salesPipeline.service.ts`)
- [x] 2.3 Grunnleggende side-struktur (`/salgstavle`)
- [x] 2.4 Navigasjon i navbar (admin-only)
- [x] 2.5 Komponenter: Board, ConsultantRow, Card, Column, CreateActivityModal

### Fase 3: Kanban-tavle (Forbedringer)
- [ ] 3.1 Drag-and-drop funksjonalitet (@dnd-kit)
- [ ] 3.2 Modal for redigering av eksisterende aktiviteter
- [ ] 3.3 Inline-redigering av notater
- [ ] 3.4 Bekreftelsesdialog for sletting

### Fase 4: Arkiv og Historikk
- [ ] 4.1 Arkiv-visning (vunnet/tapt)
- [ ] 4.2 Historikk-visning per entry
- [ ] 4.3 Full historikk-tabell

### Fase 5: Analytics
- [ ] 5.1 Analytics-endepunkter (backend)
- [ ] 5.2 Analytics-dashbord (frontend)
- [ ] 5.3 Grafer og visualiseringer

### Fase 6: Polish
- [ ] 6.1 Filtrering og søk
- [ ] 6.2 Notifikasjoner (Slack)
- [ ] 6.3 Responsivt design
- [ ] 6.4 Integrasjonstester

---

## Neste steg

**Fase 1 og 2 er ferdige!** Neste steg er **Fase 3**: Kanban-tavle forbedringer - legge til drag-and-drop og redigering.