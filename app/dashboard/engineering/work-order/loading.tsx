import { Card } from "@/components/ui/card";

export default function WorkOrderLoading() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      <div className="space-y-4">
        <div className="h-4 w-32 bg-slate-200 rounded-full" />
        <div className="h-10 w-72 bg-slate-300 rounded-xl" />
        <div className="h-4 w-96 bg-slate-100 rounded-lg" />
      </div>
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="h-64 rounded-[2.5rem] border border-slate-100 bg-slate-50 shadow-sm" />
        ))}
      </div>
    </div>
  );
}
