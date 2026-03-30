import { getOwnerDashboardData } from "@/app/actions/dashboard";
import { getMyPriorities, getTeamPulse } from "@/app/actions/task";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { 
  AlertTriangle, 
  Users, 
  Activity,
  Zap,
  PieChart,
} from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { cn } from "@/lib/utils";
import { MasterPipeline } from "@/components/dashboard/MasterPipeline";
import { ProjectIntakeDialog } from "@/components/dashboard/ProjectIntakeDialog";
import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function OwnerDashboard() {
  const user = await currentUser();
  if (!user) redirect('/sign-in');

  const role = user.publicMetadata?.role as string | undefined;
  if (role !== 'OWNER') redirect('/dashboard');

  let dashboardData: any = {};
  try {
    dashboardData = await getOwnerDashboardData();
  } catch (error) {
    console.error("OwnerDashboard: Failed to load data", error);
  }

  const { projects = [], bottlenecks = [], workload = {}, auditLogs = [] } = dashboardData;

  const stats = [
    { 
      label: "Total Projects", 
      value: projects.length, 
      icon: Activity, 
      color: "text-[#1A365D]", 
      bg: "bg-blue-50",
      description: "Active in pipeline" 
    },
    { 
      label: "Critical Bottlenecks", 
      value: bottlenecks.length, 
      icon: AlertTriangle, 
      color: "text-red-500", 
      bg: "bg-red-50",
      description: ">72h stagnation" 
    },
    { 
      label: "Active Departments", 
      value: Object.values(workload).filter(v => (v as number) > 0).length, 
      icon: Users, 
      color: "text-indigo-500", 
      bg: "bg-indigo-50",
      description: "Resource distribution" 
    },
    { 
      label: "Operational Velocity", 
      value: "94%", 
      icon: Zap, 
      color: "text-amber-500", 
      bg: "bg-amber-50",
      description: "Target efficiency" 
    },
  ];

  return (
    <DashboardShell 
      title="SaaS Command Center" 
      subtitle="Operational intelligence and pipeline oversight for MNMSOLAR."
      headerActions={<ProjectIntakeDialog />}
    >
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content Area */}
        <div className="col-span-12 lg:col-span-8 space-y-6">
          {/* Metrics Header */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <Card key={i} className="border-none shadow-sm bg-white rounded-2xl">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl shadow-sm`}>
                    <stat.icon className="h-4 w-4" strokeWidth={3} />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black border-slate-100 bg-slate-50">LIVE</Badge>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black text-[#0F172A] tracking-tighter">{stat.value}</div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#64748B] mt-1">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Master Pipeline View */}
          <MasterPipeline projects={projects} />
        </div>

        {/* Sidebar Right */}
        <div className="col-span-12 lg:col-span-4 space-y-6 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-none pr-1">
          {/* Departmental Heatmap */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-4">
               <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 text-indigo-600 p-2 rounded-xl">
                    <PieChart size={18} strokeWidth={3} />
                  </div>
                  <CardTitle className="text-sm font-black text-[#2D3748] uppercase tracking-tighter">Departmental Load</CardTitle>
               </div>
            </CardHeader>
            <CardContent className="space-y-4">
               {Object.entries(workload).map(([dept, count]: any) => (
                 <div key={dept} className="space-y-1.5">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                     <span>{dept}</span>
                     <span className="text-[#0F172A]">{count} Projects</span>
                   </div>
                   <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          dept === "ENGINEERING" ? "bg-[#1C3384]" : 
                          dept === "SALES" ? "bg-[#FFC800]" : 
                          dept === "EXECUTION" ? "bg-[#3B82F6]" : "bg-slate-400"
                        )} 
                        style={{ width: `${(count / (projects.length || 1)) * 100}%` }} 
                      />
                   </div>
                 </div>
               ))}
            </CardContent>
          </Card>

          {/* Activity Log */}
          <Card className="border-none shadow-sm rounded-2xl bg-white">
            <CardHeader className="pb-4">
               <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl">
                    <Activity size={18} strokeWidth={3} />
                  </div>
                  <CardTitle className="text-sm font-black text-[#2D3748] uppercase tracking-tighter">Live Activity Log</CardTitle>
               </div>
            </CardHeader>
            <CardContent>
               <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
                  {auditLogs.slice(0, 8).map((log: any) => (
                    <div key={log.id} className="relative pl-7 group">
                       <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-[#0F172A] shadow-sm z-10 group-hover:scale-125 transition-transform" />
                       <p className="text-xs leading-relaxed text-[#64748B]">
                          <span className="font-black text-[#0F172A] uppercase tracking-tighter">{log.user.email.split('@')[0]}</span>
                          <span className="mx-1.5 text-[#64748B]">performed</span>
                          <span className="font-bold text-[#0F172A]">{log.action.replace(/_/g, ' ')}</span>
                          <span className="mx-1 text-[#64748B]">to</span>
                          <span className="font-black text-[#1C3384] uppercase tracking-tighter">{log.newValue || "SITE_SURVEY"}</span>
                       </p>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-[#4A5568] uppercase tracking-widest">{log.task?.project?.name || "System Update"}</span>
                          <span className="text-[9px] text-slate-300 italic">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
