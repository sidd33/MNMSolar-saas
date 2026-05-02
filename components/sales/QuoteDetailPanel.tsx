"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateQuoteDetails, uploadQuoteVersion, getQuoteVersions } from "@/lib/actions/sales";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { FileText, Save, CheckCircle2, DownloadCloud, UploadCloud, Rocket, History, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface QuoteDetailPanelProps {
  quote: any;
  onUpdate: () => void;
  onApproveClick: () => void;
}

export function QuoteDetailPanel({ quote, onUpdate, onApproveClick }: QuoteDetailPanelProps) {
  const { uploadFiles, isUploading, status, progress } = useProjectFileUpload();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    quotedValue: quote.quotedValue?.toString() || "",
    capacityKw: quote.capacityKw?.toString() || "",
    paymentTermsAdvance: quote.paymentTermsAdvance?.toString() || "",
    paymentTermsMaterial: quote.paymentTermsMaterial?.toString() || "",
    paymentTermsFinal: quote.paymentTermsFinal?.toString() || "",
    scopeOfWork: quote.scopeOfWork || "",
    notes: quote.notes || ""
  });
  
  const [versionNote, setVersionNote] = useState("");
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(true);

  const fetchVersions = async () => {
    try {
      const data = await getQuoteVersions(quote.id);
      setVersions(data);
    } catch (error) {
      console.error("Failed to fetch versions:", error);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [quote.id]);

  const isEditable = quote.status === "DRAFT" || quote.status === "NEGOTIATING";

  const advance = Number(formData.paymentTermsAdvance) || 0;
  const material = Number(formData.paymentTermsMaterial) || 0;
  const final = Number(formData.paymentTermsFinal) || 0;

  const paymentSum = advance + material + final;
  const paymentTermsProvided = formData.paymentTermsAdvance !== "" && formData.paymentTermsMaterial !== "" && formData.paymentTermsFinal !== "";
  const isPaymentValid = !paymentTermsProvided || paymentSum === 100;

  const handleSave = async () => {
    if (!isPaymentValid) {
      toast.error("Payment terms must add up to 100%");
      return;
    }

    setIsSaving(true);
    try {
      await updateQuoteDetails(quote.id, {
        quotedValue: formData.quotedValue ? Number(formData.quotedValue) : undefined,
        capacityKw: formData.capacityKw ? Number(formData.capacityKw) : undefined,
        paymentTermsAdvance: formData.paymentTermsAdvance ? Number(formData.paymentTermsAdvance) : undefined,
        paymentTermsMaterial: formData.paymentTermsMaterial ? Number(formData.paymentTermsMaterial) : undefined,
        paymentTermsFinal: formData.paymentTermsFinal ? Number(formData.paymentTermsFinal) : undefined,
        scopeOfWork: formData.scopeOfWork,
        notes: formData.notes
      });
      toast.success("Quote details saved.");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message || "Failed to save details");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-full overflow-x-hidden grid grid-cols-1 lg:grid-cols-10 gap-0 p-0 rounded-b-[2rem] bg-white border-t border-slate-100 shadow-inner">
      {/* SECTION A — Quote Details (Left 70%) */}
      <div className="lg:col-span-7 p-8 space-y-8 bg-white min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center text-[#1C3384] shadow-sm">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">Commercial Details</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Define the terms of the agreement</p>
            </div>
          </div>
          {isEditable && (
            <div className={cn(
              "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full",
              paymentTermsProvided ? (isPaymentValid ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600") : "bg-slate-50 text-slate-400"
            )}>
              Validation: {paymentSum}%
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quoted Value (₹)</Label>
            {isEditable ? (
              <Input
                type="number"
                placeholder="Enter total value"
                value={formData.quotedValue}
                onChange={(e) => setFormData({ ...formData, quotedValue: e.target.value })}
                className="w-full h-12 font-black text-slate-900 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            ) : (
              <div className="w-full h-12 flex items-center px-4 rounded-xl bg-slate-50 font-black text-[#1C3384]">
                {formData.quotedValue ? `₹${Number(formData.quotedValue).toLocaleString()}` : "—"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Capacity (kWp)</Label>
            {isEditable ? (
              <Input
                type="number"
                placeholder="Enter capacity"
                value={formData.capacityKw}
                onChange={(e) => setFormData({ ...formData, capacityKw: e.target.value })}
                className="w-full h-12 font-black text-slate-900 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-100 transition-all"
              />
            ) : (
              <div className="w-full h-12 flex items-center px-4 rounded-xl bg-slate-50 font-black text-[#1C3384]">
                {formData.capacityKw ? `${formData.capacityKw} kWp` : "—"}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 p-6 bg-slate-50/50 rounded-2xl border border-slate-100">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            Payment Terms Breakdown
            {!isPaymentValid && <span className="text-rose-500 lowercase normal-case font-bold">(Error: sum must be 100%)</span>}
          </Label>
          <div className="flex flex-row gap-4 w-full">
            <div className="flex-1">
              {isEditable ? (
                <Input type="number" placeholder="Advance %" value={formData.paymentTermsAdvance} onChange={(e) => setFormData({ ...formData, paymentTermsAdvance: e.target.value })} className="w-full h-12 rounded-xl bg-white border-slate-200 font-bold" />
              ) : (
                <div className="w-full h-12 flex items-center px-4 bg-white border border-slate-100 rounded-xl font-bold">{formData.paymentTermsAdvance || "0"}% Advance</div>
              )}
            </div>
            <div className="flex-1">
              {isEditable ? (
                <Input type="number" placeholder="Material %" value={formData.paymentTermsMaterial} onChange={(e) => setFormData({ ...formData, paymentTermsMaterial: e.target.value })} className="w-full h-12 rounded-xl bg-white border-slate-200 font-bold" />
              ) : (
                <div className="w-full h-12 flex items-center px-4 bg-white border border-slate-100 rounded-xl font-bold">{formData.paymentTermsMaterial || "0"}% Material</div>
              )}
            </div>
            <div className="flex-1">
              {isEditable ? (
                <Input type="number" placeholder="Final %" value={formData.paymentTermsFinal} onChange={(e) => setFormData({ ...formData, paymentTermsFinal: e.target.value })} className="w-full h-12 rounded-xl bg-white border-slate-200 font-bold" />
              ) : (
                <div className="w-full h-12 flex items-center px-4 bg-white border border-slate-100 rounded-xl font-bold">{formData.paymentTermsFinal || "0"}% Final</div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2 min-w-0">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Scope of Work</Label>
            {isEditable ? (
              <Textarea
                placeholder="Describe what is included..."
                value={formData.scopeOfWork}
                onChange={(e) => setFormData({ ...formData, scopeOfWork: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-2xl min-h-[120px] font-medium text-slate-700 p-4 focus:ring-2 focus:ring-indigo-100"
              />
            ) : (
              <div className="w-full p-4 rounded-2xl bg-slate-50 font-medium text-slate-700 whitespace-pre-wrap min-h-[120px] break-words text-sm leading-relaxed">
                {formData.scopeOfWork || "No scope defined."}
              </div>
            )}
          </div>
          <div className="space-y-2 min-w-0">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Negotiation Notes</Label>
            {isEditable ? (
              <Textarea
                placeholder="Client feedback, negotiation notes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-50 border-none rounded-2xl min-h-[120px] font-medium text-slate-700 p-4 focus:ring-2 focus:ring-indigo-100"
              />
            ) : (
              <div className="w-full p-4 rounded-2xl bg-slate-50 font-medium text-slate-700 whitespace-pre-wrap min-h-[120px] break-words text-sm leading-relaxed">
                {formData.notes || "No additional notes."}
              </div>
            )}
          </div>
        </div>

        {isEditable && (
          <div className="pt-4">
            <Button
              onClick={handleSave}
              disabled={!isPaymentValid || isSaving}
              className="w-full md:w-auto min-w-[200px] bg-[#1C3384] hover:bg-indigo-900 text-white rounded-xl h-14 font-black uppercase tracking-[0.1em] gap-3 shadow-xl shadow-indigo-900/10 active:scale-95 transition-all"
            >
              {isSaving ? "Syncing..." : <><Save size={20} /> Update Quote Terms</>}
            </Button>
          </div>
        )}
      </div>

      {/* SECTION B & C — Sidebar (Right 30%) */}
      <div className="lg:col-span-3 bg-slate-50 p-8 flex flex-col gap-8 border-l border-slate-100 min-w-0">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <DownloadCloud size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 truncate">Proposal Vault</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter truncate">Document version control</p>
            </div>
          </div>

          {/* Section B — Version History & Upload */}
          <div className="space-y-6">
            {isEditable && (
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {versions.length > 0 ? `Revision Note (v${versions.length + 1})` : "Initial Quote Note"}
                  </Label>
                  <Input 
                    placeholder="e.g. Revised price, added EMI..."
                    value={versionNote}
                    onChange={(e) => setVersionNote(e.target.value)}
                    className="h-10 bg-slate-50 border-none rounded-xl text-xs font-medium"
                  />
                </div>

                {isUploading ? (
                  <div className="flex flex-col items-center justify-center gap-3 py-4">
                    <Loader2 className="animate-spin text-[#1C3384]" size={24} />
                    <div className="w-full space-y-1">
                      <p className="text-[9px] font-black text-[#1C3384] text-center uppercase tracking-widest">{status || "Uploading..."}</p>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-[#1C3384] h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Button className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-emerald-900/10 active:scale-95 transition-all">
                      <UploadCloud size={16} />
                      {versions.length > 0 ? `Upload Revised Quote (v${versions.length + 1})` : "Upload Quote PDF"}
                    </Button>
                    <input
                      type="file"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      accept="application/pdf"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            const projectId = quote.lead?.projects?.[0]?.id;
                            if (!projectId) {
                              toast.error("Associated preliminary project not found.");
                              return;
                            }

                            await uploadFiles(projectId, [e.target.files[0]], "COMMERCIAL", null, async (savedFiles) => {
                              if (savedFiles && savedFiles[0]) {
                                await uploadQuoteVersion(
                                  quote.id, 
                                  savedFiles[0].fileUrl!, 
                                  savedFiles[0].utFileKey!, 
                                  savedFiles[0].name,
                                  formData.quotedValue ? Number(formData.quotedValue) : undefined,
                                  versionNote
                                );
                                toast.success("New quote version uploaded.");
                                setVersionNote("");
                                fetchVersions();
                                onUpdate();
                              }
                            }, "SITE_SURVEY");
                          } catch (err: any) {
                            toast.error(err.message || "Failed to upload document.");
                          }
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <History size={12} />
                  Version History
                </Label>
                {versions.length > 0 && (
                  <Badge className="bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black">{versions.length} Total</Badge>
                )}
              </div>

              {isLoadingVersions ? (
                <div className="py-8 flex justify-center">
                  <Loader2 className="animate-spin text-slate-300" size={24} />
                </div>
              ) : versions.length === 0 ? (
                <div className="bg-white/50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">No versions uploaded yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                  {versions.map((v, index) => (
                    <div key={v.id} className={cn(
                      "bg-white p-4 rounded-2xl border transition-all group/v",
                      index === 0 ? "border-[#1C3384]/20 shadow-md shadow-blue-900/5 ring-1 ring-[#1C3384]/5" : "border-slate-100 opacity-70 hover:opacity-100"
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#1C3384] uppercase">v{v.versionNumber}</span>
                          {index === 0 ? (
                            <Badge className="bg-emerald-50 text-emerald-600 rounded-lg text-[8px] font-black px-1.5 h-4 uppercase">Active</Badge>
                          ) : (
                            <Badge className="bg-slate-50 text-slate-400 rounded-lg text-[8px] font-black px-1.5 h-4 uppercase border-none">Superseded</Badge>
                          )}
                        </div>
                        <a 
                          href={v.fileUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-slate-400 hover:text-[#1C3384] transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                      
                      {v.quotedValue && (
                        <p className="text-xs font-black text-slate-900 mb-1">₹{v.quotedValue.toLocaleString()}</p>
                      )}
                      
                      {v.note && (
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed italic mb-2 line-clamp-2">
                          "{v.note}"
                        </p>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{v.uploadedBy.email.split('@')[0]}</span>
                        <span className="text-[9px] font-bold text-slate-300">{format(new Date(v.createdAt), 'MMM dd, yy')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-grow" />

        {/* Section C — Action Gate */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Rocket size={80} />
          </div>

          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Pipeline Handover</h4>

          {quote.status === "DRAFT" && (
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                Awaiting initial quote document.
              </p>
              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-slate-300 w-1/4 rounded-full" />
              </div>
            </div>
          )}

          {quote.status === "NEGOTIATING" && (
            <div className="space-y-4">
              <p className="text-xs font-bold text-slate-600 leading-relaxed">
                Move to engineering pipeline.
              </p>
              <Button
                onClick={onApproveClick}
                className="w-full bg-[#1C3384] hover:bg-indigo-900 text-white rounded-2xl h-16 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-900/20 active:scale-95 transition-all flex flex-col justify-center gap-0.5"
              >
                <span>Start Handover</span>
                <span className="text-[9px] opacity-70 normal-case font-bold tracking-tight italic">Technical Gate</span>
              </Button>
            </div>
          )}

          {quote.status === "CONVERTED" && (
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-[#1C3384]">
                <CheckCircle2 size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-widest text-[#1C3384] truncate">
                  Successfully Launched
                </p>
                <p className="text-[10px] font-bold text-slate-400 mt-1 leading-relaxed">
                  Project has entered the engineering queue.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
