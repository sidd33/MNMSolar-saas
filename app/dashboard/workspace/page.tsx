"use client";

import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, Building2, MapPin, User, ArrowRight, Zap, ShieldCheck, FileSpreadsheet, CheckCircle2, Phone } from "lucide-react";
import { createProject } from "@/app/actions/project";
import { useTransition, useEffect, useState, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import * as xlsx from "xlsx";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";

export default function WorkspacePage() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const { uploadFiles, isUploading, progress } = useProjectFileUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([]);
  const [handoverFile, setHandoverFile] = useState<File | null>(null);
  const [formState, setFormState] = useState({
    name: "",
    clientName: "",
    address: "",
    dcCapacity: "",
    orderValue: "",
    projectType: "",
    primaryContactName: "",
    primaryContactMobile: ""
  });

  // 🛡️ Client-side security guard (Supplemental to Middleware)
  useEffect(() => {
    if (isLoaded) {
      const role = user?.publicMetadata?.role;
      if (role !== 'OWNER' && role !== 'ADMIN') {
        router.push('/dashboard');
      } else {
        setAuthorized(true);
      }
    }
  }, [isLoaded, user, router]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setHandoverFile(file); // Save file object to send to API

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = xlsx.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        const json: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1 });

        let customerName = "";
        let capacity = "";
        let newAddress = "";
        let orderValue = "";
        let projectType = "";
        let contactName = "";
        let contactMobile = "";

        console.log("----- EXCEL PARSER DEBUG: START -----");

        for (let i = 0; i < Math.min(10, json.length); i++) {
          const row = json[i] || [];
          console.log(`[Row ${i + 1}, Col A]:`, row[0]);
        }

        // 1 & 2. Client Name and Address (Strictly Col A, stop at row 15)
        for (let r = 0; r < Math.min(15, json.length); r++) {
          const row = json[r];
          if (!row || !row.length) continue;

          const colA = row[0] ? String(row[0]).toLowerCase().trim() : "";

          if (colA === "customer name") {
            for (let c = row.length - 1; c >= 1; c--) {
              if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== "") {
                customerName = String(row[c]).trim();
                break;
              }
            }
          }

          if (colA === "address") {
            for (let c = row.length - 1; c >= 1; c--) {
              if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== "") {
                newAddress = String(row[c]).trim();
                break;
              }
            }
          }
        }

        // 3. Scan everything else (Capacity, Order Value, Contact, Type)
        for (let r = 0; r < json.length; r++) {
          const row = json[r];
          if (!row) continue;

          for (let c = 0; c < row.length; c++) {
            const cellVal = row[c] ? String(row[c]).toLowerCase().trim() : "";
            const exactVal = row[c] ? String(row[c]).toUpperCase().trim() : "";

            if (cellVal.includes("capacity") || cellVal.includes("(kw)") || cellVal === "kw") {
              if (r + 1 < json.length) {
                const valueBelow = json[r + 1][c];
                if (valueBelow !== undefined && valueBelow !== null && String(valueBelow).trim() !== "") {
                  capacity = String(valueBelow).replace(/kw/i, "").replace(/[^0-9.]/g, '').trim();
                }
              }
            }

            if (cellVal.includes("order value with tax") || cellVal.includes("order value")) {
              if (r + 1 < json.length) {
                const valueBelow = json[r + 1][c];
                if (valueBelow !== undefined && valueBelow !== null && String(valueBelow).trim() !== "") {
                  orderValue = String(valueBelow).replace(/,/g, '').replace(/[^0-9.]/g, '').trim();
                }
              }
            }

            if (!contactName && cellVal === "contact person") {
              let mobileIndex = -1;
              row.forEach((v, i) => { if (String(v).toLowerCase().trim() === "mobile") mobileIndex = i; });

              if (r + 1 < json.length) {
                const valueBelow = json[r + 1][c];
                if (valueBelow !== undefined && valueBelow !== null && String(valueBelow).trim() !== "") {
                  contactName = String(valueBelow).trim();
                }
                if (mobileIndex !== -1) {
                  const mobileBelow = json[r + 1][mobileIndex];
                  // Extract digits and potentially 'E+' formatting from Excel
                  if (mobileBelow !== undefined && mobileBelow !== null && String(mobileBelow).trim() !== "") {
                    contactMobile = String(mobileBelow).replace(/[^0-9.+E]/g, '').trim();
                  }
                }
              }
            }

            if (exactVal.includes("CAPEX")) projectType = "CAPEX";
            if (exactVal.includes("OPEX")) projectType = "OPEX";
          }
        }

        console.log("----- EXCEL PARSER DEBUG: END -----");

        const newName = customerName ? (capacity ? `${customerName} ${capacity}KW` : customerName) : "";
        let filled: string[] = [];

        if (customerName || newAddress || capacity || orderValue || projectType || contactName) {
          if (newName) filled.push("Project Name");
          if (customerName) filled.push("Client Name");
          if (newAddress) filled.push("Site Address");
          if (capacity) filled.push("Capacity");
          if (orderValue) filled.push("Order Value");
          if (projectType) filled.push("Project Type");
          if (contactName) filled.push("Contact");

          setFormState(prev => ({
            name: newName || prev.name,
            clientName: customerName || prev.clientName,
            address: newAddress || prev.address,
            dcCapacity: capacity || prev.dcCapacity,
            orderValue: orderValue || prev.orderValue,
            projectType: projectType || prev.projectType,
            primaryContactName: contactName || prev.primaryContactName,
            primaryContactMobile: contactMobile || prev.primaryContactMobile,
          }));
          setAutoFilledFields(filled);
          toast.success("Excel data successfully extracted and mapped!");
        } else {
          toast.warning("Excel read successfully, but couldn't auto-match standard rows.");
        }
      } catch (err) {
        toast.error("Error reading Excel file. Ensure it is a valid .xlsx format.");
      }
    };
    reader.readAsBinaryString(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  async function handleCreateProject(formData: FormData) {
    if (isUploading) return;

    // Pass raw data, UT is handled sequentially!
    startTransition(async () => {
      try {
        const newProject = await createProject(formData);

        if (handoverFile && newProject && newProject.id) {
          await uploadFiles(newProject.id, [handoverFile], "HANDOVER_SHEET");
        }

        toast.success("Project created securely!");
        router.push("/dashboard/owner");
      } catch (error: any) {
        toast.error(error.message || "Failed to create project");
      }
    });
  }

  if (!isLoaded || authorized === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 bg-[#1C3384]/10 rounded-full" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Verifying Clearance...</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardShell
      title="PROJECT WORKSPACE"
      subtitle="Intake new projects and initialize the operational pipeline."
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">

          {/* EXCEL AUTO-EXTRACTOR MODULE */}
          <div className="bg-emerald-50 border border-emerald-100/50 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h4 className="flex items-center gap-2 text-sm font-black text-emerald-800 uppercase tracking-widest font-[family-name:var(--font-montserrat)] mb-1">
                <FileSpreadsheet size={18} />
                Smart Excel Extraction
              </h4>
              <p className="text-xs text-emerald-600/80 font-medium">Upload an Handover sheet (.xlsx) to auto-fill the form dynamically.</p>
              {handoverFile && (
                <p className="text-[10px] font-black uppercase text-emerald-700 mt-2 bg-emerald-100 px-2 py-1 rounded w-fit">
                  ✓ Document Appended to Project Vault
                </p>
              )}
            </div>
            <div>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-sm"
              >
                Upload Excel File
              </Button>
            </div>
          </div>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-[#1C3384] text-white p-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 rounded-xl bg-[#FFC800] flex items-center justify-center shadow-lg shadow-yellow-400/20">
                  <Zap size={20} className="text-[#1C3384] fill-[#1C3384]" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
                    Project Intake Form
                  </CardTitle>
                  <CardDescription className="text-white/60 font-medium">
                    Configure initial metadata to launch project into the Sales queue.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              {autoFilledFields.length > 0 && (
                <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in duration-300">
                  <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">Auto-fill Complete</h4>
                    <p className="text-xs text-emerald-600 mt-1">Successfully extracted from document: <strong>{autoFilledFields.join(", ")}</strong></p>
                  </div>
                </div>
              )}
              <form action={handleCreateProject} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                      <Briefcase size={14} className="text-[#FFC800]" /> Project Name
                    </Label>
                    <Input
                      id="name" name="name"
                      value={formState.name} onChange={(e) => setFormState(s => ({ ...s, name: e.target.value }))}
                      placeholder="e.g., Green Valley Commercial 50KW"
                      className="h-12 rounded-xl bg-slate-50 border-slate-100" required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clientName" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                      <User size={14} className="text-[#FFC800]" /> Client Name
                    </Label>
                    <Input
                      id="clientName" name="clientName"
                      value={formState.clientName} onChange={(e) => setFormState(s => ({ ...s, clientName: e.target.value }))}
                      placeholder="e.g., John Doe Enterprises"
                      className="h-12 rounded-xl bg-slate-50 border-slate-100" required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                    <MapPin size={14} className="text-[#FFC800]" /> Site Address
                  </Label>
                  <Input
                    id="address" name="address"
                    value={formState.address} onChange={(e) => setFormState(s => ({ ...s, address: e.target.value }))}
                    placeholder="e.g., 123 Solar Way, Energy District, CA"
                    className="h-12 rounded-xl bg-slate-50 border-slate-100" required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NEW OPTIONAL: Capacity */}
                  <div className="space-y-2">
                    <Label htmlFor="dcCapacity" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                      <Zap size={14} className="text-[#FFC800]" /> Capacity (KW)
                    </Label>
                    <Input
                      id="dcCapacity" name="dcCapacity" type="number"
                      value={formState.dcCapacity} onChange={(e) => setFormState(s => ({ ...s, dcCapacity: e.target.value }))}
                      placeholder="e.g., 55"
                      className="h-12 rounded-xl bg-slate-50 border-slate-100"
                    />
                  </div>
                  {/* NEW OPTIONAL: Order Value */}
                  <div className="space-y-2">
                    <Label htmlFor="orderValue" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                      <Briefcase size={14} className="text-[#FFC800]" /> Order Value (₹)
                    </Label>
                    <Input
                      id="orderValue" name="orderValue" type="number"
                      value={formState.orderValue} onChange={(e) => setFormState(s => ({ ...s, orderValue: e.target.value }))}
                      placeholder="e.g., 2605433"
                      className="h-12 rounded-xl bg-slate-50 border-slate-100"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* NEW OPTIONAL: Primary Contact */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactName" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                      <User size={14} className="text-[#FFC800]" /> Primary Contact
                    </Label>
                    <Input
                      id="primaryContactName" name="primaryContactName"
                      value={formState.primaryContactName} onChange={(e) => setFormState(s => ({ ...s, primaryContactName: e.target.value }))}
                      placeholder="e.g., Chetan Parmar"
                      className="h-12 rounded-xl bg-slate-50 border-slate-100"
                    />
                  </div>
                  {/* NEW OPTIONAL: Contact Mobile */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryContactMobile" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                      <Phone size={14} className="text-[#FFC800]" /> Contact Mobile
                    </Label>
                    <Input
                      id="primaryContactMobile" name="primaryContactMobile"
                      value={formState.primaryContactMobile} onChange={(e) => setFormState(s => ({ ...s, primaryContactMobile: e.target.value }))}
                      placeholder="e.g., 9876543210"
                      className="h-12 rounded-xl bg-slate-50 border-slate-100"
                    />
                  </div>
                </div>

                {/* NEW OPTIONAL: Project Type */}
                <div className="space-y-2">
                  <Label htmlFor="projectType" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                    <ShieldCheck size={14} className="text-[#FFC800]" /> Project Type
                  </Label>
                  <Select key={formState.projectType || 'empty'} name="projectType" defaultValue={formState.projectType || undefined} onValueChange={(val) => setFormState(s => ({ ...s, projectType: val || "" }))}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                      <SelectValue placeholder="Select project type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      <SelectItem value="CAPEX">CAPEX</SelectItem>
                      <SelectItem value="OPEX">OPEX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                    <Building2 size={14} className="text-[#FFC800]" /> Initial Department
                  </Label>
                  <Select name="department" defaultValue="Sales">
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-100">
                      <SelectItem value="Sales">Sales (Lead Management)</SelectItem>
                      <SelectItem value="Engineering">Engineering (Design Phase)</SelectItem>
                      <SelectItem value="Execution">Execution (Site Phase)</SelectItem>
                      <SelectItem value="Accounts">Accounts (Billing/Final)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-slate-400 italic font-medium">Project will be initialized in this department queue automatically.</p>
                </div>

                <input type="hidden" name="liasoningStage" value="NOT_STARTED" />
                <input type="hidden" name="executionStage" value="SURVEY" />

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isPending || isUploading}
                    className="w-full h-14 bg-[#38A169] hover:bg-[#2F855A] text-white rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-green-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-3"
                  >
                    {isUploading ? `Uploading Handover Sheet... ${progress}%` : isPending ? "Configuring Pipeline..." : "Create MNMSOLAR Project"}
                    <ArrowRight size={20} />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-slate-50 p-6">
            <h4 className="text-sm font-black text-[#1C3384] uppercase tracking-widest mb-4 flex items-center gap-2 font-[family-name:var(--font-montserrat)]">
              <ShieldCheck size={18} className="text-[#38A169]" /> Data Isolation Active
            </h4>
            <p className="text-xs text-[#64748B] font-medium leading-relaxed">
              New projects are automatically tagged with the <strong>MNMSOLAR</strong> Organization ID. Access is restricted based on departmental clearance.
            </p>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
