import { activity, projects, tasks } from "../schema";
import { db, pool } from "../index";

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);
const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000);

const seedProjects = [
  {
    id: "project-orbit",
    name: "Orbit release",
    description: "Coordinate the public launch of the new team workspace experience.",
    status: "active",
    priority: "high",
    members: 8,
    deadline: "2026-08-28",
    tags: ["Product", "Launch"],
    color: "#d7f75b",
    createdAt: daysAgo(30),
  },
  {
    id: "project-lattice",
    name: "Lattice API",
    description: "Unify service contracts and make project data easier to build on.",
    status: "active",
    priority: "critical",
    members: 5,
    deadline: "2026-09-12",
    tags: ["Platform", "API"],
    color: "#9a8cff",
    createdAt: daysAgo(21),
  },
  {
    id: "project-signal",
    name: "Signal insights",
    description: "Give teams a clear view into velocity, delivery risk, and focus.",
    status: "planning",
    priority: "medium",
    members: 4,
    deadline: "2026-10-04",
    tags: ["Analytics", "Research"],
    color: "#6bd4c7",
    createdAt: daysAgo(14),
  },
  {
    id: "project-ember",
    name: "Ember mobile",
    description: "A companion experience for updates and lightweight task triage.",
    status: "on_hold",
    priority: "low",
    members: 3,
    deadline: null,
    tags: ["Mobile"],
    color: "#f38b6b",
    createdAt: daysAgo(10),
  },
];

const seedTasks = [
  {
    id: "task-1",
    title: "Map the first-run workspace experience",
    description: "Turn the onboarding notes into a clear sequence for new teams.",
    projectId: "project-orbit",
    status: "in_progress",
    priority: "high",
    assignee: "Maya Chen",
    dueDate: "2026-08-22",
    labels: ["Design", "Onboarding"],
    comments: 7,
    estimate: 5,
    createdAt: daysAgo(20),
  },
  {
    id: "task-2",
    title: "Add request validation to project endpoints",
    description: "Make malformed project input fail with useful messages.",
    projectId: "project-lattice",
    status: "review",
    priority: "critical",
    assignee: "Jon Bell",
    dueDate: "2026-08-20",
    labels: ["Backend", "Security"],
    comments: 4,
    estimate: 3,
    createdAt: daysAgo(18),
  },
  {
    id: "task-3",
    title: "Write the release note for Orbit",
    description: "Summarize the product changes in a voice customers can act on.",
    projectId: "project-orbit",
    status: "todo",
    priority: "medium",
    assignee: "Maya Chen",
    dueDate: "2026-08-25",
    labels: ["Content"],
    comments: 2,
    estimate: 2,
    createdAt: daysAgo(12),
  },
  {
    id: "task-4",
    title: "Review the project activity data model",
    description: "Check naming and event boundaries before the analytics work starts.",
    projectId: "project-signal",
    status: "backlog",
    priority: "low",
    assignee: "Ari Patel",
    dueDate: "2026-09-03",
    labels: ["Analytics"],
    comments: 0,
    estimate: 4,
    createdAt: daysAgo(9),
  },
  {
    id: "task-5",
    title: "Ship the repository activity card",
    description: "Connect the latest commits and pull requests to the workspace view.",
    projectId: "project-lattice",
    status: "done",
    priority: "high",
    assignee: "Jon Bell",
    dueDate: "2026-08-16",
    labels: ["GitHub", "Frontend"],
    comments: 9,
    estimate: 5,
    createdAt: daysAgo(15),
  },
  {
    id: "task-6",
    title: "Define the mobile notification strategy",
    description: "Capture which workspace events should reach the companion app.",
    projectId: "project-ember",
    status: "todo",
    priority: "low",
    assignee: "Noah Williams",
    dueDate: null,
    labels: ["Mobile", "Research"],
    comments: 1,
    estimate: 3,
    createdAt: daysAgo(6),
  },
];

const seedActivity = [
  {
    id: "activity-1",
    kind: "task",
    title: "Maya moved a task to In Progress",
    description: "Map the first-run workspace experience",
    user: "Maya Chen",
    userInitials: "MC",
    createdAt: minutesAgo(12),
  },
  {
    id: "activity-2",
    kind: "github",
    title: "Jon opened a pull request",
    description: "Add validation for project updates",
    user: "Jon Bell",
    userInitials: "JB",
    createdAt: minutesAgo(38),
  },
  {
    id: "activity-3",
    kind: "comment",
    title: "Ari commented on Signal insights",
    description: "The event boundary notes are ready for review.",
    user: "Ari Patel",
    userInitials: "AP",
    createdAt: minutesAgo(60),
  },
  {
    id: "activity-4",
    kind: "member",
    title: "Noah joined Ember mobile",
    description: "Project member access was updated",
    user: "Noah Williams",
    userInitials: "NW",
    createdAt: minutesAgo(180),
  },
  {
    id: "activity-5",
    kind: "task",
    title: "Maya completed a task",
    description: "Audit launch checklist and owners",
    user: "Maya Chen",
    userInitials: "MC",
    createdAt: minutesAgo(60 * 24),
  },
];

const seed = async () => {
  await db.insert(projects).values(seedProjects).onConflictDoNothing();
  await db.insert(tasks).values(seedTasks).onConflictDoNothing();
  await db.insert(activity).values(seedActivity).onConflictDoNothing();
  console.log(
    `Seeded ${seedProjects.length} projects, ${seedTasks.length} tasks, and ${seedActivity.length} activity items.`,
  );
};

seed()
  .then(() => pool.end())
  .catch((error) => {
    console.error("Seed failed:", error);
    void pool.end();
    process.exit(1);
  });