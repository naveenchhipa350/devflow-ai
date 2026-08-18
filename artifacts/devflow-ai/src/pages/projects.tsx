import { type FormEvent, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Edit3, FolderKanban, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { getListProjectsQueryKey, useCreateProject, useDeleteProject, useListProjects, useUpdateProject } from '@workspace/api-client-react';
import type { Project } from '@workspace/api-client-react';
import { Button, Card, EmptyState, ErrorState, Field, Input, LoadingState, Modal, PageHeader, Select, StatusPill, Textarea } from '@/components/devflow-ui';

type ProjectForm = { name: string; description: string; status: string; priority: string; deadline: string; tags: string };
const blankForm: ProjectForm = { name: '', description: '', status: 'active', priority: 'medium', deadline: '', tags: '' };

export default function ProjectsPage() {
  const queryClient = useQueryClient();
  const projects = useListProjects(undefined, { query: { queryKey: getListProjectsQueryKey() } });
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectForm>(blankForm);
  const [flash, setFlash] = useState('');
  const filtered = useMemo(() => (projects.data ?? []).filter((project) => `${project.name} ${project.description} ${project.tags.join(' ')}`.toLowerCase().includes(search.toLowerCase())), [projects.data, search]);

  const openCreate = () => { setEditing(null); setForm(blankForm); setModal('create'); };
  const openEdit = (project: Project) => { setEditing(project); setForm({ name: project.name, description: project.description, status: project.status, priority: project.priority, deadline: project.deadline ?? '', tags: project.tags.join(', ') }); setModal('edit'); };
  const closeModal = () => { if (!createProject.isPending && !updateProject.isPending) setModal(null); };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const data = { name: form.name.trim(), description: form.description.trim(), status: form.status, priority: form.priority, deadline: form.deadline || null, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean) };
    if (!data.name) return;
    const onDone = () => { queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() }); setModal(null); setFlash(editing ? 'Project updated' : 'Project created'); window.setTimeout(() => setFlash(''), 2400); };
    if (editing) updateProject.mutate({ id: editing.id, data }, { onSuccess: onDone });
    else createProject.mutate({ data }, { onSuccess: onDone });
  };
  const remove = (project: Project) => {
    if (!window.confirm(`Delete ${project.name}? This cannot be undone.`)) return;
    deleteProject.mutate({ id: project.id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() }); setFlash('Project deleted'); window.setTimeout(() => setFlash(''), 2400); } });
  };
  if (projects.isLoading) return <><PageHeader eyebrow="Workspace / Projects" title="Projects" description="The workstreams your team is shaping right now." /><LoadingState rows={5} /></>;
  if (projects.isError) return <ErrorState onRetry={() => projects.refetch()} />;
  return <div className="reveal">
    <PageHeader eyebrow="Workspace / Projects" title="Projects" description="The workstreams your team is shaping right now." action={<Button onClick={openCreate}><Plus size={15} /> New project</Button>} />
    {flash && <div className="mb-5 flex items-center gap-2 rounded-lg border border-primary/25 bg-[#edf5d7] px-3 py-2.5 text-xs font-medium text-[#536d18] reveal"><span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px]">✓</span>{flash}</div>}
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="relative max-w-sm flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input data-testid="input-search-projects" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects..." className="pl-9" /></div><div className="font-mono text-[10px] text-muted-foreground">{filtered.length} of {projects.data?.length ?? 0} projects</div></div>
    {filtered.length === 0 ? <Card><EmptyState title={search ? 'No matching projects' : 'Your project room is empty'} body={search ? 'Try a different search phrase.' : 'Start a workstream and give your team a clear place to gather momentum.'} action={!search && <Button onClick={openCreate}><Plus size={14} /> Create project</Button>} /></Card> : <div className="grid gap-4 lg:grid-cols-2">{filtered.map((project, index) => <ProjectCard key={project.id} project={project} onEdit={() => openEdit(project)} onDelete={() => remove(project)} delay={index % 3} />)}</div>}
    {modal && <Modal title={modal === 'create' ? 'Start a new project' : 'Edit project'} onClose={closeModal}><form onSubmit={submit} className="space-y-4"><Field label="Project name"><Input data-testid="input-project-name" required autoFocus value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Atlas onboarding" /></Field><Field label="Description"><Textarea data-testid="input-project-description" rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What outcome is this project driving?" /></Field><div className="grid grid-cols-2 gap-3"><Field label="Status"><Select data-testid="select-project-status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="active">Active</option><option value="planning">Planning</option><option value="paused">Paused</option><option value="completed">Completed</option></Select></Field><Field label="Priority"><Select data-testid="select-project-priority" value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field></div><div className="grid grid-cols-2 gap-3"><Field label="Deadline"><Input data-testid="input-project-deadline" type="date" value={form.deadline} onChange={(event) => setForm({ ...form, deadline: event.target.value })} /></Field><Field label="Tags"><Input data-testid="input-project-tags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="api, launch" /></Field></div><div className="flex justify-end gap-2 pt-3"><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button type="submit" disabled={createProject.isPending || updateProject.isPending}>{createProject.isPending || updateProject.isPending ? 'Saving…' : modal === 'create' ? 'Create project' : 'Save changes'}</Button></div></form></Modal>}
  </div>;
}

function ProjectCard({ project, onEdit, onDelete, delay }: { project: Project; onEdit: () => void; onDelete: () => void; delay: number }) {
  return <Card data-testid={`card-project-${project.id}`} className={`reveal overflow-hidden p-5 delay-${delay + 1}`}>
    <div className="flex items-start gap-3">
      <div className="mt-0.5 h-9 w-1 rounded-full" style={{ backgroundColor: project.color || 'hsl(var(--primary))' }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="truncate text-base font-semibold tracking-[-.02em]">{project.name}</h2>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{project.description || 'No description yet.'}</p>
          </div>
          <div className="flex shrink-0 gap-1">
            <button data-testid={`button-edit-project-${project.id}`} onClick={onEdit} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Edit ${project.name}`}><Edit3 size={14} /></button>
            <button data-testid={`button-delete-project-${project.id}`} onClick={onDelete} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete ${project.name}`}><Trash2 size={14} /></button>
            <button data-testid={`button-more-project-${project.id}`} onClick={onEdit} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`More options for ${project.name}`}><MoreHorizontal size={14} /></button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill value={project.status} /><StatusPill value={project.priority} />
          {project.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-md bg-muted px-2 py-1 font-mono text-[9px] text-muted-foreground">#{tag}</span>)}
        </div>
        <div className="mt-5 flex items-end justify-between">
          <div className="flex-1 pr-8">
            <div className="mb-1.5 flex justify-between font-mono text-[9px] text-muted-foreground"><span>Progress</span><span>{project.progress}%</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${project.progress}%` }} /></div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground"><FolderKanban size={13} /> {project.completedTaskCount}/{project.taskCount}</div>
        </div>
      </div>
    </div>
  </Card>;
}