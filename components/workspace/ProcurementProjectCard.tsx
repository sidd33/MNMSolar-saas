"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { getProcurementProjectDetail } from "@/lib/actions/procurement";
import { BOMStockCard } from "./BOMStockCard";
import { PurchaseOrderCard } from "./PurchaseOrderCard";
import { DispatchMRNCard } from "./DispatchMRNCard";

const Project360Modal = dynamic(() => import("@/components/dashboard/Project360Modal").then(mod => mod.Project360Modal), { ssr: false });

interface ProcurementProjectCardProps {
  project: any;
  view: "BOM_REVIEW" | "PO_GENERATION" | "DISPATCH";
  onActionComplete?: () => void;
}

export function ProcurementProjectCard({ project, view, onActionComplete }: ProcurementProjectCardProps) {
  const [files, setFiles] = useState<any[]>(project.projectFiles || []);
  const [isLoadingDetails, setIsLoadingDetails] = useState((!project.projectFiles || project.projectFiles.length === 0));
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (isLoadingDetails) {
      getProcurementProjectDetail(project.id).then(data => {
        if (data) {
          setFiles(data.projectFiles || []);
        }
      }).finally(() => setIsLoadingDetails(false));
    }
  }, [project.id, isLoadingDetails]);

  const renderCard = () => {
    switch (view) {
      case "BOM_REVIEW":
        return <BOMStockCard project={project} initialFiles={files} />;
      case "PO_GENERATION":
        return <PurchaseOrderCard project={project} initialFiles={files} />;
      case "DISPATCH":
        return <DispatchMRNCard project={project} initialFiles={files} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* 
        Wrap the card in a div to attach the click handler for the 360 modal 
        without breaking the individual forms inside the specialized cards.
      */}
      <div className="relative group h-full">
        <div 
           className="absolute top-4 right-4 z-10 p-2 bg-white/50 backdrop-blur-sm rounded-full shadow-sm cursor-pointer hover:bg-white transition-all opacity-0 group-hover:opacity-100"
           onClick={() => setModalOpen(true)}
           title="View Project 360"
        >
           <span className="text-xs font-bold text-slate-500">360°</span>
        </div>
        {renderCard()}
      </div>

      <Project360Modal 
        project={project} 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
      />
    </>
  );
}
