# KTI-modul Implementasjonsplan

En komplett modul for kundetilfredshetsundersøkelser (KTI) i MinSide som erstatter SurveyMonkey.

---

## Fremdrift

### Fase 1: Grunnlag ✅
- [x] Liquibase-migrasjoner for alle tabeller
- [x] Entity-klasser med JPA-annotasjoner
- [x] OpenAPI-spesifikasjon for admin-endpoints
- [x] Repositories og services for Round, Organization, Contact, Question
- [x] KtiApiDelegateImpl med mapping til/fra entities
- [x] Admin-sider for org/kontakt/runde-administrasjon
- [x] CSV-import for historiske data (KtiImportService + ImportTab)

### Fase 2: Tildelinger & Invitasjoner ✅
- [x] KtiAssignmentService
- [x] KtiInvitationService med token-generering
- [x] Mock e-posttjeneste (KtiEmailService interface + MockKtiEmailService)
- [x] GUI for å koble konsulenter til kontakter (AssignmentsTab)

### Fase 3: Offentlig skjema ✅
- [x] Public endpoints i security config (`/kti/survey/**`)
- [x] KtiPublicSurveyService for svar-håndtering
- [x] Survey-side med token-validering (`/kti/survey/[token]`)
- [x] Rating-komponent (1-6) med visuell feedback
- [x] Tekstfelt for fritekst-spørsmål
- [x] Mobilresponsivt design
- [x] Forhåndsvisning i admin (preview-modal)
- [x] JPro-logo i header
- [x] Norske kategori-oversettelser
- [x] Takk-side etter innsending
- [x] Håndtering av allerede besvart / utløpt undersøkelse

### Fase 4: Spørsmålsadministrasjon ✅
- [x] Per-runde spørsmålskonfigurasjon (kti_round_question junction table)
- [x] Initialisere spørsmål fra mal
- [x] Legge til/fjerne spørsmål per runde
- [x] Aktivere/deaktivere spørsmål per runde
- [x] Opprette egendefinerte spørsmål
- [x] Endre rekkefølge på spørsmål

### Fase 5: Statistikk & Resultater ✅
- [x] KtiStatisticsService med score-beregninger
- [x] Runde-statistikk (svarprosent, gjennomsnitt, fordeling)
- [x] Statistikk per konsulent
- [x] Visning av alle svar i admin (ResponsesTab)
- [x] Redigere/slette enkelt-svar (admin)
- [x] Redigere/slette invitasjoner (admin)
- [x] Trend-statistikk på bedriftsnivå
- [x] Trend-statistikk per konsulent

### Fase 6: Konsulent-matching & Sync ✅
- [x] Bruker-sync fra Flowcase
- [x] Konsulent-alias system for navn-matching
- [x] Kontakt-import fra CSV med forhåndsvisning
- [x] Håndtering av umatchede konsulenter ved import

### Fase 7: Oversiktsdashboard (delvis) 🔄
- [x] Dashboard-tab med nøkkeltall
- [x] År-velger for filtrering
- [x] Sammenligning med forrige år
- [ ] Grafer/visualisering av trender
- [ ] Kategori-breakdown i dashboard

### Fase 8: E-post & Utsendelser 🔜
- [ ] E-postmaler på norsk (invitasjon, purring)
- [ ] Integrasjon med valgt e-posttjeneste (SendGrid/SES/Slack)
- [ ] Automatisk purring etter X dager
- [ ] E-post-logg i admin

### Fase 9: Konsulent-visning 🔜
- [ ] Konsulent-dashboard (`/kti` eller `/kti/mine-resultater`)
- [ ] Se egne resultater per runde
- [ ] Anonymiserte kommentarer
- [ ] Historisk sammenligning for egen score

### Fase 10: Eksport & Rapportering 🔜
- [ ] CSV-eksport av resultater
- [ ] PDF-rapport per konsulent
- [ ] Sammendragsrapport per runde

---

## Implementerte API-endepunkter

### Admin (krever autentisering)
| Metode | Path | Status |
|--------|------|--------|
| GET/POST | `/kti/rounds` | ✅ |
| GET/PUT/DELETE | `/kti/rounds/{roundId}` | ✅ |
| GET/POST | `/kti/organizations` | ✅ |
| GET/PUT | `/kti/organizations/{organizationId}` | ✅ |
| GET/POST | `/kti/contacts` | ✅ |
| GET/PUT | `/kti/contacts/{contactId}` | ✅ |
| GET/POST/PUT | `/kti/questions` | ✅ |
| GET/POST/PUT/DELETE | `/kti/rounds/{roundId}/questions` | ✅ |
| POST | `/kti/rounds/{roundId}/questions/init-from-template` | ✅ |
| POST | `/kti/rounds/{roundId}/questions/copy-from/{sourceRoundId}` | ✅ |
| GET/POST/DELETE | `/kti/rounds/{roundId}/assignments` | ✅ |
| GET | `/kti/rounds/{roundId}/invitations` | ✅ |
| PUT/DELETE | `/kti/invitations/{invitationId}` | ✅ |
| POST | `/kti/rounds/{roundId}/invitations/send` | ✅ |
| POST | `/kti/rounds/{roundId}/invitations/remind` | ✅ |
| GET | `/kti/rounds/{roundId}/statistics` | ✅ |
| GET | `/kti/rounds/{roundId}/statistics/by-consultant` | ✅ |
| GET | `/kti/rounds/{roundId}/responses` | ✅ |
| PUT/DELETE | `/kti/responses/{responseId}` | ✅ |
| GET | `/kti/trends` | ✅ |
| GET | `/kti/trends/consultants` | ✅ |
| GET | `/kti/consultants` | ✅ |
| POST | `/kti/sync-users` | ✅ |
| GET/POST/DELETE | `/kti/consultant-aliases` | ✅ |
| GET | `/kti/users` | ✅ |
| POST | `/kti/import/preview` | ✅ |
| POST | `/kti/import/historical` | ✅ |
| POST | `/kti/import/contacts/preview` | ✅ |
| POST | `/kti/import/contacts` | ✅ |

