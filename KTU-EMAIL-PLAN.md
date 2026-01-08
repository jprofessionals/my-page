# Plan: KTU E-post System

## Mål

Implementere et komplett e-postsystem for KTU-undersøkelser med:
1. SendGrid-integrasjon for e-postutsendelse
2. HTML e-postmaler (invitasjon, påminnelse)
3. Tracking av leveranse, åpning og klikk
4. Admin-grensesnitt for å se e-poststatus og sende manuelt

---

## Nåværende Status

**Allerede implementert:**
- `KtuEmailService` interface med `sendInvitation()` og `sendReminder()`
- `MockKtuEmailService` for lokal utvikling (logger i stedet for å sende)
- `KtuInvitation` entity med felter: `sentAt`, `openedAt`, `respondedAt`, `reminderCount`
- `KtuInvitationStatus` enum: PENDING, SENT, OPENED, RESPONDED, EXPIRED
- API-endepunkter: `POST /ktu/rounds/{id}/invitations/send` og `/reminders`

---

## Fase 1: Resend Integrasjon

### 1.1 Avhengigheter

Resend har ikke en offisiell Java SDK, men vi kan bruke deres REST API via WebClient:

```xml
<!-- pom.xml - bruker eksisterende WebClient -->
<!-- Ingen nye dependencies nødvendig -->
```

### 1.2 Konfigurasjon

```yaml
# application.yml
ktu:
  email:
    mock: false  # true for lokal utvikling
    from: "ktu@jprofessionals.no"
    from-name: "JProfessionals"

resend:
  api-key: ${RESEND_API_KEY}
  api-url: https://api.resend.com
```

### 1.3 Resend Service Implementation

```kotlin
@Service
@ConditionalOnProperty(name = ["ktu.email.mock"], havingValue = "false")
class ResendKtuEmailService(
    @Value("\${resend.api-key}") private val apiKey: String,
    @Value("\${ktu.email.from}") private val fromEmail: String,
    @Value("\${ktu.email.from-name}") private val fromName: String,
    private val templateService: KtuEmailTemplateService
) : KtuEmailService {

    private val webClient = WebClient.builder()
        .baseUrl("https://api.resend.com")
        .defaultHeader("Authorization", "Bearer $apiKey")
        .defaultHeader("Content-Type", "application/json")
        .build()

    override fun sendInvitation(invitation: KtuInvitation, surveyUrl: String): Boolean {
        val html = templateService.renderInvitation(invitation, surveyUrl)
        return sendEmail(
            to = invitation.assignment.contact.email,
            subject = "Tilbakemelding på ${invitation.assignment.consultant.name}",
            htmlContent = html
        )
    }

    private fun sendEmail(to: String, subject: String, htmlContent: String): Boolean {
        val request = mapOf(
            "from" to "$fromName <$fromEmail>",
            "to" to listOf(to),
            "subject" to subject,
            "html" to htmlContent
        )

        return try {
            val response = webClient.post()
                .uri("/emails")
                .bodyValue(request)
                .retrieve()
                .toBodilessEntity()
                .block()
            response?.statusCode?.is2xxSuccessful == true
        } catch (e: Exception) {
            logger.error("Failed to send email to $to: ${e.message}")
            false
        }
    }
}
```

### 1.4 Filer som opprettes/endres

| Fil | Endring |
|-----|---------|
| `application.yml` | Resend konfigurasjon |
| `ResendKtuEmailService.kt` | Ny implementasjon |
| `KtuEmailTemplateService.kt` | Ny service for maler |

---

## Fase 2: HTML E-postmaler

### 2.1 Template Service

```kotlin
@Service
class KtuEmailTemplateService(
    @Value("\${app.base-url}") private val baseUrl: String
) {
    fun renderInvitation(invitation: KtuInvitation, surveyUrl: String): String
    fun renderReminder(invitation: KtuInvitation, surveyUrl: String, reminderNumber: Int): String
}
```

