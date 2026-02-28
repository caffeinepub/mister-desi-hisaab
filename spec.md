# Mister Desi Hisaab

## Current State
App has Purchase and Expense sections with a category/combobox system.
Categories are stored as plain `Text` (just names) in backend.
When user selects a category from dropdown, only the name fills in — amount stays 0 and must be typed manually every time.
No concept of a "default price/rate" per item.

## Requested Changes (Diff)

### Add
- `CategoryItem` type in backend with `name: Text` and `defaultPrice: Float`
- New backend functions: `addPurchaseCategoryWithPrice`, `addExpenseCategoryWithPrice`, `updatePurchaseCategoryPrice`, `updateExpenseCategoryPrice`, `getPurchaseCategoriesWithPrice`, `getExpenseCategoriesWithPrice`
- When user selects an item from dropdown, its `defaultPrice` auto-fills the amount field (editable)
- "Items Manager" section (or modal) where user can see all saved items with their default prices, edit prices, add new, delete
- When saving a new category from the entry form, ask for a default price too (simple inline input)

### Modify
- `ItemList` component: dropdown now shows `CategoryItem[]` (name + defaultPrice). On select, fill both description AND amount with defaultPrice (user can still change amount)
- `useQueries.ts`: update hooks to use new category-with-price APIs
- "Save as category" flow: after typing a name, show a price input inline before saving
- Display default price next to each category name in the dropdown (e.g., "Doodh — ₹500")

### Remove
- Old plain-text category APIs (`addPurchaseCategory`, `addExpenseCategory`, `getPurchaseCategories`, `getExpenseCategories`, `deletePurchaseCategory`, `deleteExpenseCategory`) — replace with price-aware versions
- Default hardcoded categories ("General", "Food", etc.) in backend

## Implementation Plan
1. Update `main.mo`: add `CategoryItem` type, replace string category lists with `CategoryItem` lists, add/update all category CRUD functions
2. Regenerate `backend.d.ts` bindings
3. Update `useQueries.ts` to use new typed category hooks
4. Update `ItemList.tsx`: dropdown shows name + price, selecting auto-fills amount, "Save as category" flow collects a default price
5. Add an "Items" tab or section in the app for managing master item list with price editing
