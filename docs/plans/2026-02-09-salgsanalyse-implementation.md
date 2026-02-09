# Salgsanalyse Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the sales analytics page from a flat KPI dashboard to a tab-based analytics platform with drill-down, evaluation tracking, competency gap analysis, and customer/consultant insights.

**Architecture:** Backend-first approach. Each task adds a vertical slice: database migration → entity → OpenAPI spec → backend service → controller → frontend component. The existing monolithic analytics endpoint is extended with new dedicated endpoints for each tab.

**Tech Stack:** Spring Boot/Kotlin backend, Liquibase migrations, OpenAPI codegen, Next.js/React/TypeScript frontend, Recharts for charts, DaisyUI/Tailwind for UI, TanStack Query for data fetching.

**Design doc:** `docs/plans/2026-02-09-salgsanalyse-redesign.md`

---

### Task 1: Database migrations - new columns and enums

**Files:**
- Create: `my-page-api/src/main/resources/db/changelog/changes/db.changelog-300.014.xml`

**Step 1: Write the Liquibase changeset**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
                   xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                   xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog
                                       http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.6.xsd">

    <changeSet id="300.014-1" author="JProfessionals">
        <comment>Add sector column to customer table</comment>
        <addColumn tableName="customer">
            <column name="sector" type="VARCHAR(20)" defaultValue="UNKNOWN">
                <constraints nullable="false"/>
            </column>
        </addColumn>
    </changeSet>

    <changeSet id="300.014-2" author="JProfessionals">
        <comment>Add evaluation fields to sales_activity table</comment>
        <addColumn tableName="sales_activity">
            <column name="match_rating" type="INT">
                <constraints nullable="true"/>
            </column>
            <column name="evaluation_notes" type="TEXT">
                <constraints nullable="true"/>
            </column>
            <column name="evaluation_document_url" type="VARCHAR(1000)">
                <constraints nullable="true"/>
            </column>
            <column name="key_factors" type="TEXT">
                <constraints nullable="true"/>
            </column>
        </addColumn>
    </changeSet>

    <changeSet id="300.014-3" author="JProfessionals">
        <comment>Add job_posting_id FK to sales_activity table</comment>
        <addColumn tableName="sales_activity">
            <column name="job_posting_id" type="BIGINT">
                <constraints nullable="true"/>
            </column>
        </addColumn>
        <addForeignKeyConstraint
            baseTableName="sales_activity"
            baseColumnNames="job_posting_id"
            constraintName="fk_sales_activity_job_posting"
            referencedTableName="job_posting"
            referencedColumnNames="id"
            onDelete="SET NULL"/>
        <createIndex tableName="sales_activity" indexName="idx_sales_activity_job_posting">
            <column name="job_posting_id"/>
        </createIndex>
    </changeSet>

</databaseChangeLog>
```

**Step 2: Verify migration runs**

Run: `cd my-page-api && ../mvnw clean compile -q`
Expected: BUILD SUCCESS

**Step 3: Commit**

```bash
git add my-page-api/src/main/resources/db/changelog/changes/db.changelog-300.014.xml
git commit -m "feat(db): add sector, evaluation fields, and job_posting FK migrations"
```

---

### Task 2: Backend entities and enums

**Files:**
- Create: `my-page-api/src/main/kotlin/no/jpro/mypageapi/entity/CustomerSector.kt`
- Create: `my-page-api/src/main/kotlin/no/jpro/mypageapi/entity/KeyFactor.kt`
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/entity/Customer.kt:30-32` (add sector field after exclusive)
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/entity/SalesActivity.kt:96-103` (add evaluation fields + jobPosting FK before stageHistory)

**Step 1: Create CustomerSector enum**

```kotlin
package no.jpro.mypageapi.entity

enum class CustomerSector {
    PUBLIC,   // Offentlig sektor
    PRIVATE,  // Privat sektor
    UNKNOWN   // Ikke klassifisert
}
```

**Step 2: Create KeyFactor enum**

```kotlin
package no.jpro.mypageapi.entity

enum class KeyFactor {
    PRICE,            // Pris var avgjorende
    EXPERIENCE,       // Relevant erfaring
    AVAILABILITY,     // Tilgjengelighet/oppstartstidspunkt
    CUSTOMER_FIT,     // God kundematch/kjemi
    TECHNICAL_MATCH,  // Teknisk kompetansematch
    REFERENCES,       // Referanser/tidligere oppdrag
    OTHER             // Annet
}
```

**Step 3: Add sector to Customer entity**

In `Customer.kt`, add after the `exclusive` field (line 32):

```kotlin
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var sector: CustomerSector = CustomerSector.UNKNOWN,
```

**Step 4: Add evaluation fields and jobPosting FK to SalesActivity entity**

In `SalesActivity.kt`, add before `stageHistory` (before line 99):

```kotlin
    @Column(name = "match_rating")
    var matchRating: Int? = null,

    @Column(name = "evaluation_notes", columnDefinition = "TEXT")
    var evaluationNotes: String? = null,

    @Column(name = "evaluation_document_url", length = 1000)
    var evaluationDocumentUrl: String? = null,

    @Column(name = "key_factors", columnDefinition = "TEXT")
    var keyFactors: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_posting_id")
    var jobPosting: JobPosting? = null,
