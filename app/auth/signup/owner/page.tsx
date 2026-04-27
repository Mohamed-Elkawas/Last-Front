import { redirect } from "next/navigation"
import { AUTH_ROUTES } from "@/lib/auth/routes"

export default function OwnerSignUpPage() {
  redirect(AUTH_ROUTES.ownerRegister)
}
