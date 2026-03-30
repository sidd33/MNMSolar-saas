"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tooltip({ children, content, enabled = true }: { children: React.ReactNode, content: React.ReactNode, enabled?: boolean }) {
  const [show, setShow] = React.useState(false);

  if (!enabled) return <>{children}</>;

  return (
    <div className="relative inline-block w-full" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 text-white text-[10px] font-bold rounded-lg shadow-xl z-50 text-center animate-in fade-in slide-in-from-bottom-1">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900" />
        </div>
      )}
    </div>
  );
}
