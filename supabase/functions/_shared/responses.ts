// Shared response utilities for Supabase Edge Functions
// Provides standardized error and success response formats

export interface ErrorResponse {
  error: string
  message: string
  details?: string
  metadata?: Record<string, unknown>
}

export interface SuccessResponse<T = unknown> {
  data: T
  metadata?: Record<string, unknown>
}

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_STATE: 'INVALID_STATE',
  INVALID_DURATION: 'INVALID_DURATION',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
};

export function jsonResponse(data: unknown, status: number): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    },
  );
}

export function errorResponse(
  code: ErrorCode | string,
  message: string,
  status: number,
  details?: string,
  metadata?: Record<string, unknown>,
): Response {
  const errorData: ErrorResponse = {
    error: code,
    message,
    ...(details && { details }),
    ...(metadata && { metadata }),
  };

  return jsonResponse(errorData, status);
}

export function successResponse<T>(
  data: T,
  status: number = 200,
  metadata?: Record<string, unknown>,
): Response {
  if (metadata) {
    const responseData: SuccessResponse<T> = { data, metadata };
    return jsonResponse(responseData, status);
  }
  return jsonResponse(data, status);
}
