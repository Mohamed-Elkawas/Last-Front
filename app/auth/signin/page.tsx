import { redirect } from "next/navigation"
import { AUTH_ROUTES } from "@/lib/auth/routes"

export default function SignInPage() {
  redirect(AUTH_ROUTES.signIn.player)
}
