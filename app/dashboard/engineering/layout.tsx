import React from "react";
import { EngineeringNexusProvider } from "@/components/dashboard/EngineeringNexusProvider";

export default function EngineeringLayout({ children }: { children: React.ReactNode }) {
  return (
    <EngineeringNexusProvider>
      {children}
    </EngineeringNexusProvider>
  );
}

