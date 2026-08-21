import { nanoid } from "nanoid";
import type { AppDb } from "../../../shared/db/client.js";
import { nowIso } from "../../../shared/lib/time.js";
import type { ChapterModel } from "../type/project.types.js";

type PersistedImage = {
  filePath: string;
  mimeType: string;
  source: "gemini" | "mock";
};

export class ChapterRepository {
  constructor(private readonly store: AppDb) {}

  replaceForProject(projectId: string, rows: Array<{ name: string; prompt: string }>) {
    const tx = this.store.sqlite.transaction(() => {
      this.store.sqlite.prepare("DELETE FROM chapters WHERE project_id = ?").run(projectId);
      const stmt = this.store.sqlite.prepare(`
        INSERT INTO chapters (id, project_id, name, prompt, illustration_path, illustration_mime_type, illustration_source, generation_state, created_at, updated_at)
        VALUES (?, ?, ?, ?, NULL, NULL, NULL, 'PENDING', ?, ?)
      `);
      for (const row of rows.slice(0, 1)) {
        const now = nowIso();
        stmt.run(nanoid(), projectId, row.name, row.prompt, now, now);
      }
    });
    tx();
  }

  listForProject(projectId: string): ChapterModel[] {
    return this.store.sqlite.prepare(`
      SELECT
        id,
        project_id AS projectId,
        name,
        prompt,
        illustration_path AS illustrationPath,
        illustration_mime_type AS illustrationMimeType,
        illustration_source AS illustrationSource,
        generation_state AS generationState,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM chapters
      WHERE project_id = ?
      ORDER BY created_at, id
    `).all(projectId) as ChapterModel[];
  }

  updateIllustration(id: string, image: PersistedImage) {
    this.store.sqlite.prepare(`
      UPDATE chapters
      SET illustration_path = ?, illustration_mime_type = ?, illustration_source = ?, generation_state = 'COMPLETED', updated_at = ?
      WHERE id = ?
    `).run(image.filePath, image.mimeType, image.source, nowIso(), id);
  }
}
