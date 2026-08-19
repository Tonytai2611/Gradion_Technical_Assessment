import type { Chapter } from "../../projects/types/project.types";

export function ChapterCard({ chapter }: { chapter: Chapter }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#e8e2e0] bg-white">
      <div className="flex aspect-video items-center justify-center bg-grad-paper text-xs font-bold uppercase tracking-wide text-neutral-500">
        {chapter.illustrationPath ? "Illustration" : "Illustration pending"}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold">{chapter.name}</h3>
          {chapter.illustrationSource && (
            <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
              {chapter.illustrationSource}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-600">{chapter.prompt}</p>
      </div>
    </article>
  );
}
