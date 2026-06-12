import React from 'react'
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--error-bg": "#fef2f2",
          "--error-text": "#dc2626",
          "--error-border": "#fecaca",
          "--warning-bg": "#fef2f2",
          "--warning-text": "#dc2626",
          "--warning-border": "#fecaca",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
          title: "font-bold text-inherit",
          description: "font-bold text-inherit",
          warning: "text-red-600 font-bold border border-red-200 bg-red-50",
          error: "text-red-600 font-bold border border-red-200 bg-red-50",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
