-- Migration: Create deletion audit log table and helper functions
-- Supports: Account deletion feature (GDPR/compliance audit trail)
--
-- This migration creates:
-- 1. deletion_audit_log table (RLS enabled, no policies = no direct access)
-- 2. generate_anonymized_user_ref() - Returns SHA-256 hex of user ID
-- 3. log_deletion_event() - SECURITY DEFINER function for inserting audit entries

-- ============================================================================
-- Table: deletion_audit_log
-- ============================================================================

CREATE TABLE public.deletion_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('request', 'cancel', 'complete')),
  anonymized_user_ref TEXT NOT NULL,
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT NULL
);

ALTER TABLE public.deletion_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Indexes for compliance queries
-- ============================================================================

CREATE INDEX idx_deletion_audit_anonymized_ref
ON public.deletion_audit_log (anonymized_user_ref);

CREATE INDEX idx_deletion_audit_timestamp
ON public.deletion_audit_log (event_timestamp);

-- ============================================================================
-- Function: generate_anonymized_user_ref
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_anonymized_user_ref(user_id UUID)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(sha256(user_id::text::bytea), 'hex')
$$;

-- ============================================================================
-- Function: log_deletion_event
-- ============================================================================

CREATE OR REPLACE FUNCTION log_deletion_event(
  p_user_id UUID,
  p_event_type TEXT,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.deletion_audit_log (
    event_type,
    anonymized_user_ref,
    metadata
  ) VALUES (
    p_event_type,
    public.generate_anonymized_user_ref(p_user_id),
    p_metadata
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- ============================================================================
-- Permissions
-- ============================================================================

GRANT EXECUTE ON FUNCTION log_deletion_event TO authenticated;
