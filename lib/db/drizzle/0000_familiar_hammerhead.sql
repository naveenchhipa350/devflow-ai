CREATE TABLE "projects" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"members" integer DEFAULT 1 NOT NULL,
	"deadline" date,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"color" text DEFAULT '#d7f75b' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "projects_status_check" CHECK ("projects"."status" in ('active', 'planning', 'paused', 'on_hold', 'completed', 'archived')),
	CONSTRAINT "projects_priority_check" CHECK ("projects"."priority" in ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "projects_members_check" CHECK ("projects"."members" >= 1)
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"project_id" text NOT NULL,
	"status" text DEFAULT 'todo' NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"assignee" text DEFAULT '' NOT NULL,
	"due_date" date,
	"labels" text[] DEFAULT '{}' NOT NULL,
	"estimate" integer DEFAULT 3 NOT NULL,
	"comments" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tasks_status_check" CHECK ("tasks"."status" in ('todo', 'in_progress', 'review', 'done', 'backlog', 'blocked')),
	CONSTRAINT "tasks_priority_check" CHECK ("tasks"."priority" in ('low', 'medium', 'high', 'critical')),
	CONSTRAINT "tasks_estimate_check" CHECK ("tasks"."estimate" >= 0),
	CONSTRAINT "tasks_comments_check" CHECK ("tasks"."comments" >= 0)
);
--> statement-breakpoint
CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"user" text DEFAULT 'You' NOT NULL,
	"user_initials" text DEFAULT 'YO' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activity_kind_check" CHECK ("activity"."kind" in ('task', 'project', 'comment', 'github', 'commit', 'pull_request', 'issue', 'member'))
);
--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "projects_status_idx" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "projects_priority_idx" ON "projects" USING btree ("priority");--> statement-breakpoint
CREATE INDEX "tasks_project_id_idx" ON "tasks" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "tasks_status_idx" ON "tasks" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tasks_assignee_idx" ON "tasks" USING btree ("assignee");--> statement-breakpoint
CREATE INDEX "activity_kind_idx" ON "activity" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "activity_created_at_idx" ON "activity" USING btree ("created_at");