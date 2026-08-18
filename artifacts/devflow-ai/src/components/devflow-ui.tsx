import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Bell, Bot, ChevronDown, Command, GitBranch, LayoutDashboard, ListTodo, Menu, Settings, Sparkles, X, Zap } from 'lucide-react';

export const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/projects', label: 'Projects', icon: GitBranch },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/assistant', label: 'Copilot', icon: Bot },
  { href: '/activity', label: 'Activity', icon: Zap },
];

export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageLabel = navItems.find((item) => item.href === location)?.label ?? (location === '/settings' ? 'Settings' : 'Workspace');
  const sidebar = (
    <aside className="flex h-full w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-6">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_0_4px_hsl(var(--sidebar-primary)/.12)]">
          <Command size={18} strokeWidth={2.5} />
        </div>
        <div>
          <div className="text-[15px] font-bold tracking-tight text-sidebar-accent-foreground">DevFlow <span className="font-mono text-[11px] font-medium text-sidebar-primary">AI</span></div>
          <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[.18em] text-sidebar-foreground/55">Ship with signal</div>
        </div>
      </div>
      <div className="px-4 pt-6">
        <div className="mb-3 px-3 font-mono text-[9px] uppercase tracking-[.2em] text-sidebar-foreground/40">Workspace</div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = item.href === '/' ? location === '/' : location.startsWith(item.href);
            const Icon = item.icon;
            return <Link data-testid={`link-nav-${item.label.toLowerCase()}`} key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'}`}>
              <Icon size={16} className={active ? 'text-sidebar-primary' : 'text-sidebar-foreground/55 group-hover:text-sidebar-primary'} />
              <span>{item.label}</span>
              {item.label === 'Copilot' && <span className="ml-auto rounded bg-sidebar-primary/15 px-1.5 py-0.5 font-mono text-[9px] text-sidebar-primary">BETA</span>}
            </Link>;
          })}
        </nav>
      </div>
      <div className="mt-auto px-4 pb-5">
        <div className="mb-3 rounded-xl border border-sidebar-border bg-sidebar-accent/45 p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-6 w-6 place-items-center rounded-md bg-sidebar-primary/20 text-sidebar-primary"><Sparkles size={13} /></div>
            <span className="text-[11px] font-semibold text-sidebar-accent-foreground">Copilot is ready</span>
          </div>
          <p className="text-[10px] leading-relaxed text-sidebar-foreground/55">Ask about your projects, deadlines, or what to ship next.</p>
          <Link data-testid="link-sidebar-copilot" href="/assistant" className="mt-3 flex items-center justify-between text-[10px] font-semibold text-sidebar-primary hover:underline">Open Copilot <span>→</span></Link>
        </div>
        <Link data-testid="link-settings" href="/settings" className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors ${location === '/settings' ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'}`}><Settings size={16} /><span>Settings</span></Link>
        <div className="mt-4 flex items-center gap-3 border-t border-sidebar-border pt-4">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#d7e6ff] font-mono text-[10px] font-medium text-[#314b79]">MC</div>
          <div className="min-w-0"><div className="truncate text-[11px] font-semibold text-sidebar-accent-foreground">Maya Chen</div><div className="truncate text-[10px] text-sidebar-foreground/45">Product engineering</div></div>
          <ChevronDown size={14} className="ml-auto text-sidebar-foreground/35" />
        </div>
      </div>
    </aside>
  );
  return <div className="noise flex min-h-[100dvh] bg-background">
    <div className={`fixed inset-y-0 left-0 z-40 transition-transform md:static md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>{sidebar}</div>
    {mobileOpen && <button data-testid="button-close-menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-sidebar/40 md:hidden" aria-label="Close menu" />}
    <main className="min-w-0 flex-1">
      <header className="flex h-[76px] items-center justify-between border-b border-border bg-background/90 px-5 backdrop-blur md:px-9">
        <div className="flex items-center gap-3"><button data-testid="button-open-menu" onClick={() => setMobileOpen(true)} className="rounded-lg p-2 hover:bg-muted md:hidden" aria-label="Open menu"><Menu size={19} /></button><div><div className="font-mono text-[9px] uppercase tracking-[.2em] text-muted-foreground/70">DevFlow / {pageLabel}</div><div className="mt-1 text-sm font-semibold text-foreground md:hidden">{pageLabel}</div></div></div>
        <div className="flex items-center gap-2.5"><button data-testid="button-search" onClick={() => window.dispatchEvent(new CustomEvent('devflow:search'))} className="hidden items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground sm:flex"><Command size={13} /><span>Search workspace</span><kbd className="ml-3 rounded border border-border px-1.5 py-0.5 font-mono text-[9px]">⌘ K</kbd></button><button data-testid="button-notifications" onClick={() => window.dispatchEvent(new CustomEvent('devflow:notify'))} className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" aria-label="Notifications"><Bell size={17} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#ee765b]" /></button><div className="hidden h-6 w-px bg-border sm:block" /><div className="hidden items-center gap-2 text-right sm:flex"><div className="text-[11px] font-semibold">Northstar Labs</div><div className="grid h-7 w-7 place-items-center rounded-full bg-[#d7e6ff] font-mono text-[9px] text-[#314b79]">NL</div></div></div>
      </header>
      <div className="mx-auto max-w-[1440px] p-5 md:p-9">{children}</div>
    </main>
  </div>;
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><div className="mb-2 font-mono text-[10px] uppercase tracking-[.2em] text-primary">{eyebrow ?? 'Workspace'}</div><h1 className="text-[30px] font-semibold tracking-[-.04em] text-foreground md:text-[38px]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>}</div>{action}</div>;
}

export function Button({ children, variant = 'primary', onClick, type = 'button', className = '', disabled = false }: { children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; onClick?: () => void; type?: 'button' | 'submit'; className?: string; disabled?: boolean }) {
  const styles = { primary: 'bg-primary text-primary-foreground hover:brightness-105 shadow-sm', secondary: 'border border-border bg-card text-foreground hover:bg-muted', ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground', danger: 'border border-destructive/25 bg-destructive/5 text-destructive hover:bg-destructive/10' };
  return <button data-testid={`button-${typeof children === 'string' ? children.toLowerCase().replaceAll(' ', '-') : 'action'}`} type={type} disabled={disabled} onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-[12px] font-semibold transition-all active:scale-[.98] disabled:pointer-events-none disabled:opacity-50 ${styles[variant]} ${className}`}>{children}</button>;
}

