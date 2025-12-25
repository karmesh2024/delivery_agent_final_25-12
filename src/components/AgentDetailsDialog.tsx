"use client";

import { Agent } from "@/types";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentDetail } from "./AgentDetail";
import { useEffect } from "react";

interface AgentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent | null;
}

export function AgentDetailsDialog({
  open,
  onOpenChange,
  agent
}: AgentDetailsDialogProps) {
  
  useEffect(() => {
    if (agent) {
      console.log("AgentDetailsDialog - agent present:", agent.id, agent.name);
      console.log("Dialog open state:", open);
    }
  }, [agent, open]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          style={{ backdropFilter: 'blur(4px)' }}
        />
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-[10000] grid w-full max-w-3xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-gray-200 bg-white dark:bg-gray-800 p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          {agent ? (
            <>
              <div className="flex flex-col space-y-1.5 text-center sm:text-right">
                <DialogPrimitive.Title className="text-lg font-semibold leading-none tracking-tight">
                  تفاصيل المندوب {agent.name}
                </DialogPrimitive.Title>
                <DialogPrimitive.Description className="text-sm text-muted-foreground">
                  هذا المربع يعرض معلومات مفصلة عن مندوب التوصيل
                </DialogPrimitive.Description>
              </div>
              
              <AgentDetail 
                agent={agent} 
                onClose={() => onOpenChange(false)} 
              />
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 sm:rtl:space-x-reverse mt-6">
                {/* يمكن إضافة أزرار إضافية هنا */}
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">جاري تحميل البيانات...</p>
            </div>
          )}
          
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default AgentDetailsDialog; 