```

**Step 5: Verify compilation**

Run: `cd my-page-api && ../mvnw clean compile -q`
Expected: BUILD SUCCESS

**Step 6: Commit**

```bash
git add my-page-api/src/main/kotlin/no/jpro/mypageapi/entity/CustomerSector.kt \
       my-page-api/src/main/kotlin/no/jpro/mypageapi/entity/KeyFactor.kt \
       my-page-api/src/main/kotlin/no/jpro/mypageapi/entity/Customer.kt \
       my-page-api/src/main/kotlin/no/jpro/mypageapi/entity/SalesActivity.kt
git commit -m "feat(entity): add CustomerSector, KeyFactor enums and evaluation fields"
```

---

### Task 3: OpenAPI spec - new schemas and enums

**Files:**
- Modify: `my-page-api/src/main/resources/openapi/api.yaml`

This is a large spec change. Do it in sub-steps:

**Step 1: Add CustomerSector and KeyFactor enums**

Add near the other enums (after ClosedReason enum):

```yaml
    CustomerSector:
      type: string
      enum:
        - PUBLIC
        - PRIVATE
        - UNKNOWN
      description: Customer sector classification

    KeyFactor:
      type: string
      enum:
        - PRICE
        - EXPERIENCE
        - AVAILABILITY
        - CUSTOMER_FIT
        - TECHNICAL_MATCH
        - REFERENCES
        - OTHER
      description: Key factor that influenced the outcome
```

**Step 2: Add sector to Customer schema**

In the Customer schema (line ~4714), add after `exclusive`:

```yaml
        sector:
          $ref: '#/components/schemas/CustomerSector'
          description: Customer sector (public/private)
```

Add `sector` to Customer required list.

**Step 3: Add evaluation fields to SalesActivity schema**

In the SalesActivity schema (after `actualStartDate`, line ~5938), add:

```yaml
        matchRating:
          type: integer
          minimum: 1
          maximum: 5
          nullable: true
          description: How well the CV matched the requirements (1-5)
        evaluationNotes:
          type: string
          nullable: true
          description: Free-text evaluation notes
        evaluationDocumentUrl:
          type: string
          nullable: true
          description: URL to evaluation/feedback document
        keyFactors:
          type: array
          items:
            $ref: '#/components/schemas/KeyFactor'
          nullable: true
          description: Key factors that influenced the outcome
        jobPostingId:
          type: integer
          format: int64
          nullable: true
          description: ID of the related job posting
```

**Step 4: Add evaluation fields to MarkActivityWonRequest**

Find MarkActivityWonRequest schema and add:

```yaml
        matchRating:
          type: integer
          minimum: 1
          maximum: 5
          nullable: true
        evaluationNotes:
          type: string
          nullable: true
        evaluationDocumentUrl:
          type: string
          nullable: true
        keyFactors:
          type: array
          items:
            $ref: '#/components/schemas/KeyFactor'
          nullable: true
```

**Step 5: Add evaluation fields to CloseActivity schema**

Find CloseActivity schema and add the same 4 evaluation fields as above.

**Step 6: Add jobPostingId to CreateSalesActivity schema**

Find CreateSalesActivity and add:

```yaml
        jobPostingId:
          type: integer
          format: int64
          nullable: true
          description: ID of the job posting this activity was created from
