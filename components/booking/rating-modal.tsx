"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslate } from "@/hooks/use-translate"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface RatingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (rating: number) => void
}

export function RatingModal({ open, onOpenChange, onSubmit }: RatingModalProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { t } = useTranslate()

  const handleSubmit = async () => {
    if (rating === 0) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    onSubmit(rating)
    setRating(0)
    setHoveredRating(0)
    setIsSubmitting(false)
  }

  const displayRating = hoveredRating || rating

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl">{t("rating.title")}</DialogTitle>
          <DialogDescription>{t("rating.description")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-6">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="rounded-lg p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <Star
                  className={`h-10 w-10 transition-colors ${
                    star <= displayRating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-muted text-muted"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {displayRating === 0 && t("rating.selectRating")}
            {displayRating === 1 && t("rating.poor")}
            {displayRating === 2 && t("rating.fair")}
            {displayRating === 3 && t("rating.good")}
            {displayRating === 4 && t("rating.veryGood")}
            {displayRating === 5 && t("rating.excellent")}
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? t("rating.submitting") : t("rating.submit")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
