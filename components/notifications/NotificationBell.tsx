"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, CheckCircle2, Circle } from "lucide-react";
import { usePipelineNexus } from "@/components/dashboard/DashboardNexusProvider";
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

export function NotificationBell() {
  const { notifications, unreadCount } = usePipelineNexus();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      toast.success("All notifications marked as read");
    } catch (err) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const { role, department } = usePipelineNexus();

  const handleNotificationClick = async (notif: any) => {
    if (!notif.isRead) {
      await markNotificationRead(notif.id);
    }
    setIsOpen(false);
    
    // Navigate based on department
    if (department === 'SALES') {
      router.push('/dashboard/sales/leads');
    } else if (department === 'ENGINEERING') {
      router.push('/dashboard/engineering');
    } else if (department === 'EXECUTION') {
      router.push('/dashboard/execution');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors group"
      >
        <Bell size={20} className="text-slate-500 group-hover:text-[#1C3384]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[100]">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-black uppercase tracking-widest text-[#1C3384] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs font-medium text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    "p-4 border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors flex gap-3 items-start",
                    !notif.isRead && "bg-blue-50/30"
                  )}
                >
                  <div className="mt-1">
                    {!notif.isRead ? (
                      <Circle size={10} className="fill-blue-500 text-blue-500" />
                    ) : (
                      <CheckCircle2 size={10} className="text-slate-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "text-xs leading-tight",
                      !notif.isRead ? "font-black text-slate-900" : "font-medium text-slate-500"
                    )}>
                      {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                      {notif.message}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mt-2">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
