export interface User {
  id: string
  email: string | undefined
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface AuthState {
  user: User | null
  session: any | null
  loading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  password: string
  name: string
}

export interface AuthContextType {
  user: User | null
  session: any | null
  loading: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<void>
  register: (credentials: RegisterCredentials) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}
