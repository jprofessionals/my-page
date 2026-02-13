# TypeScript Refactoring Plan - Cabin Lottery Components

## 📊 Current Status

**Total TypeScript errors:** 174

- `AdminDrawingDetail.tsx`: 95 errors
- `UserWishForm.tsx`: 66 errors
- `UserResults.tsx`: 13 errors

## 🔍 Error Breakdown by Type

| Error Code  | Count | Description                         | Solution                     |
| ----------- | ----- | ----------------------------------- | ---------------------------- |
| **TS2339**  | 104   | Property does not exist on type     | Define proper interfaces     |
| **TS7006**  | 26    | Parameter implicitly has 'any' type | Add type annotations         |
| **TS18046** | 14    | Variable is of type 'unknown'       | Type assertions or narrowing |
| **TS7053**  | 11    | Index access has 'any' type         | Define index signature       |
| **TS2571**  | 6     | Object is of type 'unknown'         | Type guards                  |
| **TS2345**  | 5     | Type mismatch in assignment         | Fix type definitions         |
| **TS2322**  | 4     | Type not assignable                 | Align types                  |
| **TS7031**  | 3     | Destructuring has 'any' type        | Type destructured params     |
| **TS2698**  | 1     | Spread operator error               | Fix spread types             |

---

## 🎯 Root Cause Analysis

### Problem 1: Missing Type Definitions

All useState hooks initialized without generic types:

```typescript
// ❌ WRONG - TypeScript infers type as 'null' (never changes)
const [drawing, setDrawing] = useState(null)

// ✅ CORRECT - Explicit type allows null OR Drawing
const [drawing, setDrawing] = useState<Drawing | null>(null)
```

### Problem 2: No Interface Definitions

Data structures from API have no TypeScript interfaces:

- `Drawing` (season, status, id, createdAt, etc.)
- `Period` (id, startDate, endDate, description, sortOrder, comment)
- `Wish` (id, userId, periodId, priority, desiredApartmentIds)
- `Allocation` (id, userId, periodId, apartmentId)
- `DrawResult` (allocations, statistics)
- `ImportResult` (totalLines, successCount, errorCount)

### Problem 3: Implicit Any Parameters

Function parameters without types:

```typescript
// ❌ WRONG
const handleDelete = (periodId) => { ... }

// ✅ CORRECT
const handleDelete = (periodId: string) => { ... }
```

---

## 📋 Refactoring Strategy

### Phase 1: Create Type Definitions (High Priority)

**File:** `src/types/cabinLottery.types.ts`

Define all interfaces based on backend DTOs and OpenAPI spec:

```typescript
// Drawing statuses
export type DrawingStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'DRAWN' | 'PUBLISHED'

// Main entities
export interface Drawing {
  id: string
  season: string
  status: DrawingStatus
  createdAt: string
  lockedAt?: string | null
  drawnAt?: string | null
  publishedAt?: string | null
  randomSeed?: number | null
}

export interface Period {
  id: string
  drawingId: string
  startDate: string
  endDate: string
  description: string
  sortOrder: number
  comment?: string | null
}

export interface Wish {
  id: string
  drawingId: string
  userId: number
  userName: string
  userEmail: string
  periodId: string
  periodDescription: string
  priority: number
  desiredApartmentIds: number[]
  desiredApartmentNames: string[]
  comment?: string | null
}

export interface Allocation {
  id: string
  drawingId: string
  userId: number
  userName: string
  userEmail: string
  periodId: string
  periodDescription: string
  apartmentId: number
  apartmentName: string
  allocationRound: number
}

export interface Apartment {
  id: number
  cabin_name: string
}

// Form states
export interface PeriodFormState {
  startDate: string
  endDate: string
  description: string
  comment: string
  sortOrder: number
}

export interface BulkPeriodFormState {
  startDate: string
  endDate: string
}

// API responses
export interface DrawResult {
  allocations: Allocation[]
  statistics: {
    totalParticipants: number
    totalAllocations: number
    participantsWithZeroAllocations: number
    participantsWithOneAllocation: number
    participantsWithTwoAllocations: number
  }
}

export interface ImportResult {
  totalLines: number
  successCount: number
  errorCount: number
  errors?: Array<{
    line: number
    message: string
  }>
}

// View modes
export type WishesViewMode = 'by-user' | 'by-period'
export type ActiveTab = 'periods' | 'wishes' | 'results'
```

---

### Phase 2: Fix AdminDrawingDetail.tsx (95 errors)

**Estimated effort:** 2-3 hours

#### Step 2.1: Import Types

```typescript
import type {
  Drawing,
  Period,
  Wish,
  Allocation,
  PeriodFormState,
  BulkPeriodFormState,
  DrawResult,
  ImportResult,
  WishesViewMode,
  ActiveTab,
} from '@/types/cabinLottery.types'
```

#### Step 2.2: Fix State Declarations (Lines 10-50)

**Before:**

```typescript
const [drawing, setDrawing] = useState(null)
const [periods, setPeriods] = useState([])
const [wishes, setWishes] = useState([])
const [allocations, setAllocations] = useState([])
const [activeTab, setActiveTab] = useState('periods')
```