```

**Step 7: Add new analytics response schemas**

Add these new schemas:

```yaml
    EvaluationAnalytics:
      type: object
      properties:
        closedReasonBreakdown:
          type: array
          items:
            $ref: '#/components/schemas/ClosedReasonCount'
        closedReasonByStage:
          type: array
          items:
            $ref: '#/components/schemas/ClosedReasonByStage'
        avgMatchRatingWon:
          type: number
          format: double
          nullable: true
        avgMatchRatingLost:
          type: number
          format: double
          nullable: true
        matchRatingDistribution:
          type: array
          items:
            $ref: '#/components/schemas/MatchRatingBucket'
        customerExperienceEffect:
          $ref: '#/components/schemas/CustomerExperienceEffect'
        closedActivities:
          type: array
          items:
            $ref: '#/components/schemas/SalesActivity'
      required:
        - closedReasonBreakdown
        - closedReasonByStage
        - closedActivities

    ClosedReasonByStage:
      type: object
      properties:
        stage:
          type: string
        count:
          type: integer
        reasons:
          type: array
          items:
            $ref: '#/components/schemas/ClosedReasonCount'
      required:
        - stage
        - count
        - reasons

    MatchRatingBucket:
      type: object
      properties:
        rating:
          type: integer
        wonCount:
          type: integer
        lostCount:
          type: integer
      required:
        - rating
        - wonCount
        - lostCount

    CustomerExperienceEffect:
      type: object
      properties:
        withExperienceWon:
          type: integer
        withExperienceLost:
          type: integer
        withoutExperienceWon:
          type: integer
        withoutExperienceLost:
          type: integer
      required:
        - withExperienceWon
        - withExperienceLost
        - withoutExperienceWon
        - withoutExperienceLost

    ConsultantDetailedStats:
      type: object
      properties:
        consultant:
          $ref: '#/components/schemas/User'
        availabilityStatus:
          $ref: '#/components/schemas/AvailabilityStatus'
          nullable: true
        activeActivities:
          type: integer
        wonTotal:
          type: integer
        lostTotal:
          type: integer
        winRate:
          type: number
          format: double
        avgMatchRating:
          type: number
          format: double
          nullable: true
        avgDaysToClose:
          type: number
          format: double
        mostCommonLossReason:
          $ref: '#/components/schemas/ClosedReason'
          nullable: true
        activities:
          type: array
          items:
            $ref: '#/components/schemas/SalesActivity'
      required:
        - consultant
        - activeActivities
        - wonTotal
        - lostTotal
        - winRate
        - avgDaysToClose
        - activities

    CompetencyBaseAnalytics:
      type: object
      properties:
        availabilityStats:
          $ref: '#/components/schemas/AvailabilityStats'
        upcomingAvailable:
          type: array
          items:
            $ref: '#/components/schemas/UpcomingAvailableConsultant'
        sectorDistribution:
          type: array
          items:
            $ref: '#/components/schemas/SectorDistribution'
        techCategoryDistribution:
          type: array
          items:
            $ref: '#/components/schemas/TechCategoryCount'
        skillGap:
          type: array
          items:
            $ref: '#/components/schemas/SkillGapEntry'
        tagAnalysis:
          type: array
          items:
            $ref: '#/components/schemas/TagGapEntry'
      required:
        - availabilityStats
        - upcomingAvailable
        - sectorDistribution
        - techCategoryDistribution
        - skillGap
        - tagAnalysis

    UpcomingAvailableConsultant:
      type: object
      properties:
        consultant:
          $ref: '#/components/schemas/User'
        availableFrom:
          type: string
          format: date
          nullable: true
        currentCustomer:
          type: string
          nullable: true
      required:
        - consultant

    SectorDistribution:
      type: object
      properties:
        sector:
          $ref: '#/components/schemas/CustomerSector'
        customerCount:
          type: integer
        consultantCount:
          type: integer
      required:
        - sector
        - customerCount
        - consultantCount

    TechCategoryCount:
      type: object
      properties:
        techCategory:
          type: string
        count:
          type: integer
      required:
        - techCategory
        - count

    SkillGapEntry:
      type: object
      properties:
        techCategory:
          type: string
        demanded:
          type: integer
          description: Number of job postings with this category
        won:
          type: integer
          description: Number of won activities with this category
        hitRate:
          type: number
          format: double
      required:
        - techCategory
        - demanded
        - won
        - hitRate

    TagGapEntry:
      type: object
      properties:
        tagName:
          type: string
        demanded:
          type: integer
        won:
          type: integer
        hitRate:
          type: number
          format: double
      required:
        - tagName
        - demanded
        - won
        - hitRate

    CustomerDetailedStats:
      type: object
      properties:
        customerId:
          type: integer
          format: int64
          nullable: true
        customerName:
          type: string
        sector:
          $ref: '#/components/schemas/CustomerSector'
          nullable: true
        currentConsultantCount:
          type: integer
        activeActivities:
          type: integer
        wonTotal:
          type: integer
        lostTotal:
          type: integer
        winRate:
          type: number
          format: double
        mostCommonLossReason:
          $ref: '#/components/schemas/ClosedReason'
          nullable: true
      required:
        - customerName
        - currentConsultantCount
        - activeActivities
        - wonTotal
        - lostTotal
        - winRate

    SupplierStats:
      type: object
      properties:
        supplierName:
          type: string
        totalActivities:
          type: integer
        wonTotal:
          type: integer
        lostTotal:
          type: integer
        winRate:
          type: number
          format: double
      required:
        - supplierName
        - totalActivities
        - wonTotal
        - lostTotal
        - winRate

    SourceStats:
      type: object
      properties:
        source:
          type: string
        totalJobPostings:
          type: integer
        wonActivities:
          type: integer
        lostActivities:
          type: integer
        winRate:
          type: number
          format: double
      required:
        - source
        - totalJobPostings
        - wonActivities
        - lostActivities
        - winRate

    CustomerAnalytics:
      type: object
      properties:
        customers:
          type: array
          items:
            $ref: '#/components/schemas/CustomerDetailedStats'
        sectorComparison:
          type: array
          items:
            $ref: '#/components/schemas/SectorDistribution'
        supplierStats:
          type: array
          items:
            $ref: '#/components/schemas/SupplierStats'
        sourceStats:
          type: array
          items:
            $ref: '#/components/schemas/SourceStats'
      required:
        - customers
        - sectorComparison
        - supplierStats
        - sourceStats
