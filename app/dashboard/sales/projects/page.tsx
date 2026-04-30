import { getMyProjects } from "@/lib/actions/sales";
;
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ProjectsClient } from "./ProjectsClient";

export default async function MyProjectsPage() {
  const projects = await getMyProjects();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px] mb-2">
            Active Deployments
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase italic">
            Commissioned Pipeline
          </h1>
          <p className="text-slate-500 font-medium">Tracking projects you've successfully transitioned to the OS.</p>
        </div>
      </div>

      <ProjectsClient projects={projects} />
    </div>
  );
}
