"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Trophy, Users, Bell, ArrowRight, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslate } from "@/hooks/use-translate"
import { ClientDirectionShell } from "@/components/layout/client-direction-shell"

export default function OnboardingPage() {
  const router = useRouter()
  const { t } = useTranslate()
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = useMemo(
    () => [
      {
        icon: MapPin,
        title: t("onboarding.slide1Title"),
        description: t("onboarding.slide1Description"),
        color: "bg-primary",
      },
      {
        icon: Trophy,
        title: t("onboarding.slide2Title"),
        description: t("onboarding.slide2Description"),
        color: "bg-primary",
      },
      {
        icon: Users,
        title: t("onboarding.slide3Title"),
        description: t("onboarding.slide3Description"),
        color: "bg-primary",
      },
      {
        icon: Bell,
        title: t("onboarding.slide4Title"),
        description: t("onboarding.slide4Description"),
        color: "bg-primary",
      },
    ],
    [t]
  )

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      router.push("/auth/signup")
    }
  }

  const handleSkip = () => {
    router.push("/auth/signup")
  }

  const handleBack = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const slide = slides[currentSlide]
  const Icon = slide.icon
  const isLastSlide = currentSlide === slides.length - 1

  return (
    <ClientDirectionShell className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg">
        <Card className="overflow-hidden">
          <CardContent className="p-8">
            <div className="mb-8 flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleSkip}>
                {t("onboarding.skip")}
              </Button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className={`flex h-24 w-24 items-center justify-center rounded-full ${slide.color}`}>
                <Icon className="h-12 w-12 text-primary-foreground" />
              </div>

              <h1 className="mt-8 text-3xl font-bold text-foreground">{slide.title}</h1>
              <p className="mt-4 max-w-sm text-lg leading-relaxed text-muted-foreground">{slide.description}</p>
            </div>

            <div className="mt-12 flex items-center justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`${index + 1}`}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentSlide ? "w-8 bg-primary" : "w-2 bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="mt-8 flex gap-4">
              {currentSlide > 0 && (
                <Button variant="outline" className="flex-1 gap-2" onClick={handleBack}>
                  <ArrowLeft className="h-4 w-4 icon-arrow-back" />
                  {t("onboarding.back")}
                </Button>
              )}
              <Button className={`gap-2 ${currentSlide === 0 ? "w-full" : "flex-1"}`} onClick={handleNext}>
                {isLastSlide ? t("onboarding.getStarted") : t("onboarding.next")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ClientDirectionShell>
  )
}
