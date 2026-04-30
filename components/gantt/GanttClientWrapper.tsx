"use client";

import dynamic from 'next/dynamic';

// This wrapper safely handles the ssr: false dynamic import for the Gantt chart
const ProjectGantt = dynamic(() => import('./ProjectGantt').then(mod => mod.ProjectGantt), { ssr: false });

export function GanttClientWrapper({ tasks }: { tasks: any[] }) {
  return <ProjectGantt tasks={tasks} />;
}
