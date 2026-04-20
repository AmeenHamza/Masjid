import { Badge } from './ui/badge';
import { Card } from './ui/card';

const badgeClass: Record<string, string> = {
  Complete: 'bg-emerald-600 text-white',
  Incomplete: 'bg-amber-500 text-slate-950',
  Upcoming: 'bg-slate-700 text-white'
};

export function ProjectCards({ projects }: { projects: Array<{ title: string; description: string; status: string; collectedAmount?: number; targetAmount?: number }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.title} className="overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-black">{project.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{project.description}</p>
            </div>
            <Badge className={badgeClass[project.status] || 'bg-slate-500 text-white'}>{project.status}</Badge>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
            <div className="h-full rounded-full bg-emerald-600" style={{ width: `${Math.min(100, ((project.collectedAmount || 0) / Math.max(1, project.targetAmount || 1)) * 100)}%` }} />
          </div>
        </Card>
      ))}
    </div>
  );
}
