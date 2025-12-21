# Prioritert Plan for UI-forbedringer

**Prosjekt:** my-page-app  
**Dato opprettet:** 2024  
**Status:** Planleggingsfase

---

## 📋 Oversikt

Denne planen dekker forbedringer av brukergrensesnittet i my-page-app, organisert i faser basert på prioritet, innsats og avhengigheter.

**Total estimert tid:** ~3-4 uker (avhengig av teamstørrelse)  
**Antall oppgaver:** 25+  
**Faser:** 4 (Sprint 1-4)

---

## 🎯 Mål

1. **Tilgjengelighet:** Oppnå WCAG 2.1 AA compliance
2. **Konsistens:** Standardisere styling og komponentbruk
3. **Brukeropplevelse:** Forbedre feilhåndtering og loading states
4. **Kvalitet:** Øke testdekning for kritiske komponenter

---

## 📊 Faseoversikt

| Fase | Navn | Prioritet | Estimat | Avhengigheter |
|------|------|-----------|---------|---------------|
| **Sprint 1** | Quick Wins | 🔴 Høy | 2-3 dager | Ingen |
| **Sprint 2** | Tilgjengelighet | 🔴 Høy | 1 uke | Sprint 1 |
| **Sprint 3** | Konsistens & UX | 🟡 Medium | 1-1.5 uker | Sprint 2 |
| **Sprint 4** | Testing & Dokumentasjon | 🟢 Lav | 3-5 dager | Sprint 3 |

---

## 🚀 Sprint 1: Quick Wins (2-3 dager)

**Mål:** Rask fikser som gir umiddelbar verdi med minimal innsats.

### Oppgaver

#### 1.1 Fiks språk-attributt ⏱️ 15 min
**Prioritet:** 🔴 Kritisk  
**Filer:**
- `src/app/layout.tsx` (linje 30)
- `src/pages/_document.tsx` (linje 5)

**Endring:**
```tsx
// Fra: <html lang="en">
// Til:  <html lang="no">
```

**Testing:**
- Verifiser at skjermlesere leser på norsk
- Test SEO-impact (hvis relevant)

---

#### 1.2 Legg til fokus-indikatorer ⏱️ 30 min
**Prioritet:** 🔴 Høy  
**Fil:** `src/styles/globals.scss`

**Endring:**
```scss
*:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: 2px;
}

*:focus:not(:focus-visible) {
  outline: none;
}
```

**Testing:**
- Naviger med Tab-tast
- Verifiser at fokus er synlig på alle interaktive elementer

---

#### 1.3 Forbedre ErrorPage komponent ⏱️ 1 time
**Prioritet:** 🟡 Medium  
**Fil:** `src/components/ErrorPage.tsx`

**Endringer:**
- Konverter inline styles til Tailwind classes
- Legg til `onRetry` callback prop
- Forbedre visuell design
- Legg til "Prøv igjen" knapp

**Testing:**
- Test med ulike feilmeldinger
- Verifiser at retry-funksjon fungerer

---

#### 1.4 Legg til ARIA labels på ikoner ⏱️ 1 time
**Prioritet:** 🔴 Høy  
**Filer:**
- `src/components/navbar/NavBar.tsx`
- Andre komponenter med FontAwesome ikoner

**Endringer:**
```tsx
// Fra:
<FontAwesomeIcon icon={faBars} />

// Til:
<FontAwesomeIcon icon={faBars} aria-label="Åpne meny" />
```

**Testing:**
- Test med skjermleser
- Verifiser at alle ikoner har beskrivende labels

---

**Sprint 1 Total:** ~3 timer  
**Leveranse:** Grunnleggende tilgjengelighet og språk-fikser

---

## ♿ Sprint 2: Tilgjengelighet (1 uke)

**Mål:** Oppnå WCAG 2.1 AA compliance og forbedre keyboard navigation.

### Oppgaver

#### 2.1 Implementer Skip Links ⏱️ 2 timer
**Prioritet:** 🔴 Høy  
**Filer:**
- `src/components/navbar/NavBar.tsx`
- `src/app/layout.tsx` eller `src/pages/_app.tsx`

**Implementering:**
- Legg til "Hopp til hovedinnhold" link
- Skjul visuelt, men synlig for skjermlesere
- Fokus på main content ved klikk

**Testing:**
- Test med keyboard navigation
- Verifiser med skjermleser

---

#### 2.2 Forbedre keyboard navigation ⏱️ 4 timer
**Prioritet:** 🔴 Høy  
**Filer:**
- Alle komponenter med interaktive elementer

**Endringer:**
- Sjekk at alle knapper er keyboard-accessible
- Legg til `onKeyDown` handlers hvor nødvendig
- Test tab order i komplekse komponenter

