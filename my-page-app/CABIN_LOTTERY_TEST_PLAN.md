# Test Plan: Hyttetrekning Frontend

## Oversikt

Dette dokumentet beskriver teststrategien for hyttetrekning-funksjonaliteten i frontend.

## Test Stack

- **Test Framework**: Vitest
- **React Testing**: @testing-library/react
- **User Interaction**: @testing-library/user-event
- **Mocking**: vi.mock (Vitest)

## Teststruktur

```
src/components/hyttetrekning/
├── __tests__/
│   ├── UserWishForm.test.tsx
│   ├── AdminDrawingDetail.test.tsx
│   ├── AdminDashboard.test.tsx
│   └── admin/
│       ├── DrawTab.test.tsx
│       ├── ResultsTab.test.tsx
│       ├── PeriodsTab.test.tsx
│       └── WishesTab/
│           ├── WishesByUser.test.tsx
│           └── WishesByPeriod.test.tsx
```

---

## 1. UserWishForm.test.tsx

**Formål**: Teste brukergrensesnittet for å registrere ønsker.

### Unit Tests

**Rendering & Display**

- [ ] Viser loading state når data lastes
- [ ] Viser feilmelding hvis lasting feiler
- [ ] Viser "ingen aktiv trekning" melding når status er DRAFT
- [ ] Viser "ønsker stengt" melding når status er LOCKED/DRAWN/PUBLISHED
- [ ] Viser skjema når status er OPEN
- [ ] Viser eksisterende ønsker hvis brukeren har registrert noen

**Form Validation**

- [ ] Kan ikke legge til ønske uten å velge periode
- [ ] Kan ikke legge til ønske uten å velge minst én leilighet
- [ ] Kan ikke legge til mer enn 2 ønsker
- [ ] Validerer at prioritet er unik (1 og 2)
- [ ] Viser feilmelding ved manglende data

**User Interaction**

- [ ] Kan velge periode fra dropdown
- [ ] Kan velge multiple leiligheter med checkboxes
- [ ] Leilighetene vises i riktig rekkefølge (sort_order)
- [ ] Kan legge til ønske ved å klikke "Legg til"
- [ ] Kan slette ønske fra listen
- [ ] Kan endre prioritet (drag & drop eller knapper)

**Form Submission**

- [ ] Sender riktig data til API når skjema submittes
- [ ] Viser success melding ved vellykket innsending
- [ ] Viser feilmelding ved feil
- [ ] Tømmer skjema etter vellykket innsending
- [ ] Disable submit-knapp mens sending pågår

**Integration Tests**

- [ ] Mock API kall og verifiser at UI oppdateres korrekt
- [ ] Test full flow: velg periode → velg leiligheter → legg til → submit

---

## 2. AdminDrawingDetail.test.tsx

**Formål**: Teste admin-panelet for å administrere en trekning.

### Unit Tests

**Navigation & Tabs**

- [ ] Viser riktige tabs (Perioder, Ønsker, Trekning, Resultater)
- [ ] Kan bytte mellom tabs
- [ ] Viser riktig antall items i tab-badges

**Drawing Header**

- [ ] Viser sesong og status
- [ ] Viser riktige action-knapper basert på status
- [ ] DRAFT: Kan åpne, slette
- [ ] OPEN: Kan låse, sette tilbake til draft
- [ ] LOCKED: Kan kjøre trekning, låse opp
- [ ] DRAWN: Kan publisere
- [ ] PUBLISHED: Ingen actions

**State Management**

- [ ] Laster periods, wishes, allocations korrekt
- [ ] Håndterer loading state
- [ ] Håndterer error state
- [ ] Oppdaterer data etter actions (lock, draw, publish)

**Integration Tests**

- [ ] Mock API og test full flow fra DRAFT → PUBLISHED
- [ ] Verifiser at modaler vises ved actions
- [ ] Test error handling ved API feil

---

## 3. DrawTab.test.tsx

**Formål**: Teste trekning-grensesnittet.

### Unit Tests

**Conditional Rendering**

- [ ] Viser "må låses" melding hvis status !== LOCKED
- [ ] Viser trekning-skjema hvis status === LOCKED

**Seed Input**

- [ ] Seed input er optional
- [ ] Kan skrive inn seed-verdi
- [ ] Viser hjelpetekst om seed

**Draw Button**

- [ ] Knapp er enabled når status = LOCKED
- [ ] Knapp er disabled under trekning
- [ ] Viser "Kjører trekning..." tekst under trekning
- [ ] Kaller onPerformDraw med riktig seed

**Integration Tests**

- [ ] Mock trekning og verifiser UI-oppdateringer
- [ ] Test med og uten seed

---

## 4. ResultsTab.test.tsx

**Formål**: Teste visning av trekkingsresultater.

### Unit Tests

**Conditional Rendering**

- [ ] Viser "ikke gjennomført" melding hvis ingen allocations
- [ ] Viser audit log hvis tilgjengelig
- [ ] Viser tildelinger per periode

**Audit Log**

- [ ] Viser audit log i monospace font
- [ ] Audit log er scrollbar (max-height)
- [ ] Viser alle linjer i audit log

**Allocations Display**

- [ ] Grupperer tildelinger per periode
- [ ] Viser riktig leilighet og bruker for hver tildeling
- [ ] Viser "Ingen tildelinger" hvis periode er tom

---

## 5. PeriodsTab.test.tsx

**Formål**: Teste periodeadministrasjon.

### Unit Tests

**Period List**

- [ ] Viser alle perioder sortert etter sortOrder
- [ ] Viser periode-info (dato, beskrivelse, kommentar)
- [ ] Viser edit/delete knapper

