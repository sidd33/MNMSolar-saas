"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, CheckCircle2, History, Paperclip, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { createPurchaseOrder, addPurchaseOrderLog } from "@/lib/actions/procurement";
import { formatDistanceToNow } from "date-fns";

interface POBuilderModuleProps {
  project: any;
  existingPOs: any[];
  onRefresh: () => void;
}

export function POBuilderModule({ project, existingPOs, onRefresh }: POBuilderModuleProps) {
  const [vendorName, setVendorName] = useState("");
  const [orderType, setOrderType] = useState("MATERIALS");
  const [amount, setAmount] = useState("");
  const [items, setItems] = useState([{ name: "", quantity: 1 }]);
  const [isCreating, setIsCreating] = useState(false);
  
  const [activePoId, setActivePoId] = useState<string | null>(existingPOs[0]?.id || null);
  const [logMessage, setLogMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLogging, setIsLogging] = useState(false);
  const { uploadFiles } = useProjectFileUpload();

  const handleAddItem = () => setItems([...items, { name: "", quantity: 1 }]);
  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleCreatePO = async () => {
    if (!vendorName || !amount) {
      toast.error("Please fill vendor name and amount");
      return;
    }
    setIsCreating(true);
    const toastId = toast.loading("Generating Purchase Order...");
    try {
      const parsedAmount = parseFloat(amount);
      const initialItemsObj = { list: items, activityLog: [{ message: "PO Draft Created", timestamp: new Date().toISOString(), loggedBy: "System" }] };
      const newPO = await createPurchaseOrder(project.id, vendorName, orderType, parsedAmount, initialItemsObj as any);
      toast.success("Purchase Order generated", { id: toastId });
      setVendorName("");
      setAmount("");
      setItems([{ name: "", quantity: 1 }]);
      onRefresh();
      setActivePoId(newPO.id);
    } catch (e: any) {
      toast.error(e.message || "Failed to create PO", { id: toastId });
    } finally {
      setIsCreating(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddLog = async (poId: string) => {
    if (!logMessage && !selectedFile) return;
    setIsLogging(true);
    
    try {
      if (selectedFile) {
        const toastId = toast.loading("Uploading attachment & posting log...");
        const renamedFile = new File([selectedFile], `[PO_ATTACH] ${selectedFile.name}`, { type: selectedFile.type });
        await uploadFiles(project.id, [renamedFile], "COMMERCIAL" as any, null, async (savedFiles) => {
          if (savedFiles && savedFiles.length > 0) {
            const fileData = savedFiles[0];
            await addPurchaseOrderLog(poId, { 
               message: logMessage || `Attached Document: ${selectedFile.name}`,
               fileUrl: fileData.fileUrl,
               fileName: fileData.name
            });
            toast.success("Log posted", { id: toastId });
          }
        });
      } else {
        await addPurchaseOrderLog(poId, { message: logMessage });
      }
      
      setLogMessage("");
      setSelectedFile(null);
      onRefresh();
    } catch (e) {
      toast.error("Failed to add log");
    } finally {
      setIsLogging(false);
    }
  };

  const activePO = existingPOs.find(p => p.id === activePoId);
  const activityLog = activePO ? (activePO.items as any)?.activityLog || [] : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
      {/* Sidebar: List of POs */}
      <div className="lg:col-span-1 space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
          <ShoppingCart size={16} /> Purchase Orders
        </h3>
        
        {existingPOs.length === 0 ? (
           <div className="p-8 border-2 border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
             <p className="text-xs font-bold uppercase tracking-widest">No POs generated yet</p>
           </div>
        ) : (
          <div className="space-y-3">
            {existingPOs.map(po => (
              <div 
                key={po.id} 
                onClick={() => setActivePoId(po.id)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all",
                  activePoId === po.id ? "bg-[#1C3384] border-[#1C3384] text-white shadow-xl shadow-blue-900/20" : "bg-white border-slate-200 hover:border-[#1C3384]/50"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className={cn("text-[10px] font-black uppercase tracking-widest", activePoId === po.id ? "text-blue-200" : "text-slate-400")}>
                    {po.orderType}
                  </span>
                  <Badge variant="outline" className={cn("text-[9px]", activePoId === po.id ? "border-white/20 text-white" : "")}>
                    {po.status}
                  </Badge>
                </div>
                <h4 className="font-bold text-lg mb-1 truncate">{po.vendorName}</h4>
                <div className={cn("text-xs font-medium", activePoId === po.id ? "text-blue-100" : "text-slate-500")}>
                  Value: ${po.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100">
          <Button onClick={() => setActivePoId(null)} variant="outline" className="w-full rounded-xl border-dashed">
            <Plus size={16} className="mr-2" /> New PO
          </Button>
        </div>
      </div>

      {/* Main Panel: Create or View PO */}
      <div className="lg:col-span-2">
        {!activePoId ? (
          <Card className="p-8 rounded-[2rem] border-slate-200 shadow-sm">
            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 mb-6">Create New PO</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Vendor Name</label>
                  <Input value={vendorName} onChange={e => setVendorName(e.target.value)} placeholder="e.g. SunPower Ltd" className="h-12 bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Order Amount</label>
                  <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="h-12 bg-slate-50" />
                </div>
              </div>
              
              <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex justify-between">
                   Line Items
                   <span className="text-[#1C3384] cursor-pointer" onClick={handleAddItem}>+ Add Item</span>
                 </label>
                 {items.map((item, idx) => (
                   <div key={idx} className="flex gap-2">
                     <Input placeholder="Item description" value={item.name} onChange={e => handleItemChange(idx, "name", e.target.value)} className="flex-1 bg-slate-50" />
                     <Input type="number" placeholder="Qty" value={(item.quantity as any) === "" || isNaN(item.quantity as any) ? "" : item.quantity} onChange={e => handleItemChange(idx, "quantity", e.target.value === "" ? "" : parseInt(e.target.value))} className="w-24 bg-slate-50" />
                   </div>
                 ))}
              </div>

              <Button onClick={handleCreatePO} disabled={isCreating} className="w-full h-12 rounded-xl bg-[#1C3384] hover:bg-blue-900 text-white font-bold uppercase tracking-widest mt-4">
                {isCreating ? <Loader2 className="animate-spin" /> : "Generate Purchase Order"}
              </Button>
            </div>
          </Card>
        ) : activePO && (
          <Card className="rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[500px] p-0 gap-0">
             {/* PO Header */}
             <div className="bg-[#1C3384] p-8 text-white">
                <Badge className="bg-white/10 hover:bg-white/20 text-white border-none mb-4 text-[10px] uppercase tracking-widest">
                  {activePO.status}
                </Badge>
                <div className="flex justify-between items-end">
                   <div>
                     <h2 className="text-3xl font-black uppercase tracking-tight">{activePO.vendorName}</h2>
                     <p className="text-blue-200 mt-1">PO for {project.name}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-xs text-blue-200 font-bold uppercase tracking-widest mb-1">Total Value</p>
                     <p className="text-2xl font-black">${activePO.amount.toLocaleString()}</p>
                   </div>
                </div>
             </div>

             {/* Activity Log (The Full View) */}
             <div className="flex-1 bg-slate-50 p-8 overflow-y-auto max-h-[400px]">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                  <History size={16} className="text-[#1C3384]" /> PO Lifecycle Log
                </h3>
                
                <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                   {activityLog.map((log: any, i: number) => (
                     <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-100 text-slate-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                           {log.fileUrl ? <Paperclip size={14} className="text-[#1C3384]" /> : <CheckCircle2 size={14} className="text-emerald-500" />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                           <div className="flex items-center justify-between space-x-2 mb-1">
                              <div className="font-bold text-slate-900 text-xs">{log.loggedBy}</div>
                              <time className="font-medium text-[9px] text-slate-400">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}</time>
                           </div>
                           <div className="text-slate-600 text-sm mt-1">{log.message}</div>
                           {log.fileUrl && (
                              <a href={log.fileUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-[#1C3384] text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors">
                                 <Paperclip size={12} /> View Document
                              </a>
                           )}
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* Log Input & Attachments */}
             <div className="p-6 bg-white border-t border-slate-100 flex flex-col gap-3">
                {selectedFile && (
                   <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-[#1C3384] text-xs font-bold rounded-lg self-start">
                      <Paperclip size={14} />
                      {selectedFile.name}
                      <button onClick={() => setSelectedFile(null)} className="ml-2 text-blue-400 hover:text-blue-600">&times;</button>
                   </div>
                )}
                <div className="flex gap-2">
                   <div className="relative">
                      <Button variant="outline" className="h-12 w-12 rounded-xl shrink-0 border-slate-200 text-slate-500 hover:text-[#1C3384] hover:bg-slate-50" title="Attach Document">
                         <Paperclip size={18} />
                      </Button>
                      <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileSelect} />
                   </div>
                   <Input 
                      value={logMessage}
                      onChange={e => setLogMessage(e.target.value)}
                      placeholder="Add an update to this PO..."
                      className="h-12 bg-slate-50 border-slate-200 flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleAddLog(activePO.id)}
                   />
                   <Button onClick={() => handleAddLog(activePO.id)} disabled={isLogging || (!logMessage && !selectedFile)} className="h-12 px-6 rounded-xl bg-[#1C3384] hover:bg-blue-900 text-white font-bold uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20">
                      {isLogging ? <Loader2 className="animate-spin" /> : "Post"}
                   </Button>
                </div>
             </div>
          </Card>
        )}
      </div>
    </div>
  );
}