### 2.2 E-postmal: Invitasjon

```html
<!-- Responsiv HTML e-postmal -->
- JProfessionals logo
- Personlig hilsen til kontaktpersonen
- Informasjon om konsulenten
- Tydelig CTA-knapp til undersøkelsen
- Footer med kontaktinfo og avmeldingslenke
```

### 2.3 E-postmal: Påminnelse

```html
<!-- Vennlig påminnelse -->
- Referanse til tidligere sendt invitasjon
- Enkel forklaring på hvorfor tilbakemelding er viktig
- CTA-knapp
- Informasjon om utløpsdato hvis relevant
```

### 2.4 Mal-lagring

**Alternativ A: Hardkodet i Kotlin** (Enklest)
- Maler som Kotlin string templates
- Lett å versjonskontrollere

**Alternativ B: Thymeleaf templates** (Mer fleksibelt)
- Maler i `resources/templates/email/`
- Standard Spring templating

**Anbefaling:** Start med Alternativ A, utvid til B hvis behov.

---

## Fase 3: Forbedret Tracking

### 3.1 Utvide KtuInvitation Entity

```kotlin
@Entity
data class KtuInvitation(
    // Eksisterende felter...

    // Nye felter for bedre tracking
    @Column(name = "email_message_id")
    val emailMessageId: String? = null,  // SendGrid message ID

    @Column(name = "delivered_at")
    val deliveredAt: LocalDateTime? = null,

    @Column(name = "bounced_at")
    val bouncedAt: LocalDateTime? = null,

    @Column(name = "bounce_reason")
    val bounceReason: String? = null,

    @Column(name = "clicked_at")
    val clickedAt: LocalDateTime? = null,
)
```

### 3.2 SendGrid Webhooks (Valgfritt)

For å motta sanntidsoppdateringer om e-postleveranse:

```kotlin
@RestController
@RequestMapping("/webhooks/sendgrid")
class SendGridWebhookController {

    @PostMapping("/events")
    fun handleEvents(@RequestBody events: List<SendGridEvent>): ResponseEntity<Unit> {
        // Oppdater KtuInvitation basert på events:
        // - delivered: Sett deliveredAt
        // - open: Sett openedAt
        // - click: Sett clickedAt
        // - bounce: Sett bouncedAt + bounceReason
    }
}
```

### 3.3 Database Migration

```xml
<changeSet id="300.008.001" author="claude">
    <addColumn tableName="ktu_invitation">
        <column name="email_message_id" type="varchar(255)"/>
        <column name="delivered_at" type="datetime"/>
        <column name="bounced_at" type="datetime"/>
        <column name="bounce_reason" type="varchar(500)"/>
        <column name="clicked_at" type="datetime"/>
    </addColumn>
</changeSet>
```

---

## Fase 4: Admin UI for E-post

### 4.1 Invitasjon-oversikt i Admin

```tsx
// components/ktu/admin/InvitationsTab.tsx
- Liste over alle invitasjoner for en runde
- Status-ikoner: Pending, Sendt, Åpnet, Svart, Avvist
- Mulighet til å sende enkeltinvitasjoner på nytt
- Mulighet til å sende masse-påminnelse
```

### 4.2 Statistikk-visning

```tsx
// I SurveyDetailView
E-post statistikk:
- Sendt: 45
- Levert: 44 (97.8%)
- Åpnet: 32 (72.7%)
- Klikket: 28 (63.6%)
- Svart: 25 (56.8%)
- Avvist: 1 (2.2%)
```

### 4.3 Ny API for Invitasjon-liste

```yaml
/ktu/rounds/{roundId}/invitations:
  get:
    operationId: getKtuInvitations
    responses:
      200:
        content:
          application/json:
            schema:
              type: array
              items:
                $ref: '#/components/schemas/KtuInvitationDetail'
```

---

## Fase 5: Manuell E-postsending

### 5.1 Send til enkeltperson