```

**Step 8: Add new API endpoints**

Add under the `/sales-pipeline` paths:

```yaml
  /sales-pipeline/analytics/evaluations:
    get:
      operationId: getEvaluationAnalytics
      summary: Get evaluation/win-loss analytics
      tags:
        - sales-pipeline
      parameters:
        - name: months
          in: query
          required: false
          schema:
            type: integer
          description: Filter to last N months (null for all time)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/EvaluationAnalytics'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden

  /sales-pipeline/analytics/consultants:
    get:
      operationId: getConsultantAnalytics
      summary: Get detailed consultant analytics with drill-down
      tags:
        - sales-pipeline
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/ConsultantDetailedStats'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden

  /sales-pipeline/analytics/competency-base:
    get:
      operationId: getCompetencyBaseAnalytics
      summary: Get competency base analytics (capacity, skill gap, sector distribution)
      tags:
        - sales-pipeline
      parameters:
        - name: months
          in: query
          required: false
          schema:
            type: integer
          description: Period for skill gap analysis (default 12)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompetencyBaseAnalytics'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden

  /sales-pipeline/analytics/customers:
    get:
      operationId: getCustomerAnalytics
      summary: Get detailed customer analytics
      tags:
        - sales-pipeline
      parameters:
        - name: months
          in: query
          required: false
          schema:
            type: integer
          description: Filter to last N months (null for all time)
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CustomerAnalytics'
        '401':
          description: Unauthorized
        '403':
          description: Forbidden
