import { Card } from "@/components/ui/card";

export default function EngineeringLoading() {
  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-4">
          <div className="h-5 w-32 bg-slate-200 rounded-full" />
          <div className="h-10 w-64 bg-slate-300 rounded-xl" />
          <div className="h-4 w-96 bg-slate-100 rounded-lg" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 h-44 shadow-sm" />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workflow Shortcuts Skeleton */}
        <div className="space-y-6">
          <div className="h-6 w-48 bg-slate-200 rounded-lg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-32 bg-slate-100 rounded-3xl border border-slate-50" />
            <div className="h-32 bg-slate-100 rounded-3xl border border-slate-50" />
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm h-[400px]" />
      </div>
    </div>
  );
}
