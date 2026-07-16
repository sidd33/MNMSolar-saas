"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowRight } from "lucide-react";

interface AllocationsTableProps {
  allocations: any[];
}

export function AllocationsTable({ allocations }: AllocationsTableProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Project Allocations</h2>
        <p className="text-sm text-slate-500">History of items allocated to projects</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                  <Package className="mx-auto mb-2 opacity-20" size={32} />
                  No allocations recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              allocations.map(alloc => (
                <TableRow key={alloc.id}>
                  <TableCell className="text-slate-500 whitespace-nowrap">
                    {new Date(alloc.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-slate-900">{alloc.item?.name}</div>
                    <div className="text-xs text-slate-500">{alloc.item?.sku || "No SKU"}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 font-bold whitespace-nowrap">
                      {Math.abs(alloc.quantity)} {alloc.item?.unit}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {alloc.project ? (
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1">
                          {alloc.project.name}
                        </div>
                        <div className="text-xs text-slate-500">{alloc.project.clientName}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Unknown Project</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 max-w-xs truncate" title={alloc.notes || ""}>
                    {alloc.notes || "-"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
