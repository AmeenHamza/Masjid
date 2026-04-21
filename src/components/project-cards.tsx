import { Badge } from './ui/badge';
import { Card } from './ui/card';
import Image from 'next/image';

const badgeClass: Record<string, string> = {
  Complete: 'bg-emerald-600 text-white',
  Incomplete: 'bg-amber-500 text-slate-950',
  Upcoming: 'bg-slate-700 text-white'
};

export function ProjectCards({ projects }: { projects: Array<{ title: string; description: string; status: string; imageUrl?: string; collectedAmount?: number; targetAmount?: number }> }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {projects.map((project) => (
        <Card key={project.title} className="group overflow-hidden p-0 transition duration-300 hover:-translate-y-1 hover:shadow-xl">
          {project.imageUrl ? (
            <div className="relative h-48 overflow-hidden rounded-none">
              <Image src={project.imageUrl} alt={project.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            </div>
          ) : null}
          <div className="p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-black tracking-tight">{project.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">{project.description}</p>
              </div>
              <Badge className={badgeClass[project.status] || 'bg-slate-500 text-white'}>{project.status}</Badge>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400" style={{ width: `${Math.min(100, ((project.collectedAmount || 0) / Math.max(1, project.targetAmount || 1)) * 100)}%` }} />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