**After:**

```typescript
const [drawing, setDrawing] = useState<Drawing | null>(null)
const [periods, setPeriods] = useState<Period[]>([])
const [wishes, setWishes] = useState<Wish[]>([])
const [allocations, setAllocations] = useState<Allocation[]>([])
const [activeTab, setActiveTab] = useState<ActiveTab>('periods')
const [loading, setLoading] = useState<boolean>(true)

// Period form
const [showPeriodForm, setShowPeriodForm] = useState<boolean>(false)
const [showBulkPeriodForm, setShowBulkPeriodForm] = useState<boolean>(false)
const [newPeriod, setNewPeriod] = useState<PeriodFormState>({
  startDate: '',
  endDate: '',
  description: '',
  comment: '',
  sortOrder: 0,
})
const [editingPeriodId, setEditingPeriodId] = useState<string | null>(null)
const [editPeriod, setEditPeriod] = useState<PeriodFormState>({
  startDate: '',
  endDate: '',
  description: '',
  comment: '',
  sortOrder: 0,
})

// Import
const [importFile, setImportFile] = useState<File | null>(null)
const [importing, setImporting] = useState<boolean>(false)
const [importResult, setImportResult] = useState<ImportResult | null>(null)

// Draw
const [drawSeed, setDrawSeed] = useState<string>('')
const [isDrawing, setIsDrawing] = useState<boolean>(false)
const [drawResult, setDrawResult] = useState<DrawResult | null>(null)

// Wishes view mode
const [wishesViewMode, setWishesViewMode] = useState<WishesViewMode>('by-user')
```

#### Step 2.3: Fix Function Parameters

Add types to all function parameters:

```typescript
// Before
const handleDelete = (periodId) => { ... }
const handleEdit = (period) => { ... }

// After
const handleDelete = (periodId: string): Promise<void> => { ... }
const handleEdit = (period: Period): void => { ... }
```

**Functions to fix (estimated 15-20 functions):**

- `handleCreatePeriod()`
- `handleCreateBulkPeriods()`
- `handleUpdatePeriod(periodId: string)`
- `handleDeletePeriod(periodId: string)`
- `handleLockDrawing()`
- `handlePerformDraw()`
- `handlePublishResults()`
- `handleImportWishes()`
- `getStatusBadge(status: DrawingStatus)`
- `getStatusText(status: DrawingStatus)`

#### Step 2.4: Fix Array Methods with Proper Types

```typescript
// Before (implicit any)
periods.map((period) => ...)
wishes.filter((wish) => ...)

// After (explicit types)
periods.map((period: Period) => ...)
wishes.filter((wish: Wish) => ...)
```

#### Step 2.5: Fix Object Grouping Logic

Add type annotations for reduce/groupBy operations:

```typescript
// Before
const wishesByUser = wishes.reduce((acc, wish) => {
  if (!acc[wish.userId]) acc[wish.userId] = []
  acc[wish.userId].push(wish)
  return acc
}, {})

// After
const wishesByUser = wishes.reduce<Record<number, Wish[]>>((acc, wish) => {
  if (!acc[wish.userId]) acc[wish.userId] = []
  acc[wish.userId].push(wish)
  return acc
}, {})
```

---

### Phase 3: Fix UserWishForm.tsx (66 errors)

**Estimated effort:** 1-2 hours

Similar approach:

1. Import types from `cabinLottery.types.ts`
2. Fix state declarations (drawing, periods, wishes, apartments, etc.)
3. Add parameter types to functions
4. Fix array methods

**Key types needed:**

```typescript
interface WishFormState {
  periodId: string
  priority: number
  apartmentIds: number[]
  comment: string
}
```

---

### Phase 4: Fix UserResults.tsx (13 errors)

**Estimated effort:** 30 minutes

Smallest file - similar fixes:

1. Import types
2. Fix state declarations
3. Add parameter types

---

### Phase 5: Re-enable TypeScript Checking

**File:** `next.config.js`

```typescript
const nextConfig = {
  reactStrictMode: true,
  distDir: 'build',

  // ✅ Re-enable TypeScript and ESLint checking
  typescript: {
    ignoreBuildErrors: false, // Changed from true
  },
  eslint: {
    ignoreDuringBuilds: false, // Changed from true
  },

  // ... rest of config
}
```

---

## 🚀 Implementation Order

### Priority 1 (Must Do First)

1. ✅ Create `src/types/cabinLottery.types.ts` with all interfaces
2. ✅ Fix AdminDrawingDetail.tsx state declarations (lines 10-50)
3. ✅ Fix AdminDrawingDetail.tsx function parameters

### Priority 2 (After Priority 1)

4. ✅ Fix UserWishForm.tsx state declarations
5. ✅ Fix UserWishForm.tsx function parameters
6. ✅ Fix UserResults.tsx

### Priority 3 (Validation)

