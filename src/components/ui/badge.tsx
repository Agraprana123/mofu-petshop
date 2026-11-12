import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none transition-colors",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-600",
        success: "bg-emerald-50 text-emerald-700",
        warning: "bg-[#87482D]/10 text-[#87482D]",
        danger: "bg-red-50 text-red-700",
        info: "bg-sky-50 text-sky-700",
        outline: "border border-zinc-200 bg-white text-zinc-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
