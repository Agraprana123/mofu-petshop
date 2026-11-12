import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white py-2 pl-3.5 text-sm text-zinc-900 shadow-xs transition-all duration-150 hover:border-zinc-300 focus:border-[#87482D] focus:outline-none focus:ring-4 focus:ring-[#87482D]/12 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

export { Select };
