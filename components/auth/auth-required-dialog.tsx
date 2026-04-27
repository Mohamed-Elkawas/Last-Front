"use client"

import { useRouter } from "next/navigation"
import { LogIn, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useTranslate } from "@/hooks/use-translate"
import { AUTH_ROUTES, type AuthAccountType } from "@/lib/auth/routes"
import { usePendingActionStore } from "@/lib/stores/pending-action-store"

export interface AuthRequiredDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cancelHref?: string
  onCancel?: () => void
  accountType?: AuthAccountType
  signUpHref?: string
}

/**
 * Dialog shown when guest user tries to access a protected action.
 * Prompts user to sign in or create an account.
 */
export function AuthRequiredDialog({
  open,
  onOpenChange,
  cancelHref = "/",
  onCancel,
  accountType = "player",
  signUpHref,
}: AuthRequiredDialogProps) {
  const router = useRouter()
  const { t } = useTranslate()
  const clearAction = usePendingActionStore((state) => state.clearAction)

  const handleCancel = () => {
    clearAction()
    onOpenChange(false)
    onCancel?.()
    router.replace(cancelHref)
  }

  const handleSignIn = () => {
    router.push(AUTH_ROUTES.signIn[accountType])
  }

  const handleSignUp = () => {
    router.push(signUpHref ?? AUTH_ROUTES.signUp[accountType])
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleCancel()
          return
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("auth.requiredTitle") || "Sign in required"}</DialogTitle>
          <DialogDescription>
            {t("auth.requiredDescription") || "You need to sign in first to continue"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Button onClick={handleSignIn} size="lg" className="w-full gap-2">
            <LogIn className="h-4 w-4" />
            {t("auth.signIn") || "Sign in"}
          </Button>

          <Button onClick={handleSignUp} variant="outline" size="lg" className="w-full gap-2">
            <UserPlus className="h-4 w-4" />
            {t("auth.createAccount") || "Create account"}
          </Button>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          {t("auth.requiredFootnote") || "Creating an account takes less than a minute"}
        </div>
      </DialogContent>
    </Dialog>
  )
}
