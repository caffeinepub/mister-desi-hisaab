import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CategoryItem,
  DailyEntry,
  EntryWithTotals,
} from "../backend.d.ts";
import { useActor } from "./useActor";

// ── Query hooks ──────────────────────────────────────────

export function useEntryByDate(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<EntryWithTotals | null>({
    queryKey: ["entry", date],
    queryFn: async () => {
      if (!actor) return null;
      try {
        return await actor.getEntryByDate(date);
      } catch {
        return null;
      }
    },
    enabled: !!actor && !isFetching && !!date,
  });
}

export function useEntriesByMonth(year: string, month: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DailyEntry[]>({
    queryKey: ["entries", "month", year, month],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesByMonth(year, month);
    },
    enabled: !!actor && !isFetching && !!year && !!month,
  });
}

export function useEntriesByYear(year: string) {
  const { actor, isFetching } = useActor();
  return useQuery<DailyEntry[]>({
    queryKey: ["entries", "year", year],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEntriesByYear(year);
    },
    enabled: !!actor && !isFetching && !!year,
  });
}

export function usePurchaseCategoriesWithPrice() {
  const { actor, isFetching } = useActor();
  return useQuery<CategoryItem[]>({
    queryKey: ["purchaseCategoriesWithPrice"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPurchaseCategoriesWithPrice();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useExpenseCategoriesWithPrice() {
  const { actor, isFetching } = useActor();
  return useQuery<CategoryItem[]>({
    queryKey: ["expenseCategoriesWithPrice"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getExpenseCategoriesWithPrice();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Mutation hooks ───────────────────────────────────────

export function useSaveEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: DailyEntry) => {
      if (!actor) throw new Error("No actor available");
      return actor.saveEntry(entry);
    },
    onSuccess: (_, entry) => {
      queryClient.invalidateQueries({ queryKey: ["entry", entry.date] });
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

export function useAddPurchaseCategoryWithPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      defaultPrice,
    }: {
      name: string;
      defaultPrice: number;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.addPurchaseCategoryWithPrice(name, defaultPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["purchaseCategoriesWithPrice"],
      });
    },
  });
}

export function useAddExpenseCategoryWithPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      defaultPrice,
    }: {
      name: string;
      defaultPrice: number;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.addExpenseCategoryWithPrice(name, defaultPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expenseCategoriesWithPrice"],
      });
    },
  });
}

export function useUpdatePurchaseCategoryPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      newPrice,
    }: {
      name: string;
      newPrice: number;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.updatePurchaseCategoryPrice(name, newPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["purchaseCategoriesWithPrice"],
      });
    },
  });
}

export function useUpdateExpenseCategoryPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      newPrice,
    }: {
      name: string;
      newPrice: number;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.updateExpenseCategoryPrice(name, newPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expenseCategoriesWithPrice"],
      });
    },
  });
}

export function useDeletePurchaseCategoryWithPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor available");
      return actor.deletePurchaseCategoryWithPrice(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["purchaseCategoriesWithPrice"],
      });
    },
  });
}

export function useDeleteExpenseCategoryWithPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor available");
      return actor.deleteExpenseCategoryWithPrice(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["expenseCategoriesWithPrice"],
      });
    },
  });
}

export function useSaveEntries() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entries: DailyEntry[]) => {
      if (!actor) throw new Error("No actor available");
      return actor.saveEntries(entries);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
    },
  });
}

// ── Sale Category hooks ───────────────────────────────────

export function useSaleCategoriesWithPrice() {
  const { actor, isFetching } = useActor();
  return useQuery<CategoryItem[]>({
    queryKey: ["saleCategoriesWithPrice"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getSaleCategoriesWithPrice();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddSaleCategoryWithPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      defaultPrice,
    }: {
      name: string;
      defaultPrice: number;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.addSaleCategoryWithPrice(name, defaultPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["saleCategoriesWithPrice"],
      });
    },
  });
}

export function useUpdateSaleCategoryPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      newPrice,
    }: {
      name: string;
      newPrice: number;
    }) => {
      if (!actor) throw new Error("No actor available");
      return actor.updateSaleCategoryPrice(name, newPrice);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["saleCategoriesWithPrice"],
      });
    },
  });
}

export function useDeleteSaleCategoryWithPrice() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("No actor available");
      return actor.deleteSaleCategoryWithPrice(name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["saleCategoriesWithPrice"],
      });
    },
  });
}
