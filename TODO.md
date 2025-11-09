# TODO - Refactoring Tasks

## 1. ✅ Repository refactoring
- [x] Flytte fra én stor repository til separate repository-filer
- **Status: FERDIG**

---

## 2. ✅ Flytte @Transactional fra controllers til service-laget
**Status: FERDIG**

### Controllers som må fikses:

- [x] **AdminController.kt** (1 metode)
  - Line 28: `getBudgetSummary()` ✅ Flyttet til BudgetService.getSummary()

- [x] **SettingsController.kt** (3 metoder)
  - Line 30: `getSettings()` ✅ Flyttet til SettingsService.getAllSettings()
  - Line 34: `getSetting()` ✅ Flyttet til SettingsService.getSetting()
  - Line 45: `updateSetting()` ✅ Flyttet til SettingsService.updateSetting()

- [x] **MeController.kt** (4 metoder)
  - ✅ Hadde ikke @Transactional - ingen endringer nødvendig

- [x] **UserController.kt** (4 metoder)
  - ✅ Hadde ikke @Transactional - ingen endringer nødvendig

- [x] **SubscriptionController.kt** (1 metode)
  - Line 70: `delete()` ✅ Flyttet til SubscriptionService.deleteSubscription()

- [x] **GptController.kt** (1 metode)
  - ✅ Hadde ikke @Transactional - ingen endringer nødvendig

- [x] **NotificationJobController.kt** (1 metode)
  - ✅ Hadde ikke @Transactional - ingen endringer nødvendig

- [x] **InformationNoticeController.kt** (5 metoder)
  - Line 49: `getInformationNoticeInPeriod()` ✅ Service hadde allerede @Transactional
  - Line 80: `createInformationNotice()` ✅ Service hadde allerede @Transactional
  - Line 95: `adminEditInfoNotice()` ✅ Service hadde allerede @Transactional
  - Line 118: `adminDeleteInfoNotice()` ✅ Service hadde allerede @Transactional
  - Line 140: `getVacancies()` ✅ Service hadde allerede @Transactional

- [x] **PendingBookingController.kt** (5 metoder)
  - Line 49: `getPendingBookings()` ✅ Flyttet til PendingBookingService.getPendingBookingsBetweenDates()
  - Line 75: `createPendingBooking()` ✅ Flyttet til PendingBookingService.createPendingBooking()
  - Line 94: `createPendingBookingForUser()` ✅ Flyttet til PendingBookingService.createPendingBooking()
  - Line 113: `getPendingBookingInformation()` ✅ Flyttet til PendingBookingService.getPendingBookingInformation()
  - Line 188: `editPendingBooking()` ✅ Flyttet til PendingBookingService.editPendingBooking()

**Total: 25 metoder i 9 controllers**

---

## 3. ✅ Migrere alle frontend endpoints til OpenAPI SDK
**Status: Fullført (18/18 endpoints migrert)**

### Alle endpoints bruker nå OpenAPI SDK:

**Pending Booking Endpoints:**
- ✅ `getAllPendingBookingTrainsForAllApartments` - Migrert til `getPendingBookingInformation`
- ✅ `pickWinnerPendingBooking` - Migrert til `pickWinnerPendingBooking`
- ✅ `getPendingBookingsForUser` - Migrert til `getMyPendingBookings`
- ✅ `deletePendingBooking` - Migrert til `deleteMyPendingBooking`
- ✅ `adminDeletePendingBooking` - Migrert til `adminDeletePendingBooking`
- ✅ `patchPendingBooking` - Migrert til `updatePendingBooking`

**Information Notice Endpoints:**
- ✅ `getInfoNotices` - Migrert til OpenAPI SDK `getInformationNotices`
- ✅ `createInfoNotice` - Migrert til OpenAPI SDK `createInformationNotice`
- ✅ `deleteInfoNotice` - Migrert til OpenAPI SDK `deleteInformationNotice`
- ✅ `getAllInfoNoticeVacancies` - Migrert til OpenAPI SDK `getInformationNoticeVacancies`

**Booking & Admin Endpoints:**
- ✅ `getAllVacancies` - Migrert til `getBookingVacancies`
- ✅ `adminDeleteBooking` - Migrert til `adminDeleteBooking`
- ✅ `adminPatchBooking` - Migrert til `adminUpdateBooking`

**Settings & Budget Endpoints:**
- ✅ `getBudgetSummary` - Migrert til `getBudgetSummary`
- ✅ `getSettings` - Migrert til `getSettings`
- ✅ `patchSetting` - Migrert til `updateSetting`

