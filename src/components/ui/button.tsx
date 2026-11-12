import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#87482D]/15 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[#87482D] text-white shadow-md shadow-[#87482D]/20 hover:bg-[#6d3a24] hover:shadow-lg hover:shadow-[#87482D]/25",
        destructive:
          "bg-red-600 text-white shadow-md shadow-red-600/20 hover:bg-red-700",
        outline:
          "border border-zinc-200 bg-white text-zinc-700 shadow-xs hover:border-zinc-300 hover:bg-zinc-50",
        secondary:
          "bg-[#87482D]/8 text-[#87482D] hover:bg-[#87482D]/12",
        ghost: "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
        link: "text-[#87482D] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-6 text-[15px]",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
