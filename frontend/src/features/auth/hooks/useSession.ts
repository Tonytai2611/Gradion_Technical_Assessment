import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as authService from "../services/auth.service";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: authService.getSession
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.signIn,
    onSuccess: (data) => queryClient.setQueryData(["session"], data)
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authService.signOut,
    onSuccess: () => {
      queryClient.setQueryData(["session"], { user: null });
      queryClient.removeQueries({ queryKey: ["projects"] });
      queryClient.removeQueries({ queryKey: ["project"] });
    }
  });
}
