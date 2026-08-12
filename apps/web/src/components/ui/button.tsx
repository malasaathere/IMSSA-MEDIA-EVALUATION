import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex min-w-0 items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-white shadow-[0_7px_16px_rgba(7,135,126,.18)] hover:bg-primary-hover": variant === "default",
            "bg-red-600 text-white hover:bg-red-700": variant === "destructive",
            "border border-border bg-white text-navy-950 hover:bg-surface-selected": variant === "outline",
            "bg-surface-selected text-navy-950 hover:bg-surface-selected/80": variant === "secondary",
            "hover:bg-surface-selected hover:text-navy-950": variant === "ghost",
            "text-navy-950 underline-offset-4 hover:underline": variant === "link",
            "h-11 px-4 py-2": size === "default",
            "h-9 rounded-xl px-3": size === "sm",
            "h-12 rounded-xl px-8": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
