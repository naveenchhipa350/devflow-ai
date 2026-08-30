import { sql } from "drizzle-orm";
import { check, date, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { projects } from "./projects";

export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("todo"),
    priority: text("priority").notNull().default("medium"),
    assignee: text("assignee").notNull().default(""),
    dueDate: date("due_date", { mode: "string" }),
    labels: text("labels").array().notNull().default([]),
    estimate: integer("estimate").notNull().default(3),
    comments: integer("comments").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("tasks_project_id_idx").on(table.projectId),
    index("tasks_status_idx").on(table.status),
    index("tasks_assignee_idx").on(table.assignee),
    check(
      "tasks_status_check",
      sql`${table.status} in ('todo', 'in_progress', 'review', 'done', 'backlog', 'blocked')`,
    ),
    check("tasks_priority_check", sql`${table.priority} in ('low', 'medium', 'high', 'critical')`),
    check("tasks_estimate_check", sql`${table.estimate} >= 0`),
    check("tasks_comments_check", sql`${table.comments} >= 0`),
  ],
);

export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;