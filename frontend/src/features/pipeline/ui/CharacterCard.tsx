import type { Character } from "../../projects/types/project.types";

export function CharacterCard({ character }: { character: Character }) {
  return (
    <article className="overflow-hidden rounded-lg border border-[#e8e2e0] bg-white">
      <div className="flex aspect-[3/4] items-center justify-center bg-grad-paper text-xs font-bold uppercase tracking-wide text-neutral-500">
        {character.portraitPath ? "Portrait" : "Portrait pending"}
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold">{character.name}</h3>
          {character.portraitSource && (
            <span className="rounded-full bg-neutral-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
              {character.portraitSource}
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-neutral-600">{character.prompt}</p>
      </div>
    </article>
  );
}
