import { nanoid } from "nanoid";
import type { AppDb } from "../../../shared/db/client.js";
import { nowIso } from "../../../shared/lib/time.js";
import type { ChapterModel, CharacterModel, ProjectModel } from "../../project/type/project.types.js";
import type { GeneratedImage } from "../service/gemini.service.js";
import type { PipelineStep, ProjectStatus, StepState } from "../type/pipeline.types.js";

export class PipelineRepository {
  constructor(private readonly store: AppDb) {}

  findProject(projectId: string): ProjectModel | undefined {
    return this.store.sqlite.prepare(`
      SELECT
        id,
        user_id AS userId,
        title,
        book_path AS bookPath,
        status,
        current_step AS currentStep,
        step_state AS stepState,
        step_started_at AS stepStartedAt,
        last_error AS lastError,
        style,
        gemini_context_reference AS geminiContextReference,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM projects
      WHERE id = ?
    `).get(projectId) as ProjectModel | undefined;
  }

  claimStep(projectId: string, step: PipelineStep) {
    const result = this.store.sqlite.prepare(`
      UPDATE projects
      SET step_state = 'RUNNING', step_started_at = ?, last_error = NULL, updated_at = ?
      WHERE id = ? AND current_step = ? AND step_state IN ('READY', 'FAILED')
    `).run(nowIso(), nowIso(), projectId, step);
    return result.changes === 1;
  }

  markCompleted(projectId: string, next: PipelineStep | null, status: ProjectStatus) {
    const currentStep = next ?? "ILLUSTRATIONS";
    this.store.sqlite.prepare(`
      UPDATE projects
      SET step_state = ?, current_step = ?, status = ?, step_started_at = NULL, last_error = NULL, updated_at = ?
      WHERE id = ?
    `).run(next ? "READY" : "COMPLETED", currentStep, status, nowIso(), projectId);
  }

  markFailed(projectId: string, error: string) {
    this.store.sqlite.prepare(`
      UPDATE projects
      SET step_state = 'FAILED', step_started_at = NULL, last_error = ?, updated_at = ?
      WHERE id = ?
    `).run(error, nowIso(), projectId);
  }

  setStyle(projectId: string, style: string) {
    this.store.sqlite.prepare("UPDATE projects SET style = ?, updated_at = ? WHERE id = ?").run(style, nowIso(), projectId);
  }

  setGeminiContextReference(projectId: string, contextReference: string) {
    this.store.sqlite.prepare("UPDATE projects SET gemini_context_reference = ?, updated_at = ? WHERE id = ?").run(contextReference, nowIso(), projectId);
  }

  replaceCharacters(projectId: string, rows: Array<{ name: string; prompt: string }>) {
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

  replaceChapters(projectId: string, rows: Array<{ name: string; prompt: string }>) {
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

  listCharacters(projectId: string): CharacterModel[] {
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
    `).all(projectId) as CharacterModel[];
  }

  listChapters(projectId: string): ChapterModel[] {
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
    `).all(projectId) as ChapterModel[];
  }

  updateCharacterPortrait(id: string, image: GeneratedImage) {
    this.store.sqlite.prepare(`
      UPDATE characters
      SET portrait_path = ?, portrait_mime_type = ?, portrait_source = ?, generation_state = 'COMPLETED', updated_at = ?
      WHERE id = ?
    `).run(image.filePath, image.mimeType, image.source, nowIso(), id);
  }

  updateChapterIllustration(id: string, image: GeneratedImage) {
    this.store.sqlite.prepare(`
      UPDATE chapters
      SET illustration_path = ?, illustration_mime_type = ?, illustration_source = ?, generation_state = 'COMPLETED', updated_at = ?
      WHERE id = ?
    `).run(image.filePath, image.mimeType, image.source, nowIso(), id);
  }

  recoverStale(projectId: string, staleBeforeIso: string) {
    const result = this.store.sqlite.prepare(`
      UPDATE projects
      SET step_state = 'FAILED', step_started_at = NULL, last_error = 'Step was interrupted and can be retried.', updated_at = ?
      WHERE id = ? AND step_state = 'RUNNING' AND step_started_at < ?
    `).run(nowIso(), projectId, staleBeforeIso);
    return result.changes === 1;
  }

  setStepStateForTest(projectId: string, state: StepState, startedAt: string | null = null) {
    this.store.sqlite.prepare("UPDATE projects SET step_state = ?, step_started_at = ? WHERE id = ?").run(state, startedAt, projectId);
  }
}
