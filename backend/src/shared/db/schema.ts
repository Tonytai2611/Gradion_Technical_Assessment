import { sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull()
  },
  (table) => ({
    emailIdx: uniqueIndex("users_email_unique").on(table.email)
  })
);

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  bookPath: text("book_path").notNull(),
  status: text("status").notNull(),
  currentStep: text("current_step").notNull(),
  stepState: text("step_state").notNull(),
  stepStartedAt: text("step_started_at"),
  lastError: text("last_error"),
  style: text("style"),
  geminiContextReference: text("gemini_context_reference"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const characters = sqliteTable("characters", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  portraitPath: text("portrait_path"),
  portraitMimeType: text("portrait_mime_type"),
  portraitSource: text("portrait_source"),
  generationState: text("generation_state").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const chapters = sqliteTable("chapters", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  illustrationPath: text("illustration_path"),
  illustrationMimeType: text("illustration_mime_type"),
  illustrationSource: text("illustration_source"),
  generationState: text("generation_state").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull()
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull()
});
