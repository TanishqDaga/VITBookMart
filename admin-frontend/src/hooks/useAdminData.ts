import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "@/api/adminApi";
import { errorMessage } from "@/api/errors";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { queryKeys } from "@/lib/queryKeys";
import type { CreateAdminRequest, ListingRecord, UserStatus } from "@/types";

type ListingScope = "all" | "available" | "sold";

function useAuthedQuery() {
  const { isAuthenticated } = useAdminAuth();
  return isAuthenticated;
}

export function useUsers() {
  const enabled = useAuthedQuery();
  return useQuery({ queryKey: queryKeys.users, queryFn: () => adminApi.getUsers(), enabled });
}

export function useListings(scope: ListingScope = "all") {
  const enabled = useAuthedQuery();
  return useQuery({
    queryKey: queryKeys.listings(scope),
    queryFn: () =>
      scope === "available"
        ? adminApi.getAvailableListings()
        : scope === "sold"
          ? adminApi.getSoldListings()
          : adminApi.getListings(),
    enabled,
  });
}

export function useAdmins() {
  const enabled = useAuthedQuery();
  return useQuery({ queryKey: queryKeys.admins, queryFn: () => adminApi.getAdmins(), enabled });
}

/** Listing writes can change which scope a record belongs to, so refresh all three. */
function invalidateListings(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.listingsAll });
}

// --- user mutations -------------------------------------------------------

export function useSetUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: UserStatus }) => {
      if (status === "TERMINATED") return adminApi.terminateUser(userId);
      if (status === "PAID") return adminApi.makeUserPaid(userId);
      return adminApi.makeUserFree(userId);
    },
    onSuccess(_data, { status }) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      toast.success(
        status === "TERMINATED"
          ? "User terminated"
          : status === "PAID"
            ? "User moved to paid"
            : "User moved to free",
      );
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => adminApi.deleteUser(userId),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.users });
      // The cascade removes the user's listings too.
      invalidateListings(queryClient);
      toast.success("User deleted");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

// --- listing mutations ----------------------------------------------------

export function useUpdateListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, listing }: { listingId: string; listing: Partial<ListingRecord> }) =>
      adminApi.updateListing(listingId, listing),
    onSuccess() {
      invalidateListings(queryClient);
      toast.success("Listing updated");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => adminApi.deleteListing(listingId),
    onSuccess() {
      invalidateListings(queryClient);
      toast.success("Listing deleted");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

// --- admin mutations ------------------------------------------------------

export function useCreateAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateAdminRequest) => adminApi.createAdmin(request),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admins });
      toast.success("Admin created");
    },
  });
}

export function useUpdateAdminUsername() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, username }: { adminId: string; username: string }) =>
      adminApi.updateAdminUsername(adminId, username),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admins });
      toast.success("Username updated");
    },
  });
}

export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId: string) => adminApi.deleteAdmin(adminId),
    onSuccess() {
      void queryClient.invalidateQueries({ queryKey: queryKeys.admins });
      toast.success("Admin deleted");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
