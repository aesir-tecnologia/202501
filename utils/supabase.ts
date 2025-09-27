import type { Database } from '~/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type-safe Supabase client
export type TypedSupabaseClient = SupabaseClient<Database>

// Error handling utilities
export interface SupabaseError {
  message: string
  code?: string
  details?: string
}

export class SupabaseApiError extends Error {
  public code?: string
  public details?: string

  constructor(error: SupabaseError) {
    super(error.message)
    this.name = 'SupabaseApiError'
    this.code = error.code
    this.details = error.details
  }
}

// Generic response wrapper
export interface ApiResponse<T = unknown> {
  data: T | null
  error: SupabaseError | null
  success: boolean
}

// Helper function to wrap Supabase responses
export function wrapSupabaseResponse<T>(
  data: T | null,
  error: unknown,
): ApiResponse<T> {
  if (error) {
    const err = error as { message?: string, code?: string, details?: string }
    return {
      data: null,
      error: {
        message: err.message || 'An unknown error occurred',
        code: err.code,
        details: err.details,
      },
      success: false,
    }
  }

  return {
    data,
    error: null,
    success: true,
  }
}

// Authentication helpers
export async function signInWithEmail(
  client: TypedSupabaseClient,
  email: string,
  password: string,
): Promise<ApiResponse<{ user: { id: string, email: string }, session: { access_token: string } | null }>> {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })

  return wrapSupabaseResponse(data, error)
}

export async function signUpWithEmail(
  client: TypedSupabaseClient,
  email: string,
  password: string,
  options?: { emailRedirectTo?: string },
): Promise<ApiResponse<{ user: { id: string, email: string } | null, session: { access_token: string } | null }>> {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: options?.emailRedirectTo,
    },
  })

  return wrapSupabaseResponse(data, error)
}

export async function signOut(
  client: TypedSupabaseClient,
): Promise<ApiResponse<void>> {
  const { error } = await client.auth.signOut()
  return wrapSupabaseResponse(null, error)
}

export async function resetPassword(
  client: TypedSupabaseClient,
  email: string,
  redirectTo?: string,
): Promise<ApiResponse<void>> {
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo,
  })

  return wrapSupabaseResponse(null, error)
}

// Database query helpers
export async function safeQuery<T>(
  queryFn: () => Promise<{ data: T | null, error: unknown }>,
): Promise<ApiResponse<T>> {
  try {
    const { data, error } = await queryFn()
    return wrapSupabaseResponse(data, error)
  }
  catch (err) {
    return wrapSupabaseResponse(null, err)
  }
}

// Real-time subscription helper
export function createRealtimeSubscription(
  client: TypedSupabaseClient,
  table: string,
  callback: (payload: { eventType: string, new: unknown, old: unknown }) => void,
  options?: {
    event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*'
    schema?: string
    filter?: string
  },
) {
  const subscription = client
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: options?.event || '*',
        schema: options?.schema || 'public',
        table,
        filter: options?.filter,
      },
      callback,
    )
    .subscribe()

  return subscription
}

// Utility to check if user is authenticated
export function isAuthenticated(user: { id?: string } | null): boolean {
  return !!(user && user.id)
}

// Utility to get user role (if stored in user metadata)
export function getUserRole(user: { user_metadata?: { role?: string }, app_metadata?: { role?: string } } | null): string | null {
  return user?.user_metadata?.role || user?.app_metadata?.role || null
}

// File upload helper
export async function uploadFile(
  client: TypedSupabaseClient,
  bucket: string,
  path: string,
  file: File,
  options?: {
    cacheControl?: string
    contentType?: string
    upsert?: boolean
  },
): Promise<ApiResponse<{ path: string, fullPath: string }>> {
  const { data, error } = await client.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: options?.cacheControl || '3600',
      contentType: options?.contentType || file.type,
      upsert: options?.upsert || false,
    })

  if (error) {
    return wrapSupabaseResponse(null, error)
  }

  return wrapSupabaseResponse({
    path: data.path,
    fullPath: data.fullPath,
  }, null)
}

// Get public URL for file
export function getPublicUrl(
  client: TypedSupabaseClient,
  bucket: string,
  path: string,
): string {
  const { data } = client.storage
    .from(bucket)
    .getPublicUrl(path)

  return data.publicUrl
}

// Pagination helper
export interface PaginationOptions {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number | null
  page: number
  limit: number
  hasMore: boolean
}

export async function paginatedQuery<T>(
  queryBuilder: { range: (from: number, to: number) => unknown, order: (column: string, options: { ascending: boolean }) => unknown },
  options: PaginationOptions,
): Promise<ApiResponse<PaginatedResponse<T>>> {
  const { page, limit, sortBy, sortOrder = 'asc' } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = queryBuilder.range(from, to)

  if (sortBy) {
    query = query.order(sortBy, { ascending: sortOrder === 'asc' })
  }

  const { data, error, count } = await query

  if (error) {
    return wrapSupabaseResponse(null, error)
  }

  const paginatedData: PaginatedResponse<T> = {
    data: data || [],
    count,
    page,
    limit,
    hasMore: count ? from + limit < count : false,
  }

  return wrapSupabaseResponse(paginatedData, null)
}
