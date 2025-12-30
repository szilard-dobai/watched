import { Suspense } from "react"
import { ResetPasswordForm } from "@/components/auth/reset-password-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Watched account",
}

const ResetPasswordPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </main>
  )
}

export default ResetPasswordPage
