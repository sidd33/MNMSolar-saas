"use client";

import { useEffect, useRef } from "react";
import "./gantt.css";

interface GanttTask {
  id: string;
  name: string;
  start: string | Date;
  end: string | Date;
  progress: number;
  dependencies: string;
  isBottlenecked: boolean;
  isCompleted: boolean;
  isCurrent: boolean;
  expectedDays: number;
}

interface ProjectGanttProps {
  tasks: GanttTask[];
}

export function ProjectGantt({ tasks }: ProjectGanttProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || tasks.length === 0) return;

    // Dynamically import frappe-gantt (it accesses `window`)
    import("frappe-gantt").then((mod) => {
      const Gantt = mod.default;

      // Transform tasks to frappe-gantt format
      // Dates arrive as ISO strings from server components, not Date objects
      const formattedTasks = tasks.map(t => {
        const startDate = new Date(t.start);
        const endDate = new Date(t.end);
        
        return {
          id: t.id,
          name: t.name,
          start: `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`,
          end: `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`,
          progress: t.progress,
          dependencies: t.dependencies,
          custom_class: t.isBottlenecked ? 'gantt-bottleneck' : 
                        t.isCurrent ? 'gantt-current' : 
                        t.isCompleted ? 'gantt-completed' : 'gantt-future'
        };
      });

      // Clear previous instance
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }

      ganttInstance.current = new Gantt(containerRef.current, formattedTasks, {
          header_height: 50,
          column_width: 30,
          step: 24,
          view_modes: ['Day', 'Week', 'Month'],
          view_mode: 'Week',
          bar_height: 25,
          bar_corner_radius: 4,
          arrow_curve: 5,
          padding: 18,
          date_format: 'YYYY-MM-DD',
          custom_popup_html: (task: any) => {
            const originalTask = tasks.find(t => t.id === task.id);
            const startMs = new Date(task._start).getTime();
            const endMs = new Date(task._end).getTime();
            const elapsed = Math.max(1, Math.ceil((endMs - startMs) / (1000 * 60 * 60 * 24)));
            const expected = originalTask?.expectedDays || 0;
            
            let statusText = "On Track";
            let statusColor = "#10b981";
            
            if (originalTask?.isBottlenecked) {
                statusText = "Bottlenecked";
                statusColor = "#ef4444";
            } else if (elapsed > expected && !originalTask?.isCompleted) {
                statusText = "Delayed";
                statusColor = "#f59e0b";
            }

            return `
              <div style="padding:16px;background:white;border:1px solid #e2e8f0;box-shadow:0 25px 50px -12px rgba(0,0,0,.25);border-radius:16px;min-width:220px;">
                <h4 style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em;color:#1C3384;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #f1f5f9;">${task.name}</h4>
                <div style="display:flex;flex-direction:column;gap:8px;">
                  <div style="display:flex;justify-content:space-between;">
                       <span style="font-size:10px;color:#94a3b8;">Timeline</span>
                       <span style="font-size:10px;font-weight:700;color:#334155;">${task.start} – ${originalTask?.isCurrent ? 'In Progress' : task.end}</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;">
                      <span style="font-size:10px;color:#94a3b8;">Duration</span>
                      <span style="font-size:10px;font-weight:700;color:#334155;">${elapsed} / ${expected} Days</span>
                  </div>
                  <div style="display:flex;justify-content:space-between;padding-top:4px;">
                      <span style="font-size:10px;color:#94a3b8;">Status</span>
                      <span style="font-size:10px;font-weight:900;text-transform:uppercase;color:${statusColor};">${statusText}</span>
                  </div>
                </div>
              </div>
            `;
          }
      });
    });

    return () => {
      ganttInstance.current = null;
    };
  }, [tasks]);

  return (
    <div className="relative w-full h-full overflow-auto bg-white">
        <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

