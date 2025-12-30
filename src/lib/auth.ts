import { betterAuth } from "better-auth"
import { mongodbAdapter } from "better-auth/adapters/mongodb"
import { MongoClient } from "mongodb"
import { Resend } from "resend"

const client = new MongoClient(process.env.MONGODB_URI!)
const resend = new Resend(process.env.RESEND_API_KEY)

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  trustedOrigins: process.env.TRUSTED_ORIGINS?.split(",") ?? [],
  database: mongodbAdapter(client.db(process.env.MONGODB_DB), { client }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.EMAIL_FROM!,
        to: user.email,
        subject: "Reset your Watched password",
        html: `
          <h2>Reset Your Password</h2>
          <p>Click the link below to reset your password. This link expires in 1 hour.</p>
          <a href="${url}">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
        `,
      })
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
})

export type Session = typeof auth.$Infer.Session