**Komponenter å sjekke:**
- Modal komponenter
- Accordion komponenter
- Form komponenter
- Dropdown menus

**Testing:**
- Naviger hele appen med kun keyboard
- Verifiser at alle funksjoner er tilgjengelige

---

#### 2.3 Fargekontrast-testing og fikser ⏱️ 3 timer
**Prioritet:** 🟡 Medium  
**Verktøy:** 
- WAVE browser extension
- axe DevTools
- Lighthouse accessibility audit

**Filer å sjekke:**
- `src/components/navbar/NavBar.tsx` (mørk bakgrunn)
- Alle komponenter med custom farger
- `src/styles/globals.scss` (fargevariabler)

**Endringer:**
- Fiks kontrast-issues
- Oppdater fargevariabler hvis nødvendig
- Dokumenter endringer

**Testing:**
- Kjør automatiserte kontrast-tester
- Manuell verifisering med ulike bakgrunnsfarger

---

#### 2.4 Forbedre skjermleser-støtte ⏱️ 4 timer
**Prioritet:** 🔴 Høy  
**Filer:**
- Alle form komponenter
- Tabeller og lister
- Modal komponenter

**Endringer:**
- Legg til `aria-describedby` for form fields
- Legg til `aria-label` på knapper uten tekst
- Legg til `role` attributter hvor nødvendig
- Forbedre `aria-live` regions for dynamisk innhold

**Testing:**
- Test med NVDA/JAWS (Windows) eller VoiceOver (Mac)
- Verifiser at all informasjon er tilgjengelig

---

#### 2.5 Fokus management i modaler ⏱️ 3 timer
**Prioritet:** 🟡 Medium  
**Filer:**
- `src/components/ui/modal.tsx`
- `src/components/ui/SimpleModal.tsx`
- Alle komponenter som bruker modaler

**Endringer:**
- Fokuser første interaktive element ved åpning
- Returner fokus til trigger ved lukking
- Fokuser ikke elementer bak overlay

**Testing:**
- Test med keyboard navigation
- Verifiser fokus-flow i alle modaler

---

**Sprint 2 Total:** ~16 timer (2 dager)  
**Leveranse:** WCAG 2.1 AA compliance, full keyboard navigation

---

## 🎨 Sprint 3: Konsistens & UX (1-1.5 uker)

**Mål:** Standardisere styling og forbedre brukeropplevelse.

### Oppgaver

#### 3.1 Standardiser ErrorPage styling ⏱️ 1 time
**Prioritet:** 🟡 Medium  
**Fil:** `src/components/ErrorPage.tsx`

**Status:** Delvis fikset i Sprint 1.3  
**Gjenværende:**
- Verifiser at alle brukere av ErrorPage oppdateres
- Test konsistens

---

#### 3.2 Konverter SimpleModal til Tailwind ⏱️ 2 timer
**Prioritet:** 🟡 Medium  
**Fil:** `src/components/ui/SimpleModal.tsx`

**Endringer:**
- Fjern inline styles
- Konverter til Tailwind classes
- Vurder å migrere til Radix Dialog (som modal.tsx)

**Testing:**
- Test alle brukere av SimpleModal
- Verifiser at styling er konsistent

---

#### 3.3 Implementer skeleton loaders ⏱️ 6 timer
**Prioritet:** 🟡 Medium  
**Filer:**
- `src/components/Loading.tsx` (utvid)
- Nye skeleton komponenter

**Implementering:**
- Opprett `Skeleton.tsx` komponent
- Opprett spesialiserte skeletons:
  - `SkeletonCard.tsx`
  - `SkeletonList.tsx`
  - `SkeletonTable.tsx`
- Erstatt Loading spinner med skeletons i:
  - `src/pages/index.tsx` (budget list)
  - `src/components/jobpostings/JobPostingList.tsx`
  - Andre lister/tabeller

**Testing:**
- Test loading states
- Verifiser at skeletons matcher innhold

---

#### 3.4 Forbedre form validering feedback ⏱️ 4 timer
**Prioritet:** 🟡 Medium  
**Filer:**
- Alle form komponenter som bruker React Hook Form

**Endringer:**
- Legg til inline valideringsmeldinger
- Visuell indikasjon på required fields
- Success states etter submit
- Forbedre error message styling

**Komponenter å sjekke:**
- `src/components/newemployee/NewEmployeeForm.tsx`
- `src/components/hyttetrekning/UserWishForm.tsx`
- `src/components/jobpostings/AddJobPostingModal.tsx`
- Andre form modaler

