import { getMyQuotes } from "@/lib/actions/sales";
import { QuotesClient } from "./QuotesClient";
import { Suspense } from "react";
import { FileText } from "lucide-react";

export default async function MyQuotesPage() {
  const quotes = await getMyQuotes();

  return (
    <Suspense fallback={
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh] gap-4 opacity-40 animate-pulse">
            <div className="h-1 shadow-sm w-48 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#1C3384] w-1/2" />
            </div>
            <p className="text-[#1C3384] font-black uppercase tracking-widest text-[10px]">Synchronizing Proposal Vault...</p>
        </div>
    }>
        <QuotesClient quotes={quotes} />
    </Suspense>
  );
}
