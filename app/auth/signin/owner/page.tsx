import { Suspense } from "react"
import { SignInPageContent } from "@/components/auth/signin-page-content"
import { Card, CardContent } from "@/components/ui/card"

function OwnerSignInPageContent() {
  return <SignInPageContent accountType="owner" />
}

export default function OwnerSignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <OwnerSignInPageContent />
    </Suspense>
  )
}

function SignInFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
            <div className="h-10 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
