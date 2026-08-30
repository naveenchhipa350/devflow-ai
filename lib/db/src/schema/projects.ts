import { sql } from "drizzle-orm";
import { check, date, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const projects = pgTable(
  "projects",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("active"),
    priority: text("priority").notNull().default("medium"),
    members: integer("members").notNull().default(1),
    deadline: date("deadline", { mode: "string" }),
    tags: text("tags").array().notNull().default([]),
    color: text("color").notNull().default("#d7f75b"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("projects_status_idx").on(table.status),
    index("projects_priority_idx").on(table.priority),
    check(
      "projects_status_check",
      sql`${table.status} in ('active', 'planning', 'paused', 'on_hold', 'completed', 'archived')`,
    ),
    check("projects_priority_check", sql`${table.priority} in ('low', 'medium', 'high', 'critical')`),
    check("projects_members_check", sql`${table.members} >= 1`),
  ],
);

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;