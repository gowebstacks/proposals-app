import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border border-gray-800 bg-black/50 text-white",
        secondary:
          "border border-gray-800 bg-white/10 text-gray-300",
        destructive:
          "border border-gray-800 bg-black/50 text-white",
        outline: "border border-gray-800 text-gray-300 bg-transparent",
        success:
          "border border-gray-800 bg-black/50 text-white",
        warning:
          "border border-gray-800 bg-black/50 text-white",
        info:
          "border border-gray-800 bg-black/50 text-white",
        accent:
          "border border-blue-500/50 bg-blue-600/20 text-blue-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
