import { redirect } from "next/navigation"
import { AUTH_ROUTES } from "@/lib/auth/routes"

type Props = {
  searchParams: {
    accountType?: string
  }
}

export default function SignUpPage({ searchParams }: Props) {
  const accountType = searchParams?.accountType

  if (accountType === "owner") {
    redirect(AUTH_ROUTES.signUp.owner)
  }

  redirect(AUTH_ROUTES.signUp.player)
}   