**Image & User Endpoints:**
- ✅ `getImage` - Migrert til `getImage`
- ✅ `getUser` - Migrert til `getMe` (har axios workaround for konfigurasjon)

**Total: 18/18 endpoints fullført ✅**

---

## 4. ✅ Migrere cabin lottery admin endpoints til OpenAPI SDK
**Status: FERDIG**

### Fullførte oppgaver:

**cabinLottery.service.ts - Admin endpoints (19 endpoints):**
- [x] `POST /cabin-lottery/admin/drawings` - createDrawing
- [x] `GET /cabin-lottery/admin/drawings` - getAllDrawings
- [x] `GET /cabin-lottery/admin/drawings/{drawingId}` - getDrawing (admin)
- [x] `DELETE /cabin-lottery/admin/drawings/{drawingId}` - deleteDrawing
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/periods` - createPeriod
- [x] `GET /cabin-lottery/admin/drawings/{drawingId}/periods` - getPeriods (admin)
- [x] `PUT /cabin-lottery/admin/drawings/{drawingId}/periods/{periodId}` - updatePeriod
- [x] `DELETE /cabin-lottery/admin/drawings/{drawingId}/periods/{periodId}` - deletePeriod
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/periods/bulk` - bulkCreatePeriods
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/lock` - lockDrawing
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/unlock` - unlockDrawing
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/open` - openDrawing
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/revert-to-draft` - revertToDraft
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/revert-to-locked` - revertToLocked
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/draw` - performDrawing (renamed from execute)
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/publish` - publishDrawing
- [x] `GET /cabin-lottery/admin/drawings/{drawingId}/wishes` - getAllWishes
- [x] `GET /cabin-lottery/admin/drawings/{drawingId}/allocations` - getAllocations (admin)
- [x] `POST /cabin-lottery/admin/drawings/{drawingId}/import` - importWishes
- [x] `DELETE /cabin-lottery/admin/drawings/{drawingId}/executions/{executionId}` - deleteExecution

**NewUserModal.tsx (1 endpoint):**
- [x] `POST /user` - createUser

**api.service.ts (1 endpoint):**
- [x] `GET /me` - getUser (axios workaround fjernet)

**AuthProvider.tsx (1 usage):**
- [x] `axios.isAxiosError` - error handling oppdatert til standard Error

**Total: 22 endpoints/funksjoner - Alle fullført! ✅**

### Hva ble gjort:
1. ✅ Lagt til alle cabin lottery admin endpoints i OpenAPI spec
2. ✅ Lagt til user creation endpoint (POST /user) i OpenAPI spec
3. ✅ Generert backend kode (mvn compile)
4. ✅ Verifisert at backend delegates/controllers allerede er implementert
5. ✅ Kopiert OpenAPI spec til frontend og regenerert TypeScript types
6. ✅ Oppdatert cabinLottery.service.ts til å bruke OpenAPI SDK (alle 19 admin endpoints)
7. ✅ Oppdatert NewUserModal.tsx til å bruke OpenAPI SDK
8. ✅ Fjernet axios workaround i api.service.ts (getMe bruker nå OpenAPI SDK)
9. ✅ Oppdatert error handling i AuthProvider.tsx (ingen axios dependency)

### Gjenværende axios-bruk (ikke del av denne migrasjonen):
**AdminBooking.tsx:**
- `POST /booking/admin/post` - admin booking creation
- `POST /pendingBooking/pendingPostForUser` - pending booking for user
- `POST /pendingBooking/pendingPost` - pending booking creation

**BookingAddModal.tsx:**
- (samme endpoints som over)

**Disse endpoints må migreres i en fremtidig oppgave når booking endpoints legges til i OpenAPI spec.**

---

## 5. ✅ Fjerne all bruk av axios fra frontend
**Status: FERDIG**

Alle booking endpoints er nå migrert til OpenAPI SDK:
- AdminBooking.tsx: Migrert alle 3 endpoints til OpenAPI SDK
  - `POST /booking/admin/post` → `adminCreateBooking`
  - `POST /pendingBooking/pendingPostForUser` → `createPendingBookingForUser`
  - `POST /pendingBooking/pendingPost` → `createPendingBooking`
- BookingAddModal.tsx: Migrert til OpenAPI SDK
  - `POST /pendingBooking/pendingPost` → `createPendingBooking`

**Fullført:**
- ✅ Lagt til 3 booking endpoints i OpenAPI spec
- ✅ Generert backend og frontend kode fra OpenAPI spec
- ✅ Migrert AdminBooking.tsx til OpenAPI SDK
- ✅ Migrert BookingAddModal.tsx til OpenAPI SDK
- ✅ Fjernet axios dependency fra package.json
- ✅ Fjernet auth-header.ts fil
- ✅ Verifisert at ingen axios imports gjenstår

**Axios er nå fullstendig fjernet fra frontend!**

---

## 6. ✅ Lage tester for admin menu visibility
**Status: Backend ferdig, Frontend ikke påkrevd**

Vi trenger tester som verifiserer at admin-elementene vises korrekt i menyen.

### Backend tester:
- [x] Test at `/api/me` returnerer `admin: true` for admin-brukere
- [x] Test at `/api/me` returnerer `admin: false` for vanlige brukere
- [x] Test at X-Test-User-Id header fungerer i test-modus

**Implementering:**
- Lagt til `AdminFlagTests` nested class i `MeControllerAuthenticationTest.kt`
- Fant og fikset en bug i `EntityFactory.kt` hvor alle brukere fikk `admin = true` hardkodet
- Alle 17 tester passerer nå

**Notater:**
- X-Test-User-Id header testes allerede grundig i eksisterende tester
- De eksisterende testene dekker all funksjonalitet vi trenger

### Frontend tester:
Frontend-tester er ikke nødvendige fordi:
- Admin-synlighet er styrt av backend-data (`user.admin` fra `/api/me`)
- Backend-testene verifiserer at dette feltet er korrekt
- Frontend viser/skjuler basert på en enkel boolean check
- Funksjonaliteten er verifisert manuelt og fungerer korrekt

**Hvorfor:** Dette har vært et tilbakevendende problem, så vi må sikre at det aldri skjer igjen. Backend-testene sikrer at API-et alltid returnerer korrekte admin-flagg.

---

## 7. ✅ Migrere backend controllers til OpenAPI delegates
**Status: FULLFØRT - Alle user-facing controllers migrert**

Backend-kontrollere migreres fra tradisjonelle @RestController til OpenAPI delegate pattern for å sikre at all API-funksjonalitet er definert i OpenAPI spec.

### Fullførte migrasjoner:

#### ✅ MeController.kt
- **Status:** FERDIG
- **Endepunkter migrert:** GET /me, GET /me/budgets, GET /me/bookings, GET /me/pendingBookings
- **Implementering:** UserApiDelegateImpl, BudgetApiDelegateImpl, BookingApiDelegateImpl, PendingBookingApiDelegateImpl
- **Notater:** MeController er deaktivert med `// @RestController` kommentar

