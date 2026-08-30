import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { activity, db, projects, tasks, type NewProject, type NewTask } from "@workspace/db";
import {
  AskCopilotBody,
  AskCopilotResponse,
  CreateProjectBody,
  CreateProjectResponse,
  CreateTaskBody,
  CreateTaskResponse,
  DeleteProjectParams,
  DeleteTaskParams,
  GetDashboardResponse,
  ListActivityResponse,
  ListProjectsQueryParams,
  ListProjectsResponse,
  ListTasksQueryParams,
  ListTasksResponse,
  UpdateProjectBody,
  UpdateProjectParams,
  UpdateProjectResponse,
  UpdateTaskBody,
  UpdateTaskParams,
  UpdateTaskResponse,
} from "@workspace/api-zod";

type ProjectRow = typeof projects.$inferSelect;
type TaskRow = typeof tasks.$inferSelect;
type ActivityRow = typeof activity.$inferSelect;

type TaskWithProject = TaskRow & { projectName: string };

const colors = ["#d7f75b", "#f38b6b", "#9a8cff", "#6bd4c7", "#f3c969"];

const newId = (prefix: string) => `${prefix}-${randomUUID().slice(0, 8)}`;

const initialsFor = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

const relativeTime = (value: Date): string => {
  const seconds = Math.floor((Date.now() - value.getTime()) / 1000);
  if (seconds < 45) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return value.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const githubActivity = [
  {
    id: "github-1",
    kind: "pull_request",
    title: "Add validation for project updates",
    repository: "devflow/lattice-api",
    author: "Jon Bell",
    timestamp: "38 min ago",
  },
  {
    id: "github-2",
    kind: "commit",
    title: "Polish workspace overview states",
    repository: "devflow/orbit-web",
    author: "Maya Chen",
    timestamp: "2 hrs ago",
  },
  {
    id: "github-3",
    kind: "issue",
    title: "Document activity event payloads",
    repository: "devflow/lattice-api",
    author: "Ari Patel",
    timestamp: "Yesterday",
  },
];

const productivity = [
  { label: "Mon", value: 46 },
  { label: "Tue", value: 58 },
  { label: "Wed", value: 52 },
  { label: "Thu", value: 71 },
  { label: "Fri", value: 64 },
  { label: "Sat", value: 78 },
  { label: "Sun", value: 67 },
];

const taskCompletion = [
  { label: "W1", completed: 18, created: 24 },
  { label: "W2", completed: 29, created: 31 },
  { label: "W3", completed: 24, created: 35 },
  { label: "W4", completed: 41, created: 33 },
  { label: "W5", completed: 37, created: 29 },
  { label: "W6", completed: 49, created: 38 },
];

const insights = [
  {
    title: "Momentum is up",
    body: "Your team completed 18% more work this week, with the strongest lift coming from Orbit release.",
    tone: "positive",
  },
  {
    title: "Review is the current bottleneck",
    body: "4 tasks have been in Review for more than 24 hours. A focused review block could unlock the next release cut.",
    tone: "attention",
  },
];

// ---------------------------------------------------------------------------
// Query helpers
// ---------------------------------------------------------------------------

const loadTaskStats = async () => {
  const rows = await db
    .select({
      projectId: tasks.projectId,
      status: tasks.status,
      count: sql<number>`count(*)::int`,
    })
    .from(tasks)
    .groupBy(tasks.projectId, tasks.status);

  const stats = new Map<string, { taskCount: number; completedTaskCount: number }>();
  for (const row of rows) {
    const current = stats.get(row.projectId) ?? { taskCount: 0, completedTaskCount: 0 };
    current.taskCount += row.count;
    if (row.status === "done") current.completedTaskCount += row.count;
    stats.set(row.projectId, current);
  }
  return stats;
};

const projectResponse = (project: ProjectRow, stats?: { taskCount: number; completedTaskCount: number }) => {
  const taskCount = stats?.taskCount ?? 0;
  const completedTaskCount = stats?.completedTaskCount ?? 0;
  const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    priority: project.priority,
    progress,
    taskCount,
    completedTaskCount,
    members: project.members,
    deadline: project.deadline,
    tags: project.tags,
    color: project.color,
  };
};

const taskResponse = (task: TaskWithProject) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  projectId: task.projectId,
  projectName: task.projectName,
  status: task.status,
  priority: task.priority,
  assignee: task.assignee,
  assigneeInitials: initialsFor(task.assignee),
  dueDate: task.dueDate,
  labels: task.labels,
  comments: task.comments,
  estimate: task.estimate,
});

