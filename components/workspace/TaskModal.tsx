"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Maximize2, MessageSquare, Paperclip, Clock, Shield, Calendar, Info, Send } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateProjectDepartment } from "@/app/actions/project";

export default function TaskModal({ task }: { task: any }) {

  return (
    <Dialog>
      <DialogTrigger className="hidden sm:inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-bold uppercase tracking-wider ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-primary/10 hover:text-primary h-8 px-4 border border-border group">
         <Maximize2 className="h-3 w-3 mr-2 group-hover:scale-110 transition-transform" /> Details
      </DialogTrigger>
      
      {/* Mobile support for clicking row */}
      <DialogTrigger>
         <span className="sm:hidden absolute inset-0 block w-full h-full cursor-pointer z-10" />
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[800px] h-[90vh] sm:h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        {/* Modern Header */}
        <div className="bg-sidebar p-8 text-sidebar-foreground shrink-0 relative">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Shield size={120} />
           </div>
           
           <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-center gap-3">
                 <Badge className="bg-accent text-accent-foreground font-bold px-3 py-1 uppercase tracking-tighter text-[10px] shadow-lg shadow-accent/20">
                    {task.status}
                 </Badge>
                 <Badge variant="outline" className="border-sidebar-border text-sidebar-foreground px-3 py-1 uppercase tracking-tighter text-[10px]">
                    {task.priority} Priority
                 </Badge>
              </div>
              
              <div className="space-y-2">
                 <DialogTitle className="text-3xl font-extrabold tracking-tight">{task.title}</DialogTitle>
                 <DialogDescription className="text-sidebar-foreground/60 flex items-center gap-4 text-sm font-medium">
                    <span className="flex items-center gap-1.5 bg-sidebar-accent px-3 py-1 rounded-full border border-sidebar-border">
                       <Calendar className="h-3.5 w-3.5" />
                       {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}
                    </span>
                    <span className="flex items-center gap-1.5">
                       <Info className="h-3.5 w-3.5" />
                       Created {new Date(task.createdAt).toLocaleDateString()}
                    </span>
                 </DialogDescription>
              </div>

              {/* Department Highlight Card & Manual Selection */}
              <div className="mt-2 bg-sidebar-primary/10 border border-sidebar-primary/20 rounded-xl p-4 flex flex-col gap-4 shadow-inner">
                 <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                       <span className="text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/50">Current Ownership</span>
                       <span className="text-lg font-bold text-accent">{task.project?.currentDepartment || task.department || "Sales"} Department</span>
                    </div>
                    <div className="h-10 w-10 bg-accent/20 rounded-lg flex items-center justify-center text-accent">
                       <Shield className="h-5 w-5" />
                    </div>
                 </div>

                 <div className="flex items-center gap-3 pt-2 border-t border-sidebar-border/20">
                    <form action={updateProjectDepartment} className="flex-1 flex items-center gap-3">
                       <input type="hidden" name="projectId" value={task.project?.id || task.projectId || ""} />
                       <div className="flex-1">
                          <Select 
                            name="department" 
                            defaultValue={task.project?.currentDepartment || task.department || "Sales"}
                          >
                             <SelectTrigger className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground text-xs h-9">
                                <SelectValue placeholder="Manual Dept Selection" />
                             </SelectTrigger>
                             <SelectContent>
                                <SelectItem value="Sales">Sales</SelectItem>
                                <SelectItem value="Engineering">Engineering</SelectItem>
                                <SelectItem value="Execution">Execution</SelectItem>
                                <SelectItem value="Accounts">Accounts</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       <Button type="submit" variant="action" size="sm" className="font-bold h-9">
                          Update Queue
                       </Button>
                    </form>
                 </div>
              </div>
           </div>
        </div>

        {/* Multi-Section Content */}
        <div className="flex-1 flex overflow-hidden">
           {/* Sidebar for Metadata */}
           <div className="w-64 border-r bg-muted/20 p-6 hidden lg:flex flex-col gap-8 shrink-0">
              <div className="space-y-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Assigned To</h4>
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-xs uppercase">
                       {task.assignee?.email?.[0] || "U"}
                    </div>
                    <div>
                       <p className="text-sm font-bold truncate">{task.assignee?.email?.split('@')[0] || "Unassigned"}</p>
                       <p className="text-[10px] text-muted-foreground truncate">{task.assignee?.email || "No assignee"}</p>
                    </div>
                 </div>
              </div>

              <div className="space-y-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Project Context</h4>
                 <div className="bg-background rounded-lg p-3 border border-border/50 shadow-sm">
                    <p className="text-xs font-bold text-primary mb-1 uppercase tracking-tighter">MNM Solar Pipeline</p>
                    <p className="text-sm font-medium leading-tight">{task.project?.name || "Corporate Internal"}</p>
                 </div>
              </div>

              <div className="mt-auto space-y-4">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action Timeline</h4>
                 <div className="space-y-3">
                    <div className="flex gap-3 relative">
                       <div className="h-full absolute left-1.5 top-0 w-0.5 bg-border -z-10" />
                       <div className="h-3 w-3 rounded-full bg-emerald-500 border-2 border-background ring-2 ring-emerald-500/20" />
                       <p className="text-[10px] font-medium text-muted-foreground">Initialized Pipeline Stage</p>
                    </div>
                    <div className="flex gap-3">
                       <div className="h-3 w-3 rounded-full bg-border border-2 border-background" />
                       <p className="text-[10px] font-medium text-muted-foreground">Awaiting Forward Action</p>
                    </div>
                 </div>
              </div>
           </div>

           {/* Tabs for Interactions */}
           <Tabs defaultValue="comments" className="flex-1 flex flex-col bg-background relative z-10">
              <div className="px-6 border-b shrink-0 bg-background/80 sticky top-0">
                 <TabsList className="bg-transparent border-none gap-8 h-12">
                    <TabsTrigger value="comments" className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none px-0 shadow-none text-xs font-bold uppercase tracking-wider transition-all">
                      <MessageSquare className="h-3.5 w-3.5 mr-2" /> Discussion
                    </TabsTrigger>
                    <TabsTrigger value="attachments" className="data-[state=active]:border-b-2 data-[state=active]:border-accent data-[state=active]:text-accent rounded-none px-0 shadow-none text-xs font-bold uppercase tracking-wider transition-all">
                      <Paperclip className="h-3.5 w-3.5 mr-2" /> Assets
                    </TabsTrigger>
                 </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                 <TabsContent value="comments" className="m-0 h-full flex flex-col gap-6">
                    {/* Activity Feed */}
                    <div className="flex-1 space-y-6">
                       <div className="flex items-center justify-center text-muted-foreground text-xs font-bold uppercase tracking-widest border-2 border-dashed rounded-xl py-20 px-4 text-center bg-muted/10 opacity-60">
                          <div>
                             <MessageSquare className="h-8 w-8 mx-auto mb-4 opacity-20" />
                             No active discussion for this task.
                          </div>
                       </div>
                    </div>

                    {/* Premium Comment Input */}
                    <div className="mt-6 shrink-0 pt-6 border-t relative">
                       <div className="flex flex-col gap-4">
                          <div className="relative group">
                             <Textarea 
                               placeholder="Provide an update or ask a question..." 
                               className="min-h-[120px] resize-none border-none shadow-inner bg-muted/20 focus-visible:ring-offset-0 focus-visible:ring-1 focus-visible:ring-accent rounded-xl p-4 text-sm" 
                             />
                             <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold px-6 rounded-xl shadow-lg shadow-accent/20">
                                   Post Update <Send className="h-3.5 w-3.5 ml-2" />
                                </Button>
                             </div>
                          </div>
                       </div>
                    </div>
                 </TabsContent>

                 <TabsContent value="attachments" className="m-0 h-full">
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center bg-muted/10 rounded-2xl border-2 border-dashed p-12 transition-all hover:bg-muted/20 hover:border-accent group">
                       <div className="h-16 w-16 bg-background rounded-full flex items-center justify-center text-muted-foreground/50 mb-6 shadow-sm group-hover:scale-110 group-hover:text-accent transition-all duration-300">
                          <Paperclip className="h-8 w-8" />
                       </div>
                       <p className="font-bold text-foreground mb-1 text-lg">Secure Asset Vault</p>
                       <p className="text-sm max-w-[280px]">Upload engineering diagrams, photos, or site survey documents.</p>
                       <Button variant="outline" className="mt-8 border-accent text-accent hover:bg-accent/10 font-bold px-8 rounded-xl transition-all">Select Local Files</Button>
                    </div>
                 </TabsContent>
              </div>
           </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

