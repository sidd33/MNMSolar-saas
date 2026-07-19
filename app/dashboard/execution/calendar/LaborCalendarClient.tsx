"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths, isSameDay } from "date-fns";
import { getLaborLogs, upsertLaborLog } from "@/lib/actions/execution";
import { ChevronLeft, ChevronRight, HardHat, Calendar as CalendarIcon, Info, Loader2, X, Plus, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface LaborLog {
    id: string;
    projectId: string;
    date: Date;
    laborCount: number;
    notes: string | null;
}

export default function LaborCalendarClient({ projects }: { projects: any[] }) {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects.length > 0 ? projects[0].id : null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [logs, setLogs] = useState<LaborLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [editLaborCount, setEditLaborCount] = useState<string>("");
    const [editNotes, setEditNotes] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);

    const selectedProject = projects.find(p => p.id === selectedProjectId);

    useEffect(() => {
        if (!selectedProjectId) return;

        const fetchLogs = async () => {
            setIsLoading(true);
            try {
                const monthStart = startOfMonth(currentMonth);
                const monthEnd = endOfMonth(currentMonth);
                const data = await getLaborLogs(selectedProjectId, monthStart, monthEnd);
                setLogs(data as LaborLog[]);
            } catch (error) {
                console.error("Failed to fetch labor logs:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [selectedProjectId, currentMonth]);

    const handlePreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const openModal = (date: Date) => {
        setSelectedDate(date);
        const existingLog = logs.find(log => isSameDay(new Date(log.date), date));
        setEditLaborCount(existingLog ? existingLog.laborCount.toString() : "");
        setEditNotes(existingLog?.notes || "");
        setIsModalOpen(true);
    };

    const handleSaveLog = async () => {
        if (!selectedProjectId || !selectedDate) return;
        
        setIsSaving(true);
        try {
            const count = parseInt(editLaborCount) || 0;
            const updatedLog = await upsertLaborLog(selectedProjectId, selectedDate, count, editNotes);
            
            // Update local state
            setLogs(prev => {
                const filtered = prev.filter(l => !isSameDay(new Date(l.date), selectedDate));
                return [...filtered, updatedLog as LaborLog];
            });
            setIsModalOpen(false);
        } catch (error) {
            console.error("Failed to save labor log:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const getDaysArray = () => {
        const startDate = startOfWeek(startOfMonth(currentMonth));
        const endDate = endOfWeek(endOfMonth(currentMonth));
        return eachDayOfInterval({ start: startDate, end: endDate });
    };

    const days = getDaysArray();
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Sidebar: Project Selection */}
            <div className="w-full lg:w-80 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden shrink-0">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                        <CalendarIcon size={16} className="text-blue-500" />
                        Select Project
                    </h2>
                </div>
                <div className="p-4 max-h-[600px] overflow-y-auto space-y-2">
                    {projects.length === 0 ? (
                        <div className="text-center py-8 opacity-40">
                            <p className="font-bold uppercase tracking-widest text-[10px]">No active projects</p>
                        </div>
                    ) : (
                        projects.map(project => (
                            <button
                                key={project.id}
                                onClick={() => setSelectedProjectId(project.id)}
                                className={cn(
                                    "w-full text-left p-4 rounded-2xl border transition-all duration-200 group flex items-start gap-3",
                                    selectedProjectId === project.id 
                                        ? "border-blue-200 bg-blue-50/50 shadow-sm" 
                                        : "border-transparent hover:border-slate-100 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0 mt-1 transition-colors",
                                    selectedProjectId === project.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-slate-200"
                                )}>
                                    <HardHat size={14} />
                                </div>
                                <div>
                                    <h4 className={cn(
                                        "font-bold text-sm",
                                        selectedProjectId === project.id ? "text-blue-900" : "text-slate-700"
                                    )}>{project.name}</h4>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1 font-bold">
                                        {project.stage.replace(/_/g, ' ')}
                                    </p>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Side: Calendar View */}
            <div className="flex-1 w-full bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[600px] flex flex-col relative">
                {isLoading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-500" size={32} />
                    </div>
                )}
                
                {/* Calendar Header */}
                <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        {selectedProject && (
                            <p className="text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                                <HardHat size={14} className="text-emerald-500" />
                                {selectedProject.name}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={handlePreviousMonth}
                            className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button 
                            onClick={handleNextMonth}
                            className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition-colors"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid */}
                {!selectedProject ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40">
                        <CalendarIcon size={64} className="mb-4 text-slate-300" />
                        <p className="font-bold uppercase tracking-widest text-xs">Select a project to view calendar</p>
                    </div>
                ) : (
                    <div className="flex-1 p-6 md:p-8 flex flex-col">
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {weekDays.map(day => (
                                <div key={day} className="text-center font-bold text-[10px] uppercase tracking-widest text-slate-400">
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2 flex-1">
                            {days.map((day, idx) => {
                                const isCurrentMonth = isSameMonth(day, currentMonth);
                                const isTodayDate = isToday(day);
                                const dayLog = logs.find(l => isSameDay(new Date(l.date), day));
                                const hasLaborers = dayLog && dayLog.laborCount > 0;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => openModal(day)}
                                        className={cn(
                                            "min-h-[100px] p-3 rounded-2xl border transition-all relative flex flex-col items-start hover:-translate-y-0.5 hover:shadow-md",
                                            !isCurrentMonth ? "opacity-30 bg-slate-50/50" : "bg-white",
                                            isTodayDate ? "border-blue-200 ring-2 ring-blue-100" : "border-slate-100 hover:border-slate-300",
                                            hasLaborers && isCurrentMonth ? "border-emerald-200 bg-emerald-50/30" : ""
                                        )}
                                    >
                                        <span className={cn(
                                            "text-sm font-black mb-2",
                                            isTodayDate ? "text-blue-600" : "text-slate-700"
                                        )}>
                                            {format(day, 'd')}
                                        </span>

                                        {hasLaborers && (
                                            <div className="mt-auto w-full">
                                                <div className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2 py-1 rounded-lg w-full flex items-center justify-center gap-1.5 shadow-sm">
                                                    <HardHat size={12} />
                                                    {dayLog.laborCount}
                                                </div>
                                                {dayLog.notes && (
                                                    <div className="mt-1 flex justify-center">
                                                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" title="Has notes" />
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {!hasLaborers && isCurrentMonth && (
                                            <div className="mt-auto w-full opacity-0 hover:opacity-100 transition-opacity">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center flex items-center justify-center gap-1">
                                                    <Plus size={10} /> Add
                                                </div>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#1C3384] text-white shrink-0">
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-tight font-[family-name:var(--font-montserrat)]">Log Labor</h3>
                                <p className="text-blue-200/80 font-medium text-xs mt-1">
                                    {format(selectedDate, 'EEEE, MMMM do, yyyy')}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <X size={16} />
                            </button>
                        </div>
                        <div className="p-6 space-y-6 overflow-y-auto scrollbar-none">
                            {(() => {
                                let existingDPRs: any[] = [];
                                const rawDpr = selectedProject?.executionMetadata?.dpr;
                                if (Array.isArray(rawDpr)) {
                                    existingDPRs = rawDpr;
                                } else if (rawDpr?.records && Array.isArray(rawDpr.records)) {
                                    existingDPRs = rawDpr.records;
                                } else if (rawDpr && typeof rawDpr === 'object') {
                                    existingDPRs = Object.values(rawDpr).filter((v: any) => v && v.id && v.date);
                                }

                                const activeDpr = existingDPRs.find(d => {
                                    if (!selectedDate || !d.date) return false;
                                    return isSameDay(new Date(d.date), selectedDate);
                                });

                                return activeDpr ? (
                                    <div className="space-y-3 pb-2">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-2 flex items-center gap-2">
                                            <CalendarIcon size={12} /> Activity Log Found
                                        </h4>
                                        {activeDpr.tasksCompleted && (
                                            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">Completed</span>
                                                <p className="text-xs text-slate-700 font-medium">{activeDpr.tasksCompleted}</p>
                                            </div>
                                        )}
                                        {activeDpr.blockers && (
                                            <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
                                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">Blockers</span>
                                                <p className="text-xs text-slate-700 font-medium">{activeDpr.blockers}</p>
                                            </div>
                                        )}
                                        {activeDpr.nextPlan && (
                                            <div className="bg-[#1C3384]/5 p-3 rounded-xl border border-[#1C3384]/10">
                                                <span className="text-[9px] font-black text-[#1C3384] uppercase tracking-widest block mb-0.5">Next Plan</span>
                                                <p className="text-xs text-slate-700 font-medium">{activeDpr.nextPlan}</p>
                                            </div>
                                        )}
                                        {activeDpr.attachedFiles && activeDpr.attachedFiles.length > 0 && (
                                            <div className="bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-0.5">Evidence</span>
                                                <p className="text-xs text-slate-700 font-bold">{activeDpr.attachedFiles.length} Photos Attached</p>
                                            </div>
                                        )}
                                        <div className="h-px w-full bg-slate-100 my-4" />
                                    </div>
                                ) : null;
                            })()}
                            
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Number of Laborers</label>
                                <div className="relative">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                        <HardHat size={18} />
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        value={editLaborCount}
                                        onChange={e => setEditLaborCount(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-bold text-slate-900 text-lg outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-slate-500">Work Notes (Optional)</label>
                                <textarea
                                    value={editNotes}
                                    onChange={e => setEditNotes(e.target.value)}
                                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700 text-sm outline-none resize-none h-24"
                                    placeholder="Briefly describe the work done today..."
                                />
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end shrink-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors text-sm uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLog}
                                disabled={isSaving}
                                className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#1C3384] hover:bg-blue-900 transition-colors text-sm uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-900/20"
                            >
                                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Log
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