const activityResponse = (item: ActivityRow) => ({
  id: item.id,
  kind: item.kind,
  title: item.title,
  description: item.description,
  user: item.user,
  userInitials: item.userInitials,
  timestamp: relativeTime(item.createdAt),
});

const loadTasksWithProjects = async (where?: ReturnType<typeof and>) => {
  const rows = await db
    .select({ task: tasks, projectName: projects.name })
    .from(tasks)
    .innerJoin(projects, eq(tasks.projectId, projects.id))
    .where(where)
    .orderBy(desc(tasks.createdAt));
  return rows.map((row): TaskWithProject => ({ ...row.task, projectName: row.projectName }));
};

// ---------------------------------------------------------------------------
// Activity recording
// ---------------------------------------------------------------------------

type DbClient = Pick<typeof db, "insert">;

const recordActivity = async (
  client: DbClient,
  input: { kind: string; title: string; description: string; user?: string; userInitials?: string },
) => {
  await client.insert(activity).values({
    id: newId("activity"),
    kind: input.kind,
    title: input.title,
    description: input.description,
    user: input.user ?? "You",
    userInitials: input.userInitials ?? "YO",
  });
};

// ---------------------------------------------------------------------------
// Copilot grounding
// ---------------------------------------------------------------------------

const todayIso = () => new Date().toISOString().slice(0, 10);

type GroundedProject = ReturnType<typeof projectResponse>;
type GroundedTask = ReturnType<typeof taskResponse>;

const getCopilotAnswer = (
  projects: GroundedProject[],
  tasks: GroundedTask[],
  message: string,
) => {
  const prompt = message.toLowerCase();
  const overdue = tasks.filter(
    (task) => task.dueDate && task.dueDate < todayIso() && task.status !== "done",
  );
  const reviewTasks = tasks.filter((task) => task.status === "review");
  const nextTask =
    tasks.find((task) => task.status === "in_progress") ??
    tasks.find((task) => task.status === "todo");

  if (prompt.includes("overdue")) {
    return {
      answer: overdue.length
        ? `I found ${overdue.length} overdue task${overdue.length === 1 ? "" : "s"}: ${overdue.map((task) => task.title).join(", ")}.`
        : "There are no overdue tasks in the current workspace data.",
      sources: ["Task queue", "Project deadlines"],
      actions: overdue.length ? ["Open overdue tasks", "Review assignees"] : ["View task queue"],
    };
  }

  if (prompt.includes("next") || prompt.includes("priorit")) {
    return {
      answer: nextTask
        ? `The best next move is “${nextTask.title}” in ${nextTask.projectName}. It is already in ${nextTask.status.toLowerCase()} and owned by ${nextTask.assignee}, so finishing it should reduce the most active delivery risk.`
        : "The workspace does not have an obvious next task yet. Add a task or update an existing priority to give me more context.",
      sources: ["Task queue", "Project status"],
      actions: ["Open task queue", "View project health"],
    };
  }

  if (prompt.includes("review")) {
    return {
      answer: `There ${reviewTasks.length === 1 ? "is" : "are"} ${reviewTasks.length} task${reviewTasks.length === 1 ? "" : "s"} in Review right now. The highest-impact one is “${reviewTasks[0]?.title ?? "the current review queue"}” for ${reviewTasks[0]?.projectName ?? "your workspace"}.`,
      sources: ["Task queue", "Recent activity"],
      actions: ["Open review queue", "Create review block"],
    };
  }

  return {
    answer: `I’m looking at ${projects.length} projects and ${tasks.length} tracked tasks. ${projects.filter((project) => project.status === "active").length} projects are active, and the team has ${tasks.filter((task) => task.status === "done").length} completed tasks in the current workspace slice. Ask me about overdue work, priorities, or review bottlenecks for a grounded answer.`,
    sources: ["Workspace dashboard", "Projects", "Task queue"],
    actions: ["Summarize the workspace", "Find overdue tasks", "Suggest next work"],
  };
};

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const router: IRouter = Router();

