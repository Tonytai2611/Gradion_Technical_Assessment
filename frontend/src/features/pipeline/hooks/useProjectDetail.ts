import { useQuery } from "@tanstack/react-query";
import { getProject } from "../../projects/services/project.service";

export function useProjectDetail(projectId: string) {
  return useQuery({
    queryKey: ["project", projectId],
    queryFn: () => getProject(projectId),
    refetchInterval: (query) => query.state.data?.project.stepState === "RUNNING" ? 2000 : false
  });
}
