"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
    MessageSquare, 
    AtSign, 
    ArrowRight, 
    Send, 
    Clock, 
    User as UserIcon,
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    X
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { 
    getProjectComments, 
    addProjectComment, 
    getEngineeringTeamMembers 
} from "@/lib/actions/engineering";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AnimatePresence, motion } from "framer-motion";

interface ProjectCommentBoxProps {
  projectId: string;
  currentUserId: string;
  project?: any; // Optional project data for assignment info
}

export function ProjectCommentBox({ projectId, currentUserId, project }: ProjectCommentBoxProps) {
  const [comments, setComments] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [mentionedUserIds, setMentionedUserIds] = useState<string[]>([]);
  const [isHandoff, setIsHandoff] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
  const [showConfirmHandoff, setShowConfirmHandoff] = useState(false);
  
  // Mention State
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const fetchData = async () => {
    try {
      const [commentsData, teamData] = await Promise.all([
        getProjectComments(projectId),
        getEngineeringTeamMembers()
      ]);
      setComments(commentsData);
      setTeamMembers(teamData);
    } catch (err) {
      console.error("Failed to fetch comment box data", err);
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const pos = el.selectionStart;
    const val = el.value;
    
    // Check for @ trigger
    const textBeforeCursor = val.substring(0, pos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");
    
    if (lastAtIndex !== -1) {
        const query = textBeforeCursor.substring(lastAtIndex + 1);
        // Only trigger if @ is at start or after a space
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

    // Detect @ deletion: if no @ in text, close dropdown
    if (!val.includes("@")) {
        setShowMentionDropdown(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showMentionDropdown) {
        const filtered = teamMembers.filter(m => 
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
    const before = content.substring(0, cursorPosition);
    const after = content.substring(textareaRef.current?.selectionStart || 0);
    const newContent = `${before}@${member.email} ${after}`;
    
    setContent(newContent);
    setMentionedUserIds(prev => Array.from(new Set([...prev, member.id])));
    setShowMentionDropdown(false);
    setMentionQuery("");
    
    // Set focus back and move cursor
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

  const handlePost = async () => {
    if (!content.trim()) return;

    if (isHandoff && mentionedUserIds.length === 1) {
      setShowConfirmHandoff(true);
      return;
    }

    executePost();
  };

  const executePost = async () => {
    setIsLoading(true);
    try {
      const handoffToUserId = (isHandoff && mentionedUserIds.length === 1) ? mentionedUserIds[0] : undefined;
      await addProjectComment(projectId, content, mentionedUserIds, isHandoff, handoffToUserId);
      
      if (isHandoff) {
        const targetEmail = teamMembers.find(m => m.id === handoffToUserId)?.email;
        toast.success(`Project handed off to ${targetEmail}`);
      } else {
        toast.success("Note posted");
      }
      
      setContent("");
      setMentionedUserIds([]);
      setIsHandoff(false);
      setShowConfirmHandoff(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to post comment");
    } finally {
      setIsLoading(true); // Wait for revalidation
      setTimeout(() => setIsLoading(false), 1000);
    }
  };

  const filteredMembers = teamMembers.filter(m => 
    m.email.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const displayedComments = isHistoryExpanded ? comments : comments.slice(-10);
  
  // Mentioned users chips
  const mentionedUsers = teamMembers.filter(m => mentionedUserIds.includes(m.id));
  const handoffTarget = mentionedUserIds.length === 1 ? mentionedUsers[0] : null;

  // Reset handoff if mentions change
  useEffect(() => {
    if (mentionedUserIds.length !== 1) {
        setIsHandoff(false);
    }
  }, [mentionedUserIds]);

  // Synthetic assignment comment
  const assignmentComment = project?.assignedAt ? {
    id: "assignment-sys",
    isSystem: true,
    content: `${project.assignedBy?.email || 'System'} assigned this project to ${project.claimedBy?.email || 'an engineer'}.`,
    createdAt: project.assignedAt,
    user: project.assignedBy
  } : null;

  const allComments = assignmentComment ? [assignmentComment, ...comments] : comments;
  const finalDisplayed = isHistoryExpanded ? allComments : allComments.slice(-10);

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

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* Comment History */}
      <div className="space-y-4">
        {allComments.length > 10 && !isHistoryExpanded && (
          <button 
            onClick={() => setIsHistoryExpanded(true)}
            className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#1C3384] transition-colors flex items-center gap-2 mx-auto"
          >
            <ChevronDown size={12} /> Show earlier comments ({allComments.length - 10})
          </button>
        )}

        <div className="space-y-4">
          {finalDisplayed.map((comment) => (
            <div key={comment.id} className={cn(
                "p-4 rounded-2xl flex flex-col gap-2 transition-all hover:shadow-sm",
                comment.isHandoff ? "bg-amber-50 border border-amber-100" : 
                comment.isSystem ? "bg-blue-50 border border-blue-100" :
                "bg-slate-50 border border-slate-100"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5 border border-white shadow-sm">
                            <AvatarFallback className="text-[8px] font-black bg-slate-200">
                                {comment.user?.email?.slice(0, 1).toUpperCase() || "S"}
                            </AvatarFallback>
                        </Avatar>
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{comment.user?.email || 'System'}</span>
                        <span className="text-[9px] text-slate-400 font-bold">•</span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                    {comment.isHandoff && <ArrowRight size={14} className="text-amber-500" />}
                </div>

                <p className={cn(
                    "text-xs leading-relaxed",
                    comment.isSystem ? "text-blue-700 font-black italic" : "text-slate-600 font-medium"
                )}>
                    {comment.content}
                </p>

                {comment.isHandoff && comment.handoffToUserId && (
                    <div className="flex items-center gap-2 mt-1">
                         <Badge className="bg-amber-100 text-amber-700 border-none text-[8px] font-black uppercase tracking-widest px-2 py-0.5">
                            Handed off to: {teamMembers.find(m => m.id === comment.handoffToUserId)?.email || 'Engineer'}
                         </Badge>
                    </div>
                )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="flex flex-col gap-3">
        <div className="bg-white rounded-[1.5rem] border border-slate-100 shadow-sm p-5 space-y-4 relative">
          
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
                {filteredMembers.length > 0 ? (
                    filteredMembers.map((member, idx) => (
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

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyUp={handleKeyUp}
              onKeyDown={handleKeyDown}
              placeholder="Add a note... type @ to mention or hand off to a colleague"
              className="min-h-[120px] border-none focus-visible:ring-0 text-sm font-medium text-slate-700 placeholder:text-slate-300 resize-none p-0 leading-relaxed custom-scrollbar"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <div className="flex items-center gap-4">
               {mentionedUserIds.length === 1 && (
                  <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                      <Switch 
                          id="handoff-toggle" 
                          checked={isHandoff} 
                          onCheckedChange={setIsHandoff} 
                      />
                      <Label htmlFor="handoff-toggle" className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:text-amber-600 transition-colors">
                          Hand off to {handoffTarget?.email?.split('@')[0]}?
                      </Label>
                  </div>
               )}
            </div>

            <Button 
              onClick={handlePost} 
              disabled={!content.trim() || isLoading}
              className={cn(
                  "h-10 px-6 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 shadow-lg transition-all active:scale-95",
                  isHandoff ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20" : "bg-[#1C3384] hover:bg-blue-800 text-white shadow-blue-900/20"
              )}
            >
              {isLoading ? <Clock className="animate-spin h-4 w-4" /> : isHandoff ? <ArrowRight size={14} /> : <Send size={14} />}
              {isHandoff ? "Confirm Handoff" : "Post Note"}
            </Button>
          </div>
        </div>

        {/* Mentioned User Chips BELOW textarea */}
        {mentionedUsers.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
                {mentionedUsers.map(user => (
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

        {isHandoff && mentionedUserIds.length === 1 && (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} className="text-amber-500 shrink-0" />
                <p className="text-[10px] font-bold text-amber-700 leading-tight">
                    Turning this on will transfer project ownership to <span className="font-black underline">{handoffTarget?.email}</span>. You will be removed from this project.
                </p>
            </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmHandoff} onOpenChange={setShowConfirmHandoff}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
          <DialogHeader className="space-y-4">
            <DialogTitle className="text-2xl font-black text-[#1C3384] uppercase tracking-tight">Confirm Project Handoff</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 leading-relaxed">
              Are you sure you want to hand off this project to <span className="font-black text-slate-700">{handoffTarget?.email}</span>? 
              This action will transfer complete ownership and remove it from your active desk.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-100 p-5 rounded-[1.5rem] flex items-start gap-4 my-6 shadow-inner">
             <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
             <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-amber-700 tracking-widest opacity-60">Handoff Note:</p>
                <p className="text-xs font-medium text-amber-800 italic leading-relaxed">"{content}"</p>
             </div>
          </div>
          <DialogFooter className="gap-3 sm:gap-0 mt-2">
            <Button variant="ghost" onClick={() => setShowConfirmHandoff(false)} className="h-12 rounded-xl font-black uppercase tracking-widest text-[11px] px-8">Cancel</Button>
            <Button 
                onClick={executePost} 
                className="h-12 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black uppercase tracking-widest text-[11px] px-10 shadow-lg shadow-amber-500/20"
            >
                Confirm & Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("px-2 py-0.5 rounded text-[8px] font-black uppercase", className)}>
            {children}
        </span>
    );
}
