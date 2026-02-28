import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface DailyEntry {
    rajajiSale: number;
    date: string;
    expenses: Array<Item>;
    purchases: Array<Item>;
    saroorpurSale: number;
    oldRaoSale: number;
}
export interface Item {
    outlet: string;
    description: string;
    amount: number;
}
export interface CategoryItem {
    name: string;
    defaultPrice: number;
}
export interface EntryWithTotals {
    rajajiSale: number;
    totalPurchase: number;
    date: string;
    expenses: Array<Item>;
    profitLoss: number;
    totalSale: number;
    purchases: Array<Item>;
    saroorpurSale: number;
    totalExpense: number;
    oldRaoSale: number;
}
export interface backendInterface {
    addExpenseCategoryWithPrice(name: string, defaultPrice: number): Promise<void>;
    addPurchaseCategoryWithPrice(name: string, defaultPrice: number): Promise<void>;
    deleteExpenseCategoryWithPrice(name: string): Promise<void>;
    deletePurchaseCategoryWithPrice(name: string): Promise<void>;
    getAllEntries(): Promise<Array<DailyEntry>>;
    getEntriesByMonth(year: string, month: string): Promise<Array<DailyEntry>>;
    getEntriesByYear(year: string): Promise<Array<DailyEntry>>;
    getEntryByDate(date: string): Promise<EntryWithTotals | null>;
    getExpenseCategoriesWithPrice(): Promise<Array<CategoryItem>>;
    getPurchaseCategoriesWithPrice(): Promise<Array<CategoryItem>>;
    saveEntries(entryArray: Array<DailyEntry>): Promise<void>;
    saveEntry(entry: DailyEntry): Promise<void>;
    updateExpenseCategoryPrice(name: string, newPrice: number): Promise<void>;
    updatePurchaseCategoryPrice(name: string, newPrice: number): Promise<void>;
}
