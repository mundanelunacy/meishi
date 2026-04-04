import type * as React from "react";
import { cn } from "../lib/utils";

export function Alert({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/80 bg-background/70 p-4 text-sm text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