```yaml
/ktu/invitations/{invitationId}/resend:
  post:
    operationId: resendKtuInvitation
    description: Send invitasjon på nytt til én kontakt
```

### 5.2 Forhåndsvisning av E-post

```yaml
/ktu/rounds/{roundId}/email-preview:
  get:
    operationId: previewKtuEmail
    parameters:
      - name: type
        in: query
        schema:
          enum: [invitation, reminder]
    responses:
      200:
        content:
          text/html:
            schema:
              type: string
```

---

## Implementeringsrekkefølge

```
[ ] 1. Legg til SendGrid dependency i pom.xml
[ ] 2. Opprett KtuEmailTemplateService med hardkodede maler
[ ] 3. Opprett SendGridKtuEmailService implementasjon
[ ] 4. Legg til konfigurasjon i application.yml
[ ] 5. Test e-postutsendelse lokalt med testmodus
[ ] 6. Database-migrasjon for nye tracking-felter
[ ] 7. Oppdater OpenAPI med nye endepunkter
[ ] 8. Frontend: Invitasjon-liste i admin
[ ] 9. Frontend: E-post statistikk
[ ] 10. (Valgfritt) SendGrid webhook for leveranse-tracking
```

---

## Konfigurasjon & Miljøvariabler

**Railway/Produksjon:**
```
RESEND_API_KEY=re_xxxxx
KTU_EMAIL_MOCK=false
KTU_EMAIL_FROM=ktu@jprofessionals.no
```

**Lokal utvikling:**
```
KTU_EMAIL_MOCK=true
```

---

## Viktige Filer

### Backend (nye)
- `my-page-api/src/main/kotlin/no/jpro/mypageapi/service/ResendKtuEmailService.kt`
- `my-page-api/src/main/kotlin/no/jpro/mypageapi/service/KtuEmailTemplateService.kt`
- `my-page-api/src/main/resources/db/changelog/changes/db.changelog-300.008.xml`

### Backend (endres)
- `application.yml` - Resend konfigurasjon
- `api.yaml` - Nye endepunkter

### Frontend (endres)
- `components/ktu/admin/SurveyDetailView.tsx` - E-post statistikk
- `components/ktu/admin/InvitationsTab.tsx` - Ny fane (eller integrer i eksisterende)

---

## Estimert Omfang

| Komponent | Linjer | Kompleksitet |
|-----------|--------|--------------|
| SendGridKtuEmailService | ~100 | Lav |
| KtuEmailTemplateService | ~150 | Medium |
| HTML E-postmaler | ~200 | Medium |
| Database migration | ~20 | Lav |
| OpenAPI oppdateringer | ~50 | Lav |
| Frontend invitasjon-liste | ~200 | Medium |
| Frontend statistikk | ~50 | Lav |
| **Total** | **~770** | **Medium** |

---

---

## Fase 6: Forhåndsvisning av Spørreskjema

### 6.1 Admin Preview

Legg til mulighet i admin for å se hvordan spørreskjemaet vil se ut for kundene:

```tsx
// I SurveyDetailView.tsx eller egen modal
<button onClick={() => setShowPreview(true)}>
  Forhåndsvis skjema
</button>

<SurveyPreviewModal
  surveyId={roundId}
  open={showPreview}
  onClose={() => setShowPreview(false)}
/>
```

### 6.2 Backend Endpoint for Preview

```yaml
/ktu/rounds/{roundId}/preview:
  get:
    operationId: previewKtuSurvey
    summary: Get preview data for survey form
    description: Returns survey data with sample consultant/organization for preview
    responses:
      200:
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PublicSurveyData'
```

### 6.3 Filer som endres

| Fil | Endring |
|-----|---------|
| `api.yaml` | Nytt preview-endpoint |
| `KtuApiDelegateImpl.kt` | Implementer preview |
| `SurveyDetailView.tsx` | Legg til preview-knapp |
| `SurveyPreviewModal.tsx` | Ny komponent for preview |