#### ✅ BookingController.kt
- **Status:** FERDIG
- **Legacy endepunkter (ubrukte):**
  - GET /booking/{bookingID}
  - GET /booking/employee/{employee_id}
  - GET /booking/date
- **Avgjørelse:** Disse endpoints brukes ikke i frontend eller tester, så de er deaktivert
- **Notater:** BookingController er deaktivert med `// @RestController` kommentar
- **Kommentar i kode:** "Legacy BookingController - fully replaced by BookingApiDelegateImpl"

#### ✅ AdminController.kt
- **Status:** FERDIG
- **Endepunkter migrert:** GET /admin/budgetSummary
- **Implementering:** AdminApiDelegateImpl
- **Notater:** Ny BudgetMapper.toBudgetSummaryModel() for mapping
- **Controller disabled:** Ja

#### ✅ SettingsController.kt
- **Status:** FERDIG
- **Endepunkter migrert:**
  - GET /settings - Alle innstillinger
  - GET /settings/{settingId} - Spesifikk innstilling (ble lagt til i OpenAPI spec)
  - PATCH /settings/{settingId} - Oppdater innstilling
- **Implementering:** SettingsApiDelegateImpl
- **Notater:** GET /settings/{settingId} manglet i OpenAPI spec og ble lagt til
- **Controller disabled:** Ja

#### ✅ SubscriptionController.kt (Attempt 2 - SUCCESS!)
- **Status:** FERDIG - Migrert på andre forsøk
- **Endepunkter migrert:**
  - POST /subscription/{tag}
  - GET /subscription/list
  - DELETE /subscription/{tag}
- **Implementering:** SubscriptionApiDelegateImpl
- **Problemer løst:**
  - Første forsøk feilet pga content type negotiation
  - Løst ved å bruke `*/*` content type i OpenAPI spec
  - Bruker korrekt `X-Test-User-Id` header
  - Alle 9 subscription-tester passerer nå