router.get("/dashboard", async (req, res) => {
  req.log.info("Loading workspace dashboard");

  const [projectRows, taskRows, recentActivity] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        status: tasks.status,
        title: tasks.title,
        assignee: tasks.assignee,
        dueDate: tasks.dueDate,
      })
      .from(tasks),
    db.select().from(activity).orderBy(desc(activity.createdAt)).limit(5),
  ]);

  const completedTasks = taskRows.filter((task) => task.status === "done").length;
  const deadlines = projectRows
    .filter((project) => project.deadline)
    .map((project) => {
      const due = new Date(`${project.deadline}T00:00:00`);
      const daysLeft = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
      return {
        id: `deadline-${project.id}`,
        title: project.name,
        project: project.name,
        dueDate: due.toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
        daysLeft,
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  res.json(
    GetDashboardResponse.parse({
      totalProjects: projectRows.length,
      activeProjects: projectRows.filter((project) => project.status === "active").length,
      completedTasks,
      pendingTasks: taskRows.length - completedTasks,
      teamMembers: new Set(taskRows.map((task) => task.assignee).filter(Boolean)).size || 1,
      productivity,
      taskCompletion,
      deadlines,
      recentActivity: recentActivity.map(activityResponse),
      githubActivity,
      insights,
    }),
  );
});

router.get("/projects", async (req, res) => {
  const query = ListProjectsQueryParams.parse(req.query);
  const rows = query.status
    ? await db.select().from(projects).where(eq(projects.status, query.status)).orderBy(desc(projects.createdAt))
    : await db.select().from(projects).orderBy(desc(projects.createdAt));
  const stats = await loadTaskStats();
  res.json(ListProjectsResponse.parse(rows.map((project) => projectResponse(project, stats.get(project.id)))));
});

router.post("/projects", async (req, res) => {
  const input = CreateProjectBody.parse(req.body);

  const created = await db.transaction(async (tx) => {
    const newProject: NewProject = {
      id: newId("project"),
      name: input.name,
      description: input.description,
      status: input.status,
      priority: input.priority,
      deadline: input.deadline,
      tags: input.tags,
      members: 1,
      color: colors[Math.floor(Math.random() * colors.length)] ?? colors[0]!,
    };

    const [row] = await tx.insert(projects).values(newProject).returning();
    await recordActivity(tx, {
      kind: "project",
      title: "You created a project",
      description: newProject.name,
    });
    return row!;
  });

  res.status(201).json(CreateProjectResponse.parse(projectResponse(created)));
});

router.patch("/projects/:id", async (req, res) => {
  const params = UpdateProjectParams.parse(req.params);
  const input = UpdateProjectBody.parse(req.body);

  const existing = await db.select().from(projects).where(eq(projects.id, params.id)).limit(1);
  if (existing.length === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const set: Partial<Pick<ProjectRow, "name" | "description" | "status" | "priority" | "deadline" | "tags">> = {};
  if (input.name !== undefined) set.name = input.name;
  if (input.description !== undefined) set.description = input.description;
  if (input.status !== undefined) set.status = input.status;
  if (input.priority !== undefined) set.priority = input.priority;
  if (input.deadline !== undefined) set.deadline = input.deadline;
  if (input.tags !== undefined) set.tags = input.tags;

  await db.transaction(async (tx) => {
    await tx.update(projects).set(set).where(eq(projects.id, params.id));
    await recordActivity(tx, {
      kind: "project",
      title: "You updated a project",
      description: input.name ?? existing[0]!.name,
    });
  });

  const updated: ProjectRow = { ...existing[0]!, ...set };
  const stats = await loadTaskStats();
  res.json(UpdateProjectResponse.parse(projectResponse(updated, stats.get(updated.id))));
});

router.delete("/projects/:id", async (req, res) => {
  const params = DeleteProjectParams.parse(req.params);
  const existing = await db.select().from(projects).where(eq(projects.id, params.id)).limit(1);
  if (existing.length === 0) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(projects).where(eq(projects.id, params.id));
    await recordActivity(tx, {
      kind: "project",
      title: "You deleted a project",
      description: existing[0]!.name,
    });
  });

  res.status(204).send();
});

router.get("/tasks", async (req, res) => {
  const query = ListTasksQueryParams.parse(req.query);
  const conditions = [];
  if (query.status) conditions.push(eq(tasks.status, query.status));
  if (query.projectId) conditions.push(eq(tasks.projectId, query.projectId));

  const rows = await loadTasksWithProjects(conditions.length > 0 ? and(...conditions) : undefined);
  res.json(ListTasksResponse.parse(rows.map(taskResponse)));
});

router.post("/tasks", async (req, res) => {
  const input = CreateTaskBody.parse(req.body);

  const project = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
  if (project.length === 0) {
    res.status(400).json({ error: "Project not found" });
    return;
  }

  const created = await db.transaction(async (tx) => {
    const newTask: NewTask = {
      id: newId("task"),
      title: input.title,
      description: input.description,
      projectId: input.projectId,
      status: input.status,
      priority: input.priority,
      assignee: input.assignee,
      dueDate: input.dueDate,
      labels: input.labels,
      comments: 0,
      estimate: 3,
    };

    const [row] = await tx.insert(tasks).values(newTask).returning();
    await recordActivity(tx, {
      kind: "task",
      title: "You created a task",
      description: newTask.title,
    });
    return row!;
  });

  res
    .status(201)
    .json(CreateTaskResponse.parse(taskResponse({ ...created, projectName: project[0]!.name })));
});

