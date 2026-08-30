// Each model/table is defined in its own file. A table defines its column
// layout, the insert schema, and the inferred select/insert types:
//
//   - projects: the workstreams the team is shaping
//   - tasks:    units of work that belong to a project
//   - activity: a living record of events in the workspace
//
// Only tables that exist in the current schema are exported so that Drizzle
// (and any consumer) can reference them cleanly.

export * from "./projects";
export * from "./tasks";
export * from "./activity";