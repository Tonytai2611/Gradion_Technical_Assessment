import { Link, useParams } from "react-router-dom";
import { Shell } from "../../../shared/ui/Shell";
import { StatusToast } from "../../../shared/ui/StatusToast";
import { useProjectDetail } from "../hooks/useProjectDetail";
import { PipelineStepper } from "./PipelineStepper";
import { StepAction } from "./StepAction";
import { CharacterCard } from "./CharacterCard";
import { ChapterCard } from "./ChapterCard";

export function ProjectDetailPage() {
  const { projectId = "" } = useParams();
  const { data, isLoading, error } = useProjectDetail(projectId);
  const project = data?.project;

  return (
    <Shell>
      <Link className="mb-6 inline-block text-sm text-neutral-600 hover:text-grad-orange" to="/projects">{"<-"} Back to projects</Link>
      {isLoading && (
        <section className="rounded-lg border border-[#e8e2e0] bg-white p-6 text-sm text-neutral-600">
          Loading project...
        </section>
      )}
      {error && <p className="text-red-700">{error.message}</p>}
      {project && (
        <>
          <h1 className="mb-1 text-2xl font-bold">{project.title}</h1>
          <p className="mb-6 text-sm text-neutral-500">Created {new Date(project.createdAt).toLocaleDateString()}</p>
          <PipelineStepper project={project} />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
            <div>
              <StepAction project={project} />
              {project.chapters.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-4 text-lg font-bold">Chapters ({project.chapters.length})</h2>
                  <div className="grid gap-4">{project.chapters.map((chapter) => <ChapterCard key={chapter.id} chapter={chapter} />)}</div>
                </section>
              )}
              {project.characters.length > 0 && (
                <section className="mt-8">
                  <h2 className="mb-4 text-lg font-bold">Characters ({project.characters.length})</h2>
                  <div className="grid gap-4 sm:grid-cols-2">{project.characters.map((character) => <CharacterCard key={character.id} character={character} />)}</div>
                </section>
              )}
            </div>
            <aside className="space-y-4">
              {project.style && (
                <section className="rounded-lg bg-grad-paper p-5">
                  <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Style</h2>
                  <p className="text-sm text-grad-body">{project.style}</p>
                </section>
              )}
              <section className="rounded-lg bg-white p-5 ring-1 ring-[#e8e2e0]">
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-neutral-500">Book text</h2>
                <pre className="max-h-96 whitespace-pre-wrap overflow-auto text-sm leading-6 text-grad-body">{project.bookText}</pre>
              </section>
            </aside>
          </div>
        </>
      )}
      {isLoading && <StatusToast title="Loading project" description="Fetching the latest pipeline state." />}
    </Shell>
  );
}
