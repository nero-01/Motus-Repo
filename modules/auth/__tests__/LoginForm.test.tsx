import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LoginForm } from '../components/LoginForm'
import { useAuthStore } from '../store'

// Mock the auth store
jest.mock('../store', () => ({
  useAuthStore: jest.fn(),
}))

describe('LoginForm', () => {
  const mockLogin = jest.fn()
  const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: null,
      user: null,
      session: null,
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      setUser: jest.fn(),
      setSession: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form fields', () => {
    render(<LoginForm />)
    
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for invalid input', async () => {
    render(<LoginForm />)
    
    const submitButton = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument()
    })
  })

  it('calls login function with valid credentials', async () => {
    render(<LoginForm />)
    
    const emailInput = screen.getByLabelText(/email address/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const submitButton = screen.getByRole('button', { name: /sign in/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })
  })

  it('shows loading state when submitting', () => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      loading: true,
      error: null,
      user: null,
      session: null,
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      setUser: jest.fn(),
      setSession: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
    })

    render(<LoginForm />)
    
    expect(screen.getByRole('button', { name: /signing in/i })).toBeInTheDocument()
  })

  it('displays error message when login fails', () => {
    mockUseAuthStore.mockReturnValue({
      login: mockLogin,
      loading: false,
      error: 'Invalid credentials',
      user: null,
      session: null,
      register: jest.fn(),
      logout: jest.fn(),
      resetPassword: jest.fn(),
      setUser: jest.fn(),
      setSession: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
      clearError: jest.fn(),
    })

    render(<LoginForm />)
    
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
  })
})
