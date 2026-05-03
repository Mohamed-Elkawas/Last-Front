"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

type LiveSearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function LiveSearchInput({
  value,
  onChange,
  placeholder = "ابحث...",
  className,
}: LiveSearchInputProps) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="ps-10 pe-10"
      />

      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute end-1 top-1/2 h-8 w-8 -translate-y-1/2"
          onClick={() => onChange("")}
        >
          <X className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}   