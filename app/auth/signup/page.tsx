import { redirect } from "next/navigation"
import { AUTH_ROUTES } from "@/lib/auth/routes"

export default function SignUpPage() {
  redirect(AUTH_ROUTES.signUp.player)
}
