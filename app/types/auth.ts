export interface User {
  id: string
  email: string
  emailConfirmedAt: string | null
  fullName?: string
  emailNotifications?: boolean
  createdAt: string
}
