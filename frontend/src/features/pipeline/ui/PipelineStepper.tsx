import type { Project } from "../../projects/types/project.types";

const steps = ["STYLE", "CHARACTERS", "PORTRAITS", "CHAPTERS", "ILLUSTRATIONS"] as const;
const labels = {
  STYLE: "Style",
  CHARACTERS: "Characters",
  PORTRAITS: "Portraits",
  CHAPTERS: "Chapters",
  ILLUSTRATIONS: "Illustrations"
};

export function PipelineStepper({ project }: { project: Project }) {
  const currentIndex = steps.indexOf(project.currentStep);
  const completeThrough = project.status === "DONE" ? steps.length : currentIndex;

  return (
    <ol className="mb-8 flex flex-wrap items-center gap-2">
      {steps.map((step, index) => {
        const done = index < completeThrough;
        const current = index === currentIndex && project.status !== "DONE";
        return (
          <li key={step} className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black text-white ${done ? "bg-grad-ink" : current ? "bg-grad-orange" : "bg-grad-line"}`}>
              {done ? "OK" : index + 1}
            </span>
            <span className={`text-sm font-semibold ${current ? "text-grad-ink" : "text-neutral-500"}`}>{labels[step]}</span>
          </li>
        );
      })}
    </ol>
  );
}
