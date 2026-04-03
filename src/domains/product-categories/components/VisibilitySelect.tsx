"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import type { VisibilityOption } from "@/types";

const VISIBILITY_OPTIONS: { value: VisibilityOption; label: string }[] = [
  { value: "pending", label: "تحت الانتظار" },
  { value: "client_only", label: "تطبيق العميل فقط" },
  { value: "agent_only", label: "تطبيق الوكيل فقط" },
  { value: "both", label: "كلا التطبيقين" },
];

function visibilityToOption(
  visibleToClient: boolean,
  visibleToAgent: boolean
): VisibilityOption {
  if (visibleToClient && visibleToAgent) return "both";
  if (visibleToClient) return "client_only";
  if (visibleToAgent) return "agent_only";
  return "pending";
}

function optionToVisibility(
  option: VisibilityOption
): { visible_to_client_app: boolean; visible_to_agent_app: boolean } {
  switch (option) {
    case "both":
      return { visible_to_client_app: true, visible_to_agent_app: true };
    case "client_only":
      return { visible_to_client_app: true, visible_to_agent_app: false };
    case "agent_only":
      return { visible_to_client_app: false, visible_to_agent_app: true };
    default:
      return { visible_to_client_app: false, visible_to_agent_app: false };
  }
}

export interface VisibilitySelectProps {
  visibleToClientApp?: boolean;
  visibleToAgentApp?: boolean;
  onVisibilityChange: (visibility: {
    visible_to_client_app: boolean;
    visible_to_agent_app: boolean;
  }) => void;
  disabled?: boolean;
  className?: string;
}

export function VisibilitySelect({
  visibleToClientApp = false,
  visibleToAgentApp = false,
  onVisibilityChange,
  disabled = false,
  className,
}: VisibilitySelectProps) {
  const value = visibilityToOption(visibleToClientApp, visibleToAgentApp);

  const handleChange = (newValue: string) => {
    const option = newValue as VisibilityOption;
    if (["pending", "client_only", "agent_only", "both"].includes(option)) {
      onVisibilityChange(optionToVisibility(option));
    }
  };

  return (
    <Select value={value} onValueChange={handleChange} disabled={disabled}>
      <SelectTrigger className={className ?? "w-[160px]"}>
        <SelectValue placeholder="الظهور" />
      </SelectTrigger>
      <SelectContent>
        {VISIBILITY_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
