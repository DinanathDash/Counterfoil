import { apiClient } from "./client";
import { Customer, Product } from "@/types/api";

export interface DashboardSummary {
  customers: {
    total: number;
    active: number;
    lead: number;
  };
  products: {
    total: number;
    lowStock: number;
  };
  challans: {
    draft: number;
    confirmed: number;
    todayCount: number;
  };
  lowStockItems: Product[];
  followUpsDue: Customer[];
}

export const dashboardApi = {
  getSummary: async () => {
    const { data } =
      await apiClient.get<DashboardSummary>("/dashboard/summary");
    return data;
  },
};
