"use client";

import { useState } from "react";
import { 
  Zap, 
  User, 
  MapPin, 
  TrendingUp, 
  Eye, 
  Clock, 
  Search, 
  Filter 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Project360Modal } from "@/components/dashboard/Project360Modal";
import { format } from "date-fns";

export function ProjectsClient({ projects }: { projects: any[] }) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (id: string) => {
    setSelectedProjectId(id);
    setModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search projects by name..." 
            className="pl-12 h-12 bg-slate-50/50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-emerald-500/20 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Badge className="bg-[#1C3384] text-white h-12 px-6 rounded-2xl flex items-center justify-center font-black text-xs min-w-[120px]">
            {filteredProjects.length} COMMISSIONED
          </Badge>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-slate-50">
              <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16 px-8">Project Nexus</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Stakeholder</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Metrics</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Operational Stage</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16 px-8">Audit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                    <Zap size={48} className="text-slate-300" />
                    <p className="font-bold uppercase tracking-widest text-xs">No converted projects found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProjects.map((project: any) => (
                <TableRow key={project.id} className="hover:bg-slate-50/40 border-slate-50/50 transition-colors group h-24">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-[1rem] bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xl shadow-inner group-hover:bg-[#1C3384] group-hover:text-white transition-all duration-300">
                        <Zap size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-black text-slate-900 leading-tight uppercase tracking-tight group-hover:text-[#1C3384] transition-colors line-clamp-1">{project.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={10} />
                            {format(new Date(project.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 group/user cursor-default">
                        <User size={12} className="text-slate-300" />
                        <p className="text-xs font-bold text-slate-600 group-hover/user:text-slate-900 transition-colors">{project.clientName || "Unknown"}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin size={10} className="text-slate-200" />
                        <p className="text-[10px] font-medium text-slate-400 truncate max-w-[120px]">{project.address || "N/A"}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-[#1C3384]">{project.dcCapacity || "50 KWp"}</span>
                        </div>
                        {project.orderValue && (
                          <div className="flex items-center gap-1.5">
                              <TrendingUp size={10} className="text-emerald-500" />
                              <span className="text-[10px] font-black text-slate-500">₹{Number(project.orderValue).toLocaleString()}</span>
                          </div>
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className="rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none bg-[#1C3384]/5 text-[#1C3384] shadow-none">
                        {project.stage.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <Button 
                      onClick={() => handleOpenModal(project.id)}
                      variant="outline" 
                      className="rounded-2xl h-12 w-12 p-0 border-slate-100 hover:border-[#1C3384] hover:bg-slate-50 shadow-sm transition-all"
                    >
                      <Eye size={18} className="text-slate-400 group-hover:text-[#1C3384]" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedProjectId && (
        <Project360Modal 
          projectId={selectedProjectId}
          open={modalOpen}
          onOpenChange={setModalOpen}
        />
      )}
    </div>
  );
}
