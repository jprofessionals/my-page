# Plan: Forbedre Salgsanalyse-siden med Trender og Grafer

## Mål

Legge til historisk innsikt i salgsanalyse-siden:
1. **Lediggang-graf** - ukeverk med ufrivillig lediggang per måned
2. **Salgsaktivitet-graf** - besvarte utlysninger + vunnet/tapt per måned
3. **KPI-kort med %-endring** - sammenligning med forrige periode
4. **ASSIGNED-status** - sporing av konsulenter som har vunnet men ikke startet

---

## Implementeringsstatus

- [x] **Fase 1: ASSIGNED-status og historikk**
  - [x] 1.1 Database: Legg til ASSIGNED i AvailabilityStatus enum
  - [x] 1.2 Database: Opprett availability_history tabell (db.changelog-200.026.xml)
  - [x] 1.2b Database: Opprett actual_start_date på sales_activity (db.changelog-200.027.xml)
  - [x] 1.3 Backend: AvailabilityHistory entity + repository
  - [x] 1.4 Backend: Oppdater updateConsultantAvailability() til å logge historikk
  - [x] 1.5 Backend: Oppdater markAsWon() til å sette ASSIGNED + startdato
  - [x] 1.6 Backend: Scheduled job for å sette OCCUPIED på startdato (ConsultantAssignedToOccupiedJob)
  - [x] 1.7 OpenAPI: MarkActivityWonRequest schema med actualStartDate
  - [x] 1.8 OpenAPI: Oppdater AvailabilityStats med assigned felt
  - [ ] 1.9 Frontend: Oppdater "Marker som vunnet" modal med startdato
  - [ ] 1.10 Frontend: Oppdater fargekoding for ASSIGNED status

- [ ] **Fase 2: Monthly Trends Endpoint**
  - [ ] 2.1 OpenAPI: Definer MonthlyTrendData schema
  - [ ] 2.2 OpenAPI: Definer /analytics/trends endpoint
  - [ ] 2.3 Backend: getMonthlyTrends() metode
  - [ ] 2.4 Backend: Queries for besvarte/vunnet/tapt per måned
  - [ ] 2.5 Backend: Beregning av lediggang (ukeverk)

- [ ] **Fase 3: Frontend Trend-grafer**
  - [x] 3.1 Frontend: Regenerer TypeScript-typer
  - [ ] 3.2 Frontend: Ny hook useSalesPipelineTrends()
  - [ ] 3.3 Frontend: Lediggang-graf med 3-mnd trend
  - [ ] 3.4 Frontend: Salgsaktivitet-graf (besvart/vunnet/tapt)
  - [ ] 3.5 Frontend: Tidsperiode-velger

- [ ] **Fase 4: KPI-kort med sammenligning**
  - [ ] 4.1 Backend: Utvid analytics med forrige-periode tall
  - [ ] 4.2 Frontend: Vis %-endring på KPI-kort

- [ ] **Fase 5: Test og verifisering**
  - [ ] 5.1 Test historikk-sporing
  - [ ] 5.2 Test trend-beregninger
  - [ ] 5.3 Test grafer i UI

---

## Tekniske Detaljer

### Ny Entity: AvailabilityHistory

```kotlin
@Entity
class AvailabilityHistory(
    @Id @GeneratedValue
    val id: Long = 0,

    @ManyToOne
    val consultant: User,

    @Enumerated(EnumType.STRING)
    val fromStatus: AvailabilityStatus?,

    @Enumerated(EnumType.STRING)
    val toStatus: AvailabilityStatus,

    val changedAt: LocalDateTime,

    @ManyToOne
    val changedBy: User?
)
```

### Ny DTO: MonthlyTrendData

```kotlin
data class MonthlyTrendData(
    val month: String,           // "2024-11"
    val created: Int,            // Besvarte utlysninger
    val won: Int,                // Vunnet
    val lost: Int,               // Tapt
    val benchWeeks: Double       // Ukeverk lediggang
)
```

### AvailabilityStatus Enum (oppdatert)

```kotlin
enum class AvailabilityStatus {
    AVAILABLE,       // Ledig nå (grønn)
    AVAILABLE_SOON,  // Blir ledig på dato (gul)
    ASSIGNED,        // Vunnet, venter på oppstart (blå) - NY
    OCCUPIED         // I oppdrag (rød)
}
```

### Lediggang-beregning

Konsulent teller som "ledig" hvis status er:
- AVAILABLE
- ASSIGNED (har vunnet men ikke startet)

Beregning per måned:
1. Finn alle AvailabilityHistory der toStatus = AVAILABLE eller ASSIGNED
2. Beregn dager konsulenten var i disse statusene den måneden
3. Summer: totalt_dager / 5 = ukeverk

---

## Filer som endres

### Backend
- `db/changelog/changes/db.changelog-200.0XX.xml` - Ny tabell + enum
- `entity/AvailabilityHistory.kt` - Ny entity
- `entity/AvailabilityStatus.kt` - Legg til ASSIGNED
- `repository/AvailabilityHistoryRepository.kt` - Nytt repository
- `service/SalesPipelineService.kt` - Historikk-logging + trends
- `openapi/api.yaml` - Nytt endpoint + typer

### Frontend
- `src/api.yaml` - Kopi fra backend
- `src/data/types/` - Regenerer med npm run build:openapi
- `src/services/salesPipeline.service.ts` - Ny getTrends()
- `src/components/sales-pipeline/SalesPipelineAnalytics.tsx` - Grafer + KPI

---

## Estimert Omfang

| Komponent | Linjer |
|-----------|--------|
| Database migrations | ~50 |
| AvailabilityHistory entity | ~40 |
| ASSIGNED status + startdato | ~80 |
| Scheduled job | ~40 |
| Service-endringer (trends) | ~150 |
| OpenAPI-oppdateringer | ~60 |
| Frontend "Vunnet" modal | ~60 |
| Frontend grafer | ~200 |
| KPI-endringer | ~50 |
| **Total** | **~730** |