```

**Step 9: Compile to generate Kotlin interfaces**

Run: `cd my-page-api && ../mvnw clean compile -q`
Expected: BUILD SUCCESS (new delegate methods will be generated)

**Step 10: Commit**

```bash
git add my-page-api/src/main/resources/openapi/api.yaml
git commit -m "feat(api): add analytics endpoints and schemas for evaluation, consultants, competency, customers"
```

---

### Task 4: Backend service - evaluation fields in markAsWon and closeActivity

**Files:**
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/service/SalesPipelineService.kt:411-498`
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/controller/SalesPipelineApiDelegateImpl.kt:308-353`

**Step 1: Add evaluation parameters to markActivityWon**

In `SalesPipelineService.kt`, update `markActivityWon` signature (line 412) to accept evaluation fields:

```kotlin
fun markActivityWon(
    id: Long,
    changedBy: User,
    actualStartDate: LocalDate? = null,
    matchRating: Int? = null,
    evaluationNotes: String? = null,
    evaluationDocumentUrl: String? = null,
    keyFactors: String? = null
): SalesActivity {
```

After setting `activity.actualStartDate` (line 424), add:

```kotlin
        activity.matchRating = matchRating
        activity.evaluationNotes = evaluationNotes
        activity.evaluationDocumentUrl = evaluationDocumentUrl
        activity.keyFactors = keyFactors
```

**Step 2: Add evaluation parameters to closeActivity**

In `SalesPipelineService.kt`, update `closeActivity` signature (line 478) to accept evaluation fields:

```kotlin
fun closeActivity(
    id: Long,
    reason: ClosedReason,
    reasonNote: String?,
    closedBy: User,
    matchRating: Int? = null,
    evaluationNotes: String? = null,
    evaluationDocumentUrl: String? = null,
    keyFactors: String? = null
): SalesActivity {
```

After setting `activity.closedReasonNote` (line 493), add:

```kotlin
        activity.matchRating = matchRating
        activity.evaluationNotes = evaluationNotes
        activity.evaluationDocumentUrl = evaluationDocumentUrl
        activity.keyFactors = keyFactors
```

**Step 3: Add jobPostingId to createSalesActivity**

Add `jobPostingId: Long? = null` parameter to `createSalesActivity`. Before `val saved = salesActivityRepository.save(activity)`, add:

```kotlin
        jobPostingId?.let {
            activity.jobPosting = jobPostingRepository.findById(it).orElse(null)
        }
```

**Step 4: Update controller delegates**

In `SalesPipelineApiDelegateImpl.kt`, update `markSalesActivityWon` (line 320) to pass evaluation fields:

```kotlin
val activity = salesPipelineService.markActivityWon(
    id,
    currentUser,
    markActivityWonRequest?.actualStartDate,
    markActivityWonRequest?.matchRating,
    markActivityWonRequest?.evaluationNotes,
    markActivityWonRequest?.evaluationDocumentUrl,
    markActivityWonRequest?.keyFactors?.joinToString(",") { it.name }
)
```

Update `closeSalesActivity` (line 346) similarly:

```kotlin
val activity = salesPipelineService.closeActivity(
    id,
    reason,
    closeActivity.note,
    currentUser,
    closeActivity.matchRating,
    closeActivity.evaluationNotes,
    closeActivity.evaluationDocumentUrl,
    closeActivity.keyFactors?.joinToString(",") { it.name }
)
```

Update `createSalesActivity` to pass `jobPostingId`:

```kotlin
jobPostingId = createSalesActivity.jobPostingId,
```

**Step 5: Update mapper to include new fields**

Find the `SalesPipelineMapper` and add mappings for the new evaluation fields and jobPostingId on SalesActivity responses.

**Step 6: Compile and verify**

Run: `cd my-page-api && ../mvnw clean compile -q`
Expected: BUILD SUCCESS

**Step 7: Commit**

```bash
git add my-page-api/src/main/kotlin/no/jpro/mypageapi/service/SalesPipelineService.kt \
       my-page-api/src/main/kotlin/no/jpro/mypageapi/controller/SalesPipelineApiDelegateImpl.kt
git commit -m "feat(service): add evaluation fields to markAsWon and closeActivity flows"
```

---

### Task 5: Backend service - evaluation analytics endpoint

**Files:**
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/service/SalesPipelineService.kt` (add getEvaluationAnalytics method)
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/controller/SalesPipelineApiDelegateImpl.kt` (implement new delegate)

**Step 1: Add getEvaluationAnalytics to service**

Add a new method to `SalesPipelineService`. This method should:
- Query all closed activities (WON + CLOSED_OTHER_WON), optionally filtered by months
- Group by closedReason for breakdown
- For each closed activity, find the stage it was at when closed (from stageHistory) and group losses by stage
- Calculate avg matchRating for won vs lost
- Build matchRating distribution (buckets 1-5, won/lost counts)
- For customer experience effect: for each closed activity, check if the consultant has earlier WON activities for the same customer. Compare win rates.
- Return all closed activities for the drill-down table

**Step 2: Implement controller delegate**

Implement `getEvaluationAnalytics` in the controller delegate. Map service data classes to OpenAPI models.

**Step 3: Write test**

Create test in `src/test/kotlin/.../service/SalesPipelineServiceTest.kt` or a new test file for the analytics method.

**Step 4: Compile and run tests**

Run: `cd my-page-api && ../mvnw clean compile -q && ../mvnw test -q`
Expected: BUILD SUCCESS, all tests pass

**Step 5: Commit**

```bash
git add -A
git commit -m "feat(analytics): add evaluation analytics endpoint with loss reasons and match quality"
```

---

### Task 6: Backend service - consultant analytics endpoint

**Files:**
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/service/SalesPipelineService.kt`
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/controller/SalesPipelineApiDelegateImpl.kt`

**Step 1: Add getConsultantAnalytics to service**

New method that:
- Fetches all activities, groups by consultant
- For each consultant: calculates activeActivities, wonTotal, lostTotal, winRate, avgMatchRating, avgDaysToClose
- Finds mostCommonLossReason per consultant
- Fetches availability status from ConsultantAvailability
- Includes all activities per consultant for drill-down
- Sorts by activeActivities descending

**Step 2: Implement controller delegate**

**Step 3: Compile and verify**

Run: `cd my-page-api && ../mvnw clean compile -q`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(analytics): add consultant detailed analytics endpoint with drill-down"
```

---

### Task 7: Backend service - competency base analytics endpoint

**Files:**
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/service/SalesPipelineService.kt`
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/controller/SalesPipelineApiDelegateImpl.kt`

**Step 1: Add getCompetencyBaseAnalytics to service**

New method that:
- Reuses existing availability stats calculation
- Finds upcoming available consultants (AVAILABLE_SOON status with availableFrom date, sorted by date)
- Sector distribution: query consultantAvailability with currentCustomer, group by customer.sector
- TechCategory distribution: for occupied consultants, find their most recent WON activity → linked jobPosting techCategory
- Skill gap: count jobPostings by techCategory (in period), count WON activities by jobPosting.techCategory, calculate hit rate
- Tag analysis: count tags on jobPostings, count tags on jobPostings linked to WON activities, top 15

**Step 2: Implement controller delegate**

**Step 3: Compile and verify**

Run: `cd my-page-api && ../mvnw clean compile -q`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(analytics): add competency base analytics with skill gap and sector distribution"
```

---

### Task 8: Backend service - customer analytics endpoint

**Files:**
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/service/SalesPipelineService.kt`
- Modify: `my-page-api/src/main/kotlin/no/jpro/mypageapi/controller/SalesPipelineApiDelegateImpl.kt`

**Step 1: Add getCustomerAnalytics to service**

New method that:
- Builds CustomerDetailedStats for each customer: sector, currentConsultantCount (from availability), activity counts, winRate, mostCommonLossReason
- Sector comparison: aggregate stats by sector (PUBLIC vs PRIVATE)
- Supplier stats: group activities by supplierName, count won/lost/total, calculate winRate
- Source stats: for activities with jobPosting link, group by jobPosting.source, count postings/won/lost

**Step 2: Implement controller delegate**

**Step 3: Compile and verify**

Run: `cd my-page-api && ../mvnw clean compile -q`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(analytics): add customer analytics with sector, supplier, and source analysis"
```

---

### Task 9: Backend tests for new analytics

**Files:**
- Modify or create: `my-page-api/src/test/kotlin/no/jpro/mypageapi/service/SalesPipelineServiceTest.kt`

**Step 1: Write tests for evaluation analytics**

Test scenarios:
- closedReason breakdown counts correctly
- matchRating averages calculated separately for won/lost
- customerExperience correctly identifies repeat customers
- Empty data returns safe defaults

**Step 2: Write tests for consultant analytics**

Test scenarios:
- Per-consultant stats calculated correctly
- winRate handles 0 activities
- Activities included for drill-down

**Step 3: Write tests for competency base analytics**

Test scenarios:
- Skill gap correctly compares jobPosting techCategories vs won activities
- Sector distribution from availability currentCustomer

**Step 4: Write tests for customer analytics**

Test scenarios:
- Customer stats aggregated correctly
- Supplier stats from supplierName
- Source stats from jobPosting.source

**Step 5: Run all tests**

Run: `cd my-page-api && ../mvnw test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add -A
git commit -m "test(analytics): add tests for evaluation, consultant, competency, and customer analytics"
```

---

### Task 10: Frontend - generate types and create tab structure

**Files:**
- Copy: `my-page-api/src/main/resources/openapi/api.yaml` → `my-page-app/src/api.yaml`
- Modify: `my-page-app/src/services/salesPipeline.service.ts`
- Modify: `my-page-app/src/components/sales-pipeline/SalesPipelineAnalytics.tsx` (replace entirely with tab shell)

**Step 1: Copy OpenAPI spec and generate types**

```bash
cp my-page-api/src/main/resources/openapi/api.yaml my-page-app/src/api.yaml
cd my-page-app && npm run build:openapi
```

**Step 2: Add new service methods to salesPipeline.service.ts**

Add these methods to the service object:

```typescript
async getEvaluationAnalytics(months?: number) {
  const { data } = await getEvaluationAnalytics({
    query: months ? { months } : undefined,
  })
  return data
},

async getConsultantAnalytics() {
  const { data } = await getConsultantAnalytics()
  return data
},

async getCompetencyBaseAnalytics(months?: number) {
  const { data } = await getCompetencyBaseAnalytics({
    query: months ? { months } : undefined,
  })
  return data
},

async getCustomerAnalytics(months?: number) {
  const { data } = await getCustomerAnalytics({
    query: months ? { months } : undefined,
  })
  return data
},
```

Add the corresponding imports from `@/data/types/sdk.gen` and re-export the new types.

**Step 3: Replace SalesPipelineAnalytics.tsx with tab shell**

Replace the entire component with a tab-based layout:

```tsx
'use client'

import { useState } from 'react'
import OverviewTab from './analytics/OverviewTab'
import EvaluationTab from './analytics/EvaluationTab'
import ConsultantTab from './analytics/ConsultantTab'
import CompetencyBaseTab from './analytics/CompetencyBaseTab'
import CustomerTab from './analytics/CustomerTab'
import Link from 'next/link'

const TABS = [
  { id: 'overview', label: 'Oversikt' },
  { id: 'evaluation', label: 'Evaluering' },
  { id: 'consultants', label: 'Konsulenter' },
  { id: 'competency', label: 'Konsulentbasen' },
  { id: 'customers', label: 'Kunder' },
] as const

type TabId = (typeof TABS)[number]['id']

export default function SalesPipelineAnalyticsComponent() {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Salgsanalyse</h1>
        <Link href="/salgstavle" className="btn btn-outline btn-sm">
          ← Tilbake til salgstavle
        </Link>
      </div>

      <div className="tabs tabs-boxed mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'evaluation' && <EvaluationTab />}
      {activeTab === 'consultants' && <ConsultantTab />}
      {activeTab === 'competency' && <CompetencyBaseTab />}
      {activeTab === 'customers' && <CustomerTab />}
    </div>
  )
}
```

**Step 4: Create placeholder components**

Create `my-page-app/src/components/sales-pipeline/analytics/` directory with 5 placeholder files (OverviewTab.tsx, EvaluationTab.tsx, ConsultantTab.tsx, CompetencyBaseTab.tsx, CustomerTab.tsx). Each should be a simple component that says "Under construction" for now.

**Step 5: Verify build**

Run: `cd my-page-app && npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add -A
git commit -m "feat(frontend): add tab structure for analytics page with new API service methods"
```

---

### Task 11: Frontend - OverviewTab (refactored from existing)

**Files:**
- Modify: `my-page-app/src/components/sales-pipeline/analytics/OverviewTab.tsx`

**Step 1: Move existing analytics content into OverviewTab**

Take the content from the old SalesPipelineAnalytics.tsx and move it here, with these changes:
- **Remove** the 3 period comparison cards (lines 164-258 of old component)
- **Add** a 5th KPI card for `averageDaysToClose`
- **Keep** the 4 KPI cards (with the 5th), trend charts, availability stats, and funnel
- Add a "Aktiviteter per kilde" bar chart section (data from the existing analytics endpoint - add `activitiesBySource` once backend supports it, or use a placeholder)

**Step 2: Verify build**

Run: `cd my-page-app && npm run build`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(frontend): implement OverviewTab with cleaned up KPIs and trends"
```

---

### Task 12: Frontend - EvaluationTab

**Files:**
- Modify: `my-page-app/src/components/sales-pipeline/analytics/EvaluationTab.tsx`

**Step 1: Implement EvaluationTab**

This tab calls `salesPipelineService.getEvaluationAnalytics(months)` and renders:

1. **Period filter** at the top (3/6/12 mnd, i ar, all tid)
2. **Tapsarsaker bar chart** - horizontal Recharts BarChart with closedReason breakdown. Each bar is clickable.
3. **Drill-down panel** - when a bar is clicked, show a table of activities with that reason
4. **Tap per stage** - table showing where in the funnel losses happen (closedReasonByStage)
5. **Match-kvalitet** - two stat cards showing avgMatchRatingWon vs avgMatchRatingLost, plus a grouped bar chart for matchRatingDistribution
6. **Kundeerfaring-effekt** - simple stat table from customerExperienceEffect
7. **Drill-down tabell** - full table of closedActivities, sortable, with expandable rows for evaluation details

Use Recharts BarChart for charts, DaisyUI table for tables, and DaisyUI collapse for expandable rows.

**Step 2: Verify build**

Run: `cd my-page-app && npm run build`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(frontend): implement EvaluationTab with loss analysis and match quality"
```

---

### Task 13: Frontend - ConsultantTab

**Files:**
- Modify: `my-page-app/src/components/sales-pipeline/analytics/ConsultantTab.tsx`

**Step 1: Implement ConsultantTab**

This tab calls `salesPipelineService.getConsultantAnalytics()` and renders:

1. **Search bar** at the top (filters consultant list client-side)
2. **Consultant table** - all consultants, sortable columns: Konsulent, Status (colored badge), Aktive, Vunnet, Tapt, Win Rate, Snitt dager
3. **Expandable rows** - click a row to expand:
   - Summary: win rate, avg match rating, most common loss reason, previous customers
   - Active processes table: Kunde, Tittel, Stage (colored badges), Dager i prosess, Pris
   - History table: all closed activities with Utfall icon, Tapsarsak, Match-rating (stars), Varighet, Pris
   - Click history row for full evaluation details (modal or inline expand)

Use DaisyUI table with `collapse` for expandable rows. Availability status badges use colors: green=AVAILABLE, yellow=AVAILABLE_SOON, blue=ASSIGNED, red=OCCUPIED.

**Step 2: Verify build**

Run: `cd my-page-app && npm run build`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(frontend): implement ConsultantTab with drill-down history"
```

---

### Task 14: Frontend - CompetencyBaseTab

**Files:**
- Modify: `my-page-app/src/components/sales-pipeline/analytics/CompetencyBaseTab.tsx`

**Step 1: Implement CompetencyBaseTab**

This tab calls `salesPipelineService.getCompetencyBaseAnalytics(months)` and renders:

1. **Capacity cards** - 4 stat cards: Totalt, Ledig na, Blir ledige, Opptatt
2. **Upcoming available list** - table of consultants becoming available, with name, date, current customer
3. **Sector donut chart** - Recharts PieChart showing offentlig vs privat, with table below
4. **Tech distribution bar chart** - what tech categories occupied consultants are working on
5. **Skill gap grouped bar chart** - Recharts BarChart with two bars per category (demanded blue, won green). Period filter (6/12/24 months).
6. **Tag analysis table** - top 15 tags with demanded/won/hitRate columns, sorted by demanded desc

**Step 2: Verify build**

Run: `cd my-page-app && npm run build`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(frontend): implement CompetencyBaseTab with skill gap analysis"
```

---

### Task 15: Frontend - CustomerTab

**Files:**
- Modify: `my-page-app/src/components/sales-pipeline/analytics/CustomerTab.tsx`

**Step 1: Implement CustomerTab**

This tab calls `salesPipelineService.getCustomerAnalytics(months)` and renders:

1. **Search bar** at the top
2. **Customer table** - searchable, sortable: Kunde, Sektor, Konsulenter na, Aktive, Vunnet, Tapt, Win Rate
3. **Expandable rows** per customer:
   - Current consultants list
   - Activity history table
   - Most common loss reason
4. **Sector comparison table** - offentlig vs privat: Kunder, Utlysninger, Vunnet, Tapt, Win Rate
5. **Supplier stats table** - sortable: Leverandor, Prosesser, Vunnet, Tapt, Win Rate. Expandable for drill-down.
6. **Source analysis bar chart** - win rate per source type

**Step 2: Verify build**

Run: `cd my-page-app && npm run build`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(frontend): implement CustomerTab with sector and supplier analysis"
```

---

### Task 16: Frontend - evaluation forms in won/close modals

**Files:**
- Modify: `my-page-app/src/components/sales-pipeline/MarkAsWonModal.tsx`
- Modify: `my-page-app/src/components/sales-pipeline/EditActivityModal.tsx` (close flow)

**Step 1: Extend MarkAsWonModal with evaluation fields**

Add after the start date input:
- matchRating: 5 clickable stars (1-5)
- keyFactors: multi-select checkboxes for each KeyFactor value (Norwegian labels)
- evaluationNotes: textarea
- evaluationDocumentUrl: text input with label "Lenke til evalueringsdokument"

Pass these to `salesPipelineService.markAsWon()`.

**Step 2: Extend close activity flow with evaluation fields**

Find where `closeActivity` is called in EditActivityModal. Add the same evaluation fields (matchRating, keyFactors, evaluationNotes, evaluationDocumentUrl) to the close dialog.

Pass these to `salesPipelineService.closeActivity()`.

**Step 3: Verify build**

Run: `cd my-page-app && npm run build`

**Step 4: Commit**

```bash
git add -A
git commit -m "feat(frontend): add evaluation forms to won and close activity modals"
```

---

### Task 17: Frontend - customer sector editing

**Files:**
- Find and modify the component where customers are created/edited (likely in job posting or admin area)

**Step 1: Find customer edit UI**

Search for where customers are created or edited in the frontend. Add a sector dropdown (Offentlig/Privat/Ikke klassifisert) to the customer form.

**Step 2: Verify build**

Run: `cd my-page-app && npm run build`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(frontend): add sector dropdown to customer editing"
```

---

### Task 18: Frontend - jobPostingId link when creating activity

**Files:**
- Modify: `my-page-app/src/components/sales-pipeline/CreateActivityModal.tsx`

**Step 1: Pass jobPostingId when creating from a job posting**

If the CreateActivityModal receives a jobPostingId prop (e.g., when creating an activity from a job posting page), pass it to `salesPipelineService.createActivity()`.

Check how activities are currently created from job postings and ensure the link is maintained.

**Step 2: Verify build**

Run: `cd my-page-app && npm run build`

**Step 3: Commit**

```bash
git add -A
git commit -m "feat(frontend): link sales activities to job postings on creation"
```

---

### Task 19: Full integration test

**Step 1: Run backend tests**

```bash
cd my-page-api && ../mvnw test
```

Expected: All tests pass

**Step 2: Run frontend build and lint**

```bash
cd my-page-app && npm run build && npm run lint
```

Expected: Build succeeds, no lint errors

**Step 3: Run frontend tests**

```bash
cd my-page-app && npm run test:run
```

Expected: All tests pass

**Step 4: Manual smoke test**

Start backend with H2 profile and frontend dev server. Navigate to `/salgstavle-analytics` and verify:
- All 5 tabs render
- Tab switching works
- Data loads in each tab (may be empty with H2)
- Evaluation forms appear in won/close modals
- No console errors

**Step 5: Fix any issues found**

**Step 6: Final commit**

```bash
git add -A
git commit -m "fix: resolve integration issues from analytics redesign"
```

---

### Task 20: Format and final cleanup

**Step 1: Format frontend code**

```bash
cd my-page-app && npm run format:fix
```

**Step 2: Verify everything still builds**

```bash
cd my-page-api && ../mvnw clean compile -q
cd my-page-app && npm run build
```

**Step 3: Commit if formatting changed anything**

```bash
git add -A
git commit -m "chore: format frontend code"
```