**Testing:**
- Test alle form scenarios
- Verifiser at feedback er tydelig

---

#### 3.5 Mobile experience forbedringer ⏱️ 4 timer
**Prioritet:** 🟡 Medium  
**Filer:**
- Alle komponenter med lister/tabeller
- `src/components/navbar/NavBar.tsx`

**Endringer:**
- Test touch targets (minimum 44x44px)
- Optimaliser tabeller for mobil (scroll eller card view)
- Vurder bottom navigation for hyppige handlinger
- Test på ulike skjermstørrelser

**Testing:**
- Test på faktiske mobile enheter
- Verifiser touch targets
- Test på ulike skjermstørrelser (375px, 768px, 1024px)

---

#### 3.6 Design system dokumentasjon ⏱️ 4 timer
**Prioritet:** 🟢 Lav  
**Fil:** Ny fil `docs/DESIGN_SYSTEM.md`

**Innhold:**
- Fargepalett (fra globals.scss)
- Typografi (Geist Sans, Roboto)
- Spacing scale
- Komponenteksempler
- Do's and Don'ts
- Tailwind/DaisyUI best practices

**Testing:**
- Review med team
- Verifiser at dokumentasjonen er korrekt

---

**Sprint 3 Total:** ~21 timer (2.5-3 dager)  
**Leveranse:** Konsistent styling, forbedret UX, dokumentasjon

---

## 🧪 Sprint 4: Testing & Dokumentasjon (3-5 dager)

**Mål:** Øke testdekning og dokumentere endringer.

### Oppgaver

#### 4.1 Tester for tilgjengelighet ⏱️ 6 timer
**Prioritet:** 🟡 Medium  
**Filer:**
- Nye tester i `src/components/**/__tests__/`

**Implementering:**
- Tester for keyboard navigation
- Tester for ARIA attributes
- Tester for fokus management
- Tester for skjermleser kompatibilitet

**Verktøy:**
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jest-axe` (accessibility testing)

**Testing:**
- Kjør test suite
- Verifiser at alle tester passerer

---

#### 4.2 Tester for UI komponenter ⏱️ 8 timer
**Prioritet:** 🟡 Medium  
**Filer:**
- `src/components/ui/**/__tests__/`

**Komponenter å teste:**
- Button
- Modal/Dialog
- Accordion
- Tabs
- ErrorPage
- Loading/Skeleton

**Testing:**
- Render tests
- Interaction tests
- Snapshot tests (hvis relevant)

---

#### 4.3 Integration tester for forms ⏱️ 6 timer
**Prioritet:** 🟡 Medium  
**Filer:**
- Form komponenter med `__tests__/`

**Implementering:**
- Test validering
- Test submit flow
- Test error handling
- Test success states

---

#### 4.4 Oppdater dokumentasjon ⏱️ 4 timer
**Prioritet:** 🟢 Lav  
**Filer:**
- `README.md`
- `UI_EVALUATION.md` (oppdater med status)
- `DESIGN_SYSTEM.md` (fra Sprint 3)

**Innhold:**
- Dokumenter alle endringer
- Oppdater setup instruksjoner
- Legg til accessibility guidelines
- Oppdater contributing guide

---

#### 4.5 Performance audit ⏱️ 3 timer
**Prioritet:** 🟢 Lav  
**Verktøy:**
- Lighthouse
- Next.js Analytics
- React DevTools Profiler

**Fokus:**
- First Contentful Paint
- Time to Interactive
- Bundle size
- Image optimization

**Endringer:**
- Implementer forbedringer hvis nødvendig
- Dokumenter resultater

---

**Sprint 4 Total:** ~27 timer (3-4 dager)  
**Leveranse:** Høy testdekning, komplett dokumentasjon

---

## 📈 Suksesskriterier

### Sprint 1
- ✅ Språk-attributt er `lang="no"`
- ✅ Fokus-indikatorer er synlige
- ✅ ErrorPage har retry-funksjonalitet
- ✅ Alle ikoner har ARIA labels

### Sprint 2
- ✅ WCAG 2.1 AA compliance (verifisert med axe DevTools)
- ✅ Full keyboard navigation fungerer
- ✅ Fargekontrast oppfyller AA standard
- ✅ Skip links implementert
- ✅ Skjermleser-testing fullført

### Sprint 3
- ✅ Alle inline styles konvertert til Tailwind
- ✅ Skeleton loaders implementert
- ✅ Form feedback forbedret
- ✅ Mobile experience optimalisert
- ✅ Design system dokumentert

### Sprint 4
- ✅ Testdekning >70% for UI komponenter
- ✅ Alle accessibility features testet
- ✅ Dokumentasjon komplett
- ✅ Performance metrics dokumentert

---

## 🔄 Avhengigheter

```
Sprint 1 (Quick Wins)
  ↓
