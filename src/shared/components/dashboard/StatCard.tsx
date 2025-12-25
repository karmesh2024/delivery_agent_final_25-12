"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { IconType } from "react-icons";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconType;
  description?: string;
  className?: string;
  iconClassName?: string;
  change?: {
    value: number;
    trend: "up" | "down" | "neutral";
  };
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  className,
  iconClassName,
  change
}: StatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-full", iconClassName)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {change && (
          <div className="flex items-center mt-1">
            <div
              className={cn(
                "text-xs font-medium mr-1",
                change.trend === "up" ? "text-green-500" :
                change.trend === "down" ? "text-red-500" :
                "text-yellow-500"
              )}
            >
              {change.trend === "up" ? "↑" : change.trend === "down" ? "↓" : "•"} {Math.abs(change.value)}%
            </div>
            <div className="text-xs text-muted-foreground">vs last week</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}