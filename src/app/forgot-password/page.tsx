import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Watched account password",
}

const ForgotPasswordPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <ForgotPasswordForm />
    </main>
  )
}

export default ForgotPasswordPage
