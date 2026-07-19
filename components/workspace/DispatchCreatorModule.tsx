"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, CheckCircle2, ArrowRight, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createMaterialReleaseNote } from "@/lib/actions/procurement";
import { getInventoryItems } from "@/lib/actions/inventory";
import { formatDistanceToNow } from "date-fns";

interface DispatchCreatorModuleProps {
  project: any;
  existingDispatches: any[];
  onRefresh: () => void;
}

export function DispatchCreatorModule({ project, existingDispatches, onRefresh }: DispatchCreatorModuleProps) {
  const [items, setItems] = useState([{ name: "", quantity: 1 }]);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [isDispatching, setIsDispatching] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);

  useEffect(() => {
    getInventoryItems().then((res) => {
      if (res.success && res.data) {
        setInventory(res.data);
      }
    });
  }, []);

  const handleAddItem = () => setItems([...items, { name: "", quantity: 1 }]);
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleDispatch = async () => {
    if (!vehicleNumber) {
      toast.error("Vehicle number is required");
      return;
    }
    setIsDispatching(true);
    const toastId = toast.loading("Logging Dispatch Note...");
    try {
      const trackingNumber = `DSP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      await createMaterialReleaseNote(project.id, trackingNumber, items, vehicleNumber, driverName);
      toast.success("Materials Dispatched Successfully", { id: toastId });
      setVehicleNumber("");
      setDriverName("");
      setItems([{ name: "", quantity: 1 }]);
      onRefresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to log dispatch", { id: toastId });
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in duration-700">
      {/* Dispatch Creation Form */}
      <Card className="p-8 rounded-[2rem] border-slate-200 shadow-sm">
         <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6 flex items-center gap-2">
            <Truck className="text-[#1C3384]" size={24} /> New Dispatch Note
         </h2>
         
         <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vehicle Number</label>
                 <Input value={vehicleNumber} onChange={e => setVehicleNumber(e.target.value)} placeholder="e.g. MH-12-AB-1234" className="h-12 bg-slate-50 uppercase" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Driver Name & Contact</label>
                 <Input value={driverName} onChange={e => setDriverName(e.target.value)} placeholder="e.g. John Doe - 555-0192" className="h-12 bg-slate-50" />
               </div>
            </div>
            
            <div className="space-y-3">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between items-center border-b border-slate-100 pb-2">
                 Materials Loading onto Truck
                 <Button variant="ghost" size="sm" onClick={handleAddItem} className="text-[#1C3384] h-6 text-[10px] hover:bg-blue-50">
                    + Add Material
                 </Button>
               </label>
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-2">
                      <select 
                        value={item.name} 
                        onChange={e => handleItemChange(idx, "name", e.target.value)} 
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1C3384]/20"
                      >
                        <option value="">Select Inventory Item...</option>
                        {inventory.map(invItem => (
                          <option key={invItem.id} value={invItem.name}>
                            {invItem.name} ({invItem.quantityInStock} in stock)
                          </option>
                        ))}
                      </select>
                      <Input type="number" placeholder="Qty" value={(item.quantity as any) === "" || isNaN(item.quantity as any) ? "" : item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value === "" ? "" : parseInt(e.target.value))} className="w-24 bg-slate-50" />
                    </div>
                  ))}
               </div>
            </div>

            <Button onClick={handleDispatch} disabled={isDispatching} className="w-full h-14 rounded-2xl bg-[#1C3384] hover:bg-blue-900 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-blue-900/20 mt-4 group">
              {isDispatching ? <Loader2 className="animate-spin" /> : (
                 <>
                   Confirm Dispatch to Site
                   <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                 </>
              )}
            </Button>
         </div>
      </Card>

      {/* Transit Log */}
      <div className="space-y-4">
         <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
           <MapPin size={16} /> Active Deliveries
         </h3>
         
         {existingDispatches.length === 0 ? (
           <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center text-slate-400 bg-slate-50/50">
             <Truck size={32} className="mx-auto mb-3 opacity-30" />
             <p className="text-xs font-bold uppercase tracking-widest">No deliveries in transit</p>
           </div>
         ) : (
           <div className="space-y-4">
             {existingDispatches.map(dispatch => {
               const isReceived = dispatch.status === 'RECEIVED';
               
               return (
                 <div key={dispatch.id} className={cn(
                    "p-5 rounded-3xl border transition-all relative overflow-hidden",
                    isReceived ? "bg-emerald-50/50 border-emerald-100" : "bg-white border-slate-200 shadow-sm"
                 )}>
                   <div className="flex justify-between items-start mb-3">
                     <div>
                       <Badge className={cn(
                          "font-black uppercase tracking-widest text-[9px] px-2 py-0.5 border-none mb-1",
                          isReceived ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700 animate-pulse"
                       )}>
                         {isReceived ? "Delivered & Received" : "In Transit"}
                       </Badge>
                       <h4 className="font-bold text-slate-900 text-sm tracking-tight">{dispatch.mrnNumber}</h4>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                         {formatDistanceToNow(new Date(dispatch.createdAt), { addSuffix: true })}
                       </p>
                       <p className="text-xs font-medium text-slate-500 mt-0.5">{dispatch.vehicleNumber}</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-2 flex-wrap">
                      {(dispatch.items as any[] || []).map((item, i) => (
                         <span key={i} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">
                            {item.quantity}x {item.name}
                         </span>
                      ))}
                   </div>
                   
                   {isReceived && dispatch.receiptDetails?.items?.notes && (
                      <div className="mt-3 p-3 bg-white rounded-xl border border-emerald-100 text-xs text-emerald-700 font-medium flex gap-2 items-start">
                         <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                         <div>
                            <span className="font-bold block">Site Receipt Note:</span>
                            {dispatch.receiptDetails.items.notes}
                         </div>
                      </div>
                   )}
                 </div>
               );
             })}
           </div>
         )}
      </div>
    </div>
  );
}
