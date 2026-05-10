import { useQuery } from "@tanstack/react-query";
import apiClient from "@/shared/lib/api-client";
import { Transaction } from "../index";

export function useTransactions(customerId?: string) {
  return useQuery<Transaction[]>({
    queryKey: ["transactions", customerId],
    queryFn: async () => {
      const url = customerId ? `/transactions?customerId=${customerId}` : "/transactions";
      const response = await apiClient.get(url);
      return response.data;
    },
  });
}
