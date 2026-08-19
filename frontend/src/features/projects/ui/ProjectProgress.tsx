import type { Project } from "../types/project.types";

const steps = ["STYLE", "CHARACTERS", "PORTRAITS", "CHAPTERS", "ILLUSTRATIONS"];

export function completedCount(project: Project) {
  if (project.status === "DONE") return 5;
  const index = steps.indexOf(project.currentStep);
  return project.stepState === "COMPLETED" ? index + 1 : index;
}

export function ProjectProgress({ project }: { project: Project }) {
  const count = completedCount(project);
  return (
    <div className="flex gap-1" aria-label={`${count} of 5 steps complete`}>
      {steps.map((step, index) => (
        <span key={step} className={`h-1 w-6 rounded-full ${index < count ? "bg-grad-orange" : "bg-grad-line"}`} />
      ))}
    </div>
  );
}
