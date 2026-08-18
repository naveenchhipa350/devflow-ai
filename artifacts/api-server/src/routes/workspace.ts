import { Router, type IRouter } from "express";
import {
  AskCopilotBody,
  AskCopilotResponse,
  CreateProjectBody,
  CreateProjectResponse,
  CreateTaskBody,
  CreateTaskResponse,
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

type Project = {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  progress: number;
  taskCount: number;
  completedTaskCount: number;
  members: number;
  deadline: string | null;
  tags: string[];
  color: string;
};

type Task = {
  id: string;
  title: string;
  description: string;
  projectId: string;
  projectName: string;
  status: string;
  priority: string;
  assignee: string;
  assigneeInitials: string;
  dueDate: string | null;
  labels: string[];
  comments: number;
  estimate: number;
};

type ActivityItem = {
  id: string;
  kind: string;
  title: string;
  description: string;
  user: string;
  userInitials: string;
  timestamp: string;
};

const colors = ["#d7f75b", "#f38b6b", "#9a8cff", "#6bd4c7", "#f3c969"];

let idSequence = 40;
const nextId = (prefix: string) => `${prefix}-${idSequence++}`;

let projects: Project[] = [
  {
    id: "project-orbit",
    name: "Orbit release",
    description: "Coordinate the public launch of the new team workspace experience.",
    status: "Active",
    priority: "High",
    progress: 68,
    taskCount: 24,
    completedTaskCount: 16,
    members: 8,
    deadline: "2026-08-28",
    tags: ["Product", "Launch"],
    color: "#d7f75b",
  },
  {
    id: "project-lattice",
    name: "Lattice API",
    description: "Unify service contracts and make project data easier to build on.",
    status: "Active",
    priority: "Critical",
    progress: 43,
    taskCount: 31,
    completedTaskCount: 13,
    members: 5,
    deadline: "2026-09-12",
    tags: ["Platform", "API"],
    color: "#9a8cff",
  },
  {
    id: "project-signal",
    name: "Signal insights",
    description: "Give teams a clear view into velocity, delivery risk, and focus.",
    status: "Planning",
    priority: "Medium",
    progress: 21,
    taskCount: 18,
    completedTaskCount: 4,
    members: 4,
    deadline: "2026-10-04",
    tags: ["Analytics", "Research"],
    color: "#6bd4c7",
  },
  {
    id: "project-ember",
    name: "Ember mobile",
    description: "A companion experience for updates and lightweight task triage.",
    status: "On Hold",
    priority: "Low",
    progress: 12,
    taskCount: 9,
    completedTaskCount: 1,
    members: 3,
    deadline: null,
    tags: ["Mobile"],
    color: "#f38b6b",
  },
];

let tasks: Task[] = [
  {
    id: "task-1",
    title: "Map the first-run workspace experience",
    description: "Turn the onboarding notes into a clear sequence for new teams.",
    projectId: "project-orbit",
    projectName: "Orbit release",
    status: "In Progress",
    priority: "High",
    assignee: "Maya Chen",
    assigneeInitials: "MC",
    dueDate: "2026-08-22",
    labels: ["Design", "Onboarding"],
    comments: 7,
    estimate: 5,
  },
  {
    id: "task-2",
    title: "Add request validation to project endpoints",
    description: "Make malformed project input fail with useful messages.",
    projectId: "project-lattice",
    projectName: "Lattice API",
    status: "Review",
    priority: "Critical",
    assignee: "Jon Bell",
    assigneeInitials: "JB",
    dueDate: "2026-08-20",
    labels: ["Backend", "Security"],
    comments: 4,
    estimate: 3,
  },
  {
    id: "task-3",
    title: "Write the release note for Orbit",
    description: "Summarize the product changes in a voice customers can act on.",
    projectId: "project-orbit",
    projectName: "Orbit release",
    status: "Todo",
    priority: "Medium",
    assignee: "Maya Chen",
    assigneeInitials: "MC",
    dueDate: "2026-08-25",
    labels: ["Content"],
    comments: 2,
    estimate: 2,
  },
  {
    id: "task-4",
    title: "Review the project activity data model",
    description: "Check naming and event boundaries before the analytics work starts.",
    projectId: "project-signal",
    projectName: "Signal insights",
    status: "Backlog",
    priority: "Low",
    assignee: "Ari Patel",
    assigneeInitials: "AP",
    dueDate: "2026-09-03",
    labels: ["Analytics"],
    comments: 0,
    estimate: 4,
  },
  {
    id: "task-5",
    title: "Ship the repository activity card",
    description: "Connect the latest commits and pull requests to the workspace view.",
    projectId: "project-lattice",
    projectName: "Lattice API",
    status: "Done",
    priority: "High",
    assignee: "Jon Bell",
    assigneeInitials: "JB",
    dueDate: "2026-08-16",
    labels: ["GitHub", "Frontend"],
    comments: 9,
    estimate: 5,
  },
  {
    id: "task-6",
    title: "Define the mobile notification strategy",
    description: "Capture which workspace events should reach the companion app.",
    projectId: "project-ember",
    projectName: "Ember mobile",
    status: "Todo",
    priority: "Low",
    assignee: "Noah Williams",
    assigneeInitials: "NW",
    dueDate: null,
    labels: ["Mobile", "Research"],
    comments: 1,
    estimate: 3,
  },
];

let activity: ActivityItem[] = [
  {
    id: "activity-1",
    kind: "task",
    title: "Maya moved a task to In Progress",
    description: "Map the first-run workspace experience",
    user: "Maya Chen",
    userInitials: "MC",
    timestamp: "12 min ago",
  },
  {
    id: "activity-2",
    kind: "github",
    title: "Jon opened a pull request",
    description: "Add validation for project updates",
    user: "Jon Bell",
    userInitials: "JB",
    timestamp: "38 min ago",
  },
  {
    id: "activity-3",
    kind: "comment",
    title: "Ari commented on Signal insights",
    description: "The event boundary notes are ready for review.",
    user: "Ari Patel",
    userInitials: "AP",
    timestamp: "1 hr ago",
  },
  {
    id: "activity-4",
    kind: "project",
    title: "Noah joined Ember mobile",
    description: "Project member access was updated",
    user: "Noah Williams",
    userInitials: "NW",
    timestamp: "3 hrs ago",
  },
  {
    id: "activity-5",
    kind: "task",
    title: "Maya completed a task",
    description: "Audit launch checklist and owners",
    user: "Maya Chen",
    userInitials: "MC",
    timestamp: "Yesterday",
  },
];

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

const createActivity = (item: Omit<ActivityItem, "id">) => {
  activity = [{ ...item, id: nextId("activity") }, ...activity].slice(0, 12);
};

const projectWithStats = (project: Project): Project => {
  const projectTasks = tasks.filter((task) => task.projectId === project.id);
  const completedTaskCount = projectTasks.length
    ? projectTasks.filter((task) => task.status === "Done").length
    : project.completedTaskCount;
  const taskCount = projectTasks.length || project.taskCount;
  const progress = projectTasks.length
    ? Math.round((completedTaskCount / taskCount) * 100)
    : project.progress;
  return { ...project, taskCount, completedTaskCount, progress };
};

const buildDashboard = () => {
  const completedTasks = tasks.filter((task) => task.status === "Done").length;
  const pendingTasks = tasks.length - completedTasks;
  const activeProjects = projects.filter((project) => project.status === "Active").length;

  return GetDashboardResponse.parse({
    totalProjects: projects.length,
    activeProjects,
    completedTasks: completedTasks + 17,
    pendingTasks: pendingTasks + 62,
    teamMembers: 12,
    productivity: [
      { label: "Mon", value: 46 },
      { label: "Tue", value: 58 },
      { label: "Wed", value: 52 },
      { label: "Thu", value: 71 },
      { label: "Fri", value: 64 },
      { label: "Sat", value: 78 },
      { label: "Sun", value: 67 },
    ],
    taskCompletion: [
      { label: "W1", completed: 18, created: 24 },
      { label: "W2", completed: 29, created: 31 },
      { label: "W3", completed: 24, created: 35 },
      { label: "W4", completed: 41, created: 33 },
      { label: "W5", completed: 37, created: 29 },
      { label: "W6", completed: 49, created: 38 },
    ],
    deadlines: [
      { id: "deadline-1", title: "Orbit release candidate", project: "Orbit release", dueDate: "Aug 28", daysLeft: 10 },
      { id: "deadline-2", title: "API contract review", project: "Lattice API", dueDate: "Aug 20", daysLeft: 2 },
      { id: "deadline-3", title: "Signal research readout", project: "Signal insights", dueDate: "Sep 03", daysLeft: 16 },
    ],
    recentActivity: activity.slice(0, 5),
    githubActivity,
    insights: [
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
    ],
  });
};

const initialsFor = (name: string) =>
  name
    .split(" ")
    .map((part) => part[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getCopilotAnswer = (message: string) => {
  const prompt = message.toLowerCase();
  const overdue = tasks.filter((task) => task.dueDate && task.dueDate < "2026-08-18" && task.status !== "Done");
  const reviewTasks = tasks.filter((task) => task.status === "Review");
  const nextTask = tasks.find((task) => task.status === "In Progress") ?? tasks.find((task) => task.status === "Todo");

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
    answer: `I’m looking at ${projects.length} projects and ${tasks.length} tracked tasks. ${projects.filter((project) => project.status === "Active").length} projects are active, and the team has ${tasks.filter((task) => task.status === "Done").length} completed tasks in the current workspace slice. Ask me about overdue work, priorities, or review bottlenecks for a grounded answer.`,
    sources: ["Workspace dashboard", "Projects", "Task queue"],
    actions: ["Summarize the workspace", "Find overdue tasks", "Suggest next work"],
  };
};

const router: IRouter = Router();

router.get("/dashboard", (req, res) => {
  req.log.info("Loading workspace dashboard");
  res.json(buildDashboard());
});

router.get("/projects", (req, res) => {
  const query = ListProjectsQueryParams.parse(req.query);
  const filtered = query.status
    ? projects.filter((project) => project.status === query.status)
    : projects;
  res.json(ListProjectsResponse.parse(filtered.map(projectWithStats)));
});

router.post("/projects", (req, res) => {
  const input = CreateProjectBody.parse(req.body);
  const project: Project = {
    id: nextId("project"),
    name: input.name,
    description: input.description,
    status: input.status,
    priority: input.priority,
    progress: 0,
    taskCount: 0,
    completedTaskCount: 0,
    members: 1,
    deadline: input.deadline,
    tags: input.tags,
    color: colors[projects.length % colors.length] ?? colors[0]!,
  };
  projects = [project, ...projects];
  createActivity({
    kind: "project",
    title: "You created a project",
    description: project.name,
    user: "You",
    userInitials: "YO",
    timestamp: "Just now",
  });
  res.status(201).json(CreateProjectResponse.parse(project));
});

router.patch("/projects/:id", (req, res) => {
  const params = UpdateProjectParams.parse(req.params);
  const input = UpdateProjectBody.parse(req.body);
  const index = projects.findIndex((project) => project.id === params.id);
  if (index === -1) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const updated = { ...projects[index]!, ...input };
  projects[index] = updated;
  createActivity({
    kind: "project",
    title: "You updated a project",
    description: updated.name,
    user: "You",
    userInitials: "YO",
    timestamp: "Just now",
  });
  res.json(UpdateProjectResponse.parse(projectWithStats(updated)));
});

router.delete("/projects/:id", (req, res) => {
  const id = UpdateProjectParams.parse(req.params).id;
  const project = projects.find((item) => item.id === id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  projects = projects.filter((item) => item.id !== id);
  tasks = tasks.filter((task) => task.projectId !== id);
  createActivity({
    kind: "project",
    title: "You deleted a project",
    description: project.name,
    user: "You",
    userInitials: "YO",
    timestamp: "Just now",
  });
  res.status(204).send();
});

router.get("/tasks", (req, res) => {
  const query = ListTasksQueryParams.parse(req.query);
  const filtered = tasks.filter((task) => {
    return (!query.status || task.status === query.status) && (!query.projectId || task.projectId === query.projectId);
  });
  res.json(ListTasksResponse.parse(filtered));
});

router.post("/tasks", (req, res) => {
  const input = CreateTaskBody.parse(req.body);
  const project = projects.find((item) => item.id === input.projectId);
  if (!project) {
    res.status(400).json({ error: "Project not found" });
    return;
  }
  const task: Task = {
    id: nextId("task"),
    title: input.title,
    description: input.description,
    projectId: project.id,
    projectName: project.name,
    status: input.status,
    priority: input.priority,
    assignee: input.assignee,
    assigneeInitials: initialsFor(input.assignee),
    dueDate: input.dueDate,
    labels: input.labels,
    comments: 0,
    estimate: 3,
  };
  tasks = [task, ...tasks];
  createActivity({
    kind: "task",
    title: "You created a task",
    description: task.title,
    user: "You",
    userInitials: "YO",
    timestamp: "Just now",
  });
  res.status(201).json(CreateTaskResponse.parse(task));
});

router.patch("/tasks/:id", (req, res) => {
  const params = UpdateTaskParams.parse(req.params);
  const input = UpdateTaskBody.parse(req.body);
  const index = tasks.findIndex((task) => task.id === params.id);
  if (index === -1) {
    res.status(404).json({ error: "Task not found" });
    return;
  }
  const current = tasks[index]!;
  const project = input.projectId ? projects.find((item) => item.id === input.projectId) : undefined;
  const updated: Task = {
    ...current,
    ...input,
    projectName: project?.name ?? current.projectName,
    assigneeInitials: initialsFor(input.assignee ?? current.assignee),
  };
  tasks[index] = updated;
  createActivity({
    kind: "task",
    title: updated.status === current.status ? "You updated a task" : `Task moved to ${updated.status}`,
    description: updated.title,
    user: "You",
    userInitials: "YO",
    timestamp: "Just now",
  });
  res.json(UpdateTaskResponse.parse(updated));
});

router.get("/activity", (_req, res) => {
  res.json(ListActivityResponse.parse(activity));
});

router.post("/copilot/messages", async (req, res) => {
  const { message } = AskCopilotBody.parse(req.body);
  const grounded = getCopilotAnswer(message);

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
              projects: projects.map(projectWithStats),
              tasks,
              activity: activity.slice(0, 8),
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