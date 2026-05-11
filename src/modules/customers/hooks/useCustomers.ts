import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/shared/lib/api-client";
import { Customer, CustomerFormData } from "../index";
import { toast } from "sonner";

export function useCustomers() {
  return useQuery<{customers: Customer[], total: number}>({
    queryKey: ["customers"],
    queryFn: async () => {
      const response = await apiClient.get("/customers");
      return {
        customers: response.data.customers,
        total: response?.data?.total,
      };
    },
  });
}

export function useCustomerMutations(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CustomerFormData) => apiClient.post("/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer added successfully!");
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to add customer");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CustomerFormData }) =>
      apiClient.patch(`/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer updated successfully!");
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to update customer");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer deleted successfully!");
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete customer");
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    isLoading:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,
  };
}
