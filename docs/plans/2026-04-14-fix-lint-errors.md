# Fix Lint Errors Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 11 ESLint errors so `npm run lint` passes cleanly.

**Architecture:** Two categories of fixes: (1) App-level code issues in `App.tsx` and `sidebar.tsx` that represent real bugs, (2) shadcn/ui component warnings (`react-refresh/only-export-components`) that should be suppressed via ESLint config since shadcn components legitimately co-export variants/helpers.

**Tech Stack:** ESLint flat config, TypeScript, React 19, shadcn/ui

---

### Task 1: Fix unused parameters in App.tsx handleCalculate

The `handleCalculate` callback receives `birthTime`, `partnerDate`, and `partnerTime` but only uses `birthDate`. These parameters exist because `InputSection` passes them, but `calculateFullAstrology()` only takes a `Date`. The underscore prefix signals intent-to-ignore but ESLint still flags them.

**Files:**
- Modify: `src/App.tsx:27-32`

**Step 1: Fix the callback signature**

Remove the unused parameters from the destructuring. Since `InputSection` calls `onCalculate(birthDate, birthTime, partnerDate, partnerTime)`, the callback signature must accept them — use a rest parameter or explicit omission.

```typescript
const handleCalculate = useCallback((
  birthDate: Date,
  ..._args: unknown[]
) => {
  const result = calculateFullAstrology(birthDate);
  setAstrologyResult(result);
```

Wait — this changes the type contract with `InputSection`. Check `InputSection`'s `onCalculate` prop type first:

```bash
grep -n "onCalculate" src/sections/InputSection.tsx | head -5
```

The prop type is `(birthDate: Date, birthTime?: string, partnerDate?: Date, partnerTime?: string) => void`. We need to keep the signature compatible.

Better approach: suppress just these lines, since these params ARE needed for the interface but aren't used yet (they'll be used when FuFirE API integration happens):

```typescript
const handleCalculate = useCallback((
  birthDate: Date,
  // These params will be used when FuFirE API integration is implemented
  _birthTime?: string,
  _partnerDate?: Date,
  _partnerTime?: string
) => {
```

Actually, the simplest ESLint-compliant fix: the `_` prefix convention. The issue is that `@typescript-eslint/no-unused-vars` is configured to flag `_`-prefixed args. Add an ESLint override.

**The real fix:** Update `eslint.config.js` to allow `_`-prefixed unused variables (standard TypeScript convention):

```javascript
// In the rules section of eslint.config.js
"@typescript-eslint/no-unused-vars": ["error", {
  "argsIgnorePattern": "^_",
  "varsIgnorePattern": "^_"
}]
```

**Step 2: Run lint to verify the 3 unused-vars errors are gone**

```bash
npm run lint 2>&1 | grep "no-unused-vars"
```

Expected: no output (errors gone)

**Step 3: Commit**

```bash
git add eslint.config.js
git commit -m "fix: allow underscore-prefixed unused vars in ESLint config"
```

---

### Task 2: Fix impure Math.random() in SidebarMenuSkeleton

`sidebar.tsx:611` calls `Math.random()` inside `useMemo` with `[]` deps. React hooks purity rules flag this because `Math.random()` is impure — the component won't produce the same output on re-render if the memo is busted. Fix: use a seeded or deterministic approach.

**Files:**
- Modify: `src/components/ui/sidebar.tsx:609-612`

**Step 1: Replace Math.random with deterministic width**

Since this is a skeleton loader (placeholder shimmer), the exact width doesn't matter — it just needs visual variation. Use the component's index or a fixed set of widths:

```typescript
// Replace lines 609-612 with:
const width = "68%"
```

Or if visual variety across multiple skeletons is desired, accept a `width` prop. But YAGNI — a fixed width is fine for a skeleton.

**Step 2: Run lint to verify the purity error is gone**

```bash
npm run lint 2>&1 | grep "purity\|Math.random"
```

Expected: no output

**Step 3: Commit**

```bash
git add src/components/ui/sidebar.tsx
git commit -m "fix: replace impure Math.random with deterministic width in SidebarMenuSkeleton"
```

---

### Task 3: Suppress react-refresh/only-export-components for shadcn/ui

7 errors from `react-refresh/only-export-components` in shadcn/ui files: `badge.tsx`, `button-group.tsx`, `button.tsx`, `form.tsx`, `navigation-menu.tsx`, `sidebar.tsx`, `toggle.tsx`. These are all legitimate shadcn patterns — they co-export component variants (`buttonVariants`, `badgeVariants`, etc.) alongside the component. This is by design and should not trigger HMR warnings.

**Files:**
- Modify: `eslint.config.js`

**Step 1: Add rule override for ui components**

Add a separate config block that disables the rule for `src/components/ui/**`:

```javascript
{
  files: ['src/components/ui/**/*.{ts,tsx}'],
  rules: {
    'react-refresh/only-export-components': 'off',
  },
},
```

Add this block after the main config block in `eslint.config.js`.

**Step 2: Run full lint to verify all errors are resolved**

```bash
npm run lint
```

Expected: 0 errors, 0 warnings

**Step 3: Run build to verify no regressions**

```bash
npm run build
```

Expected: successful build

**Step 4: Commit**

```bash
git add eslint.config.js
git commit -m "fix: suppress react-refresh warnings for shadcn/ui components"
```

---

### Task 4: Final verification

**Step 1: Clean lint run**

```bash
npm run lint
```

Expected: clean pass, 0 errors

**Step 2: Clean build**

```bash
npm run build
```

Expected: successful build

**Step 3: Smoke test dev server**

```bash
npm run dev
```

Open http://localhost:5173 in browser. Verify:
- Page loads without console errors
- Scroll through all 7 sections
- Both character and partnership paths reach the input form
- No visual regressions

**Step 4: Final commit if any remaining changes**

```bash
git status
# If clean, no commit needed
```
