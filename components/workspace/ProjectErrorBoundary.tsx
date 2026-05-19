"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ProjectErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Project-level error caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50/30 border border-red-100 rounded-[2rem] flex flex-col items-center justify-center text-center gap-3 min-h-[200px]">
          <div className="h-10 w-10 bg-red-100 text-red-500 rounded-xl flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <div className="space-y-1">
            <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-800">
              {this.props.fallbackTitle || "Project Card Failure"}
            </h4>
            <p className="text-[9px] font-medium text-slate-400 max-w-[200px]">
              This specific project encountered a rendering issue. Other operations are unaffected.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => this.setState({ hasError: false })}
            className="h-8 rounded-full border-red-200 text-red-600 hover:bg-red-50 text-[9px] font-black uppercase tracking-widest"
          >
            <RefreshCcw size={12} className="mr-2" />
            Reload Card
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
