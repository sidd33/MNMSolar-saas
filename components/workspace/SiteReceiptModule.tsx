"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PackageSearch, CheckCircle2, Loader2, AlertCircle, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getDispatches, markDispatchReceived } from "@/lib/actions/procurement";
import { formatDistanceToNow } from "date-fns";

interface SiteReceiptModuleProps {
  project: any;
}

export function SiteReceiptModule({ project }: SiteReceiptModuleProps) {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(null);
  const [receiptNotes, setReceiptNotes] = useState("");
  const [isReceiving, setIsReceiving] = useState(false);

  useEffect(() => {
    fetchDispatches();
  }, [project.id]);

  const fetchDispatches = async () => {
    setIsLoading(true);
    try {
      const fetched = await getDispatches(project.id);
      setDispatches(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkReceived = async (hasDiscrepancy: boolean = false) => {
    if (!selectedDispatchId) return;
    
    if (hasDiscrepancy && (!receiptNotes || receiptNotes.trim() === "")) {
      toast.error("Please add notes detailing the discrepancy");
      return;
    }

    const dispatchToReceive = dispatches.find(d => d.id === selectedDispatchId);
    if (!dispatchToReceive) return;

    setIsReceiving(true);
    const toastId = toast.loading(hasDiscrepancy ? "Reporting Discrepancy..." : "Logging Receipt...");
    try {
      await markDispatchReceived(
          selectedDispatchId, 
          project.id, 
          receiptNotes || "All items received in good condition.", 
          dispatchToReceive.items,
          hasDiscrepancy
      );
      toast.success(hasDiscrepancy ? "Discrepancy Logged" : "Delivery Marked as Received", { id: toastId });
      setSelectedDispatchId(null);
      setReceiptNotes("");
      fetchDispatches();
    } catch (e: any) {
      toast.error(e.message || "Failed to log receipt", { id: toastId });
    } finally {
      setIsReceiving(false);
    }
  };

  const pendingDispatches = dispatches.filter(d => d.status !== 'RECEIVED');
  const receivedDispatches = dispatches.filter(d => d.status === 'RECEIVED');

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-2">Site Deliveries</h2>
        <p className="text-sm font-medium text-slate-500">Acknowledge materials arriving from the warehouse/vendor.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Incoming Deliveries */}
         <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Truck size={16} /> Incoming Trucks
            </h3>

            {isLoading ? (
               <div className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
            ) : pendingDispatches.length === 0 ? (
               <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50">
                  <PackageSearch size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No incoming deliveries</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {pendingDispatches.map(dispatch => (
                     <Card 
                        key={dispatch.id} 
                        className={cn(
                           "p-5 rounded-3xl cursor-pointer transition-all border-2",
                           selectedDispatchId === dispatch.id ? "border-[#1C3384] shadow-lg shadow-blue-900/10 bg-blue-50/30" : "border-slate-200 hover:border-[#1C3384]/50 hover:bg-slate-50"
                        )}
                        onClick={() => setSelectedDispatchId(dispatch.id)}
                     >
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 uppercase tracking-widest text-[9px] font-black border-none mb-2 animate-pulse">
                                 In Transit
                              </Badge>
                              <h4 className="font-bold text-slate-900">{dispatch.mrnNumber}</h4>
                              <p className="text-xs text-slate-500 font-medium">Vehicle: {dispatch.vehicleNumber}</p>
                           </div>
                           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                              Dispatched {formatDistanceToNow(new Date(dispatch.createdAt), { addSuffix: true })}
                           </div>
                        </div>

                        <div className="space-y-1">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Manifest</p>
                           {(dispatch.items as any[] || []).map((item, i) => (
                              <div key={i} className="flex justify-between text-xs font-medium text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                 <span>{item.name}</span>
                                 <span className="font-bold">Qty: {item.quantity}</span>
                              </div>
                           ))}
                        </div>

                        {selectedDispatchId === dispatch.id && (
                           <div className="mt-4 pt-4 border-t border-[#1C3384]/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                              <Textarea 
                                 placeholder="Add notes (e.g. 'Received safely', '2 panels damaged')"
                                 value={receiptNotes}
                                 onChange={e => setReceiptNotes(e.target.value)}
                                 className="bg-white border-slate-200 resize-none min-h-[80px]"
                              />
                              <div className="flex gap-2">
                                 <Button 
                                    onClick={() => handleMarkReceived(false)} 
                                    disabled={isReceiving}
                                    className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs"
                                 >
                                    {isReceiving ? <Loader2 className="animate-spin" /> : "Mark Received"}
                                 </Button>
                                 <Button 
                                    onClick={() => handleMarkReceived(true)} 
                                    disabled={isReceiving}
                                    variant="outline"
                                    className="flex-1 h-12 rounded-xl border-amber-500 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-black uppercase tracking-widest text-xs"
                                 >
                                    {isReceiving ? <Loader2 className="animate-spin" /> : "Discrepancy"}
                                 </Button>
                              </div>
                           </div>
                        )}
                     </Card>
                  ))}
               </div>
            )}
         </div>

         {/* Received Log */}
         <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <CheckCircle2 size={16} /> Receipt Log
            </h3>
            
            {isLoading ? (
               <div className="h-40 rounded-3xl bg-slate-100 animate-pulse" />
            ) : receivedDispatches.length === 0 ? (
               <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50">
                  <CheckCircle2 size={32} className="mx-auto mb-3 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No past receipts</p>
               </div>
            ) : (
               <div className="space-y-4">
                  {receivedDispatches.map(dispatch => (
                     <div key={dispatch.id} className="p-5 rounded-3xl bg-white border border-emerald-100 shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                        <div className="flex justify-between items-start mb-3">
                           <div>
                              <Badge className={cn(
                                "uppercase tracking-widest text-[9px] font-black border mb-2",
                                dispatch.receiptDetails?.items?.hasDiscrepancy 
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-50 border-amber-200" 
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                              )}>
                                 {dispatch.receiptDetails?.items?.hasDiscrepancy ? "Received w/ Discrepancy" : "Received"}
                              </Badge>
                              <h4 className="font-bold text-slate-900 text-sm">{dispatch.mrnNumber}</h4>
                           </div>
                           <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                              {dispatch.receiptDetails?.createdAt && formatDistanceToNow(new Date(dispatch.receiptDetails.createdAt), { addSuffix: true })}
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                           {(dispatch.items as any[] || []).map((item, i) => (
                              <span key={i} className="text-[10px] font-bold px-2 py-1 bg-slate-50 text-slate-500 rounded-md border border-slate-100">
                                 {item.quantity}x {item.name}
                              </span>
                           ))}
                        </div>

                        {dispatch.receiptDetails?.items?.notes && (
                           <div className={cn(
                             "p-3 rounded-xl border text-xs font-medium",
                             dispatch.receiptDetails?.items?.hasDiscrepancy
                               ? "bg-amber-50/50 border-amber-100 text-amber-800"
                               : "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                           )}>
                              <strong className={cn(
                                "block text-[10px] uppercase tracking-widest mb-0.5",
                                dispatch.receiptDetails?.items?.hasDiscrepancy ? "text-amber-600" : "text-emerald-600"
                              )}>
                                {dispatch.receiptDetails?.items?.hasDiscrepancy ? "Discrepancy Note:" : "Receipt Note:"}
                              </strong>
                              {dispatch.receiptDetails.items.notes}
                           </div>
                        )}
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