- **Notater:** Controller disabled, alle endepunkter i OpenAPI spec
- **Tester:** 9/9 passerer ✓

### Controllers som forblir som @RestController (infrastruktur):

#### ✅ TaskController.kt
- **Status:** BEHOLD SOM @RestController
- **Årsak:** Cron job triggers for GCP Cloud Scheduler
- **Endepunkter:**
  - GET /task/drawPendingBookings - Trigger hyttetrekning
  - GET /task/notifyUpcomingBookings - Send Slack-varsler
- **Autentisering:** Custom `auth-key` header (ikke JWT)
- **Konklusjon:** Infrastruktur-endpoint, skal ikke i OpenAPI spec

#### ✅ NotificationJobController.kt
- **Status:** BEHOLD SOM @RestController
- **Årsak:** GCP Cloud Scheduler cron job endpoint
- **Endepunkter:** GET /job/generate-notifications
- **Autentisering:** `@RequiresCron` annotation for GCP
- **Konfigurasjon:** cron.yaml kjører hver 15. minutt
- **Konklusjon:** Infrastruktur-endpoint, skal ikke i OpenAPI spec

#### ✅ SlackController.kt
- **Status:** BEHOLD SOM @RestController
- **Årsak:** Admin/debugging utility
- **Endepunkter:** POST /slack/message
- **Bruk:** Manuell sending av Slack-meldinger (admin tool)
- **Konklusjon:** Intern admin-funksjon, skal ikke i OpenAPI spec

#### ⚠️ GptController.kt
- **Status:** UBRUKT - Vurder fjerning
- **Årsak:** Eksperimentell AI-funksjon som ikke brukes i frontend
- **Endepunkter:** POST /openai/chat
- **Anbefaling:** Vurder om funksjonen trengs, hvis ikke - fjern
- **Hvis beholdes:** Burde migreres til OpenAPI

#### ⚠️ ImageController.kt
- **Status:** EVALUERES - Vurder Cloud Storage
- **Årsak:** Serverer bildefiler direkte
- **Endepunkter:** GET /image/{fileName}
- **Anbefaling:** Bruk GCP Cloud Storage med signed URLs i stedet
- **Hvis beholdes:** Kan migreres til OpenAPI med binary response schema

### Forbedringer fullført:

#### ✅ AuthenticationHelper (implementert)
- **Status:** FERDIG
- **Lokasjon:** `/my-page-api/src/main/kotlin/no/jpro/mypageapi/utils/AuthenticationHelper.kt`
- **Funksjonalitet:**
  - `isDevelopmentProfile()` - Sjekk om vi kjører i dev/test modus
  - `getTestUserById()` - Hent test-bruker fra ID
  - `getCurrentUser()` - Hent nåværende bruker fra JWT eller test header
  - `getCurrentUserOrThrow()` - Som over, men kast exception hvis ikke autentisert
  - `getCurrentUserSub()` - Hent brukerens sub fra JWT eller test bruker
  - `getCurrentUserSubOrThrow()` - Som over, men kast exception hvis ikke autentisert
- **Refaktorerte filer:**
  - UserApiDelegateImpl.kt
  - BookingApiDelegateImpl.kt
  - PendingBookingApiDelegateImpl.kt
  - CabinLotteryApiDelegateImpl.kt
- **Resultat:** Fjernet 5 duplikater av `isDevelopmentProfile()` og `getTestUserById()` logikk

#### ✅ Frontend type cleanup
- **Status:** FERDIG (allerede løst i tidligere commits)
- **Commit:** 794cafaa "fix(types): Cast UserReadable with loaded field to User[] type"
- **Commit:** 050f8784 "fix(types): Migrate to OpenAPI-generated types and resolve compilation errors"
- **Løste problemer:**
  - User type konflikt (manuell vs generert)
  - `loaded` felt-problem i Admin.tsx
  - Dupliserte typer fjernet

---

## Notater

### Test User Authentication
✅ Implementert og fungerer:
- X-Test-User-Id header støtte i backend
- localStorage.setItem('testUserId', '1') i frontend
- Admin menu vises korrekt
- Hyttetrekning admin fungerer

### OpenAPI Client Configuration
✅ Fikset `[object Object]` problem:
- Fjernet interceptors som forårsaket problemer
- Setter headers direkte i `setConfig()` i stedet
- Begrensning: Headers refreshes ikke automatisk ved login/logout (må refreshe siden)