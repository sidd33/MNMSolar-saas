import { getMyLeads, getSurveyTrackingLeads } from "@/lib/actions/sales";
import LeadsClient from "./LeadsClient";
import { Suspense } from "react";
;

export default async function MyLeadsPage() {
  const [allLeads, surveyLeads] = await Promise.all([
    getMyLeads(),
    getSurveyTrackingLeads()
  ]);

  // Initial filtering for the client component
  const filteredActive = allLeads.filter((l: any) => l.status !== 'SITE_VISIT_SCHEDULED' && l.status !== 'CONVERTED');

  return (
    <Suspense fallback={
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4 opacity-40 animate-pulse">
            <div className="h-1 shadow-sm w-48 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1C3384] w-1/3" />
            </div>
            <p className="text-[#1C3384] font-black uppercase tracking-widest text-[10px]">Scanning Prospect Database...</p>
        </div>
    }>
        <LeadsClient initialLeads={filteredActive} initialSurveyLeads={surveyLeads} />
    </Suspense>
  );
}
