export const mockUserId = "507f1f77bcf86cd799439021"

export const mockSession = {
  session: {
    id: "session-123",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    userId: mockUserId,
    expiresAt: new Date("2025-01-01"),
    token: "test-token",
  },
  user: {
    id: mockUserId,
    email: "test@example.com",
    name: "Test User",
    emailVerified: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
}
