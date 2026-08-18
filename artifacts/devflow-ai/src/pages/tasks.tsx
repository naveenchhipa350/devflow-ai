import { type FormEvent, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarDays, Check, Filter, MessageSquare, Plus, Search } from 'lucide-react';
import { getListProjectsQueryKey, getListTasksQueryKey, useCreateTask, useListProjects, useListTasks, useUpdateTask } from '@workspace/api-client-react';
import type { Task } from '@workspace/api-client-react';
import { Button, Card, EmptyState, ErrorState, Field, Input, LoadingState, Modal, PageHeader, Select, StatusPill, Textarea } from '@/components/devflow-ui';

type TaskForm = { title: string; description: string; projectId: string; status: string; priority: string; assignee: string; dueDate: string; labels: string };
const emptyTask: TaskForm = { title: '', description: '', projectId: '', status: 'todo', priority: 'medium', assignee: '', dueDate: '', labels: '' };

export default function TasksPage() {
  const queryClient = useQueryClient();
  const tasks = useListTasks(undefined, { query: { queryKey: getListTasksQueryKey() } });
  const projects = useListProjects(undefined, { query: { queryKey: getListProjectsQueryKey() } });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<TaskForm>(emptyTask);
  const [flash, setFlash] = useState('');
  const filtered = useMemo(() => (tasks.data ?? []).filter((task) => (status === 'all' || task.status === status) && `${task.title} ${task.description} ${task.projectName} ${task.labels.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [tasks.data, search, status]);
  const changeStatus = (task: Task) => {
    const next = task.status === 'done' || task.status === 'completed' ? 'todo' : task.status === 'todo' ? 'in_progress' : 'done';
    updateTask.mutate({ id: task.id, data: { status: next } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }); setFlash('Task status updated'); window.setTimeout(() => setFlash(''), 2000); } });
  };
  const openCreate = () => { setForm({ ...emptyTask, projectId: projects.data?.[0]?.id ?? '' }); setModal(true); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.projectId) return;
    const project = projects.data?.find((item) => item.id === form.projectId);
    createTask.mutate({ data: { title: form.title.trim(), description: form.description.trim(), projectId: form.projectId, status: form.status, priority: form.priority, assignee: form.assignee.trim(), dueDate: form.dueDate || null, labels: form.labels.split(',').map((tag) => tag.trim()).filter(Boolean) } }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListTasksQueryKey() }); setModal(false); setFlash(`Task added to ${project?.name ?? 'project'}`); window.setTimeout(() => setFlash(''), 2400); } });
  };
  if (tasks.isLoading) return <><PageHeader eyebrow="Workspace / Tasks" title="Tasks" description="A clear queue for the work that moves everything forward." /><LoadingState rows={6} /></>;
  if (tasks.isError) return <ErrorState onRetry={() => tasks.refetch()} />;
  return <div className="reveal">
    <PageHeader eyebrow="Workspace / Tasks" title="Tasks" description="A clear queue for the work that moves everything forward." action={<Button onClick={openCreate}><Plus size={15} /> Add task</Button>} />
    {flash && <div className="mb-5 rounded-lg border border-primary/25 bg-[#edf5d7] px-3 py-2.5 text-xs font-medium text-[#536d18] reveal">{flash}</div>}
    <Card className="mb-5 p-3"><div className="flex flex-col gap-3 md:flex-row md:items-center"><div className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input data-testid="input-search-tasks" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search tasks, labels, projects..." className="pl-9" /></div><div className="flex items-center gap-2"><Filter size={14} className="text-muted-foreground" /><Select data-testid="select-task-status-filter" value={status} onChange={(event) => setStatus(event.target.value)} className="min-w-[145px]"><option value="all">All statuses</option><option value="todo">To do</option><option value="in_progress">In progress</option><option value="done">Done</option></Select></div></div></Card>
    <Card className="overflow-hidden"><div className="hidden grid-cols-[minmax(260px,1.6fr)_1fr_120px_110px_90px] gap-4 border-b border-border bg-muted/35 px-5 py-3 font-mono text-[9px] uppercase tracking-[.14em] text-muted-foreground md:grid"><span>Task</span><span>Project</span><span>Status</span><span>Priority</span><span>Due</span></div>{filtered.length === 0 ? <EmptyState title={search || status !== 'all' ? 'No tasks match these filters' : 'The queue is clear'} body={search || status !== 'all' ? 'Try a different filter or search term.' : 'Create the first task and give the team something concrete to move.'} action={!(search || status !== 'all') && <Button onClick={openCreate}><Plus size={14} /> Add a task</Button>} /> : <div className="divide-y divide-border">{filtered.map((task) => <TaskRow key={task.id} task={task} onStatus={() => changeStatus(task)} />)}</div>}</Card>
    {modal && <Modal title="Add a task" onClose={() => setModal(false)}><form onSubmit={submit} className="space-y-4"><Field label="Task title"><Input data-testid="input-task-title" required autoFocus value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to move?" /></Field><Field label="Description"><Textarea data-testid="input-task-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add useful context for the person picking this up." /></Field><div className="grid grid-cols-2 gap-3"><Field label="Project"><Select data-testid="select-task-project" required value={form.projectId} onChange={(event) => setForm({ ...form, projectId: event.target.value })}><option value="">Select project</option>{projects.data?.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</Select></Field><Field label="Assignee"><Input data-testid="input-task-assignee" value={form.assignee} onChange={(event) => setForm({ ...form, assignee: event.target.value })} placeholder="Name" /></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Priority"><Select data-testid="select-task-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field><Field label="Due date"><Input data-testid="input-task-due-date" type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} /></Field></div><Field label="Labels"><Input data-testid="input-task-labels" value={form.labels} onChange={(event) => setForm({ ...form, labels: event.target.value })} placeholder="frontend, review" /></Field><div className="flex justify-end gap-2 pt-3"><Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button><Button type="submit" disabled={createTask.isPending || !projects.data?.length}>{createTask.isPending ? 'Adding…' : 'Add task'}</Button></div></form></Modal>}
  </div>;
}

function TaskRow({ task, onStatus }: { task: Task; onStatus: () => void }) {
  const done = task.status === 'done' || task.status === 'completed';
  return <div data-testid={`row-task-${task.id}`} className="group grid gap-3 px-4 py-4 transition-colors hover:bg-muted/25 md:grid-cols-[minmax(260px,1.6fr)_1fr_120px_110px_90px] md:items-center md:gap-4 md:px-5"><div className="flex min-w-0 items-start gap-3"><button data-testid={`button-toggle-task-${task.id}`} onClick={onStatus} className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors ${done ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-transparent hover:border-primary'}`} aria-label={`Change status for ${task.title}`}>{done && <Check size={12} strokeWidth={3} />}</button><div className="min-w-0"><div className={`truncate text-sm font-medium ${done ? 'text-muted-foreground line-through' : ''}`}>{task.title}</div><div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground"><span>{task.assignee || 'Unassigned'}</span>{task.labels.slice(0, 2).map((label) => <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[9px]" key={label}>{label}</span>)}<span className="flex items-center gap-1"><MessageSquare size={11} /> {task.comments}</span></div></div></div><div className="ml-8 flex items-center gap-2 text-xs text-muted-foreground md:ml-0"><span className="h-1.5 w-1.5 rounded-full bg-[#84a9b0]" />{task.projectName}</div><div className="ml-8 md:ml-0"><StatusPill value={task.status} /></div><div className="ml-8 md:ml-0"><StatusPill value={task.priority} /></div><div className="ml-8 flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground md:ml-0">{task.dueDate ? <><CalendarDays size={12} />{task.dueDate}</> : <span>—</span>}</div></div>;
}