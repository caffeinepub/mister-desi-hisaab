import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ShiftEntry {
    expenses: Array<Item>;
    sales: Array<SaleItem>;
    purchases: Array<Item>;
}
export interface Item {
    outlet: string;
    description: string;
    amount: number;
}
export interface DailyEntry {
    morning: ShiftEntry;
    evening: ShiftEntry;
    date: string;
}
export interface CategoryItem {
    name: string;
    defaultPrice: number;
}
export interface SaleItem {
    freeQuantity: bigint;
    name: string;
    quantity: bigint;
    amount: number;
}
export interface EntryWithTotals {
    morning: ShiftEntry;
    evening: ShiftEntry;
    totalPurchase: number;
    date: string;
    profitLoss: number;
    totalSale: number;
    totalExpense: number;
}
export interface backendInterface {
    addExpenseCategoryWithPrice(name: string, defaultPrice: number): Promise<void>;
    addPurchaseCategoryWithPrice(name: string, defaultPrice: number): Promise<void>;
    addSaleCategoryWithPrice(name: string, defaultPrice: number): Promise<void>;
    deleteExpenseCategoryWithPrice(name: string): Promise<void>;
    deletePurchaseCategoryWithPrice(name: string): Promise<void>;
    deleteSaleCategoryWithPrice(name: string): Promise<void>;
    getAllEntries(): Promise<Array<DailyEntry>>;
    getEntriesByMonth(year: string, month: string): Promise<Array<DailyEntry>>;
    getEntriesByYear(year: string): Promise<Array<DailyEntry>>;
    getEntryByDate(date: string): Promise<EntryWithTotals | null>;
    getExpenseCategoriesWithPrice(): Promise<Array<CategoryItem>>;
    getPurchaseCategoriesWithPrice(): Promise<Array<CategoryItem>>;
    getSaleCategoriesWithPrice(): Promise<Array<CategoryItem>>;
    saveEntries(entryArray: Array<DailyEntry>): Promise<void>;
    saveEntry(entry: DailyEntry): Promise<void>;
    updateExpenseCategoryPrice(name: string, newPrice: number): Promise<void>;
    updatePurchaseCategoryPrice(name: string, newPrice: number): Promise<void>;
    updateSaleCategoryPrice(name: string, newPrice: number): Promise<void>;
}
