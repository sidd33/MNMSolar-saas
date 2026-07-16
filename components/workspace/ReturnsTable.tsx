"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { processMaterialReturn } from "@/lib/actions/returns";
import { ArrowLeftRight, Search, Plus, Save, X } from "lucide-react";

interface ReturnsTableProps {
  returns: any[];
  inventoryItems: any[];
  activeProjects: any[];
  organizationId: string;
  userId: string;
}

export function ReturnsTable({ returns, inventoryItems, activeProjects, organizationId, userId }: ReturnsTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [selectedProject, setSelectedProject] = useState("");
  const [returnItems, setReturnItems] = useState([{ itemId: "", quantity: 0, notes: "" }]);
  const [returnNote, setReturnNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddLine = () => setReturnItems([...returnItems, { itemId: "", quantity: 0, notes: "" }]);
  const handleRemoveLine = (idx: number) => setReturnItems(returnItems.filter((_, i) => i !== idx));

  const handleItemChange = (idx: number, field: string, value: string | number) => {
    const newItems = [...returnItems];
    newItems[idx] = { ...newItems[idx], [field]: value };
    setReturnItems(newItems);
  };

  const handleSubmit = async () => {
    if (!selectedProject || returnItems.some(i => !i.itemId || i.quantity <= 0)) {
      alert("Please fill in project and ensure all items have valid quantities.");
      return;
    }
    setIsSubmitting(true);
    const res = await processMaterialReturn({
      projectId: selectedProject,
      items: returnItems,
      organizationId,
      loggedByUserId: userId,
      returnNote
    });

    setIsSubmitting(false);
    if (res.success) {
      setIsAdding(false);
      setReturnItems([{ itemId: "", quantity: 0, notes: "" }]);
      setSelectedProject("");
      setReturnNote("");
      // Since it's a server action with revalidatePath, the page should refresh
    } else {
      alert("Error: " + res.error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Return Logs</h2>
        <Button onClick={() => setIsAdding(!isAdding)} className="bg-[#1C3384] hover:bg-blue-900 gap-2">
          {isAdding ? <X size={16} /> : <Plus size={16} />}
          {isAdding ? "Cancel Return" : "Log Material Return"}
        </Button>
      </div>

      {isAdding && (
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
            <ArrowLeftRight size={18} /> Process Return to Inventory
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-amber-800/70 uppercase tracking-wider mb-1 block">Project Returned From</label>
              <select 
                className="flex h-10 w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                value={selectedProject}
                onChange={e => setSelectedProject(e.target.value)}
              >
                <option value="" disabled>Select Project...</option>
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-amber-800/70 uppercase tracking-wider mb-1 block">General Note (Optional)</label>
              <Input 
                value={returnNote} 
                onChange={e => setReturnNote(e.target.value)} 
                placeholder="Reason for return..." 
                className="bg-white border-amber-200 focus-visible:ring-amber-500"
              />
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <label className="text-xs font-bold text-amber-800/70 uppercase tracking-wider block">Items Being Returned</label>
            {returnItems.map((item, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-white p-3 rounded-lg border border-amber-100">
                <select
                  className="flex-1 h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  value={item.itemId}
                  onChange={e => handleItemChange(idx, "itemId", e.target.value)}
                >
                  <option value="" disabled>Select Item from Inventory...</option>
                  {inventoryItems.map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.name} ({inv.unit})</option>
                  ))}
                </select>
                <Input 
                  type="number" 
                  placeholder="Qty" 
                  className="w-24 border-slate-200" 
                  value={item.quantity || ""}
                  onChange={e => handleItemChange(idx, "quantity", parseFloat(e.target.value) || 0)}
                />
                <Input 
                  placeholder="Note (e.g. slight damage)" 
                  className="flex-1 border-slate-200"
                  value={item.notes}
                  onChange={e => handleItemChange(idx, "notes", e.target.value)}
                />
                <Button variant="ghost" onClick={() => handleRemoveLine(idx)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                  <X size={16} />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddLine} className="border-amber-200 text-amber-700 hover:bg-amber-100">
              <Plus size={14} className="mr-1" /> Add Another Item
            </Button>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white min-w-32">
              {isSubmitting ? "Processing..." : "Confirm Return"}
            </Button>
          </div>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead>Challan No.</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Items Returned</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-32 text-center text-slate-500">
                  <ArrowLeftRight className="mx-auto mb-2 opacity-20" size={32} />
                  No returns logged yet.
                </TableCell>
              </TableRow>
            ) : (
              returns.map(ret => (
                <TableRow key={ret.id}>
                  <TableCell className="font-mono font-medium text-amber-700">{ret.challanNumber}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-slate-900">{ret.project?.name}</p>
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(ret.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {ret.items && Array.isArray(ret.items) ? ret.items.map((it: any, i: number) => {
                         const invItem = inventoryItems.find(x => x.id === it.itemId);
                         return (
                           <Badge key={i} variant="secondary" className="bg-slate-100 text-slate-700 font-normal">
                             {it.quantity}x {invItem ? invItem.name : "Unknown Item"}
                           </Badge>
                         )
                      }) : null}
                    </div>
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
