export const mockSession = {
  session: {
    id: "session-123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    userId: "user-123",
    expiresAt: new Date("2025-01-01"),
    token: "test-token",
  },
  user: {
    id: "user-123",
    email: "test@example.com",
    name: "Test User",
    emailVerified: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
}