export function Card({ children, className = '', ...props }: { children: ReactNode; className?: string; [key: string]: unknown }) {
  return <section className={`rounded-xl border border-card-border bg-card shadow-[0_2px_12px_hsl(225_25%_20%/.025)] ${className}`} {...props}>{children}</section>;
}

export function StatusPill({ value }: { value: string }) {
  const tone = value.toLowerCase().includes('done') || value.toLowerCase().includes('complete') ? 'bg-[#e6f2c6] text-[#536d18]' : value.toLowerCase().includes('progress') || value.toLowerCase().includes('active') ? 'bg-[#dcecf0] text-[#276b79]' : value.toLowerCase().includes('high') || value.toLowerCase().includes('urgent') ? 'bg-[#fbe4dc] text-[#9d4c37]' : 'bg-muted text-muted-foreground';
  return <span data-testid={`status-${value}`} className={`inline-flex rounded-md px-2 py-1 font-mono text-[9px] uppercase tracking-[.08em] ${tone}`}>{value.replaceAll('_', ' ')}</span>;
}

export function Avatar({ initials, size = 'sm' }: { initials: string; size?: 'sm' | 'md' }) {
  return <div data-testid={`avatar-${initials}`} className={`grid shrink-0 place-items-center rounded-full bg-[#d7e6ff] font-mono font-medium text-[#314b79] ${size === 'md' ? 'h-9 w-9 text-[10px]' : 'h-6 w-6 text-[8px]'}`}>{initials.slice(0, 2).toUpperCase()}</div>;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <div className="flex flex-col items-center justify-center py-16 text-center"><div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-accent text-accent-foreground"><Sparkles size={20} /></div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{body}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return <div className="space-y-3">{Array.from({ length: rows }).map((_, i) => <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4"><div className="skeleton h-8 w-8 rounded-full" /><div className="flex-1 space-y-2"><div className="skeleton h-3 w-2/5 rounded" /><div className="skeleton h-2.5 w-3/5 rounded" /></div></div>)}</div>;
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-8 text-center"><div className="text-sm font-semibold text-destructive">Could not load this view</div><p className="mt-1 text-xs text-muted-foreground">The workspace service did not respond. Try again.</p><Button variant="danger" onClick={onRetry} className="mt-4">Retry</Button></div>;
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#152039]/35 p-4 backdrop-blur-[2px]"><div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl reveal"><div className="mb-6 flex items-center justify-between"><h2 className="text-lg font-semibold tracking-tight">{title}</h2><button data-testid="button-close-modal" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close dialog"><X size={17} /></button></div>{children}</div></div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="mb-1.5 block font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">{label}</span>{children}</label>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15 ${props.className ?? ''}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-primary focus:ring-2 focus:ring-primary/15 ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 ${props.className ?? ''}`} />;
}

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="mb-3 flex items-center justify-between"><h2 className="font-mono text-[10px] uppercase tracking-[.18em] text-muted-foreground">{children}</h2>{action}</div>;
}