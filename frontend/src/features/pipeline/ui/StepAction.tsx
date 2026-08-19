import { useState } from "react";
import { Button } from "../../../shared/ui/Button";
import type { ProjectDetail } from "../../projects/types/project.types";
import { useRecoverStep, useRunStep } from "../hooks/useRunStep";

const labels = {
  STYLE: "Style",
  CHARACTERS: "Characters",
  PORTRAITS: "Portraits",
  CHAPTERS: "Chapters",
  ILLUSTRATIONS: "Illustrations"
};

const runningCopy = {
  STYLE: "Reading the book text and defining the art style",
  CHARACTERS: "Generating the adult character list",
  PORTRAITS: "Generating character portraits",
  CHAPTERS: "Generating the chapter prompt",
  ILLUSTRATIONS: "Generating the chapter illustration"
};

export function StepAction({ project }: { project: ProjectDetail }) {
  const [customStyle, setCustomStyle] = useState("");
  const run = useRunStep(project.id);
  const recover = useRecoverStep(project.id);

  if (project.status === "DONE") {
    return (
      <section className="rounded-lg border border-[#e8e2e0] bg-white p-6">
        <p className="font-semibold">All 5 steps complete.</p>
        <p className="mt-1 text-sm text-neutral-600">Reopen this project any time; nothing regenerates automatically.</p>
      </section>
    );
  }

  if (project.isStale) {
    return (
      <section className="rounded-lg border border-amber-300 bg-amber-50 p-6">
        <p className="font-semibold">This {labels[project.currentStep]} step looks interrupted.</p>
        <p className="mt-1 text-sm text-neutral-700">Completed earlier results are preserved. You can mark this step retryable.</p>
        <Button className="mt-4 bg-white text-grad-ink ring-1 ring-grad-ink hover:bg-grad-paper" onClick={() => recover.mutate(project)}>
          Recover {labels[project.currentStep]}
        </Button>
      </section>
    );
  }

  if (project.stepState === "RUNNING") {
    return (
      <section className="rounded-lg border border-[#e8e2e0] bg-white p-6">
        <div className="flex items-center gap-3 text-sm text-neutral-700">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-grad-line border-t-grad-orange" />
          {runningCopy[project.currentStep]}...
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#e8e2e0] bg-white p-6">
      <p className="font-semibold">Ready for the next step: {labels[project.currentStep]}.</p>
      {project.stepState === "FAILED" && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {project.lastError ?? "This step failed."}
        </div>
      )}
      {project.currentStep === "STYLE" && (
        <label className="mt-4 block">
          <span className="mb-1 block text-xs font-semibold">Art style (optional)</span>
          <input className="gd-focus w-full rounded-md border border-grad-line bg-white px-3 py-3 text-sm" value={customStyle} onChange={(event) => setCustomStyle(event.target.value)} />
        </label>
      )}
      <Button className="mt-4 min-w-48" disabled={run.isPending} onClick={() => run.mutate({ project, customStyle })}>
        {project.stepState === "FAILED" ? "Retry" : "Generate"} {labels[project.currentStep]} {"->"}
      </Button>
    </section>
  );
}
