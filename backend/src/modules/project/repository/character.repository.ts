import { nanoid } from "nanoid";
import type { AppDb } from "../../../shared/db/client.js";
import { nowIso } from "../../../shared/lib/time.js";
import type { CharacterModel } from "../type/project.types.js";

type PersistedImage = {
  filePath: string;
  mimeType: string;
  source: "gemini" | "mock";
};

export class CharacterRepository {
  constructor(private readonly store: AppDb) {}

  replaceForProject(projectId: string, rows: Array<{ name: string; prompt: string }>) {
    const tx = this.store.sqlite.transaction(() => {
      this.store.sqlite.prepare("DELETE FROM characters WHERE project_id = ?").run(projectId);
      const stmt = this.store.sqlite.prepare(`
        INSERT INTO characters (id, project_id, name, prompt, portrait_path, portrait_mime_type, portrait_source, generation_state, created_at, updated_at)
        VALUES (?, ?, ?, ?, NULL, NULL, NULL, 'PENDING', ?, ?)
      `);
      for (const row of rows.slice(0, 2)) {
        const now = nowIso();
        stmt.run(nanoid(), projectId, row.name, row.prompt, now, now);
      }
    });
    tx();
  }

  listForProject(projectId: string): CharacterModel[] {
    return this.store.sqlite.prepare(`
      SELECT
        id,
        project_id AS projectId,
        name,
        prompt,
        portrait_path AS portraitPath,
        portrait_mime_type AS portraitMimeType,
        portrait_source AS portraitSource,
        generation_state AS generationState,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM characters
      WHERE project_id = ?
      ORDER BY created_at, id
    `).all(projectId) as CharacterModel[];
  }

  updatePortrait(id: string, image: PersistedImage) {
    this.store.sqlite.prepare(`
      UPDATE characters
      SET portrait_path = ?, portrait_mime_type = ?, portrait_source = ?, generation_state = 'COMPLETED', updated_at = ?
      WHERE id = ?
    `).run(image.filePath, image.mimeType, image.source, nowIso(), id);
  }
}