router.patch("/tasks/:id", async (req, res) => {
  const params = UpdateTaskParams.parse(req.params);
  const input = UpdateTaskBody.parse(req.body);

  const current = await db.select().from(tasks).where(eq(tasks.id, params.id)).limit(1);
  if (current.length === 0) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  const currentProject = await db.select().from(projects).where(eq(projects.id, current[0]!.projectId)).limit(1);
  const currentProjectName = currentProject[0]?.name ?? "";

  let nextProjectId = current[0]!.projectId;
  let nextProjectName = currentProjectName;
  if (input.projectId !== undefined) {
    const project = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
    if (project.length === 0) {
      res.status(400).json({ error: "Project not found" });
      return;
    }
    nextProjectId = project[0]!.id;
    nextProjectName = project[0]!.name;
  }

  const set: Partial<
    Pick<TaskRow, "title" | "description" | "projectId" | "status" | "priority" | "assignee" | "dueDate" | "labels">
  > = {};
  if (input.title !== undefined) set.title = input.title;
  if (input.description !== undefined) set.description = input.description;
  if (input.projectId !== undefined) set.projectId = nextProjectId;
  if (input.status !== undefined) set.status = input.status;
  if (input.priority !== undefined) set.priority = input.priority;
  if (input.assignee !== undefined) set.assignee = input.assignee;
  if (input.dueDate !== undefined) set.dueDate = input.dueDate;
  if (input.labels !== undefined) set.labels = input.labels;

  const statusChanged = input.status !== undefined && input.status !== current[0]!.status;
  await db.transaction(async (tx) => {
    await tx.update(tasks).set(set).where(eq(tasks.id, params.id));
    await recordActivity(tx, {
      kind: "task",
      title: statusChanged ? `Task moved to ${input.status}` : "You updated a task",
      description: input.title ?? current[0]!.title,
    });
  });

  const updated: TaskRow = { ...current[0]!, ...set };
  res.json(UpdateTaskResponse.parse(taskResponse({ ...updated, projectName: nextProjectName })));
});

router.delete("/tasks/:id", async (req, res) => {
  const params = DeleteTaskParams.parse(req.params);
  const current = await db.select().from(tasks).where(eq(tasks.id, params.id)).limit(1);
  if (current.length === 0) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  await db.transaction(async (tx) => {
    await tx.delete(tasks).where(eq(tasks.id, params.id));
    await recordActivity(tx, {
      kind: "task",
      title: "You deleted a task",
      description: current[0]!.title,
    });
  });

  res.status(204).send();
});

router.get("/activity", async (_req, res) => {
  const rows = await db.select().from(activity).orderBy(desc(activity.createdAt)).limit(50);
  res.json(ListActivityResponse.parse(rows.map(activityResponse)));
});

router.post("/copilot/messages", async (req, res) => {
  const { message } = AskCopilotBody.parse(req.body);

  const [projectRows, taskRows, recentActivity] = await Promise.all([
    db.select().from(projects).orderBy(desc(projects.createdAt)),
    loadTasksWithProjects(),
    db.select().from(activity).orderBy(desc(activity.createdAt)).limit(8),
  ]);

  const stats = await loadTaskStats();
  const groundedProjects = projectRows.map((project) => projectResponse(project, stats.get(project.id)));
  const groundedTasks = taskRows.map(taskResponse);
  const grounded = getCopilotAnswer(groundedProjects, groundedTasks, message);

  if (!process.env.OPENAI_API_KEY) {
    res.json(AskCopilotResponse.parse(grounded));
    return;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `You are DevFlow Copilot. Only use this workspace context and be explicit when the data is insufficient. Workspace context: ${JSON.stringify({
              projects: groundedProjects,
              tasks: groundedTasks,
              activity: recentActivity.map(activityResponse),
            })}`,
          },
          { role: "user", content: message },
        ],
      }),
    });
    if (!response.ok) {
      res.json(AskCopilotResponse.parse(grounded));
      return;
    }
    const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = payload.choices?.[0]?.message?.content?.trim();
    res.json(
      AskCopilotResponse.parse({
        ...grounded,
        answer: answer || grounded.answer,
      }),
    );
  } catch (error) {
    req.log.warn({ error }, "Copilot provider request failed; using grounded workspace response");
    res.json(AskCopilotResponse.parse(grounded));
  }
});

export default router;