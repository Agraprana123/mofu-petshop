import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm text-zinc-900 shadow-xs transition-all duration-150 placeholder:text-zinc-400 hover:border-zinc-300 focus:border-[#87482D] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#87482D]/12 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:opacity-60",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
