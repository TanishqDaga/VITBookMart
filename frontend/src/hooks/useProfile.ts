import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { userApi } from "@/api/userApi";
import { useAuth } from "@/context/AuthContext";
import { queryKeys } from "@/lib/queryKeys";
import type { UpdateUserProfileRequest } from "@/types";

/** GET /api/users/me. Only runs when there is a session. */
export function useProfile() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: queryKeys.me.profile,
    queryFn: () => userApi.getMe(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/** PUT /api/users/me/update. Keeps AuthContext and the query cache in step. */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { setUser } = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateUserProfileRequest) => userApi.updateMe(payload),
    onSuccess(updated) {
      setUser(updated);
      queryClient.setQueryData(queryKeys.me.profile, updated);
      toast.success("Profile updated");
    },
  });
}
