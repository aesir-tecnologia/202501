import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  wrapSupabaseResponse,
  SupabaseApiError,
  signInWithEmail,
  signUpWithEmail,
  signOut,
  resetPassword,
  safeQuery,
  createRealtimeSubscription,
  isAuthenticated,
  getUserRole,
  uploadFile,
  getPublicUrl,
  paginatedQuery,
} from '~/utils/supabase'
import type { TypedSupabaseClient } from '~/utils/supabase'

// Mock Supabase client
const createMockSupabaseClient = () => ({
  auth: {
    signInWithPassword: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
  storage: {
    from: vi.fn(() => ({
      upload: vi.fn(),
      getPublicUrl: vi.fn(),
    })),
  },
  channel: vi.fn(() => ({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn(),
  })),
}) as unknown as TypedSupabaseClient

describe('Supabase Utilities', () => {
  let mockClient: TypedSupabaseClient

  beforeEach(() => {
    mockClient = createMockSupabaseClient()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('SupabaseApiError', () => {
    it('should create error with message, code, and details', () => {
      const errorData = {
        message: 'Test error',
        code: 'TEST_ERROR',
        details: 'Detailed error information',
      }

      const error = new SupabaseApiError(errorData)

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.details).toBe('Detailed error information')
      expect(error.name).toBe('SupabaseApiError')
    })

    it('should create error with only message', () => {
      const errorData = {
        message: 'Simple error',
      }

      const error = new SupabaseApiError(errorData)

      expect(error.message).toBe('Simple error')
      expect(error.code).toBeUndefined()
      expect(error.details).toBeUndefined()
    })
  })

  describe('wrapSupabaseResponse', () => {
    it('should wrap successful response', () => {
      const testData = { id: '123', name: 'Test' }
      const result = wrapSupabaseResponse(testData, null)

      expect(result).toEqual({
        data: testData,
        error: null,
        success: true,
      })
    })

    it('should wrap error response with full error object', () => {
      const error = {
        message: 'Database error',
        code: 'DB_ERROR',
        details: 'Connection failed',
      }

      const result = wrapSupabaseResponse(null, error)

      expect(result).toEqual({
        data: null,
        error: {
          message: 'Database error',
          code: 'DB_ERROR',
          details: 'Connection failed',
        },
        success: false,
      })
    })

    it('should handle error with missing properties', () => {
      const error = { message: 'Simple error' }
      const result = wrapSupabaseResponse(null, error)

      expect(result).toEqual({
        data: null,
        error: {
          message: 'Simple error',
          code: undefined,
          details: undefined,
        },
        success: false,
      })
    })

    it('should handle error with no message', () => {
      const error = { code: 'UNKNOWN' }
      const result = wrapSupabaseResponse(null, error)

      expect(result.error?.message).toBe('An unknown error occurred')
      expect(result.success).toBe(false)
    })
  })

  describe('Authentication helpers', () => {
    describe('signInWithEmail', () => {
      it('should sign in successfully', async () => {
        const mockAuthData = {
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token123' },
        }

        vi.mocked(mockClient.auth.signInWithPassword).mockResolvedValue({
          data: mockAuthData,
          error: null,
        })

        const result = await signInWithEmail(mockClient, 'test@example.com', 'password123')

        expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        })
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockAuthData)
        expect(result.error).toBeNull()
      })

      it('should handle sign in error', async () => {
        const mockError = { message: 'Invalid credentials' }

        vi.mocked(mockClient.auth.signInWithPassword).mockResolvedValue({
          data: null,
          error: mockError,
        })

        const result = await signInWithEmail(mockClient, 'test@example.com', 'wrong-password')

        expect(result.success).toBe(false)
        expect(result.data).toBeNull()
        expect(result.error?.message).toBe('Invalid credentials')
      })
    })

    describe('signUpWithEmail', () => {
      it('should sign up successfully', async () => {
        const mockAuthData = {
          user: { id: '123', email: 'test@example.com' },
          session: { access_token: 'token123' },
        }

        vi.mocked(mockClient.auth.signUp).mockResolvedValue({
          data: mockAuthData,
          error: null,
        })

        const result = await signUpWithEmail(
          mockClient,
          'test@example.com',
          'password123',
          { emailRedirectTo: 'https://example.com/callback' },
        )

        expect(mockClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            emailRedirectTo: 'https://example.com/callback',
          },
        })
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockAuthData)
      })

      it('should sign up without redirect options', async () => {
        vi.mocked(mockClient.auth.signUp).mockResolvedValue({
          data: { user: null, session: null },
          error: null,
        })

        await signUpWithEmail(mockClient, 'test@example.com', 'password123')

        expect(mockClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            emailRedirectTo: undefined,
          },
        })
      })
    })

    describe('signOut', () => {
      it('should sign out successfully', async () => {
        vi.mocked(mockClient.auth.signOut).mockResolvedValue({ error: null })

        const result = await signOut(mockClient)

        expect(mockClient.auth.signOut).toHaveBeenCalled()
        expect(result.success).toBe(true)
        expect(result.data).toBeNull()
        expect(result.error).toBeNull()
      })

      it('should handle sign out error', async () => {
        const mockError = { message: 'Sign out failed' }
        vi.mocked(mockClient.auth.signOut).mockResolvedValue({ error: mockError })

        const result = await signOut(mockClient)

        expect(result.success).toBe(false)
        expect(result.error?.message).toBe('Sign out failed')
      })
    })

    describe('resetPassword', () => {
      it('should reset password successfully', async () => {
        vi.mocked(mockClient.auth.resetPasswordForEmail).mockResolvedValue({ error: null })

        const result = await resetPassword(
          mockClient,
          'test@example.com',
          'https://example.com/reset',
        )

        expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          { redirectTo: 'https://example.com/reset' },
        )
        expect(result.success).toBe(true)
      })

      it('should reset password without redirect', async () => {
        vi.mocked(mockClient.auth.resetPasswordForEmail).mockResolvedValue({ error: null })

        await resetPassword(mockClient, 'test@example.com')

        expect(mockClient.auth.resetPasswordForEmail).toHaveBeenCalledWith(
          'test@example.com',
          { redirectTo: undefined },
        )
      })
    })
  })

  describe('Database query helpers', () => {
    describe('safeQuery', () => {
      it('should execute query successfully', async () => {
        const mockData = { id: '123', name: 'Test' }
        const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null })

        const result = await safeQuery(queryFn)

        expect(queryFn).toHaveBeenCalled()
        expect(result.success).toBe(true)
        expect(result.data).toEqual(mockData)
        expect(result.error).toBeNull()
      })

      it('should handle query error from Supabase', async () => {
        const mockError = { message: 'Query failed' }
        const queryFn = vi.fn().mockResolvedValue({ data: null, error: mockError })

        const result = await safeQuery(queryFn)

        expect(result.success).toBe(false)
        expect(result.data).toBeNull()
        expect(result.error?.message).toBe('Query failed')
      })

      it('should handle query function exception', async () => {
        const queryFn = vi.fn().mockRejectedValue(new Error('Network error'))

        const result = await safeQuery(queryFn)

        expect(result.success).toBe(false)
        expect(result.data).toBeNull()
        expect(result.error?.message).toBe('Network error')
      })
    })

    describe('paginatedQuery', () => {
      it('should execute paginated query successfully', async () => {
        const mockData = [
          { id: '1', name: 'Item 1' },
          { id: '2', name: 'Item 2' },
        ]
        const mockCount = 10

        const mockQueryBuilder = {
          range: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
        }

        // Mock the final query result
        Object.assign(mockQueryBuilder, {
          data: mockData,
          error: null,
          count: mockCount,
        })

        const options = {
          page: 1,
          limit: 2,
          sortBy: 'created_at',
          sortOrder: 'desc' as const,
        }

        const result = await paginatedQuery(mockQueryBuilder, options)

        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 1)
        expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
        expect(result.success).toBe(true)
        expect(result.data?.data).toEqual(mockData)
        expect(result.data?.count).toBe(mockCount)
        expect(result.data?.page).toBe(1)
        expect(result.data?.limit).toBe(2)
        expect(result.data?.hasMore).toBe(true)
      })

      it('should handle pagination without sorting', async () => {
        const mockData = [{ id: '1', name: 'Item 1' }]
        const mockQueryBuilder = {
          range: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          data: mockData,
          error: null,
          count: 1,
        }

        const options = { page: 1, limit: 10 }
        const result = await paginatedQuery(mockQueryBuilder, options)

        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9)
        expect(mockQueryBuilder.order).not.toHaveBeenCalled()
        expect(result.data?.hasMore).toBe(false)
      })

      it('should calculate pagination correctly for different pages', async () => {
        const mockQueryBuilder = {
          range: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          data: [],
          error: null,
          count: 25,
        }

        // Test page 3 with limit 5
        await paginatedQuery(mockQueryBuilder, { page: 3, limit: 5 })
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(10, 14) // (3-1)*5 = 10, 10+5-1 = 14
      })
    })
  })

  describe('Real-time subscription helper', () => {
    it('should create subscription with default options', () => {
      const mockCallback = vi.fn()
      const mockSubscription = { unsubscribe: vi.fn() }

      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue(mockSubscription),
      }

      vi.mocked(mockClient.channel).mockReturnValue(mockChannel as ReturnType<typeof mockClient.channel>)

      const result = createRealtimeSubscription(mockClient, 'projects', mockCallback)

      expect(mockClient.channel).toHaveBeenCalledWith('projects_changes')
      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: undefined,
        },
        mockCallback,
      )
      expect(mockChannel.subscribe).toHaveBeenCalled()
      expect(result).toBe(mockSubscription)
    })

    it('should create subscription with custom options', () => {
      const mockCallback = vi.fn()
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn(),
      }

      vi.mocked(mockClient.channel).mockReturnValue(mockChannel as ReturnType<typeof mockClient.channel>)

      const options = {
        event: 'UPDATE' as const,
        schema: 'custom',
        filter: 'user_id=eq.123',
      }

      createRealtimeSubscription(mockClient, 'stints', mockCallback, options)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'custom',
          table: 'stints',
          filter: 'user_id=eq.123',
        },
        mockCallback,
      )
    })
  })

  describe('Utility functions', () => {
    describe('isAuthenticated', () => {
      it('should return true for authenticated user', () => {
        expect(isAuthenticated({ id: '123' })).toBe(true)
      })

      it('should return false for null user', () => {
        expect(isAuthenticated(null)).toBe(false)
      })

      it('should return false for user without id', () => {
        expect(isAuthenticated({})).toBe(false)
      })

      it('should return false for user with empty id', () => {
        expect(isAuthenticated({ id: '' })).toBe(false)
      })
    })

    describe('getUserRole', () => {
      it('should return role from user_metadata', () => {
        const user = {
          user_metadata: { role: 'admin' },
        }
        expect(getUserRole(user)).toBe('admin')
      })

      it('should return role from app_metadata if user_metadata not available', () => {
        const user = {
          app_metadata: { role: 'moderator' },
        }
        expect(getUserRole(user)).toBe('moderator')
      })

      it('should prefer user_metadata over app_metadata', () => {
        const user = {
          user_metadata: { role: 'admin' },
          app_metadata: { role: 'user' },
        }
        expect(getUserRole(user)).toBe('admin')
      })

      it('should return null for user without role', () => {
        const user = {
          user_metadata: {},
          app_metadata: {},
        }
        expect(getUserRole(user)).toBeNull()
      })

      it('should return null for null user', () => {
        expect(getUserRole(null)).toBeNull()
      })
    })
  })

  describe('File storage helpers', () => {
    describe('uploadFile', () => {
      it('should upload file successfully', async () => {
        const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
        const mockUploadResult = {
          data: {
            path: 'uploads/test.txt',
            fullPath: 'bucket/uploads/test.txt',
          },
          error: null,
        }

        const mockStorage = {
          upload: vi.fn().mockResolvedValue(mockUploadResult),
        }

        vi.mocked(mockClient.storage.from).mockReturnValue(mockStorage as ReturnType<typeof mockClient.storage.from>)

        const result = await uploadFile(
          mockClient,
          'avatars',
          'uploads/test.txt',
          mockFile,
          {
            cacheControl: '7200',
            contentType: 'text/plain',
            upsert: true,
          },
        )

        expect(mockClient.storage.from).toHaveBeenCalledWith('avatars')
        expect(mockStorage.upload).toHaveBeenCalledWith(
          'uploads/test.txt',
          mockFile,
          {
            cacheControl: '7200',
            contentType: 'text/plain',
            upsert: true,
          },
        )
        expect(result.success).toBe(true)
        expect(result.data).toEqual({
          path: 'uploads/test.txt',
          fullPath: 'bucket/uploads/test.txt',
        })
      })

      it('should use default options when not provided', async () => {
        const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
        const mockStorage = {
          upload: vi.fn().mockResolvedValue({ data: { path: 'test', fullPath: 'test' }, error: null }),
        }

        vi.mocked(mockClient.storage.from).mockReturnValue(mockStorage as ReturnType<typeof mockClient.storage.from>)

        await uploadFile(mockClient, 'images', 'test.jpg', mockFile)

        expect(mockStorage.upload).toHaveBeenCalledWith(
          'test.jpg',
          mockFile,
          {
            cacheControl: '3600',
            contentType: 'image/jpeg',
            upsert: false,
          },
        )
      })

      it('should handle upload error', async () => {
        const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' })
        const mockError = { message: 'Upload failed' }
        const mockStorage = {
          upload: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        }

        vi.mocked(mockClient.storage.from).mockReturnValue(mockStorage as ReturnType<typeof mockClient.storage.from>)

        const result = await uploadFile(mockClient, 'files', 'test.txt', mockFile)

        expect(result.success).toBe(false)
        expect(result.error?.message).toBe('Upload failed')
      })
    })

    describe('getPublicUrl', () => {
      it('should get public URL', () => {
        const mockPublicUrl = 'https://example.com/bucket/path/file.jpg'
        const mockStorage = {
          getPublicUrl: vi.fn().mockReturnValue({
            data: { publicUrl: mockPublicUrl },
          }),
        }

        vi.mocked(mockClient.storage.from).mockReturnValue(mockStorage as ReturnType<typeof mockClient.storage.from>)

        const result = getPublicUrl(mockClient, 'images', 'path/file.jpg')

        expect(mockClient.storage.from).toHaveBeenCalledWith('images')
        expect(mockStorage.getPublicUrl).toHaveBeenCalledWith('path/file.jpg')
        expect(result).toBe(mockPublicUrl)
      })
    })
  })
})
