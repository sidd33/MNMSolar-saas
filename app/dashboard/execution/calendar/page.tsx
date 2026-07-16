import { getExecutionQueue } from "@/lib/actions/execution";
import LaborCalendarClient from "./LaborCalendarClient";
import { Badge } from "@/components/ui/badge";

export default async function LaborCalendarPage() {
    // Fetch execution queue to get the list of active projects
    const projects = await getExecutionQueue();
    
    // Sort projects alphabetically
    projects.sort((a, b) => a.name.localeCompare(b.name));

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
                <div className="space-y-1">
                    <Badge className="bg-[#1C3384]/10 text-[#1C3384] hover:bg-[#1C3384]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px] mb-2">
                        Labor Tracking
                    </Badge>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
                        Site Calendar
                    </h1>
                    <p className="text-slate-500 font-medium text-sm text-left">
                        Monitor and log daily labor deployment across active sites.
                    </p>
                </div>
            </div>

            <LaborCalendarClient projects={projects} />
        </div>
    );
}