**Add Period Form**

- [ ] Toggle form visibility
- [ ] Validerer required fields (startDate, endDate, description)
- [ ] Kan legge til ny periode
- [ ] Lukker form etter vellykket add

**Bulk Add Periods**

- [ ] Toggle bulk form visibility
- [ ] Validerer startDate og endDate
- [ ] Genererer perioder basert på uke-intervaller
- [ ] Viser antall perioder opprettet

**Edit Period**

- [ ] Viser edit-form når edit klikkes
- [ ] Pre-populerer form med eksisterende data
- [ ] Kan oppdatere periode
- [ ] Kan kansellere editing

**Delete Period**

- [ ] Viser confirmation dialog
- [ ] Sletter periode ved bekreftelse
- [ ] Kansellerer ved avbryt

---

## 6. WishesTab Tests

### WishesByUser.test.tsx

**Formål**: Teste visning av ønsker gruppert per bruker.

**Unit Tests**

- [ ] Grupperer ønsker per bruker
- [ ] Sorterer brukere alfabetisk
- [ ] Viser bruker navn og email
- [ ] Viser ønsker sortert etter prioritet
- [ ] Viser leiligheter i riktig rekkefølge (sort_order)
- [ ] Viser kommentar hvis tilgjengelig

### WishesByPeriod.test.tsx

**Formål**: Teste visning av ønsker gruppert per periode.

**Unit Tests**

- [ ] Grupperer ønsker per periode
- [ ] Sorterer perioder etter sortOrder
- [ ] Viser periode-info
- [ ] Viser ønsker med bruker og leiligheter
- [ ] Viser "Ingen ønsker" hvis periode er tom

### WishesTab.test.tsx (parent)

**Unit Tests**

- [ ] Toggle mellom "by-user" og "by-period" view
- [ ] Viser riktig view basert på mode
- [ ] Import functionality (hvis implementert)

---

## 7. AdminDashboard.test.tsx

**Formål**: Teste oversikten over alle trekninger.

### Unit Tests

**Drawing List**

- [ ] Viser alle trekninger
- [ ] Sorterer etter createdAt (nyeste først)
- [ ] Viser status-badge med riktig farge
- [ ] Viser antall perioder og ønsker

**Create New Drawing**

- [ ] Viser "Opprett ny" knapp
- [ ] Åpner modal for å opprette trekning
- [ ] Validerer sesong-navn
- [ ] Oppretter ny trekning
- [ ] Navigerer til ny trekning etter opprettelse

**Navigation**

- [ ] Klikk på trekning navigerer til detail-view

---

## Test Utilities

### Mock Data Factories

Opprett hjelpefunksjoner for å generere testdata:

```typescript
// src/components/hyttetrekning/__tests__/factories.ts

export const createMockDrawing = (overrides = {}) => ({
  id: 'test-id',
  season: 'Test 2025',
  status: 'DRAFT',
  createdAt: '2025-01-01T00:00:00Z',
  periods: [],
  ...overrides,
})

export const createMockPeriod = (overrides = {}) => ({
  id: 'period-id',
  startDate: '2025-04-01',
  endDate: '2025-04-08',
  description: 'Påske',
  sortOrder: 1,
  ...overrides,
})

export const createMockApartment = (overrides = {}) => ({
  id: 1,
  cabin_name: 'Stor leilighet',
  sort_order: 1,
  ...overrides,
})

export const createMockWish = (overrides = {}) => ({
  id: 'wish-id',
  userId: 1,
  userName: 'Test User',
  userEmail: 'test@example.com',
  periodId: 'period-id',
  periodDescription: 'Påske',
  priority: 1,
  desiredApartmentIds: [1, 2],
  desiredApartmentNames: ['Stor leilighet', 'Liten leilighet'],
  comment: '',
  ...overrides,
})

export const createMockAllocation = (overrides = {}) => ({
  id: 'allocation-id',
  periodId: 'period-id',
  periodDescription: 'Påske',
  apartmentId: 1,
  apartmentName: 'Stor leilighet',
  userId: 1,
  userName: 'Test User',
  userEmail: 'test@example.com',
  allocationType: 'DRAWN',
  allocatedAt: '2025-01-01T00:00:00Z',
  ...overrides,
})
```

### Test Setup Utilities

```typescript
// src/components/hyttetrekning/__tests__/setup.ts

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'

export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  })
}

export const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()

  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}
```

---

## Prioritering

### Høy Prioritet (Critical Path)

1. UserWishForm - brukerens hovedfunksjonalitet
2. DrawTab - trekning må fungere
3. ResultsTab - viktig for verifisering

### Middels Prioritet

4. AdminDrawingDetail - state management
5. PeriodsTab - data setup
6. WishesTab - oversikt

### Lav Prioritet

7. AdminDashboard - liste-visning

---

## Coverage Mål

- **Statement Coverage**: Minimum 80%
- **Branch Coverage**: Minimum 70%
- **Function Coverage**: Minimum 80%

---

## Kjøre Tester

```bash
# Kjør alle tester
npm test

# Kjør med UI
npm run test:ui

# Kjør kun hyttetrekning-tester
npm test -- hyttetrekning

# Kjør med coverage
npm run test:coverage
```

---

## Neste Steg

1. Installer manglende dependencies:

   ```bash
   npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
   ```

2. Opprett vitest config hvis ikke eksisterer

3. Start med UserWishForm.test.tsx (høyeste prioritet)

4. Bygg opp test utilities og mocks

5. Legg til tester gradvis basert på prioritering
