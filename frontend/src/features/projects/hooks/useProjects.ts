import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as projectService from "../services/project.service";

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: projectService.listProjects
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: projectService.createProject,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] })
  });
}
