import { Link } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { Shell } from "../../../shared/ui/Shell";
import { useProjects } from "../hooks/useProjects";
import { ProjectProgress } from "./ProjectProgress";

export function ProjectsPage() {
  const { data, isLoading } = useProjects();
  const projects = data?.projects ?? [];

  return (
    <Shell>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-black">Your projects</h1>
        <Link to="/projects/new"><Button>+ New project</Button></Link>
      </div>
      {isLoading ? <p>Loading projects...</p> : null}
      {!isLoading && projects.length === 0 ? (
        <section className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed border-grad-line text-center">
          <p className="mb-4 text-neutral-600">No projects yet.</p>
          <Link to="/projects/new"><Button>+ New project</Button></Link>
        </section>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}`} className="flex items-center gap-6 rounded-lg border border-[#e8e2e0] bg-white p-5 transition hover:-translate-y-px hover:shadow-sm">
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-bold text-grad-ink">{project.title}</h2>
                <p className="text-xs text-neutral-500">Created {new Date(project.createdAt).toLocaleDateString()}</p>
              </div>
              <ProjectProgress project={project} />
              <span className={`rounded-full px-3 py-2 text-xs font-bold text-white ${project.status === "DONE" ? "bg-grad-ink" : project.status === "DRAFT" ? "bg-neutral-400" : "bg-grad-orange"}`}>
                {project.status === "DONE" ? "Done" : project.status === "DRAFT" ? "Draft" : "In progress"}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Shell>
  );
}
