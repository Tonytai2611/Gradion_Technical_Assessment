import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../../../shared/ui/Button";
import { Shell } from "../../../shared/ui/Shell";
import { useCreateProject } from "../hooks/useProjects";

export function NewProjectPage() {
  const [title, setTitle] = useState("");
  const [bookText, setBookText] = useState("");
  const [error, setError] = useState("");
  const createProject = useCreateProject();
  const navigate = useNavigate();

  async function handleFile(file?: File) {
    if (!file) return;
    if (!file.name.endsWith(".txt")) {
      setError("Upload a .txt file.");
      return;
    }
    setBookText(await file.text());
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim() || !bookText.trim()) {
      setError("Give the project a title and provide book text.");
      return;
    }
    const result = await createProject.mutateAsync({ title, bookText });
    navigate(`/projects/${result.project.id}`);
  }

  return (
    <Shell>
      <div className="mx-auto max-w-lg">
        <Link className="mb-6 inline-block text-sm text-neutral-600 hover:text-grad-orange" to="/projects">← Back to projects</Link>
        <h1 className="mb-2 text-2xl font-bold">Start a new illustration project</h1>
        <p className="mb-6 text-sm text-neutral-500">Give it a title, then paste the book's text or upload a .txt file.</p>
        <form onSubmit={submit}>
          <label className="mb-5 block">
            <span className="mb-1 block text-xs font-semibold">Project title *</span>
            <input className="gd-focus w-full rounded-md border border-grad-line bg-white px-3 py-3 text-sm" value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label className="mb-4 flex cursor-pointer flex-col items-center rounded-lg border border-dashed border-grad-line bg-grad-paper p-8 text-sm">
            <span className="font-semibold">Click to choose a .txt file</span>
            <span className="mt-2 text-xs text-neutral-500">Plain text only, used once as context later</span>
            <input className="sr-only" type="file" accept=".txt" onChange={(event) => handleFile(event.target.files?.[0])} />
          </label>
          <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
            <span className="h-px flex-1 bg-[#e8e2e0]" />
            or paste text
            <span className="h-px flex-1 bg-[#e8e2e0]" />
          </div>
          <textarea className="gd-focus min-h-36 w-full rounded-md border border-grad-line bg-white p-3 text-sm" value={bookText} onChange={(event) => setBookText(event.target.value)} />
          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
          <Button className="mt-6 w-full" disabled={createProject.isPending}>Create project {"->"}</Button>
        </form>
      </div>
    </Shell>
  );
}
