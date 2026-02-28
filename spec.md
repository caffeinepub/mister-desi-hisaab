# Mister Desi Hisaab

## Current State

- Full-stack daily business tracker with Motoko backend + React frontend
- DailyEntry stores: date, purchases (Item[]), expenses (Item[]), rajajiSale, oldRaoSale, saroorpurSale
- Each Item has: description, amount, outlet
- Categories (purchase/expense) with default price support
- Frontend pages: DailyEntryPage, SummaryPage, ItemsPage, BulkImportPage
- App uses dark warm saffron/brown theme with generated logo image
- Bulk import, outlet tagging (R/O/S/C pills), auto-fill from categories all working

## Requested Changes (Diff)

### Add

1. **Shift System** — Each daily entry now has a shift: "Morning" (सुबह) or "Evening" (शाम). The entry key changes from just `date` to `date + shift` so two shifts per day can be saved independently. Shift selector appears prominently in Daily Entry.

2. **Sale Items Entry** — Instead of (or in addition to) bulk sale amount per outlet, add a "Sale Items" section per shift where user can:
   - Select items from a dropdown (from sale items category)
   - Enter quantity sold (qty)
   - Enter qty given free (free)
   - System auto-calculates sale amount = qty × item rate
   - This mirrors the digital machine shift report

3. **Logo-based Theme** — Replace the generated/placeholder logo with the uploaded Mister Desi logo (`/assets/uploads/Mister-Desi-Final-1.png`). Update app color theme to match logo: deep red (#C8102E style), black, cream/off-white accent. Professional, bold, desi style.

4. **Sale Category** — Add a third category type: "Sale Items" with name and rate per unit, managed in the Items tab alongside purchase/expense categories.

### Modify

- `DailyEntry` backend type: add `shift` field (Text, "Morning" or "Evening"), change key to `date # "_" # shift`
- `saveEntry` / `getEntryByDate` to use date+shift as key
- New backend functions: `saveEntryByShift`, `getEntryByDateAndShift`, `getEntriesByDateAllShifts`
- `Item` type: add optional `qty` and `freeQty` fields for sale items
- Add `SaleItem` category type with rate per unit
- Frontend DailyEntryPage: add shift toggle (Morning/Evening), update save/load to use shift
- Frontend header: replace logo src with `/assets/uploads/Mister-Desi-Final-1.png`
- Frontend theme colors: shift from saffron/brown to bold red + black + cream based on logo

### Remove

- Old single-shift-per-day entry key (replace with date+shift composite key)
- The generated logo image reference from header

## Implementation Plan

1. Generate new Motoko backend with shift field, sale items category, date+shift keying
2. Update frontend:
   a. App.tsx header: replace logo image path, update theme colors to red/black/cream
   b. DailyEntryPage: add shift selector (Morning/Evening toggle), update all backend calls to include shift
   c. SaleItemsSection: new component for shift sale items entry (item dropdown, qty, free qty, auto-calculated amount)
   d. ItemsPage: add "Sale Items" third tab with add/edit/delete and rate per unit
   e. SummaryPage: show shift alongside date in all views
   f. hooks/useQueries: add new hooks for shift-aware queries
