"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { approveAndLaunchQuote } from "@/lib/actions/sales";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { Rocket, FileSpreadsheet, CheckCircle2, UploadCloud, Zap, AlertCircle, ArrowLeft, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";
import { parseHandoverExcel, HandoverData } from "@/lib/utils/excelParser";
import { getEngineeringTeamMembers, assignProjectToEngineer } from "@/lib/actions/engineering";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useRef } from "react";
import { AtSign, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HandoverDetailPanelProps {
  quote: any;
  onUpdate: () => void;
  onBack: () => void;
}

export function HandoverDetailPanel({ quote, onUpdate, onBack }: HandoverDetailPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { uploadFiles, isUploading, status, progress } = useProjectFileUpload();


  const [handoverFile, setHandoverFile] = useState<{ url: string; key: string; name: string } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    clientName: quote.clientName || "",
    dcCapacity: quote.capacityKw?.toString() || "",
    quotedValue: quote.quotedValue?.toString() || "",
    orderValueWithTax: "",
    projectType: "",
    primaryContactMobile: "",
    address: "",
    scopeOfWork: quote.scopeOfWork || "",
    notes: quote.notes || "",
    // Payment Terms
    paymentTermsAdvance: quote.paymentTermsAdvance?.toString() || "",
    paymentTermsDispatch: "",
    paymentTermsReadiness: "",
    paymentTermsErection: "",
    paymentTermsCommissioning: "",
    paymentTermsRetention: ""
  });

  const [engineeringTeam, setEngineeringTeam] = useState<{ id: string; email: string }[]>([]);
  const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);

  // Mention State
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getEngineeringTeamMembers().then(setEngineeringTeam);
  }, []);

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const pos = el.selectionStart;
    const val = el.value;
    
    const textBeforeCursor = val.substring(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        if (lastAtIndex === 0 || textBeforeCursor[lastAtIndex - 1] === " ") {
            setMentionQuery(query);
            setShowMentionDropdown(true);
            setCursorPosition(lastAtIndex);
            setHighlightedIndex(0);
        } else {
            setShowMentionDropdown(false);
        }
    } else {
        setShowMentionDropdown(false);
    }

    if (!val.includes("@")) {
        setShowMentionDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown) {
        const filtered = engineeringTeam.filter(m => 
            m.email.toLowerCase().includes(mentionQuery.toLowerCase())
        );

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % (filtered.length || 1));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + (filtered.length || 1)) % (filtered.length || 1));
        } else if (e.key === "Enter" && filtered.length > 0) {
            e.preventDefault();
            selectMember(filtered[highlightedIndex]);
        } else if (e.key === "Escape") {
            e.preventDefault();
            setShowMentionDropdown(false);
            setMentionQuery("");
        }
    }
  };

  const selectMember = (member: any) => {
    const before = formData.notes.substring(0, cursorPosition);
    const after = formData.notes.substring(textareaRef.current?.selectionStart || 0);
    const newNotes = `${before}@${member.email} ${after}`;
    
    setFormData({ ...formData, notes: newNotes });
    setMentionedUserIds(prev => Array.from(new Set([...prev, member.id])));
    // Sync with assignment dropdown: if mentioned, also assign
    setSelectedEngineerIds(prev => Array.from(new Set([...prev, member.id])));
    setShowMentionDropdown(false);
    
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            const newPos = cursorPosition + member.email.length + 2;
            textareaRef.current.setSelectionRange(newPos, newPos);
        }
    }, 0);
  };

  const removeMention = (userId: string) => {
    setMentionedUserIds(prev => prev.filter(id => id !== userId));
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
            setShowMentionDropdown(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      try {
        // Parse Excel IMMEDIATELY (Client-side, very fast)
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const buffer = evt.target?.result as ArrayBuffer;
          const data = await parseHandoverExcel(buffer);

          setFormData(prev => ({
            ...prev,
            clientName: data.clientName || prev.clientName,
            dcCapacity: data.dcCapacity || prev.dcCapacity,
            quotedValue: data.orderValue || prev.quotedValue,
            orderValueWithTax: data.orderValueWithTax || prev.orderValueWithTax,
            projectType: data.projectType || prev.projectType,
            primaryContactMobile: data.primaryContactMobile || prev.primaryContactMobile,
            address: data.address || prev.address,
            paymentTermsAdvance: data.paymentTerms?.advance || prev.paymentTermsAdvance,
            paymentTermsDispatch: data.paymentTerms?.structureDispatch || prev.paymentTermsDispatch,
            paymentTermsReadiness: data.paymentTerms?.materialReadiness || prev.paymentTermsReadiness,
            paymentTermsErection: data.paymentTerms?.structureErection || prev.paymentTermsErection,
            paymentTermsCommissioning: data.paymentTerms?.commissioning || prev.paymentTermsCommissioning,
            paymentTermsRetention: data.paymentTerms?.retention || prev.paymentTermsRetention
          }));

          toast.success("Excel data parsed. Review and click Launch to upload.");
        };
        reader.readAsArrayBuffer(file);
      } catch (err: any) {
        toast.error("Failed to parse Excel: " + err.message);
      }
    }
  };

  const handleLaunch = async () => {
    if (!selectedFile && !handoverFile) {
      toast.error("Handover Sheet is required to launch.");
      return;
    }

    startTransition(async () => {
      try {
        let finalFile = handoverFile;

        // 1. Upload to Vault ONLY when Launching
        if (selectedFile && !handoverFile) {
          const projectId = quote.lead?.projects?.[0]?.id;
          if (!projectId) throw new Error("Associated preliminary project not found.");

          const uploadedFilesResult = await new Promise<any[]>((resolve, reject) => {
            uploadFiles(projectId, [selectedFile], "HANDOVER_SHEET", null, (savedFiles) => {
              resolve(savedFiles);
            }, "SITE_SURVEY").catch(reject);
          });

          if (uploadedFilesResult && uploadedFilesResult[0]) {
            finalFile = {
              url: uploadedFilesResult[0].fileUrl,
              key: uploadedFilesResult[0].utFileKey,
              name: uploadedFilesResult[0].name
            };
          }
        }

        if (!finalFile) throw new Error("File upload failed or was cancelled.");

        // 2. Finalize Launch
        const result = await approveAndLaunchQuote(
          quote.id,
          finalFile.url,
          finalFile.key,
          finalFile.name,
          {
            clientName: formData.clientName,
            dcCapacity: formData.dcCapacity,
            quotedValue: formData.quotedValue,
            orderValueWithTax: formData.orderValueWithTax,
            projectType: formData.projectType,
            primaryContactMobile: formData.primaryContactMobile,
            address: formData.address,
            paymentTerms: {
              advance: formData.paymentTermsAdvance,
              dispatch: formData.paymentTermsDispatch,
              readiness: formData.paymentTermsReadiness,
              erection: formData.paymentTermsErection,
              commissioning: formData.paymentTermsCommissioning,
              retention: formData.paymentTermsRetention
            }
          }
        );

        if (selectedEngineerIds.length > 0 && result.projectId) {
          await assignProjectToEngineer(result.projectId, selectedEngineerIds);
          toast.success(`Project launched and assigned to ${selectedEngineerIds.length} engineers`);
        } else {
          toast.success("Project launched to Engineering pool.");
        }

        onUpdate();
      } catch (e: any) {
        console.error("Launch error:", e);
        toast.error(e.message || "Failed to launch project");
      }
    });
  };


  return (
    <div className="max-w-full overflow-x-hidden grid grid-cols-1 lg:grid-cols-10 gap-0 p-0 rounded-b-[2rem] bg-white border-t border-slate-100 shadow-inner">
      {/* LEFT SECTION — Ergonmic Form (70%) */}
      <div className="lg:col-span-7 p-8 space-y-8 bg-white min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
              <Briefcase size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Technical Handover</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">Finalize project metadata for engineering</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1C3384] transition-colors gap-2"
          >
            <ArrowLeft size={14} /> Back to Commercials
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Final Client Name</Label>
            <Input
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full h-11 font-black text-slate-900 bg-slate-50/50 border-none rounded-xl focus:ring-2 focus:ring-emerald-100 transition-all"
              placeholder="Extracted..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capacity (kWp)</Label>
            <Input
              value={formData.dcCapacity}
              onChange={(e) => setFormData({ ...formData, dcCapacity: e.target.value })}
              className="w-full h-11 font-black text-slate-900 bg-slate-50/50 border-none rounded-xl focus:ring-2 focus:ring-emerald-100 transition-all"
              placeholder="kWp..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Type</Label>
            <Input
              value={formData.projectType}
              onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
              className="w-full h-11 font-black text-slate-900 bg-slate-50/50 border-none rounded-xl uppercase focus:ring-2 focus:ring-emerald-100 transition-all"
              placeholder="CAPEX / OPEX"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contract Value (₹)</Label>
            <Input
              value={formData.quotedValue}
              onChange={(e) => setFormData({ ...formData, quotedValue: e.target.value })}
              className="w-full h-11 font-black text-slate-900 bg-slate-50/50 border-none rounded-xl focus:ring-2 focus:ring-emerald-100 transition-all"
              placeholder="Base Value..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Value with Tax (₹)</Label>
            <Input
              value={formData.orderValueWithTax}
              onChange={(e) => setFormData({ ...formData, orderValueWithTax: e.target.value })}
              className="w-full h-11 font-black text-slate-900 bg-emerald-50/30 border border-emerald-100 rounded-xl focus:ring-2 focus:ring-emerald-100 transition-all shadow-inner"
              placeholder="Extracted with tax..."
            />
          </div>
        </div>

        {/* Detailed Payment Terms Section */}
        <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-4">
           <Label className="text-[10px] font-black uppercase tracking-widest text-[#1C3384] flex items-center gap-2">
              <Zap size={12} /> Final Payment Terms (%)
           </Label>
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              <div className="space-y-1.5">
                 <Label className="text-[9px] font-bold text-slate-400 uppercase">Advance</Label>
                 <Input value={formData.paymentTermsAdvance} onChange={(e) => setFormData({ ...formData, paymentTermsAdvance: e.target.value })} className="h-9 text-xs font-black rounded-lg border-slate-200" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[9px] font-bold text-slate-400 uppercase">Dispatch</Label>
                 <Input value={formData.paymentTermsDispatch} onChange={(e) => setFormData({ ...formData, paymentTermsDispatch: e.target.value })} className="h-9 text-xs font-black rounded-lg border-slate-200" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[9px] font-bold text-slate-400 uppercase">Readiness</Label>
                 <Input value={formData.paymentTermsReadiness} onChange={(e) => setFormData({ ...formData, paymentTermsReadiness: e.target.value })} className="h-9 text-xs font-black rounded-lg border-slate-200" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[9px] font-bold text-slate-400 uppercase">Erection</Label>
                 <Input value={formData.paymentTermsErection} onChange={(e) => setFormData({ ...formData, paymentTermsErection: e.target.value })} className="h-9 text-xs font-black rounded-lg border-slate-200" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[9px] font-bold text-slate-400 uppercase">Comm.</Label>
                 <Input value={formData.paymentTermsCommissioning} onChange={(e) => setFormData({ ...formData, paymentTermsCommissioning: e.target.value })} className="h-9 text-xs font-black rounded-lg border-slate-200" />
              </div>
              <div className="space-y-1.5">
                 <Label className="text-[9px] font-bold text-rose-400 uppercase">Retention</Label>
                 <Input value={formData.paymentTermsRetention} onChange={(e) => setFormData({ ...formData, paymentTermsRetention: e.target.value })} className="h-9 text-xs font-black rounded-lg border-rose-100 bg-rose-50/30 text-rose-700" />
              </div>
           </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Site Installation Address</Label>
          <Textarea
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            className="w-full bg-slate-50/50 border-none rounded-2xl min-h-[80px] font-medium text-slate-700 p-4 focus:ring-2 focus:ring-emerald-100 transition-all resize-none text-sm"
            placeholder="Full site address..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Contact Mobile</Label>
            <Input
              value={formData.primaryContactMobile}
              onChange={(e) => setFormData({ ...formData, primaryContactMobile: e.target.value })}
              className="w-full h-11 font-black text-slate-900 bg-slate-50/50 border-none rounded-xl focus:ring-2 focus:ring-emerald-100 transition-all"
              placeholder="+91..."
            />
          </div>
          <div className="space-y-2 relative">
             <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Technical Notes</Label>
             
             {/* Mentions Dropdown - ABOVE textarea */}
             {showMentionDropdown && (
                <div 
                    ref={dropdownRef}
                    className="absolute bottom-[calc(100%+12px)] left-0 w-full max-w-[320px] bg-white border-[0.5px] border-slate-200 rounded-xl shadow-2xl z-[50] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
                    style={{ maxHeight: '200px' }}
                >
                  <div className="p-3 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Engineering Team</span>
                    <AtSign size={10} className="text-slate-300" />
                  </div>
                  <div className="overflow-y-auto max-h-[160px] custom-scrollbar">
                    {engineeringTeam.filter(m => m.email.toLowerCase().includes(mentionQuery.toLowerCase())).length > 0 ? (
                        engineeringTeam.filter(m => m.email.toLowerCase().includes(mentionQuery.toLowerCase())).map((member, idx) => (
                        <button
                            key={member.id}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            onClick={() => selectMember(member)}
                            className={cn(
                                "w-full text-left h-[40px] px-3 flex items-center gap-3 transition-colors",
                                highlightedIndex === idx ? "bg-slate-50" : "transparent"
                            )}
                        >
                            <div className={cn(
                                "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm",
                                ["bg-blue-500", "bg-emerald-500", "bg-indigo-500", "bg-rose-500", "bg-amber-500"][idx % 5]
                            )}>
                                {member.email.slice(0, 1).toUpperCase()}
                            </div>
                            <div className="flex items-center justify-between w-full min-w-0">
                                <span className="text-[11px] font-bold text-slate-700 truncate mr-2">{member.email}</span>
                                <Badge className="bg-slate-100 text-slate-400 text-[7px] px-1.5 py-0 rounded-full shrink-0">Engineering</Badge>
                            </div>
                        </button>
                        ))
                    ) : (
                        <div className="p-4 text-center">
                            <span className="text-[10px] font-bold text-slate-300 uppercase italic">No engineers found</span>
                        </div>
                    )}
                  </div>
                </div>
              )}

             <Textarea
              ref={textareaRef}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              onKeyUp={handleKeyUp}
              onKeyDown={handleKeyDown}
              className="w-full min-h-[160px] font-black text-slate-900 bg-slate-50/50 border-none rounded-xl focus:ring-2 focus:ring-emerald-100 transition-all p-4 resize-none custom-scrollbar"
              placeholder="Any specific engineering instructions?"
            />

            {/* Mentioned User Chips BELOW textarea */}
            {mentionedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                    {engineeringTeam.filter(m => mentionedUserIds.includes(m.id)).map(user => (
                        <div 
                            key={user.id} 
                            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full border border-blue-100 shadow-sm animate-in fade-in slide-in-from-left-2"
                        >
                            <span className="text-[10px] font-black uppercase tracking-widest">@{user.email}</span>
                            <button 
                                onClick={() => removeMention(user.id)}
                                className="hover:text-rose-500 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT SIDEBAR — Handover Vault & Verification (30%) */}
      <div className="lg:col-span-3 bg-slate-50 p-8 flex flex-col gap-8 border-l border-slate-100 min-w-0">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Handover Vault</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Site Handover Sheet (.xlsx)</p>
            </div>
          </div>

          {/* Handover File Display/Upload */}
          {!handoverFile && !selectedFile ? (
            <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-300/50 bg-white hover:bg-emerald-50/50 rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group shadow-sm">
              <UploadCloud size={40} className={cn(
                "text-slate-300 group-hover:text-emerald-500 transition-all duration-300 group-hover:scale-110",
                isUploading && "animate-pulse"
              )} />
              <div className="text-center">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-emerald-700 transition-colors">Select Excel</p>
              </div>
              <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              {isUploading && (
                <div className="absolute inset-0 bg-white/90 rounded-2xl flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
                  <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest text-center">{status || "Processing..."}</p>
                  <div className="w-full bg-emerald-100 rounded-full h-1 mt-3">
                    <div className="bg-emerald-600 h-full transition-all" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white border border-emerald-100 p-6 rounded-2xl flex flex-col items-center justify-center gap-4 shadow-md group relative">
              <div className={cn(
                "h-16 w-16 rounded-full flex items-center justify-center shadow-inner transition-colors",
                handoverFile ? "bg-emerald-50 text-emerald-500" : "bg-indigo-50 text-indigo-500"
              )}>
                {handoverFile ? <CheckCircle2 size={32} /> : <FileSpreadsheet size={32} />}
              </div>
              <div className="text-center min-w-0 w-full px-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-800 truncate mb-1">
                  {handoverFile?.name || selectedFile?.name}
                </p>
                <p className={cn(
                  "text-[9px] font-bold uppercase tracking-widest",
                  handoverFile ? "text-emerald-600/70" : "text-indigo-600/70"
                )}>
                  {handoverFile ? "Metadata Synced & Staged" : "Parsed & Ready"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setHandoverFile(null);
                  setSelectedFile(null);
                }}
                className="mt-2 h-8 text-[9px] font-black uppercase rounded-lg border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all"
              >
                Replace Document
              </Button>
            </div>
          )}
        </div>

        {/* Verification Checklist — Below the file per user request */}
        <div className="space-y-4 pt-2">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Verification Check</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <CheckCircle2 size={14} />
              </div>
              <span className="text-[11px] font-bold text-slate-700">Client Metadata Parsed</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center transition-colors shadow-sm",
                (handoverFile || selectedFile) ? "bg-emerald-100 text-emerald-600" : "bg-white text-slate-200 border border-slate-200"
              )}>
                {(handoverFile || selectedFile) ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              </div>
              <span className={cn("text-[11px] font-bold transition-colors", (handoverFile || selectedFile) ? "text-slate-700" : "text-slate-400")}>
                Vault Document Staged
              </span>
            </div>
          </div>
        </div>

        <div className="flex-grow" />

        {/* Launch Gate */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Rocket size={80} />
          </div>

          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Pipeline Gate</h4>

          <div className="space-y-4">
            <div className="space-y-3 mb-4">
              <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Assign Engineers</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedEngineerIds.length === 0 ? (
                  <span className="text-[10px] font-bold text-slate-300 italic px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">No engineers assigned (Pool)</span>
                ) : (
                  selectedEngineerIds.map(id => {
                    const engineer = engineeringTeam.find(e => e.id === id);
                    return (
                      <Badge key={id} className="bg-blue-50 text-blue-600 border border-blue-100 font-black text-[8px] px-2 py-1 flex items-center gap-2">
                        {engineer?.email.split('@')[0]}
                        <button onClick={() => setSelectedEngineerIds(prev => prev.filter(eid => eid !== id))}>
                          <X size={10} />
                        </button>
                      </Badge>
                    );
                  })
                )}
              </div>
              
              <Select onValueChange={(val) => {
                  if (val !== "POOL") {
                    setSelectedEngineerIds(prev => Array.from(new Set([...prev, val])));
                  } else {
                    setSelectedEngineerIds([]);
                  }
              }}>
                <SelectTrigger className="w-full h-10 font-black text-slate-900 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-100 transition-all text-[10px] uppercase">
                  <SelectValue placeholder="Add engineer to team..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="POOL" className="text-[10px] font-black uppercase text-rose-500">Clear All (Assign to pool)</SelectItem>
                  {engineeringTeam.map((member) => (
                    <SelectItem key={member.id} value={member.id} className="text-[10px] font-black uppercase">
                      {member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
              Ready for handover
            </p>
            <Button
              onClick={handleLaunch}
              disabled={(!selectedFile && !handoverFile) || isPending}

              className={cn(
                "w-full rounded-2xl h-16 font-black uppercase tracking-widest text-[11px] transition-all flex flex-col justify-center gap-0.5 shadow-lg",
                (selectedFile || handoverFile)
                  ? "bg-[#1C3384] hover:bg-indigo-900 text-white shadow-indigo-900/10"
                  : "bg-slate-100 text-slate-300 shadow-none"
              )}
            >
              {isPending ? "Launching..." : (
                <>
                  <span>Launch to Solar OS</span>
                  <span className="text-[9px] opacity-70 normal-case font-bold tracking-tight italic">Technical Relay Race</span>
                </>
              )}
            </Button>

          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #CBD5E0;
        }
      `}</style>
    </div>
  );
}


