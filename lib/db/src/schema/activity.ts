import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const activity = pgTable(
  "activity",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    user: text("user").notNull().default("You"),
    userInitials: text("user_initials").notNull().default("YO"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("activity_kind_idx").on(table.kind),
    index("activity_created_at_idx").on(table.createdAt),
    check(
      "activity_kind_check",
      sql`${table.kind} in ('task', 'project', 'comment', 'github', 'commit', 'pull_request', 'issue', 'member')`,
    ),
  ],
);

export type ActivityItem = typeof activity.$inferSelect;
export type NewActivityItem = typeof activity.$inferInsert;