### Offentlig (ingen auth - token-basert)
| Metode | Path | Status |
|--------|------|--------|
| GET | `/kti/survey/{token}` | ✅ |
| POST | `/kti/survey/{token}/responses` | ✅ |

---

## Implementert frontend-struktur

```
pages/
  admin/
    kti/
      index.tsx                    # Admin-hovedside med tabs ✅

  kti/
    survey/
      [token].tsx                  # Offentlig svarskjema ✅

components/kti/
  admin/
    KtiAdminDashboard.tsx          # Hoved-dashboard med tabs ✅
    DashboardTab.tsx               # Oversikt med nøkkeltall ✅
    SurveysTab.tsx                 # Liste over undersøkelser ✅
    SurveyDetailView.tsx           # Detaljer for én undersøkelse ✅
    ConsultantsTab.tsx             # Konsulenter og aliaser ✅
    CustomersTab.tsx               # Kunder og kontakter ✅
    SurveyImportModal.tsx          # Import av historiske data ✅
    YearSelector.tsx               # År-velger ✅
    YearContext.tsx                # Context for valgt år ✅

services/
  kti.service.ts                   # Admin API-klient ✅
  kti-public.service.ts            # Offentlig API-klient ✅
```

---

## Datamodell

### Implementerte tabeller

```
kti_round                        # Undersøkelsesrunder ✅
├── id, name, year, status (DRAFT/OPEN/CLOSED)
├── open_date, close_date
└── created_at

kti_customer_organization        # Kundeorganisasjoner ✅
├── id, name, organization_number
└── active

kti_customer_contact             # Kontaktpersoner ✅
├── id, name, email, phone, title
├── organization_id → kti_customer_organization
├── active, opted_out
└── opted_out_at

kti_question                     # Spørsmål (global mal) ✅
├── id, code, text_no, text_en
├── question_type (RATING_1_6, FREE_TEXT)
├── category, display_order
└── active, required

kti_round_question               # Spørsmål per runde (junction) ✅
├── id, round_id → kti_round
├── question_id → kti_question
├── display_order, active
└── created_at

kti_assignment                   # Konsulent-kontakt-kobling per runde ✅
├── id, round_id → kti_round
├── consultant_id → user
├── contact_id → kti_customer_contact
└── created_at

kti_invitation                   # Invitasjoner med unike tokens ✅
├── id, assignment_id → kti_assignment
├── token (UUID)
├── status (PENDING/SENT/OPENED/RESPONDED/EXPIRED)
├── sent_at, opened_at, responded_at
└── reminder_count, expires_at

kti_response                     # Svar på spørsmål ✅
├── id, invitation_id → kti_invitation
├── question_id → kti_question
└── rating_value (1-6), text_value

kti_consultant_alias             # Alias for konsulent-matching ✅
├── id, alias_name
└── user_id → user
```

---

## Gjenværende oppgaver

### Prioritet 1: E-post-integrasjon
1. Velg e-posttjeneste (SendGrid, AWS SES, eller Slack)
2. Implementer produksjons-KtiEmailService
3. Design e-postmaler på norsk:
   - Invitasjon med personlig lenke
   - Purring (1., 2., 3. gang)
4. Legg til e-post-logg i admin

### Prioritet 2: Konsulent-dashboard
1. Opprett `/kti/mine-resultater` side
2. Vis egne resultater per runde
3. Vis anonymiserte kommentarer
4. Vis utvikling over tid (graf)

### Prioritet 3: Forbedret admin-dashboard
1. Legg til grafer for trender (Chart.js/Recharts)
2. Vis kategori-breakdown med radar-diagram
3. Sammenligning mellom konsulenter (anonymisert)

### Prioritet 4: Eksport
1. CSV-eksport av runde-resultater
2. PDF-rapport per konsulent
3. Sammendragsrapport for ledelsen

### Prioritet 5: Automatisering
1. Scheduled job for automatisk purring
2. Automatisk lukking av runde etter sluttdato
3. Varsling til admin ved lav svarprosent

---

## Kategori-oversettelser

| Kode | Norsk |
|------|-------|
| DELIVERY | Leveranse |
| COMPETENCE | Kompetanse |
| COLLABORATION | Samarbeid |
| KNOWLEDGE_SHARING | Kunnskapsdeling |
| VALUE | Verdiskaping |
| JPRO_FOLLOWUP | Oppfølging fra JPro |
| ADDITIONAL | Tilleggsspørsmål |

---

## Sikkerhet

- [x] Admin-endpoints krever autentisering
- [x] Public survey krever kun gyldig token
- [x] Token valideres mot database
- [x] Invitasjon markeres som åpnet/besvart
- [x] Kan ikke svare flere ganger på samme invitasjon
- [ ] Rate-limiting på survey submission (TODO)
- [ ] Konsulenter ser kun egne resultater (TODO)
