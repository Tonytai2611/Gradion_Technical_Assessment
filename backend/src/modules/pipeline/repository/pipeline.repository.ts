import type { AppDb } from "../../../shared/db/client.js";
import { nowIso } from "../../../shared/lib/time.js";
import type { ProjectModel } from "../../project/type/project.types.js";
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