Sprint 2 (Tilgjengelighet)
  ↓
Sprint 3 (Konsistens & UX)
  ↓
Sprint 4 (Testing & Dokumentasjon)
```

**Kritiske avhengigheter:**
- Sprint 2 avhenger av Sprint 1 (fokus-indikatorer må være på plass)
- Sprint 3 avhenger av Sprint 2 (tilgjengelighet må være fikset før styling)
- Sprint 4 avhenger av alle tidligere sprinter (tester må dekke endringer)

---

## 📝 Notater

### Verktøy og Ressurser

**Tilgjengelighet:**
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Accessibility audit
- [NVDA](https://www.nvaccess.org/) - Free screen reader (Windows)
- [VoiceOver](https://www.apple.com/accessibility/vision/) - Built-in screen reader (Mac)

**Testing:**
- Vitest (allerede konfigurert)
- @testing-library/react
- @testing-library/user-event
- jest-axe (for accessibility testing)

**Dokumentasjon:**
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Next.js Accessibility](https://nextjs.org/docs/app/building-your-application/optimizing/accessibility)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)

---

## 🎯 Prioritering

### Must Have (Må ha)
- Sprint 1: Alle oppgaver
- Sprint 2: 2.1, 2.2, 2.4 (Skip links, keyboard nav, skjermleser)

### Should Have (Bør ha)
- Sprint 2: 2.3, 2.5 (Fargekontrast, fokus management)
- Sprint 3: 3.1, 3.2, 3.3 (Styling konsistens, skeleton loaders)

### Nice to Have (Kos å ha)
- Sprint 3: 3.4, 3.5, 3.6 (Form feedback, mobile, dokumentasjon)
- Sprint 4: Alle oppgaver (Testing og dokumentasjon)

---

## 📊 Estimater

| Sprint | Minimum | Maksimum | Realistisk |
|--------|---------|----------|------------|
| Sprint 1 | 2 timer | 4 timer | 3 timer |
| Sprint 2 | 12 timer | 20 timer | 16 timer |
| Sprint 3 | 16 timer | 28 timer | 21 timer |
| Sprint 4 | 20 timer | 32 timer | 27 timer |
| **Total** | **50 timer** | **84 timer** | **67 timer** |

**Realistisk tidsramme:** 2-3 uker med 1 utvikler, eller 1-1.5 uker med 2 utviklere.

---

## ✅ Definition of Done

Hver oppgave er ferdig når:
- ✅ Koden er implementert
- ✅ Koden er testet (manuelt eller automatisk)
- ✅ Koden er reviewet (hvis relevant)
- ✅ Dokumentasjon er oppdatert
- ✅ Ingen regresjoner i eksisterende funksjonalitet
- ✅ Accessibility er verifisert (for Sprint 2+)

---

## 🔍 Risiko og Utfordringer

### Risikoer
1. **Tidspress:** Mange oppgaver kan ta lengre tid enn estimert
   - **Mitigering:** Start med must-have oppgaver, delay nice-to-have

2. **Regresjoner:** Endringer kan bryte eksisterende funksjonalitet
   - **Mitigering:** Omfattende testing, gradvis implementering

3. **Design-konflikter:** Endringer kan konflikte med eksisterende design
   - **Mitigering:** Review med design-team, dokumenter beslutninger

### Utfordringer
- **Legacy kode:** Noen komponenter kan være vanskelige å refaktorere
- **Avhengigheter:** Noen endringer kan påvirke mange komponenter
- **Testing:** Høy testdekning kan ta tid å oppnå

---

## 📅 Foreslått Tidslinje

**Med 1 utvikler (deltid, 50%):**
- Sprint 1: Uke 1
- Sprint 2: Uke 2-3
- Sprint 3: Uke 4-5
- Sprint 4: Uke 6

**Med 1 utvikler (fulltid):**
- Sprint 1: Dag 1
- Sprint 2: Dag 2-3
- Sprint 3: Dag 4-6
- Sprint 4: Dag 7-9

**Med 2 utviklere:**
- Sprint 1: Dag 1
- Sprint 2: Dag 2
- Sprint 3: Dag 3-4
- Sprint 4: Dag 5-6

---

## 🚦 Status Tracking

Oppdater denne planen med status for hver oppgave:

- ⏳ **Ikke startet**
- 🟡 **Pågår**
- ✅ **Ferdig**
- ❌ **Blokkert**
- ⏸️ **Pauset**

---

**Sist oppdatert:** 2024  
**Neste review:** Etter Sprint 1

