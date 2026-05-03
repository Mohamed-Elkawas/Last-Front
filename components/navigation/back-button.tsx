"use client"

import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

type BackButtonProps = {
  label?: string
  fallbackHref?: string
  className?: string
  variant?: "default" | "ghost" | "outline" | "secondary"
}

export function BackButton({
  label = "رجوع",
  fallbackHref = "/",
  className,
  variant = "ghost",
}: BackButtonProps) {
  const router = useRouter()

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
      return
    }

    router.push(fallbackHref)
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className ?? "gap-2"}
      onClick={handleBack}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  )
}