7. ✅ Run `npx tsc --noEmit` - should show 0 errors
8. ✅ Run `npm run lint` - should pass
9. ✅ Re-enable TypeScript checking in next.config.js
10. ✅ Run `npm run build` - should succeed

---

## 📝 Checklist for Each File

For each file being refactored:

- [ ] Import required types from `cabinLottery.types.ts`
- [ ] Fix all `useState` declarations with proper generic types
- [ ] Add types to all function parameters
- [ ] Add return types to all functions (especially async functions)
- [ ] Fix array method callbacks (`map`, `filter`, `reduce`, etc.)
- [ ] Fix event handlers (`onChange`, `onClick`, etc.)
- [ ] Run `npx tsc --noEmit` to verify no errors in that file
- [ ] Test the component manually in browser
- [ ] Commit changes

---

## 🧪 Testing Strategy

After each phase:

1. **Type Check:** `npx tsc --noEmit`
2. **Lint Check:** `npm run lint`
3. **Build Check:** `npm run build`
4. **Manual Testing:**
   - Start dev server: `npm run dev`
   - Test all CRUD operations for periods
   - Test wish import functionality
   - Test draw functionality
   - Test results display

---

## 📊 Success Metrics

- ✅ 0 TypeScript errors (currently 174)
- ✅ 0 ESLint errors
- ✅ Build succeeds without `ignoreBuildErrors`
- ✅ All cabin lottery features work in browser
- ✅ No runtime errors in console

---

## ⏱️ Estimated Total Time

| Phase                           | Estimated Time      |
| ------------------------------- | ------------------- |
| Phase 1: Type definitions       | 1 hour              |
| Phase 2: AdminDrawingDetail.tsx | 2-3 hours           |
| Phase 3: UserWishForm.tsx       | 1-2 hours           |
| Phase 4: UserResults.tsx        | 30 minutes          |
| Phase 5: Testing & validation   | 1 hour              |
| **Total**                       | **5.5 - 7.5 hours** |

---

## 🎯 Quick Wins (Low-Hanging Fruit)

If time is limited, start with these high-impact, low-effort fixes:

1. **Create type definitions file** (30 min) - Unblocks everything else
2. **Fix all useState declarations** (1 hour) - Fixes ~50% of errors
3. **Fix function parameters** (1 hour) - Fixes ~30% of errors
4. **Fix array callbacks** (30 min) - Fixes remaining errors

Total for quick wins: **~3 hours** to reduce from 174 errors to ~30 errors

---

## 🔧 Tools & Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/components/hyttetrekning/AdminDrawingDetail.tsx

# Count errors by file
npx tsc --noEmit 2>&1 | grep "error TS" | cut -d'(' -f1 | sort | uniq -c

# Check ESLint errors
npm run lint

# Build (with current config ignoring errors)
npm run build

# Run development server
npm run dev
```

---

## 💡 Best Practices

1. **Use explicit types over type inference** for state variables
2. **Define interfaces over inline types** for reusability
3. **Use `Record<K, V>` for object maps** instead of index signatures
4. **Type async functions** with `Promise<ReturnType>`
5. **Use type guards** for unknown types from API
6. **Avoid `any`** - use `unknown` and narrow with type guards
7. **Use union types** for status enums instead of strings
8. **Export types** from a central location for consistency

---

## 🚨 Known Challenges

1. **Backend API responses may not match expected types**
   - Solution: Add runtime validation or type guards

2. **OpenAPI generated types may conflict with manual types**
   - Solution: Import from generated types when possible

3. **Complex reduce/groupBy operations**
   - Solution: Extract to helper functions with explicit types

4. **Event handlers may need `React.ChangeEvent<HTMLInputElement>`**
   - Solution: Import React types

---

## 📚 Resources

- [TypeScript Handbook - Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Next.js TypeScript Documentation](https://nextjs.org/docs/basic-features/typescript)

---

## 🎓 Example: Complete Fix for One Component

Here's a before/after for a small section:

### Before (Has Errors)

```typescript
export default function AdminDrawingDetail({ drawingId }) {
  const [drawing, setDrawing] = useState(null)
  const [periods, setPeriods] = useState([])

  const handleDelete = (periodId) => {
    // ...
  }

  return (
    <div>
      {periods.map((period) => (
        <div key={period.id}>{period.description}</div>
      ))}
    </div>
  )
}
```

### After (No Errors)

```typescript
import type { Drawing, Period } from '@/types/cabinLottery.types'

export default function AdminDrawingDetail({ drawingId }: { drawingId: string }) {
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [periods, setPeriods] = useState<Period[]>([])

  const handleDelete = async (periodId: string): Promise<void> => {
    // ...
  }

  return (
    <div>
      {periods.map((period: Period) => (
        <div key={period.id}>{period.description}</div>
      ))}
    </div>
  )
}
```

---

## ✅ Next Steps

**Recommend starting with:**

1. Create the types file (Phase 1)
2. Fix AdminDrawingDetail.tsx state (Phase 2.2)
3. Verify reduction in errors with `npx tsc --noEmit`

Vil du at jeg starter med Phase 1 (lager type-definisjonsfilen)?
